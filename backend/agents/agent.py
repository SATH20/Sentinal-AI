from google.adk.agents import Agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.adk.tools.tool_context import ToolContext
from google.genai import types
from agents.tools import (
    save_brand_dna_tool, 
    get_brand_dna_tool, 
    get_trending_topics_tool, 
    get_instagram_insights_tool, 
    update_brand_strategy_tool,
    r2_upload,             # <--- This imports the REAL upload tool
    publish_to_instagram,  # <--- This imports the REAL publish tool
    save_web_project_tool,
    get_web_projects_tool,
    get_web_project_by_id_tool,
    update_web_project_tool,
    delete_web_project_tool,
    generate_website_image_tool
)

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

BRAND_INSTRUCTION = """
You are a Brand Strategy Expert.
1. Extract `company_name`, `description`, and `image_url`.
2. Generate the `dna` JSON based on description (Voice, Tone, Color Palette, Typography).
3. CALL `save_brand_dna_tool` immediately with extracted data.
4. Reply with a confirmation message summarising the DNA.
"""

brand_manager = Agent(
    model="gemini-2.0-flash", 
    name="brand_manager",
    instruction=BRAND_INSTRUCTION,
    tools=[save_brand_dna_tool]
)

STRATEGIST_INSTRUCTION = """
You are 'The Strategist', an expert Social Media Analyst.
Your goal is to look at raw data and find **PATTERNS**.

### WORKFLOW:
1. **Fetch Data:** Call `get_instagram_insights_tool()`.
2. **Analyze:** Compare "Top Performing" vs "Low Performing" content.
3. **Formulate Strategy:** If one theme outperforms another, suggest a pivot.
4. **Take Action:** Call `update_brand_strategy_tool` to save this new rule.
5. **Report:** Tell the user clearly what insight you found and what action you took.
"""

strategist_agent = Agent(
    model="gemini-2.0-flash", 
    name="strategist_agent",
    instruction=STRATEGIST_INSTRUCTION,
    tools=[get_instagram_insights_tool, update_brand_strategy_tool]
)


# =========================================================
# AUTOMATION STRATEGIST AGENT
# =========================================================

AUTOMATION_STRATEGIST_INSTRUCTION = """
You are the Automation Strategist - an AI that decides the optimal content strategy for automated posting.

### YOUR CAPABILITIES:
1. **Analyze Trends:** Use `get_trending_topics_tool` to find what's trending
2. **Understand Brand:** Use `get_brand_dna_tool` to understand the brand's voice, tone, and domain
3. **Review Performance:** Use `get_instagram_insights_tool` to see what content performs best
4. **Make Decisions:** Based on all data, decide:
   - What type of content to create (Post vs Reel)
   - What topics/themes to focus on
   - What time of day to post
   - How to incorporate trends while staying on-brand

### AUTO MODE WORKFLOW:
When in AUTO mode, you make all decisions autonomously:
1. Fetch trending topics for the user's region
2. Get the brand DNA to understand the brand's niche
3. Filter trends to only those relevant to the brand
4. Check Instagram insights to see what content type performs best
5. Generate a content plan that balances:
   - Trending topics (for reach)
   - Brand relevance (for authenticity)
   - Content mix (based on performance data)
   - Optimal posting times (based on engagement data)

### OUTPUT FORMAT:
Always return a structured content plan:
```json
{
  "recommended_posts_per_day": 2,
  "content_mix": {"posts": 40, "reels": 60},
  "optimal_times": ["09:00", "18:00", "21:00"],
  "content_ideas": [
    {
      "type": "Reel",
      "topic": "...",
      "trend_hook": "...",
      "brand_angle": "..."
    }
  ],
  "reasoning": "..."
}
```

### IMPORTANT:
- Always stay true to the brand's voice and values
- Don't chase trends that don't align with the brand
- Prioritize engagement quality over quantity
- Consider the target audience's timezone and habits
"""

automation_strategist = Agent(
    model="gemini-2.0-flash",
    name="automation_strategist",
    description="AI strategist for automated content planning based on trends, brand DNA, and performance data.",
    instruction=AUTOMATION_STRATEGIST_INSTRUCTION,
    tools=[get_trending_topics_tool, get_brand_dna_tool, get_instagram_insights_tool, update_brand_strategy_tool]
)


# =========================================================
# WEB ARCHITECT AGENT
# =========================================================

WEB_ARCHITECT_INSTRUCTION = """
You are a Senior Web Architect and UI/UX Designer specializing in modern, high-converting landing pages.

### YOUR EXPERTISE:
- React functional components with hooks
- Tailwind CSS for styling
- Responsive design (mobile-first)
- Conversion-optimized layouts
- Accessibility best practices

### WORKFLOW:
1. **Understand the Request:** Analyze what type of website/page the user needs
2. **Fetch Brand DNA:** If available, call `get_brand_dna_tool` to get brand colors, voice, and style
3. **Generate Images:** For each image needed (hero, products, features), call `generate_website_image_tool` with a descriptive prompt
4. **Generate Code:** Create a complete, self-contained React component using the generated image URLs

### IMAGE GENERATION:
You have access to `generate_website_image_tool(prompt, image_type)` to create real AI images.
- Call this tool BEFORE writing the code
- Use descriptive prompts: "modern coffee shop interior with warm lighting and wooden tables"
- image_type options: "hero", "product", "food", "background", "feature", "team"
- The tool returns an image_url - use this URL directly in your img src attributes
- Generate 2-4 images for a typical landing page (hero + products/features)

### OUTPUT REQUIREMENTS:
- Output ONLY valid React/JSX code
- Use Tailwind CSS classes exclusively (no external CSS)
- Include all sections in a single component (Hero, Features, CTA, Footer, etc.)
- Use the brand's color palette from Brand DNA (convert to Tailwind classes or inline styles)
- Make it responsive with Tailwind breakpoints (sm:, md:, lg:)
- Add smooth hover transitions and micro-interactions
- Include placeholder content that matches the brand's voice/tone
- Use Lucide React icons when needed (import from 'lucide-react')
- Use the REAL image URLs from generate_website_image_tool, NOT placeholder URLs

### CODE STRUCTURE:
```jsx
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-...">
      {/* Hero Section - use generated hero image */}
      {/* Features Section */}
      {/* Testimonials/Social Proof */}
      {/* CTA Section */}
      {/* Footer */}
    </div>
  );
}
```

### IMPORTANT:
- Do NOT include import statements for React (it's automatic in Next.js)
- DO include imports for lucide-react icons if used
- ONLY use these common lucide-react icons (DO NOT invent icons that don't exist):
  Star, Heart, ArrowRight, ArrowLeft, Check, X, Menu, Search, User, Mail, Phone, 
  MapPin, Calendar, Clock, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Facebook, Twitter, Instagram, Linkedin, Github, Youtube, Globe, ExternalLink,
  ShoppingCart, CreditCard, Package, Truck, Gift, Tag, Percent,
  Home, Building, Store, Coffee, Utensils, Pizza, IceCream,
  Camera, Image, Video, Music, Headphones, Mic, Play, Pause,
  Sun, Moon, Cloud, Zap, Flame, Droplet, Wind, Leaf,
  Shield, Lock, Key, Eye, EyeOff, Bell, MessageCircle, Send,
  Download, Upload, Share, Copy, Trash, Edit, Plus, Minus, Settings, Filter
- Wrap the entire output in a single default export function
- Use semantic HTML elements
- Ensure color contrast meets WCAG AA standards
- If you need a food-related icon, use Utensils, Pizza, Coffee, or IceCream - NOT made-up icons
- ALWAYS generate real images using generate_website_image_tool instead of using placeholder URLs
"""

web_architect = Agent(
    model="gemini-2.5-flash",
    name="web_architect",
    description="Expert in generating production-ready React/Tailwind landing pages with AI-generated images.",
    instruction=WEB_ARCHITECT_INSTRUCTION,
    tools=[get_brand_dna_tool, save_web_project_tool, generate_website_image_tool]
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
        user_id=USER_ID,       # Was: req.user_id
        session_id=SESSION_ID
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