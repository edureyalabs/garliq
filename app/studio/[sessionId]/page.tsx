'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
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
  const [error, setError] = useState<string | null>(null); // ← ADDED
  const justSavedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const generationTriggeredRef = useRef(false);

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

  // ✅ PRODUCTION-GRADE FIX: Realtime only for status, fetch HTML from DB
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
        async (payload) => {
          console.log('📥 Session status update:', {
            status: payload.new.generation_status,
            error: payload.new.generation_error
          });
          
          const newStatus = payload.new.generation_status;
          
          // Update session state (WITHOUT html_code in payload)
          setSession(prev => ({
            ...prev,
            ...payload.new
          } as Session));
          
          if (newStatus === 'completed') {
            console.log('✅ Generation completed! Fetching project from database...');
            setLoading(false);
            setError(null);
            
            // CRITICAL: Fetch HTML from database, not from Realtime payload
            const { data: updatedProject, error: projectError } = await supabase
              .from('projects')
              .select('*')
              .eq('session_id', sessionId)
              .single();
            
            if (updatedProject && !projectError) {
              setProject(updatedProject);
              if (updatedProject.html_code && updatedProject.html_code !== '<html><body><h1>Generating...</h1></body></html>') {
                setCurrentHtml(updatedProject.html_code);
              }
              console.log('✅ Project HTML fetched from database');
            } else {
              console.error('❌ Failed to fetch project:', projectError);
              setError('Failed to load generated code. Please refresh.');
            }
            
            // Reload chat messages
            const { data: newMessages } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('session_id', sessionId)
              .order('created_at', { ascending: true });
            
            if (newMessages) {
              setMessages(newMessages);
            }
            
            // Refresh token balance
            await fetchTokenBalance();
            
            console.log('✅ All data reloaded successfully');
            
          } else if (newStatus === 'failed') {
            console.error('❌ Generation failed:', payload.new.generation_error);
            setLoading(false);
            setError(payload.new.generation_error || 'Generation failed');
            
          } else if (newStatus === 'generating') {
            console.log('⚙️ Generation in progress...');
            setLoading(true);
            setError(null);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        
        if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Realtime channel error - polling database instead');
          
          // Fallback: poll database every 3 seconds
          const pollInterval = setInterval(async () => {
            const { data: currentSession } = await supabase
              .from('sessions')
              .select('generation_status')
              .eq('id', sessionId)
              .single();
            
            if (currentSession?.generation_status === 'completed') {
              clearInterval(pollInterval);
              await loadSession();
              await loadProject();
            } else if (currentSession?.generation_status === 'failed') {
              clearInterval(pollInterval);
              await loadSession();
            }
          }, 3000);
          
          // Clean up after 3 minutes
          setTimeout(() => clearInterval(pollInterval), 180000);
        }
      });

    return () => {
      console.log('🔇 Unsubscribing from session updates');
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

  const loadSession = async () => {
    try {
      console.log('📖 Loading session:', sessionId);
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();

      if (data.session) {
        console.log('✅ Session loaded:', data.session);
        setSession(data.session);
        setMessages(data.messages || []);
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

    if (session.selected_model === 'claude-sonnet-4.5' && tokenBalance < 4000) {
      setShowInsufficientTokens(true);
      setTimeout(() => setShowInsufficientTokens(false), 5000);
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors

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

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let generationComplete = false;

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
                generationComplete = true;
                setCurrentHtml(data.html);
                
                setMessages(prev => {
                  const filtered = prev.filter(m => m.id !== 'status-msg');
                  return [...filtered, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'Generated code successfully',
                    created_at: new Date().toISOString()
                  }];
                });

                setSession(prev => prev ? {
                  ...prev,
                  generation_status: 'completed',
                  generation_error: null
                } : null);

                console.log('✅ Generation completed locally');
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('JSON parse error:', e);
            }
          }
        }
      }

      if (generationComplete) {
        await loadProject();
      }
      
      await fetchTokenBalance();

    } catch (error: any) {
      console.error('Generation failed:', error);
      
      setSession(prev => prev ? {
        ...prev,
        generation_status: 'failed',
        generation_error: error.message,
        retry_count: (prev.retry_count || 0) + 1
      } : null);

      setError(error.message || 'Generation failed. Please try again.');
    }

    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage;
    setInputMessage('');

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }]);

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
        body: JSON.stringify({ htmlCode: currentHtml })
      });

      if (!response.ok) throw new Error('Update failed');

      alert('✅ Post updated successfully!');
    } catch (error) {
      console.error('Update post failed:', error);
      alert('Failed to update post');
    }
  };

  const handlePublish = async () => {
    if (!currentHtml || !user || !project) return;

    setPublishing(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          userId: user.id,
          caption: publishCaption,
          promptVisible: promptVisible,
          htmlCode: currentHtml
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to publish');
      }

      setProject(prev => prev ? { ...prev, post_id: data.post.id } : null);
      setShowPublishModal(false);
      setPublishCaption('');
      alert('✅ Published to feed successfully!');
    } catch (error: any) {
      console.error('Publish error:', error);
      alert(error.message || 'Failed to publish');
    }

    setPublishing(false);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Session not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/feed')} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold">{session.title || 'Untitled Project'}</h1>
              <div className="flex items-center gap-2 text-sm">
                {session.selected_model === 'claude-sonnet-4.5' ? (
                  <><Crown size={14} className="text-pink-400" /><span className="text-pink-400">Claude Sonnet 4.5</span></>
                ) : (
                  <><Zap size={14} className="text-purple-400" /><span className="text-purple-400">Llama 3.3 70B</span></>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-sm font-bold">{tokenBalance.toLocaleString()} tokens</span>
            </div>

            <button onClick={handleSaveProject} disabled={saving || loading} className="p-2 bg-gray-900 hover:bg-gray-800 rounded-full border border-gray-800 transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={20} className="animate-spin" /> : justSaved ? <span className="text-green-400 text-sm px-2">Saved!</span> : <Save size={20} />}
            </button>

            {project?.post_id ? (
              <button onClick={handleUpdatePost} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-full font-bold flex items-center gap-2 transition-colors">
                <RefreshCw size={16} />
                Update Post
              </button>
            ) : (
              <button onClick={() => setShowPublishModal(true)} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
                <Share2 size={16} />
                Publish
              </button>
            )}

            <button onClick={() => setFullscreen(!fullscreen)} className="p-2 bg-gray-900 hover:bg-gray-800 rounded-full border border-gray-800 transition-colors">
              {fullscreen ? <X size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex ${fullscreen ? 'flex-col' : 'flex-col lg:flex-row'}`}>
        {/* Chat Panel */}
        {!fullscreen && (
          <div className="w-full lg:w-96 border-r border-gray-800 flex flex-col bg-black/50">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {showInsufficientTokens && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm">
                    ⚠️ Insufficient tokens! You need at least 4,000 tokens to use Claude Sonnet 4.5.
                    <br />
                    <span className="text-gray-400">Current balance: {tokenBalance} tokens</span>
                  </p>
                </motion.div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm font-bold mb-2">❌ Error</p>
                  <p className="text-gray-400 text-xs">{error}</p>
                </motion.div>
              )}

              {session.generation_status === 'failed' && session.generation_error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm font-bold mb-2">❌ Generation Failed</p>
                  <p className="text-gray-400 text-xs">{session.generation_error}</p>
                  <p className="text-gray-500 text-xs mt-2">Retry count: {session.retry_count}</p>
                </motion.div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600' : 'bg-gray-800'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Describe changes..." className="flex-1 px-4 py-3 bg-gray-900 rounded-xl border border-gray-800 focus:border-purple-500 focus:outline-none" disabled={loading} />
                <button onClick={handleSendMessage} disabled={loading || !inputMessage.trim()} className="p-3 bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Panel */}
        <div className="flex-1 bg-white">
          {currentHtml ? (
            <iframe srcDoc={currentHtml} className="w-full h-full border-0" title="Preview" sandbox="allow-scripts allow-same-origin" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center">
                {loading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Generating your micro-app...</p>
                  </>
                ) : (
                  <p className="text-gray-500">No preview available</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={() => setShowPublishModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Publish to Feed</h3>
                <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <textarea value={publishCaption} onChange={(e) => setPublishCaption(e.target.value)} placeholder="Add a caption (optional)..." className="w-full px-4 py-3 bg-gray-800 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none mb-4 resize-none" rows={3} />

              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-gray-400">Show prompt publicly</span>
                <button onClick={() => setPromptVisible(!promptVisible)} className={`relative w-12 h-6 rounded-full transition-colors ${promptVisible ? 'bg-purple-600' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${promptVisible ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              <button onClick={handlePublish} disabled={publishing} className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                {publishing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Share2 size={20} />
                    Publish Now
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}