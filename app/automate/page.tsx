"use client";

import { useState, useEffect } from "react";
import { 
  Zap, Settings, Calendar, Clock, TrendingUp, Play, Pause, 
  RefreshCw, Sparkles, BarChart3, Instagram, ArrowLeft,
  ChevronRight, Check, AlertCircle, Loader2, Image, Video
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ScheduledPost {
  id: string;
  content_type: "Post" | "Reel";
  caption: string;
  media_url: string;
  scheduled_time: string;
  status: "pending" | "published" | "failed" | "generating";
  trend_source?: string;
  created_at: string;
}

interface AutomationSettings {
  mode: "auto" | "manual";
  posts_per_day: number;
  content_mix: { posts: number; reels: number };
  posting_times: string[];
  active_days: string[];
  use_trends: boolean;
  trend_region: string;
  is_active: boolean;
}

const DEFAULT_SETTINGS: AutomationSettings = {
  mode: "auto",
  posts_per_day: 2,
  content_mix: { posts: 50, reels: 50 },
  posting_times: ["09:00", "18:00"],
  active_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  use_trends: true,
  trend_region: "United States",
  is_active: false,
};

export default function AutomatePage() {
  const [settings, setSettings] = useState<AutomationSettings>(DEFAULT_SETTINGS);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [trends, setTrends] = useState<string[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "settings" | "insights">("queue");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, queueRes, trendsRes, insightsRes] = await Promise.all([
        fetch(`${API_URL}/api/automation/settings`).catch(() => null),
        fetch(`${API_URL}/api/automation/queue`).catch(() => null),
        fetch(`${API_URL}/api/automation/trends`).catch(() => null),
        fetch(`${API_URL}/api/automation/insights`).catch(() => null),
      ]);

      if (settingsRes?.ok) {
        const data = await settingsRes.json();
        if (data.settings) setSettings(data.settings);
      }
      if (queueRes?.ok) {
        const data = await queueRes.json();
        if (data.posts) setScheduledPosts(data.posts);
      }
      if (trendsRes?.ok) {
        const data = await trendsRes.json();
        if (data.trends) setTrends(data.trends);
      }
      if (insightsRes?.ok) {
        const data = await insightsRes.json();
        if (data.insights) setInsights(data.insights);
      }
    } catch (err) {
      console.error("Error fetching automation data:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: AutomationSettings) => {
    try {
      await fetch(`${API_URL}/api/automation/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      setSettings(newSettings);
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  const toggleAutomation = async () => {
    const newSettings = { ...settings, is_active: !settings.is_active };
    await saveSettings(newSettings);
  };

  const generateContent = async () => {
    setGenerating(true);
    try {
      if (settings.mode === "auto") {
        // In auto mode, first get AI plan then generate
        const planRes = await fetch(`${API_URL}/api/automation/ai-plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        
        if (planRes.ok) {
          const planData = await planRes.json();
          
          if (planData.content_plan) {
            // Generate content from the AI plan
            const genRes = await fetch(`${API_URL}/api/automation/generate-from-plan`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(planData.content_plan),
            });
            
            if (genRes.ok) {
              await fetchData();
            }
          } else {
            // Fallback to regular generation
            const res = await fetch(`${API_URL}/api/automation/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ settings }),
            });
            if (res.ok) await fetchData();
          }
        }
      } else {
        // Manual mode - use settings directly
        const res = await fetch(`${API_URL}/api/automation/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings }),
        });
        if (res.ok) {
          await fetchData();
        }
      }
    } catch (err) {
      console.error("Error generating content:", err);
    } finally {
      setGenerating(false);
    }
  };

  const removeFromQueue = async (postId: string) => {
    try {
      await fetch(`${API_URL}/api/automation/queue/${postId}`, { method: "DELETE" });
      setScheduledPosts(posts => posts.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Error removing post:", err);
    }
  };

  const publishNow = async (postId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/automation/publish/${postId}`, { method: "POST" });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Error publishing post:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3ECF8E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-full bg-[#1c1c1c] hover:bg-[#2a2a2a] transition-colors border border-white/10">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="w-6 h-6 text-[#3ECF8E]" />
                Content Automation
              </h1>
              <p className="text-gray-500 text-sm mt-1">AI-powered content scheduling & generation</p>
            </div>
          </div>
          
          {/* Master Toggle */}
          <button
            onClick={toggleAutomation}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              settings.is_active 
                ? "bg-[#3ECF8E] text-[#121212]" 
                : "bg-[#1c1c1c] text-gray-400 border border-white/10"
            }`}
          >
            {settings.is_active ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {settings.is_active ? "Automation Active" : "Start Automation"}
          </button>
        </div>

        {/* Mode Selector */}
        <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-2 mb-6 inline-flex">
          <button
            onClick={() => saveSettings({ ...settings, mode: "auto" })}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              settings.mode === "auto" 
                ? "bg-[#3ECF8E]/20 text-[#3ECF8E]" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Auto Mode
          </button>
          <button
            onClick={() => saveSettings({ ...settings, mode: "manual" })}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              settings.mode === "manual" 
                ? "bg-[#3ECF8E]/20 text-[#3ECF8E]" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            Manual Mode
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "queue", label: "Content Queue", icon: Calendar },
            { id: "settings", label: "Settings", icon: Settings },
            { id: "insights", label: "AI Insights", icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                  ? "bg-white/10 text-white" 
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {activeTab === "queue" && (
                <motion.div
                  key="queue"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Scheduled Content</h2>
                    <button
                      onClick={generateContent}
                      disabled={generating}
                      className="flex items-center gap-2 px-4 py-2 bg-[#3ECF8E]/20 text-[#3ECF8E] rounded-lg hover:bg-[#3ECF8E]/30 transition-all disabled:opacity-50"
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Generate Content
                    </button>
                  </div>

                  {scheduledPosts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No scheduled content yet</p>
                      <p className="text-sm mt-1">Click "Generate Content" to create AI-powered posts</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduledPosts.map(post => (
                        <QueueItem key={post.id} post={post} onRemove={removeFromQueue} onPublish={publishNow} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <SettingsPanel settings={settings} onSave={saveSettings} />
                </motion.div>
              )}

              {activeTab === "insights" && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <InsightsPanel insights={insights} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Trends */}
          <div className="space-y-6">
            <TrendsPanel trends={trends} region={settings.trend_region} onRefresh={fetchData} />
            <QuickStats scheduledPosts={scheduledPosts} settings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
}


// Queue Item Component
function QueueItem({ post, onRemove, onPublish }: { post: ScheduledPost; onRemove: (id: string) => void; onPublish: (id: string) => void }) {
  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400",
    published: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
    generating: "bg-blue-500/20 text-blue-400",
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-[#232323] rounded-xl border border-white/5 hover:border-white/10 transition-all">
      {/* Media Preview */}
      <div className="w-16 h-16 rounded-lg bg-[#1c1c1c] overflow-hidden flex-shrink-0">
        {post.media_url ? (
          <img src={post.media_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {post.content_type === "Reel" ? <Video className="w-6 h-6 text-gray-600" /> : <Image className="w-6 h-6 text-gray-600" />}
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${post.content_type === "Reel" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>
            {post.content_type}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[post.status]}`}>
            {post.status}
          </span>
          {post.trend_source && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#3ECF8E]/20 text-[#3ECF8E] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Trending
            </span>
          )}
        </div>
        <p className="text-sm text-gray-300 truncate">{post.caption || "Generating caption..."}</p>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(post.scheduled_time).toLocaleString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {post.status === "pending" && (
          <button
            onClick={() => onPublish(post.id)}
            className="p-2 text-gray-500 hover:text-[#3ECF8E] transition-colors"
            title="Publish Now"
          >
            <Instagram className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => onRemove(post.id)}
          className="p-2 text-gray-500 hover:text-red-400 transition-colors"
          title="Remove"
        >
          <AlertCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Settings Panel Component
function SettingsPanel({ settings, onSave }: { settings: AutomationSettings; onSave: (s: AutomationSettings) => void }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const regions = ["United States", "India", "United Kingdom", "Canada", "Australia"];

  return (
    <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-6 space-y-6">
      <h2 className="text-lg font-semibold mb-4">Automation Settings</h2>

      {/* Posts Per Day */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Posts Per Day</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="5"
            value={settings.posts_per_day}
            onChange={(e) => onSave({ ...settings, posts_per_day: parseInt(e.target.value) })}
            className="flex-1 accent-[#3ECF8E]"
          />
          <span className="text-2xl font-bold text-[#3ECF8E] w-8">{settings.posts_per_day}</span>
        </div>
      </div>

      {/* Content Mix */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Content Mix</label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Posts {settings.content_mix.posts}%</span>
              <span>Reels {settings.content_mix.reels}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.content_mix.posts}
              onChange={(e) => {
                const posts = parseInt(e.target.value);
                onSave({ ...settings, content_mix: { posts, reels: 100 - posts } });
              }}
              className="w-full accent-[#3ECF8E]"
            />
          </div>
        </div>
      </div>

      {/* Posting Times */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Posting Times</label>
        <div className="flex flex-wrap gap-2">
          {settings.posting_times.map((time, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-[#232323] rounded-lg px-3 py-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  const newTimes = [...settings.posting_times];
                  newTimes[idx] = e.target.value;
                  onSave({ ...settings, posting_times: newTimes });
                }}
                className="bg-transparent text-white text-sm focus:outline-none"
              />
            </div>
          ))}
          <button
            onClick={() => onSave({ ...settings, posting_times: [...settings.posting_times, "12:00"] })}
            className="px-3 py-2 bg-[#232323] rounded-lg text-gray-500 hover:text-[#3ECF8E] transition-colors text-sm"
          >
            + Add Time
          </button>
        </div>
      </div>

      {/* Active Days */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Active Days</label>
        <div className="flex flex-wrap gap-2">
          {days.map(day => (
            <button
              key={day}
              onClick={() => {
                const newDays = settings.active_days.includes(day)
                  ? settings.active_days.filter(d => d !== day)
                  : [...settings.active_days, day];
                onSave({ ...settings, active_days: newDays });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                settings.active_days.includes(day)
                  ? "bg-[#3ECF8E]/20 text-[#3ECF8E]"
                  : "bg-[#232323] text-gray-500"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Trend Settings */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Use Google Trends</label>
            <p className="text-xs text-gray-500">Generate content based on trending topics</p>
          </div>
          <button
            onClick={() => onSave({ ...settings, use_trends: !settings.use_trends })}
            className={`w-12 h-6 rounded-full transition-all ${settings.use_trends ? "bg-[#3ECF8E]" : "bg-[#232323]"}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.use_trends ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>

        {settings.use_trends && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Trend Region</label>
            <select
              value={settings.trend_region}
              onChange={(e) => onSave({ ...settings, trend_region: e.target.value })}
              className="w-full bg-[#232323] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3ECF8E]"
            >
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

// Trends Panel Component
function TrendsPanel({ trends, region, onRefresh }: { trends: string[]; region: string; onRefresh: () => void }) {
  return (
    <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#3ECF8E]" />
          Trending Now
        </h3>
        <button onClick={onRefresh} className="p-2 text-gray-500 hover:text-[#3ECF8E] transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">{region}</p>
      
      {trends.length === 0 ? (
        <p className="text-gray-500 text-sm">Loading trends...</p>
      ) : (
        <div className="space-y-2">
          {trends.slice(0, 5).map((trend, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#232323] transition-colors cursor-pointer">
              <span className="text-xs text-gray-500 w-4">{idx + 1}</span>
              <span className="text-sm text-gray-300">{trend}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Quick Stats Component
function QuickStats({ scheduledPosts, settings }: { scheduledPosts: ScheduledPost[]; settings: AutomationSettings }) {
  const pending = scheduledPosts.filter(p => p.status === "pending").length;
  const published = scheduledPosts.filter(p => p.status === "published").length;

  return (
    <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-6">
      <h3 className="font-semibold mb-4">Quick Stats</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Queued</span>
          <span className="text-xl font-bold text-yellow-400">{pending}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Published</span>
          <span className="text-xl font-bold text-green-400">{published}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Daily Target</span>
          <span className="text-xl font-bold text-[#3ECF8E]">{settings.posts_per_day}</span>
        </div>
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${settings.is_active ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
            <span className="text-sm text-gray-400">{settings.is_active ? "Automation Running" : "Automation Paused"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Insights Panel Component
function InsightsPanel({ insights }: { insights: any }) {
  if (!insights) {
    return (
      <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-6 text-center py-12">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <p className="text-gray-500">No insights available yet</p>
        <p className="text-sm text-gray-600 mt-1">Insights will appear after publishing content</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-6 space-y-6">
      <h2 className="text-lg font-semibold">AI-Powered Insights</h2>
      
      {/* Best Performing Content */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Best Performing Content</h3>
        <div className="space-y-2">
          {insights.top_performing?.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-[#232323] rounded-lg">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white">{item.type}: {item.theme}</p>
                <p className="text-xs text-gray-500">{item.insight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">AI Recommendations</h3>
        <div className="p-4 bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 rounded-lg">
          <p className="text-sm text-[#3ECF8E]">
            {insights.recommendation || "Post more Reels during evening hours for higher engagement"}
          </p>
        </div>
      </div>

      {/* Optimal Times */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Optimal Posting Times</h3>
        <div className="flex flex-wrap gap-2">
          {(insights.optimal_times || ["9:00 AM", "6:00 PM", "8:00 PM"]).map((time: string, idx: number) => (
            <span key={idx} className="px-3 py-1 bg-[#232323] rounded-full text-sm text-gray-300">
              {time}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
