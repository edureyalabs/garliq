'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Terminal, Zap, Crown, Loader2, Sparkles, CheckCircle2, BookOpen, Brain, Lightbulb } from 'lucide-react';
import Image from 'next/image';
import SubscriptionGuard from '@/components/SubscriptionGuard';

type ModelType = 'llama-3.3-70b' | 'claude-sonnet-4.5';
type CourseDepth = 'basic' | 'intermediate' | 'advanced';

interface CourseSettings {
  chapterCount: number;
  depth: CourseDepth;
}

export default function CreatePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelType>('llama-3.3-70b');
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [creating, setCreating] = useState(false);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);
  
  // New: Course settings
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

  const calculateTokenCost = (): number => {
    const depthTokens = {
      basic: 15000,
      intermediate: 22000,
      advanced: 30000
    };
    
    const chapterTokens = courseSettings.chapterCount * depthTokens[courseSettings.depth];
    const otherPagesTokens = 28000; // intro + toc + conclusion
    
    return chapterTokens + otherPagesTokens;
  };

  const calculateEstimatedTime = (): string => {
    const totalPages = courseSettings.chapterCount + 3; // intro + toc + chapters + conclusion
    const minMinutes = Math.ceil(totalPages * 0.5); // ~30 sec per page
    const maxMinutes = Math.ceil(totalPages * 1); // ~1 min per page
    return `${minMinutes}-${maxMinutes} min`;
  };

  const handleCreateSession = async () => {
    if (!prompt.trim() || !user || creating) return;

    const estimatedCost = calculateTokenCost();

    if (selectedModel === 'claude-sonnet-4.5' && tokenBalance < estimatedCost) {
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
          selectedModel: selectedModel,
          chapterCount: courseSettings.chapterCount,
          courseDepth: courseSettings.depth
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

  const depthOptions = [
    {
      id: 'basic' as CourseDepth,
      title: 'Basic',
      description: 'Quick overview of key concepts',
      tokens: '15K',
      time: '5-10 min/chapter',
      icon: '📚',
      features: ['Core concepts', 'Quick explanations', 'Essential knowledge']
    },
    {
      id: 'intermediate' as CourseDepth,
      title: 'Intermediate',
      description: 'Detailed explanations with examples',
      tokens: '22K',
      time: '10-15 min/chapter',
      icon: '🎓',
      features: ['In-depth content', 'Real examples', 'Practice exercises']
    },
    {
      id: 'advanced' as CourseDepth,
      title: 'Advanced',
      description: 'Comprehensive deep dive with interactivity',
      tokens: '30K',
      time: '15-20 min/chapter',
      icon: '🚀',
      features: ['Deep analysis', 'Interactive demos', 'Expert insights']
    }
  ];

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
              <ArrowLeft size={24} />
              <div className="flex items-center gap-3">
                <Image 
                  src="/logo.png" 
                  alt="Garliq" 
                  width={36} 
                  height={36}
                />
                <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  CREATE COURSE
                </h1>
              </div>
            </button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800">
                <Zap size={16} className="text-yellow-400" />
                <span className="text-sm font-bold">{tokenBalance.toLocaleString()} tokens</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800">
                <Terminal size={16} className="text-purple-400" />
                <span className="text-sm font-mono text-gray-400">Multi-Page v2.0</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            {/* Course Settings Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Brain size={24} className="text-purple-400" />
                <h2 className="text-2xl font-bold">Configure Your Course</h2>
              </div>

              {/* Chapter Count Slider */}
              <div className="mb-8 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
                <label className="block text-lg font-bold text-white mb-4">
                  Number of Chapters: <span className="text-purple-400">{courseSettings.chapterCount}</span>
                </label>
                
                <div className="relative">
                  <input 
                    type="range" 
                    min="1" 
                    max="15" 
                    value={courseSettings.chapterCount}
                    onChange={(e) => setCourseSettings(prev => ({
                      ...prev, 
                      chapterCount: parseInt(e.target.value)
                    }))}
                    className="w-full h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${((courseSettings.chapterCount - 1) / 14) * 100}%, rgb(31, 41, 55) ${((courseSettings.chapterCount - 1) / 14) * 100}%, rgb(31, 41, 55) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>1 chapter</span>
                    <span>15 chapters</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 mt-4 flex items-start gap-2">
                  <Lightbulb size={16} className="flex-shrink-0 mt-0.5 text-yellow-400" />
                  <span>More chapters = more comprehensive coverage. Recommended: 5-10 chapters for most topics.</span>
                </p>
              </div>

              {/* Depth Selection */}
              <div className="mb-8">
                <label className="block text-lg font-bold text-white mb-4">Course Depth</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {depthOptions.map(option => (
                    <motion.button
                      key={option.id}
                      onClick={() => setCourseSettings(prev => ({ ...prev, depth: option.id }))}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                        courseSettings.depth === option.id
                          ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                          : 'border-gray-800 hover:border-gray-700 bg-gray-900/50'
                      }`}
                    >
                      {courseSettings.depth === option.id && (
                        <motion.div
                          layoutId="activeDepth"
                          className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      
                      <div className="relative z-10">
                        <div className="text-4xl mb-3">{option.icon}</div>
                        <h3 className="text-xl font-bold mb-2">{option.title}</h3>
                        <p className="text-sm text-gray-400 mb-4">{option.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          {option.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                              <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-800">
                          <span className="text-gray-500">{option.tokens} tokens/chapter</span>
                          <span className="text-gray-500">{option.time}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Estimated Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen size={20} className="text-blue-400" />
                    <span className="text-sm text-gray-400">Total Pages</span>
                  </div>
                  <p className="text-3xl font-black text-blue-400">{courseSettings.chapterCount + 3}</p>
                  <p className="text-xs text-gray-500 mt-1">Intro + {courseSettings.chapterCount} chapters + Conclusion</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap size={20} className="text-purple-400" />
                    <span className="text-sm text-gray-400">Token Cost</span>
                  </div>
                  <p className="text-3xl font-black text-purple-400">~{(calculateTokenCost() / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-500 mt-1">Tokens will be deducted after generation</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Terminal size={20} className="text-green-400" />
                    <span className="text-sm text-gray-400">Est. Time</span>
                  </div>
                  <p className="text-3xl font-black text-green-400">{calculateEstimatedTime()}</p>
                  <p className="text-xs text-gray-500 mt-1">Parallel generation for speed</p>
                </div>
              </div>
            </div>

            {/* Model Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-400 mb-3">Select AI Model</label>
              <div className="grid grid-cols-2 gap-4">
                {/* Basic Agent Card */}
                <button
                  onClick={() => setSelectedModel('llama-3.3-70b')}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    selectedModel === 'llama-3.3-70b'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                    FREE
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={20} className="text-purple-400" />
                    <span className="font-bold text-lg">Basic Agent</span>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-4">Standard course generation</p>
                  
                  <div className="space-y-2 text-xs text-left">
                    <div className="flex items-center gap-2 text-gray-300">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span>Multi-page courses</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span>Fast generation</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span>All depth levels</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-red-400">✕</span>
                      <span>No web search</span>
                    </div>
                  </div>
                </button>

                {/* Pro Agent Card */}
                <button
                  onClick={() => setSelectedModel('claude-sonnet-4.5')}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    selectedModel === 'claude-sonnet-4.5'
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                    PREMIUM
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Crown size={20} className="text-pink-400" />
                    <span className="font-bold text-lg">Pro Agent</span>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-4">Enhanced with web search</p>
                  
                  <div className="space-y-2 text-xs text-left">
                    <div className="flex items-center gap-2 text-gray-300">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span>Everything in Basic</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span>Web search enabled</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span>Latest information</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span>Advanced reasoning</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Insufficient Tokens Warning */}
            {showInsufficientTokens && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
              >
                <p className="text-red-400 text-sm">
                  ⚠️ Insufficient tokens! You need approximately {(calculateTokenCost() / 1000).toFixed(0)}K tokens for this course.
                  <br />
                  <span className="text-gray-400">Current balance: {(tokenBalance / 1000).toFixed(0)}K tokens</span>
                </p>
              </motion.div>
            )}

            {/* Prompt Input */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gray-800/50 px-6 py-3 flex items-center gap-2 border-b border-gray-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-gray-400 font-mono ml-4">course-prompt.txt</span>
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-center gap-2 text-purple-400 font-mono text-sm">
                  <Terminal size={16} />
                  <span>garliq@create:~$</span>
                  <span className="text-gray-500">describe_your_course</span>
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Create a comprehensive course on stock market fundamentals. Cover topics like reading charts, understanding market indicators, risk management strategies, and portfolio building..."
                  className="w-full h-48 bg-black/50 text-white p-4 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none resize-none font-mono text-sm placeholder:text-gray-600"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleCreateSession();
                    }
                  }}
                  maxLength={10000}
                />

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">
                    {creating ? 'Initializing course generation...' : 'Ctrl + Enter to create'}
                  </span>
                  <motion.button
                    onClick={handleCreateSession}
                    disabled={!prompt.trim() || creating}
                    whileHover={!creating ? { scale: 1.02 } : {}}
                    whileTap={!creating ? { scale: 0.98 } : {}}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Generate Course
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles size={24} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-300 mb-2">💡 How Multi-Page Courses Work</h3>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li>• Your course will be generated as a beautiful book with navigation</li>
                    <li>• Each chapter gets its own dedicated page with full content</li>
                    <li>• All pages are generated simultaneously for fast results</li>
                    <li>• You can regenerate individual chapters if needed</li>
                    <li>• Progress is saved automatically - resume anytime</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </SubscriptionGuard>
  );
}