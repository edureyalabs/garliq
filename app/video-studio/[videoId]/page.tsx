'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Share2, X, CheckCircle, RotateCcw, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import SubscriptionGuard from '@/components/SubscriptionGuard';

interface VideoGeneration {
  id: string;
  user_id: string;
  prompt: string;
  title: string | null;
  topic_category: string;
  video_url: string | null;
  thumbnail_url: string | null;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  generation_error: string | null;
  retry_count: number;
  duration_seconds: number | null;
  created_at: string;
}

export default function VideoStudioPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.videoId as string;

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [video, setVideo] = useState<VideoGeneration | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCaption, setShareCaption] = useState('');
  const [shareDescription, setShareDescription] = useState('');
  const [sharing, setSharing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generationTriggered, setGenerationTriggered] = useState(false);

  useEffect(() => {
    checkUser();
  }, [videoId]);

  useEffect(() => {
    if (user) {
      loadVideo();
      
      const channel = supabase
        .channel(`video-${videoId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_generations',
          filter: `id=eq.${videoId}`
        }, (payload) => {
          const updatedVideo = payload.new as VideoGeneration;
          setVideo(updatedVideo);
          if (updatedVideo.generation_status === 'completed' || updatedVideo.generation_status === 'failed') {
            setRegenerating(false);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, videoId]);

  useEffect(() => {
    if (video && video.generation_status === 'pending' && !generationTriggered) {
      setGenerationTriggered(true);
      triggerGeneration();
    }
  }, [video, generationTriggered]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
    } else {
      setUser(session.user);
    }
  };

  const loadVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('video_generations')
        .select('*')
        .eq('id', videoId)
        .single();

      if (error) throw error;
      setVideo(data);
    } catch (error) {
      console.error('Failed to load video:', error);
      alert('Video not found');
      router.push('/feed');
    } finally {
      setLoading(false);
    }
  };

  const triggerGeneration = async () => {
    if (!user || !video) return;

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          userId: user.id,
          topicCategory: video.topic_category
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
    } catch (error: any) {
      alert(error.message || 'Generation failed');
    }
  };

  const handleRegenerate = async () => {
    if (!user || regenerating) return;
    setRegenerating(true);

    try {
      const response = await fetch('/api/regenerate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, userId: user.id })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
    } catch (error: any) {
      setRegenerating(false);
      alert(error.message);
    }
  };

  const handleShare = async () => {
    if (!shareCaption.trim() || sharing || !user || !video) return;
    setSharing(true);

    try {
      const response = await fetch('/api/video-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          caption: shareCaption.trim(),
          description: shareDescription.trim(),
          userId: user.id
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setShowShareModal(false);
      setShareCaption('');
      setShareDescription('');
      await loadVideo();
      alert('Video shared!');
    } catch (error: any) {
      alert(error.message);
    }
    setSharing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user || !video) return null;

  return (
    <SubscriptionGuard requireActive={true}>
      <div className="h-screen bg-black text-white flex flex-col">
        <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800">
          <div className="px-6 py-4 flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 hover:opacity-70">
              <ArrowLeft className="w-5 h-5" />
              <Image src="/logo.png" alt="Garliq" width={32} height={32} />
              <h1 className="font-bold">{video.title || 'Video'}</h1>
            </button>

            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                video.generation_status === 'pending' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                video.generation_status === 'generating' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 animate-pulse' :
                video.generation_status === 'completed' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                'bg-red-500/20 border-red-500/30 text-red-400'
              }`}>
                {video.generation_status}
              </div>

              {video.generation_status === 'completed' && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          {video.generation_status === 'pending' || video.generation_status === 'generating' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Generating Video</h2>
              <p className="text-gray-400">This may take 5-10 minutes...</p>
            </motion.div>
          ) : video.generation_status === 'failed' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Generation Failed</h2>
              <p className="text-gray-400 mb-4">{video.generation_error}</p>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="bg-red-600 px-6 py-3 rounded-full font-bold flex items-center gap-2 mx-auto"
              >
                {regenerating ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                Try Again
              </button>
            </motion.div>
          ) : video.video_url ? (
            <div className="w-full max-w-5xl">
              <video
                src={video.video_url}
                controls
                className="w-full rounded-xl border border-gray-800"
              />
            </div>
          ) : (
            <p className="text-gray-400">No video available</p>
          )}
        </div>

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
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Share Video</h3>
                  <button onClick={() => setShowShareModal(false)} disabled={sharing}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Caption</label>
                    <textarea
                      value={shareCaption}
                      onChange={(e) => setShareCaption(e.target.value)}
                      placeholder="Add a caption..."
                      className="w-full px-4 py-3 bg-black/50 rounded-lg border border-gray-700 resize-none"
                      disabled={sharing}
                      maxLength={200}
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Description (optional)</label>
                    <textarea
                      value={shareDescription}
                      onChange={(e) => setShareDescription(e.target.value)}
                      placeholder="Add a description..."
                      className="w-full px-4 py-3 bg-black/50 rounded-lg border border-gray-700 resize-none"
                      disabled={sharing}
                      maxLength={500}
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={handleShare}
                    disabled={!shareCaption.trim() || sharing}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {sharing ? <Loader2 className="animate-spin" /> : <Share2 />}
                    {sharing ? 'Publishing...' : 'Publish Video'}
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