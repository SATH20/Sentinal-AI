import os
import json
import time
import requests
import boto3
from botocore.config import Config
from dotenv import load_dotenv
from supabase import create_client
from pytrends.request import TrendReq
from google.adk.tools.tool_context import ToolContext

load_dotenv()

# =========================================================
# 1. SETUP CLIENTS (R2 & SUPABASE)
# =========================================================

# Cloudflare R2 Client (SentinalAI)
r2_client = boto3.client(
    service_name="s3",
    region_name="auto",
    endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ.get("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.environ.get("R2_SECRET_ACCESS_KEY")
)

# Supabase Client (Sento Features)
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

if not supabase:
    print("⚠️ WARNING: Supabase credentials missing. Brand/Analytics tools will fail.")

# =========================================================
# 2. SENTINALAI CORE TOOLS (R2 & INSTAGRAM)
# =========================================================

def r2_upload(
    file_name: str,
    content_type: str,
    file_bytes: bytes,
    tool_context: ToolContext
) -> dict:
    """Uploads media to Cloudflare R2 and stores the URL."""
    try:
        r2_client.put_object(
            Bucket=os.environ.get("R2_BUCKET_NAME"),
            Key=file_name,
            Body=file_bytes,
            ContentType=content_type
        )
        public_url = f"{os.environ.get('R2_PUBLIC_URL')}/{file_name}"
        tool_context.state["final_media_url"] = public_url
        return {"status": "success", "url": public_url}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def publish_to_instagram(
    media_type: str,
    caption: str,
    location_id: str | None = None,
    tool_context: ToolContext | None = None
) -> dict:
    """Publishes uploaded media to Instagram."""
    if not tool_context:
        return {"status": "error", "message": "Tool context is missing"}

    media_url = tool_context.state.get("final_media_url")
    ig_business_id = os.environ.get("INSTAGRAM_BUSINESS_ID")
    access_token = os.environ.get("INSTAGRAM_ACCESS_TOKEN")
    
    if not ig_business_id or not access_token:
         return {"status": "error", "message": "Instagram credentials missing"}

    api_base = f"https://graph.facebook.com/v21.0/{ig_business_id}"

    try:
        payload = {"caption": caption, "access_token": access_token}
        if media_type == "IMAGE":
            payload["image_url"] = media_url
        else:
            payload["video_url"] = media_url
            payload["media_type"] = "REELS" if media_type == "REEL" else "VIDEO"

        # Create Container
        container_response = requests.post(f"{api_base}/media", data=payload, timeout=30)
        container_response.raise_for_status()
        creation_id = container_response.json()["id"]

        # Wait for processing
        if media_type != "IMAGE":
            ready = False
            while not ready:
                time.sleep(5)
                status_response = requests.get(
                    f"https://graph.facebook.com/v21.0/{creation_id}",
                    params={"fields": "status_code", "access_token": access_token},
                    timeout=20
                )
                status_code = status_response.json().get("status_code")
                if status_code == "FINISHED": ready = True
                elif status_code == "ERROR": raise RuntimeError("Instagram processing failed")

        # Publish
        publish_response = requests.post(
            f"{api_base}/media_publish",
            data={"creation_id": creation_id, "access_token": access_token},
            timeout=30
        )
        publish_response.raise_for_status()
        return {"status": "published", "post_id": publish_response.json()["id"]}

    except Exception as e:
        return {"status": "error", "message": str(e)}

# =========================================================
# 3. SENTO TOOLS (BRAND DNA & ANALYTICS)
# =========================================================

def save_brand_dna_tool(company_name: str, description: str, brand_dna_json: str, image_url: str = "") -> dict:
    """Saves the Brand DNA to Supabase."""
    print(f"[TOOL] 🛠️ Saving DNA for: {company_name}")
    if not supabase: return {"status": "error", "message": "Database not connected"}
    
    try:
        supabase.table("brands").delete().eq("company_name", company_name).execute()
        data = {
            "company_name": company_name,
            "description": description,
            "dna": brand_dna_json,
            "image_url": image_url
        }
        supabase.table("brands").insert(data).execute()
        return {"status": "success", "message": f"Brand DNA saved for {company_name}"}
    except Exception as e:
        print(f"[TOOL] ❌ Error: {str(e)}")
        return {"status": "error", "message": str(e)}

def get_brand_dna_tool(company_name: str) -> str:
    """Retrieves Brand DNA from Supabase."""
    print(f"[TOOL] 🔍 Fetching DNA for: {company_name}")
    if not supabase: return "Error: Database not connected"
    try:
        response = supabase.table("brands").select("dna").eq("company_name", company_name).execute()
        if response.data and len(response.data) > 0:
            return json.dumps(response.data[0]['dna'])
        else:
            return "Error: Brand DNA not found."
    except Exception as e:
        return f"Error fetching DNA: {str(e)}"

def get_trending_topics_tool(region: str = "India") -> str:
    """Fetches trending topics from Google Trends."""
    print(f"[TOOL] 📈 Checking trends for: {region}")
    try:
        pytrends = TrendReq(hl='en-US', tz=360)
        geo_map = {'United States': 'united_states', 'India': 'india'}
        geo_code = geo_map.get(region, 'united_states')
        trends_df = pytrends.trending_searches(pn=geo_code)
        top_5_trends = trends_df.head(5)[0].tolist()
        return f"Top 5 Trending Topics in {region}: {', '.join(top_5_trends)}"
    except Exception as e:
        print(f"[TOOL] ⚠️ Trend API Error (Using Fallback): {e}")
        return "Trending Topics: #AIRevolution, #SustainableLiving, #TechTrends, #MorningVibes, #StartupLife"

def get_instagram_insights_tool(time_range: str = "last_30_days") -> str:
    """Fetches mock analytics for The Strategist agent."""
    print(f"[TOOL] 📊 Fetching Instagram Insights for: {time_range}")
    mock_data = {
        "account_summary": { "reach": 15400, "reach_growth": "+12%", "accounts_engaged": 850 },
        "top_performing_posts": [
            { "type": "Reel", "theme": "Behind the Scenes", "insight": "High Share Rate" },
            { "type": "Carousel", "theme": "Product Showcase", "insight": "High Save Rate" }
        ],
        "low_performing_posts": [{ "type": "Static Image", "theme": "Educational", "insight": "Low Engagement" }]
    }
    return json.dumps(mock_data, indent=2)

def update_brand_strategy_tool(company_name: str, suggested_change: str, reasoning: str) -> str:
    """Updates brand strategy based on insights - saves to Supabase."""
    print(f"[TOOL] 🧠 Optimizing Brand Strategy: {suggested_change}")
    
    if not supabase:
        return "Error: Database not connected"
    
    try:
        # Fetch current brand DNA
        response = supabase.table("brands").select("*").eq("company_name", company_name).execute()
        
        if not response.data or len(response.data) == 0:
            # Try to get the latest brand if company name doesn't match
            response = supabase.table("brands").select("*").order("created_at", desc=True).limit(1).execute()
        
        if response.data and len(response.data) > 0:
            brand = response.data[0]
            current_dna = brand.get("dna", {})
            
            # Parse DNA if it's a string
            if isinstance(current_dna, str):
                try:
                    current_dna = json.loads(current_dna)
                except:
                    current_dna = {}
            
            # Add strategy insights to DNA
            if "strategy_insights" not in current_dna:
                current_dna["strategy_insights"] = []
            
            current_dna["strategy_insights"].append({
                "change": suggested_change,
                "reasoning": reasoning,
                "applied_at": str(time.time())
            })
            
            # Keep only last 5 insights
            current_dna["strategy_insights"] = current_dna["strategy_insights"][-5:]
            
            # Update in database
            supabase.table("brands").update({
                "dna": json.dumps(current_dna) if isinstance(current_dna, dict) else current_dna
            }).eq("id", brand["id"]).execute()
            
            print(f"[TOOL] ✅ Brand strategy updated in database")
            return f"SUCCESS: Brand DNA updated for {brand.get('company_name', 'Unknown')}. New Strategy Rule Applied: {suggested_change}"
        else:
            return f"Warning: No brand found to update. Suggestion noted: {suggested_change}"
            
    except Exception as e:
        print(f"[TOOL] ❌ Error updating strategy: {str(e)}")
        return f"Error updating brand strategy: {str(e)}"


# =========================================================
# 4. WEB ARCHITECT TOOLS
# =========================================================

def save_web_project_tool(user_id: str, project_name: str, generated_code: str, brand_id: str = None) -> dict:
    """Saves generated website code to Supabase."""
    print(f"[TOOL] 🌐 Saving web project: {project_name}")
    if not supabase:
        return {"status": "error", "message": "Database not connected"}
    
    try:
        data = {
            "user_id": user_id,
            "project_name": project_name,
            "generated_code": generated_code,
        }
        if brand_id:
            data["brand_id"] = brand_id
            
        result = supabase.table("web_projects").insert(data).execute()
        project_id = result.data[0]["id"] if result.data else None
        return {"status": "success", "project_id": project_id, "message": f"Project '{project_name}' saved"}
    except Exception as e:
        print(f"[TOOL] ❌ Error saving project: {str(e)}")
        return {"status": "error", "message": str(e)}


def get_web_projects_tool(user_id: str) -> list:
    """Retrieves all web projects for a user."""
    print(f"[TOOL] 📂 Fetching projects for user: {user_id}")
    if not supabase:
        return []
    
    try:
        response = supabase.table("web_projects").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"[TOOL] ❌ Error fetching projects: {str(e)}")
        return []


def get_web_project_by_id_tool(project_id: str) -> dict:
    """Retrieves a specific web project by ID."""
    print(f"[TOOL] 🔍 Fetching project: {project_id}")
    if not supabase:
        return {"status": "error", "message": "Database not connected"}
    
    try:
        response = supabase.table("web_projects").select("*").eq("id", project_id).execute()
        if response.data and len(response.data) > 0:
            return {"status": "success", "project": response.data[0]}
        return {"status": "error", "message": "Project not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def update_web_project_tool(project_id: str, generated_code: str = None, project_name: str = None, deployed_url: str = None) -> dict:
    """Updates an existing web project."""
    print(f"[TOOL] ✏️ Updating project: {project_id}")
    if not supabase:
        return {"status": "error", "message": "Database not connected"}
    
    try:
        data = {}
        if generated_code:
            data["generated_code"] = generated_code
        if project_name:
            data["project_name"] = project_name
        if deployed_url:
            data["deployed_url"] = deployed_url
            
        if not data:
            return {"status": "error", "message": "No fields to update"}
            
        supabase.table("web_projects").update(data).eq("id", project_id).execute()
        return {"status": "success", "message": "Project updated"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def delete_web_project_tool(project_id: str) -> dict:
    """Deletes a web project."""
    print(f"[TOOL] 🗑️ Deleting project: {project_id}")
    if not supabase:
        return {"status": "error", "message": "Database not connected"}
    
    try:
        supabase.table("web_projects").delete().eq("id", project_id).execute()
        return {"status": "success", "message": "Project deleted"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def generate_website_image_tool(prompt: str, image_type: str = "hero") -> dict:
    """
    Generates an AI image for use in websites and uploads to R2.
    
    Args:
        prompt: Description of the image to generate (e.g., "modern coffee shop interior with warm lighting")
        image_type: Type of image - "hero", "product", "background", "feature" (helps with sizing/style)
    
    Returns:
        dict with status and image_url
    """
    print(f"[TOOL] 🎨 Generating website image: {prompt[:50]}...")
    
    try:
        from google import genai
        from google.genai import types
        import base64
        import uuid
        
        # Initialize Gemini client
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return {"status": "error", "message": "GEMINI_API_KEY not configured"}
        
        client = genai.Client(api_key=api_key)
        
        # Enhance prompt based on image type
        style_hints = {
            "hero": "high-quality, professional, wide aspect ratio, suitable for website hero banner",
            "product": "clean background, product photography style, well-lit, centered",
            "background": "subtle, can work as background, not too busy, professional",
            "feature": "icon-style or illustration, clean, modern, professional",
            "food": "appetizing food photography, professional lighting, restaurant quality",
            "team": "professional headshot style, friendly, approachable",
        }
        
        style = style_hints.get(image_type, "professional, high-quality, suitable for website")
        enhanced_prompt = f"{prompt}. Style: {style}"
        
        # Generate image using Gemini
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=[f"Generate a high-quality image: {enhanced_prompt}"],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
                temperature=1.0,
            )
        )
        
        # Extract image from response
        image_data = None
        mime_type = "image/png"
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                image_data = part.inline_data.data
                mime_type = part.inline_data.mime_type or "image/png"
                break
        
        if not image_data:
            return {"status": "error", "message": "No image generated"}
        
        # Upload to R2
        r2_account_id = os.environ.get("R2_ACCOUNT_ID")
        r2_access_key = os.environ.get("R2_ACCESS_KEY_ID")
        r2_secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")
        r2_bucket = os.environ.get("R2_BUCKET_NAME")
        r2_public_url = os.environ.get("R2_PUBLIC_URL")
        
        if not all([r2_account_id, r2_access_key, r2_secret_key, r2_bucket, r2_public_url]):
            # Return as base64 data URL if R2 not configured
            base64_image = base64.b64encode(image_data).decode('utf-8')
            return {
                "status": "success",
                "image_url": f"data:{mime_type};base64,{base64_image}",
                "note": "R2 not configured, returning base64"
            }
        
        # Upload to R2
        r2 = boto3.client(
            's3',
            endpoint_url=f"https://{r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=r2_access_key,
            aws_secret_access_key=r2_secret_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
        
        ext = "png" if "png" in mime_type else "jpg"
        filename = f"web-architect/{uuid.uuid4()}.{ext}"
        
        r2.put_object(
            Bucket=r2_bucket,
            Key=filename,
            Body=image_data,
            ContentType=mime_type
        )
        
        public_url = f"{r2_public_url.rstrip('/')}/{filename}"
        print(f"[TOOL] ✅ Image uploaded: {public_url}")
        
        return {
            "status": "success",
            "image_url": public_url
        }
        
    except Exception as e:
        print(f"[TOOL] ❌ Image generation error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}