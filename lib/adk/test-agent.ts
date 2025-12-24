import { 
  InMemoryRunner, 
  isFinalResponse, 
  stringifyContent 
} from "@google/adk";
import { socialMediaMAS } from "./agent"; // Import your SequentialAgent
import { createUserContent } from "@google/genai";
import * as dotenv from "dotenv";

// Load your IG, R2, and Gemini keys
dotenv.config();

async function testSocialAgent() {
  // 1. Initialize the Runner
  const runner = new InMemoryRunner({
    agent: socialMediaMAS,
    appName: "OwnerStudioAI",
  });

  const userId = "test_owner_01";
  const sessionId = "session_" + Date.now();

  // 2. Create the Session
  await runner.sessionService.createSession({
    appName: "OwnerStudioAI",
    userId,
    sessionId,
  });

  // 3. Provide the Prompt
  // This triggers the VisualCreator -> SocialCopywriter -> LocationScout
  const userPrompt = "Create a high-end photo for my new ergonomic drill. It should look like it's in a professional workshop with cinematic lighting.";
  console.log(`\n[User]: ${userPrompt}`);

  const events = runner.runAsync({
    userId,
    sessionId,
    newMessage: createUserContent(userPrompt),
  });

  // 4. Handle the Event Loop
  for await (const event of events) {
    if (isFinalResponse(event)) {
      const responseText = stringifyContent(event).trim();
      console.log(`\n[Agent]: ${responseText}`);
      
      // The logic pauses here because the PostingManager is 
      // instructed to WAIT for approval.
      console.log("\n--- SYSTEM PAUSED: AWAITING APPROVAL ---");
      break; 
    }
  }

  // 5. Simulate User Approval
  // After you review the generated content, you send the confirmation.
  const approvalPrompt = "This looks perfect! Go ahead and post it to Instagram.";
  console.log(`\n[User]: ${approvalPrompt}`);

  const approvalEvents = runner.runAsync({
    userId,
    sessionId, // MUST be the same session to keep the media URL and caption
    newMessage: createUserContent(approvalPrompt),
  });

  for await (const event of approvalEvents) {
    if (isFinalResponse(event)) {
      console.log(`\n[Agent]: ${stringifyContent(event).trim()}`);
    }
  }
}

testSocialAgent().catch(console.error);