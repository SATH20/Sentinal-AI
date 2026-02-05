'use client';

import { useState, useEffect } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import WebPreview from '@/components/WebPreview';
import { Globe, Sparkles, Loader2, Save, Trash2, Download, ExternalLink, Plus, ChevronRight, Rocket } from 'lucide-react';

interface WebProject {
  id: string;
  project_name: string;
  generated_code?: string;
  created_at: string;
  deployed_url?: string;
}

export default function WebsitesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [projects, setProjects] = useState<WebProject[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const USER_ID = 'user_1'; // TODO: Get from auth

  // Fetch user's projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/web-projects/${USER_ID}`);
      const data = await res.json();
      if (data.status === 'success') {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}/api/generate-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
          prompt: prompt,
          project_name: projectName || undefined,
        }),
      });
      
      const data = await res.json();
      
      if (data.status === 'success') {
        setGeneratedCode(data.generated_code);
        setCurrentProjectId(data.project_id);
        setProjectName(data.project_name);
        fetchProjects(); // Refresh project list
      } else {
        setError(data.error || 'Failed to generate website');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadProject = async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/web-projects/detail/${projectId}`);
      const data = await res.json();
      
      if (data.status === 'success' && data.project) {
        setGeneratedCode(data.project.generated_code);
        setCurrentProjectId(data.project.id);
        setProjectName(data.project.project_name);
        setDeployedUrl(data.project.deployed_url || null);
        setShowProjects(false);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  const handleDeploy = async () => {
    if (!currentProjectId) return;
    
    setIsDeploying(true);
    setError(null);
    
    try {
      console.log('Deploying project:', currentProjectId);
      
      const res = await fetch(`${API_URL}/api/deploy-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: currentProjectId,
          project_name: projectName,
        }),
      });
      
      const data = await res.json();
      console.log('Deploy response:', data);
      
      if (data.status === 'success' && data.deployed_url) {
        setDeployedUrl(data.deployed_url);
        fetchProjects(); // Refresh to show deployed URL
      } else {
        setError(data.error || 'Deployment failed');
        console.error('Deploy error:', data.error);
      }
    } catch (err) {
      setError('Failed to deploy. Check if VERCEL_TOKEN is configured.');
      console.error('Deploy exception:', err);
    } finally {
      setIsDeploying(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Delete this project?')) return;
    
    try {
      await fetch(`${API_URL}/api/web-projects/${projectId}`, { method: 'DELETE' });
      fetchProjects();
      if (currentProjectId === projectId) {
        setGeneratedCode(null);
        setCurrentProjectId(null);
        setProjectName('');
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const exportCode = () => {
    if (!generatedCode) return;
    
    const blob = new Blob([generatedCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'website'}.jsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startNew = () => {
    setGeneratedCode(null);
    setCurrentProjectId(null);
    setProjectName('');
    setPrompt('');
    setDeployedUrl(null);
    setError(null);
  };

  return (
    <div className="flex h-screen bg-[#121212] text-white">
      <ChatSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3ECF8E] to-[#34b27b] flex items-center justify-center">
              <Globe size={20} className="text-[#121212]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Web Architect</h1>
              <p className="text-sm text-gray-400">Generate landing pages with AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProjects(!showProjects)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
            >
              My Projects ({projects.length})
              <ChevronRight size={16} className={`transition-transform ${showProjects ? 'rotate-90' : ''}`} />
            </button>
            {generatedCode && (
              <>
                {deployedUrl ? (
                  <a
                    href={deployedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors text-sm text-white font-medium flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    View Live
                  </a>
                ) : (
                  <button
                    onClick={handleDeploy}
                    disabled={isDeploying || !currentProjectId}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-sm text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket size={16} />
                        Deploy to Vercel
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={exportCode}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
                >
                  <Download size={16} />
                  Export
                </button>
                <button
                  onClick={startNew}
                  className="px-4 py-2 rounded-lg bg-[#3ECF8E] hover:bg-[#34b27b] transition-colors text-sm text-[#121212] font-medium flex items-center gap-2"
                >
                  <Plus size={16} />
                  New
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Projects Sidebar */}
          {showProjects && (
            <div className="w-72 border-r border-white/10 bg-[#1a1a1a] overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Saved Projects</h3>
                {projects.length === 0 ? (
                  <p className="text-sm text-gray-500">No projects yet</p>
                ) : (
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          currentProjectId === project.id
                            ? 'bg-[#3ECF8E]/20 border border-[#3ECF8E]/50'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => loadProject(project.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{project.project_name}</span>
                          <div className="flex items-center gap-1">
                            {project.deployed_url && (
                              <a
                                href={project.deployed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 hover:bg-green-500/20 rounded transition-colors"
                                title="View deployed site"
                              >
                                <ExternalLink size={14} className="text-green-400" />
                              </a>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProject(project.id);
                              }}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors"
                            >
                              <Trash2 size={14} className="text-gray-400 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {new Date(project.created_at).toLocaleDateString()}
                          </p>
                          {project.deployed_url && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                              Live
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Deployment Success Banner */}
            {deployedUrl && generatedCode && (
              <div className="mx-4 mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Rocket size={16} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-400">Deployed Successfully!</p>
                    <a 
                      href={deployedUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-green-300 hover:underline"
                    >
                      {deployedUrl}
                    </a>
                  </div>
                </div>
                <a
                  href={deployedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-sm text-white font-medium flex items-center gap-2"
                >
                  <ExternalLink size={14} />
                  Open
                </a>
              </div>
            )}

            {/* Error Banner */}
            {error && generatedCode && (
              <div className="mx-4 mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {!generatedCode ? (
              /* Generation Form */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-2xl">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3ECF8E] to-[#34b27b] flex items-center justify-center mx-auto mb-4">
                      <Sparkles size={32} className="text-[#121212]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Create Your Website</h2>
                    <p className="text-gray-400">
                      Describe your landing page and let AI build it for you.
                      {' '}Your Brand DNA will be automatically applied.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Project Name (optional)
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="My Landing Page"
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#3ECF8E]/50 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Describe your website
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Build me a modern landing page for a coffee brand. Include a hero section with a catchy headline, features section showing our coffee types, testimonials from customers, and a newsletter signup..."
                        rows={5}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#3ECF8E]/50 focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    {error && (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full py-4 rounded-lg bg-gradient-to-r from-[#3ECF8E] to-[#34b27b] hover:opacity-90 transition-opacity text-[#121212] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Generating your website...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          Generate Website
                        </>
                      )}
                    </button>
                  </div>

                  {/* Example prompts */}
                  <div className="mt-8">
                    <p className="text-sm text-gray-500 mb-3">Try these examples:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'SaaS landing page with pricing',
                        'Restaurant website with menu',
                        'Portfolio for a photographer',
                        'E-commerce product page',
                      ].map((example) => (
                        <button
                          key={example}
                          onClick={() => setPrompt(example)}
                          className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-sm text-gray-400 transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Preview Area */
              <div className="flex-1 p-4 overflow-hidden">
                <div className="h-full">
                  <WebPreview generatedCode={generatedCode} showEditor={true} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
