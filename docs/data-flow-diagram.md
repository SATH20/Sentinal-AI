# Sentinal AI - Data Flow Diagrams

## Content Generation Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                    CONTENT GENERATION PIPELINE                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Step 1: User Input
┌──────────────────────────────────────────┐
│  User types: "Create a coffee shop post" │
│  Optional: Uploads reference image       │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 2: Frontend Processing
┌──────────────────────────────────────────┐
│  ChatArea.tsx                            │
│  • Validates input                       │
│  • Converts image to base64              │
│  • Prepares request payload              │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 3: API Request
┌──────────────────────────────────────────┐
│  POST /generate                          │
│  {                                       │
│    user_id: "user_1",                    │
│    session_id: "sess_123",               │
│    message: "Create a coffee shop post", │
│    content_type: "Post",                 │
│    image_data: "base64..."               │
│  }                                       │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 4: Fetch Brand DNA
┌──────────────────────────────────────────┐
│  Supabase Query                          │
│  SELECT * FROM brands                    │
│  ORDER BY created_at DESC                │
│  LIMIT 1                                 │
│                                          │
│  Returns:                                │
│  • Company name                          │
│  • Brand description                     │
│  • Brand DNA (colors, voice, style)      │
│  • Logo URL                              │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 5: Enhance Prompt
┌──────────────────────────────────────────┐
│  Gemini 2.0 Flash                        │
│  Input:                                  │
│  • User prompt                           │
│  • Brand DNA context                     │
│  • Reference image (if provided)         │
│                                          │
│  Process:                                │
│  • Analyzes brand guidelines             │
│  • Incorporates visual style             │
│  • Adds technical details                │
│  • Optimizes for AI generation           │
│                                          │
│  Output:                                 │
│  "Professional photograph of a cozy      │
│   coffee shop interior with warm         │
│   lighting, wooden tables, vintage      │
│   decor, shot with 35mm lens..."         │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 6: Generate Visual
┌──────────────────────────────────────────┐
│  Gemini Image Generation                 │
│  (or Veo 2 for videos)                   │
│                                          │
│  Input: Enhanced prompt                  │
│                                          │
│  Process:                                │
│  • Generates high-quality image          │
│  • Applies brand colors                  │
│  • Ensures composition quality           │
│                                          │
│  Output: Base64 encoded image            │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 7: Generate Caption
┌──────────────────────────────────────────┐
│  Gemini 2.0 Flash                        │
│  Input:                                  │
│  • Enhanced prompt                       │
│  • Brand voice guidelines                │
│  • Content type (Post/Reel)              │
│                                          │
│  Process:                                │
│  • Writes engaging caption               │
│  • Matches brand voice                   │
│  • Adds relevant emojis                  │
│  • Generates trending hashtags           │
│                                          │
│  Output:                                 │
│  Caption: "Start your morning right..."  │
│  Hashtags: "#coffee #morning #cozy..."   │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 8: Store Content
┌──────────────────────────────────────────┐
│  In-Memory Storage                       │
│  generated_content_store[content_id] = { │
│    media_url: "data:image/...",          │
│    caption: "...",                       │
│    hashtags: "...",                      │
│    enhanced_prompt: "..."                │
│  }                                       │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 9: Return Preview
┌──────────────────────────────────────────┐
│  Response to Frontend                    │
│  {                                       │
│    status: "success",                    │
│    content_id: "sess_123_456",           │
│    generated_media_url: "data:image...", │
│    caption: "Start your morning...",     │
│    hashtags: "#coffee #morning..."       │
│  }                                       │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 10: User Reviews
┌──────────────────────────────────────────┐
│  ChatArea displays:                      │
│  • Generated image preview               │
│  • Caption with hashtags                 │
│  • Approve/Reject buttons                │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 11: User Approves
┌──────────────────────────────────────────┐
│  POST /publish                           │
│  {                                       │
│    content_id: "sess_123_456",           │
│    approved: true                        │
│  }                                       │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 12: Upload to R2
┌──────────────────────────────────────────┐
│  Cloudflare R2 Storage                   │
│  • Decode base64 image                   │
│  • Generate unique filename              │
│  • Upload to bucket                      │
│  • Return public URL                     │
│                                          │
│  Output:                                 │
│  https://r2.example.com/uuid.jpg         │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 13: Publish to Instagram
┌──────────────────────────────────────────┐
│  Instagram Graph API                     │
│                                          │
│  1. Create media container               │
│     POST /{ig_id}/media                  │
│     { image_url, caption }               │
│                                          │
│  2. Wait for processing                  │
│     GET /{container_id}                  │
│     Check status_code                    │
│                                          │
│  3. Publish media                        │
│     POST /{ig_id}/media_publish          │
│     { creation_id }                      │
│                                          │
│  Output: post_id                         │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 14: Confirm Success
┌──────────────────────────────────────────┐
│  Response to Frontend                    │
│  {                                       │
│    status: "success",                    │
│    post_id: "ig_post_123456"             │
│  }                                       │
│                                          │
│  ChatArea shows:                         │
│  "✅ Posted successfully to Instagram!"  │
└──────────────────────────────────────────┘
```

## Brand DNA Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                      BRAND DNA EXTRACTION                             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Step 1: User Uploads Brand Info
┌──────────────────────────────────────────┐
│  Brand Page                              │
│  • Company name: "Brew & Co"             │
│  • Description: "Artisan coffee shop"    │
│  • Logo image upload                     │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 2: Send to Brand Manager Agent
┌──────────────────────────────────────────┐
│  POST /agent                             │
│  {                                       │
│    agent_type: "brand",                  │
│    input_text: "Company: Brew & Co..."   │
│  }                                       │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 3: AI Analyzes Brand
┌──────────────────────────────────────────┐
│  Brand Manager Agent                     │
│  (Gemini 2.0 Flash)                      │
│                                          │
│  Extracts:                               │
│  • Company name                          │
│  • Core values                           │
│  • Target audience                       │
│  • Brand personality                     │
│                                          │
│  Generates DNA:                          │
│  {                                       │
│    "voice": "Warm, friendly, artisan",  │
│    "tone": "Conversational, authentic", │
│    "colors": ["#8B4513", "#F5DEB3"],    │
│    "typography": "Modern serif",         │
│    "values": ["Quality", "Community"]   │
│  }                                       │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 4: Save to Database
┌──────────────────────────────────────────┐
│  save_brand_dna_tool()                   │
│                                          │
│  INSERT INTO brands (                    │
│    company_name,                         │
│    description,                          │
│    dna,                                  │
│    image_url,                            │
│    created_at                            │
│  ) VALUES (...)                          │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 5: Confirm to User
┌──────────────────────────────────────────┐
│  "✅ Brand DNA saved successfully!"      │
│  "Your content will now match your       │
│   brand's voice and style."              │
└──────────────────────────────────────────┘
```

## Website Generation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                    WEBSITE GENERATION PIPELINE                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Step 1: User Request
┌──────────────────────────────────────────┐
│  Websites Page                           │
│  User types: "Create a landing page      │
│  for my coffee shop with menu and        │
│  contact form"                           │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 2: API Request
┌──────────────────────────────────────────┐
│  POST /website                           │
│  {                                       │
│    user_id: "user_1",                    │
│    prompt: "Create a landing page...",   │
│    project_name: "Coffee Shop Site"      │
│  }                                       │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 3: Fetch Brand DNA
┌──────────────────────────────────────────┐
│  get_brand_dna_tool()                    │
│                                          │
│  Retrieves:                              │
│  • Brand colors                          │
│  • Typography style                      │
│  • Voice and tone                        │
│  • Logo URL                              │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 4: Generate Images
┌──────────────────────────────────────────┐
│  Web Architect Agent                     │
│  Calls generate_website_image_tool()     │
│                                          │
│  Image 1: Hero section                   │
│  Prompt: "Modern coffee shop interior    │
│  with warm lighting and wooden tables"   │
│  → Returns: hero_image_url               │
│                                          │
│  Image 2: Product showcase               │
│  Prompt: "Artisan coffee cup with latte  │
│  art on wooden table"                    │
│  → Returns: product_image_url            │
│                                          │
│  Image 3: Feature section                │
│  Prompt: "Coffee beans being roasted"    │
│  → Returns: feature_image_url            │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 5: Generate React Code
┌──────────────────────────────────────────┐
│  Web Architect Agent                     │
│  (Gemini 2.5 Flash)                      │
│                                          │
│  Generates:                              │
│  • Complete React component              │
│  • Tailwind CSS styling                  │
│  • Responsive design                     │
│  • Brand colors applied                  │
│  • Real image URLs embedded              │
│  • Lucide React icons                    │
│                                          │
│  Output: Full JSX code                   │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 6: Save Project
┌──────────────────────────────────────────┐
│  save_web_project_tool()                 │
│                                          │
│  INSERT INTO web_projects (              │
│    user_id,                              │
│    project_name,                         │
│    prompt,                               │
│    generated_code,                       │
│    created_at                            │
│  ) VALUES (...)                          │
│                                          │
│  Returns: project_id                     │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 7: Return to Frontend
┌──────────────────────────────────────────┐
│  Response                                │
│  {                                       │
│    status: "success",                    │
│    project_id: "proj_123",               │
│    generated_code: "export default...",  │
│    project_name: "Coffee Shop Site"      │
│  }                                       │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 8: Display Preview
┌──────────────────────────────────────────┐
│  WebPreview Component                    │
│  • Renders code in iframe                │
│  • Shows live preview                    │
│  • Provides download button              │
│  • Option to deploy                      │
└──────────────────────────────────────────┘
```

## Analytics & Strategy Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                    ANALYTICS & OPTIMIZATION                           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Fetch Instagram Insights
┌──────────────────────────────────────────┐
│  get_instagram_insights_tool()           │
│                                          │
│  Instagram Graph API:                    │
│  GET /{ig_id}/insights                   │
│  ?metric=impressions,reach,engagement    │
│                                          │
│  Returns:                                │
│  • Top performing posts                  │
│  • Engagement rates                      │
│  • Best posting times                    │
│  • Audience demographics                 │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 2: Analyze Trends
┌──────────────────────────────────────────┐
│  get_trending_topics_tool()              │
│                                          │
│  Fetches:                                │
│  • Current trending hashtags             │
│  • Popular content themes                │
│  • Viral formats                         │
│  • Regional trends                       │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 3: AI Analysis
┌──────────────────────────────────────────┐
│  Strategist Agent                        │
│  (Gemini 2.0 Flash)                      │
│                                          │
│  Compares:                               │
│  • Top posts vs low posts                │
│  • Engagement patterns                   │
│  • Content type performance              │
│  • Timing effectiveness                  │
│                                          │
│  Identifies:                             │
│  • What's working                        │
│  • What needs improvement                │
│  • Opportunities                         │
│  • Recommendations                       │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 4: Update Strategy
┌──────────────────────────────────────────┐
│  update_brand_strategy_tool()            │
│                                          │
│  Updates:                                │
│  • Content mix (posts vs reels)          │
│  • Posting frequency                     │
│  • Optimal times                         │
│  • Topic focus                           │
│  • Hashtag strategy                      │
│                                          │
│  Saves to database for future use        │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 5: Report to User
┌──────────────────────────────────────────┐
│  Analytics Dashboard                     │
│  Shows:                                  │
│  • Performance metrics                   │
│  • Strategy changes                      │
│  • Recommendations                       │
│  • Predicted improvements                │
└──────────────────────────────────────────┘
```

## Automation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                    AUTOMATED POSTING WORKFLOW                         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Schedule Trigger
┌──────────────────────────────────────────┐
│  Cron Job / Scheduler                    │
│  Runs at configured times                │
│  (e.g., 9 AM, 6 PM, 9 PM)                │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 2: Automation Strategist
┌──────────────────────────────────────────┐
│  Automation Strategist Agent             │
│                                          │
│  1. Fetches trending topics              │
│  2. Gets brand DNA                       │
│  3. Reviews recent performance           │
│  4. Decides content type                 │
│  5. Generates content plan               │
│                                          │
│  Output:                                 │
│  {                                       │
│    type: "Reel",                         │
│    topic: "Morning coffee routine",      │
│    trend_hook: "#MorningVibes",          │
│    brand_angle: "Artisan quality"        │
│  }                                       │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 3: Generate Content
┌──────────────────────────────────────────┐
│  Follows normal generation pipeline:     │
│  • Enhance prompt                        │
│  • Generate visual                       │
│  • Write caption                         │
│  • Upload to R2                          │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 4: Auto-Approve or Wait
┌──────────────────────────────────────────┐
│  If auto_mode = true:                    │
│    → Publish immediately                 │
│                                          │
│  If auto_mode = false:                   │
│    → Send notification to user           │
│    → Wait for approval                   │
│    → Publish after approval              │
└──────────────┬───────────────────────────┘
               │
               ▼
Step 5: Publish & Track
┌──────────────────────────────────────────┐
│  • Post to Instagram                     │
│  • Save post metadata                    │
│  • Schedule next post                    │
│  • Track performance                     │
└──────────────────────────────────────────┘
```

## Data Storage Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                      SUPABASE DATABASE SCHEMA                         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Table: brands
┌──────────────────────────────────────────┐
│  id              UUID PRIMARY KEY         │
│  user_id         TEXT                     │
│  company_name    TEXT                     │
│  description     TEXT                     │
│  dna             JSONB                    │
│  image_url       TEXT                     │
│  created_at      TIMESTAMP                │
│  updated_at      TIMESTAMP                │
└──────────────────────────────────────────┘

Table: web_projects
┌──────────────────────────────────────────┐
│  id              UUID PRIMARY KEY         │
│  user_id         TEXT                     │
│  project_name    TEXT                     │
│  prompt          TEXT                     │
│  generated_code  TEXT                     │
│  created_at      TIMESTAMP                │
│  updated_at      TIMESTAMP                │
└──────────────────────────────────────────┘

Table: content_library
┌──────────────────────────────────────────┐
│  id              UUID PRIMARY KEY         │
│  user_id         TEXT                     │
│  content_type    TEXT (Post/Reel)         │
│  media_url       TEXT                     │
│  caption         TEXT                     │
│  hashtags        TEXT                     │
│  post_id         TEXT (Instagram ID)      │
│  status          TEXT (draft/published)   │
│  created_at      TIMESTAMP                │
│  published_at    TIMESTAMP                │
└──────────────────────────────────────────┘

Table: automation_schedules
┌──────────────────────────────────────────┐
│  id              UUID PRIMARY KEY         │
│  user_id         TEXT                     │
│  enabled         BOOLEAN                  │
│  posting_times   JSONB                    │
│  content_mix     JSONB                    │
│  auto_approve    BOOLEAN                  │
│  created_at      TIMESTAMP                │
│  updated_at      TIMESTAMP                │
└──────────────────────────────────────────┘
```
