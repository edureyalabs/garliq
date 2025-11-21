'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Zap, X, Sparkles, Beaker, Atom, Brain, Calculator, Cpu, Dna } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SubscriptionGuard from '@/components/SubscriptionGuard';

const EXAMPLE_PROMPTS = [
  "Create a gravity simulator showing planetary orbits with adjustable mass and velocity",
  "Build an interactive DNA replication visualization showing the steps of cell division",
  "Make a pendulum simulator with adjustable length, gravity, and initial angle",
  "Create a chemical bonding simulator showing how atoms share electrons",
  "Build a wave interference simulator showing constructive and destructive patterns"
];

const TOPIC_CATEGORIES = [
  { id: 'physics', name: 'Physics', icon: Atom, color: 'from-blue-500 to-cyan-500' },
  { id: 'biology', name: 'Biology', icon: Dna, color: 'from-green-500 to-emerald-500' },
  { id: 'chemistry', name: 'Chemistry', icon: Beaker, color: 'from-purple-500 to-pink-500' },
  { id: 'math', name: 'Mathematics', icon: Calculator, color: 'from-orange-500 to-red-500' },
  { id: 'cs', name: 'Computer Science', icon: Cpu, color: 'from-indigo-500 to-purple-500' },
  { id: 'other', name: 'Other', icon: Brain, color: 'from-gray-500 to-slate-500' }
];

export default function CreateSimulationPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('physics');
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [creating, setCreating] = useState(false);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);

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

  const handleCreateSimulation = async () => {
    if (!prompt.trim() || !user || creating) return;

    const MINIMUM_TOKENS = 10000;

    if (tokenBalance < MINIMUM_TOKENS) {
      setShowInsufficientTokens(true);
      return;
    }

    setCreating(true);

    try {
      // Create simulation record
      const simulationResponse = await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          topicCategory: selectedCategory
        })
      });

      const simulationData = await simulationResponse.json();
      
      if (!simulationData.success || !simulationData.simulation) {
        throw new Error(simulationData.error || 'Failed to create simulation');
      }

      const simulationId = simulationData.simulation.id;

      console.log('✅ Simulation record created:', simulationId);
      
      // Redirect to studio
      router.push(`/simulation-studio/${simulationId}`);
      
    } catch (error: any) {
      setCreating(false);
      console.error('Creation failed:', error);
      alert(error.message || 'Failed to create simulation. Please try again.');
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
          <div className="max-w-7xl mx-auto px-6 py-1 flex items-center justify-between">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5" />
              <Image 
                src="/logo.png" 
                alt="Garliq" 
                width={32} 
                height={32}
              />
              <span className="text-base font-bold">Create Simulation</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1 bg-black/30 backdrop-blur-sm border border-gray-800 rounded-lg">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold">{tokenBalance.toLocaleString()}</span>
              <span className="text-xs text-gray-500">tokens</span>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="relative px-6 py-2">
          <div className="max-w-7xl mx-auto">
            
            {/* Hero Section - Minimal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-3"
            >
              <h1 className="text-xl md:text-4xl font-bold leading-tight">
                Create interactive{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Simulations
                </span>
              </h1>
              
              <p className="text-xs text-gray-400 max-w-3xl mx-auto mt-1">
                Build hands-on learning experiences to explore physics, biology, chemistry, and more
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              
              {/* Left Column - Main Input */}
              <div className="lg:col-span-2 space-y-3">
                
                {/* Topic Category Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-3"
                >
                  <label className="text-xs font-semibold text-gray-400 mb-2 block">
                    Topic Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TOPIC_CATEGORIES.map((category) => {
                      const Icon = category.icon;
                      const isSelected = selectedCategory === category.id;
                      
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          disabled={creating}
                          className={`px-3 py-1.5 rounded-lg transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-purple-500/10 border-purple-500/30'
                              : 'bg-black/40 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-400' : 'text-gray-400'}`} />
                          <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                            {category.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Simulation Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Beaker className="w-3.5 h-3.5 text-purple-400" />
                    <h3 className="text-xs font-bold">Simulation Description</h3>
                  </div>
                  
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the simulation you want to create. Be specific about what you want to visualize and which parameters should be adjustable. For example: 'Create a pendulum simulator with adjustable length, gravity, and initial angle...'"
                    className="w-full h-32 bg-black/40 text-xs text-white px-3 py-2 rounded-lg border border-gray-800 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none placeholder:text-gray-600 transition-all"
                    disabled={creating}
                    maxLength={5000}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleCreateSimulation();
                      }
                    }}
                  />
                  
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-500">
                      {prompt.length.toLocaleString()} / 5,000 characters
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
                  transition={{ delay: 0.3 }}
                  className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <h3 className="text-xs font-bold">Example Ideas</h3>
                  </div>
                  
                  <div className="space-y-1.5">
                    {EXAMPLE_PROMPTS.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(example)}
                        disabled={creating}
                        className="w-full text-left p-2.5 bg-black/40 hover:bg-black/60 border border-gray-800 hover:border-gray-700 rounded-lg text-xs text-gray-400 hover:text-gray-300 transition-all"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </motion.div>

              </div>

              {/* Right Column - Info & CTA (Sticky Container) */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-3 space-y-3 sticky top-20"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <Beaker className="w-3.5 h-3.5 text-purple-400" />
                    <h3 className="text-xs font-bold">What You'll Get</h3>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 text-xs text-gray-400">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">🎯</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-300 mb-0.5 text-xs">Interactive Controls</p>
                        <p className="text-xs leading-snug">Sliders and buttons to adjust parameters in real-time</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">📊</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-300 mb-0.5 text-xs">Live Statistics</p>
                        <p className="text-xs leading-snug">Real-time metrics and data visualization</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">🎨</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-300 mb-0.5 text-xs">Beautiful Design</p>
                        <p className="text-xs leading-snug">Professional, clean interface with smooth animations</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">🤖</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-300 mb-0.5 text-xs">AI Lab Assistant</p>
                        <p className="text-xs leading-snug">Get instant help understanding the simulation</p>
                      </div>
                    </div>
                  </div>

                  {/* Token Cost */}
                  <div className="pt-2 border-t border-gray-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Minimum Required</span>
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="font-bold text-yellow-400">10,000</span>
                        <span className="text-gray-500">tokens</span>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button - Inside Sticky Container */}
                  <motion.button
                    onClick={handleCreateSimulation}
                    disabled={!prompt.trim() || creating}
                    whileHover={!creating && prompt.trim() ? { scale: 1.02 } : {}}
                    whileTap={!creating && prompt.trim() ? { scale: 0.98 } : {}}
                    className="w-full py-2 bg-white text-black rounded-lg font-semibold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Lab...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Simulation
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
                      <p className="text-xs text-gray-400">You need more tokens to create a simulation</p>
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
                        <span className="text-xl font-bold text-green-400">10,000</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-center text-gray-400">
                    Purchase more tokens to continue creating amazing simulations
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