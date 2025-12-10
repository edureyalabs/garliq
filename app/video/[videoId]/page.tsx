'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Loader2, 
  Share2, 
  CheckCircle, 
  RotateCcw, 
  AlertCircle,
  Clock,
  Film,
  Sparkles,
  Check
} from 'lucide-react';
import Image from 'next/image';
import SubscriptionGuard from '@/components/SubscriptionGuard';

interface VideoGeneration {
  id: string;
  user_id: string;
  prompt: string;
  title: string | null;
  description: string | null;
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
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generationTriggered, setGenerationTriggered] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkUser();
  }, [videoId]);

  useEffect(() => {
    if (user) {
      loadVideo();
      checkIfShared();
      
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

  // Calculate progress based on status - but don't simulate during 'generating'
  useEffect(() => {
    if (video) {
      switch (video.generation_status) {
        case 'pending':
          setProgress(5);
          break;
        case 'generating':
          // Keep progress at 50% during generation (backend is working)
          // Don't simulate progress to avoid confusion on refresh
          setProgress(50);
          break;
        case 'completed':
          setProgress(100);
          break;
        case 'failed':
          setProgress(0);
          break;
      }
    }
  }, [video?.generation_status]);

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
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const checkIfShared = async () => {
    try {
      const { data } = await supabase
        .from('video_posts')
        .select('id')
        .eq('video_id', videoId)
        .eq('is_published', true)
        .single();
      
      if (data) {
        setShared(true);
      }
    } catch {
      setShared(false);
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

  const handleInstantShare = async () => {
    if (sharing || shared || !user || !video) return;
    
    setSharing(true);

    try {
      // Share with title as caption and description
      const response = await fetch('/api/video-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          caption: video.title || 'Educational Video',
          description: video.description || '',
          userId: user.id
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setShared(true);

      // Copy shareable link to clipboard
      const shareUrl = `${window.location.origin}/video/${video.id}`;
      
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('✅ Video shared successfully!\n\nLink copied to clipboard.');
      } catch {
        alert(`✅ Video shared successfully!\n\nShare link: ${shareUrl}`);
      }
      
    } catch (error: any) {
      alert('❌ Failed to share video: ' + error.message);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user || !video) return null;

  const statusConfig = {
    pending: { 
      color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      icon: Clock,
      label: 'Preparing'
    },
    generating: { 
      color: 'bg-blue-500/20 border-blue-500/30 text-blue-400 animate-pulse',
      icon: Film,
      label: 'Generating'
    },
    completed: { 
      color: 'bg-green-500/20 border-green-500/30 text-green-400',
      icon: CheckCircle,
      label: 'Complete'
    },
    failed: { 
      color: 'bg-red-500/20 border-red-500/30 text-red-400',
      icon: AlertCircle,
      label: 'Failed'
    }
  };

  const currentStatus = statusConfig[video.generation_status];
  const StatusIcon = currentStatus.icon;

  return (
    <SubscriptionGuard requireActive={true}>
      <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800 flex-shrink-0">
          <div className="px-6 py-3 flex items-center justify-between">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 hover:opacity-70 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <Image src="/logo.png" alt="Garliq" width={24} height={24} />
              <span className="text-sm font-medium">Back to Feed</span>
            </button>

            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 ${currentStatus.color}`}>
                <StatusIcon className="w-3 h-3" />
                {currentStatus.label}
              </div>

              {video.generation_status === 'completed' && (
                <button
                  onClick={handleInstantShare}
                  disabled={sharing || shared}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition ${
                    shared 
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50'
                  }`}
                >
                  {sharing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Sharing...
                    </>
                  ) : shared ? (
                    <>
                      <Check className="w-3 h-3" />
                      Shared
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3 h-3" />
                      Share Video
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - 70/30 Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Video Player (70%) */}
          <div className="w-[70%] flex flex-col bg-black border-r border-gray-800">
            {/* Video Container */}
            <div className="flex-1 flex items-center justify-center p-6">
              {video.generation_status === 'pending' || video.generation_status === 'generating' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center max-w-md"
                >
                  <div className="relative mb-6">
                    <div className="w-24 h-24 mx-auto">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke="#1f2937" 
                          strokeWidth="6"
                        />
                        <circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke="url(#gradient)" 
                          strokeWidth="6"
                          strokeDasharray={`${progress * 2.83} 283`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                          className="transition-all duration-500"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-3 animate-pulse" />
                  <h2 className="text-xl font-semibold mb-2">Creating Your Video</h2>
                  <p className="text-sm text-gray-400 mb-3">
                    {video.generation_status === 'pending' 
                      ? 'Preparing generation pipeline...' 
                      : 'Generating animations and rendering segments...'}
                  </p>
                  <p className="text-xs text-gray-500">This may take 5-10 minutes</p>
                  <p className="text-xs text-green-400 mt-2">✨ Streaming-optimized for instant playback</p>
                </motion.div>
              ) : video.generation_status === 'failed' ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-center max-w-md"
                >
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <h2 className="text-xl font-semibold mb-2">Generation Failed</h2>
                  <p className="text-sm text-gray-400 mb-4">{video.generation_error || 'An error occurred'}</p>
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 mx-auto transition"
                  >
                    {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    {regenerating ? 'Retrying...' : 'Try Again'}
                  </button>
                </motion.div>
              ) : video.video_url ? (
                <div className="w-full max-w-5xl">
                  <video
                    src={video.video_url}
                    controls
                    autoPlay
                    preload="metadata"
                    playsInline
                    className="w-full rounded-lg border border-gray-800 shadow-2xl"
                    onLoadStart={() => console.log('🎥 Video loading started')}
                    onLoadedMetadata={() => console.log('✅ Metadata loaded - ready to play')}
                    onCanPlay={() => console.log('✅ Video can play')}
                    onWaiting={() => console.log('⏳ Video buffering...')}
                    onPlaying={() => console.log('▶️  Video playing')}
                    onError={(e) => console.error('❌ Video error:', e)}
                  />
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    ⚡ Optimized for instant playback • Zero buffering
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No video available</p>
              )}
            </div>

            {/* Video Title & Info (below video) */}
            <div className="px-6 pb-6 pt-3">
              <h1 className="text-lg font-semibold mb-1.5 leading-tight">
                {video.title || 'Untitled Video'}
              </h1>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {video.duration_seconds && (
                  <>
                    <span>{Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}</span>
                    <span>•</span>
                  </>
                )}
                <span className="capitalize">{video.topic_category}</span>
                <span>•</span>
                <span>{new Date(video.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Description (30%) */}
          <div className="w-[30%] bg-gray-950 overflow-y-auto">
            <div className="p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-200">
                <Sparkles className="w-4 h-4 text-purple-400" />
                About This Video
              </h3>
              
              {video.description ? (
                <div className="text-xs text-gray-300 leading-relaxed space-y-3">
                  {video.description.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="text-justify">{paragraph}</p>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic">
                  {video.generation_status === 'pending' || video.generation_status === 'generating' ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Description will be available soon...</span>
                    </div>
                  ) : (
                    'Description will be available soon.'
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SubscriptionGuard>
  );
}