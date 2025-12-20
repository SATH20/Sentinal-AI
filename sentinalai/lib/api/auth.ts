// lib/api/auth.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface User {
  user_id: string;
  name: string;
  email?: string;
  instagram_business_id?: string;
  facebook_page_id?: string;
  profile_picture?: string;
  is_connected: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Get Facebook OAuth login URL
 */
export async function getFacebookLoginUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/facebook/url`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  } catch {
    return null;
  }
}

/**
 * Exchange Facebook auth code for user credentials
 */
export async function exchangeFacebookCode(code: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/facebook/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error' };
  }
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/user/${userId}`);
    return await res.json();
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error' };
  }
}

/**
 * Logout user
 */
export async function logout(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/logout/${userId}`, {
      method: 'POST',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Store user in localStorage
 */
export function storeUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sentinalai_user', JSON.stringify(user));
  }
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): User | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sentinalai_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Clear stored user
 */
export function clearStoredUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sentinalai_user');
  }
}
