'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Zap, X, Sparkles, BookOpen, Target, Layers, CheckCircle2 } from 'lucide-react';
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
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <SubscriptionGuard requireActive={true}>
      <div className="min-h-screen bg-black text-white">
        {/* Subtle Grid Background */}
        <div className="fixed inset-0 bg-black">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>

        {/* Navigation */}
        <nav className="relative z-50 border-b border-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              <Image 
                src="/logo.png" 
                alt="Garliq" 
                width={28} 
                height={28}
              />
              <span className="text-sm font-bold">Create Course</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 backdrop-blur-sm border border-gray-800 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-bold">{tokenBalance.toLocaleString()}</span>
              <span className="text-xs text-gray-500">tokens</span>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="relative px-6 py-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Hero Section - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="inline-block mb-3">
                <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-semibold text-purple-400">
                  AI Course Generator
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
                Create your course in{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  3 minutes
                </span>
              </h1>
              
              <p className="text-sm text-gray-400 max-w-2xl mx-auto">
                Describe what you want to learn and get a fully interactive course with embedded media and an AI tutor
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Main Input */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Course Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold">Course Description</h3>
                  </div>
                  
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to learn in detail. The more specific you are, the better your course will be. For example: 'I want to learn machine learning from scratch, including supervised learning, neural networks, and practical implementations with Python...'"
                    className="w-full h-48 bg-black/40 text-sm text-white px-3 py-3 rounded-lg border border-gray-800 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none placeholder:text-gray-600 transition-all"
                    disabled={creating}
                    maxLength={10000}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleCreateSession();
                      }
                    }}
                  />
                  
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-500">
                      {prompt.length.toLocaleString()} / 10,000 characters
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <kbd className="px-1.5 py-0.5 bg-gray-900 border border-gray-800 rounded text-xs">⌘</kbd>
                      <kbd className="px-1.5 py-0.5 bg-gray-900 border border-gray-800 rounded text-xs">Enter</kbd>
                      <span>to generate</span>
                    </div>
                  </div>
                </motion.div>

                {/* Example Prompts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold">Need inspiration?</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {EXAMPLE_PROMPTS.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(example)}
                        disabled={creating}
                        className="w-full text-left p-3 bg-black/40 hover:bg-black/60 border border-gray-800 hover:border-gray-700 rounded-lg text-xs text-gray-400 hover:text-gray-300 transition-all"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </motion.div>

              </div>

              {/* Right Column - Settings & CTA (Sticky Container) */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-5 space-y-5 sticky top-20"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold">Course Settings</h3>
                  </div>

                  {/* Number of Chapters */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        Chapters
                      </label>
                      <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
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
                      className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      disabled={creating}
                    />
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Focused</span>
                      <span>Comprehensive</span>
                    </div>
                  </div>

                  {/* Course Depth */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400">
                      Depth Level
                    </label>
                    
                    <div className="space-y-2">
                      {([
                        { value: 'basic', label: 'Basic', icon: '📚', desc: 'Beginner friendly' },
                        { value: 'intermediate', label: 'Intermediate', icon: '🎯', desc: 'Some experience' },
                        { value: 'advanced', label: 'Advanced', icon: '🚀', desc: 'Expert level' }
                      ] as const).map((depth) => (
                        <button
                          key={depth.value}
                          onClick={() => setCourseSettings(prev => ({ ...prev, depth: depth.value }))}
                          disabled={creating}
                          className={`w-full p-2.5 rounded-lg text-left transition-all border ${
                            courseSettings.depth === depth.value
                              ? 'bg-purple-500/10 border-purple-500/30'
                              : 'bg-black/40 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{depth.icon}</span>
                              <div>
                                <div className="text-xs font-semibold">
                                  {depth.label}
                                </div>
                                <div className="text-xs text-gray-500">{depth.desc}</div>
                              </div>
                            </div>
                            {courseSettings.depth === depth.value && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Token Cost Estimate */}
                  <div className="pt-3 border-t border-gray-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Minimum Required</span>
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="font-bold text-yellow-400">4,000</span>
                        <span className="text-gray-500">tokens</span>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button - Inside Sticky Container */}
                  <motion.button
                    onClick={handleCreateSession}
                    disabled={!prompt.trim() || creating}
                    whileHover={!creating && prompt.trim() ? { scale: 1.02 } : {}}
                    whileTap={!creating && prompt.trim() ? { scale: 0.98 } : {}}
                    className="w-full py-3 bg-white text-black rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Course
                      </>
                    )}
                  </motion.button>

                </motion.div>
              </div>

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
                className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6 w-full max-w-md"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20">
                      <Zap className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">Insufficient Tokens</h3>
                      <p className="text-xs text-gray-400">You need more tokens to create a course</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowInsufficientTokens(false)}
                    className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="bg-black/40 rounded-lg p-5 border border-gray-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Your Balance</span>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-red-400" />
                        <span className="text-xl font-bold text-red-400">{tokenBalance.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-px bg-gray-800"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Required</span>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-green-400" />
                        <span className="text-xl font-bold text-green-400">4,000</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-center text-gray-400">
                    Purchase more tokens to continue creating amazing courses
                  </p>

                  <Link href={`/profiles/${user.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-white text-black rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      Buy Tokens
                    </motion.button>
                  </Link>

                  <button
                    onClick={() => setShowInsufficientTokens(false)}
                    className="w-full py-2 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Maybe Later
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