'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Send, Loader2, Share2, X, Eye, Zap, Save, 
  RefreshCw, CheckCircle, AlertCircle, RotateCcw, Sparkles, 
  BookOpen, FileText, ChevronRight, ChevronLeft 
} from 'lucide-react';
import Image from 'next/image';
import SubscriptionGuard from '@/components/SubscriptionGuard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface CoursePage {
  id: string;
  page_number: number;
  page_type: 'intro' | 'toc' | 'chapter' | 'conclusion';
  page_title: string;
  html_content: string;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  post_id: string | null;
  html_code: string;
  is_shared: boolean;
  is_multi_page: boolean;
  total_pages: number;
  expected_pages: number;
  completed_pages: number;
  failed_pages: number;
  updated_at: string;
}

interface Session {
  id: string;
  title: string;
  initial_prompt: string;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed' | 'partial';
  generation_error: string | null;
  retry_count: number;
  selected_model: string;
  chapter_count: number;
  course_depth: 'basic' | 'intermediate' | 'advanced';
}

interface GenerationProgress {
  expected: number;
  completed: number;
  failed: number;
  pending: number;
  generating: number;
  percentage: number;
}

export default function StudioPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pages, setPages] = useState<CoursePage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishCaption, setPublishCaption] = useState('');
  const [promptVisible, setPromptVisible] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [regeneratingPage, setRegeneratingPage] = useState<number | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    expected: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    generating: 0,
    percentage: 0
  });
  const [project, setProject] = useState<Project | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const generationTriggeredRef = useRef(false);
  const previousStatusRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const justSavedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkUser();
  }, [sessionId]);

  useEffect(() => {
    if (user) {
      loadSession();
      loadProject();
      loadPages();
      fetchTokenBalance();
      
      // Subscribe to realtime updates
      const unsubscribeSession = subscribeToSessionStatus();
      const unsubscribePages = subscribeToPageUpdates();
      const unsubscribeProject = subscribeToProjectProgress();
      
      return () => {
        unsubscribeSession();
        unsubscribePages();
        unsubscribeProject();
      };
    }
  }, [user, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🔥 NEW: Poll progress bar during generation
  useEffect(() => {
    if (session?.generation_status === 'generating' || session?.generation_status === 'pending') {
      const interval = setInterval(async () => {
        const { data } = await supabase
          .from('projects')
          .select('expected_pages, completed_pages, failed_pages')
          .eq('session_id', sessionId)
          .single();
        
        if (data) {
          setGenerationProgress({
            expected: data.expected_pages || 0,
            completed: data.completed_pages || 0,
            failed: data.failed_pages || 0,
            pending: (data.expected_pages || 0) - (data.completed_pages || 0) - (data.failed_pages || 0),
            generating: 0,
            percentage: data.expected_pages > 0 
              ? Math.round((data.completed_pages / data.expected_pages) * 100)
              : 0
          });
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [session?.generation_status, sessionId]);

  useEffect(() => {
    if (session && session.generation_status === 'pending' && !generationTriggeredRef.current && !loading && user) {
      generationTriggeredRef.current = true;
      handleGeneration(session.initial_prompt);
    }
  }, [session, user, loading]);

  useEffect(() => {
    if (session && previousStatusRef.current === 'generating' && 
        (session.generation_status === 'completed' || session.generation_status === 'partial')) {
      setLoading(false);
      loadProject();
      loadPages();
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

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120;
      textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
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
          const updatedSession = payload.new as Session;
          setSession(updatedSession);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToPageUpdates = () => {
    const channel = supabase
      .channel(`pages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'course_pages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newPage = payload.new as CoursePage;
          setPages(prev => [...prev, newPage].sort((a, b) => a.page_number - b.page_number));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'course_pages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const updatedPage = payload.new as CoursePage;
          setPages(prev => prev.map(p => 
            p.page_number === updatedPage.page_number ? updatedPage : p
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToProjectProgress = () => {
    const channel = supabase
      .channel(`project-progress-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const updatedProject = payload.new as Project;
          
          // 🔥 FIX: Directly update progress state from database trigger
          const newProgress = {
            expected: updatedProject.expected_pages,
            completed: updatedProject.completed_pages,
            failed: updatedProject.failed_pages,
            pending: updatedProject.expected_pages - updatedProject.completed_pages - updatedProject.failed_pages,
            generating: 0, // Will be calculated from pages
            percentage: updatedProject.expected_pages > 0 
              ? Math.round((updatedProject.completed_pages / updatedProject.expected_pages) * 100)
              : 0
          };
          
          setGenerationProgress(newProgress);
          setProject(updatedProject);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadProject = async () => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (data) {
        setProject(data);
        
        // 🔥 FIX: Initialize progress state from project data
        setGenerationProgress({
          expected: data.expected_pages || 0,
          completed: data.completed_pages || 0,
          failed: data.failed_pages || 0,
          pending: (data.expected_pages || 0) - (data.completed_pages || 0) - (data.failed_pages || 0),
          generating: 0,
          percentage: data.expected_pages > 0 
            ? Math.round((data.completed_pages / data.expected_pages) * 100)
            : 0
        });
      }
    } catch (error) {
      console.error('Load project error:', error);
    }
  };

  const loadPages = async () => {
    try {
      const { data } = await supabase
        .from('course_pages')
        .select('*')
        .eq('session_id', sessionId)
        .order('page_number', { ascending: true });

      if (data) {
        setPages(data);
        
        // Calculate generating count from actual page statuses
        const generatingCount = data.filter(p => p.generation_status === 'generating').length;
        setGenerationProgress(prev => ({ ...prev, generating: generatingCount }));
      }
    } catch (error) {
      console.error('Load pages error:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();

      if (data.session) {
        setSession(data.session);
        
        if (data.messages) {
          setMessages(data.messages);
        }
        
        setInitialLoading(false);
      } else {
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

      if (!result.success) {
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

  const handleRetryGeneration = async () => {
    if (!user || !session || loading) return;

    setSession(prev => prev ? {
      ...prev,
      generation_status: 'pending',
      generation_error: null
    } : null);

    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      await handleGeneration(lastUserMessage.content);
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
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    await handleGeneration(userMessage);
  };

  const handleSaveProject = async () => {
    if (!project || saving || loading) return;

    setSaving(true);

    try {
      const currentPage = pages[currentPageIndex];
      if (!currentPage) {
        throw new Error('No page selected');
      }

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlCode: project.html_code })
      });

      const { success, error } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to save');
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
      
    } catch (error: any) {
      console.error('Save failed:', error);
      alert(error.message || 'Failed to save project');
      setSaving(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!project?.post_id || !user) return;

    if (!confirm('Update the published post with current code?')) return;

    try {
      const response = await fetch(`/api/posts/${project.post_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          htmlCode: project.html_code,
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

  const handleRegeneratePage = async (pageNumber: number) => {
    if (!user || regeneratingPage !== null) return;

    setRegeneratingPage(pageNumber);

    try {
      const response = await fetch('/api/regenerate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          pageNumber,
          userId: user.id
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Regeneration failed');
      }
      
    } catch (error: any) {
      alert('❌ ' + error.message);
    } finally {
      setRegeneratingPage(null);
    }
  };

  const getPageIcon = (page: CoursePage) => {
    if (page.page_type === 'intro') return '📖';
    if (page.page_type === 'toc') return '📋';
    if (page.page_type === 'conclusion') return '✅';
    return page.page_number - 1;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'generating': return 'text-blue-400 animate-pulse';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'generating': return '⏳';
      case 'failed': return '✗';
      default: return '○';
    }
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
    <SubscriptionGuard requireActive={true}>
      <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
        {/* Top Bar - Cleaner & More Compact */}
        <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800 flex-shrink-0">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <ArrowLeft size={18} />
              <Image 
                src="/logo.png" 
                alt="Garliq" 
                width={24} 
                height={24}
              />
              <h1 className="text-sm font-bold truncate max-w-[200px]">{session.title}</h1>
            </button>

            <div className="flex items-center gap-2">
              {/* Generation Status Badge */}
              <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${
                session.generation_status === 'pending' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                session.generation_status === 'generating' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 animate-pulse' :
                session.generation_status === 'completed' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                session.generation_status === 'partial' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' :
                'bg-red-500/20 border-red-500/30 text-red-400'
              }`}>
                {session.generation_status === 'pending' && '⏳ Pending'}
                {session.generation_status === 'generating' && '🔄 Generating'}
                {session.generation_status === 'completed' && '✅ Complete'}
                {session.generation_status === 'partial' && '⚠️ Partial'}
                {session.generation_status === 'failed' && '❌ Failed'}
              </div>

              {/* Course Settings Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 rounded-full border border-gray-800">
                <BookOpen size={14} className="text-purple-400" />
                <span className="text-xs font-mono">
                  {session.chapter_count}ch • {session.course_depth}
                </span>
              </div>

              {/* Token Balance (only if Claude) */}
              {session.selected_model === 'claude-sonnet-4.5' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 rounded-full border border-gray-800">
                  <Zap size={14} className="text-yellow-400" />
                  <span className="text-xs font-semibold">{tokenBalance.toLocaleString()}</span>
                </div>
              )}

              {/* Save Button */}
              <motion.button
                onClick={handleSaveProject}
                disabled={!project || saving || loading || session.generation_status === 'generating' || justSaved}
                whileHover={!saving && !loading && !justSaved ? { scale: 1.05 } : {}}
                whileTap={!saving && !loading && !justSaved ? { scale: 0.95 } : {}}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  justSaved 
                    ? 'bg-green-600 cursor-default' 
                    : 'bg-yellow-600 hover:bg-yellow-700'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <Save size={14} />
                {saving ? 'Saving...' : justSaved ? 'Saved ✓' : 'Save'}
              </motion.button>

              {/* Share/Update Button */}
              {project?.post_id ? (
                <motion.button
                  onClick={handleUpdatePost}
                  disabled={loading || session.generation_status === 'generating'}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30"
                >
                  <RefreshCw size={14} />
                  Update
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => setShowPublishModal(true)}
                  disabled={!project || session.generation_status !== 'completed' || loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30"
                >
                  <Share2 size={14} />
                  Share
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
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 rounded-2xl shadow-2xl border border-green-500/50 flex items-center gap-3">
                <CheckCircle size={20} className="text-white flex-shrink-0" />
                <div>
                  <p className="text-white font-bold text-sm">Post Created! 🎉</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar - Pages List (15%) */}
          <div className="w-[15%] border-r border-gray-800 flex flex-col min-h-0 bg-gray-900/50">
            <div className="p-3 border-b border-gray-800">
              <h3 className="font-bold text-xs flex items-center gap-2">
                <FileText size={14} className="text-purple-400" />
                Pages ({pages.length})
              </h3>
            </div>

            {/* Generation Progress - Only show during generation */}
            {(session.generation_status === 'generating' || session.generation_status === 'pending') && generationProgress.percentage < 100 && (
              <div className="p-3 border-b border-gray-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-green-400 font-bold">{generationProgress.percentage}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${generationProgress.percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-green-400">✓ {generationProgress.completed}</span>
                  {generationProgress.generating > 0 && (
                    <span className="text-blue-400">⏳ {generationProgress.generating}</span>
                  )}
                  {generationProgress.pending > 0 && (
                    <span className="text-gray-500">○ {generationProgress.pending}</span>
                  )}
                  {generationProgress.failed > 0 && (
                    <span className="text-red-400">✗ {generationProgress.failed}</span>
                  )}
                </div>
              </div>
            )}

            {/* Pages List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {pages.map((page, idx) => (
                <div key={page.id} className="relative">
                  <button
                    onClick={() => setCurrentPageIndex(idx)}
                    disabled={page.generation_status !== 'completed'}
                    className={`w-full text-left p-2 rounded-lg transition-all text-xs ${
                      currentPageIndex === idx
                        ? 'bg-purple-600 text-white'
                        : page.generation_status === 'completed'
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{getPageIcon(page)}</span>
                      <span className="font-semibold flex-1 truncate text-xs">
                        {page.page_title}
                      </span>
                      <span className={`text-xs ${getStatusColor(page.generation_status)}`}>
                        {getStatusIcon(page.generation_status)}
                      </span>
                    </div>
                    {page.generation_status === 'failed' && page.error_message && (
                      <p className="text-xs text-red-400 truncate mt-1">
                        {page.error_message}
                      </p>
                    )}
                  </button>

                  {/* Regenerate Button */}
                  {(page.generation_status === 'completed' || page.generation_status === 'failed') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegeneratePage(page.page_number);
                      }}
                      disabled={regeneratingPage !== null}
                      className="absolute top-1 right-1 p-1 bg-gray-900 hover:bg-gray-700 rounded transition-colors"
                      title="Regenerate page"
                    >
                      {regeneratingPage === page.page_number ? (
                        <Loader2 size={12} className="animate-spin text-blue-400" />
                      ) : (
                        <RefreshCw size={12} className="text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              ))}

              {pages.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-xs">
                  <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                  <p>Initializing...</p>
                </div>
              )}
            </div>
          </div>

          {/* Center - Preview (70%) */}
          <div className="w-[65%] flex flex-col bg-gray-900 min-h-0">
            <div className="p-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentPageIndex === 0 || pages.length === 0}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-purple-400" />
                  <span className="text-xs font-mono text-gray-400">
                    {pages[currentPageIndex] ? pages[currentPageIndex].page_title : 'No page'}
                  </span>
                </div>
                <button
                  onClick={() => setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1))}
                  disabled={currentPageIndex === pages.length - 1 || pages.length === 0}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <span className="text-xs text-gray-500">
                Page {currentPageIndex + 1} of {pages.length}
              </span>
            </div>

            <div className="flex-1 bg-white min-h-0 overflow-auto">
              {pages[currentPageIndex]?.generation_status === 'completed' ? (
                <iframe
                  key={pages[currentPageIndex].id}
                  srcDoc={pages[currentPageIndex].html_content}
                  className="w-full h-full"
                  sandbox="allow-scripts allow-same-origin"
                  title="preview"
                />
              ) : pages[currentPageIndex]?.generation_status === 'generating' ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4" size={40} />
                    <p className="text-sm font-semibold">Generating page...</p>
                  </div>
                </div>
              ) : pages[currentPageIndex]?.generation_status === 'failed' ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <AlertCircle className="mx-auto mb-4 text-red-400" size={40} />
                    <p className="text-sm font-semibold text-red-400 mb-2">Generation Failed</p>
                    <p className="text-xs text-gray-500 mb-4">{pages[currentPageIndex].error_message}</p>
                    <button
                      onClick={() => handleRegeneratePage(pages[currentPageIndex].page_number)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold"
                    >
                      Retry Page
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    {session.generation_status === 'pending' || session.generation_status === 'generating' ? (
                      <>
                        <Loader2 className="animate-spin mx-auto mb-4" size={40} />
                        <p className="text-sm font-semibold mb-2">Creating your course...</p>
                        <p className="text-xs text-gray-500">This may take 3-5 minutes</p>
                      </>
                    ) : (
                      <p className="text-sm">No page selected</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right - Chat (15%) */}
          <div className="w-[20%] border-l border-gray-800 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {showInsufficientTokens && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl"
                >
                  <p className="text-red-400 text-xs">
                    ⚠️ Insufficient tokens!
                    <br />
                    <span className="text-gray-400">Balance: {tokenBalance}</span>
                  </p>
                </motion.div>
              )}

              {session.generation_status === 'failed' && session.generation_error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-red-400 font-bold text-xs mb-1">Generation Failed</p>
                        <p className="text-gray-300 text-xs leading-relaxed">
                          {session.generation_error}
                        </p>
                      </div>
                    </div>
                    
                    <motion.button
                      onClick={handleRetryGeneration}
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw size={12} />
                      Retry
                    </motion.button>
                    
                    {session.retry_count > 0 && (
                      <p className="text-gray-500 text-xs mt-1 text-center">
                        Attempts: {session.retry_count}
                      </p>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-yellow-900/30 via-orange-900/30 to-yellow-900/30 border border-yellow-700/40 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <Sparkles size={12} className="text-yellow-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-300 leading-relaxed mb-1">
                          <span className="font-semibold text-yellow-300">Beta Mode!</span> Some generations fail.
                        </p>
                        <p className="text-xs text-gray-400">
                          Try retrying or <a href="mailto:team@parasync.in" className="text-purple-400 underline">contact us</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] px-3 py-2 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-200'
                    }`}
                  >
                    <p className="text-xs leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}

              {(loading || session.generation_status === 'generating') && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 px-3 py-2 rounded-xl flex items-center gap-2">
                    <Loader2 className="animate-spin text-purple-400" size={14} />
                    <span className="text-xs text-gray-400">Generating...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-800 flex-shrink-0">
              <div className="flex gap-1.5 items-end">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Request changes..."
                  className="flex-1 px-3 py-2 bg-gray-900 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none resize-none overflow-y-auto text-xs"
                  style={{ minHeight: '36px', maxHeight: '100px' }}
                  disabled={loading || session.generation_status === 'generating'}
                  maxLength={10000}
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || loading || session.generation_status === 'generating'}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
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
                      <h3 className="text-2xl font-bold">Share Course</h3>
                      <p className="text-sm text-gray-400">Share your creation with others</p>
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
                      placeholder="Describe your course..."
                      className="w-full px-5 py-4 bg-black/50 rounded-2xl border border-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none text-gray-100 placeholder-gray-500"
                      disabled={publishing}
                      maxLength={200}
                      rows={4}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        Make it descriptive!
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
                          Allow others to see your prompt
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
                        <Loader2 size={20} className="animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Share2 size={20} />
                        Publish Course
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SubscriptionGuard>
  );
}