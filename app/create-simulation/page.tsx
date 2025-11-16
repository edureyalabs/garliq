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
        <div className="text-6xl animate-bounce">🧄</div>
      </div>
    );
  }

  return (
    <SubscriptionGuard requireActive={true}>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
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
              <span className="text-sm font-semibold">Create Simulation</span>
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
            
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-400" />
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
                    Virtual Lab Generator
                  </h1>
                </div>
                <p className="text-sm text-gray-400">
                  Create interactive simulations to explore physics, biology, chemistry, and more
                </p>
              </motion.div>

              {/* Topic Category Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Select Topic Category
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {TOPIC_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedCategory === category.id;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        disabled={creating}
                        className={`relative p-4 rounded-xl transition-all border-2 ${
                          isSelected
                            ? 'bg-gradient-to-br ' + category.color + ' border-transparent shadow-lg'
                            : 'bg-gray-900/50 border-gray-800/50 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Icon size={24} className={isSelected ? 'text-white' : 'text-gray-400'} />
                          <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                            {category.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Prompt Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
                <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                    <Beaker size={14} />
                    Simulation Description
                  </label>
                  
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the simulation you want to create. Be specific about what you want to visualize and which parameters should be adjustable..."
                    className="w-full h-48 bg-black/50 text-white px-4 py-4 rounded-xl border border-gray-800/50 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none text-sm placeholder:text-gray-600 transition-all"
                    disabled={creating}
                    maxLength={5000}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleCreateSimulation();
                      }
                    }}
                  />
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {prompt.length.toLocaleString()}/5,000
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
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={12} className="text-purple-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Example Ideas</span>
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

            {/* Settings Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-5 space-y-5 sticky top-20"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-gray-800/50">
                  <Beaker size={16} className="text-purple-400" />
                  <h3 className="text-sm font-bold">What You'll Get</h3>
                </div>

                <div className="space-y-4 text-xs text-gray-400">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-400">🎯</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-300 mb-1">Interactive Controls</p>
                      <p>Sliders and buttons to adjust parameters in real-time</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-400">📊</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-300 mb-1">Live Statistics</p>
                      <p>Real-time metrics and data visualization</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-400">🎨</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-300 mb-1">Beautiful Design</p>
                      <p>Professional, clean interface with smooth animations</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-400">🤖</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-300 mb-1">AI Lab Assistant</p>
                      <p>Get instant help understanding the simulation</p>
                    </div>
                  </div>
                </div>

                {/* Token Cost */}
                <div className="pt-3 border-t border-gray-800/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Minimum Tokens</span>
                    <div className="flex items-center gap-1">
                      <Zap size={12} className="text-yellow-400" />
                      <span className="font-semibold text-yellow-400">10,000</span>
                      <span className="text-gray-500">tokens</span>
                    </div>
                  </div>
                </div>

              </motion.div>

              {/* Generate Button */}
              <motion.button
                onClick={handleCreateSimulation}
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
                      Creating Lab...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate Simulation
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
                        <p className="text-sm text-gray-400">You need more tokens to create a simulation</p>
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
                          <span className="text-2xl font-bold text-green-400">10,000</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-center text-gray-400 px-4">
                      Purchase more tokens to continue creating amazing simulations
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