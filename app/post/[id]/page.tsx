'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, ArrowLeft, Send, Bookmark, Maximize2, X, Code2, Trash2, Sparkles } from 'lucide-react';
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
}

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: Profile;
}

const COMMENTS_PER_PAGE = 10;

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
    fetchPost();
    fetchComments(0); // Load first page
  }, [postId]);

  useEffect(() => {
    if (window.location.hash === '#comments') {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    
    if (!currentRef || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          console.log('🔄 Loading more comments...');
          loadMoreComments();
        }
      },
      { threshold: 0.5, rootMargin: '50px' }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, page, comments.length]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUser(session.user);
  };

  const fetchPost = async () => {
    try {
      const { data: postData, error } = await supabase
        .from('posts')
        .select('*, current_commit_id')
        .eq('id', postId)
        .single();

      if (error) throw error;

      if (postData) {
        console.log('Fetched post data:', postData);

        // ✅ Load HTML from latest commit if available
        if (postData.current_commit_id) {
          const { data: latestCommit } = await supabase
            .from('commits')
            .select('html_code')
            .eq('id', postData.current_commit_id)
            .single();
          
          if (latestCommit) {
            postData.html_code = latestCommit.html_code;
            console.log('✅ Loaded latest commit code');
          }
        }

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
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (pageNum: number, append: boolean = false) => {
    if (loadingMore) return;
    
    if (append) setLoadingMore(true);

    const from = pageNum * COMMENTS_PER_PAGE;
    const to = from + COMMENTS_PER_PAGE - 1;

    const { data: commentsData, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching comments:', error);
      setLoadingMore(false);
      return;
    }

    if (commentsData) {
      // Check if we have more comments
      if (commentsData.length < COMMENTS_PER_PAGE) {
        setHasMore(false);
      }

      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id)
      }));

      if (append) {
        setComments(prev => [...prev, ...commentsWithProfiles]);
      } else {
        setComments(commentsWithProfiles);
      }
    }

    setLoadingMore(false);
  };

  const loadMoreComments = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    const nextPage = page + 1;
    console.log(`📄 Loading page ${nextPage}`);
    setPage(nextPage);
    fetchComments(nextPage, true);
  }, [page, postId, loadingMore, hasMore]);

  const handleLike = async () => {
    if (!user || !post) return;

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

  const handleDeletePost = async () => {
    if (!user || !post) return;
    
    if (user.id !== post.user_id) {
      alert('You can only delete your own posts');
      return;
    }
    
    if (!confirm('⚠️ Delete this post? Your project will remain saved.')) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}?userId=${user.id}`, {
        method: 'DELETE'
      });
      
      const { success, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to delete');
      }
      
      alert('✅ Post deleted');
      router.push('/feed');
    } catch (error: any) {
      console.error('Delete post error:', error);
      alert('❌ ' + error.message);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || submittingComment) return;

    setSubmittingComment(true);
    console.log('Submitting comment...');

    try {
      const { error: insertError } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      const { error: rpcError } = await supabase.rpc('increment_comments', { post_id: postId });
      if (rpcError) {
        console.error('RPC increment comments error:', rpcError);
        throw rpcError;
      }

      setNewComment('');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reset pagination and reload comments
      setPage(0);
      setHasMore(true);
      await Promise.all([
        fetchPost(),
        fetchComments(0, false)
      ]);

      // Scroll to top of comments to show new comment
      const commentsSection = document.getElementById('comments');
      if (commentsSection) {
        commentsSection.scrollTop = 0;
      }

      console.log('Comment submitted, post refetched');
      
    } catch (error: any) {
      console.error('Comment error:', error);
      alert('Failed to post comment: ' + error.message);
    } finally {
      setSubmittingComment(false);
    }
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

  // ✅ LOGGED-OUT VIEW
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-gray-800 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <span className="text-3xl">🧄</span>
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Garliq
              </h1>
            </Link>

            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full font-bold flex items-center gap-2"
              >
                <Sparkles size={18} />
                Create Your Garliq Now
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
            {/* Left: Preview (70%) */}
            <div className="lg:w-[70%] h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-900 relative">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setFullscreen(true)}
                  className="p-2 bg-black/80 hover:bg-black rounded-full backdrop-blur-sm transition-colors"
                >
                  <Maximize2 size={20} className="text-gray-400" />
                </button>
              </div>

              <iframe
                srcDoc={post.html_code}
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
                allow="autoplay"
                title="post-preview"
              />
            </div>

            {/* Right: Info & CTA (30%) */}
            <div className="lg:w-[30%] flex flex-col bg-black">
              {/* Post Info */}
              <div className="p-4 sm:p-6 border-b border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {profile?.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-bold">{profile?.display_name || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">@{profile?.username || 'unknown'}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-4 leading-relaxed">{post.caption}</p>

                {post.prompt_visible && post.prompt && (
                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Code2 size={12} className="text-purple-400" />
                      <span className="text-xs font-bold text-purple-400 uppercase">Prompt</span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono leading-relaxed">{post.prompt}</p>
                  </div>
                )}

                {/* Engagement Stats (Read-only) */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-800">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Heart size={24} />
                    <span className="text-sm font-bold">{post.likes_count}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-500">
                    <MessageCircle size={24} />
                    <span className="text-sm font-bold">{post.comments_count}</span>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-6">
                  <div className="text-6xl mb-4">🧄</div>
                  <h3 className="text-2xl font-bold mb-2">Love this micro-app?</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Create your own in just 30 seconds with AI-powered Garliq
                  </p>
                </div>

                <Link href="/" className="w-full max-w-sm">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Sparkles size={20} />
                    Create Your Garliq Now
                  </motion.button>
                </Link>

                <p className="text-xs text-gray-600 mt-4">
                  Free forever • No credit card required • 30-second setup
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen Modal */}
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
          >
            <div className="p-4 flex justify-between items-center border-b border-gray-800">
              <span className="font-mono text-sm text-gray-400">Fullscreen Preview</span>
              <button onClick={() => setFullscreen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <iframe
              srcDoc={post.html_code}
              className="flex-1 w-full bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms"
              allow="autoplay; fullscreen"
            />
          </motion.div>
        )}
      </div>
    );
  }

  // ✅ LOGGED-IN VIEW WITH INFINITE SCROLLING
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-gray-800 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-3 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={24} />
            <span className="text-3xl">🧄</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <Bookmark 
                size={20} 
                className={post.is_saved ? 'fill-purple-400 text-purple-400' : 'text-gray-400'} 
              />
            </button>
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <Share2 size={20} className="text-gray-400" />
            </button>
            {user?.id === post.user_id && (
              <button
                onClick={handleDeletePost}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <Trash2 size={20} className="text-gray-400 hover:text-red-400 transition-colors" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
          {/* Left: Preview (70%) */}
          <div className="lg:w-[70%] h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-900 relative">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setFullscreen(true)}
                className="p-2 bg-black/80 hover:bg-black rounded-full backdrop-blur-sm transition-colors"
              >
                <Maximize2 size={20} className="text-gray-400" />
              </button>
            </div>

            <iframe
              srcDoc={post.html_code}
              className="w-full h-full bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms"
              allow="autoplay"
              title="post-preview"
            />
          </div>

          {/* Right: Comments & Actions (30%) */}
          <div className="lg:w-[30%] flex flex-col bg-black">
            {/* Post Info */}
            <div className="p-4 sm:p-6 border-b border-gray-800">
              <Link href={`/profiles/${post.user_id}`} className="flex items-center gap-3 mb-4 hover:opacity-70 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {profile?.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-bold">{profile?.display_name || 'Anonymous'}</p>
                  <p className="text-sm text-gray-500">@{profile?.username || 'unknown'}</p>
                </div>
              </Link>

              <p className="text-sm text-gray-300 mb-4 leading-relaxed">{post.caption}</p>

              {post.prompt_visible && post.prompt && (
                <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Code2 size={12} className="text-purple-400" />
                    <span className="text-xs font-bold text-purple-400 uppercase">Prompt</span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">{post.prompt}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  disabled={!user}
                  className="flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {post.is_liked ? (
                    <span className="text-2xl">🧄</span>
                  ) : (
                    <Heart size={24} className="text-gray-500" />
                  )}
                  <span className="text-sm font-bold">{post.likes_count}</span>
                </button>

                <div className="flex items-center gap-2 text-gray-500">
                  <MessageCircle size={24} />
                  <span className="text-sm font-bold">{post.comments_count}</span>
                </div>
              </div>
            </div>

            {/* Comments Section with Infinite Scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4" id="comments">
              {comments.length === 0 && !loadingMore ? (
                <div className="text-center py-12">
                  <MessageCircle size={48} className="mx-auto mb-3 text-gray-700" />
                  <p className="text-gray-500 text-sm">No comments yet</p>
                  <p className="text-gray-600 text-xs mt-1">Be the first to comment!</p>
                </div>
              ) : (
                <>
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Link href={`/profiles/${comment.user_id}`} className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                          {comment.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                        </div>
                      </Link>
                      <div className="flex-1">
                        <Link href={`/profiles/${comment.user_id}`} className="hover:underline">
                          <p className="text-sm font-semibold">{comment.profiles?.display_name || 'Anonymous'}</p>
                        </Link>
                        <p className="text-sm text-gray-300 mt-1 leading-relaxed">{comment.content}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(comment.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Infinite Scroll Trigger */}
                  {hasMore && (
                    <div ref={loadMoreRef} className="py-4 text-center">
                      {loadingMore ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="inline-block text-2xl"
                        >
                          🧄
                        </motion.div>
                      ) : (
                        <p className="text-xs text-gray-600">Scroll for more comments...</p>
                      )}
                    </div>
                  )}

                  {!hasMore && comments.length > 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-600">No more comments</p>
                    </div>
                  )}
                </>
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 bg-gray-900 rounded-full border border-gray-800 focus:border-purple-500 focus:outline-none text-sm"
                  disabled={submittingComment}
                  maxLength={120}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full disabled:opacity-30 transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black z-50 flex flex-col"
        >
          <div className="p-4 flex justify-between items-center border-b border-gray-800">
            <span className="font-mono text-sm text-gray-400">Fullscreen Preview</span>
            <button onClick={() => setFullscreen(false)} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <iframe
            srcDoc={post.html_code}
            className="flex-1 w-full bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
            allow="autoplay; fullscreen"
          />
        </motion.div>
      )}
    </div>
  );
}