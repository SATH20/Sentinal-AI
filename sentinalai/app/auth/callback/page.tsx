"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeFacebookCode, storeUser } from '../../../lib/api/auth';
import { Check, X, Loader2 } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your Instagram account...');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage('Authorization was cancelled or denied.');
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received.');
      return;
    }

    // Exchange code for token
    exchangeFacebookCode(code).then((response) => {
      if (response.success && response.user) {
        storeUser(response.user);
        setUserName(response.user.name);
        
        if (response.user.is_connected) {
          setStatus('success');
          setMessage('Instagram connected successfully!');
        } else {
          setStatus('error');
          setMessage('No Instagram Business account found. Make sure your Instagram is connected to a Facebook Page.');
        }
        
        // Redirect after delay
        setTimeout(() => {
          router.push('/chat');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(response.error || 'Failed to connect account.');
      }
    });
  }, [searchParams, router]);

  return (
    <div className="max-w-md w-full">
      <div className="bg-[#1c1c1c] rounded-2xl border border-white/10 p-8 text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {status === 'loading' && (
            <div className="w-16 h-16 mx-auto rounded-full bg-[#3ECF8E]/20 flex items-center justify-center">
              <Loader2 size={32} className="text-[#3ECF8E] animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="w-16 h-16 mx-auto rounded-full bg-[#3ECF8E]/20 flex items-center justify-center animate-in zoom-in duration-300">
              <Check size={32} className="text-[#3ECF8E]" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center animate-in zoom-in duration-300">
              <X size={32} className="text-red-500" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-white mb-2">
          {status === 'loading' && 'Connecting...'}
          {status === 'success' && `Welcome, ${userName}!`}
          {status === 'error' && 'Connection Failed'}
        </h1>

        {/* Message */}
        <p className="text-gray-400 mb-6">{message}</p>

        {/* Progress or Action */}
        {status === 'loading' && (
          <div className="space-y-2">
            <div className="h-1 bg-[#232323] rounded-full overflow-hidden">
              <div className="h-full bg-[#3ECF8E] rounded-full animate-pulse w-2/3"></div>
            </div>
            <p className="text-xs text-gray-500">Please wait...</p>
          </div>
        )}

        {status === 'success' && (
          <p className="text-sm text-[#3ECF8E]">Redirecting to chat...</p>
        )}

        {status === 'error' && (
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-[#3ECF8E] text-[#0a0a0a] rounded-lg font-medium hover:bg-[#34b27b] transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-md w-full">
      <div className="bg-[#1c1c1c] rounded-2xl border border-white/10 p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#3ECF8E]/20 flex items-center justify-center mb-6">
          <Loader2 size={32} className="text-[#3ECF8E] animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Loading...</h1>
        <p className="text-gray-400">Please wait...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
