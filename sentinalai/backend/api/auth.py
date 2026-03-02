"""
Facebook OAuth Authentication for Instagram Business API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import os

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory user store (use a database in production)
users_db = {}

# Facebook OAuth Config
FACEBOOK_APP_ID = os.environ.get("FACEBOOK_APP_ID", "")
FACEBOOK_APP_SECRET = os.environ.get("FACEBOOK_APP_SECRET", "")
FACEBOOK_REDIRECT_URI = os.environ.get("FACEBOOK_REDIRECT_URI", "http://localhost:3000/auth/callback")

class TokenExchangeRequest(BaseModel):
    code: str

class UserResponse(BaseModel):
    user_id: str
    name: str
    email: Optional[str] = None
    instagram_business_id: Optional[str] = None
    facebook_page_id: Optional[str] = None
    profile_picture: Optional[str] = None
    is_connected: bool = False

class AuthResponse(BaseModel):
    success: bool
    user: Optional[UserResponse] = None
    error: Optional[str] = None


@router.get("/facebook/url")
async def get_facebook_login_url():
    """Get the Facebook OAuth login URL"""
    if not FACEBOOK_APP_ID:
        raise HTTPException(status_code=500, detail="Facebook App ID not configured")
    
    # Required permissions for Instagram Business API
    scopes = [
        "email",
        "public_profile",
        "pages_show_list",
        "pages_read_engagement",
        "instagram_basic",
        "instagram_content_publish",
        "instagram_manage_comments",
        "instagram_manage_insights",
        "business_management"
    ]
    
    oauth_url = (
        f"https://www.facebook.com/v21.0/dialog/oauth?"
        f"client_id={FACEBOOK_APP_ID}"
        f"&redirect_uri={FACEBOOK_REDIRECT_URI}"
        f"&scope={','.join(scopes)}"
        f"&response_type=code"
    )
    
    return {"url": oauth_url}


@router.post("/facebook/callback")
async def facebook_callback(request: TokenExchangeRequest) -> AuthResponse:
    """Exchange Facebook auth code for access token and get user info"""
    
    if not FACEBOOK_APP_ID or not FACEBOOK_APP_SECRET:
        return AuthResponse(success=False, error="Facebook app not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            # Step 1: Exchange code for access token
            token_response = await client.get(
                "https://graph.facebook.com/v21.0/oauth/access_token",
                params={
                    "client_id": FACEBOOK_APP_ID,
                    "client_secret": FACEBOOK_APP_SECRET,
                    "redirect_uri": FACEBOOK_REDIRECT_URI,
                    "code": request.code
                }
            )
            
            if token_response.status_code != 200:
                return AuthResponse(success=False, error=f"Token exchange failed: {token_response.text}")
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                return AuthResponse(success=False, error="No access token received")
            
            # Step 2: Get long-lived token
            long_token_response = await client.get(
                "https://graph.facebook.com/v21.0/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": FACEBOOK_APP_ID,
                    "client_secret": FACEBOOK_APP_SECRET,
                    "fb_exchange_token": access_token
                }
            )
            
            if long_token_response.status_code == 200:
                long_token_data = long_token_response.json()
                access_token = long_token_data.get("access_token", access_token)
            
            # Step 3: Get user profile
            user_response = await client.get(
                "https://graph.facebook.com/v21.0/me",
                params={
                    "fields": "id,name,email,picture",
                    "access_token": access_token
                }
            )
            
            if user_response.status_code != 200:
                return AuthResponse(success=False, error="Failed to get user profile")
            
            user_data = user_response.json()
            user_id = user_data.get("id")
            
            # Step 4: Get Facebook Pages
            pages_response = await client.get(
                f"https://graph.facebook.com/v21.0/{user_id}/accounts",
                params={"access_token": access_token}
            )
            
            facebook_page_id = None
            page_access_token = None
            instagram_business_id = None
            
            if pages_response.status_code == 200:
                pages_data = pages_response.json()
                pages = pages_data.get("data", [])
                
                if pages:
                    # Use the first page (or let user choose in production)
                    page = pages[0]
                    facebook_page_id = page.get("id")
                    page_access_token = page.get("access_token")
                    
                    # Step 5: Get Instagram Business Account linked to the page
                    ig_response = await client.get(
                        f"https://graph.facebook.com/v21.0/{facebook_page_id}",
                        params={
                            "fields": "instagram_business_account",
                            "access_token": page_access_token
                        }
                    )
                    
                    if ig_response.status_code == 200:
                        ig_data = ig_response.json()
                        ig_account = ig_data.get("instagram_business_account", {})
                        instagram_business_id = ig_account.get("id")
            
            # Store user in memory (use database in production)
            users_db[user_id] = {
                "user_id": user_id,
                "name": user_data.get("name"),
                "email": user_data.get("email"),
                "profile_picture": user_data.get("picture", {}).get("data", {}).get("url"),
                "access_token": access_token,
                "page_access_token": page_access_token,
                "facebook_page_id": facebook_page_id,
                "instagram_business_id": instagram_business_id
            }
            
            return AuthResponse(
                success=True,
                user=UserResponse(
                    user_id=user_id,
                    name=user_data.get("name", ""),
                    email=user_data.get("email"),
                    instagram_business_id=instagram_business_id,
                    facebook_page_id=facebook_page_id,
                    profile_picture=user_data.get("picture", {}).get("data", {}).get("url"),
                    is_connected=instagram_business_id is not None
                )
            )
            
    except Exception as e:
        print(f"Auth error: {e}")
        import traceback
        traceback.print_exc()
        return AuthResponse(success=False, error=str(e))


@router.get("/user/{user_id}")
async def get_user(user_id: str) -> AuthResponse:
    """Get user info by ID"""
    user = users_db.get(user_id)
    
    if not user:
        return AuthResponse(success=False, error="User not found")
    
    return AuthResponse(
        success=True,
        user=UserResponse(
            user_id=user["user_id"],
            name=user["name"],
            email=user.get("email"),
            instagram_business_id=user.get("instagram_business_id"),
            facebook_page_id=user.get("facebook_page_id"),
            profile_picture=user.get("profile_picture"),
            is_connected=user.get("instagram_business_id") is not None
        )
    )


@router.post("/logout/{user_id}")
async def logout(user_id: str):
    """Logout user"""
    if user_id in users_db:
        del users_db[user_id]
    return {"success": True}


def get_user_credentials(user_id: str) -> dict:
    """Get user's Instagram credentials for publishing"""
    user = users_db.get(user_id)
    if not user:
        return None
    
    return {
        "access_token": user.get("page_access_token") or user.get("access_token"),
        "instagram_business_id": user.get("instagram_business_id")
    }
