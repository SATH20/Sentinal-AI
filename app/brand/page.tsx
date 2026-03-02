"use client";

import React, { useState, useEffect } from "react";
import { Upload, Sparkles, CheckCircle, Loader2, ArrowLeft, Building2, FileText, RefreshCw } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Initialize Supabase for Client-side (Make sure env vars are in .env.local)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BrandManagerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);

  const [statusMsg, setStatusMsg] = useState("");
  const [agentResponse, setAgentResponse] = useState<string>("");

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        setInitialLoading(true);
        const { data } = await supabase
          .from('brands')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setCompanyName(data.company_name || "");
          setDescription(data.description || ""); 
          if (data.image_url) setExistingImageUrl(data.image_url);
          setIsUpdate(true);
        }
      } catch (err) {
        console.log("No existing brand found, starting fresh.");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchBrand();
  }, []);

  const handleFileUpload = async () => {
    if (!imageFile) return existingImageUrl;
    const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedName}`;
    
    // Ensure 'brand-assets' bucket exists in Supabase
    await supabase.storage.from("brand-assets").upload(fileName, imageFile);
    
    const { data: publicUrl } = supabase.storage.from("brand-assets").getPublicUrl(fileName);
    return publicUrl.publicUrl;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setStatusMsg(isUpdate ? "Updating brand assets..." : "Uploading brand assets...");
    
    try {
      const imageUrl = await handleFileUpload();
      setStatusMsg("Consulting Brand Manager Agent...");
      
      const prompt = `
        ${isUpdate ? "UPDATE REQUEST:" : "NEW BRAND REQUEST:"}
        Company Name: ${companyName}
        Description: ${description}
        Image URL: ${imageUrl || "No image provided"}
        
        Please analyze this and create/update the structured Brand DNA.
      `;

      // Point to Fast API backend
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/run-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: prompt }),
      });
      
      if (!res.ok) throw new Error("Agent failed to respond.");
      
      const data = await res.json();
      setAgentResponse(data.response || "Brand DNA processed successfully.");
      
      setStep(2); 
      setStatusMsg("Success!");
    } catch (error) {
      console.error(error);
      setStatusMsg("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3ECF8E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 md:p-12 font-sans flex flex-col items-center">
      <div className="w-full max-w-2xl flex items-center gap-4 mb-8">
        <Link href="/" className="p-2 rounded-full bg-[#1c1c1c] hover:bg-[#2a2a2a] transition-colors border border-white/10">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#3ECF8E]" />
          Brand Manager
        </h1>
      </div>

      <div className="w-full max-w-2xl bg-[#1c1c1c] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-[#3ECF8E] to-blue-600 opacity-70" />

        {step === 1 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Building2 className="w-4 h-4 text-[#3ECF8E]" /> Company Name
                </label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#232323] p-4 text-white placeholder-gray-600 focus:border-[#3ECF8E] focus:outline-none"
                  placeholder="e.g. Sentinal AI"
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <FileText className="w-4 h-4 text-[#3ECF8E]" /> Brand Description
                </label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#232323] p-4 text-white placeholder-gray-600 focus:border-[#3ECF8E] focus:outline-none resize-none"
                  placeholder="Describe your mission..."
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">Reference Assets</label>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-xl cursor-pointer bg-[#232323]/50 hover:bg-[#232323] transition-all group relative overflow-hidden">
                  {!imageFile && existingImageUrl && (
                    <div className="absolute inset-0 w-full h-full opacity-30">
                       <img src={existingImageUrl} alt="Current Asset" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10">
                    {imageFile ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="w-10 h-10 mb-3 text-[#3ECF8E]" />
                        <p className="text-sm text-white font-medium">{imageFile.name}</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 mb-3 text-gray-500 group-hover:text-[#3ECF8E]" />
                        <p className="text-sm text-gray-400">Upload Logo</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !companyName}
              className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3ECF8E] to-[#34b27b] py-4 font-bold text-[#121212] hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isUpdate ? "Update Brand DNA" : "Generate Brand DNA")}
            </button>
            {loading && <p className="text-center text-sm text-[#3ECF8E] animate-pulse py-2">{statusMsg}</p>}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <div className="w-24 h-24 bg-[#3ECF8E]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-[#3ECF8E]" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">Success!</h3>
            <div className="bg-[#232323] rounded-lg p-4 text-left text-sm text-gray-300 font-mono mb-8 max-h-60 overflow-y-auto border border-white/5">
               {agentResponse}
            </div>
            <button onClick={() => router.push('/')} className="w-full rounded-xl bg-white py-4 text-black font-bold hover:bg-gray-200">Return to Chat</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}