import { FunctionTool, ToolContext } from "@google/adk";
import { z } from "zod";
import axios from "axios";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});


export const r2MediaTool = new FunctionTool({
  name: "r2_upload",
  description: "Uploads media bytes to Cloudflare R2 and returns a public URL for Instagram.",
  parameters: z.object({
    fileName: z.string(),
    contentType: z.string(),
    fileBytes: z.any() // Expecting Uint8Array or Buffer
  }),
  execute: async ({ fileName, contentType, fileBytes }, context: ToolContext) => {
    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: fileBytes,
      ContentType: contentType
    }));
    
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
    context.state.set("final_media_url", publicUrl);
    return { status: "success", url: publicUrl };
  }
});


export const mapsTool = new FunctionTool({
  name: "google_maps_search",
  description: "Searches for a location to tag in the Instagram post.",
  parameters: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    
    return { location_name: query, instagram_location_id: "123456789" };
  }
});


export const instagramTool = new FunctionTool({
  name: "publish_to_instagram",
  description: "Publishes a prepared media URL to Instagram after user approval.",
  parameters: z.object({
    mediaType: z.enum(["IMAGE", "VIDEO", "REEL"]),
    caption: z.string(),
    locationId: z.string().optional()
  }),
  execute: async (params, context: ToolContext) => {
    const url = context.state.get("final_media_url") as string;
    const igId = process.env.INSTAGRAM_BUSINESS_ID;
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const apiBase = `https://graph.facebook.com/v21.0/${igId}`;

    try {
      const payload: any = { caption: params.caption, access_token: token };
      if (params.mediaType === "IMAGE") {
        payload.image_url = url;
      } else {
        payload.video_url = url;
        payload.media_type = params.mediaType === "REEL" ? "REELS" : "VIDEO";
      }
      
      const container = await axios.post(`${apiBase}/media`, payload);
      const creationId = container.data.id;

      
      if (params.mediaType !== "IMAGE") {
        let ready = false;
        while (!ready) {
          await new Promise(r => setTimeout(r, 5000));
          const status = await axios.get(`https://graph.facebook.com/v21.0/${creationId}`, {
            params: { fields: "status_code", access_token: token }
          });
          if (status.data.status_code === "FINISHED") ready = true;
          if (status.data.status_code === "ERROR") throw new Error("Processing Failed");
        }
      }

      const publish = await axios.post(`${apiBase}/media_publish`, {
        creation_id: creationId,
        access_token: token
      });

      return { status: "published", post_id: publish.data.id };
    } catch (e: any) {
      return { status: "error", message: e.response?.data?.error?.message || e.message };
    }
  }
});