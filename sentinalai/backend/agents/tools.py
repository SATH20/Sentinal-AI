import os
import time
import requests
import boto3

from google.adk.tools.tool_context import ToolContext


# =========================================================
# CLOUDFLARE R2 CLIENT (S3 COMPATIBLE)
# =========================================================

r2_client = boto3.client(
    service_name="s3",
    region_name="auto",
    endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ.get("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.environ.get("R2_SECRET_ACCESS_KEY")
)


# =========================================================
# TOOL: R2 MEDIA UPLOAD
# =========================================================

def r2_upload(
    file_name: str,
    content_type: str,
    file_bytes: bytes,
    tool_context: ToolContext
) -> dict:
    """
    Uploads media bytes to Cloudflare R2 and stores the public URL in state.

    Args:
        file_name (str): Name of the file to upload
        content_type (str): MIME type (image/jpeg, video/mp4, etc.)
        file_bytes (bytes): Raw media bytes
        tool_context (ToolContext): ADK context for state access

    Returns:
        dict: upload status and public URL
    """

    r2_client.put_object(
        Bucket=os.environ.get("R2_BUCKET_NAME"),
        Key=file_name,
        Body=file_bytes,
        ContentType=content_type
    )

    public_url = f"{os.environ.get('R2_PUBLIC_URL')}/{file_name}"

    tool_context.state["final_media_url"] = public_url

    return {
        "status": "success",
        "url": public_url
    }


# =========================================================
# TOOL: GOOGLE MAPS SEARCH (MOCK / EXTENDABLE)
# =========================================================

def google_maps_search(query: str) -> dict:
    """
    Searches for a location to tag in the Instagram post.

    Args:
        query (str): Location or theme query

    Returns:
        dict: Instagram-compatible location metadata
    """

    return {
        "location_name": query,
        "instagram_location_id": "123456789"
    }


# =========================================================
# TOOL: INSTAGRAM PUBLISH
# =========================================================

def publish_to_instagram(
    media_type: str,
    caption: str,
    location_id: str | None = None,
    tool_context: ToolContext | None = None
) -> dict:
    """
    Publishes uploaded media to Instagram after approval.

    Args:
        media_type (str): IMAGE | VIDEO | REEL
        caption (str): Instagram caption
        location_id (str, optional): Instagram location ID
        tool_context (ToolContext): Access to stored media URL

    Returns:
        dict: publish status and post ID
    """
    if not tool_context:
        return {"status": "error", "message": "Tool context is missing"}

    media_url = tool_context.state.get("final_media_url")
    
    ig_business_id = os.environ.get("INSTAGRAM_BUSINESS_ID")
    access_token = os.environ.get("INSTAGRAM_ACCESS_TOKEN")
    
    if not ig_business_id or not access_token:
         return {"status": "error", "message": "Instagram credentials missing in environment"}

    api_base = f"https://graph.facebook.com/v21.0/{ig_business_id}"

    try:
        payload = {
            "caption": caption,
            "access_token": access_token
        }

        if media_type == "IMAGE":
            payload["image_url"] = media_url
        else:
            payload["video_url"] = media_url
            payload["media_type"] = "REELS" if media_type == "REEL" else "VIDEO"

        if location_id:
            payload["location_id"] = location_id

        container_response = requests.post(
            f"{api_base}/media",
            data=payload,
            timeout=30
        )
        container_response.raise_for_status()

        creation_id = container_response.json()["id"]

        # Poll processing status for videos/reels
        if media_type != "IMAGE":
            ready = False
            while not ready:
                time.sleep(5)

                status_response = requests.get(
                    f"https://graph.facebook.com/v21.0/{creation_id}",
                    params={
                        "fields": "status_code",
                        "access_token": access_token
                    },
                    timeout=20
                )
                status_response.raise_for_status()

                status_code = status_response.json()["status_code"]

                if status_code == "FINISHED":
                    ready = True
                elif status_code == "ERROR":
                    raise RuntimeError("Instagram media processing failed")

        publish_response = requests.post(
            f"{api_base}/media_publish",
            data={
                "creation_id": creation_id,
                "access_token": access_token
            },
            timeout=30
        )
        publish_response.raise_for_status()

        return {
            "status": "published",
            "post_id": publish_response.json()["id"]
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }