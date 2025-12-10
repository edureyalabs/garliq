'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Zap, Video, Sparkles } from 'lucide-react';
import Image from 'next/image';
import SubscriptionGuard from '@/components/SubscriptionGuard';

const EXAMPLE_PROMPTS = [
  "Explain quantum entanglement with visual animations",
  "How does photosynthesis work step by step",
  "Explain machine learning gradient descent visually",
  "Show how the immune system fights viruses",
  "Visualize the water cycle with animations"
];

const TOPIC_CATEGORIES = [
  { id: 'physics', name: 'Physics', color: 'from-blue-500 to-cyan-500' },
  { id: 'biology', name: 'Biology', color: 'from-green-500 to-emerald-500' },
  { id: 'chemistry', name: 'Chemistry', color: 'from-purple-500 to-pink-500' },
  { id: 'math', name: 'Mathematics', color: 'from-orange-500 to-red-500' },
  { id: 'cs', name: 'Computer Science', color: 'from-indigo-500 to-purple-500' },
  { id: 'other', name: 'Other', color: 'from-gray-500 to-slate-500' }
];

export default function CreateVideoPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('physics');
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [creating, setCreating] = useState(false);

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

  const generateTitle = async (userPrompt: string): Promise<string> => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: `Generate a short, catchy title (max 60 chars) for this educational video topic: "${userPrompt}". Return ONLY the title, nothing else.`
            }
          ],
          temperature: 0.7,
          max_tokens: 50
        })
      });

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || 'Educational Video';
    } catch {
      return 'Educational Video';
    }
  };

  const handleCreateVideo = async () => {
    if (!prompt.trim() || !user || creating) return;

    const MINIMUM_TOKENS = 20000;
    if (tokenBalance < MINIMUM_TOKENS) {
      alert('Insufficient tokens. Minimum 20,000 required.');
      return;
    }

    setCreating(true);

    try {
      const generatedTitle = await generateTitle(prompt.trim());

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const videoResponse = await fetch('/api/videos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          title: generatedTitle,
          topicCategory: selectedCategory
        })
      });

      const videoData = await videoResponse.json();
      
      if (!videoData.success || !videoData.video) {
        throw new Error(videoData.error || 'Failed to create video');
      }

      router.push(`/video-studio/${videoData.video.id}`);
      
    } catch (error: any) {
      setCreating(false);
      alert(error.message || 'Failed to create video');
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
        <div className="fixed inset-0 bg-black">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>

        <nav className="relative z-50 border-b border-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 hover:opacity-70">
              <ArrowLeft className="w-5 h-5" />
              <Image src="/logo.png" alt="Garliq" width={32} height={32} />
              <span className="font-bold">Create Video</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-black/30 border border-gray-800 rounded-lg">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="font-bold">{tokenBalance.toLocaleString()}</span>
            </div>
          </div>
        </nav>

        <div className="relative px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">
                Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">AI Video</span>
              </h1>
              <p className="text-gray-400">Generate educational explainer videos with animations</p>
            </motion.div>

            <div className="space-y-6">
              <div className="bg-black/30 border border-gray-800 rounded-xl p-6">
                <label className="text-sm font-semibold text-gray-400 mb-3 block">Topic Category</label>
                <div className="flex flex-wrap gap-2 mb-6">
                  {TOPIC_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      disabled={creating}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : 'bg-black/40 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <label className="text-sm font-semibold text-gray-400 mb-3 block">Video Description</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to explain in the video..."
                  className="w-full h-40 bg-black/40 text-white px-4 py-3 rounded-lg border border-gray-800 focus:border-purple-500/50 focus:outline-none resize-none"
                  disabled={creating}
                  maxLength={5000}
                />
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>{prompt.length} / 5,000</span>
                </div>
              </div>

              <div className="bg-black/30 border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Example Ideas
                </h3>
                <div className="space-y-2">
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ex)}
                      disabled={creating}
                      className="w-full text-left p-3 bg-black/40 hover:bg-black/60 border border-gray-800 rounded-lg text-sm text-gray-400"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={handleCreateVideo}
                disabled={!prompt.trim() || creating}
                whileHover={!creating && prompt.trim() ? { scale: 1.02 } : {}}
                whileTap={!creating && prompt.trim() ? { scale: 0.98 } : {}}
                className="w-full py-4 bg-white text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5" />
                    Generate Video (20k tokens)
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </SubscriptionGuard>
  );
}