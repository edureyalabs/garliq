'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2, GitCommit, Share2, Maximize2, X, Check, Eye, Save } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Commit {
  id: string;
  commit_number: number;
  commit_message: string;
  html_code: string;
  created_at: string;
  is_published: boolean;
}

export default function StudioPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
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
  const [saving, setSaving] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    checkUser();
    loadSession();
    checkIfProjectSaved();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const checkIfProjectSaved = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !sessionId) return;

    try {
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (project) {
        setProjectSaved(true);
      }
    } catch (error) {
      console.error('Error checking project:', error);
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
        setMessages(data.messages || []);
        setCommits(data.commits || []);

        if (data.commits && data.commits.length > 0) {
          const latestCommit = data.commits[data.commits.length - 1];
          setCurrentHtml(latestCommit.html_code);
        }
        
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading || !user) return;

    setProjectSaved(false); // Reset saved state when making changes

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
          userId: user.id
        })
      });

      const { html, success, error } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to generate');
      }

      if (html) {
        setCurrentHtml(html);
        
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Generated updated code',
          created_at: new Date().toISOString()
        }]);

        await loadSession();
      }
    } catch (error: any) {
      console.error('Generation failed:', error);
      alert(error.message || 'Failed to generate. Please try again.');
    }

    setLoading(false);
  };

  const handleCommit = async () => {
    if (!currentHtml || !user) return;

    const commitMessage = prompt('Enter commit message:') || `Update #${commits.length + 1}`;

    try {
      const response = await fetch('/api/commits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          htmlCode: currentHtml,
          commitMessage
        })
      });

      const { success, error } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to save commit');
      }

      await loadSession();
      alert('Commit saved successfully!');
    } catch (error: any) {
      console.error('Commit failed:', error);
      alert(error.message || 'Failed to save commit');
    }
  };

const handleSaveProject = async () => {
    if (!user || !sessionId || saving) return;

    setSaving(true);

    try {
      // Get the latest commit ID
      const latestCommit = commits.length > 0 ? commits[commits.length - 1] : null;

      if (!latestCommit) {
        alert('Please generate code first before saving');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: user.id,
          lastCommitId: latestCommit.id
        })
      });

      const { success, error } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to save project');
      }

      // Set both states
      setSaving(false);
      setProjectSaved(true);

      // ✅ FIX: Don't auto-hide, keep it saved permanently
      // User can see "Saved" status until they make new changes

    } catch (error: any) {
      console.error('Save project error:', error);
      setSaving(false);
      alert(error.message || 'Failed to save project');
    }
  };

  const handlePublish = async () => {
    if (!publishCaption.trim() || publishing || !user) return;

    setPublishing(true);

    try {
      const latestCommit = commits[commits.length - 1];

      if (!latestCommit) {
        throw new Error('No commits to publish');
      }

      const response = await fetch(`/api/commits/${latestCommit.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: publishCaption,
          promptVisible,
          userId: user.id
        })
      });

      const { success, error, post } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to publish');
      }

      // Update project to mark as published
      if (post && post.id) {
        await supabase
          .from('projects')
          .update({ 
            is_draft: false, 
            is_shared: true,
            post_id: post.id 
          })
          .eq('session_id', sessionId);
      }

      setShowPublishModal(false);
      setPublishCaption('');
      router.push('/feed');
    } catch (error: any) {
      console.error('Publish failed:', error);
      alert(error.message || 'Failed to publish');
    }

    setPublishing(false);
  };

  const handleCheckoutCommit = async (commitId: string, commitHtml: string) => {
    try {
      const response = await fetch(`/api/commits/${commitId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const { success } = await response.json();

      if (success) {
        setCurrentHtml(commitHtml);
        await loadSession();
      }
    } catch (error) {
      console.error('Checkout failed:', error);
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-6xl animate-bounce">🧄</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Bar */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800">
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
            <motion.button
              onClick={handleSaveProject}
              disabled={!currentHtml || loading || saving || projectSaved}
              whileHover={!saving && !projectSaved ? { scale: 1.05 } : {}}
              whileTap={!saving && !projectSaved ? { scale: 0.95 } : {}}
              className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-full font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {projectSaved ? (
                <>
                  <Check size={18} className="text-green-400" />
                  <span className="text-green-400">Saved</span>
                </>
              ) : saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Project
                </>
              )}
            </motion.button>

            <motion.button
              onClick={handleCommit}
              disabled={!currentHtml || loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-full font-semibold flex items-center gap-2 disabled:opacity-30"
            >
              <GitCommit size={18} />
              Commit
            </motion.button>

            <motion.button
              onClick={() => setShowPublishModal(true)}
              disabled={commits.length === 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 rounded-full font-bold flex items-center gap-2 disabled:opacity-30"
            >
              <Share2 size={18} />
              Share
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - 40% */}
        <div className="w-2/5 border-r border-gray-800 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
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

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 px-4 py-3 rounded-2xl">
                  <Loader2 className="animate-spin text-purple-400" size={20} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-gray-800">
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
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel - 60% */}
        <div className="flex-1 flex flex-col bg-gray-900">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-purple-400" />
              <span className="text-sm font-mono text-gray-400">live-preview</span>
            </div>
            <button 
              onClick={() => setFullscreen(true)}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
            >
              <Maximize2 size={18} className="text-gray-400" />
            </button>
          </div>

          <div className="flex-1 bg-white">
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
                  <p>Waiting for generation...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Commit History Bar */}
      {commits.length > 0 && (
        <div className="border-t border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            <span className="text-sm font-semibold text-gray-400 flex-shrink-0">History:</span>
            {commits.map((commit) => (
              <button
                key={commit.id}
                onClick={() => handleCheckoutCommit(commit.id, commit.html_code)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 group"
              >
                <GitCommit size={14} className="text-purple-400" />
                <span className="text-sm font-mono">#{commit.commit_number}</span>
                {commit.is_published && (
                  <Check size={14} className="text-green-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
            onClick={() => setShowPublishModal(false)}
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
                <button onClick={() => setShowPublishModal(false)}>
                  <X size={24} className="text-gray-400 hover:text-white" />
                </button>
              </div>

              <input
                type="text"
                value={publishCaption}
                onChange={(e) => setPublishCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none mb-4"
              />

              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promptVisible}
                  onChange={(e) => setPromptVisible(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-sm text-gray-400">Share prompt publicly</span>
              </label>

              <motion.button
                onClick={handlePublish}
                disabled={!publishCaption.trim() || publishing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {publishing ? 'Publishing...' : 'Publish'}
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