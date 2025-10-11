'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, MessageCircle, Share2, LogOut, User, Play, Loader2, TrendingUp, Clock, Users, Search, Code2 } from 'lucide-react';
import Link from 'next/link';

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
  is_liked?: boolean;
  is_saved?: boolean;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

type FeedFilter = 'trending' | 'new' | 'following';

const POSTS_PER_PAGE = 12;

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    // Reset everything when filter changes
    setPosts([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
    fetchPosts(0, activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, loading, page]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
    } else {
      setUser(session.user);
      fetchPosts(0, activeFilter);
    }
  };

const fetchPosts = async (pageNum: number, filter: FeedFilter) => {
  if (!user && pageNum === 0) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUser(session.user);
  }

  const from = pageNum * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' });

  if (filter === 'new') {
    query = query.order('created_at', { ascending: false });
  } else if (filter === 'trending') {
    query = query.order('likes_count', { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Fetch posts error:', error);
    setLoading(false);
    setLoadingMore(false);
    return;
  }

  if (data) {
    // Fetch profiles separately
    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    // Attach profiles to posts
    const postsWithProfiles = data.map(post => ({
      ...post,
      profiles: profilesMap.get(post.user_id)
    }));

    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const postsWithInteractions = await Promise.all(
        postsWithProfiles.map(async (post) => {
          const [likeData, saveData] = await Promise.all([
            supabase.from('likes').select('*').eq('post_id', post.id).eq('user_id', session.user.id).maybeSingle(),
            supabase.from('saves').select('*').eq('post_id', post.id).eq('user_id', session.user.id).maybeSingle()
          ]);

          return { 
            ...post, 
            is_liked: !!likeData.data,
            is_saved: !!saveData.data 
          };
        })
      );

      if (pageNum === 0) {
        setPosts(postsWithInteractions);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = postsWithInteractions.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      }
    } else {
      if (pageNum === 0) {
        setPosts(postsWithProfiles);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = postsWithProfiles.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      }
    }

    setHasMore(data.length === POSTS_PER_PAGE && (count || 0) > to + 1);
  }
  
  setLoading(false);
  setLoadingMore(false);
};

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, activeFilter);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    // Optimistic update
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId ? {
        ...post,
        is_liked: !isLiked,
        likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
      } : post
    ));

    // Actual update
    try {
      if (isLiked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
        await supabase.rpc('decrement_likes', { post_id: postId });
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
        await supabase.rpc('increment_likes', { post_id: postId });
      }
    } catch (error) {
      console.error('Like error:', error);
      // Revert on error
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId ? {
          ...post,
          is_liked: isLiked,
          likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1
        } : post
      ));
    }
  };

  const handleShare = async (post: Post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.caption} | Garliq`,
          url: shareUrl
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied!');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading && page === 0) {
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.span 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="text-4xl"
              >
                🧄
              </motion.span>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Garliq
              </h1>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/create">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2 rounded-full font-bold flex items-center gap-2"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Create</span>
                </motion.button>
              </Link>

              <Link href={`/profiles/${user?.id}`}>
                <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                  <User size={20} className="text-gray-400" />
                </button>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <LogOut size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-900 rounded-full p-1">
              {[
                { id: 'trending', icon: TrendingUp, label: 'Trending' },
                { id: 'new', icon: Clock, label: 'New' },
                { id: 'following', icon: Users, label: 'Following' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as FeedFilter)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-medium transition-all ${
                    activeFilter === filter.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <filter.icon size={16} />
                  <span className="hidden sm:inline text-sm">{filter.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 max-w-md relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900 rounded-full border border-gray-800 focus:border-purple-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {posts.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <div className="text-7xl mb-6">🧄</div>
            <h2 className="text-3xl font-bold mb-3">No Posts Yet</h2>
            <p className="text-gray-500 mb-8 text-lg">Be the first to create something legendary</p>
            <Link href="/create">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-full font-bold">
                Start Creating
              </button>
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post, index) => (
                <motion.div
                  key={`${post.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                  className="group relative bg-black border border-gray-800/50 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all"
                >
                  {/* User Info Header */}
                  <div className="p-3 border-b border-gray-800/50">
                    <Link href={`/profiles/${post.user_id}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                        {post.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{post.profiles?.display_name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500 truncate">@{post.profiles?.username || 'unknown'}</p>
                      </div>
                    </Link>
                  </div>

                  {/* Preview */}
                  <div 
                    className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                  >
                    <iframe
                      srcDoc={`<!DOCTYPE html><html><head><style>*{margin:0;padding:0}body{overflow:hidden;pointer-events:none}</style></head><body>${post.html_code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')}</body></html>`}
                      className="w-full h-full pointer-events-none"
                      sandbox=""
                      loading="lazy"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-purple-600/90 flex items-center justify-center">
                        <Play size={24} className="ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Post Info */}
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-gray-300 line-clamp-2">{post.caption}</p>

                    {post.prompt_visible && post.prompt && (
                      <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Code2 size={10} className="text-purple-400" />
                          <span className="text-[9px] font-bold text-purple-400 uppercase">Prompt</span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-2 font-mono">{post.prompt}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLike(post.id, post.is_liked || false)}
                          className="flex items-center gap-1 hover:text-purple-400 transition"
                        >
                          {post.is_liked ? <span className="text-base">🧄</span> : <Heart size={16} className="text-gray-500" />}
                          <span className="text-xs font-semibold text-gray-400">{post.likes_count}</span>
                        </button>

                        <button className="flex items-center gap-1 text-gray-500 hover:text-pink-400">
                          <MessageCircle size={16} />
                          <span className="text-xs font-semibold">{post.comments_count || 0}</span>
                        </button>
                      </div>

                      <button onClick={() => handleShare(post)} className="text-gray-500 hover:text-blue-400">
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="py-8 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-sm">Loading more...</span>
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <p className="text-gray-500 text-sm">You've reached the end!</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-6xl h-[90vh] bg-gray-900 rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="font-bold">{selectedPost.caption}</h3>
                  <button onClick={() => setSelectedPost(null)} className="text-2xl hover:text-white text-gray-400">✕</button>
                </div>
                <iframe
                  srcDoc={selectedPost.html_code}
                  className="flex-1 w-full bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  allow="autoplay"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}