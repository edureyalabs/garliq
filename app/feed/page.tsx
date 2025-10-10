'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, Share2, LogOut, Code, ExternalLink, Download, Copy, Check, FolderOpen, User, MessageCircle, Send, Trash2 } from 'lucide-react';
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

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [copied, setCopied] = useState(false);
  const [commentingPost, setCommentingPost] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    checkUser();
    fetchPosts();
  }, []);

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
    
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && session) {
      const postsWithLikes = await Promise.all(
        data.map(async (post) => {
          const { data: likeData } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', post.id)
            .eq('user_id', session.user.id)
            .single();

          return { ...post, is_liked: !!likeData };
        })
      );
      setPosts(postsWithLikes);
    }
    setLoading(false);
  };

const fetchComments = async (postId: string) => {
  setLoadingComments(true);
  
  // First get comments
  const { data: commentsData, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (commentsData) {
    // Then get profiles for each comment
    const commentsWithProfiles = await Promise.all(
      commentsData.map(async (comment) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('id', comment.user_id)
          .single();

        return {
          ...comment,
          profiles: profile
        };
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

  // Update local state immediately for better UX
  setPosts(prevPosts => prevPosts.map(post => {
    if (post.id === postId) {
      return {
        ...post,
        is_liked: !isLiked,
        likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
      };
    }
    return post;
  }));
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
    
    // Update local posts state to show new count
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments_count: (post.comments_count || 0) + 1
        };
      }
      return post;
    }));
    
    // Fetch comments again to show the new one
    await fetchComments(postId);
  }
};

const handleDeleteComment = async (commentId: string, postId: string) => {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  
  if (!error) {
    await supabase.rpc('decrement_comments', { post_id: postId });
    
    // Update local posts state
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments_count: Math.max((post.comments_count || 0) - 1, 0)
        };
      }
      return post;
    }));
    
    // Update comments list
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
    // Fallback: copy link
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  }
};

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (post: Post) => {
    const blob = new Blob([post.html_code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garliq-${post.id.slice(0, 8)}.html`;
    a.click();
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
      <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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

          <div className="flex items-center gap-4">
            <Link href="/projects">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-full font-bold flex items-center gap-2 transition-colors"
              >
                <FolderOpen size={20} />
                Projects
              </motion.button>
            </Link>

            <Link href="/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2"
              >
                <Plus size={20} />
                Create
              </motion.button>
            </Link>

            <Link href={`/profile/${user?.id}`}>
              <button className="p-2.5 hover:bg-gray-800 rounded-full transition-colors">
                <User size={20} className="text-gray-400" />
              </button>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2.5 hover:bg-gray-800 rounded-full transition-colors"
            >
              <LogOut size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <div className="text-7xl mb-6">🧄</div>
            <h2 className="text-3xl font-bold mb-3">No Vibes Yet</h2>
            <p className="text-gray-500 mb-8 text-lg">Be the first to create something legendary</p>
            <Link href="/create">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-full font-bold">
                Start Vibe Coding
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all"
              >
                {/* Post Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Link href={`/profile/${post.user_id}`}>
                      <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                          {user?.email?.[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{user?.email?.split('@')[0]}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(post.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Link>
                    <button 
                      onClick={() => setSelectedPost(post)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <ExternalLink size={18} className="text-gray-400" />
                    </button>
                  </div>

                  <p className="text-lg mb-4">{post.caption}</p>

                  {post.prompt_visible && post.prompt && (
                    <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Code size={16} className="text-purple-400" />
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Prompt</span>
                      </div>
                      <p className="text-sm text-gray-300 font-mono">{post.prompt}</p>
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="relative border-t border-b border-gray-800 bg-white">
                  <iframe
                    srcDoc={post.html_code}
                    className="w-full h-96"
                    sandbox="allow-scripts"
                    title={`post-${post.id}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>

                {/* Actions */}
<div className="p-6">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-6">
      <button
        onClick={() => handleLike(post.id, post.is_liked || false)}
        className="flex items-center gap-2 group/like"
      >
        <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
          {post.is_liked ? (
            <span className="text-2xl">🧄</span>
          ) : (
            <Heart className="text-gray-400 group-hover/like:text-purple-400 transition-colors" size={24} />
          )}
        </motion.div>
        <div className="flex flex-col items-start">
          <span className="font-bold text-gray-300">{post.likes_count}</span>
          <span className="text-xs text-gray-600">Garliqs</span>
        </div>
      </button>

      <button 
        onClick={() => toggleComments(post.id)}
        className="flex items-center gap-2 group/comment"
      >
        <MessageCircle className={`transition-colors ${commentingPost === post.id ? 'text-purple-400' : 'text-gray-400 group-hover/comment:text-purple-400'}`} size={24} />
        <div className="flex flex-col items-start">
          <span className="font-bold text-gray-300">{post.comments_count || 0}</span>
          <span className="text-xs text-gray-600">Comments</span>
        </div>
      </button>

      <button 
        onClick={() => handleShare(post)}
        className="flex items-center gap-2 group/share"
      >
        <Share2 className="text-gray-400 group-hover/share:text-purple-400 transition-colors" size={22} />
        <span className="text-xs text-gray-600">Share</span>
      </button>

      <button 
        onClick={() => handleDownload(post)}
        className="flex items-center gap-2 group/download"
      >
        <Download className="text-gray-400 group-hover/download:text-purple-400 transition-colors" size={22} />
        <span className="text-xs text-gray-600">Download</span>
      </button>
    </div>

    <button
      onClick={() => handleCopyCode(post.html_code)}
      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
    >
      {copied ? <Check size={18} /> : <Copy size={18} />}
      <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy Code'}</span>
    </button>
  </div>

  {/* Comments Section */}
  {/* ... rest of comments code stays the same ... */}

                  {/* Comments Section */}
                  <AnimatePresence>
                    {commentingPost === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-800 pt-4"
                      >
                        {/* Comment Input */}
                        <div className="flex gap-3 mb-4">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleComment(post.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            disabled={!commentText.trim()}
                            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send size={18} />
                          </button>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {loadingComments ? (
                            <div className="text-center py-4 text-gray-500 text-sm">Loading comments...</div>
                          ) : comments[post.id]?.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 text-sm">No comments yet</div>
                          ) : (
                            comments[post.id]?.map((comment) => (
                              <div key={comment.id} className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                  {comment.profiles?.display_name?.[0].toUpperCase()}
                                </div>
                                <div className="flex-1 bg-gray-800/50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-sm">{comment.profiles?.display_name}</span>
                                    {comment.user_id === user?.id && (
                                      <button
                                        onClick={() => handleDeleteComment(comment.id, post.id)}
                                        className="text-gray-500 hover:text-red-400 transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-300">{comment.content}</p>
                                  <span className="text-xs text-gray-600 mt-1 block">
                                    {new Date(comment.created_at).toLocaleString()}
                                  </span>
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

      {/* Full Screen Modal */}
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
                  <h3 className="font-bold">Full Preview</h3>
                  <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-white">
                    ✕
                  </button>
                </div>
                <iframe
                  srcDoc={selectedPost.html_code}
                  className="flex-1 w-full bg-white"
                  sandbox="allow-scripts"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}