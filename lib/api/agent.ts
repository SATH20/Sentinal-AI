// lib/api/agent.ts
import { useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface GenerateRequest {
  user_id: string;
  session_id: string;
  message: string;
  content_type: 'Post' | 'Reel';
  image_data?: string;
}

export interface GenerateResponse {
  status: 'preview' | 'error';
  content_id?: string;
  enhanced_prompt?: string;
  generated_media_url?: string;
  caption?: string;
  hashtags?: string;
  error?: string;
}

export interface ApprovalRequest {
  user_id: string;
  session_id: string;
  content_id: string;
  approved: boolean;
}

export interface PublishResponse {
  status: 'published' | 'denied' | 'error';
  post_id?: string;
  error?: string;
}

// Legacy interface for backward compatibility
export interface ChatRequest {
  user_id: string;
  session_id: string;
  message: string;
  content_type?: string;
  image_data?: string;
}

export interface ChatResponse {
  response?: string;
  error?: string;
  session_id?: string;
  content_id?: string;
  media_url?: string;
  caption?: string;
  hashtags?: string;
  status?: string;
}

/**
 * Generate content (image/video) based on user prompt
 */
export async function generateContent(req: GenerateRequest): Promise<GenerateResponse> {
  try {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    
    if (!res.ok) {
      return { status: 'error', error: `HTTP ${res.status}` };
    }
    
    return await res.json();
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'Network error' };
  }
}

/**
 * Approve or deny generated content
 */
export async function approveContent(req: ApprovalRequest): Promise<PublishResponse> {
  try {
    const res = await fetch(`${API_BASE}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    
    if (!res.ok) {
      return { status: 'error', error: `HTTP ${res.status}` };
    }
    
    return await res.json();
  } catch (e: any) {
    return { status: 'error', error: e?.message || 'Network error' };
  }
}

/**
 * Legacy chat endpoint (for backward compatibility)
 */
export async function sendChatRequest(req: ChatRequest): Promise<ChatResponse> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    
    if (!res.ok) {
      return { error: `HTTP ${res.status}` };
    }
    
    return await res.json();
  } catch (e: any) {
    return { error: e?.message || 'Network error' };
  }
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Convert file to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Session ID management hook
 */
export function useSessionId(key = 'chat_session_id') {
  const ref = useRef<string | null>(null);
  
  if (ref.current === null && typeof window !== 'undefined') {
    ref.current = localStorage.getItem(key);
  }
  
  const setSessionId = (id: string) => {
    ref.current = id;
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, id);
    }
  };
  
  return [ref, setSessionId] as const;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
