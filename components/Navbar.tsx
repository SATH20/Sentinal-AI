'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 border-b border-white/5 ${isScrolled ? 'bg-[#121212]/80 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">Sento</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#features" className="hover:text-[#3ECF8E] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#3ECF8E] transition-colors">How It Works</a>
          <a href="/docs" className="hover:text-[#3ECF8E] transition-colors">Docs</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a href="#login" className="text-sm font-medium hover:text-white text-gray-400 transition-colors">Sign in</a>
          <a href="/chat" className="bg-[#3ECF8E] text-[#121212] px-4 py-2 rounded-md text-sm font-bold hover:bg-[#34b27b] transition-all">
            Get Started
          </a>
        </div>

        <button className="md:hidden text-gray-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#1c1c1c] border-b border-white/10 p-6 flex flex-col gap-4">
          <a href="#features" className="text-gray-300 hover:text-[#3ECF8E]">Features</a>
          <a href="#how-it-works" className="text-gray-300 hover:text-[#3ECF8E]">How It Works</a>
          <div className="h-px bg-white/10 my-2"></div>
          <a href="/chat" className="bg-[#3ECF8E] text-[#121212] px-4 py-3 rounded text-center font-bold">Get Started</a>
        </div>
      )}
    </nav>
  );
}
