'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Heart, MessageCircle, Share2, LogOut, User, TrendingUp, Clock, Users, Search, Code2, Bookmark, Trash2 } from 'lucide-react';
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
  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
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
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const postsWithProfiles = data.map(post => ({
        ...post,
        likes_count: post.likes_count ?? 0,
        comments_count: post.comments_count ?? 0,
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

    console.log('Feed like action:', { postId, isLiked });

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;

        const { error: rpcError } = await supabase.rpc('decrement_likes', { post_id: postId });
        if (rpcError) throw rpcError;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
        
        if (error) throw error;

        const { error: rpcError } = await supabase.rpc('increment_likes', { post_id: postId });
        if (rpcError) throw rpcError;
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: updatedPost, error: fetchError } = await supabase
        .from('posts')
        .select('likes_count, comments_count')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      console.log('Updated post data:', updatedPost);

      if (updatedPost) {
        const { data: likeCheck } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        setPosts(prevPosts => prevPosts.map(post => 
          post.id === postId ? {
            ...post,
            is_liked: !!likeCheck,
            likes_count: updatedPost.likes_count || 0,
            comments_count: updatedPost.comments_count || 0
          } : post
        ));
      }
    } catch (error: any) {
      console.error('Like error:', error);
      alert('Failed to update like: ' + error.message);
    }
  };

  const handleSave = async (postId: string, isSaved: boolean) => {
    if (!user) return;

    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId ? { ...post, is_saved: !isSaved } : post
    ));

    try {
      if (isSaved) {
        await supabase.from('saves').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('saves').insert({ post_id: postId, user_id: user.id });
      }
    } catch (error) {
      console.error('Save error:', error);
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId ? { ...post, is_saved: isSaved } : post
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

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    
    if (!confirm('⚠️ Delete this post? Your project will remain saved.')) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}?userId=${user.id}`, {
        method: 'DELETE'
      });
      
      const { success, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to delete');
      }
      
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      alert('✅ Post deleted');
    } catch (error: any) {
      console.error('Delete post error:', error);
      alert('❌ ' + error.message);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.span 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-4xl"
              >
                🧄
              </motion.span>
              <h1 className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Garliq
              </h1>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/create">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-5 py-2 rounded-full font-bold flex items-center gap-2 text-sm sm:text-base"
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-900 rounded-full p-1">
              {[
                { id: 'trending', icon: TrendingUp, label: 'Trending' },
                { id: 'new', icon: Clock, label: 'New' },
                { id: 'following', icon: Users, label: 'Following' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as FeedFilter)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full font-medium transition-all text-xs sm:text-sm ${
                    activeFilter === filter.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <filter.icon size={16} />
                  <span className="hidden sm:inline">{filter.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 max-w-full sm:max-w-md relative">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {posts.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 sm:py-32"
          >
            <div className="text-5xl sm:text-7xl mb-6">🧄</div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">No Posts Yet</h2>
            <p className="text-gray-500 mb-8 text-base sm:text-lg">Be the first to create something legendary</p>
            <Link href="/create">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 sm:px-8 py-3 rounded-full font-bold">
                Start Creating
              </button>
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {posts.map((post, index) => (
                <motion.div
                  key={`${post.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                  className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/10"
                >
                  {/* User Info Header */}
                  <div className="p-3 sm:p-4 border-b border-gray-800/50 bg-black/40 backdrop-blur-sm">
                    <Link href={`/profiles/${post.user_id}`} className="flex items-center gap-2 sm:gap-3 hover:opacity-70 transition-opacity">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm sm:text-base font-bold flex-shrink-0">
                        {post.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold truncate">{post.profiles?.display_name || 'Anonymous'}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">@{post.profiles?.username || 'unknown'}</p>
                      </div>
                    </Link>
                  </div>

                  {/* Preview */}
                  <Link href={`/post/${post.id}`}>
                    <div className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer group-hover:ring-2 group-hover:ring-purple-500/30 transition-all">
                      <iframe
                        srcDoc={`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{overflow:hidden;pointer-events:none;transform:scale(0.8);transform-origin:top left;width:125%;height:125%}</style></head><body>${post.html_code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')}</body></html>`}
                        className="w-full h-full pointer-events-none"
                        sandbox=""
                        loading="lazy"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  </Link>

                  {/* Post Info */}
                  <div className="p-3 sm:p-4 space-y-3">
                    <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed">{post.caption}</p>

                    {post.prompt_visible && post.prompt && (
                      <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Code2 size={10} className="text-purple-400" />
                          <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wide">Prompt</span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 line-clamp-2 font-mono leading-relaxed">{post.prompt}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <button
                          onClick={() => handleLike(post.id, post.is_liked || false)}
                          className="flex items-center gap-1.5 hover:scale-110 transition-transform"
                        >
                          {post.is_liked ? (
                            <span className="text-lg sm:text-xl">🧄</span>
                          ) : (
                            <Heart size={18} className="text-gray-500 hover:text-purple-400 transition-colors" />
                          )}
                          <span className="text-xs sm:text-sm font-bold text-gray-400">{post.likes_count || 0}</span>
                        </button>

                        <Link href={`/post/${post.id}#comments`}>
                          <button className="flex items-center gap-1.5 text-gray-500 hover:text-pink-400 transition-colors">
                            <MessageCircle size={18} />
                            <span className="text-xs sm:text-sm font-bold">{post.comments_count || 0}</span>
                          </button>
                        </Link>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSave(post.id, post.is_saved || false)}
                          className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                        >
                          <Bookmark 
                            size={18} 
                            className={post.is_saved ? 'fill-purple-400 text-purple-400' : 'text-gray-500'} 
                          />
                        </button>

                        <button 
                          onClick={() => handleShare(post)} 
                          className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                        >
                          <Share2 size={18} className="text-gray-500 hover:text-blue-400 transition-colors" />
                        </button>

                        {user?.id === post.user_id && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                          >
                            <Trash2 size={18} className="text-gray-500 hover:text-red-400 transition-colors" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="py-8 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-gray-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="text-2xl"
                  >
                    🧄
                  </motion.div>
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
    </div>
  );
}