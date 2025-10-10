'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Eye, EyeOff, Terminal, Loader2, Check, Maximize2, Save } from 'lucide-react';

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  const [user, setUser] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [caption, setCaption] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [promptVisible, setPromptVisible] = useState(true);
  const [stage, setStage] = useState<'input' | 'preview'>('input');
  const [fullscreen, setFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
    if (projectId) loadProject();
  }, [projectId]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
    } else {
      setUser(session.user);
    }
  };

  const loadProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (data) {
      setProjectTitle(data.title);
      setPrompt(data.prompt);
      setHtmlCode(data.html_code);
      setStage('preview');
      setIsEditing(true);
      setCurrentProjectId(data.id);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setStage('preview');
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      setHtmlCode(data.html);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate. Please try again.');
      setStage('input');
    }
    setLoading(false);
  };

  const handleSaveProject = async () => {
    if (!projectTitle.trim() || !htmlCode || saving) {
      if (!projectTitle.trim()) alert('Please add a project title');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && currentProjectId) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            title: projectTitle,
            prompt,
            html_code: htmlCode
          })
          .eq('id', currentProjectId);

        if (error) throw error;
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            title: projectTitle,
            prompt,
            html_code: htmlCode
          })
          .select()
          .single();

        if (error) throw error;
        
        // Set the new project ID and mark as editing to prevent duplicate creation
        setCurrentProjectId(data.id);
        setIsEditing(true);
      }

      router.push('/projects');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!caption.trim() || !htmlCode || sharing) {
      if (!caption.trim()) alert('Please add a caption');
      return;
    }

    setSharing(true);
    try {
      const { data: postData, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption,
          prompt,
          prompt_visible: promptVisible,
          html_code: htmlCode
        })
        .select()
        .single();

      if (error) throw error;

      // Update project if it exists
      if (currentProjectId) {
        await supabase
          .from('projects')
          .update({ is_shared: true, post_id: postData.id })
          .eq('id', currentProjectId);
      }

      router.push('/feed');
    } catch (error) {
      console.error('Failed to share:', error);
      alert('Failed to share post. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setHtmlCode('');
    setCaption('');
    setProjectTitle('');
    setStage('input');
    setIsEditing(false);
    setCurrentProjectId(null);
    router.push('/create');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/feed')} 
            className="flex items-center gap-3 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={24} />
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧄</span>
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                {isEditing ? 'EDIT PROJECT' : 'VIBE CONSOLE'}
              </h1>
            </div>
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800">
            <Terminal size={16} className="text-purple-400" />
            <span className="text-sm font-mono text-gray-400">v1.0.0</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {stage === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-gray-800/50 px-6 py-3 flex items-center gap-2 border-b border-gray-700">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm text-gray-400 font-mono ml-4">vibe-input.sh</span>
                </div>

                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2 text-purple-400 font-mono text-sm">
                    <Terminal size={16} />
                    <span>garlic@vibe:~$</span>
                    <span className="text-gray-500">describe_your_vision</span>
                  </div>

                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A cyberpunk portfolio with neon gradients and floating particles..."
                    className="w-full h-64 bg-black/50 text-white p-4 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none resize-none font-mono text-sm placeholder:text-gray-600"
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleGenerate();
                      }
                    }}
                  />

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-mono">Ctrl + Enter to execute</span>
                    <motion.button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                      Execute
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Start Templates</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    'A minimalist portfolio with dark mode',
                    'An animated landing page with gradients',
                    'A product showcase with hover effects',
                    'A music player interface'
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(example)}
                      className="p-4 bg-gray-900 hover:bg-gray-800 rounded-xl border border-gray-800 hover:border-purple-500/50 transition-all text-left text-sm"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-200px)]"
            >
              <div className="grid lg:grid-cols-2 gap-6 h-full">
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
                  <div className="bg-gray-800/50 px-6 py-3 flex items-center justify-between border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <Eye size={16} className="text-purple-400" />
                      <span className="text-sm font-mono text-gray-400">live-preview</span>
                    </div>
                    <button 
                      onClick={() => setFullscreen(!fullscreen)}
                      className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                    >
                      <Maximize2 size={16} className="text-gray-400" />
                    </button>
                  </div>

                  <div className="flex-1 bg-white relative">
                    {loading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="text-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            className="text-6xl mb-4"
                          >
                            🧄
                          </motion.div>
                          <p className="text-gray-400 font-mono text-sm">Generating your vibe...</p>
                        </div>
                      </div>
                    ) : (
                      <iframe
                        srcDoc={htmlCode}
                        className="w-full h-full"
                        sandbox="allow-scripts"
                        title="preview"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin text-purple-400" size={20} />
                          <span className="font-mono text-sm text-gray-400">Processing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="text-green-400" size={20} />
                          <span className="font-mono text-sm text-gray-400">Generation Complete</span>
                        </>
                      )}
                    </div>
                  </div>

                  {!loading && htmlCode && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6"
                      >
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                          <Save className="text-purple-400" size={18} />
                          Save Project
                        </h3>

                        <input
                          type="text"
                          value={projectTitle}
                          onChange={(e) => setProjectTitle(e.target.value)}
                          placeholder="Project title..."
                          className="w-full px-4 py-3 bg-black/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none mb-4"
                        />

                        <motion.button
                          onClick={handleSaveProject}
                          disabled={!projectTitle.trim() || saving}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="animate-spin" size={18} />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              {isEditing ? 'Update Project' : 'Save Project'}
                            </>
                          )}
                        </motion.button>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6"
                      >
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                          <span className="text-purple-400">→</span>
                          Share to Feed
                        </h3>

                        <input
                          type="text"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Add a caption..."
                          className="w-full px-4 py-3 bg-black/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none mb-4"
                        />

                        <label className="flex items-center gap-3 mb-6 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={promptVisible}
                              onChange={(e) => setPromptVisible(e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-12 h-6 rounded-full transition-colors ${promptVisible ? 'bg-purple-600' : 'bg-gray-700'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform transform ${promptVisible ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
                            </div>
                          </div>
                          <span className="text-sm text-gray-400 flex items-center gap-2">
                            {promptVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                            Share prompt publicly
                          </span>
                        </label>

                        <div className="flex gap-3">
                          <button
                            onClick={handleReset}
                            disabled={sharing}
                            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition-colors disabled:opacity-30"
                          >
                            New Vibe
                          </button>
                          <motion.button
                            onClick={handleShare}
                            disabled={!caption.trim() || sharing}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {sharing ? (
                              <>
                                <Loader2 className="animate-spin" size={18} />
                                Sharing...
                              </>
                            ) : (
                              'Share'
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {fullscreen && htmlCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
            onClick={() => setFullscreen(false)}
          >
            <div className="p-4 flex justify-between items-center border-b border-gray-800">
              <span className="font-mono text-sm text-gray-400">Fullscreen Preview</span>
              <button className="text-gray-400 hover:text-white">✕</button>
            </div>
            <iframe
              srcDoc={htmlCode}
              className="flex-1 w-full bg-white"
              sandbox="allow-scripts"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}