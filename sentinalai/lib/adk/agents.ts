import { LlmAgent, SequentialAgent, AgentTool } from "@google/adk";
import { r2MediaTool, mapsTool, instagramTool } from "./tools";


const visualAgent = new LlmAgent({
  name: "StudioDirector",
  model: "gemini-2.5-flash",
  description: "Specialist in generating high-end visuals and managing R2 storage.",
  instruction: `
    - Analyze user prompt and reference image key.
    - If user wants motion, use Veo 3.1 logic. If static, use Gemini 3 Pro.
    - After generating media (simulated), use 'r2_upload' to store it.
    - Ensure the 'final_media_url' is saved in state.
  `,
  tools: [r2MediaTool]
});


const copywriterAgent = new LlmAgent({
  name: "SocialCopywriter",
  model: "gemini-2.5-flash",
  description: "Expert in viral captions and trending hashtags.",
  instruction: `
    - Based on the visual content created, write a short, engaging caption.
    - Add 10-15 relevant hashtags.
    - Store the result in state under 'final_caption'.
  `,
  outputKey: "final_caption"
});


const locationAgent = new LlmAgent({
  name: "LocationScout",
  model: "gemini-2.0-flash",
  instruction: "Suggest a trending location based on the content and use 'google_maps_search' to get the ID.",
  tools: [mapsTool]
});

const postingAgent = new LlmAgent({
  name: "AccountManager",
  model: "gemini-2.0-flash",
  description: "Manages the final Instagram publication process.",
  instruction: `
    - Present the generated visual, caption, and location to the user.
    - WAIT for the user to say "Approve" or "Post it".
    - Only then call 'publish_to_instagram'.
  `,
  tools: [instagramTool]
});


export const socialMediaMAS = new SequentialAgent({
  name: "InstagramAutomationSuite",
  subAgents: [visualAgent, copywriterAgent, locationAgent, postingAgent]
});