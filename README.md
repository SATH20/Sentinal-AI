# Sentinal AI 🤖

Hey there! Welcome to Sentinal AI - your personal social media assistant that actually works while you sleep.

## What's This All About?

You know how managing social media feels like a full-time job? Yeah, we felt that too. So we built something that handles it for you. Think of it as having a creative team, a social media manager, and a data analyst all rolled into one AI-powered platform.

## What Can It Do?

### The Cool Stuff

**Smart Content Creation**
- Just tell it what you want, and it creates Instagram posts and reels for you
- Generates professional images and videos using AI
- Writes captions that actually sound human (not like a robot wrote them)
- Picks the right hashtags based on what's trending

**Brand DNA**
- Upload your logo and describe your business
- The AI learns your brand's voice, colors, and style
- Every piece of content matches your brand perfectly
- No more "this doesn't feel like us" moments

**Auto-Posting**
- Connect your Instagram once
- Set it and forget it
- The AI posts at the best times for engagement
- You can approve posts before they go live (or let it run on autopilot)

**Analytics That Make Sense**
- See what's working and what's not
- Get actual insights, not just numbers
- The AI adjusts your strategy based on performance
- No PhD in data science required

**Website Builder**
- Need a landing page? Just describe it
- AI generates a complete, working website
- Uses your brand colors and style automatically
- Looks good on phones, tablets, and computers

## How It Works

```
You → Tell the AI what you want → AI creates everything → You approve (optional) → Posted!
```

That's literally it. No complicated dashboards, no 47-step processes, no headaches.

## The Tech Stack (For the Nerds)

**Frontend**
- Next.js 16 (React 19)
- Tailwind CSS for styling
- Framer Motion for smooth animations
- TypeScript because we like catching bugs early

**Backend**
- Python with FastAPI
- Google Gemini AI for content generation
- Supabase for data storage
- Cloudflare R2 for media storage

**AI Models**
- Gemini 2.0 Flash for text and strategy
- Gemini Image Generation for visuals
- Veo 2 for video content (when available)

## Getting Started

### What You'll Need

- Node.js (version 20 or newer)
- Python 3.11+
- A Gemini API key (free tier works fine)
- Instagram Business account
- Supabase account (free tier is plenty)

### Quick Setup

1. **Clone this thing**
```bash
git clone https://github.com/SATH20/Sentinal-AI.git
cd Sentinal-AI
```

2. **Install frontend stuff**
```bash
npm install
```

3. **Install backend stuff**
```bash
cd backend
pip install -r requirements.txt
```

4. **Set up your environment variables**

Create a `.env.local` file in the root:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

Create a `.env` file in the `backend` folder:
```
GEMINI_API_KEY=your_gemini_key
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_BUSINESS_ID=your_business_id
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
R2_ACCOUNT_ID=your_r2_account
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=your_r2_public_url
```

5. **Start the backend**
```bash
cd backend
python start_server.py
```

6. **Start the frontend** (in a new terminal)
```bash
npm run dev
```

7. **Open your browser**
Go to `http://localhost:3000` and you're good to go!

## How to Use It

### First Time Setup

1. Click "Get Started" on the homepage
2. Connect your Instagram account
3. Upload your logo and describe your brand
4. That's it - you're ready to create content!

### Creating Content

**Manual Mode:**
- Go to the Chat page
- Type what you want (e.g., "Create a post about our new coffee blend")
- Optionally upload a reference image
- Review the generated content
- Approve and post!

**Auto Mode:**
- Set your posting schedule
- Define your content themes
- Let the AI handle everything
- Check in whenever you want

### Managing Your Brand

- Go to the Brand page
- Update your brand info anytime
- The AI adapts to changes automatically
- See your brand DNA breakdown

### Building Websites

- Go to the Websites page
- Describe what you need
- Get a complete, working website
- Download the code or deploy it

## Architecture

Here's how everything fits together:

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
│                    (Web Browser)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS FRONTEND                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Chat   │  │  Brand   │  │ Library  │  │ Websites │   │
│  │   Page   │  │   Page   │  │   Page   │  │   Page   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AI AGENT SYSTEM                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │  Visual  │  │  Copy    │  │ Strategy │           │  │
│  │  │  Agent   │  │  Agent   │  │  Agent   │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Gemini  │  │ Supabase │  │    R2    │
│    AI    │  │ Database │  │ Storage  │
└──────────┘  └──────────┘  └──────────┘
        │
        ▼
┌──────────────┐
│  Instagram   │
│     API      │
└──────────────┘
```

## Data Flow

Here's what happens when you create a post:

```
1. You type: "Create a coffee shop post"
   │
   ▼
2. Frontend sends request to Backend
   │
   ▼
3. Backend fetches your Brand DNA from Supabase
   │
   ▼
4. Visual Agent enhances your prompt
   │
   ▼
5. Gemini AI generates a professional image
   │
   ▼
6. Copy Agent writes caption + hashtags
   │
   ▼
7. Image uploaded to R2 Storage
   │
   ▼
8. You see preview in the chat
   │
   ▼
9. You approve (or AI auto-posts)
   │
   ▼
10. Posted to Instagram via Graph API
    │
    ▼
11. Success! 🎉
```


## Common Questions

**Q: Is this free?**
A: The code is free. You'll need API keys for Gemini (free tier available), Instagram (free), and Supabase (free tier works great).

**Q: Can I use this for multiple brands?**
A: Right now it's designed for one brand per instance, but you can run multiple instances.

**Q: Does it work with other platforms besides Instagram?**
A: Currently Instagram only, but the architecture makes it easy to add more platforms.

**Q: Will it post weird stuff?**
A: Nope! You can review everything before it posts, and the AI is trained to stay on-brand.

**Q: Can I customize the AI's behavior?**
A: Absolutely! The agent instructions are in `backend/agents/agent.py` - tweak away!

## Contributing

Found a bug? Have an idea? Want to add a feature? 

1. Fork the repo
2. Create a branch (`git checkout -b cool-new-feature`)
3. Make your changes
4. Push it up (`git push origin cool-new-feature`)
5. Open a Pull Request

We're pretty chill about contributions. Just make sure your code works and doesn't break existing stuff.

## License

MIT License - do whatever you want with it. Build something cool and let us know!

## Need Help?

- Check the issues page on GitHub
- Read the integration guide (in the project)
- Or just open an issue and ask - we're friendly!

## Credits

Built with:
- Google Gemini AI
- Next.js & React
- FastAPI
- Supabase
- Cloudflare R2
- A lot of coffee ☕

---

Made with ❤️ by developers who were tired of manually posting to Instagram.

**Now go create some content!** 🚀
