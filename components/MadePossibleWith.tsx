"use client";

import { useState } from 'react';
import { KestraIcon, VercelIcon, GoogleGeminiIcon, FacebookIcon, InstagramIcon, ImagekitIcon } from './icons/SocialIcons';
import { motion } from 'motion/react';

const brands = [
  { name: 'Kestra', icon: KestraIcon },
  { name: 'Vercel', icon: VercelIcon },
  { name: 'Google Gemini', icon: GoogleGeminiIcon },
  { name: 'Facebook', icon: FacebookIcon },
  { name: 'Instagram', icon: InstagramIcon },
  { name: 'Imagekit', icon: ImagekitIcon },
];

export default function MadePossibleWith() {
  const [activeBrand, setActiveBrand] = useState('Open Source');

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto text-left pl-6 md:pl-20 border-b border-white/10">
      <h3 className="text-2xl text-gray-500 font-medium mb-2">Made Possible with</h3>
      <h2 className="text-5xl md:text-6xl font-bold text-white mb-16 h-20 transition-all duration-300">
        {activeBrand}
      </h2>

      <div className="flex flex-wrap items-center gap-8">
        {brands.map((brand) => {
          const Icon = brand.icon;
          const isActive = activeBrand === brand.name;
          return (
            <motion.div
              key={brand.name}
              onMouseEnter={() => setActiveBrand(brand.name)}
              onMouseLeave={() => setActiveBrand('Open Source')}
              className={`relative p-4 rounded-lg transition-all duration-300 cursor-pointer ${isActive ? 'bg-[#1c1c1c] border border-white/20' : 'opacity-50 hover:opacity-100'}`}
              whileHover={{ scale: 1.08, y: -6 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 150, damping: 12, mass: 0.1 }}
            >
              <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="brand-glow"
                  animate={{ opacity: isActive ? 0.22 : 0 }}
                  transition={{ duration: 0.18 }}
                />
              </motion.div>

              <motion.div
                className="w-8 h-8 flex items-center justify-center"
                animate={isActive ? { y: 0 } : { y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
