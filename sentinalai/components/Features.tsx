'use client';

import { Bot, Shield, Layers, MessageSquare, TrendingUp, Check } from 'lucide-react';
import { FacebookIcon, InstagramIcon, ConnectIcon } from './icons/SocialIcons';
import { CometCard } from './ui/comet-card';
import { TypewriterEffectSmooth } from './ui/typewriter-effect';

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 max-w-7xl mx-auto z-10 relative">
      <div className="text-center mb-16 flex flex-col items-center">
        <TypewriterEffectSmooth
          words={[{ text: 'Everything you need', className: 'text-white' }]}
          className="text-3xl md:text-4xl font-bold leading-tight text-center mb-4"
          cursorClassName="opacity-0"
        />
        <p className="text-slate-300">Built for creators and businesses who value their time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AIContentCard />
        <ConnectCard />
        <FeatureCard icon={Layers} title="Smart Storage" description="Store, organize, and serve large files, from videos to images instantly." />
        <FeatureCard icon={MessageSquare} title="Realtime Chat" description="Build multiplayer experiences. Respond to comments and DMs from one dashboard." />
        <FeatureCard icon={TrendingUp} title="Trend Vector" description="Integrate favorite ML-models to store, index and search vector embeddings for trends." />
      </div>
    </section>
  );
}

function AIContentCard() {
  return (
    <div className="md:col-span-2">
      <CometCard className="bg-gradient-to-br from-[#061018] via-[#072623] to-[#08302a] border border-white/5 rounded-xl p-8 hover:border-[#3ECF8E]/50 transition-colors group relative overflow-hidden">
      <div className="relative z-10">
        <div className="w-10 h-10 bg-[#072623] rounded flex items-center justify-center mb-6 text-[#3ECF8E] border border-white/5 group-hover:bg-[#3ECF8E] group-hover:text-black transition-colors">
          <Bot size={20} />
        </div>
        <h3 className="text-xl font-bold mb-2 text-white">AI Content Creation</h3>
        <p className="text-slate-300 max-w-md">Every post is a full production. Generates posts, reels, with hashtags and captions that match your brand voice accurately.</p>
        
        <div className="mt-8 space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2"><Check size={16} className="text-[#3ECF8E]"/> 100% Brand Safe</div>
          <div className="flex items-center gap-2"><Check size={16} className="text-[#3ECF8E]"/> Built-in Tone Matching</div>
          <div className="flex items-center gap-2"><Check size={16} className="text-[#3ECF8E]"/> Easy to extend</div>
        </div>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-3/4 opacity-10 group-hover:opacity-20 transition-opacity">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#3ECF8E" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-4.9C93.5,9.3,82.2,22.9,71,34.4C59.9,45.9,48.9,55.3,36.5,62.8C24.1,70.3,10.2,75.9,-2.8,80.7C-15.8,85.5,-27.9,89.5,-39.1,84.9C-50.3,80.3,-60.5,67.1,-69.3,53.4C-78.1,39.7,-85.5,25.5,-85.9,11.1C-86.3,-3.3,-79.7,-17.9,-70.7,-30.8C-61.7,-43.7,-50.3,-54.9,-37.8,-63.1C-25.3,-71.3,-11.7,-76.5,2.1,-80.1C15.9,-83.7,30.5,-63.6,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>
      </div>
      </CometCard>
    </div>
  );
}

function ConnectCard() {
  return (
    <div>
      <CometCard className="bg-gradient-to-br from-[#061018] via-[#072623] to-[#08302a] border border-white/5 rounded-xl p-8 hover:border-[#3ECF8E]/50 transition-colors group">
      <div className="w-10 h-10 bg-[#072623] rounded flex items-center justify-center mb-6 text-[#3ECF8E] border border-white/5 group-hover:bg-[#3ECF8E] group-hover:text-black transition-colors">
        <Shield size={20} />
      </div>
      <h3 className="text-xl font-bold mb-2 text-white">Connect and Get Started</h3>
      <p className="text-slate-300 mb-6">Connect your Facebook and Instagram to start automating your online presence</p>
      
      <div className="bg-black/30 rounded border border-white/5 p-4 space-y-4">
        <SocialConnectRow icon={FacebookIcon} name="Facebook" />
        <div className="h-px bg-white/5 w-full"></div>
        <SocialConnectRow icon={InstagramIcon} name="Instagram" />
      </div>
      </CometCard>
    </div>
  );
}

function SocialConnectRow({ icon: Icon, name }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; name: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-1">
          <Icon className="text-xl text-slate-300 w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-slate-300">{name}</span>
      </div>
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-white hover:bg-[#3ECF8E]/20 transition-all cursor-pointer">
        <ConnectIcon className="text-lg text-[#3ECF8E] w-4 h-4" />
      </button>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ size?: number }>; title: string; description: string }) {
  return (
    <div>
      <CometCard className="bg-gradient-to-br from-[#061018] via-[#072623] to-[#08302a] border border-white/5 rounded-xl p-8 hover:border-[#3ECF8E]/50 transition-colors group">
      <div className="w-10 h-10 bg-[#072623] rounded flex items-center justify-center mb-6 text-[#3ECF8E] border border-white/5 group-hover:bg-[#3ECF8E] group-hover:text-black transition-colors">
        <Icon size={20} />
      </div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-slate-300">{description}</p>
      </CometCard>
    </div>
  );
}
