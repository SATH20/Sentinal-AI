from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import base64
import os
import httpx
import asyncio
import uuid
import boto3
from botocore.config import Config

from google import genai
from google.genai import types

# Initialize Gemini client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Initialize Cloudflare R2 client
r2_client = None
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL", "")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "")

def get_r2_client():
    global r2_client
    if r2_client is None:
        r2_account_id = os.environ.get("R2_ACCOUNT_ID")
        r2_access_key = os.environ.get("R2_ACCESS_KEY_ID")
        r2_secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")
        
        if r2_account_id and r2_access_key and r2_secret_key:
            r2_client = boto3.client(
                's3',
                endpoint_url=f"https://{r2_account_id}.r2.cloudflarestorage.com",
                aws_access_key_id=r2_access_key,
                aws_secret_access_key=r2_secret_key,
                config=Config(signature_version='s3v4'),
                region_name='auto'
            )
    return r2_client

app = FastAPI(title="SentinelAI Backend")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for generated content
generated_content_store = {}


class GenerateRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    content_type: str  # "Post" or "Reel"
    image_data: Optional[str] = None


class ApprovalRequest(BaseModel):
    user_id: str
    session_id: str
    content_id: str
    approved: bool


class GenerateResponse(BaseModel):
    status: str
    content_id: Optional[str] = None
    enhanced_prompt: Optional[str] = None
    generated_media_url: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    error: Optional[str] = None


class PublishResponse(BaseModel):
    status: str
    post_id: Optional[str] = None
    error: Optional[str] = None


# =====================================================
# STEP 1: ENHANCE PROMPT
# =====================================================
async def enhance_prompt(user_prompt: str, content_type: str, image_data: Optional[str] = None) -> str:
    """Use Gemini to enhance the user's prompt based on their text and reference image."""
    
    try:
        contents = []
        
        system_instruction = f"""You are an expert creative director specializing in viral social media content.
Your task is to transform the user's basic idea into a detailed, photorealistic prompt for AI image generation.

CRITICAL REQUIREMENTS FOR HIGH-QUALITY OUTPUT:
1. SUBJECT CLARITY: Clearly describe the main subject, its position, and what it's doing
2. ENVIRONMENT: Describe the setting, background, and atmosphere in detail
3. LIGHTING: Specify exact lighting (golden hour sunlight, soft studio lighting, dramatic rim lighting, natural window light, etc.)
4. CAMERA DETAILS: Include lens type (35mm, 85mm portrait lens, wide-angle), depth of field (shallow bokeh, deep focus), angle (eye-level, low angle, bird's eye)
5. STYLE: Specify photography style (editorial fashion, lifestyle, product photography, documentary, cinematic)
6. COLORS & MOOD: Describe the color palette (warm earth tones, cool blues, vibrant saturated, muted pastels) and emotional mood
7. QUALITY MARKERS: Include terms like "professional photograph", "high resolution", "sharp focus", "detailed textures"

For {content_type.lower()}s, optimize for {'Instagram feed - square or portrait format, eye-catching composition' if content_type == 'Post' else 'Instagram Reels - vertical 9:16 format, dynamic and engaging'}

If a reference image is provided, carefully analyze its:
- Visual style and aesthetic
- Color grading and tones
- Composition and framing
- Lighting setup
- Overall mood and atmosphere
Then incorporate these elements into your enhanced prompt.

OUTPUT: Return ONLY the enhanced prompt (3-5 detailed sentences). No explanations, no prefixes, no formatting."""

        # Build the content parts
        parts = [types.Part.from_text(text=f"Original request: {user_prompt}\nContent type: {content_type}")]
        
        # Add reference image if provided
        if image_data:
            try:
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
                parts.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))
                parts.append(types.Part.from_text(text="Analyze this reference image and incorporate its visual style, colors, lighting, and composition into the enhanced prompt."))
            except Exception as e:
                print(f"Error processing reference image: {e}")
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=types.Content(role="user", parts=parts),
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                max_output_tokens=300
            )
        )
        
        enhanced = response.text.strip()
        print(f"Enhanced prompt: {enhanced}")
        return enhanced
    
    except Exception as e:
        print(f"Error enhancing prompt: {e}")
        return user_prompt


# =====================================================
# STEP 2: GENERATE IMAGE using Gemini 2.0 Flash Experimental Image
# =====================================================
async def generate_image(enhanced_prompt: str) -> str:
    """Generate high-quality image using Gemini image generation model."""
    
    try:
        print(f"Generating image with prompt: {enhanced_prompt}")
        
        # Use Gemini 2.0 Flash Experimental Image model (most reliable)
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=[f"Generate a high-quality, professional photograph: {enhanced_prompt}"],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
                temperature=1.0,
            )
        )
        
        # Extract the generated image from response
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                # Convert to base64 data URL
                image_bytes = part.inline_data.data
                mime_type = part.inline_data.mime_type or "image/png"
                base64_image = base64.b64encode(image_bytes).decode('utf-8')
                print("Image generated successfully!")
                return f"data:{mime_type};base64,{base64_image}"
        
        raise Exception("No image in response")
        
    except Exception as e:
        print(f"Error with Gemini image generation: {e}")
        
        # Fallback: Try Imagen 3 via Vertex AI style
        try:
            print("Trying alternative approach...")
            response = client.models.generate_content(
                model="gemini-2.0-flash-exp-image-generation",
                contents=[enhanced_prompt],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                )
            )
            
            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    image_bytes = part.inline_data.data
                    mime_type = part.inline_data.mime_type or "image/png"
                    base64_image = base64.b64encode(image_bytes).decode('utf-8')
                    print("Image generated with alternative approach!")
                    return f"data:{mime_type};base64,{base64_image}"
                    
        except Exception as e2:
            print(f"Alternative also failed: {e2}")
        
        # Final fallback - use a relevant placeholder based on prompt keywords
        print("Using placeholder image")
        return f"https://picsum.photos/1080/1080?random={abs(hash(enhanced_prompt)) % 10000}"


# =====================================================
# STEP 2B: GENERATE VIDEO using Veo 2 or Fallback
# =====================================================
async def generate_video(enhanced_prompt: str) -> str:
    """Generate video using Google Veo 2 model or fallback to image-based video."""
    
    # First, try Veo 2 if available (requires Vertex AI setup)
    try:
        print(f"Attempting Veo 2 video generation...")
        
        # Check if we have Vertex AI credentials
        operation = client.models.generate_videos(
            model="veo-2.0-generate-001",
            prompt=enhanced_prompt,
            config=types.GenerateVideosConfig(
                aspect_ratio="9:16",  # Vertical for Instagram Reels
                number_of_videos=1,
            )
        )
        
        # Poll for completion (video generation takes time)
        print("Waiting for Veo 2 video generation...")
        max_wait = 300  # 5 minutes max
        waited = 0
        
        while not operation.done and waited < max_wait:
            await asyncio.sleep(10)
            waited += 10
            try:
                operation = client.operations.get(operation)
                print(f"Video generation progress... ({waited}s)")
            except Exception as poll_err:
                print(f"Polling error: {poll_err}")
                break
        
        if operation.done and operation.result:
            if operation.result.generated_videos:
                video = operation.result.generated_videos[0]
                
                # Try to get video bytes directly
                video_bytes = None
                if hasattr(video, 'video') and video.video:
                    if hasattr(video.video, 'video_bytes') and video.video.video_bytes:
                        video_bytes = video.video.video_bytes
                    elif hasattr(video.video, 'data') and video.video.data:
                        video_bytes = video.video.data
                
                if video_bytes:
                    base64_video = base64.b64encode(video_bytes).decode('utf-8')
                    print("Veo 2 video generated successfully (bytes)!")
                    return f"data:video/mp4;base64,{base64_video}"
                
                # Check if there's a URI - download it
                if hasattr(video, 'video') and hasattr(video.video, 'uri') and video.video.uri:
                    video_uri = video.video.uri
                    print(f"Video available at URI: {video_uri}")
                    
                    # Download the video using the client
                    try:
                        # Use httpx to download with API key and follow redirects
                        api_key = os.environ.get("GEMINI_API_KEY")
                        download_url = f"{video_uri}&key={api_key}"
                        
                        async with httpx.AsyncClient(follow_redirects=True, timeout=120.0) as http_client:
                            response = await http_client.get(download_url)
                            if response.status_code == 200:
                                video_bytes = response.content
                                base64_video = base64.b64encode(video_bytes).decode('utf-8')
                                print(f"Veo 2 video downloaded successfully! Size: {len(video_bytes)} bytes")
                                return f"data:video/mp4;base64,{base64_video}"
                            else:
                                print(f"Failed to download video: {response.status_code}")
                    except Exception as download_err:
                        print(f"Error downloading video: {download_err}")
                    
                    # If download fails, return the URI with API key for direct access
                    api_key = os.environ.get("GEMINI_API_KEY")
                    return f"{video_uri}&key={api_key}"
        
        raise Exception("Veo 2 video generation did not return valid video data")
        
    except Exception as e:
        print(f"Veo 2 not available or failed: {e}")
    
    # Fallback: Generate an animated image sequence using Gemini
    try:
        print("Falling back to image generation for video preview...")
        
        # Generate a high-quality image that represents the video content
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=[f"Generate a cinematic, high-quality still frame for a video: {enhanced_prompt}. Make it look like a movie poster or video thumbnail with dynamic composition."],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
                temperature=1.0,
            )
        )
        
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                image_bytes = part.inline_data.data
                mime_type = part.inline_data.mime_type or "image/png"
                base64_image = base64.b64encode(image_bytes).decode('utf-8')
                print("Generated video preview image!")
                # Return as image but mark it for video display
                return f"data:{mime_type};base64,{base64_image}"
                
    except Exception as img_err:
        print(f"Image fallback also failed: {img_err}")
    
    # Final fallback - use a sample video URL
    print("Using sample video placeholder")
    # Use a more reliable video source
    return "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"


# =====================================================
# STEP 3: GENERATE CAPTION
# =====================================================
async def generate_caption(enhanced_prompt: str, content_type: str) -> tuple[str, str]:
    """Generate an engaging caption and hashtags for the content."""
    
    try:
        system_instruction = f"""You are a viral social media copywriter with expertise in Instagram engagement.
Create an engaging caption for a {content_type.lower()} based on the content description.

REQUIREMENTS:
1. CAPTION: Write 2-3 sentences that are:
   - Authentic and conversational (not salesy)
   - Include 1-2 relevant emojis naturally placed
   - Create curiosity or emotional connection
   - Include a subtle call-to-action (question, save this, share with someone)

2. HASHTAGS: Provide exactly 10 hashtags that are:
   - Mix of popular (1M+ posts) and niche (10K-100K posts)
   - Relevant to the content
   - Trending in 2024

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
CAPTION: [your caption here]
HASHTAGS: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=types.Content(
                role="user",
                parts=[types.Part.from_text(text=f"Content description: {enhanced_prompt}")]
            ),
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.8,
                max_output_tokens=400
            )
        )
        
        result = response.text.strip()
        print(f"Caption response: {result}")
        
        # Parse caption and hashtags
        caption = ""
        hashtags = ""
        
        if "CAPTION:" in result and "HASHTAGS:" in result:
            parts = result.split("HASHTAGS:")
            caption = parts[0].replace("CAPTION:", "").strip()
            hashtags = parts[1].strip() if len(parts) > 1 else ""
        else:
            # Try to extract anyway
            lines = result.split('\n')
            caption = lines[0] if lines else result
            hashtags = " ".join([line for line in lines if line.startswith('#')])
        
        if not hashtags:
            hashtags = "#instagram #viral #trending #explore #fyp #content #creative #instagood #photooftheday #reels"
        
        return caption, hashtags
        
    except Exception as e:
        print(f"Error generating caption: {e}")
        return "Check out this amazing content! ✨ What do you think?", "#instagram #viral #trending #explore #fyp #content #creative #instagood #photooftheday #reels"


# =====================================================
# STEP 4: UPLOAD TO CLOUDFLARE R2
# =====================================================
async def upload_to_r2(media_data: str, content_type: str) -> str:
    """Upload base64 media to Cloudflare R2 and return public URL."""
    
    r2 = get_r2_client()
    if not r2:
        raise Exception("R2 client not configured. Check R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY")
    
    if not R2_PUBLIC_URL:
        raise Exception("R2_PUBLIC_URL not configured")
    
    if not R2_BUCKET_NAME:
        raise Exception("R2_BUCKET_NAME not configured")
    
    try:
        # Determine file extension and content type
        if content_type == "Post":
            if "image/png" in media_data:
                ext = "png"
                mime_type = "image/png"
            else:
                ext = "jpg"
                mime_type = "image/jpeg"
        else:
            ext = "mp4"
            mime_type = "video/mp4"
        
        # Generate unique filename
        filename = f"sentinalai/{uuid.uuid4()}.{ext}"
        
        # Decode base64 data
        if media_data.startswith("data:"):
            # Remove data URL prefix
            base64_data = media_data.split(",")[1]
        else:
            base64_data = media_data
        
        file_bytes = base64.b64decode(base64_data)
        
        print(f"Uploading to R2: {filename} ({len(file_bytes)} bytes)")
        
        # Upload to R2
        r2.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=filename,
            Body=file_bytes,
            ContentType=mime_type
        )
        
        # Return public URL
        public_url = f"{R2_PUBLIC_URL.rstrip('/')}/{filename}"
        print(f"Uploaded successfully: {public_url}")
        return public_url
        
    except Exception as e:
        print(f"R2 upload error: {e}")
        raise Exception(f"Failed to upload to R2: {str(e)}")


# =====================================================
# STEP 5: PUBLISH TO INSTAGRAM
# =====================================================
async def publish_to_instagram(media_url: str, caption: str, hashtags: str, content_type: str) -> dict:
    """Publish the content to Instagram."""
    
    ig_business_id = os.environ.get("INSTAGRAM_BUSINESS_ID")
    access_token = os.environ.get("INSTAGRAM_ACCESS_TOKEN")
    
    if not ig_business_id or not access_token:
        return {"status": "error", "message": "Instagram credentials not configured"}
    
    # If media is base64, upload to R2 first
    if media_url.startswith("data:"):
        try:
            print("Uploading media to R2...")
            media_url = await upload_to_r2(media_url, content_type)
            print(f"Media uploaded to: {media_url}")
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    try:
        api_base = f"https://graph.facebook.com/v21.0/{ig_business_id}"
        full_caption = f"{caption}\n\n{hashtags}"
        
        async with httpx.AsyncClient(timeout=120.0) as http_client:
            # Step 1: Create media container
            if content_type == "Post":
                payload = {
                    "image_url": media_url,
                    "caption": full_caption,
                    "access_token": access_token
                }
            else:
                payload = {
                    "video_url": media_url,
                    "caption": full_caption,
                    "media_type": "REELS",
                    "access_token": access_token
                }
            
            print(f"Creating Instagram media container...")
            container_response = await http_client.post(
                f"{api_base}/media",
                data=payload
            )
            
            print(f"Container response: {container_response.status_code} - {container_response.text}")
            
            if container_response.status_code != 200:
                return {"status": "error", "message": f"Failed to create container: {container_response.text}"}
            
            creation_id = container_response.json().get("id")
            print(f"Container created: {creation_id}")
            
            # Step 2: Wait for media processing (for BOTH images and videos)
            # Instagram needs time to fetch and process the media from the URL
            print("Waiting for media processing...")
            max_attempts = 30 if content_type == "Post" else 60  # 2.5 min for images, 5 min for videos
            
            for i in range(max_attempts):
                await asyncio.sleep(5)
                status_response = await http_client.get(
                    f"https://graph.facebook.com/v21.0/{creation_id}",
                    params={"fields": "status_code,status", "access_token": access_token}
                )
                status_data = status_response.json()
                status = status_data.get("status_code")
                print(f"Processing status ({(i+1)*5}s): {status}")
                
                if status == "FINISHED":
                    print("Media processing complete!")
                    break
                elif status == "ERROR":
                    error_msg = status_data.get("status", "Unknown error")
                    return {"status": "error", "message": f"Media processing failed: {error_msg}"}
                elif status == "IN_PROGRESS":
                    continue
                # If status is None or unknown, keep waiting
            
            # Step 3: Publish the media
            print("Publishing to Instagram...")
            publish_response = await http_client.post(
                f"{api_base}/media_publish",
                data={"creation_id": creation_id, "access_token": access_token}
            )
            
            print(f"Publish response: {publish_response.status_code} - {publish_response.text}")
            
            if publish_response.status_code == 200:
                post_id = publish_response.json().get("id")
                print(f"Published successfully! Post ID: {post_id}")
                return {"status": "success", "post_id": post_id}
            else:
                # If still not ready, try a few more times with delay
                for retry in range(3):
                    print(f"Retrying publish (attempt {retry + 2})...")
                    await asyncio.sleep(5)
                    publish_response = await http_client.post(
                        f"{api_base}/media_publish",
                        data={"creation_id": creation_id, "access_token": access_token}
                    )
                    if publish_response.status_code == 200:
                        post_id = publish_response.json().get("id")
                        print(f"Published successfully! Post ID: {post_id}")
                        return {"status": "success", "post_id": post_id}
                
                return {"status": "error", "message": f"Failed to publish: {publish_response.text}"}
                
    except Exception as e:
        print(f"Instagram publish error: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


# =====================================================
# API ENDPOINTS
# =====================================================

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate")
async def generate_content_endpoint(req: GenerateRequest) -> GenerateResponse:
    """
    Main endpoint for content generation.
    Steps: Enhance prompt -> Generate media -> Generate caption
    Returns preview for user approval.
    """
    try:
        content_id = f"{req.session_id}_{abs(hash(req.message + str(os.urandom(4))))}"
        
        print(f"\n{'='*50}")
        print(f"New generation request: {req.content_type}")
        print(f"Original prompt: {req.message}")
        print(f"Has reference image: {bool(req.image_data)}")
        print(f"{'='*50}\n")
        
        # Step 1: Enhance the prompt
        print("Step 1: Enhancing prompt...")
        enhanced_prompt = await enhance_prompt(req.message, req.content_type, req.image_data)
        
        # Step 2: Generate media (image or video)
        print(f"Step 2: Generating {req.content_type.lower()}...")
        if req.content_type == "Post":
            media_url = await generate_image(enhanced_prompt)
        else:
            media_url = await generate_video(enhanced_prompt)
        
        # Step 3: Generate caption and hashtags
        print("Step 3: Generating caption...")
        caption, hashtags = await generate_caption(enhanced_prompt, req.content_type)
        
        # Store for later approval
        generated_content_store[content_id] = {
            "user_id": req.user_id,
            "session_id": req.session_id,
            "content_type": req.content_type,
            "enhanced_prompt": enhanced_prompt,
            "media_url": media_url,
            "caption": caption,
            "hashtags": hashtags
        }
        
        print(f"\nGeneration complete! Content ID: {content_id}\n")
        
        return GenerateResponse(
            status="preview",
            content_id=content_id,
            enhanced_prompt=enhanced_prompt,
            generated_media_url=media_url,
            caption=caption,
            hashtags=hashtags
        )
        
    except Exception as e:
        print(f"Error in generate_content: {e}")
        import traceback
        traceback.print_exc()
        return GenerateResponse(status="error", error=str(e))


@app.post("/approve")
async def approve_content(req: ApprovalRequest) -> PublishResponse:
    """
    Handle user approval/denial of generated content.
    """
    try:
        content = generated_content_store.get(req.content_id)
        
        if not content:
            return PublishResponse(status="error", error="Content not found. Please regenerate.")
        
        if not req.approved:
            del generated_content_store[req.content_id]
            return PublishResponse(status="denied", error="Content denied. Please regenerate with a new prompt.")
        
        # User approved - publish to Instagram
        result = await publish_to_instagram(
            media_url=content["media_url"],
            caption=content["caption"],
            hashtags=content["hashtags"],
            content_type=content["content_type"]
        )
        
        del generated_content_store[req.content_id]
        
        if result["status"] == "success":
            return PublishResponse(status="published", post_id=result.get("post_id"))
        else:
            return PublishResponse(status="error", error=result.get("message", "Publishing failed"))
            
    except Exception as e:
        return PublishResponse(status="error", error=str(e))


# Legacy chat endpoint
@app.post("/chat")
async def chat(req: GenerateRequest) -> dict:
    result = await generate_content_endpoint(req)
    return {
        "response": f"Generated content preview ready!\n\nEnhanced Prompt: {result.enhanced_prompt}\n\nCaption: {result.caption}\n\n{result.hashtags}",
        "session_id": req.session_id,
        "content_id": result.content_id,
        "media_url": result.generated_media_url,
        "caption": result.caption,
        "hashtags": result.hashtags,
        "status": result.status
    }
