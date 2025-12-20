from google.adk.agents import Agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.adk.tools.tool_context import ToolContext
from google.genai import types
from agents.tools import r2_upload, google_maps_search, publish_to_instagram

import asyncio


# =========================================================
# TOOLS
# =========================================================

def r2_upload(media_type: str, prompt: str, tool_context: ToolContext) -> dict:
    """
    Generates visual media (image/video) and uploads it to R2 storage.

    Args:
        media_type (str): 'static' or 'motion'
        prompt (str): visual generation prompt

    Returns:
        dict: final media URL
    """

    media_url = f"https://r2.mock/{media_type}/{abs(hash(prompt))}.mp4"

    tool_context.state["final_media_url"] = media_url

    return {
        "status": "success",
        "final_media_url": media_url
    }


def google_maps_search(query: str) -> dict:
    """
    Finds a trending location related to the content.

    Args:
        query (str): content theme

    Returns:
        dict: location id
    """

    return {
        "status": "success",
        "location_id": "mock_place_90210"
    }


def publish_to_instagram(media_url: str, caption: str, location_id: str) -> dict:
    """
    Publishes the Instagram post.

    Args:
        media_url (str)
        caption (str)
        location_id (str)

    Returns:
        dict
    """

    return {
        "status": "posted",
        "post_id": "ig_post_123456"
    }


# =========================================================
# AGENTS
# =========================================================

visual_agent = Agent(
    name="StudioDirector",
    model="gemini-2.5-flash-image",
    description="Specialist in generating high-end visuals and managing R2 storage.",
    instruction="""
    You are a professional visual content creator for social media.
    
    When you receive a user prompt:
    1. If an image is provided, analyze it and enhance the user's request based on what you see
    2. Decide if the request needs motion (video/reel) or static (image/post) visual
    3. Generate appropriate media using r2_upload tool
    4. Provide a brief description of what you created
    5. Store the final_media_url in state for other agents
    
    Always be creative and professional in your visual generation.
    """,
    tools=[r2_upload]
)


copywriter_agent = Agent(
    name="SocialCopywriter",
    model="gemini-2.5-flash",
    description="Expert in viral captions and trending hashtags.",
    instruction="""
    You are a social media copywriting expert.
    
    Based on the generated visual and user's original request:
    1. Create a compelling, engaging caption that matches the content
    2. Add 8-12 relevant trending hashtags
    3. Keep the tone appropriate for the platform (Instagram)
    4. Make it shareable and engaging
    
    Format your response as:
    Caption: [your caption here]
    Hashtags: [hashtags here]
    """,
    output_key="final_caption"
)


location_agent = Agent(
    name="LocationScout",
    model="gemini-2.0-flash",
    description="Suggests trending locations for social media content.",
    instruction="Suggest a trending location based on the content and fetch its Google Maps ID.",
    tools=[google_maps_search]
)


posting_agent = Agent(
    name="AccountManager",
    model="gemini-2.0-flash",
    description="Manages the final Instagram publication process.",
    instruction="""
    You are the final step in the content creation pipeline.
    
    Your job is to:
    1. Present a summary of what was created (visual + caption + location)
    2. Ask for user approval before posting
    3. Wait for explicit confirmation ("Approve", "Post it", "Yes", etc.)
    4. Only use publish_to_instagram tool after getting approval
    5. Provide confirmation when posted successfully
    
    Always wait for user approval - never post automatically!
    """,
    tools=[publish_to_instagram]
)


# =========================================================
# ROOT AGENT (SEQUENTIAL ORCHESTRATION)
# =========================================================

root_agent = Agent(
    name="InstagramAutomationSuite",
    model="gemini-2.5-flash",
    description="End-to-end Instagram automation pipeline.",
    instruction="""
    You are the orchestrator of an Instagram content creation pipeline.
    
    Execute this workflow in order:
    1. **Visual Creation**: Generate appropriate visual content (image/video)
    2. **Caption Writing**: Create engaging caption with hashtags
    3. **Location Finding**: Find a relevant trending location
    4. **User Approval**: Present everything and wait for approval
    5. **Publishing**: Post to Instagram only after approval
    
    Always be helpful, creative, and wait for user approval before posting.
    Provide updates on each step so the user knows what's happening.
    """,
    sub_agents=[
        visual_agent,
        copywriter_agent,
        location_agent,
        posting_agent
    ]
)


# =========================================================
# RUNNER SETUP
# =========================================================

session_service = InMemorySessionService()

APP_NAME = "instagram_automation"
USER_ID = "user_1"
SESSION_ID = "session_001"


async def main():
   try:
    await session_service.create_session(
        app_name="OwnerStudioAI",
        user_id=req.user_id,
        session_id=req.session_id
    )
   except Exception as e:
    # Ignore duplicate session creation
    if "already exists" not in str(e):
        raise

    runner = Runner(
        agent=root_agent,
        app_name=APP_NAME,
        session_service=session_service
    )

    user_message = types.Content(
        role="user",
        parts=[
            types.Part(
                text="Create a cinematic reel for a coffee brand in Goa"
            )
        ]
    )

    async for event in runner.run_async(
        user_id=USER_ID,
        session_id=SESSION_ID,
        new_message=user_message
    ):
        if event.is_final_response():
            if event.content and event.content.parts:
                print(event.content.parts[0].text)


if __name__ == "__main__":
    asyncio.run(main())