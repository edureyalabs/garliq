'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Share2, ArrowLeft, Bookmark, Sparkles, Code2, ChevronLeft, ChevronRight, FileText, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionModal from '@/components/SubscriptionModal';
import AITutor from '@/components/AITutor';
import { TutorContext } from '@/lib/tutor-context';

interface Post {
  id: string;
  caption: string;
  prompt: string | null;
  prompt_visible: boolean;
  html_code: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  session_id: string | null;
  is_liked?: boolean;
  is_saved?: boolean;
}

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface CoursePage {
  id: string;
  page_number: number;
  page_type: 'intro' | 'toc' | 'chapter' | 'conclusion';
  page_title: string;
  html_content: string;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  error_message: string | null;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pages, setPages] = useState<CoursePage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingPages, setLoadingPages] = useState(false);
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
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;

      if (postData) {
        console.log('Fetched post data:', postData);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', postData.user_id)
          .single();

        if (profileData) setProfile(profileData);

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const [likeData, saveData] = await Promise.all([
            supabase.from('likes').select('*').eq('post_id', postId).eq('user_id', session.user.id).maybeSingle(),
            supabase.from('saves').select('*').eq('post_id', postId).eq('user_id', session.user.id).maybeSingle()
          ]);

          setPost({
            ...postData,
            likes_count: postData.likes_count || 0,
            comments_count: postData.comments_count || 0,
            is_liked: !!likeData.data,
            is_saved: !!saveData.data
          });
        } else {
          setPost({
            ...postData,
            likes_count: postData.likes_count || 0,
            comments_count: postData.comments_count || 0
          });
        }

        if (postData.session_id) {
          await fetchPages(postData.session_id);
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async (sessionId: string) => {
    try {
      setLoadingPages(true);
      console.log('📨 Loading course pages for session:', sessionId);
      
      const { data, error } = await supabase
        .from('course_pages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('generation_status', 'completed')
        .order('page_number', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setPages(data);
        console.log(`✅ Loaded ${data.length} pages`);
      } else {
        console.log('⚠️ No pages found, will use legacy html_code');
      }
    } catch (error) {
      console.error('Load pages error:', error);
    } finally {
      setLoadingPages(false);
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
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;

        const { error: rpcError } = await supabase.rpc('decrement_likes', { post_id: postId });
        if (rpcError) {
          console.error('RPC decrement error:', rpcError);
          throw rpcError;
        }
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
        
        if (error) throw error;

        const { error: rpcError } = await supabase.rpc('increment_likes', { post_id: postId });
        if (rpcError) {
          console.error('RPC increment error:', rpcError);
          throw rpcError;
        }
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
        await supabase.from('saves').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('saves').insert({ post_id: postId, user_id: user.id });
      }
    } catch (error) {
      console.error('Save error:', error);
      setPost(prev => prev ? { ...prev, is_saved: isSaved } : null);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post?.caption} | Garliq`,
          url: shareUrl
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied!');
    }
  };

  const getPageIcon = (page: CoursePage) => {
    if (page.page_type === 'intro') return '📖';
    if (page.page_type === 'toc') return '📋';
    if (page.page_type === 'conclusion') return '✅';
    return page.page_number - 1;
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
          <h2 className="text-2xl font-bold mb-4">Post not found</h2>
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
                Login to View Course
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Preview Container with Glassmorphic Overlay */}
        <div className="flex-1 relative overflow-hidden">
          {/* Blurred Preview Background */}
          <div className="absolute inset-0 flex">
            {/* Left: Pages Sidebar (if multi-page) - Blurred */}
            {pages.length > 0 && (
              <div className="hidden lg:block w-48 border-r border-gray-800 bg-gray-900/50 overflow-y-auto blur-sm pointer-events-none">
                <div className="p-2 border-b border-gray-800">
                  <h3 className="text-xs font-bold flex items-center gap-1.5">
                    <FileText size={12} className="text-purple-400" />
                    Pages ({pages.length})
                  </h3>
                </div>
                <div className="p-1.5 space-y-0.5">
                  {pages.map((page, idx) => (
                    <div
                      key={page.id}
                      className="w-full text-left p-2 rounded bg-gray-800 text-gray-300 text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{getPageIcon(page)}</span>
                        <span className="font-semibold flex-1 truncate">
                          {page.page_title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Content - Blurred */}
            <div className="flex-1 flex flex-col">
              {pages.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 border-b border-gray-800 flex items-center justify-between flex-shrink-0 bg-black blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-gray-800 rounded">
                        <ChevronLeft size={14} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye size={12} className="text-purple-400" />
                        <span className="text-xs text-gray-400">
                          {pages[currentPageIndex]?.page_title || 'Page Title'}
                        </span>
                      </div>
                      <div className="p-1 bg-gray-800 rounded">
                        <ChevronRight size={14} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      1/{pages.length}
                    </span>
                  </div>
                  <div className="flex-1 bg-white blur-sm">
                    {pages[currentPageIndex] && (
                      <iframe
                        srcDoc={pages[currentPageIndex].html_content}
                        className="w-full h-full pointer-events-none"
                        sandbox="allow-scripts allow-same-origin"
                        title="course-page-preview"
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 bg-white blur-sm">
                  <iframe
                    srcDoc={post.html_code}
                    className="w-full h-full pointer-events-none"
                    sandbox="allow-scripts allow-same-origin"
                    title="legacy-preview"
                  />
                </div>
              )}
            </div>
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
                Premium Content
              </h2>
              
              {/* Description */}
              <p className="text-gray-300 mb-2 text-sm leading-relaxed">
                {post.caption}
              </p>
              
              {pages.length > 0 && (
                <p className="text-purple-400 font-semibold mb-6 text-sm">
                  🎓 {pages.length} Course Pages Available
                </p>
              )}

              {/* Main CTA Button */}
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-full text-lg font-bold shadow-2xl hover:shadow-purple-500/50 transition-all mb-4 w-full"
                >
                  🔓 Login to Access Full Course
                </motion.button>
              </Link>

              {/* Secondary Info */}
              <p className="text-xs text-gray-400">
                Join thousands learning with Garliq
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
              Subscribe to view posts and interact with the community
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

  // ==================== BUILD AI TUTOR CONTEXT ====================
  const tutorContext: TutorContext = {
    courseTitle: post.caption || 'Untitled Course',
    currentPageTitle: pages[currentPageIndex]?.page_title || 'Overview',
    currentPageType: pages[currentPageIndex]?.page_type || 'intro',
    chapterNumber: pages[currentPageIndex]?.page_type === 'chapter' 
      ? (pages[currentPageIndex]?.page_number || 0) - 1 
      : undefined,
    totalPages: pages.length || 1
  };

  // LOGGED-IN WITH ACTIVE SUBSCRIPTION - Ultra Compact Header
  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Ultra Compact Header - ~2% */}
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

          {/* Prompt Badge */}
          {post.prompt_visible && post.prompt && (
            <>
              <div className="w-px h-4 bg-gray-700"></div>
              <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-0.5 flex-shrink-0">
                <Code2 size={10} className="text-purple-400" />
                <span className="text-xs text-purple-400 font-mono truncate max-w-[150px]">{post.prompt}</span>
              </div>
            </>
          )}

          {/* Pages Badge */}
          {pages.length > 0 && (
            <>
              <div className="w-px h-4 bg-gray-700"></div>
              <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5 flex-shrink-0">
                <FileText size={10} className="text-blue-400" />
                <span className="text-xs text-blue-400 font-bold">{pages.length}</span>
              </div>
            </>
          )}

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

      {/* Full Width Preview - ~98% */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Pages Sidebar (if multi-page) */}
        {pages.length > 0 && (
          <div className="hidden lg:block w-48 border-r border-gray-800 bg-gray-900/50 overflow-y-auto">
            <div className="p-2 border-b border-gray-800">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                <FileText size={12} className="text-purple-400" />
                Pages ({pages.length})
              </h3>
            </div>
            <div className="p-1.5 space-y-0.5">
              {pages.map((page, idx) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPageIndex(idx)}
                  className={`w-full text-left p-2 rounded transition-all text-xs ${
                    currentPageIndex === idx
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{getPageIcon(page)}</span>
                    <span className="font-semibold flex-1 truncate">
                      {page.page_title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview Container */}
        <div className="flex-1 flex flex-col">
          {pages.length > 0 ? (
            <>
              {/* Page Navigation Header */}
              <div className="px-3 py-1.5 border-b border-gray-800 flex items-center justify-between flex-shrink-0 bg-black">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentPageIndex === 0}
                    className="p-1 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <Eye size={12} className="text-purple-400" />
                    <span className="text-xs text-gray-400">
                      {pages[currentPageIndex]?.page_title || 'No page'}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1))}
                    disabled={currentPageIndex === pages.length - 1}
                    className="p-1 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
                <span className="text-xs text-gray-500">
                  {currentPageIndex + 1}/{pages.length}
                </span>
              </div>

              {/* Page Content */}
              <div className="flex-1 bg-white overflow-auto">
                {loadingPages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-purple-400" size={32} />
                  </div>
                ) : pages[currentPageIndex] ? (
                  <iframe
                    key={pages[currentPageIndex].id}
                    srcDoc={pages[currentPageIndex].html_content}
                    className="w-full h-full"
                    sandbox="allow-scripts allow-same-origin"
                    title="course-page"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p className="text-sm">No page selected</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 bg-white">
              <iframe
                srcDoc={post.html_code}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin"
                title="legacy-preview"
              />
            </div>
          )}
        </div>
      </div>

      {/* AI Tutor - Available for subscribed users */}
      <AITutor context={tutorContext} />

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