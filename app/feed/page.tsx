'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, MessageCircle, Share2, LogOut, FolderOpen, User, Send, Trash2, Bookmark, GitFork, Play, TrendingUp, Clock, Users, Filter, Search, Code2 } from 'lucide-react';
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
  user_email?: string;
  is_liked?: boolean;
  is_saved?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    display_name: string;
  };
}

type FeedFilter = 'trending' | 'new' | 'following';

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentingPost, setCommentingPost] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('trending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkUser();
    fetchPosts();
  }, [activeFilter]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
    } else {
      setUser(session.user);
    }
  };

  const fetchPosts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    let query = supabase
      .from('posts')
      .select('*');

    if (activeFilter === 'new') {
      query = query.order('created_at', { ascending: false });
    } else if (activeFilter === 'trending') {
      query = query.order('likes_count', { ascending: false });
    }

    const { data } = await query;

    if (data && session) {
      const postsWithInteractions = await Promise.all(
        data.map(async (post) => {
          const [likeData, saveData] = await Promise.all([
            supabase.from('likes').select('*').eq('post_id', post.id).eq('user_id', session.user.id).single(),
            supabase.from('saves').select('*').eq('post_id', post.id).eq('user_id', session.user.id).single()
          ]);

          return { 
            ...post, 
            is_liked: !!likeData.data,
            is_saved: !!saveData.data 
          };
        })
      );
      setPosts(postsWithInteractions);
    }
    setLoading(false);
  };

  const fetchComments = async (postId: string) => {
    setLoadingComments(true);
    
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (commentsData) {
      const commentsWithProfiles = await Promise.all(
        commentsData.map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', comment.user_id)
            .single();

          return { ...comment, profiles: profile };
        })
      );

      setComments(prev => ({ ...prev, [postId]: commentsWithProfiles }));
    }
    
    setLoadingComments(false);
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      await supabase.rpc('decrement_likes', { post_id: postId });
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      await supabase.rpc('increment_likes', { post_id: postId });
    }

    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId ? {
        ...post,
        is_liked: !isLiked,
        likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
      } : post
    ));
  };

  const handleSave = async (postId: string, isSaved: boolean) => {
    if (!user) return;

    if (isSaved) {
      await supabase.from('saves').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('saves').insert({ post_id: postId, user_id: user.id });
    }

    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId ? { ...post, is_saved: !isSaved } : post
    ));
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim() || !user) return;

    const { data, error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      content: commentText
    }).select().single();

    if (!error && data) {
      await supabase.rpc('increment_comments', { post_id: postId });
      setCommentText('');
      
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId ? { ...post, comments_count: (post.comments_count || 0) + 1 } : post
      ));
      
      await fetchComments(postId);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    
    if (!error) {
      await supabase.rpc('decrement_comments', { post_id: postId });
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId ? { ...post, comments_count: Math.max((post.comments_count || 0) - 1, 0) } : post
      ));
      await fetchComments(postId);
    }
  };

  const toggleComments = (postId: string) => {
    if (commentingPost === postId) {
      setCommentingPost(null);
    } else {
      setCommentingPost(postId);
      if (!comments[postId]) {
        fetchComments(postId);
      }
    }
  };

  const handleShare = async (post: Post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.caption} | Garliq`,
          text: `Check out this AI-generated website on Garliq!`,
          url: shareUrl
        });
      } catch {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
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
              <Link href="/projects">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-full font-medium flex items-center gap-2 transition-colors"
                >
                  <FolderOpen size={18} />
                  <span className="hidden sm:inline">Projects</span>
                </motion.button>
              </Link>

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

              <Link href={`/profile/${user?.id}`}>
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

          {/* Filters & Search */}
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
        {posts.length === 0 ? (
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group relative bg-black border border-gray-800/50 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all"
              >
                {/* Static Preview - No Audio/Scripts */}
                <div 
                  className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedPost(post)}
                >
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="UTF-8">
                          <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body { 
                              width: 100vw; 
                              height: 100vh; 
                              overflow: hidden;
                            }
                            /* Block all audio/video */
                            audio, video { display: none !important; }
                          </style>
                        </head>
                        <body>
                          ${post.html_code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '<!-- script removed -->')}
                        </body>
                      </html>
                    `}
                    className="w-full h-full pointer-events-none scale-100"
                    sandbox=""
                    title={`post-preview-${post.id}`}
                    loading="lazy"
                  />
                  
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-purple-600/90 backdrop-blur-sm flex items-center justify-center">
                      <Play size={24} className="ml-1" />
                    </div>
                  </div>
                  
                  {/* Floating expand hint */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-full text-xs font-medium flex items-center gap-1.5">
                      <Play size={12} />
                      Click to Experience
                    </div>
                  </div>
                </div>

                {/* Compact Info Section */}
                <div className="p-4 space-y-3">
                  {/* User & Caption */}
                  <div>
                    <Link href={`/profile/${post.user_id}`}>
                      <div className="flex items-center gap-2.5 mb-2 group/user cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-semibold text-xs">
                          {user?.email?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm group-hover/user:text-purple-400 transition-colors truncate">
                            {user?.email?.split('@')[0]}
                          </div>
                          <div className="text-[10px] text-gray-600 font-medium">
                            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </Link>

                    <p className="text-sm leading-relaxed text-gray-300 line-clamp-2 mb-2">
                      {post.caption}
                    </p>

                    {post.prompt_visible && post.prompt && (
                      <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Code2 size={12} className="text-purple-400" />
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Prompt</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 font-mono">
                          {post.prompt}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLike(post.id, post.is_liked || false)}
                        className="flex items-center gap-1.5 hover:text-purple-400 transition-colors group/like"
                      >
                        {post.is_liked ? (
                          <span className="text-base">🧄</span>
                        ) : (
                          <Heart size={18} className="text-gray-500 group-hover/like:text-purple-400 transition-colors" />
                        )}
                        <span className="text-sm font-semibold text-gray-400 group-hover/like:text-white transition-colors">
                          {post.likes_count}
                        </span>
                      </button>

                      <button 
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 hover:text-pink-400 transition-colors group/comment"
                      >
                        <MessageCircle size={18} className={`${commentingPost === post.id ? 'text-pink-400' : 'text-gray-500 group-hover/comment:text-pink-400'} transition-colors`} />
                        <span className="text-sm font-semibold text-gray-400 group-hover/comment:text-white transition-colors">
                          {post.comments_count || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => handleSave(post.id, post.is_saved || false)}
                        className="hover:text-orange-400 transition-colors group/save"
                      >
                        <Bookmark size={18} className={`${post.is_saved ? 'fill-orange-400 text-orange-400' : 'text-gray-500 group-hover/save:text-orange-400'} transition-colors`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="text-gray-500 hover:text-green-400 transition-colors"
                        title="Fork this project"
                      >
                        <GitFork size={18} />
                      </button>

                      <button 
                        onClick={() => handleShare(post)}
                        className="text-gray-500 hover:text-blue-400 transition-colors"
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {commentingPost === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-800/50 pt-3"
                      >
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleComment(post.id);
                            }}
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            disabled={!commentText.trim()}
                            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send size={16} />
                          </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {loadingComments ? (
                            <div className="text-center py-4 text-gray-500 text-xs">Loading...</div>
                          ) : comments[post.id]?.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 text-xs">No comments yet</div>
                          ) : (
                            comments[post.id]?.map((comment) => (
                              <div key={comment.id} className="flex gap-2 items-start bg-gray-900/30 rounded-lg p-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {comment.profiles?.display_name?.[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-xs truncate">{comment.profiles?.display_name}</span>
                                    {comment.user_id === user?.id && (
                                      <button
                                        onClick={() => handleDeleteComment(comment.id, post.id)}
                                        className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-300 leading-relaxed">{comment.content}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal - Full Interactive Experience */}
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
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/50 backdrop-blur-sm">
                  <div>
                    <h3 className="font-bold">{selectedPost.caption}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Click and interact with the live website</p>
                  </div>
                  <button 
                    onClick={() => setSelectedPost(null)} 
                    className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-full transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <iframe
                  srcDoc={selectedPost.html_code}
                  className="flex-1 w-full bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  title={`post-fullscreen-${selectedPost.id}`}
                  allow="autoplay; fullscreen"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}