import { Check } from 'lucide-react';
import { Spotlight } from './ui/spotlight';
import { TypewriterEffectSmooth } from './ui/typewriter-effect';

export default function Hero() {
  return (
    <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto text-center z-10">
      
      <Spotlight className="absolute left-1/2 top-28 -translate-x-1/2 -translate-y-1/2 z-0 opacity-70" fill="rgba(62,207,142,0.12)" />
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-8 hover:border-[#3ECF8E]/50 transition-colors cursor-pointer">
        <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse"></span>
        <span>New: Facebook Page Analytics</span>
      </div>
      
      <div className="relative z-20 flex flex-col items-center">
        <div className="flex flex-col items-center text-center">
          <TypewriterEffectSmooth
            words={[{ text: 'AI Agents That Run Your Social Media  ', className: 'text-white' }]}
            className="text-5xl md:text-7m font-bold leading-tight text-center my-0"
            cursorClassName="opacity-0"
          />
          <TypewriterEffectSmooth
            words={[{ text: 'While You Build Your Business  ', className: 'text-[#3ECF8E]' }]}
            className="text-5xl md:text-7m font-bold leading-tight text-center my-0"
            cursorClassName="bg-[#3ECF8E]"
          />
        </div>
      </div>
      
      <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
         Connect once, prompt and automate.
      </p>

      <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
        <a href="/chat" className="bg-[#3ECF8E] text-[#121212] px-8 py-3 rounded-md font-bold text-lg hover:bg-[#34b27b] transition-transform hover:-translate-y-1 shadow-[0_0_20px_rgba(62,207,142,0.3)]">
          Get Started
        </a>
        <a href="#demo" className="bg-[#232323] text-white border border-white/10 px-8 py-3 rounded-md font-medium text-lg hover:bg-[#2c2c2c] transition-colors">
          Request a demo
        </a>
      </div>

      <HeroVisual />
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="mt-20 relative rounded-xl border border-white/10 bg-[#1c1c1c] overflow-hidden shadow-2xl max-w-5xl mx-auto group">
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#3ECF8E] to-transparent opacity-50"></div>
      <div className="p-4 border-b border-white/10 flex gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
        <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
      </div>
      <div className="p-8 md:p-12 font-mono text-left text-sm md:text-base grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-4 text-gray-400">
          <p className="text-[#3ECF8E] font-bold mb-2">// User Prompt</p>
          <div className="bg-black/30 p-4 rounded border border-white/5">
            <span className="text-blue-400">const</span> prompt = <span className="text-yellow-300">&quot;Launch a campaign for my new coffee shop focusing on morning productivity.&quot;</span>;
          </div>
        </div>
        <div className="space-y-2 text-gray-500">
          <p className="text-[#3ECF8E] font-bold mb-2">// Sento Output</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2"><Check size={14} className="text-[#3ECF8E]"/> <span>Generating 5 Instagram Reels scripts...</span></div>
            <div className="flex items-center gap-2"><Check size={14} className="text-[#3ECF8E]"/> <span>Generating a catchy caption...</span></div>
            <div className="flex items-center gap-2"><Check size={14} className="text-[#3ECF8E]"/> <span>Analyzing local trending hashtags...</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-[#3ECF8E] border-t-transparent rounded-full animate-spin"></div> <span className="text-white">Posting to Instagram...</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
