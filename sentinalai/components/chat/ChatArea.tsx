"use client";

import { useState, useEffect, useRef } from 'react';
import { generateContent, approveContent, useSessionId, generateSessionId, GenerateResponse } from '../../lib/api/agent';
import { EncryptedText } from '../ui/encrypted-text';
import { Send, Plus, ChevronDown, Check, ImageIcon, Film, CheckCircle, X, RefreshCw, ThumbsUp, ThumbsDown, Play } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '../icons/SocialIcons';

interface ChatAreaProps {
  sidebarOpen: boolean;
}

type WorkflowStep = {
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
};

type ContentPreview = {
  contentId: string;
  mediaUrl: string;
  caption: string;
  hashtags: string;
  enhancedPrompt: string;
  contentType: 'Post' | 'Reel';
};

type ViewState = 'welcome' | 'loading' | 'preview' | 'publishing' | 'success' | 'error';

export default function ChatArea({ sidebarOpen }: ChatAreaProps) {
  // Input state
  const [message, setMessage] = useState('');
  const [contentType, setContentType] = useState<'Post' | 'Reel'>('Post');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Workflow state
  const [viewState, setViewState] = useState<ViewState>('welcome');
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [contentPreview, setContentPreview] = useState<ContentPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Session
  const [sessionIdRef, setSessionId] = useSessionId();
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const username = 'Khushal Agarwal';

  // Get workflow steps based on content type
  const getWorkflowSteps = (type: 'Post' | 'Reel'): WorkflowStep[] => {
    if (type === 'Post') {
      return [
        { label: 'Received request', status: 'pending' },
        { label: 'Enhancing the prompt', status: 'pending' },
        { label: 'Generating the image', status: 'pending' },
        { label: 'Generating caption', status: 'pending' },
      ];
    }
    return [
      { label: 'Received request', status: 'pending' },
      { label: 'Enhancing the prompt', status: 'pending' },
      { label: 'Generating the video', status: 'pending' },
      { label: 'Adding audio', status: 'pending' },
      { label: 'Generating caption', status: 'pending' },
    ];
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Simulate step progression
  const progressSteps = async (steps: WorkflowStep[], onComplete: () => void) => {
    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      setWorkflowSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx < i ? 'completed' : idx === i ? 'active' : 'pending'
      })));
      
      // Wait for each step (simulated timing)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
    }
    
    // Mark all as completed
    setWorkflowSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
    onComplete();
  };

  // Main send handler
  const handleSend = async () => {
    if (!message.trim() && !selectedImage) return;

    // Reset state
    setError(null);
    setContentPreview(null);
    
    // Initialize workflow
    const steps = getWorkflowSteps(contentType);
    setWorkflowSteps(steps);
    setCurrentStepIndex(0);
    setViewState('loading');

    // Get or create session
    let session_id = sessionIdRef.current;
    if (!session_id) {
      session_id = generateSessionId();
      setSessionId(session_id);
    }

    // Start step progression animation
    const stepPromise = progressSteps(steps, () => {});

    // Make API call
    try {
      const response = await generateContent({
        user_id: 'user_1',
        session_id,
        message,
        content_type: contentType,
        image_data: selectedImage || undefined,
      });

      // Wait for animation to catch up
      await stepPromise;

      if (response.status === 'error') {
        setError(response.error || 'Generation failed');
        setViewState('error');
      } else if (response.status === 'preview') {
        setContentPreview({
          contentId: response.content_id!,
          mediaUrl: response.generated_media_url!,
          caption: response.caption!,
          hashtags: response.hashtags!,
          enhancedPrompt: response.enhanced_prompt!,
          contentType,
        });
        setViewState('preview');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
      setViewState('error');
    }

    // Clear inputs
    setMessage('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle approval
  const handleApprove = async () => {
    if (!contentPreview) return;

    setViewState('publishing');

    try {
      const response = await approveContent({
        user_id: 'user_1',
        session_id: sessionIdRef.current!,
        content_id: contentPreview.contentId,
        approved: true,
      });

      if (response.status === 'published') {
        setViewState('success');
      } else {
        setError(response.error || 'Publishing failed');
        setViewState('error');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
      setViewState('error');
    }
  };

  // Handle denial (regenerate)
  const handleDeny = async () => {
    if (!contentPreview) return;

    // Notify backend
    await approveContent({
      user_id: 'user_1',
      session_id: sessionIdRef.current!,
      content_id: contentPreview.contentId,
      approved: false,
    });

    // Reset to welcome state
    setContentPreview(null);
    setViewState('welcome');
  };

  // Reset to create another
  const handleCreateAnother = () => {
    setContentPreview(null);
    setError(null);
    setViewState('welcome');
  };

  // Render content based on view state
  const renderContent = () => {
    switch (viewState) {
      case 'welcome':
        return <WelcomeMessage username={username} />;
      
      case 'loading':
        return (
          <LoadingView 
            steps={workflowSteps} 
            currentStepIndex={currentStepIndex} 
            contentType={contentType} 
          />
        );
      
      case 'preview':
        return contentPreview && (
          <PreviewCard
            preview={contentPreview}
            onApprove={handleApprove}
            onDeny={handleDeny}
          />
        );
      
      case 'publishing':
        return <PublishingView />;
      
      case 'success':
        return (
          <SuccessCard 
            contentType={contentPreview?.contentType || 'Post'} 
            onDismiss={handleCreateAnother} 
          />
        );
      
      case 'error':
        return (
          <ErrorCard 
            error={error || 'Something went wrong'} 
            onRetry={handleCreateAnother} 
          />
        );
      
      default:
        return <WelcomeMessage username={username} />;
    }
  };

  const isInputDisabled = viewState === 'loading' || viewState === 'publishing';

  return (
    <main className={`flex-1 flex flex-col h-screen overflow-hidden ${sidebarOpen ? '' : ''}`}>
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="min-h-full flex items-center justify-center">
          {renderContent()}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 pb-8">
        <div className="max-w-3xl mx-auto">
          {/* Image Preview */}
          {selectedImage && (
            <div className="mb-4 relative inline-block">
              <img 
                src={selectedImage} 
                alt="Reference" 
                className="max-w-xs max-h-32 rounded-lg border border-white/20"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          {/* Input Box */}
          <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-3 flex items-center gap-3 focus-within:border-[#3ECF8E]/50 transition-colors">
            {/* Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#232323] text-gray-400 hover:text-[#3ECF8E] hover:bg-[#3ECF8E]/10 transition-colors border border-white/5"
              disabled={isInputDisabled}
              title="Upload reference image"
            >
              <Plus size={20} />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isInputDisabled && handleSend()}
              placeholder="Describe your content idea..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base"
              disabled={isInputDisabled}
            />

            {/* Content Type Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#232323] text-gray-300 hover:text-[#3ECF8E] transition-colors border border-white/5 text-sm font-medium"
                disabled={isInputDisabled}
              >
                {contentType === 'Post' ? <ImageIcon size={16} /> : <Film size={16} />}
                {contentType}
                <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {dropdownOpen && (
                <div className="absolute bottom-full mb-2 right-0 bg-[#232323] border border-white/10 rounded-lg overflow-hidden shadow-xl min-w-[120px] z-10">
                  <button 
                    onClick={() => { setContentType('Post'); setDropdownOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[#3ECF8E]/10 hover:text-[#3ECF8E] transition-colors flex items-center gap-2 ${contentType === 'Post' ? 'text-[#3ECF8E]' : 'text-gray-300'}`}
                  >
                    <ImageIcon size={16} /> Post (Image)
                  </button>
                  <button 
                    onClick={() => { setContentType('Reel'); setDropdownOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[#3ECF8E]/10 hover:text-[#3ECF8E] transition-colors flex items-center gap-2 ${contentType === 'Reel' ? 'text-[#3ECF8E]' : 'text-gray-300'}`}
                  >
                    <Film size={16} /> Reel (Video)
                  </button>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button 
              onClick={handleSend}
              disabled={isInputDisabled || (!message.trim() && !selectedImage)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#3ECF8E] text-[#121212] hover:bg-[#34b27b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}


// =====================================================
// PREVIEW CARD - Shows generated content for approval
// =====================================================
interface PreviewCardProps {
  preview: ContentPreview;
  onApprove: () => void;
  onDeny: () => void;
}

function PreviewCard({ preview, onApprove, onDeny }: PreviewCardProps) {
  const isReel = preview.contentType === 'Reel';
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  // Check if media is a video format - be more explicit
  const mediaUrl = preview.mediaUrl || '';
  const isVideoFormat = mediaUrl.startsWith('data:video/') || 
    mediaUrl.endsWith('.mp4') || 
    mediaUrl.endsWith('.webm') ||
    mediaUrl.endsWith('.mov') ||
    mediaUrl.includes('video/mp4');
  
  // Debug log
  console.log('PreviewCard Debug:', {
    contentType: preview.contentType,
    isReel,
    mediaUrlStart: mediaUrl.substring(0, 50),
    isVideoFormat,
    videoError
  });
  
  // Determine what to show
  const shouldShowVideo = isVideoFormat && !videoError;
  const isImageFallback = isReel && !isVideoFormat;

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-2xl border border-white/10 bg-[#1c1c1c] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center p-[2px]">
              <div className="w-full h-full rounded-full bg-[#1c1c1c] flex items-center justify-center">
                <InstagramIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <span className="text-white font-semibold block">Preview</span>
              <span className="text-xs text-gray-400">{isReel ? 'Instagram Reel' : 'Instagram Post'}</span>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${isReel ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {isReel ? '🎬 Reel' : '📷 Post'}
          </span>
        </div>
        
        {/* Media Preview - Different aspect ratios for Post vs Reel */}
        <div className={`relative bg-black flex items-center justify-center overflow-hidden ${isReel ? 'aspect-[9/16]' : 'aspect-square'}`}>
          {shouldShowVideo ? (
            <video 
                src={mediaUrl} 
                className="w-full h-full object-contain bg-black"
                controls
                autoPlay
                muted
                loop
                playsInline
                onError={(e) => {
                  console.error('Video error:', e);
                  setVideoError(true);
                }}
                onLoadedData={() => {
                  console.log('Video loaded successfully');
                  setVideoLoaded(true);
                }}
              />
          ) : mediaUrl && !isVideoFormat ? (
            <img 
              src={mediaUrl} 
              alt="Generated content" 
              className="w-full h-full object-contain"
            />
          ) : videoError ? (
            <div className="flex flex-col items-center gap-4 text-gray-500 p-8">
              <Film size={48} />
              <span className="text-sm">Video failed to load</span>
              <span className="text-xs text-gray-600">Video will still be published</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-gray-500 p-8">
              {isReel ? <Film size={48} /> : <ImageIcon size={48} />}
              <span className="text-sm">Preview not available</span>
            </div>
          )}
          
          {/* Video loading indicator */}
          {shouldShowVideo && !videoLoaded && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-8 h-8 border-2 border-[#3ECF8E] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Reel indicator overlay */}
          {isReel && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1">
              <Film size={12} /> Reel
            </div>
          )}
          
          {/* Image fallback notice for Reels */}
          {isImageFallback && (
            <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-black font-medium">
              ⚠️ Video preview as image
            </div>
          )}
          
          {/* Video error fallback */}
          {videoError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
              <Film size={48} className="mb-2 text-gray-400" />
              <p className="text-sm text-gray-400">Video preview unavailable</p>
              <p className="text-xs text-gray-500 mt-1">Video will be uploaded when approved</p>
            </div>
          )}
        </div>
        
        {/* Caption & Hashtags */}
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Caption</p>
            <p className="text-white text-sm leading-relaxed">{preview.caption}</p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Hashtags</p>
            <p className="text-[#3ECF8E] text-sm leading-relaxed">{preview.hashtags}</p>
          </div>
          
          <details className="pt-2 border-t border-white/10">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">View enhanced prompt</summary>
            <p className="text-gray-400 text-xs italic mt-2 leading-relaxed">{preview.enhancedPrompt}</p>
          </details>
        </div>
        
        {/* Action Buttons */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onDeny}
            className="flex-1 py-3 bg-[#232323] text-gray-300 rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Regenerate
          </button>
          <button
            onClick={onApprove}
            className="flex-1 py-3 bg-[#3ECF8E] text-[#121212] rounded-lg font-bold hover:bg-[#34b27b] transition-colors flex items-center justify-center gap-2"
          >
            <ThumbsUp size={18} />
            Approve & Post
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// LOADING VIEW - Shows progress during generation
// =====================================================
interface LoadingViewProps {
  steps: WorkflowStep[];
  currentStepIndex: number;
  contentType: 'Post' | 'Reel';
}

function LoadingView({ steps, currentStepIndex, contentType }: LoadingViewProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="rounded-xl border border-white/10 bg-[#1c1c1c] overflow-hidden shadow-2xl relative">
        {/* Animated top border */}
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#3ECF8E] to-transparent opacity-50 animate-pulse"></div>
        
        {/* Window controls */}
        <div className="p-4 border-b border-white/10 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/30"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/30"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/30"></div>
        </div>
        
        <div className="p-8 md:p-12">
          {/* Steps Progress */}
          <div className="space-y-2 mb-8">
            <p className="text-[#3ECF8E] font-bold mb-4 font-mono">// Generating your {contentType}...</p>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {step.status === 'completed' ? (
                    <Check size={16} className="text-[#3ECF8E]" />
                  ) : step.status === 'active' ? (
                    <div className="w-4 h-4 border-2 border-[#3ECF8E] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600"></div>
                  )}
                  <span className={`text-sm ${
                    step.status === 'completed' ? 'text-gray-400' : 
                    step.status === 'active' ? 'text-white' : 'text-gray-600'
                  }`}>
                    {step.label}...
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-4">
            <p className="text-[#3ECF8E] font-bold font-mono">// {contentType} Preview</p>
            <ContentSkeleton contentType={contentType} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// CONTENT SKELETON - Placeholder during loading
// =====================================================
function ContentSkeleton({ contentType }: { contentType: 'Post' | 'Reel' }) {
  const isReel = contentType === 'Reel';
  
  return (
    <div className={`rounded-lg border border-white/10 bg-[#232323] overflow-hidden ${isReel ? 'max-w-[150px]' : 'max-w-[200px]'}`}>
      <div className={`relative bg-[#1a1a1a] overflow-hidden ${isReel ? 'aspect-[9/16]' : 'aspect-square'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] animate-shimmer"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          {contentType === 'Post' ? (
            <ImageIcon size={32} className="text-gray-700" />
          ) : (
            <Film size={32} className="text-gray-700" />
          )}
        </div>
      </div>
      
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#1a1a1a] animate-pulse"></div>
          <div className="h-2 w-16 bg-[#1a1a1a] rounded animate-pulse"></div>
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-full bg-[#1a1a1a] rounded animate-pulse"></div>
          <div className="h-2 w-3/4 bg-[#1a1a1a] rounded animate-pulse"></div>
        </div>
        <div className="flex gap-1.5 pt-1">
          <div className="h-2 w-10 bg-[#3ECF8E]/20 rounded animate-pulse"></div>
          <div className="h-2 w-12 bg-[#3ECF8E]/20 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PUBLISHING VIEW - Shows while posting to Instagram
// =====================================================
function PublishingView() {
  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="rounded-xl border border-white/10 bg-[#1c1c1c] p-8 shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 border-4 border-[#3ECF8E]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#3ECF8E] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Publishing to Instagram...</h2>
        <p className="text-gray-400">Please wait while we post your content</p>
      </div>
    </div>
  );
}

// =====================================================
// SUCCESS CARD - Shows after successful publish
// =====================================================
interface SuccessCardProps {
  contentType: 'Post' | 'Reel';
  onDismiss: () => void;
}

function SuccessCard({ contentType, onDismiss }: SuccessCardProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-xl border border-[#3ECF8E]/30 bg-[#1c1c1c] overflow-hidden shadow-2xl">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-[#3ECF8E]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[#3ECF8E]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Content Posted!</h2>
          <p className="text-gray-400 mb-6">Your {contentType.toLowerCase()} has been successfully published.</p>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#232323] rounded-lg border border-white/10">
              <InstagramIcon className="w-5 h-5 text-pink-500" />
              <span className="text-sm text-gray-300">Instagram</span>
              <Check size={14} className="text-[#3ECF8E]" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#232323] rounded-lg border border-white/10">
              <FacebookIcon className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-300">Facebook</span>
              <Check size={14} className="text-[#3ECF8E]" />
            </div>
          </div>

          <button 
            onClick={onDismiss}
            className="w-full py-3 bg-[#3ECF8E] text-[#121212] rounded-lg font-bold hover:bg-[#34b27b] transition-colors"
          >
            Create Another
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// ERROR CARD - Shows when something goes wrong
// =====================================================
interface ErrorCardProps {
  error: string;
  onRetry: () => void;
}

function ErrorCard({ error, onRetry }: ErrorCardProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-xl border border-red-500/30 bg-[#1c1c1c] overflow-hidden shadow-2xl">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error}</p>

          <button 
            onClick={onRetry}
            className="w-full py-3 bg-[#3ECF8E] text-[#121212] rounded-lg font-bold hover:bg-[#34b27b] transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// WELCOME MESSAGE - Initial state
// =====================================================
function WelcomeMessage({ username }: { username: string }) {
  const [showSubtext, setShowSubtext] = useState(false);

  useEffect(() => {
    const greeting = 'Hi ';
    const revealDelayMs = 90;
    const buffer = 500;
    const totalLength = greeting.length + username.length;
    const timeout = setTimeout(() => setShowSubtext(true), (totalLength * revealDelayMs) + buffer);
    return () => clearTimeout(timeout);
  }, [username]);

  return (
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
        <EncryptedText
          text={'Hi '}
          className="inline leading-tight mr-1"
          encryptedClassName="text-gray-400 transition-colors duration-200"
          revealedClassName="text-white transition-colors duration-300 font-bold"
          revealDelayMs={90}
          flipDelayMs={70}
        />
        <EncryptedText
          text={username}
          className="inline leading-tight"
          encryptedClassName="text-gray-400 transition-colors duration-200"
          revealedClassName="text-[#3ECF8E] transition-colors duration-300 font-bold"
          revealDelayMs={90}
          flipDelayMs={70}
        />
        <span className="animate-pulse">|</span>
      </h1>
      <p className={`text-xl md:text-2xl text-gray-400 transition-opacity duration-500 ${showSubtext ? 'opacity-100' : 'opacity-0'}`}>
        What content should we post today?
      </p>
      
      <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-[#3ECF8E]" />
          <span>Post = Image</span>
        </div>
        <div className="flex items-center gap-2">
          <Film size={16} className="text-[#3ECF8E]" />
          <span>Reel = Video</span>
        </div>
      </div>
    </div>
  );
}
