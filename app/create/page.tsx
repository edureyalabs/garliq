'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Zap, X, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SubscriptionGuard from '@/components/SubscriptionGuard';

type CourseDepth = 'basic' | 'intermediate' | 'advanced';

interface CourseSettings {
  chapterCount: number;
  depth: CourseDepth;
}

export default function CreatePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [creating, setCreating] = useState(false);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);
  
  // Course settings
  const [courseSettings, setCourseSettings] = useState<CourseSettings>({
    chapterCount: 5,
    depth: 'basic'
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
    } else {
      setUser(session.user);
      fetchTokenBalance(session.user.id);
    }
  };

  const fetchTokenBalance = async (userId: string) => {
    const { data } = await supabase
      .from('user_wallets')
      .select('token_balance')
      .eq('user_id', userId)
      .single();

    setTokenBalance(data?.token_balance || 0);
  };

  const handleCreateSession = async () => {
    if (!prompt.trim() || !user || creating) return;

    const MINIMUM_TOKENS = 4000;

    // Check minimum token balance
    if (tokenBalance < MINIMUM_TOKENS) {
      setShowInsufficientTokens(true);
      return;
    }

    setCreating(true);

    try {
      // Create session with course settings
      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          initialPrompt: prompt,
          userId: user.id,
          courseSettings: {
            chapterCount: courseSettings.chapterCount,
            depth: courseSettings.depth
          }
        })
      });

      const sessionData = await sessionResponse.json();
      if (!sessionData.session || sessionData.error) {
        throw new Error(sessionData.error || 'Failed to create session');
      }

      const sessionId = sessionData.session.id;

      // Create project
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: sessionId,
          userId: user.id
        })
      });

      const projectData = await projectResponse.json();
      if (!projectData.success) {
        throw new Error('Failed to create project');
      }

      console.log('✅ Session + Project created');
      router.push(`/studio/${sessionId}`);
      
    } catch (error: any) {
      setCreating(false);
      console.error('Creation failed:', error);
      alert(error.message || 'Failed to create project. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-6xl animate-bounce">🧄</div>
      </div>
    );
  }

  return (
    <SubscriptionGuard requireActive={true}>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button 
              onClick={() => router.push('/feed')} 
              className="flex items-center gap-3 hover:opacity-70 transition-opacity"
            >
              <ArrowLeft size={20} />
              <div className="flex items-center gap-3">
                <Image 
                  src="/logo.png" 
                  alt="Garliq" 
                  width={32} 
                  height={32}
                />
                <h1 className="text-base font-bold">Create Console</h1>
              </div>
            </button>

            <div className="flex items-center gap-3">
              {/* Token Balance */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-sm font-semibold">{tokenBalance.toLocaleString()}</span>
                <span className="text-xs text-gray-500">tokens</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center mb-6"
            >
              <Image 
                src="/logo.png" 
                alt="Garliq" 
                width={56} 
                height={56}
              />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400"
            >
              What would you like to learn today?
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-gray-400 max-w-xl mx-auto"
            >
              Create a comprehensive AI-generated course on any topic. Describe what you want to learn and we'll build it for you.
            </motion.p>
          </div>

          {/* Main Course Creation Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8"
          >
            {/* Prompt Input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                Course Description
              </label>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Create a comprehensive course on machine learning fundamentals, covering neural networks, data preprocessing, model training, and real-world applications..."
                className="w-full h-40 bg-black text-white px-4 py-3 rounded-xl border border-gray-800 focus:border-purple-500 focus:outline-none resize-none text-sm placeholder:text-gray-600 transition-all"
                disabled={creating}
                maxLength={10000}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleCreateSession();
                  }
                }}
              />
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-600">
                  {prompt.length}/10,000 characters
                </span>
                <span className="text-xs text-gray-600">
                  Press ⌘ + Enter to generate
                </span>
              </div>
            </div>

            {/* Course Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Number of Chapters */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                  Number of Chapters
                </label>
                
                <div className="bg-black border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Chapters</span>
                    <span className="text-xl font-bold text-purple-400">
                      {courseSettings.chapterCount}
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={courseSettings.chapterCount}
                    onChange={(e) => setCourseSettings(prev => ({
                      ...prev,
                      chapterCount: parseInt(e.target.value)
                    }))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${((courseSettings.chapterCount - 1) / 14) * 100}%, rgb(31, 41, 55) ${((courseSettings.chapterCount - 1) / 14) * 100}%, rgb(31, 41, 55) 100%)`
                    }}
                    disabled={creating}
                  />
                  
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-600">1</span>
                    <span className="text-xs text-gray-600">15</span>
                  </div>
                </div>
              </div>

              {/* Course Depth */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                  Course Depth
                </label>
                
                <div className="bg-black border border-gray-800 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(['basic', 'intermediate', 'advanced'] as CourseDepth[]).map((depth) => (
                      <button
                        key={depth}
                        onClick={() => setCourseSettings(prev => ({ ...prev, depth }))}
                        disabled={creating}
                        className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
                          courseSettings.depth === depth
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {depth.charAt(0).toUpperCase() + depth.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            

            {/* Generate Button */}
            <motion.button
              onClick={handleCreateSession}
              disabled={!prompt.trim() || creating}
              whileHover={!creating ? { scale: 1.01 } : {}}
              whileTap={!creating ? { scale: 0.99 } : {}}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm"
            >
              {creating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating your course...
                </>
              ) : (
                <>
                  Generate Course
                </>
              )}
            </motion.button>

            {/* Requirements Notice */}
            <p className="text-xs text-center text-gray-500 mt-4">
              Minimum 4,000 tokens required to generate a course
            </p>
          </motion.div>
        </div>

        {/* Insufficient Tokens Modal */}
        <AnimatePresence>
          {showInsufficientTokens && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
              onClick={() => setShowInsufficientTokens(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <Zap size={20} className="text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Insufficient Tokens</h3>
                      <p className="text-xs text-gray-400">You need at least 4,000 tokens</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowInsufficientTokens(false)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-black rounded-xl p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Current Balance</span>
                      <span className="text-xl font-bold text-red-400">{tokenBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Minimum Required</span>
                      <span className="text-xl font-bold text-green-400">4,000</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 text-center">
                    You need more tokens to generate a course. Purchase tokens from your profile page.
                  </p>

                  <Link href={`/profiles/${user.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"
                    >
                      <ExternalLink size={16} />
                      Go to Profile & Buy Tokens
                    </motion.button>
                  </Link>

                  <button
                    onClick={() => setShowInsufficientTokens(false)}
                    className="w-full py-2.5 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SubscriptionGuard>
  );
}