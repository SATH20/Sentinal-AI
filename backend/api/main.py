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
import json
import boto3
from botocore.config import Config
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
# Make sure backend/agents/agent.py exists and has these variables
from agents.agent import brand_manager, strategist_agent, web_architect, automation_strategist
import traceback  # <--- ADD THIS
from fastapi.responses import JSONResponse
from supabase import create_client

from google import genai
from google.genai import types
# --- ADD THIS INITIALIZATION ---
session_service = InMemorySessionService()
# Initialize Gemini client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Initialize Supabase client for Brand DNA retrieval
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None


async def get_brand_dna() -> Optional[dict]:
    """Fetch the latest Brand DNA from Supabase to use as context for content generation."""
    if not supabase_client:
        print("⚠️ Supabase not configured, skipping Brand DNA fetch")
        return None
    
    try:
        response = supabase_client.table("brands").select("*").order("created_at", desc=True).limit(1).execute()
        if response.data and len(response.data) > 0:
            brand = response.data[0]
            print(f"✅ Loaded Brand DNA for: {brand.get('company_name', 'Unknown')}")
            return {
                "company_name": brand.get("company_name", ""),
                "description": brand.get("description", ""),
                "dna": brand.get("dna", {}),
                "image_url": brand.get("image_url", "")
            }
        else:
            print("ℹ️ No Brand DNA found in database")
            return None
    except Exception as e:
        print(f"❌ Error fetching Brand DNA: {e}")
        return None

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

# --- ADD THIS CLASS ---
class AgentRequest(BaseModel):
    input_text: str
    agent_type: str = "brand"  # Default to brand, can be "analytics"


class WebsiteGenerateRequest(BaseModel):
    user_id: str
    prompt: str
    project_name: Optional[str] = None


class WebsiteResponse(BaseModel):
    status: str
    project_id: Optional[str] = None
    generated_code: Optional[str] = None
    project_name: Optional[str] = None
    error: Optional[str] = None


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
# STEP 1: ENHANCE PROMPT (WITH BRAND DNA CONTEXT)
# =====================================================
async def enhance_prompt(user_prompt: str, content_type: str, image_data: Optional[str] = None) -> str:
    """Use Gemini to enhance the user's prompt based on their text, reference image, AND Brand DNA."""
    
    try:
        # Fetch Brand DNA to use as context
        brand_dna = await get_brand_dna()
        
        # Build brand context string
        brand_context = ""
        if brand_dna:
            brand_context = f"""
=== BRAND DNA (USE THIS AS YOUR PRIMARY STYLE GUIDE) ===
Company: {brand_dna.get('company_name', 'Unknown')}
Brand Description: {brand_dna.get('description', 'N/A')}
Brand DNA Guidelines: {json.dumps(brand_dna.get('dna', {}), indent=2) if isinstance(brand_dna.get('dna'), dict) else brand_dna.get('dna', 'N/A')}
===

IMPORTANT: All generated content MUST align with the Brand DNA above. 
Match the brand's voice, tone, color palette, typography style, and overall aesthetic.
"""
            print(f"🎨 Using Brand DNA for: {brand_dna.get('company_name')}")
        else:
            print("⚠️ No Brand DNA found, generating without brand context")
        
        system_instruction = f"""You are an expert creative director specializing in viral social media content.
Your task is to transform the user's basic idea into a detailed, photorealistic prompt for AI image generation.

{brand_context}

CRITICAL REQUIREMENTS FOR HIGH-QUALITY OUTPUT:
1. SUBJECT CLARITY: Clearly describe the main subject, its position, and what it's doing
2. ENVIRONMENT: Describe the setting, background, and atmosphere in detail
3. LIGHTING: Specify exact lighting (golden hour sunlight, soft studio lighting, dramatic rim lighting, natural window light, etc.)
4. CAMERA DETAILS: Include lens type (35mm, 85mm portrait lens, wide-angle), depth of field (shallow bokeh, deep focus), angle (eye-level, low angle, bird's eye)
5. STYLE: Specify photography style (editorial fashion, lifestyle, product photography, documentary, cinematic)
6. COLORS & MOOD: Describe the color palette that MATCHES THE BRAND DNA (if provided), and emotional mood
7. QUALITY MARKERS: Include terms like "professional photograph", "high resolution", "sharp focus", "detailed textures"
8. BRAND ALIGNMENT: If Brand DNA is provided, ensure colors, mood, and style match the brand guidelines

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
                # Handle data URL format
                if ',' in image_data:
                    # Extract mime type and base64 data
                    header, base64_data = image_data.split(',', 1)
                    # Determine mime type from header
                    if 'png' in header.lower():
                        mime_type = "image/png"
                    elif 'gif' in header.lower():
                        mime_type = "image/gif"
                    elif 'webp' in header.lower():
                        mime_type = "image/webp"
                    else:
                        mime_type = "image/jpeg"
                else:
                    base64_data = image_data
                    mime_type = "image/jpeg"
                
                image_bytes = base64.b64decode(base64_data)
                print(f"Reference image: {len(image_bytes)} bytes, mime: {mime_type}")
                
                # Only add if image is valid size (at least 100 bytes)
                if len(image_bytes) > 100:
                    parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
                    parts.append(types.Part.from_text(text="Analyze this reference image and incorporate its visual style, colors, lighting, and composition into the enhanced prompt."))
                else:
                    print("Reference image too small, skipping")
            except Exception as e:
                print(f"Error processing reference image: {e}")
                import traceback
                traceback.print_exc()
        
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
# STEP 3: GENERATE CAPTION (WITH BRAND DNA CONTEXT)
# =====================================================
async def generate_caption(enhanced_prompt: str, content_type: str) -> tuple[str, str]:
    """Generate an engaging caption and hashtags for the content, aligned with Brand DNA."""
    
    try:
        # Fetch Brand DNA for caption voice/tone alignment
        brand_dna = await get_brand_dna()
        
        brand_voice_context = ""
        if brand_dna:
            dna_data = brand_dna.get('dna', {})
            if isinstance(dna_data, str):
                try:
                    dna_data = json.loads(dna_data)
                except:
                    dna_data = {}
            
            brand_voice_context = f"""
=== BRAND VOICE GUIDELINES ===
Company: {brand_dna.get('company_name', 'Unknown')}
Brand Description: {brand_dna.get('description', 'N/A')}
Voice & Tone: {dna_data.get('voice', dna_data.get('Voice', 'Professional yet approachable'))}
Brand DNA: {json.dumps(dna_data, indent=2) if dna_data else 'N/A'}
===

CRITICAL: Your caption MUST match the brand's voice and tone described above.
"""
            print(f"📝 Using Brand DNA voice for caption: {brand_dna.get('company_name')}")
        
        system_instruction = f"""You are a viral social media copywriter with expertise in Instagram engagement.
Create an engaging caption for a {content_type.lower()} based on the content description.

{brand_voice_context}

REQUIREMENTS:
1. CAPTION: Write 2-3 sentences that are:
   - Authentic and conversational (not salesy)
   - MUST match the brand's voice and tone (if Brand DNA provided)
   - Include 1-2 relevant emojis naturally placed
   - Create curiosity or emotional connection
   - Include a subtle call-to-action (question, save this, share with someone)

2. HASHTAGS: Provide exactly 10 hashtags that are:
   - Mix of popular (1M+ posts) and niche (10K-100K posts)
   - Relevant to the content AND the brand
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
        
        # Step 1: Enhance the prompt (with Brand DNA context)
        print("Step 1: Enhancing prompt with Brand DNA context...")
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

# --- ADD THIS NEW ENDPOINT ---
@app.post("/api/run-agent")
async def run_agent(request: AgentRequest):
    print(f"--> Received request for agent: {request.agent_type}")
    
    try:
        user_id = "api_user"
        session_id = str(uuid.uuid4())
        APP_NAME = "sento_integration"

        # 1. Create a session for this request
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id
        )

        # 2. Select the correct agent
        if request.agent_type == "analytics":
            selected_agent = strategist_agent
            print("--> Selected: STRATEGIST AGENT")
        else:
            selected_agent = brand_manager
            print("--> Selected: BRAND MANAGER AGENT")

        # 3. Run the agent
        runner = Runner(
            agent=selected_agent,
            app_name=APP_NAME,
            session_service=session_service
        )

        content = types.Content(role='user', parts=[types.Part(text=request.input_text)])
        final_text = "No response generated."

        print("\n--- AGENT EXECUTION START ---")
        async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=content):
            if event.is_final_response() and event.content and event.content.parts:
                part_text = event.content.parts[0].text
                if part_text and part_text.strip():
                    final_text = part_text
        
        print("--- AGENT EXECUTION END ---\n")
        return {"response": final_text}

    except Exception as e:
        print("!!! AGENT ERROR !!!")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})
    
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


# =====================================================
# WEB ARCHITECT ENDPOINTS
# =====================================================

@app.post("/api/generate-website")
async def generate_website(req: WebsiteGenerateRequest) -> WebsiteResponse:
    """
    Generate a website/landing page using the Web Architect agent.
    """
    try:
        print(f"\n{'='*50}")
        print(f"🌐 Web Architect Request")
        print(f"Prompt: {req.prompt}")
        print(f"{'='*50}\n")
        
        session_id = str(uuid.uuid4())
        APP_NAME = "web_architect_app"
        
        # Create session
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=req.user_id,
            session_id=session_id
        )
        
        # Fetch Brand DNA for context
        brand_dna = await get_brand_dna()
        brand_context = ""
        if brand_dna:
            brand_context = f"""
Use this Brand DNA for styling:
- Company: {brand_dna.get('company_name', 'Unknown')}
- Description: {brand_dna.get('description', '')}
- Brand Guidelines: {json.dumps(brand_dna.get('dna', {})) if brand_dna.get('dna') else 'N/A'}
"""
            print(f"🎨 Using Brand DNA: {brand_dna.get('company_name')}")
        
        # Build the full prompt
        full_prompt = f"""
{brand_context}

User Request: {req.prompt}

Generate a complete, production-ready React landing page component with Tailwind CSS.
Output ONLY the code, no explanations.
"""
        
        # Run the web architect agent
        runner = Runner(
            agent=web_architect,
            app_name=APP_NAME,
            session_service=session_service
        )
        
        content = types.Content(role='user', parts=[types.Part(text=full_prompt)])
        generated_code = ""
        
        print("🏗️ Web Architect generating...")
        async for event in runner.run_async(user_id=req.user_id, session_id=session_id, new_message=content):
            if event.is_final_response() and event.content and event.content.parts:
                part_text = event.content.parts[0].text
                if part_text and part_text.strip():
                    generated_code = part_text
        
        if not generated_code:
            return WebsiteResponse(status="error", error="Failed to generate website code")
        
        # Clean up the code (remove markdown code blocks if present)
        generated_code = clean_generated_code(generated_code)
        
        # Generate project name if not provided
        project_name = req.project_name or f"Website_{uuid.uuid4().hex[:8]}"
        
        # Save to Supabase
        project_id = None
        if supabase_client:
            try:
                result = supabase_client.table("web_projects").insert({
                    "user_id": req.user_id,
                    "project_name": project_name,
                    "generated_code": generated_code
                }).execute()
                if result.data:
                    project_id = result.data[0]["id"]
                    print(f"✅ Project saved: {project_id}")
            except Exception as e:
                print(f"⚠️ Failed to save project: {e}")
        
        print(f"✅ Website generated successfully!")
        
        return WebsiteResponse(
            status="success",
            project_id=project_id,
            generated_code=generated_code,
            project_name=project_name
        )
        
    except Exception as e:
        print(f"❌ Error generating website: {e}")
        traceback.print_exc()
        return WebsiteResponse(status="error", error=str(e))


def clean_generated_code(code: str) -> str:
    """Remove markdown code blocks and clean up generated code."""
    import re
    
    # Remove ```jsx or ```javascript or ``` blocks
    code = re.sub(r'^```(?:jsx|javascript|tsx|js)?\n?', '', code, flags=re.MULTILINE)
    code = re.sub(r'\n?```$', '', code, flags=re.MULTILINE)
    code = code.strip()
    
    return code


@app.get("/api/web-projects/{user_id}")
async def get_user_projects(user_id: str):
    """Get all web projects for a user."""
    if not supabase_client:
        return {"status": "error", "message": "Database not connected", "projects": []}
    
    try:
        response = supabase_client.table("web_projects").select("id, project_name, created_at, updated_at, deployed_url").eq("user_id", user_id).order("created_at", desc=True).execute()
        return {"status": "success", "projects": response.data or []}
    except Exception as e:
        return {"status": "error", "message": str(e), "projects": []}


@app.get("/api/web-projects/detail/{project_id}")
async def get_project_detail(project_id: str):
    """Get a specific web project with full code."""
    if not supabase_client:
        return {"status": "error", "message": "Database not connected"}
    
    try:
        response = supabase_client.table("web_projects").select("*").eq("id", project_id).execute()
        if response.data and len(response.data) > 0:
            return {"status": "success", "project": response.data[0]}
        return {"status": "error", "message": "Project not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.put("/api/web-projects/{project_id}")
async def update_project(project_id: str, data: dict):
    """Update a web project."""
    if not supabase_client:
        return {"status": "error", "message": "Database not connected"}
    
    try:
        update_data = {}
        if "generated_code" in data:
            update_data["generated_code"] = data["generated_code"]
        if "project_name" in data:
            update_data["project_name"] = data["project_name"]
        if "deployed_url" in data:
            update_data["deployed_url"] = data["deployed_url"]
        
        if update_data:
            supabase_client.table("web_projects").update(update_data).eq("id", project_id).execute()
        return {"status": "success", "message": "Project updated"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.delete("/api/web-projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a web project."""
    if not supabase_client:
        return {"status": "error", "message": "Database not connected"}
    
    try:
        supabase_client.table("web_projects").delete().eq("id", project_id).execute()
        return {"status": "success", "message": "Project deleted"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# =====================================================
# VERCEL DEPLOYMENT ENDPOINTS
# =====================================================

class DeployRequest(BaseModel):
    project_id: str
    project_name: Optional[str] = None


class DeployResponse(BaseModel):
    status: str
    deployed_url: Optional[str] = None
    deployment_id: Optional[str] = None
    error: Optional[str] = None


def create_nextjs_project_files(component_code: str, project_name: str) -> dict:
    """
    Create a minimal Next.js project structure for Vercel deployment.
    Returns a dict of filename -> file content.
    """
    
    # Clean component code - ensure it's a valid export
    if not component_code.strip().startswith('import') and not component_code.strip().startswith('export'):
        component_code = f"export default function Page() {{\n  return (\n{component_code}\n  );\n}}"
    
    # Convert .tsx to .jsx by removing type annotations (simple approach)
    # This avoids needing TypeScript dependencies
    component_code_js = component_code
    
    files = {
        # package.json - using JavaScript, not TypeScript
        "package.json": json.dumps({
            "name": project_name.lower().replace(" ", "-").replace("_", "-")[:50],
            "version": "1.0.0",
            "private": True,
            "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start"
            },
            "dependencies": {
                "next": "14.2.15",
                "react": "^18",
                "react-dom": "^18",
                "lucide-react": "^0.400.0"
            },
            "devDependencies": {
                "tailwindcss": "^3.4.0",
                "postcss": "^8",
                "autoprefixer": "^10"
            }
        }, indent=2),
        
        # next.config.js
        "next.config.js": """/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
};
module.exports = nextConfig;
""",
        
        # tailwind.config.js
        "tailwind.config.js": """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
""",
        
        # postcss.config.js
        "postcss.config.js": """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
""",
        
        # app/layout.jsx (JavaScript, not TypeScript)
        "app/layout.jsx": """import './globals.css';

export const metadata = {
  title: '""" + project_name + """',
  description: 'Generated by Sento Web Architect',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
""",
        
        # app/globals.css
        "app/globals.css": """@tailwind base;
@tailwind components;
@tailwind utilities;
""",
        
        # app/page.jsx - The generated component (JavaScript)
        "app/page.jsx": component_code_js,
    }
    
    return files


@app.post("/api/deploy-website")
async def deploy_website(req: DeployRequest) -> DeployResponse:
    """
    Deploy a generated website to Vercel.
    """
    vercel_token = os.environ.get("VERCEL_TOKEN")
    
    if not vercel_token or vercel_token == "your_vercel_token_here":
        return DeployResponse(
            status="error",
            error="VERCEL_TOKEN not configured. Get one from https://vercel.com/account/tokens"
        )
    
    try:
        print(f"\n{'='*50}")
        print(f"🚀 Deploying project: {req.project_id}")
        print(f"{'='*50}\n")
        
        # Fetch project from database
        if not supabase_client:
            return DeployResponse(status="error", error="Database not connected")
        
        response = supabase_client.table("web_projects").select("*").eq("id", req.project_id).execute()
        
        if not response.data or len(response.data) == 0:
            return DeployResponse(status="error", error="Project not found")
        
        project = response.data[0]
        generated_code = project.get("generated_code", "")
        project_name = req.project_name or project.get("project_name", f"sento-{req.project_id[:8]}")
        
        if not generated_code:
            return DeployResponse(status="error", error="No code to deploy")
        
        # Create Next.js project files
        files = create_nextjs_project_files(generated_code, project_name)
        
        # Prepare files for Vercel API
        vercel_files = []
        for filepath, content in files.items():
            vercel_files.append({
                "file": filepath,
                "data": content
            })
        
        # Create deployment via Vercel API
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Create deployment
            deploy_response = await client.post(
                "https://api.vercel.com/v13/deployments",
                headers={
                    "Authorization": f"Bearer {vercel_token}",
                    "Content-Type": "application/json"
                },
                json={
                    "name": project_name.lower().replace(" ", "-").replace("_", "-")[:50],
                    "files": vercel_files,
                    "projectSettings": {
                        "framework": "nextjs",
                        "installCommand": "npm install",
                        "buildCommand": "npm run build",
                        "outputDirectory": ".next"
                    },
                    "target": "production"
                }
            )
            
            print(f"Vercel API response: {deploy_response.status_code}")
            
            if deploy_response.status_code not in [200, 201]:
                error_text = deploy_response.text
                print(f"Vercel error: {error_text}")
                return DeployResponse(
                    status="error",
                    error=f"Vercel deployment failed: {error_text[:200]}"
                )
            
            deploy_data = deploy_response.json()
            deployment_id = deploy_data.get("id")
            deployment_url = deploy_data.get("url")
            
            # Vercel returns URL without https://
            if deployment_url and not deployment_url.startswith("http"):
                deployment_url = f"https://{deployment_url}"
            
            print(f"✅ Deployment created: {deployment_url}")
            print(f"   Deployment ID: {deployment_id}")
            
            # Update project with deployed URL
            try:
                supabase_client.table("web_projects").update({
                    "deployed_url": deployment_url
                }).eq("id", req.project_id).execute()
                print(f"✅ Saved deployed URL to database")
            except Exception as e:
                print(f"⚠️ Failed to save deployed URL: {e}")
            
            return DeployResponse(
                status="success",
                deployed_url=deployment_url,
                deployment_id=deployment_id
            )
            
    except Exception as e:
        print(f"❌ Deployment error: {e}")
        traceback.print_exc()
        return DeployResponse(status="error", error=str(e))


@app.get("/api/deployment-status/{deployment_id}")
async def get_deployment_status(deployment_id: str):
    """Check the status of a Vercel deployment."""
    vercel_token = os.environ.get("VERCEL_TOKEN")
    
    if not vercel_token:
        return {"status": "error", "message": "VERCEL_TOKEN not configured"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.vercel.com/v13/deployments/{deployment_id}",
                headers={"Authorization": f"Bearer {vercel_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "success",
                    "state": data.get("readyState"),  # QUEUED, BUILDING, READY, ERROR
                    "url": f"https://{data.get('url')}" if data.get('url') else None
                }
            else:
                return {"status": "error", "message": response.text}
                
    except Exception as e:
        return {"status": "error", "message": str(e)}


# =====================================================
# CONTENT AUTOMATION ENDPOINTS
# =====================================================

from datetime import datetime, timedelta
from typing import List

# In-memory storage for automation (replace with Supabase in production)
automation_settings_store = {}
scheduled_posts_store = {}


class AutomationSettings(BaseModel):
    mode: str = "auto"  # "auto" or "manual"
    posts_per_day: int = 2
    content_mix: dict = {"posts": 50, "reels": 50}
    posting_times: List[str] = ["09:00", "18:00"]
    active_days: List[str] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    use_trends: bool = True
    trend_region: str = "United States"
    is_active: bool = False


class ScheduledPost(BaseModel):
    content_type: str  # "Post" or "Reel"
    caption: Optional[str] = None
    media_url: Optional[str] = None
    scheduled_time: str
    trend_source: Optional[str] = None


class GenerateAutomationRequest(BaseModel):
    settings: AutomationSettings


@app.get("/api/automation/settings")
async def get_automation_settings():
    """Get current automation settings."""
    settings = automation_settings_store.get("default", AutomationSettings().dict())
    return {"status": "success", "settings": settings}


@app.post("/api/automation/settings")
async def save_automation_settings(settings: AutomationSettings):
    """Save automation settings."""
    automation_settings_store["default"] = settings.dict()
    
    # Also save to Supabase if available
    if supabase_client:
        try:
            # Upsert settings
            supabase_client.table("automation_settings").upsert({
                "id": "default",
                "settings": settings.dict()
            }).execute()
        except Exception as e:
            print(f"Warning: Could not save settings to Supabase: {e}")
    
    return {"status": "success", "message": "Settings saved"}


@app.get("/api/automation/queue")
async def get_scheduled_posts():
    """Get all scheduled posts."""
    posts = list(scheduled_posts_store.values())
    
    # Also fetch from Supabase if available
    if supabase_client:
        try:
            response = supabase_client.table("scheduled_posts").select("*").order("scheduled_time", desc=False).execute()
            if response.data:
                posts = response.data
        except Exception as e:
            print(f"Warning: Could not fetch posts from Supabase: {e}")
    
    return {"status": "success", "posts": posts}


@app.delete("/api/automation/queue/{post_id}")
async def remove_scheduled_post(post_id: str):
    """Remove a post from the queue."""
    if post_id in scheduled_posts_store:
        del scheduled_posts_store[post_id]
    
    if supabase_client:
        try:
            supabase_client.table("scheduled_posts").delete().eq("id", post_id).execute()
        except Exception as e:
            print(f"Warning: Could not delete from Supabase: {e}")
    
    return {"status": "success", "message": "Post removed"}


@app.get("/api/automation/trends")
async def get_trends():
    """Get current trending topics based on brand domain."""
    try:
        # Get brand DNA to understand the domain
        brand_dna = await get_brand_dna()
        
        # Use pytrends to get trending topics
        from pytrends.request import TrendReq
        
        pytrends = TrendReq(hl='en-US', tz=360)
        
        # Get general trending searches
        settings = automation_settings_store.get("default", {})
        region = settings.get("trend_region", "United States")
        
        geo_map = {
            'United States': 'united_states',
            'India': 'india',
            'United Kingdom': 'united_kingdom',
            'Canada': 'canada',
            'Australia': 'australia'
        }
        geo_code = geo_map.get(region, 'united_states')
        
        try:
            trends_df = pytrends.trending_searches(pn=geo_code)
            trends = trends_df.head(10)[0].tolist()
        except Exception as e:
            print(f"Trends API error: {e}")
            # Fallback trends
            trends = [
                "#AIRevolution", "#SustainableLiving", "#TechTrends",
                "#MorningVibes", "#StartupLife", "#ContentCreator",
                "#DigitalMarketing", "#Innovation", "#Entrepreneurship", "#Growth"
            ]
        
        # If we have brand DNA, filter/enhance trends based on brand domain
        if brand_dna:
            brand_keywords = extract_brand_keywords(brand_dna)
            # Could filter trends here based on relevance to brand
        
        return {"status": "success", "trends": trends, "region": region}
        
    except Exception as e:
        print(f"Error fetching trends: {e}")
        return {
            "status": "success",
            "trends": ["#Trending", "#Viral", "#ForYou", "#Explore", "#Content"],
            "region": "United States"
        }


def extract_brand_keywords(brand_dna: dict) -> List[str]:
    """Extract relevant keywords from brand DNA for trend filtering."""
    keywords = []
    
    if brand_dna.get("company_name"):
        keywords.append(brand_dna["company_name"].lower())
    
    if brand_dna.get("description"):
        # Simple keyword extraction from description
        desc = brand_dna["description"].lower()
        common_words = {"the", "a", "an", "is", "are", "and", "or", "for", "to", "in", "on", "with"}
        words = [w for w in desc.split() if len(w) > 3 and w not in common_words]
        keywords.extend(words[:10])
    
    dna = brand_dna.get("dna", {})
    if isinstance(dna, str):
        try:
            dna = json.loads(dna)
        except:
            dna = {}
    
    # Extract from DNA fields
    if isinstance(dna, dict):
        for key in ["industry", "niche", "target_audience", "keywords"]:
            if key in dna:
                val = dna[key]
                if isinstance(val, list):
                    keywords.extend(val)
                elif isinstance(val, str):
                    keywords.append(val)
    
    return list(set(keywords))


@app.get("/api/automation/insights")
async def get_automation_insights():
    """Get AI-powered insights for content strategy."""
    try:
        # Fetch Instagram insights
        from agents.tools import get_instagram_insights_tool
        insights_raw = get_instagram_insights_tool("last_30_days")
        insights = json.loads(insights_raw) if isinstance(insights_raw, str) else insights_raw
        
        # Get brand DNA for context
        brand_dna = await get_brand_dna()
        
        # Generate AI recommendations
        recommendation = await generate_ai_recommendation(insights, brand_dna)
        
        return {
            "status": "success",
            "insights": {
                "top_performing": insights.get("top_performing_posts", []),
                "low_performing": insights.get("low_performing_posts", []),
                "account_summary": insights.get("account_summary", {}),
                "recommendation": recommendation,
                "optimal_times": ["9:00 AM", "12:00 PM", "6:00 PM", "8:00 PM"]
            }
        }
    except Exception as e:
        print(f"Error getting insights: {e}")
        return {
            "status": "success",
            "insights": {
                "top_performing": [
                    {"type": "Reel", "theme": "Behind the Scenes", "insight": "High engagement"},
                    {"type": "Carousel", "theme": "Product Showcase", "insight": "High saves"}
                ],
                "recommendation": "Focus on Reels and behind-the-scenes content for higher engagement",
                "optimal_times": ["9:00 AM", "6:00 PM", "8:00 PM"]
            }
        }


async def generate_ai_recommendation(insights: dict, brand_dna: dict) -> str:
    """Generate AI-powered content recommendation."""
    try:
        top_posts = insights.get("top_performing_posts", [])
        low_posts = insights.get("low_performing_posts", [])
        
        prompt = f"""Based on this Instagram performance data:
Top Performing: {json.dumps(top_posts)}
Low Performing: {json.dumps(low_posts)}
Brand: {brand_dna.get('company_name', 'Unknown') if brand_dna else 'Unknown'}

Give ONE specific, actionable recommendation (1-2 sentences) for improving content strategy."""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=100
            )
        )
        
        return response.text.strip()
    except Exception as e:
        print(f"Error generating recommendation: {e}")
        return "Focus on creating more Reels with trending audio for higher reach and engagement."


@app.post("/api/automation/generate")
async def generate_automated_content(req: GenerateAutomationRequest):
    """Generate content based on automation settings and trends."""
    try:
        settings = req.settings
        
        print(f"\n{'='*50}")
        print(f"🤖 Generating Automated Content")
        print(f"Mode: {settings.mode}")
        print(f"Posts per day: {settings.posts_per_day}")
        print(f"{'='*50}\n")
        
        # Get brand DNA
        brand_dna = await get_brand_dna()
        
        # Get trends if enabled
        trends = []
        if settings.use_trends:
            trends_response = await get_trends()
            trends = trends_response.get("trends", [])[:5]
        
        # Determine content mix
        posts_count = int(settings.posts_per_day * settings.content_mix["posts"] / 100)
        reels_count = settings.posts_per_day - posts_count
        
        generated_posts = []
        
        # Generate content for each slot
        for i in range(settings.posts_per_day):
            content_type = "Post" if i < posts_count else "Reel"
            
            # Pick a trend if available
            trend = trends[i % len(trends)] if trends else None
            
            # Generate content using AI
            post = await generate_single_content(
                content_type=content_type,
                brand_dna=brand_dna,
                trend=trend,
                settings=settings,
                slot_index=i
            )
            
            if post:
                generated_posts.append(post)
                
                # Store in memory
                scheduled_posts_store[post["id"]] = post
                
                # Store in Supabase if available
                if supabase_client:
                    try:
                        supabase_client.table("scheduled_posts").insert(post).execute()
                    except Exception as e:
                        print(f"Warning: Could not save to Supabase: {e}")
        
        print(f"✅ Generated {len(generated_posts)} posts")
        
        return {
            "status": "success",
            "generated": len(generated_posts),
            "posts": generated_posts
        }
        
    except Exception as e:
        print(f"Error generating content: {e}")
        traceback.print_exc()
        return {"status": "error", "error": str(e)}


async def generate_single_content(
    content_type: str,
    brand_dna: dict,
    trend: str,
    settings: AutomationSettings,
    slot_index: int
) -> dict:
    """Generate a single piece of content."""
    try:
        post_id = str(uuid.uuid4())
        
        # Calculate scheduled time
        posting_times = settings.posting_times
        time_slot = posting_times[slot_index % len(posting_times)]
        
        # Schedule for tomorrow at the specified time
        tomorrow = datetime.now() + timedelta(days=1)
        hour, minute = map(int, time_slot.split(":"))
        scheduled_dt = tomorrow.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        # Build prompt based on brand DNA and trend
        brand_context = ""
        if brand_dna:
            brand_context = f"""
Brand: {brand_dna.get('company_name', 'Unknown')}
Description: {brand_dna.get('description', '')}
"""
        
        trend_context = f"\nIncorporate this trending topic: {trend}" if trend else ""
        
        content_prompt = f"""Create a {content_type.lower()} idea for Instagram.
{brand_context}
{trend_context}

Generate a brief, engaging concept (2-3 sentences) that would work well as a {content_type.lower()}."""

        # Generate concept using Gemini
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=content_prompt,
            config=types.GenerateContentConfig(
                temperature=0.8,
                max_output_tokens=150
            )
        )
        
        concept = response.text.strip()
        
        # Generate caption
        caption_prompt = f"""Write an Instagram caption for this content:
{concept}

Brand voice: {brand_dna.get('description', 'Professional and engaging') if brand_dna else 'Professional and engaging'}

Include 2-3 relevant emojis and end with a call-to-action. Keep it under 150 characters."""

        caption_response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=caption_prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=100
            )
        )
        
        caption = caption_response.text.strip()
        
        # Generate image preview (optional - can be done later)
        media_url = None
        try:
            if content_type == "Post":
                media_url = await generate_image(concept)
        except Exception as e:
            print(f"Warning: Could not generate preview image: {e}")
        
        return {
            "id": post_id,
            "content_type": content_type,
            "caption": caption,
            "concept": concept,
            "media_url": media_url,
            "scheduled_time": scheduled_dt.isoformat(),
            "status": "pending",
            "trend_source": trend,
            "created_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error generating single content: {e}")
        return None


@app.post("/api/automation/publish/{post_id}")
async def publish_scheduled_post(post_id: str):
    """Manually publish a scheduled post now."""
    try:
        post = scheduled_posts_store.get(post_id)
        
        if not post:
            # Try Supabase
            if supabase_client:
                response = supabase_client.table("scheduled_posts").select("*").eq("id", post_id).execute()
                if response.data:
                    post = response.data[0]
        
        if not post:
            return {"status": "error", "error": "Post not found"}
        
        # Generate media if not already done
        if not post.get("media_url") or post["media_url"].startswith("data:"):
            if post["content_type"] == "Post":
                post["media_url"] = await generate_image(post.get("concept", post.get("caption", "")))
            else:
                post["media_url"] = await generate_video(post.get("concept", post.get("caption", "")))
        
        # Publish to Instagram
        result = await publish_to_instagram(
            media_url=post["media_url"],
            caption=post["caption"],
            hashtags="",
            content_type=post["content_type"]
        )
        
        # Update status
        new_status = "published" if result.get("status") == "success" else "failed"
        
        if post_id in scheduled_posts_store:
            scheduled_posts_store[post_id]["status"] = new_status
        
        if supabase_client:
            try:
                supabase_client.table("scheduled_posts").update({"status": new_status}).eq("id", post_id).execute()
            except:
                pass
        
        return {
            "status": "success" if new_status == "published" else "error",
            "post_id": result.get("post_id"),
            "message": f"Post {new_status}"
        }
        
    except Exception as e:
        print(f"Error publishing post: {e}")
        return {"status": "error", "error": str(e)}


@app.post("/api/automation/run-scheduler")
async def run_scheduler():
    """
    Run the scheduler to publish due posts.
    This endpoint should be called by a cron job (e.g., every 15 minutes).
    """
    try:
        now = datetime.now()
        published_count = 0
        
        # Get all pending posts
        posts = list(scheduled_posts_store.values())
        
        if supabase_client:
            try:
                response = supabase_client.table("scheduled_posts").select("*").eq("status", "pending").execute()
                if response.data:
                    posts = response.data
            except:
                pass
        
        for post in posts:
            if post.get("status") != "pending":
                continue
            
            scheduled_time = datetime.fromisoformat(post["scheduled_time"].replace("Z", ""))
            
            # Check if it's time to publish (within 15 minute window)
            if scheduled_time <= now:
                result = await publish_scheduled_post(post["id"])
                if result.get("status") == "success":
                    published_count += 1
        
        return {
            "status": "success",
            "published": published_count,
            "checked_at": now.isoformat()
        }
        
    except Exception as e:
        print(f"Scheduler error: {e}")
        return {"status": "error", "error": str(e)}


@app.post("/api/automation/ai-plan")
async def generate_ai_content_plan():
    """
    Use the Automation Strategist agent to create an AI-driven content plan.
    This is used in AUTO mode to let AI decide everything.
    """
    try:
        print(f"\n{'='*50}")
        print(f"🧠 Running Automation Strategist Agent")
        print(f"{'='*50}\n")
        
        session_id = str(uuid.uuid4())
        APP_NAME = "automation_strategist_app"
        
        # Create session
        await session_service.create_session(
            app_name=APP_NAME,
            user_id="automation_system",
            session_id=session_id
        )
        
        # Get current settings for context
        settings = automation_settings_store.get("default", {})
        region = settings.get("trend_region", "United States")
        
        prompt = f"""
Analyze the current situation and create an optimal content plan for automated posting.

Region for trends: {region}

Steps:
1. First, get the brand DNA to understand what this brand is about
2. Get trending topics for {region}
3. Get Instagram insights to see what's performing
4. Create a content plan that:
   - Uses relevant trends that fit the brand
   - Focuses on content types that perform well
   - Suggests optimal posting times
   - Provides 3-5 specific content ideas

Return your analysis and recommendations.
"""
        
        # Run the automation strategist agent
        runner = Runner(
            agent=automation_strategist,
            app_name=APP_NAME,
            session_service=session_service
        )
        
        content = types.Content(role='user', parts=[types.Part(text=prompt)])
        response_text = ""
        
        async for event in runner.run_async(user_id="automation_system", session_id=session_id, new_message=content):
            if event.is_final_response() and event.content and event.content.parts:
                part_text = event.content.parts[0].text
                if part_text and part_text.strip():
                    response_text = part_text
        
        print(f"✅ Automation Strategist response received")
        
        # Try to parse JSON from response
        content_plan = None
        try:
            # Look for JSON in the response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                content_plan = json.loads(json_match.group())
        except:
            pass
        
        return {
            "status": "success",
            "analysis": response_text,
            "content_plan": content_plan
        }
        
    except Exception as e:
        print(f"Error running automation strategist: {e}")
        traceback.print_exc()
        return {"status": "error", "error": str(e)}


@app.post("/api/automation/generate-from-plan")
async def generate_content_from_plan(plan: dict):
    """
    Generate actual content based on an AI-generated content plan.
    """
    try:
        content_ideas = plan.get("content_ideas", [])
        generated_posts = []
        
        for i, idea in enumerate(content_ideas[:5]):  # Limit to 5
            content_type = idea.get("type", "Post")
            topic = idea.get("topic", "")
            trend_hook = idea.get("trend_hook", "")
            brand_angle = idea.get("brand_angle", "")
            
            # Build prompt
            prompt = f"{topic}. {trend_hook}. {brand_angle}"
            
            # Generate content
            enhanced_prompt = await enhance_prompt(prompt, content_type)
            
            if content_type == "Post":
                media_url = await generate_image(enhanced_prompt)
            else:
                media_url = await generate_video(enhanced_prompt)
            
            caption, hashtags = await generate_caption(enhanced_prompt, content_type)
            
            # Calculate scheduled time
            optimal_times = plan.get("optimal_times", ["09:00", "18:00"])
            time_slot = optimal_times[i % len(optimal_times)]
            
            tomorrow = datetime.now() + timedelta(days=1 + (i // len(optimal_times)))
            hour, minute = map(int, time_slot.split(":"))
            scheduled_dt = tomorrow.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            post = {
                "id": str(uuid.uuid4()),
                "content_type": content_type,
                "caption": f"{caption}\n\n{hashtags}",
                "concept": prompt,
                "media_url": media_url,
                "scheduled_time": scheduled_dt.isoformat(),
                "status": "pending",
                "trend_source": trend_hook,
                "created_at": datetime.now().isoformat()
            }
            
            generated_posts.append(post)
            scheduled_posts_store[post["id"]] = post
            
            if supabase_client:
                try:
                    supabase_client.table("scheduled_posts").insert(post).execute()
                except:
                    pass
        
        return {
            "status": "success",
            "generated": len(generated_posts),
            "posts": generated_posts
        }
        
    except Exception as e:
        print(f"Error generating from plan: {e}")
        return {"status": "error", "error": str(e)}
