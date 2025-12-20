'use client';

import { ArrowLeft, Sparkles, Image, Film, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const recommendedPrompts = [
  { type: 'image', prompt: 'A photorealistic close-up of a luxury watch on a marble surface, studio-lit with soft shadows, 4K quality' },
  { type: 'image', prompt: 'Minimalist flat-lay of skincare products with natural lighting, clean white background, product photography' },
  { type: 'reel', prompt: 'A day in the life of a digital creator, morning routine, aesthetic coffee shots, golden hour lighting' },
  { type: 'image', prompt: 'Aesthetic workspace setup with plants, MacBook, and warm ambient lighting, cozy vibes' },
  { type: 'reel', prompt: 'Unboxing a mystery package, close-up shots, satisfying reveal, trendy background music' },
  { type: 'image', prompt: 'Street style fashion portrait, urban background, cinematic color grading, 35mm lens bokeh' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="text-gray-400 hover:text-[#3ECF8E] transition-colors">
      {copied ? <Check size={16} className="text-[#3ECF8E]" /> : <Copy size={16} />}
    </button>
  );
}

export default function LibraryPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button 
          onClick={() => router.push('/chat')}
          className="flex items-center gap-2 text-gray-400 hover:text-[#3ECF8E] transition-colors mb-8"
        >
          <ArrowLeft size={18} /> Back to Chat
        </button>

        <h1 className="text-3xl font-bold mb-2">Prompt Library</h1>
        <p className="text-gray-400 mb-8">Learn how to craft effective prompts for stunning content</p>

        {/* Recommended Prompts */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-[#3ECF8E]" /> Recommended Prompts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedPrompts.map((item, idx) => (
              <div key={idx} className="bg-[#1c1c1c] border border-white/10 rounded-lg p-4 hover:border-[#3ECF8E]/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${item.type === 'image' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {item.type === 'image' ? <span className="flex items-center gap-1"><Image size={12} /> Image</span> : <span className="flex items-center gap-1"><Film size={12} /> Reel</span>}
                  </span>
                  <CopyButton text={item.prompt} />
                </div>
                <p className="text-sm text-gray-300">{item.prompt}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Prompting Guide */}
        <section>
          <h2 className="text-xl font-bold mb-6">🎨 Gemini Image Generation: Prompting Guide</h2>
          
          <div className="space-y-8">
            {/* Core Principle */}
            <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3 text-[#3ECF8E]">1. The Core Principle</h3>
              <p className="text-gray-400 mb-4">Do not just list keywords. Gemini understands deep language. A narrative description works better than a tag cloud.</p>
              <div className="space-y-2">
                <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                  <p className="text-sm"><span className="text-red-400 font-medium">Bad:</span> <span className="text-gray-400">cat, space, banana, restaurant</span></p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                  <p className="text-sm"><span className="text-[#3ECF8E] font-medium">Good:</span> <span className="text-gray-300">A photorealistic close-up of a cat eating a nano-banana in a fancy restaurant under the Gemini constellation.</span></p>
                </div>
              </div>
            </div>

            {/* Keyword Categories */}
            <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-[#3ECF8E]">2. Keyword Categories (The &quot;Ingredients&quot;)</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-white mb-2">📸 Photography & Realism</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                    <p><span className="text-gray-300">Shot Types:</span> Close-up, Wide-angle, Macro shot, Low-angle, Overhead shot, Selfie</p>
                    <p><span className="text-gray-300">Lighting:</span> Studio-lit, Softbox, Natural light, Cinematic, Golden hour, Neon-lit</p>
                    <p><span className="text-gray-300">Quality:</span> Photorealistic, High-resolution, 4K, Ultra-realistic, Sharp focus</p>
                    <p><span className="text-gray-300">Camera:</span> Bokeh, DSLR, 35mm lens, Fish-eye</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-2">🖌️ Art Styles & Design</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                    <p><span className="text-gray-300">Digital:</span> 3D render, Vector art, Low poly, Pixel art, Isometric</p>
                    <p><span className="text-gray-300">Illustration:</span> Oil painting, Watercolor, Charcoal sketch, Anime, Comic book</p>
                    <p><span className="text-gray-300">Design Assets:</span> Sticker, Logo, Icon, Infographic, Mascot</p>
                    <p><span className="text-gray-300">Text/Layout:</span> Minimalist, Negative space, Typography, Calligraphy</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-2">🛠️ Technical Constraints</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                    <p><span className="text-gray-300">Background:</span> Transparent background, Solid white background</p>
                    <p><span className="text-gray-300">Text Rendering:</span> Text &quot;[Your Text]&quot;, Legible text, Bold font, Serif font</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Templates */}
            <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-[#3ECF8E]">3. How to Prompt: Templates</h3>
              
              <div className="space-y-4">
                <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                  <h4 className="font-medium text-white mb-2">The &quot;Photorealism&quot; Formula</h4>
                  <p className="text-sm text-gray-400 font-mono">&quot;A [Quality] [Shot Type] of [Subject], [Action/Expression], set in [Environment]. The scene is illuminated by [Lighting], creating a [Mood]. Captured with [Lens Details].&quot;</p>
                </div>

                <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                  <h4 className="font-medium text-white mb-2">The &quot;Product Mockup&quot; Formula</h4>
                  <p className="text-sm text-gray-400 font-mono">&quot;A [High-Res], [Studio-lit] product photograph of [Product] on a [Surface/Background]. The lighting is [Setup] to highlight [Feature].&quot;</p>
                </div>

                <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                  <h4 className="font-medium text-white mb-2">The &quot;Sticker/Asset&quot; Formula</h4>
                  <p className="text-sm text-gray-400 font-mono">&quot;A [Style] sticker of [Subject]. The design should have [Line Style] and [Color Palette]. The background must be [Transparent/Solid Color].&quot;</p>
                </div>
              </div>
            </div>

            {/* Advanced Strategies */}
            <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-[#3ECF8E]">4. Advanced Prompting Strategies</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-white mb-2">🔄 Editing & Iteration</h4>
                  <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                    <li><span className="text-gray-300">Add/Remove:</span> &quot;Using the provided image, please add a [Object] to the [Location].&quot;</li>
                    <li><span className="text-gray-300">Inpainting:</span> &quot;Change only the [Object] to be [New Description]. Keep everything else exactly the same.&quot;</li>
                    <li><span className="text-gray-300">Style Transfer:</span> &quot;Transform this image into the artistic style of [Artist/Movement].&quot;</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-2">🧠 Semantic Negative Prompting</h4>
                  <p className="text-sm text-gray-400 mb-2">Do not use &quot;No&quot; or &quot;Without.&quot; Describe the absence positively.</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-red-400">Avoid: &quot;A street with no cars.&quot;</span>
                    <span className="text-[#3ECF8E]">Use: &quot;An empty, deserted street.&quot;</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parameters */}
            <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-[#3ECF8E]">5. Parameter Keywords (API Configuration)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-300 font-medium mb-1">Resolution (Gemini 3 Pro only)</p>
                  <p className="text-gray-400">1K, 2K, 4K (Must be uppercase &apos;K&apos;)</p>
                </div>
                <div>
                  <p className="text-gray-300 font-medium mb-1">Aspect Ratio</p>
                  <p className="text-gray-400">1:1 (Square), 16:9 (Widescreen), 9:16 (Mobile), 4:3, 3:4</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}