'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Zap, X, ExternalLink, Sparkles, BookOpen, Target, Layers } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SubscriptionGuard from '@/components/SubscriptionGuard';

type CourseDepth = 'basic' | 'intermediate' | 'advanced';

interface CourseSettings {
  chapterCount: number;
  depth: CourseDepth;
}

const EXAMPLE_PROMPTS = [
  "Master Python programming from basics to advanced concepts including OOP, async programming, and web frameworks",
  "Complete guide to digital marketing: SEO, content strategy, social media, and analytics",
  "Learn web development: HTML, CSS, JavaScript, React, and building full-stack applications"
];

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
        {/* Compact Header */}
        <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 hover:opacity-70 transition-opacity group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <Image 
                src="/logo.png" 
                alt="Garliq" 
                width={24} 
                height={24}
                className="rounded-lg"
              />
              <span className="text-sm font-semibold">Create Course</span>
            </button>

            {/* Token Balance */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">{tokenBalance.toLocaleString()}</span>
              <span className="text-xs text-gray-400">tokens</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Content Area - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Hero Section - Compact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-400" />
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
                    AI Course Generator
                  </h1>
                </div>
                <p className="text-sm text-gray-400">
                  Describe your learning goals and let AI create a comprehensive course tailored for you
                </p>
              </motion.div>

              {/* Prompt Input - Main Focus */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
                <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                    <BookOpen size={14} />
                    Course Description
                  </label>
                  
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to learn in detail. The more specific you are, the better your course will be..."
                    className="w-full h-48 bg-black/50 text-white px-4 py-4 rounded-xl border border-gray-800/50 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none text-sm placeholder:text-gray-600 transition-all"
                    disabled={creating}
                    maxLength={10000}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleCreateSession();
                      }
                    }}
                  />
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {prompt.length.toLocaleString()}/10,000
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700 text-xs">⌘</kbd>
                      <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700 text-xs">Enter</kbd>
                      <span className="ml-1">to generate</span>
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Example Prompts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={12} className="text-purple-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Examples</span>
                </div>
                <div className="grid gap-2">
                  {EXAMPLE_PROMPTS.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      disabled={creating}
                      className="text-left p-3 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-800/50 hover:border-purple-500/30 rounded-lg text-xs text-gray-400 hover:text-gray-300 transition-all group"
                    >
                      <span className="group-hover:text-purple-400 transition-colors">"{example}"</span>
                    </button>
                  ))}
                </div>
              </motion.div>

            </div>

            {/* Settings Sidebar - Right Side */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Course Configuration */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-5 space-y-5 sticky top-20"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-gray-800/50">
                  <Target size={16} className="text-purple-400" />
                  <h3 className="text-sm font-bold">Course Settings</h3>
                </div>

                {/* Number of Chapters */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Layers size={12} />
                      Chapters
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        {courseSettings.chapterCount}
                      </span>
                    </div>
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
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${((courseSettings.chapterCount - 1) / 14) * 100}%, rgb(31, 41, 55) ${((courseSettings.chapterCount - 1) / 14) * 100}%, rgb(31, 41, 55) 100%)`
                    }}
                    disabled={creating}
                  />
                  
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Focused</span>
                    <span>Comprehensive</span>
                  </div>
                </div>

                {/* Course Depth */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Depth Level
                  </label>
                  
                  <div className="grid gap-2">
                    {([
                      { value: 'basic', label: 'Basic', icon: '📚', desc: 'Beginner friendly' },
                      { value: 'intermediate', label: 'Intermediate', icon: '🎯', desc: 'Some experience' },
                      { value: 'advanced', label: 'Advanced', icon: '🚀', desc: 'Expert level' }
                    ] as const).map((depth) => (
                      <button
                        key={depth.value}
                        onClick={() => setCourseSettings(prev => ({ ...prev, depth: depth.value }))}
                        disabled={creating}
                        className={`relative p-3 rounded-xl text-left transition-all border ${
                          courseSettings.depth === depth.value
                            ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50 shadow-lg shadow-purple-500/10'
                            : 'bg-gray-800/30 border-gray-800/50 hover:border-gray-700 hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{depth.icon}</span>
                            <div>
                              <div className={`text-sm font-semibold ${
                                courseSettings.depth === depth.value ? 'text-white' : 'text-gray-300'
                              }`}>
                                {depth.label}
                              </div>
                              <div className="text-xs text-gray-500">{depth.desc}</div>
                            </div>
                          </div>
                          {courseSettings.depth === depth.value && (
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Token Cost Estimate */}
                <div className="pt-3 border-t border-gray-800/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Minimum Tokens</span>
                    <div className="flex items-center gap-1">
                      <Zap size={12} className="text-yellow-400" />
                      <span className="font-semibold text-yellow-400">~4,000</span>
                      <span className="text-gray-500">tokens</span>
                    </div>
                  </div>
                </div>

              </motion.div>

              {/* Generate Button */}
              <motion.button
                onClick={handleCreateSession}
                disabled={!prompt.trim() || creating}
                whileHover={!creating ? { scale: 1.02 } : {}}
                whileTap={!creating ? { scale: 0.98 } : {}}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-70 group-hover:opacity-100 blur transition-opacity"></div>
                <div className="relative w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm">
                  {creating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating Course...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate Course
                    </>
                  )}
                </div>
              </motion.button>

            </div>

          </div>
        </div>

        {/* Insufficient Tokens Modal */}
        <AnimatePresence>
          {showInsufficientTokens && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setShowInsufficientTokens(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 w-full max-w-md"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl opacity-20 blur"></div>
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-red-500/20">
                        <Zap size={24} className="text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Insufficient Tokens</h3>
                        <p className="text-sm text-gray-400">You need more tokens to create a course</p>
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
                    <div className="bg-black/50 rounded-xl p-5 border border-gray-800/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Your Balance</span>
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-red-400" />
                          <span className="text-2xl font-bold text-red-400">{tokenBalance.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Required</span>
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-green-400" />
                          <span className="text-2xl font-bold text-green-400">4,000</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-center text-gray-400 px-4">
                      Purchase more tokens to continue creating amazing courses
                    </p>

                    <Link href={`/profiles/${user.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full relative group"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-70 group-hover:opacity-100 blur transition-opacity"></div>
                        <div className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm">
                          <Zap size={16} />
                          Buy Tokens on Profile Page
                        </div>
                      </motion.button>
                    </Link>

                    <button
                      onClick={() => setShowInsufficientTokens(false)}
                      className="w-full py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SubscriptionGuard>
  );
}