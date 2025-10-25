'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2, Share2, Maximize2, X, Eye, Crown, Zap, Save, RefreshCw, CheckCircle } from 'lucide-react';
import Image from 'next/image';

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

interface Session {
  id: string;
  title: string;
  initial_prompt: string;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  generation_error: string | null;
  retry_count: number;
  selected_model: string;
}

export default function StudioPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentHtml, setCurrentHtml] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishCaption, setPublishCaption] = useState('');
  const [promptVisible, setPromptVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const justSavedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const generationTriggeredRef = useRef(false);
  const previousStatusRef = useRef<string | null>(null);

  useEffect(() => {
    checkUser();
  }, [sessionId]);

  useEffect(() => {
    if (user) {
      loadSession();
      loadProject();
      fetchTokenBalance();
      
      const unsubscribe = subscribeToSessionStatus();
      return unsubscribe;
    }
  }, [user, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session && session.generation_status === 'pending' && !generationTriggeredRef.current && !loading && user) {
      console.log('🚀 Auto-triggering generation for pending session');
      generationTriggeredRef.current = true;
      handleGeneration(session.initial_prompt);
    }
  }, [session, user, loading]);

  useEffect(() => {
    if (session && previousStatusRef.current === 'generating' && session.generation_status === 'completed') {
      console.log('✅ Generation completed, reloading project and messages...');
      
      setLoading(false);
      loadProject();
      loadMessages();
    }
    
    previousStatusRef.current = session?.generation_status || null;
  }, [session?.generation_status]);

  useEffect(() => {
    return () => {
      if (justSavedTimeoutRef.current) {
        clearTimeout(justSavedTimeoutRef.current);
      }
    };
  }, []);

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

  const subscribeToSessionStatus = () => {
    console.log('🔔 Subscribing to session updates:', sessionId);
    
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('🔄 Realtime session update received:', payload.new);
          const updatedSession = payload.new as Session;
          setSession(updatedSession);
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    return () => {
      console.log('🔕 Unsubscribing from session updates');
      supabase.removeChannel(channel);
    };
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
          console.log('✅ Project HTML loaded');
        }
      }
    } catch (error) {
      console.error('Load project error:', error);
    }
  };

  const loadMessages = async () => {
    try {
      console.log('📨 Loading chat messages...');
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);
        console.log(`✅ Loaded ${data.length} messages`);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const loadSession = async () => {
    try {
      console.log('📖 Loading session:', sessionId);
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();

      if (data.session) {
        console.log('✅ Session loaded:', data.session);
        setSession(data.session);
        
        if (data.messages) {
          setMessages(data.messages);
        }
        
        setInitialLoading(false);
      } else {
        console.error('Session not found');
        setInitialLoading(false);
        alert('Session not found. Redirecting to feed.');
        router.push('/feed');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      setInitialLoading(false);
      alert('Failed to load session. Please try again.');
    }
  };

  const handleGeneration = async (userMessage: string) => {
    if (!user || !session || loading) return;

    if (session.selected_model === 'claude-sonnet-4.5' && tokenBalance < 1000) {
      setShowInsufficientTokens(true);
      setTimeout(() => setShowInsufficientTokens(false), 5000);
      return;
    }

    setLoading(true);
    setSession(prev => prev ? { ...prev, generation_status: 'generating' } : null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          userId: user.id,
          model: session.selected_model
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Generation request accepted, backend will process');
      } else {
        throw new Error(result.error || 'Generation failed');
      }

    } catch (error: any) {
      console.error('Generation failed:', error);
      
      setSession(prev => prev ? {
        ...prev,
        generation_status: 'failed',
        generation_error: error.message,
        retry_count: (prev.retry_count || 0) + 1
      } : null);

      setLoading(false);
      alert(error.message || 'Generation failed. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage;
    setInputMessage('');

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMessage]);

    try {
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: userMessage
        });
      
      console.log('✅ User message saved to database');
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    await handleGeneration(userMessage);
  };

  const handleSaveProject = async () => {
    if (!currentHtml || !user || !project || saving || loading) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlCode: currentHtml })
      });

      const { success, error, project: updatedProject } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to save');
      }

      if (updatedProject) {
        setProject(updatedProject);
      }
      
      setSaving(false);
      setJustSaved(true);
      
      if (justSavedTimeoutRef.current) {
        clearTimeout(justSavedTimeoutRef.current);
      }
      
      justSavedTimeoutRef.current = setTimeout(() => {
        setJustSaved(false);
        justSavedTimeoutRef.current = null;
      }, 2000);
      
      console.log('✅ Project saved');
    } catch (error: any) {
      console.error('Save failed:', error);
      alert(error.message || 'Failed to save project');
      setSaving(false);
    }
  };

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
      
      // Show success notification instead of navigating away
      setShowSuccessNotification(true);
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 5000);
      
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

  if (!user || !session) {
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
            <Image 
  src="/logo.png" 
  alt="Garliq" 
  width={36} 
  height={36}
/>
            <h1 className="text-xl font-black">{session.title}</h1>
          </button>

          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full border text-sm font-bold ${
              session.generation_status === 'pending' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
              session.generation_status === 'generating' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 animate-pulse' :
              session.generation_status === 'completed' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
              'bg-red-500/20 border-red-500/30 text-red-400'
            }`}>
              {session.generation_status === 'pending' && '⏳ Pending'}
              {session.generation_status === 'generating' && '🔄 Generating...'}
              {session.generation_status === 'completed' && '✅ Ready'}
              {session.generation_status === 'failed' && '❌ Failed'}
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800">
              {session.selected_model === 'claude-sonnet-4.5' ? (
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

            {session.selected_model === 'claude-sonnet-4.5' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800">
                <Zap size={16} className="text-yellow-400" />
                <span className="text-sm font-bold">{tokenBalance.toLocaleString()}</span>
              </div>
            )}

            <motion.button
              onClick={handleSaveProject}
              disabled={!currentHtml || saving || loading || session.generation_status === 'generating' || justSaved}
              whileHover={!saving && !loading && !justSaved ? { scale: 1.05 } : {}}
              whileTap={!saving && !loading && !justSaved ? { scale: 0.95 } : {}}
              className={`px-5 py-2 rounded-full font-semibold flex items-center gap-2 transition-all ${
                justSaved 
                  ? 'bg-green-600 cursor-default' 
                  : 'bg-yellow-600 hover:bg-yellow-700'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <Save size={18} />
              {saving ? 'Saving...' : justSaved ? 'Saved ✓' : 'Save Project'}
            </motion.button>

            {project?.post_id ? (
              <motion.button
                onClick={handleUpdatePost}
                disabled={loading || !currentHtml || session.generation_status === 'generating'}
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
                disabled={!project || !currentHtml || session.generation_status !== 'completed' || loading}
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

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccessNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-2xl shadow-2xl border border-green-500/50 flex items-center gap-3 min-w-[400px]">
              <CheckCircle size={24} className="text-white flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white font-bold text-lg mb-1">Post Created Successfully! 🎉</p>
                <p className="text-green-100 text-sm">
                  Your post is now available in the "My Posts" section of your profile and can be shared with others.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

            {session.generation_status === 'failed' && session.generation_error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
              >
                <p className="text-red-400 text-sm font-bold mb-2">❌ Generation Failed</p>
                <p className="text-gray-400 text-xs">{session.generation_error}</p>
                <p className="text-gray-500 text-xs mt-2">Retry count: {session.retry_count}</p>
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

            {(loading || session.generation_status === 'generating') && (
              <div className="flex justify-start">
                <div className="bg-gray-800 px-4 py-3 rounded-2xl flex items-center gap-2">
                  <Loader2 className="animate-spin text-purple-400" size={20} />
                  <span className="text-sm text-gray-400">Generating your creation...</span>
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
                disabled={loading || session.generation_status === 'generating'}
                maxLength={10000}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading || session.generation_status === 'generating'}
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
            </div>
            <button 
              onClick={() => setFullscreen(true)}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              disabled={!currentHtml}
            >
              <Maximize2 size={18} className="text-gray-400" />
            </button>
          </div>

          <div className="flex-1 bg-white min-h-0">
            {currentHtml ? (
              <iframe
                key={currentHtml}
                srcDoc={currentHtml}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin"
                title="preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  {(session.generation_status === 'pending' || session.generation_status === 'generating' || loading) && (
                    <>
                      <Loader2 className="animate-spin mx-auto mb-4" size={48} />
                      <p className="text-lg font-semibold mb-2">Crafting your visualization...</p>
                      <p className="text-sm text-gray-500">This usually takes 3 - 7 minutes for longer generations.</p>
                    </>
                  )}
                  {session.generation_status === 'failed' && (
                    <>
                      <X className="mx-auto mb-4 text-red-400" size={48} />
                      <p>Generation failed. Please try again.</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal - Improved Design */}
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                    <Share2 size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Share to Feed</h3>
                    <p className="text-sm text-gray-400">Let others see your creation</p>
                  </div>
                </div>
                <button 
                  onClick={() => !publishing && setShowPublishModal(false)} 
                  disabled={publishing}
                  className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X size={24} className="text-gray-400 hover:text-white" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Caption
                  </label>
                  <textarea
                    value={publishCaption}
                    onChange={(e) => setPublishCaption(e.target.value)}
                    placeholder="Write a caption for your post... (e.g., 'Check out my interactive game!' or 'Built a cool calculator app')"
                    className="w-full px-5 py-4 bg-black/50 rounded-2xl border border-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none text-gray-100 placeholder-gray-500"
                    disabled={publishing}
                    maxLength={200}
                    rows={4}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      Make it descriptive so others know what your creation does!
                    </p>
                    <p className="text-xs text-gray-500">
                      {publishCaption.length}/200
                    </p>
                  </div>
                </div>

                <div className="bg-black/30 rounded-2xl p-5 border border-gray-700">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={promptVisible}
                      onChange={(e) => setPromptVisible(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
                      disabled={publishing}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                        Share prompt publicly
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Allow others to see the prompt you used to create this project
                      </p>
                    </div>
                  </label>
                </div>

                <motion.button
                  onClick={handleShare}
                  disabled={!publishCaption.trim() || publishing}
                  whileHover={!publishing ? { scale: 1.02 } : {}}
                  whileTap={!publishing ? { scale: 0.98 } : {}}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-4 rounded-2xl font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25 transition-all"
                >
                  {publishing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        🧄
                      </motion.div>
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={20} />
                      <span>Publish to Feed</span>
                    </>
                  )}
                </motion.button>
              </div>
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