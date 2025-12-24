import { Share2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#121212] py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-300">Sento</span>
        </div>
        <div className="text-gray-500 text-sm">
          © 2025 Khushal Agarwal All rights reserved.
        </div>
        <div className="flex gap-6 text-gray-400">
          <Share2 size={20} className="hover:text-[#3ECF8E] cursor-pointer"/>
          <span className="hover:text-[#3ECF8E] cursor-pointer">Twitter</span>
          <span className="hover:text-[#3ECF8E] cursor-pointer">GitHub</span>
        </div>
      </div>
    </footer>
  );
}
