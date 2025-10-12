'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Terminal, Loader2, Zap, Crown } from 'lucide-react';

type ModelType = 'llama-3.3-70b' | 'claude-sonnet-4.5';

export default function CreatePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('llama-3.3-70b');
  const [tokenBalance, setTokenBalance] = useState<number>(0);
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

  const handleCreateSession = async () => {
    if (!prompt.trim() || loading || !user) return;

    if (selectedModel === 'claude-sonnet-4.5' && tokenBalance < 1000) {
      setShowInsufficientTokens(true);
      return;
    }

    setLoading(true);
    
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

      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: sessionId,
          message: prompt,
          userId: user.id,
          model: selectedModel
        })
      });

      const generateData = await generateResponse.json();

      if (!generateData.success || generateData.error) {
        throw new Error(generateData.error || 'Failed to generate code');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      router.push(`/studio/${sessionId}`);
      
    } catch (error: any) {
      console.error('Creation failed:', error);
      alert(error.message || 'Failed to create project. Please try again.');
      setLoading(false);
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
              <span className="text-3xl">🧄</span>
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
              <span className="text-sm font-mono text-gray-400">v1.0.0</span>
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
            <label className="block text-sm font-bold text-gray-400 mb-3">Select AI Model</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedModel('llama-3.3-70b')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedModel === 'llama-3.3-70b'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={20} className="text-purple-400" />
                  <span className="font-bold">Llama 3.3 70B</span>
                  <span className="ml-auto px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">FREE</span>
                </div>
                <p className="text-xs text-gray-500">Fast, powerful, unlimited generations</p>
              </button>

              <button
                onClick={() => setSelectedModel('claude-sonnet-4.5')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedModel === 'claude-sonnet-4.5'
                    ? 'border-pink-500 bg-pink-500/10'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={20} className="text-pink-400" />
                  <span className="font-bold">Claude Sonnet 4.5</span>
                  <span className="ml-auto px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs rounded-full">PRO</span>
                </div>
                <p className="text-xs text-gray-500">Premium quality, 1000 tokens per gen</p>
              </button>
            </div>
          </div>

          {showInsufficientTokens && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
            >
              <p className="text-red-400 text-sm">
                ⚠️ Insufficient tokens! You need at least 1,000 tokens to use Claude Sonnet 4.5.
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
                placeholder="A cyberpunk portfolio with neon gradients and floating particles..."
                className="w-full h-64 bg-black/50 text-white p-4 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none resize-none font-mono text-sm placeholder:text-gray-600"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleCreateSession();
                  }
                }}
              />

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">
                  {loading ? 'Creating your vibe...' : 'Ctrl + Enter to execute'}
                </span>
                <motion.button
                  onClick={handleCreateSession}
                  disabled={!prompt.trim() || loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
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

          <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Start Templates</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                'A minimalist portfolio with dark mode',
                'An animated landing page with gradients',
                'A product showcase with hover effects',
                'A music player interface'
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  disabled={loading}
                  className="p-4 bg-gray-900 hover:bg-gray-800 rounded-xl border border-gray-800 hover:border-purple-500/50 transition-all text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}