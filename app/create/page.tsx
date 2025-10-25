'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Terminal, Zap, Crown, Loader2, Sparkles, Globe, Brain, ChevronDown, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

type ModelType = 'llama-3.3-70b' | 'claude-sonnet-4.5';

export default function CreatePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelType>('llama-3.3-70b');
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [creating, setCreating] = useState(false);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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

    if (selectedModel === 'claude-sonnet-4.5' && tokenBalance < 4000) {
      setShowInsufficientTokens(true);
      return;
    }

    setCreating(true);

    try {
      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          initialPrompt: prompt,
          userId: user.id,
          selectedModel: selectedModel
        })
      });

      const sessionData = await sessionResponse.json();
      if (!sessionData.session || sessionData.error) {
        throw new Error(sessionData.error || 'Failed to create session');
      }

      const sessionId = sessionData.session.id;

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
    <div className="min-h-screen bg-black text-white">
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
                VIBE CONSOLE
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
              <span className="text-sm font-mono text-gray-400">v1.0.0 Beta</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-400 mb-3">Select AI Agent</label>
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
                  UNLIMITED
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={20} className="text-purple-400" />
                  <span className="font-bold text-lg">Basic Agent</span>
                </div>
                
                <p className="text-xs text-gray-400 mb-4">Perfect for simple utilities & games</p>
                
                <div className="space-y-2 text-xs text-left">
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span>8K token output</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span>Fast generation (~30s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span>UI-focused applications</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-red-400">✕</span>
                    <span>No web search access</span>
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
                  -10K TOKENS
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={20} className="text-pink-400" />
                  <span className="font-bold text-lg">Pro Agent</span>
                </div>
                
                <p className="text-xs text-gray-400 mb-4">Advanced reasoning & web access</p>
                
                <div className="space-y-2 text-xs text-left">
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span>30K token output (4x more)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span>Web search enabled</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span>Memory & context awareness</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span>Complex orchestration</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Dynamic Context Tips */}
          {selectedModel === 'claude-sonnet-4.5' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <Sparkles size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-purple-300 font-semibold mb-2">💎 Pro Agent Tips:</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Be detailed - Pro Agent can handle complex requirements</li>
                    <li>• Mention if you need real-time data or web search</li>
                    <li>• Describe workflows with multiple steps</li>
                    <li>• Cost scales with complexity (base: 10K tokens)</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {showInsufficientTokens && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
            >
              <p className="text-red-400 text-sm">
                ⚠️ Insufficient tokens! You need at least 4,000 tokens to use Pro Agent.
                <br />
                <span className="text-gray-400">Current balance: {tokenBalance} tokens</span>
              </p>
            </motion.div>
          )}

          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-gray-800/50 px-6 py-3 flex items-center gap-2 border-b border-gray-700">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-sm text-gray-400 font-mono ml-4">vibe-input.sh</span>
            </div>

            <div className="p-6">
              <div className="mb-4 flex items-center gap-2 text-purple-400 font-mono text-sm">
                <Terminal size={16} />
                <span>garliq@vibe:~$</span>
                <span className="text-gray-500">describe_your_vision</span>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your visualization to the agent, include as much detail as possible..."
                className="w-full h-64 bg-black/50 text-white p-4 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none resize-none font-mono text-sm placeholder:text-gray-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleCreateSession();
                  }
                }}
                maxLength={10000}
              />

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">
                  {creating ? 'Initializing project...' : 'Ctrl + Enter to execute'}
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
                      <Send size={18} />
                      Execute
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Prompting Guide */}
          <div className="mt-8">
            <motion.div 
              initial={false}
              className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
            >
              <button 
                onClick={() => setShowGuide(!showGuide)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-900/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Brain size={20} className="text-purple-400" />
                  <span className="font-semibold text-purple-400">
                    📚 How to write effective prompts
                  </span>
                </div>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-400 transition-transform ${showGuide ? 'rotate-180' : ''}`}
                />
              </button>
              
              {showGuide && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-800"
                >
                  <div className="p-6 space-y-6">
                    {/* Basic Agent Guide */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap size={18} className="text-purple-400" />
                        <h4 className="font-bold text-purple-300">Basic Agent - Best Practices</h4>
                      </div>
                      
                      <div className="bg-black/30 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-green-400 mb-2">✅ BEST FOR:</p>
                          <ul className="text-xs text-gray-400 space-y-1 ml-4">
                            <li>• Simple utilities (calculators, timers, converters)</li>
                            <li>• Games and interactive widgets</li>
                            <li>• UI-heavy applications</li>
                            <li>• Quick prototypes</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="text-sm font-semibold text-red-400 mb-2">❌ AVOID:</p>
                          <ul className="text-xs text-gray-400 space-y-1 ml-4">
                            <li>• Complex data analysis</li>
                            <li>• Real-time information needs</li>
                            <li>• Multi-step reasoning tasks</li>
                            <li>• Large-scale content generation</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="text-sm font-semibold text-blue-400 mb-2">💡 PROMPTING TIPS:</p>
                          <ul className="text-xs text-gray-400 space-y-1 ml-4">
                            <li>• Be specific about UI/UX requirements</li>
                            <li>• Describe exact functionality needed</li>
                            <li>• Mention any interactive elements</li>
                            <li>• Keep scope focused and single-purpose</li>
                          </ul>
                        </div>
                        
                        <div className="pt-3 border-t border-gray-800">
                          <p className="text-xs text-gray-500 italic">
                            Example: "Create a simple tip calculator with bill amount input, tip percentage slider (10-30%), and split bill option for 1-10 people. Use a clean, modern design with large buttons."
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pro Agent Guide */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Crown size={18} className="text-pink-400" />
                        <h4 className="font-bold text-pink-300">Pro Agent - Advanced Capabilities</h4>
                      </div>
                      
                      <div className="bg-black/30 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-green-400 mb-2">✅ BEST FOR:</p>
                          <ul className="text-xs text-gray-400 space-y-1 ml-4">
                            <li>• Research & analysis tools</li>
                            <li>• Content generators</li>
                            <li>• Data processing applications</li>
                            <li>• Multi-step workflows</li>
                            <li>• Real-time information apps</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="text-sm font-semibold text-purple-400 mb-2">⚡ POWER FEATURES:</p>
                          <ul className="text-xs text-gray-400 space-y-1 ml-4">
                            <li>• Web search integration</li>
                            <li>• 30K token output (4x more than Basic)</li>
                            <li>• Context-aware memory</li>
                            <li>• Complex orchestration</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="text-sm font-semibold text-yellow-400 mb-2">💰 TOKEN MANAGEMENT:</p>
                          <ul className="text-xs text-gray-400 space-y-1 ml-4">
                            <li>• Base cost: 10,000 tokens per generation</li>
                            <li>• Web searches: +500 tokens each</li>
                            <li>• Long outputs: scales with length</li>
                            <li>• Tip: Be specific to minimize iterations</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="text-sm font-semibold text-blue-400 mb-2">💡 ADVANCED PROMPTING:</p>
                          <ul className="text-xs text-gray-400 space-y-1 ml-4">
                            <li>• Describe the workflow step-by-step</li>
                            <li>• Specify data sources if needed</li>
                            <li>• Mention if web search is required</li>
                            <li>• Include edge cases to handle</li>
                            <li>• Request specific output formats</li>
                          </ul>
                        </div>
                        
                        <div className="pt-3 border-t border-gray-800">
                          <p className="text-xs text-gray-500 italic">
                            Example: "Create a stock market dashboard that fetches real-time data for AAPL, GOOGL, and MSFT. Include: current price, daily change %, 7-day price chart, and analyst sentiment from recent news. Use web search to get latest market data. Display in card layout with color-coded gains/losses."
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* General Tips */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
                      <p className="text-sm font-semibold text-purple-300 mb-2">🎯 Universal Best Practices:</p>
                      <ul className="text-xs text-gray-400 space-y-1 ml-4">
                        <li>• Start with core functionality, then add features</li>
                        <li>• Describe the user experience you want</li>
                        <li>• Mention any specific colors, themes, or styles</li>
                        <li>• Include examples of similar apps if helpful</li>
                        <li>• Test your creation and iterate with follow-up prompts</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}