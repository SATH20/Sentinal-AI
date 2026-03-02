'use client';
// Premium SaaS sidebar with subtle live animations

import { ChevronLeft, ChevronRight, LogOut, Settings, BookOpen, User, Sparkles, LayoutDashboard, Globe, Zap } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatSidebar({ isOpen, onToggle }: ChatSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className={`${isOpen ? 'w-72' : 'w-16'} transition-all duration-300 bg-[#1c1c1c] border-r border-white/10 flex flex-col h-screen relative`}>
      {/* Toggle Button */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-6 w-6 h-6 bg-[#232323] border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-[#3ECF8E] hover:border-[#3ECF8E]/50 transition-colors z-10"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <a href="/" className={`text-xl font-bold tracking-tight ${!isOpen && 'hidden'}`}>Sento</a>
        {!isOpen && <a href="/" className="text-xl font-bold">S</a>}
      </div>

      {/* Profile Section */}
      <div className={`p-4 border-b border-white/10 ${!isOpen && 'flex justify-center'}`}>
        <div className={`flex items-center gap-3 ${!isOpen && 'flex-col'}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#3ECF8E] to-[#34b27b] flex-shrink-0 flex items-center justify-center text-[#121212] font-bold text-sm transform transition-transform duration-300 hover:scale-105">
            <div className="w-full h-full flex items-center justify-center">AA</div>
            <span className="absolute inset-0 rounded-full ring-0 ring-[#3ECF8E]/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">anamikaaradhya02</p>
              <p className="text-xs text-gray-500">@anamikaaradhya02</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <SidebarButton icon={Sparkles} label="Brand Manager" isOpen={isOpen} onClick={() => router.push('/brand')} active={pathname === '/brand'} />
        <SidebarButton icon={Zap} label="Automate" isOpen={isOpen} onClick={() => router.push('/automate')} active={pathname === '/automate'} />
        <SidebarButton icon={LayoutDashboard} label="Analytics" isOpen={isOpen} onClick={() => router.push('/analytics')} active={pathname === '/analytics'} />
        <SidebarButton icon={Globe} label="Web Architect" isOpen={isOpen} onClick={() => router.push('/websites')} active={pathname === '/websites'} />
        
        <div className="h-px bg-white/10 my-4"></div>
        <SidebarButton icon={BookOpen} label="Prompt Library" isOpen={isOpen} onClick={() => router.push('/library')} active={pathname?.startsWith('/library') ?? false} />
        <SidebarButton icon={User} label="Account Information" isOpen={isOpen} onClick={() => router.push('/account')} active={pathname?.startsWith('/account') ?? false} />
        
        <div className="h-px bg-white/10 my-4"></div>
        
        
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-white/10">
        <SidebarButton icon={LogOut} label="Sign Out" isOpen={isOpen} onClick={() => router.push('/')} />
      </div>
    </aside>
  );
}


interface SidebarButtonProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  isOpen: boolean;
  isSocialIcon?: boolean;
  onClick: () => void;
  active?: boolean;
}

function SidebarButton({ icon: Icon, label, isOpen, isSocialIcon, onClick, active = false }: SidebarButtonProps) {
  return (
    <div className={`relative ${!isOpen ? 'flex justify-center' : ''}`}>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 transition-colors group ${!isOpen ? 'justify-center' : 'hover:bg-[#3ECF8E]/10 hover:text-[#3ECF8E]'} ${active ? 'bg-white/3 text-[#3ECF8E]' : ''}`}
      >
        { /* Active thin indicator when expanded */ }
        {active && isOpen && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-[#3ECF8E] to-[#34b27b] shadow-[0_0_20px_rgba(62,207,142,0.08)]"></span>
        )}

        <span className={`flex items-center justify-center ${isSocialIcon ? 'w-5 h-5' : ''} transition-transform duration-200 ${isOpen ? 'group-hover:translate-x-1' : ''}`}>
          {isSocialIcon ? (
            <Icon className={`w-5 h-5 transition-colors ${active ? 'text-[#3ECF8E]' : 'group-hover:text-[#3ECF8E]'}`} />
          ) : (
            <Icon size={20} className={`transition-colors ${active ? 'text-[#3ECF8E]' : 'group-hover:text-[#3ECF8E]'}`} />
          )}
        </span>

        {isOpen && (
          <span className={`text-sm font-medium transition-transform duration-200 ${active ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
            {label}
          </span>
        )}

        { /* Tooltip when collapsed */ }
        {!isOpen && (
          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs bg-[#0b0b0b] text-gray-200 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
            {label}
          </span>
        )}
      </button>
    </div>
  );
}