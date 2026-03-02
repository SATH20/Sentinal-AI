"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Loader2, BrainCircuit, TrendingUp, Users, CheckCircle, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const REACH_DATA = [
  { day: "Mon", reach: 1200 }, { day: "Tue", reach: 1900 }, { day: "Wed", reach: 1500 },
  { day: "Thu", reach: 2800 }, { day: "Fri", reach: 2100 }, { day: "Sat", reach: 3400 }, { day: "Sun", reach: 3100 },
];

const CONTENT_PERFORMANCE = [
  { type: "Reels", engagement: 85 }, { type: "Carousels", engagement: 65 }, { type: "Static", engagement: 30 },
];

export default function AnalyticsPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [strategyApplied, setStrategyApplied] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setInsight(null);
    setStrategyApplied(false);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/run-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          input_text: "Analyze my performance trends for the last 7 days. Provide specific recommendations but do NOT automatically apply changes yet.",
          agent_type: "analytics" 
        }),
      });

      if (!res.ok) throw new Error("Strategist Agent failed to respond.");
      const data = await res.json();
      setInsight(data.response);
    } catch (error) {
      console.error(error);
      setInsight("Error: Could not connect to The Coach.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyStrategy = async () => {
    if (!insight) return;
    
    setApplying(true);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/run-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          input_text: `Based on this analysis: "${insight.substring(0, 500)}..." - Please call update_brand_strategy_tool to save the most important strategic recommendation to the brand DNA.`,
          agent_type: "analytics" 
        }),
      });

      if (!res.ok) throw new Error("Failed to apply strategy.");
      const data = await res.json();
      
      if (data.response && (data.response.includes("SUCCESS") || data.response.includes("updated"))) {
        setStrategyApplied(true);
      } else {
        setInsight(prev => prev + "\n\n⚠️ Strategy update: " + data.response);
      }
    } catch (error) {
      console.error(error);
      setInsight(prev => prev + "\n\n❌ Error applying strategy.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 md:p-12 font-sans">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-[#3ECF8E]" />
          The Coach <span className="text-gray-500 text-lg font-normal">/ Analytics</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-[#1c1c1c] border border-white/5 p-6 rounded-2xl shadow-xl h-72">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-6"><TrendingUp className="w-5 h-5 text-blue-400" /> Weekly Reach</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={REACH_DATA}><CartesianGrid strokeDasharray="3 3" stroke="#333" /><XAxis dataKey="day" /><YAxis /><Tooltip contentStyle={{backgroundColor: '#222'}} /><Line type="monotone" dataKey="reach" stroke="#3ECF8E" strokeWidth={3} /></LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#1c1c1c] border border-white/5 p-6 rounded-2xl shadow-xl h-72">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-6"><Users className="w-5 h-5 text-purple-400" /> Engagement by Format</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={CONTENT_PERFORMANCE}><CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} /><XAxis dataKey="type" /><YAxis /><Tooltip contentStyle={{backgroundColor: '#222'}} /><Bar dataKey="engagement" fill="#3ECF8E" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="relative bg-[#1c1c1c] border border-white/10 rounded-2xl p-8 md:p-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white">The Strategist</h2>
            <p className="text-sm text-gray-400">Analyze your content performance and get AI-powered recommendations.</p>
            
            <button 
              onClick={handleAnalyze} 
              disabled={analyzing} 
              className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {analyzing ? <Loader2 className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5" />}
              {analyzing ? "Analyzing..." : "Analyze Performance"}
            </button>

            {insight && !strategyApplied && !insight.startsWith("Error") && (
              <button 
                onClick={handleApplyStrategy} 
                disabled={applying}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#3ECF8E] to-[#34b27b] text-black font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {applying ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                {applying ? "Applying..." : "Apply to Brand DNA"}
              </button>
            )}

            {strategyApplied && (
              <div className="flex items-center gap-2 text-[#3ECF8E] bg-[#3ECF8E]/10 p-3 rounded-xl">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Strategy saved to Brand DNA!</span>
              </div>
            )}
          </div>
          
          <div className="w-full md:w-2/3 border-l border-white/10 pl-0 md:pl-8">
            {insight ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-lg font-semibold text-[#3ECF8E] mb-4">Strategy Report</h3>
                <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed bg-[#232323] p-4 rounded-xl border border-white/5 max-h-80 overflow-y-auto">
                  {insight}
                </div>
              </motion.div>
            ) : (
              <div className="text-gray-500 text-center py-12">
                <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Click "Analyze Performance" to get AI insights</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}