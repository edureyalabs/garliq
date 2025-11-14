'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Share2, ArrowLeft, Bookmark, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionModal from '@/components/SubscriptionModal';
import SimulationViewer from '@/components/SimulationViewer';
import SimulationTutor from '@/components/SimulationTutor';

interface SimulationPost {
  id: string;
  caption: string;
  prompt_visible: boolean;
  html_code: string;
  topic_category: string;
  framework_used: string;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  views_count: number;
  created_at: string;
  user_id: string;
  simulation_id: string;
  is_liked?: boolean;
  is_saved?: boolean;
}

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export default function SimulationPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<SimulationPost | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const { subscription, loading: subLoading, refetch: refetchSubscription } = useSubscription();

  useEffect(() => {
    checkUser();
    fetchPost();
  }, [postId]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUser(session.user);
  };

  const fetchPost = async () => {
    try {
      const { data: postData, error } = await supabase
        .from('simulation_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;

      if (postData) {
        console.log('Fetched simulation post:', postData);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', postData.user_id)
          .single();

        if (profileData) setProfile(profileData);

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const [likeData, saveData] = await Promise.all([
            supabase.from('simulation_likes').select('*').eq('post_id', postId).eq('user_id', session.user.id).maybeSingle(),
            supabase.from('simulation_saves').select('*').eq('post_id', postId).eq('user_id', session.user.id).maybeSingle()
          ]);

          setPost({
            ...postData,
            likes_count: postData.likes_count || 0,
            comments_count: postData.comments_count || 0,
            saves_count: postData.saves_count || 0,
            views_count: postData.views_count || 0,
            is_liked: !!likeData.data,
            is_saved: !!saveData.data
          });
        } else {
          setPost({
            ...postData,
            likes_count: postData.likes_count || 0,
            comments_count: postData.comments_count || 0,
            saves_count: postData.saves_count || 0,
            views_count: postData.views_count || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !post) return;

    if (!subLoading && !subscription?.is_active) {
      setShowSubscriptionModal(true);
      return;
    }

    const isLiked = post.is_liked;
    console.log('Like action:', { isLiked, currentCount: post.likes_count });
    
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('simulation_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('simulation_likes')
          .insert({ post_id: postId, user_id: user.id });
        
        if (error) throw error;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchPost();
      
    } catch (error: any) {
      console.error('Like error:', error);
      alert('Failed to update like: ' + error.message);
    }
  };

  const handleSave = async () => {
    if (!user || !post) return;

    if (!subLoading && !subscription?.is_active) {
      setShowSubscriptionModal(true);
      return;
    }

    const isSaved = post.is_saved;
    setPost(prev => prev ? { ...prev, is_saved: !isSaved } : null);

    try {
      if (isSaved) {
        await supabase.from('simulation_saves').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('simulation_saves').insert({ post_id: postId, user_id: user.id });
      }
    } catch (error) {
      console.error('Save error:', error);
      setPost(prev => prev ? { ...prev, is_saved: isSaved } : null);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/simulation/${postId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post?.caption} | Garliq Lab`,
          url: shareUrl
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied!');
    }
  };

  if (loading || subLoading) {
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

  if (!post) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Simulation not found</h2>
          <Link href="/feed">
            <button className="bg-purple-600 px-6 py-3 rounded-full">Back to Feed</button>
          </Link>
        </div>
      </div>
    );
  }

  // LOGGED-OUT VIEW - Glassmorphic Teaser
  if (!user) {
    return (
      <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
        {/* Compact Header - Creator Info + Login CTA */}
        <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-b border-gray-800 z-50">
          <div className="px-4 py-2.5 flex items-center justify-between">
            {/* Left: Creator Info */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold overflow-hidden">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.display_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{profile?.display_name?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-sm">{profile?.display_name || 'Anonymous'}</p>
                <p className="text-xs text-gray-400">@{profile?.username || 'unknown'}</p>
              </div>
            </div>

            {/* Right: Login CTA */}
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg"
              >
                <Sparkles size={16} />
                Login to View
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Preview Container with Glassmorphic Overlay */}
        <div className="flex-1 relative overflow-hidden">
          {/* Blurred Preview Background */}
          <div className="absolute inset-0 blur-sm pointer-events-none">
            <SimulationViewer htmlCode={post.html_code} className="w-full h-full" />
          </div>

          {/* Glassmorphic Overlay with CTA */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-40">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-md mx-4"
            >
              {/* Lock Icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-6 flex justify-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                  <Image 
                    src="/logo.png" 
                    alt="Garliq" 
                    width={48} 
                    height={48}
                  />
                </div>
              </motion.div>

              {/* Title */}
              <h2 className="text-3xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Interactive Lab
              </h2>
              
              {/* Description */}
              <p className="text-gray-300 mb-2 text-sm leading-relaxed">
                {post.caption}
              </p>
              
              <p className="text-purple-400 font-semibold mb-6 text-sm">
                🔬 {post.topic_category} • {post.framework_used}
              </p>

              {/* Main CTA Button */}
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-full text-lg font-bold shadow-2xl hover:shadow-purple-500/50 transition-all mb-4 w-full"
                >
                  🔓 Login to Explore Lab
                </motion.button>
              </Link>

              {/* Secondary Info */}
              <p className="text-xs text-gray-400">
                Join thousands exploring with Garliq Virtual Labs
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED-IN VIEW - Check subscription
  if (!subscription?.is_active) {
    return (
      <>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
              <Image 
                src="/logo.png" 
                alt="Garliq" 
                width={100} 
                height={100}
              />
            </div>
            <h2 className="text-2xl font-bold mb-4">Subscription Required</h2>
            <p className="text-gray-400 mb-6">
              Subscribe to access interactive simulations
            </p>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-full font-bold"
            >
              Subscribe Now - $3/month
            </button>
          </div>
        </div>

        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={() => {
            refetchSubscription();
            setShowSubscriptionModal(false);
          }}
        />
      </>
    );
  }

  // LOGGED-IN WITH ACTIVE SUBSCRIPTION - Ultra Compact Header
  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Ultra Compact Header */}
      <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-b border-gray-800 z-40">
        {/* Single Row: Back + Creator + Caption + Actions */}
        <div className="px-3 py-1.5 flex items-center gap-3 text-xs">
          {/* Back Button */}
          <button 
            onClick={() => router.back()} 
            className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Creator */}
          <Link href={`/profiles/${post.user_id}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold overflow-hidden">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.display_name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile?.display_name?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <span className="font-semibold text-white">{profile?.display_name || 'Anonymous'}</span>
          </Link>

          {/* Divider */}
          <div className="w-px h-4 bg-gray-700"></div>

          {/* Caption (truncated) */}
          <p className="text-gray-400 truncate flex-1">
            {post.caption}
          </p>

          {/* Topic Badge */}
          <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5 flex-shrink-0">
            <span className="text-xs text-blue-400 font-bold">{post.topic_category}</span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-gray-700"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleLike}
              disabled={!user}
              className="flex items-center gap-1 hover:scale-105 transition-transform disabled:opacity-50 px-1.5 py-1 rounded hover:bg-gray-800"
            >
              {post.is_liked ? (
                <Image 
                  src="/logo.png" 
                  alt="Liked" 
                  width={14} 
                  height={14}
                />
              ) : (
                <Heart size={14} className="text-gray-400" />
              )}
              <span className="text-xs font-bold">{post.likes_count}</span>
            </button>

            <button
              onClick={handleSave}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <Bookmark 
                size={14} 
                className={post.is_saved ? 'fill-purple-400 text-purple-400' : 'text-gray-400'} 
              />
            </button>

            <button
              onClick={handleShare}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <Share2 size={14} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Full Width Preview */}
      <div className="flex-1 overflow-hidden">
        <SimulationViewer 
          htmlCode={post.html_code}
          className="w-full h-full"
        />
      </div>

      {/* AI Tutor */}
      <SimulationTutor
        context={{
          simulationTitle: post.caption,
          topicCategory: post.topic_category,
          frameworkUsed: post.framework_used
        }}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => {
          refetchSubscription();
          setShowSubscriptionModal(false);
        }}
      />
    </div>
  );
}