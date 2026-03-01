# Frontend-Backend Integration Guide

## Overview
This guide explains how the frontend chat interface connects to the backend AI agent system.

## Architecture

### Backend (Python/FastAPI)
- **Location**: `sentinalai/backend/`
- **Entry Point**: `api/main.py`
- **Port**: 8000
- **Key Features**:
  - CORS enabled for localhost:3000 and localhost:3001
  - Handles text + image uploads (base64 encoded)
  - Uses Google ADK for AI agent orchestration
  - Session management for conversation continuity

### Frontend (Next.js/React)
- **Location**: `sentinalai/`
- **Chat Component**: `components/chat/ChatArea.tsx`
- **API Client**: `lib/api/agent.ts`
- **Port**: 3001 (or 3000)
- **Key Features**:
  - Image upload support
  - Real-time chat interface
  - Loading states with progress indicators
  - Success/error handling

## How It Works

### 1. User Sends Message
```typescript
// User types message and optionally uploads image
const handleSend = async () => {
  const req = {
    user_id: 'user_1',
    session_id: session_id,
    message: `${contentType}: ${message}`,
    image_data: selectedImage || undefined, // Base64 string
  };
  
  const res = await sendChatRequest(req);
}
```

### 2. Backend Processes Request
```python
@app.post("/chat")
async def chat(req: ChatRequest):
    # Create session
    await session_service.create_session(...)
    
    # Prepare message with image if provided
    message_parts = [types.Part(text=req.message)]
    if req.image_data:
        image_bytes = base64.b64decode(...)
        message_parts.append(types.Part(inline_data=...))
    
    # Run agent pipeline
    async for event in runner.run_async(...):
        if event.is_final_response():
            return {"response": event.content.parts[0].text}
```

### 3. Agent Pipeline Executes
1. **Visual Agent**: Generates/processes images
2. **Copywriter Agent**: Creates captions and hashtags
3. **Location Agent**: Finds trending locations
4. **Posting Agent**: Waits for approval, then posts

### 4. Frontend Displays Response
```typescript
// Response is added to chat messages
const agentMessage: ChatMessage = {
  id: (Date.now() + 1).toString(),
  type: 'agent',
  content: res.response,
  timestamp: new Date()
};
setMessages(prev => [...prev, agentMessage]);
```

## Starting the Servers

### Backend
```bash
cd sentinalai/backend
python start_server.py
```
Server runs on: http://localhost:8080

### Frontend
```bash
cd sentinalai
npm run dev
```
Server runs on: http://localhost:3001

## API Endpoints

### POST /chat
**Request:**
```json
{
  "user_id": "user_1",
  "session_id": "sess_abc123",
  "message": "Post: Create a coffee shop image",
  "image_data": "data:image/jpeg;base64,/9j/4AAQ..." // Optional
}
```

**Response:**
```json
{
  "response": "I've created a beautiful coffee shop image...",
  "session_id": "sess_abc123"
}
```

### GET /health
**Response:**
```json
{
  "status": "ok"
}
```

## Features

### Image Upload
- Click the "+" button to upload an image
- Supported formats: JPEG, PNG, GIF, WebP
- Images are converted to base64 and sent to backend
- Backend can analyze images using Gemini vision capabilities

### Chat History
- Messages are stored in component state
- Each message shows timestamp
- User messages appear on the right (green)
- Agent messages appear on the left (dark)

### Loading States
- Progress indicators show current step
- Different steps for Post vs Reel
- Skeleton preview of content being generated

### Success State
- Shows confirmation when content is posted
- Displays which platforms were posted to
- Option to create another post

## Environment Variables

### Backend (.env)
```
GEMINI_API_KEY=your_key_here
INSTAGRAM_ACCESS_TOKEN=your_token_here
INSTAGRAM_BUSINESS_ID=your_id_here
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_key_id
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
```

### Frontend
No environment variables required for local development.

## Troubleshooting

### CORS Errors
- Ensure backend CORS middleware includes your frontend URL
- Check that both servers are running
- Verify API_URL in `lib/api/agent.ts` matches backend port

### Image Upload Issues
- Check file size (large images may timeout)
- Verify base64 encoding is correct
- Check backend logs for decoding errors

### Agent Not Responding
- Check backend logs for errors
- Verify GEMINI_API_KEY is set correctly
- Ensure session is being created properly

## Next Steps

1. **Add Authentication**: Replace hardcoded user_id with real auth
2. **Persistent Storage**: Save chat history to database
3. **Real-time Updates**: Use WebSockets for live updates
4. **Error Recovery**: Better error handling and retry logic
5. **Rate Limiting**: Add rate limits to prevent abuse
