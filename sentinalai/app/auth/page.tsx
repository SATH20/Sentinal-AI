"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFacebookLoginUrl, getStoredUser } from '../../lib/api/auth';
import { FacebookIcon, InstagramIcon } from '../../components/icons/SocialIcons';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const user = getStoredUser();
    if (user && user.is_connected) {
      router.push('/chat');
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  const handleFacebookLogin = async () => {
    setLoading(true);
    const url = await getFacebookLoginUrl();
    if (url) {
      window.location.href = url;
    } else {
      setLoading(false);
      alert('Failed to get login URL. Please try again.');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={32} className="text-[#3ECF8E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Sentinal<span className="text-[#3ECF8E]">AI</span>
          </h1>
          <p className="text-gray-400">AI-powered Instagram content creation</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1c1c1c] rounded-2xl border border-white/10 p-8">
          <h2 className="text-xl font-semibold text-white text-center mb-6">
            Connect Your Account
          </h2>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle size={18} className="text-[#3ECF8E]" />
              <span>Generate AI images & videos</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle size={18} className="text-[#3ECF8E]" />
              <span>Auto-generate captions & hashtags</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle size={18} className="text-[#3ECF8E]" />
              <span>Publish directly to Instagram</span>
            </div>
          </div>

          {/* Facebook Login Button */}
          <button
            onClick={handleFacebookLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1877F2] text-white rounded-xl font-medium hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <FacebookIcon className="w-5 h-5" />
            )}
            <span>{loading ? 'Connecting...' : 'Continue with Facebook'}</span>
          </button>

          {/* Info */}
          <div className="mt-6 p-4 bg-[#232323] rounded-xl">
            <div className="flex items-start gap-3">
              <InstagramIcon className="w-5 h-5 text-pink-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-300 font-medium">Instagram Business Account Required</p>
                <p className="text-xs text-gray-500 mt-1">
                  Your Instagram must be connected to a Facebook Page to publish content.
                </p>
              </div>
            </div>
          </div>

          {/* Skip for now */}
          <button
            onClick={() => router.push('/chat')}
            className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <span>Skip for now</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
