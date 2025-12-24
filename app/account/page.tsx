'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ArrowLeft } from 'lucide-react';

const accountTypes = ['Digital Creator', 'Business', 'Personal Brand', 'Agency', 'Influencer'];

export default function AccountPage() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Khushal',
    lastName: 'Agarwal',
    username: 'anamikaaradhya02',
    accountType: 'Digital Creator',
    systemPrompt: 'You are a social media manager for a digital creator focused on shopping and casual. Your goal is to grow their audience and drive engagement. Create post ideas, draft captions, and respond to comments in a witty, insightful, encouraging tone.',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button 
          onClick={() => router.push('/chat')}
          className="flex items-center gap-2 text-gray-400 hover:text-[#3ECF8E] transition-colors mb-8"
        >
          <ArrowLeft size={18} /> Back to Chat
        </button>

        <h1 className="text-3xl font-bold mb-2">Account Information</h1>
        <p className="text-gray-400 mb-8">Manage your profile and AI settings</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#3ECF8E]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#3ECF8E]/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-[#3ECF8E]/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between focus:outline-none focus:border-[#3ECF8E]/50 transition-colors"
              >
                {formData.accountType}
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-full bg-[#232323] border border-white/10 rounded-lg overflow-hidden shadow-xl z-10">
                  {accountTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setFormData({ ...formData, accountType: type }); setDropdownOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[#3ECF8E]/10 hover:text-[#3ECF8E] transition-colors ${formData.accountType === type ? 'text-[#3ECF8E] bg-[#3ECF8E]/5' : 'text-gray-300'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">System Prompt</label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              rows={5}
              className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#3ECF8E]/50 transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">This prompt guides how Sento creates content for your brand.</p>
          </div>

          <button
            type="submit"
            className="w-full bg-[#3ECF8E] text-[#121212] py-3 rounded-lg font-bold text-lg hover:bg-[#34b27b] transition-colors"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}