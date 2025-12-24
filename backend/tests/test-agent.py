import asyncio
import os
import time

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

# Load environment variables (equivalent to dotenv.config())
from dotenv import load_dotenv
load_dotenv()

# Import the ROOT agent (Sequential replacement)
# Ensure your agent file is named 'agent.py'
from agent import root_agent


# =========================================================
# TEST FUNCTION
# =========================================================

async def test_social_agent():
    # 1. Initialize Session Service & Runner
    session_service = InMemorySessionService()

    runner = Runner(
        agent=root_agent,
        app_name="OwnerStudioAI",
        session_service=session_service
    )

    user_id = "test_owner_01"
    # Use standard time for session ID to avoid loop clock dependency
    session_id = f"session_{int(time.time() * 1000)}"

    # 2. Create Session
    await session_service.create_session(
        app_name="OwnerStudioAI",
        user_id=user_id,
        session_id=session_id
    )

    # 3. Initial Prompt (Triggers visual → copy → location)
    user_prompt = (
        "Create a high-end photo for my new ergonomic drill. "
        "It should look like it's in a professional workshop with cinematic lighting."
    )

    print(f"\n[User]: {user_prompt}")

    user_message = types.Content(
        role="user",
        parts=[
            types.Part(text=user_prompt)
        ]
    )

    events = runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=user_message
    )

    # 4. Event Loop (WAIT for approval)
    async for event in events:
        if event.is_final_response():
            if event.content and event.content.parts:
                response_text = event.content.parts[0].text.strip()
                print(f"\n[Agent]: {response_text}")

            print("\n--- SYSTEM PAUSED: AWAITING APPROVAL ---")
            break

    # 5. Simulate User Approval (SAME SESSION)
    approval_prompt = "This looks perfect! Go ahead and post it to Instagram."
    print(f"\n[User]: {approval_prompt}")

    approval_message = types.Content(
        role="user",
        parts=[
            types.Part(text=approval_prompt)
        ]
    )

    approval_events = runner.run_async(
        user_id=user_id,
        session_id=session_id,  # SAME session to preserve state
        new_message=approval_message
    )

    async for event in approval_events:
        if event.is_final_response():
            if event.content and event.content.parts:
                print(f"\n[Agent]: {event.content.parts[0].text.strip()}")


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":
    asyncio.run(test_social_agent())