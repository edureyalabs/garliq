'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Loader2, Share2, X, AlertCircle, CheckCircle, 
  RotateCcw, Sparkles, Zap, Eye
} from 'lucide-react';
import Image from 'next/image';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import SimulationViewer from '@/components/SimulationViewer';
import SimulationTutor from '@/components/SimulationTutor';

interface Simulation {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  description: string | null;
  html_code: string | null;
  topic_category: string;
  framework_used: string | null;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  generation_error: string | null;
  retry_count: number;
  is_published: boolean;
  post_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function SimulationStudioPage() {
  const router = useRouter();
  const params = useParams();
  const simulationId = params.simulationId as string;

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCaption, setShareCaption] = useState('');
  const [shareDescription, setShareDescription] = useState('');
  const [sharing, setSharing] = useState(false);
  const [generationTriggered, setGenerationTriggered] = useState(false);

  useEffect(() => {
    checkUser();
  }, [simulationId]);

  useEffect(() => {
    if (user) {
      loadSimulation();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel(`simulation-${simulationId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'simulations',
            filter: `id=eq.${simulationId}`
          },
          (payload) => {
            const updatedSimulation = payload.new as Simulation;
            setSimulation(updatedSimulation);
            
            if (updatedSimulation.generation_status === 'completed' || 
                updatedSimulation.generation_status === 'failed') {
              setRegenerating(false);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, simulationId]);

  useEffect(() => {
    if (simulation && simulation.generation_status === 'pending' && !generationTriggered) {
      setGenerationTriggered(true);
      triggerGeneration();
    }
  }, [simulation, generationTriggered]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
    } else {
      setUser(session.user);
    }
  };

  const loadSimulation = async () => {
    try {
      const response = await fetch(`/api/simulations/${simulationId}`);
      const data = await response.json();

      if (data.simulation) {
        setSimulation(data.simulation);
      } else {
        alert('Simulation not found');
        router.push('/feed');
      }
    } catch (error) {
      console.error('Failed to load simulation:', error);
      alert('Failed to load simulation');
    } finally {
      setLoading(false);
    }
  };

  const triggerGeneration = async () => {
    if (!user || !simulation) return;

    try {
      const response = await fetch('/api/generate-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: simulation.id,
          userId: user.id,
          topicCategory: simulation.topic_category
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      console.log('✅ Generation triggered');
    } catch (error: any) {
      console.error('Generation trigger failed:', error);
      alert(error.message || 'Failed to start generation');
    }
  };

  const handleRegenerate = async () => {
    if (!user || regenerating) return;

    setRegenerating(true);

    try {
      const response = await fetch('/api/regenerate-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: simulationId,
          userId: user.id
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Regeneration failed');
      }

      console.log('✅ Regeneration triggered');
    } catch (error: any) {
      setRegenerating(false);
      alert(error.message || 'Failed to regenerate');
    }
  };

  const handleShare = async () => {
    if (!shareCaption.trim() || sharing || !user || !simulation) return;

    setSharing(true);

    try {
      const response = await fetch('/api/simulation-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: simulation.id,
          caption: shareCaption.trim(),
          userId: user.id
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to share');
      }

      setShowShareModal(false);
      setShareCaption('');
      setShareDescription('');
      await loadSimulation();

      alert('✅ Simulation shared successfully!');
    } catch (error: any) {
      console.error('Share failed:', error);
      alert(error.message || 'Failed to share simulation');
    }

    setSharing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl"
        >
          🧄
        </motion.div>
      </div>
    );
  }

  if (!user || !simulation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-6xl animate-bounce">🧄</div>
      </div>
    );
  }

  return (
    <SubscriptionGuard requireActive={true}>
      <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800 flex-shrink-0">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <ArrowLeft size={18} />
              <Image 
                src="/logo.png" 
                alt="Garliq" 
                width={24} 
                height={24}
              />
              <h1 className="text-sm font-bold truncate max-w-[300px]">{simulation.title}</h1>
            </button>

            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${
                simulation.generation_status === 'pending' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                simulation.generation_status === 'generating' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 animate-pulse' :
                simulation.generation_status === 'completed' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                'bg-red-500/20 border-red-500/30 text-red-400'
              }`}>
                {simulation.generation_status === 'pending' && '⏳ Pending'}
                {simulation.generation_status === 'generating' && '🔄 Generating'}
                {simulation.generation_status === 'completed' && '✅ Complete'}
                {simulation.generation_status === 'failed' && '❌ Failed'}
              </div>

              {/* Share Button - Changes to "Shared" when published */}
              {simulation.generation_status === 'completed' && (
                simulation.is_published ? (
                  <div className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    Shared
                  </div>
                ) : (
                  <motion.button
                    onClick={() => setShowShareModal(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Share2 size={14} />
                    Share
                  </motion.button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
          {simulation.generation_status === 'pending' || simulation.generation_status === 'generating' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="text-6xl mb-6"
              >
                🧄
              </motion.div>
              <h2 className="text-2xl font-bold mb-3">Creating Your Simulation</h2>
              <p className="text-gray-400 mb-6">
                Our AI is generating your interactive lab. This may take 2-5 minutes...
              </p>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin text-purple-400" size={20} />
                <span className="text-sm text-gray-500">Generating amazing simulation...</span>
              </div>
            </motion.div>
          ) : simulation.generation_status === 'failed' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-red-400">Generation Failed</h2>
              <p className="text-gray-400 mb-2">
                {simulation.generation_error || 'Something went wrong during generation'}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Attempts: {simulation.retry_count}
              </p>
              <motion.button
                onClick={handleRegenerate}
                disabled={regenerating}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
              >
                {regenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RotateCcw size={20} />
                    Try Again
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : simulation.html_code ? (
            <div className="w-full h-full flex flex-col">
              <SimulationViewer 
                htmlCode={simulation.html_code}
                className="flex-1"
              />
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>No simulation content available</p>
            </div>
          )}
        </div>

        {/* AI Tutor (only show when completed) */}
        {simulation.generation_status === 'completed' && simulation.html_code && (
          <SimulationTutor
            context={{
              simulationTitle: simulation.title,
              topicCategory: simulation.topic_category,
              frameworkUsed: simulation.framework_used || 'Unknown'
            }}
          />
        )}

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
              onClick={() => !sharing && setShowShareModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                      <Share2 size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Share Simulation</h3>
                      <p className="text-sm text-gray-400">Share your creation with others</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => !sharing && setShowShareModal(false)} 
                    disabled={sharing}
                    className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <X size={24} className="text-gray-400 hover:text-white" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Title
                    </label>
                    <textarea
                      value={shareCaption}
                      onChange={(e) => setShareCaption(e.target.value)}
                      placeholder="Give your simulation a catchy title..."
                      className="w-full px-5 py-4 bg-black/50 rounded-2xl border border-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none text-gray-100 placeholder-gray-500"
                      disabled={sharing}
                      maxLength={200}
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <p className="text-xs text-gray-500">
                        {shareCaption.length}/200
                      </p>
                    </div>
                  </div>

                  <motion.button
                    onClick={handleShare}
                    disabled={!shareCaption.trim() || sharing}
                    whileHover={!sharing ? { scale: 1.02 } : {}}
                    whileTap={!sharing ? { scale: 0.98 } : {}}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-4 rounded-2xl font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25 transition-all"
                  >
                    {sharing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Share2 size={20} />
                        Publish Simulation
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SubscriptionGuard>
  );
}