'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2, Share2, Maximize2, X, Eye, Crown, Zap, Save, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Project {
  id: string;
  post_id: string | null;
  html_code: string;
  is_shared: boolean;
  updated_at: string;
}

export default function StudioPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const isFirstGen = searchParams.get('firstGen') === 'true';

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentHtml, setCurrentHtml] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sessionTitle, setSessionTitle] = useState('Untitled Session');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishCaption, setPublishCaption] = useState('');
  const [promptVisible, setPromptVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.3-70b');
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);
  const [generatingFirst, setGeneratingFirst] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  
  // NEW: Save project state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    checkUser();
    loadSession();
    loadProject();
  }, [sessionId]);

  useEffect(() => {
    if (user) {
      fetchTokenBalance();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isFirstGen && initialPrompt && !generatingFirst && !loading && user) {
      handleFirstGeneration();
    }
  }, [isFirstGen, initialPrompt, user]);

  useEffect(() => {
    if (isFirstGen && generatingFirst) {
      const url = new URL(window.location.href);
      url.searchParams.delete('firstGen');
      window.history.replaceState({}, '', url.toString());
    }
  }, [isFirstGen, generatingFirst]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
    } else {
      setUser(session.user);
    }
  };

  const fetchTokenBalance = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_wallets')
      .select('token_balance')
      .eq('user_id', user.id)
      .single();

    setTokenBalance(data?.token_balance || 0);
  };

  const loadProject = async () => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('id, post_id, html_code, is_shared, updated_at')
        .eq('session_id', sessionId)
        .single();

      if (data) {
        setProject(data);
        if (data.html_code && data.html_code !== '<html><body><h1>Generating...</h1></body></html>') {
          setCurrentHtml(data.html_code);
        }
      }
    } catch (error) {
      console.error('Load project error:', error);
    }
  };

  const loadSession = async () => {
    try {
      console.log('Loading session:', sessionId);
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();

      if (data.session) {
        console.log('Session data received:', data);
        setSessionTitle(data.session.title);
        setSelectedModel(data.session.selected_model || 'llama-3.3-70b');
        setInitialPrompt(data.session.initial_prompt);
        setMessages(data.messages || []);
        
        setInitialLoading(false);
        retryCountRef.current = 0;
      } else {
        console.warn('No session data received, retrying...');
        if (retryCountRef.current < 5) {
          retryCountRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);
          setTimeout(() => loadSession(), delay);
        } else {
          console.error('Max retries reached');
          setInitialLoading(false);
          alert('Failed to load session. Please refresh the page.');
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      if (retryCountRef.current < 5) {
        retryCountRef.current += 1;
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);
        setTimeout(() => loadSession(), delay);
      } else {
        setInitialLoading(false);
        alert('Failed to load session. Please refresh the page.');
      }
    }
  };

  const handleFirstGeneration = async () => {
    if (generatingFirst || !user || !initialPrompt) return;

    setGeneratingFirst(true);
    setLoading(true);

    setMessages([{
      id: Date.now().toString(),
      role: 'user',
      content: initialPrompt,
      created_at: new Date().toISOString()
    }]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: initialPrompt,
          userId: user.id,
          model: selectedModel
        })
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let htmlResult = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        buffer += text;
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              
              const data = JSON.parse(jsonStr);

              if (data.type === 'status') {
                setMessages(prev => {
                  const filtered = prev.filter(m => m.id !== 'status-msg');
                  return [...filtered, {
                    id: 'status-msg',
                    role: 'assistant',
                    content: data.message,
                    created_at: new Date().toISOString()
                  }];
                });
              } else if (data.type === 'complete') {
                htmlResult = data.html;
                setCurrentHtml(data.html);
                setHasUnsavedChanges(false); // First generation auto-saved by backend
                setMessages(prev => {
                  const filtered = prev.filter(m => m.id !== 'status-msg');
                  return [...filtered, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'Generated initial code',
                    created_at: new Date().toISOString()
                  }];
                });
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('JSON parse error:', e);
            }
          }
        }
      }

      await loadProject();
      await fetchTokenBalance();

    } catch (error: any) {
      console.error('First generation failed:', error);
      alert(error.message || 'Failed to generate. Please try again.');
    }

    setLoading(false);
    setGeneratingFirst(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading || !user) return;

    if (selectedModel === 'claude-sonnet-4.5' && tokenBalance < 1000) {
      setShowInsufficientTokens(true);
      setTimeout(() => setShowInsufficientTokens(false), 5000);
      return;
    }

    const userMessage = inputMessage;
    setInputMessage('');
    setLoading(true);

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          userId: user.id,
          model: selectedModel
        })
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        buffer += text;
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              
              const data = JSON.parse(jsonStr);

              if (data.type === 'status') {
                setMessages(prev => {
                  const filtered = prev.filter(m => m.id !== 'status-msg');
                  return [...filtered, {
                    id: 'status-msg',
                    role: 'assistant',
                    content: data.message,
                    created_at: new Date().toISOString()
                  }];
                });
              } else if (data.type === 'complete') {
                setCurrentHtml(data.html);
                setHasUnsavedChanges(true); // Mark as unsaved after generation
                setMessages(prev => {
                  const filtered = prev.filter(m => m.id !== 'status-msg');
                  return [...filtered, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'Generated updated code',
                    created_at: new Date().toISOString()
                  }];
                });
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('JSON parse error:', e);
            }
          }
        }
      }

      await loadProject();
      await fetchTokenBalance();

    } catch (error: any) {
      console.error('Generation failed:', error);
      alert(error.message || 'Failed to generate. Please try again.');
    }

    setLoading(false);
  };

  // NEW: Save project without creating post
  const handleSaveProject = async () => {
    if (!currentHtml || !user || !project || saving) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlCode: currentHtml })
      });

      const { success, error } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to save');
      }

      setHasUnsavedChanges(false);
      await loadProject();
      console.log('✅ Project saved');
    } catch (error: any) {
      console.error('Save failed:', error);
      alert(error.message || 'Failed to save project');
    }

    setSaving(false);
  };

  // NEW: Update existing post with current code
  const handleUpdatePost = async () => {
    if (!project?.post_id || !currentHtml || !user) return;

    if (!confirm('Update the published post with current code?')) return;

    try {
      const response = await fetch(`/api/posts/${project.post_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          htmlCode: currentHtml,
          userId: user.id 
        })
      });

      const { success, error } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to update post');
      }

      alert('✅ Post updated successfully!');
      await loadProject();
    } catch (error: any) {
      console.error('Update post failed:', error);
      alert(error.message || 'Failed to update post');
    }
  };

  // NEW: Share project to feed (first time)
  const handleShare = async () => {
    if (!publishCaption.trim() || publishing || !user || !project) return;

    setPublishing(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          caption: publishCaption,
          promptVisible,
          userId: user.id
        })
      });

      const { success, error } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to publish');
      }

      setShowPublishModal(false);
      setPublishCaption('');
      await loadProject();
      alert('✅ Published to feed!');
      router.push('/feed');
    } catch (error: any) {
      console.error('Publish failed:', error);
      alert(error.message || 'Failed to publish');
    }

    setPublishing(false);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4"
          >
            🧄
          </motion.div>
          <p className="text-gray-400">Loading studio...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-6xl animate-bounce">🧄</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800 flex-shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/feed')} 
            className="flex items-center gap-3 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={24} />
            <span className="text-3xl">🧄</span>
            <h1 className="text-xl font-black">{sessionTitle}</h1>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800">
              {selectedModel === 'claude-sonnet-4.5' ? (
                <>
                  <Crown size={16} className="text-pink-400" />
                  <span className="text-sm font-mono text-pink-400">Claude</span>
                </>
              ) : (
                <>
                  <Zap size={16} className="text-purple-400" />
                  <span className="text-sm font-mono text-purple-400">Llama</span>
                </>
              )}
            </div>

            {selectedModel === 'claude-sonnet-4.5' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800">
                <Zap size={16} className="text-yellow-400" />
                <span className="text-sm font-bold">{tokenBalance.toLocaleString()}</span>
              </div>
            )}

            {/* NEW: Save Project Button */}
            <motion.button
              onClick={handleSaveProject}
              disabled={!hasUnsavedChanges || saving || loading}
              whileHover={hasUnsavedChanges && !saving ? { scale: 1.05 } : {}}
              whileTap={hasUnsavedChanges && !saving ? { scale: 0.95 } : {}}
              className={`px-5 py-2 rounded-full font-semibold flex items-center gap-2 transition-all ${
                hasUnsavedChanges 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-green-600/30 text-green-400 cursor-default'
              } disabled:opacity-30`}
            >
              <Save size={18} />
              {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Project' : 'Saved ✓'}
            </motion.button>

            {/* NEW: Update Post Button (only if post exists) */}
            {project?.post_id ? (
              <motion.button
                onClick={handleUpdatePost}
                disabled={loading || !currentHtml}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-full font-bold flex items-center gap-2 disabled:opacity-30"
              >
                <RefreshCw size={18} />
                Update Post
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setShowPublishModal(true)}
                disabled={!project || !currentHtml}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 rounded-full font-bold flex items-center gap-2 disabled:opacity-30"
              >
                <Share2 size={18} />
                Share to Feed
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Chat Panel - 40% */}
        <div className="w-2/5 border-r border-gray-800 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
            {showInsufficientTokens && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
              >
                <p className="text-red-400 text-sm">
                  ⚠️ Insufficient tokens! You need at least 1,000 tokens.
                  <br />
                  <span className="text-gray-400">Current balance: {tokenBalance} tokens</span>
                </p>
              </motion.div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {(loading || generatingFirst) && (
              <div className="flex justify-start">
                <div className="bg-gray-800 px-4 py-3 rounded-2xl flex items-center gap-2">
                  <Loader2 className="animate-spin text-purple-400" size={20} />
                  <span className="text-sm text-gray-400">
                    {generatingFirst ? 'Creating your project...' : 'Generating...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 border-t border-gray-800 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Describe your changes..."
                className="flex-1 px-4 py-3 bg-gray-900 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none"
                disabled={loading || generatingFirst}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading || generatingFirst}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel - 60% */}
        <div className="flex-1 flex flex-col bg-gray-900 min-h-0">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-purple-400" />
              <span className="text-sm font-mono text-gray-400">live-preview</span>
              {hasUnsavedChanges && (
                <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full font-bold">
                  Unsaved
                </span>
              )}
            </div>
            <button 
              onClick={() => setFullscreen(true)}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
            >
              <Maximize2 size={18} className="text-gray-400" />
            </button>
          </div>

          <div className="flex-1 bg-white min-h-0">
            {currentHtml ? (
              <iframe
                srcDoc={currentHtml}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin"
                title="preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Loader2 className="animate-spin mx-auto mb-4" size={48} />
                  <p>{generatingFirst ? 'Generating your first creation...' : 'Waiting for generation...'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
            onClick={() => !publishing && setShowPublishModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Share to Feed</h3>
                <button onClick={() => !publishing && setShowPublishModal(false)} disabled={publishing}>
                  <X size={24} className="text-gray-400 hover:text-white" />
                </button>
              </div>

              <input
                type="text"
                value={publishCaption}
                onChange={(e) => setPublishCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none mb-4"
                disabled={publishing}
              />

              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promptVisible}
                  onChange={(e) => setPromptVisible(e.target.checked)}
                  className="w-5 h-5"
                  disabled={publishing}
                />
                <span className="text-sm text-gray-400">Share prompt publicly</span>
              </label>

              <motion.button
                onClick={handleShare}
                disabled={!publishCaption.trim() || publishing}
                whileHover={!publishing ? { scale: 1.02 } : {}}
                whileTap={!publishing ? { scale: 0.98 } : {}}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {publishing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      🧄
                    </motion.div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Share2 size={18} />
                    Publish
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Preview */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
          >
            <div className="p-4 flex justify-between items-center border-b border-gray-800">
              <span className="font-mono text-sm text-gray-400">Fullscreen Preview</span>
              <button onClick={() => setFullscreen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <iframe
              srcDoc={currentHtml}
              className="flex-1 w-full bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}