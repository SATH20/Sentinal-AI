import { CometCard } from './ui/comet-card';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col items-center">
        <div className="text-center max-w-3xl mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Automation in <span className="text-[#3ECF8E]">60 Seconds</span></h2>
          <p className="text-lg text-gray-400">
            From connection to content, faster than making coffee. We provide a simple dashboard to manage your entire social fleet.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <StepCard step={1} title="Connect Accounts" description="Link Instagram, Twitter, and LinkedIn via secure OAuth integrations." />
          <StepCard step={2} title="Define Strategy" description="Tell the AI your niche, tone, and posting frequency in plain English." />
          <StepCard step={3} title="Go Live" description="Watch as content is generated, scheduled, and published automatically." />
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <CometCard className="bg-gradient-to-br from-[#061018] via-[#072623] to-[#08302a] border border-white/5 rounded-xl p-8 hover:border-[#3ECF8E]/50 transition-colors relative group overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3ECF8E]/0 via-[#3ECF8E]/50 to-[#3ECF8E]/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="w-12 h-12 rounded-full bg-[#072623] text-[#3ECF8E] flex items-center justify-center font-bold text-xl mb-6 border border-[#3ECF8E]/20">{step}</div>
      <h4 className="text-white font-bold mb-3 text-xl">{title}</h4>
      <p className="text-slate-300 leading-relaxed">{description}</p>
    </CometCard>
  );
}
