'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit, Calendar, Heart, Code2, Bookmark, Share2, ExternalLink, Trash2, Eye, Zap, Sparkles, MessageCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import TokenPurchaseModal from '@/components/TokenPurchaseModal';
import Image from 'next/image';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Post {
  id: string;
  caption: string;
  html_code: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  prompt: string | null;
  prompt_visible: boolean;
  user_id: string;
  is_liked?: boolean;
  is_saved?: boolean;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface Project {
  id: string;
  title: string;
  html_code: string;
  created_at: string;
  session_id: string | null;
  is_draft: boolean;
  is_shared: boolean;
  post_id: string | null;
  prompt: string;
  updated_at: string;
}

type TabType = 'posts' | 'projects' | 'saved';

const ITEMS_PER_PAGE = 12;

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [selectedItem, setSelectedItem] = useState<Post | Project | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProject, setShareProject] = useState<Project | null>(null);
  const [shareCaption, setShareCaption] = useState('');
  const [promptVisible, setPromptVisible] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [stats, setStats] = useState({ 
    posts: 0, 
    totalLikes: 0,
    projects: 0,
    saves: 0
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
    fetchProfile();
    fetchAllStats();
  }, [userId]);

  useEffect(() => {
    setPosts([]);
    setProjects([]);
    setSavedPosts([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
    
    if (activeTab === 'posts') {
      fetchUserPosts(0);
    } else if (activeTab === 'projects') {
      fetchUserProjects(0);
    } else if (activeTab === 'saved') {
      fetchSavedPosts(0);
    }
  }, [activeTab, userId]);

  useEffect(() => {
    if (currentUser?.id === userId) {
      fetchTokenBalance();
    }
  }, [currentUser, userId]);

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
  }, [hasMore, loadingMore, loading, page, activeTab]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUser(session.user);
  };

  const fetchTokenBalance = async () => {
    if (!currentUser?.id) return;
    
    const { data } = await supabase
      .from('user_wallets')
      .select('token_balance')
      .eq('user_id', currentUser.id)
      .single();

    setTokenBalance(data?.token_balance || 0);
  };

  const fetchAllStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Fetch posts count and total likes
    const { count: postsCount, data: postsData } = await supabase
      .from('posts')
      .select('likes_count', { count: 'exact' })
      .eq('user_id', userId);
    
    const totalLikes = postsData?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;
    
    // Fetch projects count
    const { count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Fetch saved count (only if viewing own profile)
    let savesCount = 0;
    if (session && session.user.id === userId) {
      const { count } = await supabase
        .from('saves')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      savesCount = count || 0;
    }
    
    setStats({
      posts: postsCount || 0,
      totalLikes,
      projects: projectsCount || 0,
      saves: savesCount
    });
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) setProfile(data);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(true);
      await fetchUserPosts(0);
    }
  };

  const fetchUserPosts = async (pageNum: number) => {
    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Fetch posts error:', error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (data) {
      // Fetch interactions if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      let postsWithInteractions = data;
      if (session) {
        postsWithInteractions = await Promise.all(
          data.map(async (post) => {
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
      }

      if (pageNum === 0) {
        setPosts(postsWithInteractions);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = postsWithInteractions.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      }

      setHasMore(data.length === ITEMS_PER_PAGE && (count || 0) > to + 1);
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  const fetchUserProjects = async (pageNum: number) => {
    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Fetch projects error:', error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (data) {
      if (pageNum === 0) {
        setProjects(data);
      } else {
        setProjects(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProjects = data.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProjects];
        });
      }

      setHasMore(data.length === ITEMS_PER_PAGE && (count || 0) > to + 1);
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  const fetchSavedPosts = async (pageNum: number) => {
    if (!currentUser) return;

    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: saves, error: savesError, count } = await supabase
      .from('saves')
      .select('post_id', { count: 'exact' })
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (savesError || !saves || saves.length === 0) {
      if (pageNum === 0) {
        setSavedPosts([]);
      }
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const postIds = saves.map(s => s.post_id);
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false });

    if (posts) {
      // Fetch profiles for post creators
      const userIds = [...new Set(posts.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Add interaction data and profiles
      const postsWithInteractions = await Promise.all(
        posts.map(async (post) => {
          const [likeData, saveData] = await Promise.all([
            supabase.from('likes').select('*').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle(),
            supabase.from('saves').select('*').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle()
          ]);

          return { 
            ...post, 
            is_liked: !!likeData.data,
            is_saved: !!saveData.data,
            profiles: profilesMap.get(post.user_id)
          };
        })
      );

      if (pageNum === 0) {
        setSavedPosts(postsWithInteractions);
      } else {
        setSavedPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = postsWithInteractions.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      }

      setHasMore(saves.length === ITEMS_PER_PAGE && (count || 0) > to + 1);
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      
      if (activeTab === 'posts') {
        fetchUserPosts(nextPage);
      } else if (activeTab === 'projects') {
        fetchUserProjects(nextPage);
      } else if (activeTab === 'saved') {
        fetchSavedPosts(nextPage);
      }
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!currentUser) return;

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
        
        if (error) throw error;

        const { error: rpcError } = await supabase.rpc('decrement_likes', { post_id: postId });
        if (rpcError) throw rpcError;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: currentUser.id });
        
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

      if (updatedPost) {
        const { data: likeCheck } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', currentUser.id)
          .maybeSingle();

        const updatePost = (post: Post) => 
          post.id === postId ? {
            ...post,
            is_liked: !!likeCheck,
            likes_count: updatedPost.likes_count || 0,
            comments_count: updatedPost.comments_count || 0
          } : post;

        setPosts(prevPosts => prevPosts.map(updatePost));
        setSavedPosts(prevPosts => prevPosts.map(updatePost));
      }
    } catch (error: any) {
      console.error('Like error:', error);
      alert('Failed to update like: ' + error.message);
    }
  };

  const handleSave = async (postId: string, isSaved: boolean) => {
    if (!currentUser) return;

    const updatePost = (post: Post) => 
      post.id === postId ? { ...post, is_saved: !isSaved } : post;

    setPosts(prevPosts => prevPosts.map(updatePost));
    setSavedPosts(prevPosts => prevPosts.map(updatePost));

    try {
      if (isSaved) {
        await supabase.from('saves').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      } else {
        await supabase.from('saves').insert({ post_id: postId, user_id: currentUser.id });
      }
    } catch (error) {
      console.error('Save error:', error);
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId ? { ...post, is_saved: isSaved } : post
      ));
      setSavedPosts(prevPosts => prevPosts.map(post => 
        post.id === postId ? { ...post, is_saved: isSaved } : post
      ));
    }
  };

  const handleSharePost = async (post: Post) => {
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

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/profiles/${userId}`;
    if (navigator.share) {
      navigator.share({
        title: `${profile?.display_name}'s Garliq Profile`,
        url: profileUrl
      });
    } else {
      navigator.clipboard.writeText(profileUrl);
      alert('Profile link copied!');
    }
  };

  const handleShareProject = async () => {
    if (!shareCaption.trim() || !shareProject || !currentUser || sharing) return;

    setSharing(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: shareProject.id,
          caption: shareCaption,
          promptVisible,
          userId: currentUser.id
        })
      });

      const { success, error } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to publish');
      }

      setShowShareModal(false);
      setShareCaption('');
      setShareProject(null);
      
      setProjects([]);
      setPage(0);
      setHasMore(true);
      await fetchUserProjects(0);
      await fetchAllStats();
      
      alert('✅ Project published to feed!');
    } catch (error: any) {
      console.error('Share failed:', error);
      alert('❌ ' + (error.message || 'Failed to share project'));
    }

    setSharing(false);
  };

  const handleDeleteProject = async (project: Project) => {
    const hasPost = !project.is_draft && project.post_id;
    const message = hasPost 
      ? '⚠️ This will delete the project AND its shared post. This cannot be undone. Continue?' 
      : 'Delete this project? This cannot be undone.';
      
    if (!confirm(message)) return;
    
    try {
      const response = await fetch(`/api/projects?projectId=${project.id}&userId=${userId}`, {
        method: 'DELETE'
      });
      
      const { success, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to delete');
      }
      
      alert('✅ Project deleted successfully');
      setProjects([]);
      setPage(0);
      setHasMore(true);
      await fetchUserProjects(0);
      await fetchAllStats();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('❌ ' + error.message);
    }
  };

  const handleShareClick = (project: Project) => {
    setShareProject(project);
    setShareCaption(project.title);
    setShowShareModal(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('⚠️ Delete this post? The project will remain saved.')) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}?userId=${userId}`, {
        method: 'DELETE'
      });
      
      const { success, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to delete');
      }
      
      alert('✅ Post deleted successfully');
      setPosts([]);
      setProjects([]);
      setPage(0);
      setHasMore(true);
      await Promise.all([fetchUserPosts(0), fetchUserProjects(0)]);
      await fetchAllStats();
    } catch (error: any) {
      console.error('Delete post error:', error);
      alert('❌ ' + error.message);
    }
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
          <Link href="/feed">
            <button className="bg-purple-600 px-6 py-3 rounded-full">Go to Feed</button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const displayItems = activeTab === 'posts' ? posts : activeTab === 'projects' ? projects : savedPosts;

  // LOGGED OUT VIEW
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <Image 
                src="/logo.png" 
                alt="Garliq" 
                width={48} 
                height={48}
              />
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Garliq
              </h1>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="p-2.5 hover:bg-gray-800 rounded-full transition-colors"
              >
                <Share2 size={20} className="text-gray-400" />
              </button>

              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold flex items-center gap-2 text-sm sm:text-base"
                >
                  <Sparkles size={18} />
                  <span className="hidden sm:inline">Create Your Garliq</span>
                  <span className="sm:hidden">Create</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl sm:text-6xl font-black flex-shrink-0 overflow-hidden">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile.display_name[0].toUpperCase()}</span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-black mb-2">{profile.display_name}</h1>
              <p className="text-gray-500 mb-4 text-sm sm:text-base">@{profile.username}</p>
              
              {profile.bio && (
                <p className="text-gray-300 mb-6 leading-relaxed max-w-2xl text-sm sm:text-base">{profile.bio}</p>
              )}

              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
                <Calendar size={16} />
                <span>
                  Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                {[
                  { label: 'Posts', value: stats.posts, icon: Code2, color: 'text-purple-400' },
                  { label: 'Garliqs', value: stats.totalLikes, icon: Heart, color: 'text-pink-400' }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 sm:p-4 w-32 sm:w-36"
                  >
                    <stat.icon className={`${stat.color} mb-2`} size={18} />
                    <div className="text-xl sm:text-2xl font-black">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Posts Tab */}
          <div className="flex items-center gap-2 mb-6 sm:mb-8 border-b border-gray-800">
            <button className="flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold transition-all border-b-2 border-purple-500 text-white text-sm sm:text-base">
              <Code2 size={18} />
              Posts
            </button>
          </div>

          {/* Posts Grid - Feed Style */}
          {posts.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 sm:py-20"
            >
              <div className="mb-4 sm:mb-6 flex justify-center">
                <Image 
                  src="/logo.png" 
                  alt="Garliq" 
                  width={100} 
                  height={100}
                  className="sm:w-[120px] sm:h-[120px]"
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">No Posts Yet</h2>
              <p className="text-gray-500 text-sm sm:text-base">This user hasn't shared any creations yet</p>
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
                          <div className="flex items-center gap-1.5">
                            <Heart size={18} className="text-gray-500" />
                            <span className="text-xs sm:text-sm font-bold text-gray-400">{post.likes_count || 0}</span>
                          </div>

                          <Link href={`/post/${post.id}#comments`}>
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <MessageCircle size={18} />
                              <span className="text-xs sm:text-sm font-bold">{post.comments_count || 0}</span>
                            </div>
                          </Link>
                        </div>

                        <button 
                          onClick={() => handleSharePost(post)} 
                          className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                        >
                          <Share2 size={18} className="text-gray-500 hover:text-blue-400 transition-colors" />
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

  // LOGGED IN VIEW
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/feed')} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <ArrowLeft size={24} />
            <Image 
              src="/logo.png" 
              alt="Garliq" 
              width={48} 
              height={48}
            />
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {isOwnProfile && (
              <>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-900 rounded-full border border-gray-800">
                  <Zap size={16} className="text-yellow-400" />
                  <span className="text-xs sm:text-sm font-bold">{tokenBalance.toLocaleString()}</span>
                </div>
                
                <motion.button
                  onClick={() => setShowTokenModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 sm:px-5 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full font-semibold flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Zap size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Buy Tokens</span>
                  <span className="sm:hidden">Buy</span>
                </motion.button>
              </>
            )}

            {isOwnProfile && (
              <Link href={`/profiles/${userId}/edit`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 sm:px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-full font-semibold flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </motion.button>
              </Link>
            )}

            <button
              onClick={handleShare}
              className="p-2.5 hover:bg-gray-800 rounded-full transition-colors"
            >
              <Share2 size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start mb-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl sm:text-6xl font-black flex-shrink-0 overflow-hidden">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile.display_name[0].toUpperCase()}</span>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-black mb-2">{profile.display_name}</h1>
            <p className="text-gray-500 mb-4 text-sm sm:text-base">@{profile.username}</p>
            
            {profile.bio && (
              <p className="text-gray-300 mb-6 leading-relaxed max-w-2xl text-sm sm:text-base">{profile.bio}</p>
            )}

            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
              <Calendar size={16} />
              <span>
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Posts', value: stats.posts, icon: Code2, color: 'text-purple-400' },
                { label: 'Garliqs', value: stats.totalLikes, icon: Heart, color: 'text-pink-400' },
                { label: 'Projects', value: stats.projects, icon: Code2, color: 'text-green-400' },
                { label: 'Saved', value: stats.saves, icon: Bookmark, color: 'text-orange-400', hideForOthers: true }
              ].map((stat, i) => (
                (!stat.hideForOthers || isOwnProfile) && (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 sm:p-4"
                  >
                    <stat.icon className={`${stat.color} mb-2`} size={18} />
                    <div className="text-xl sm:text-2xl font-black">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 font-medium">{stat.label}</div>
                  </motion.div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8 border-b border-gray-800 overflow-x-auto">
          {[
            { id: 'posts', label: 'My Posts', icon: Code2 },
            { id: 'projects', label: 'Projects', icon: Code2 },
            ...(isOwnProfile ? [{ id: 'saved', label: 'Saved', icon: Bookmark }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold transition-all border-b-2 whitespace-nowrap text-sm sm:text-base ${
                activeTab === tab.id
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        {displayItems.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 sm:py-20"
          >
            <div className="mb-4 sm:mb-6 flex justify-center">
              <Image 
                src="/logo.png" 
                alt="Garliq" 
                width={100} 
                height={100}
                className="sm:w-[120px] sm:h-[120px]"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">
              {activeTab === 'posts' ? 'No Posts Yet' : activeTab === 'projects' ? 'No Projects Yet' : 'No Saved Posts'}
            </h2>
            <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">
              {activeTab === 'posts' 
                ? 'Share your first creation with the world' 
                : activeTab === 'projects' 
                ? 'Start building something amazing'
                : 'Save posts you love to view them here'}
            </p>
            {isOwnProfile && activeTab !== 'saved' && (
              <Link href="/create">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 sm:px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto text-sm sm:text-base">
                  <Plus size={18} />
                  Start Creating
                </button>
              </Link>
            )}
          </motion.div>
        ) : (
          <>
            {/* Posts Grid - Feed Style */}
            {activeTab === 'posts' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {posts.map((post, index) => (
                  <motion.div
                    key={`${post.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                    className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/10"
                  >

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
                              <Image 
                                src="/logo.png" 
                                alt="Liked" 
                                width={20} 
                                height={20}
                              />
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
                            onClick={() => handleSharePost(post)} 
                            className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                          >
                            <Share2 size={18} className="text-gray-500 hover:text-blue-400 transition-colors" />
                          </button>

                          {isOwnProfile && (
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
            )}

            {/* Projects Grid */}
            {activeTab === 'projects' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {projects.map((project, index) => (
                  <motion.div
                    key={`${project.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                    className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/10"
                  >
                    {/* Status Badge */}
                    {isOwnProfile && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-lg ${
                          project.is_draft 
                            ? 'bg-yellow-500/90 text-black' 
                            : 'bg-green-500/90 text-black'
                        }`}>
                          {project.is_draft ? 'Draft' : 'Live'}
                        </span>
                      </div>
                    )}

                    {/* Preview */}
                    <div 
                      className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer group-hover:ring-2 group-hover:ring-purple-500/30 transition-all"
                      onClick={() => setSelectedItem(project)}
                    >
                      <iframe
                        srcDoc={`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{overflow:hidden;pointer-events:none;transform:scale(0.8);transform-origin:top left;width:125%;height:125%}</style></head><body>${project.html_code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')}</body></html>`}
                        className="w-full h-full pointer-events-none"
                        sandbox=""
                        loading="lazy"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                        <Eye className="text-white drop-shadow-lg" size={32} />
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="p-3 sm:p-4">
                      <p className="text-sm sm:text-base font-bold mb-2 line-clamp-1">{project.title || 'Untitled Project'}</p>
                      <p className="text-xs text-gray-500 mb-3">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </p>

                      {isOwnProfile && (
                        <div className="flex gap-2 pt-3 border-t border-gray-800/50">
                          {project.session_id && (
                            <Link href={`/studio/${project.session_id}`} className="flex-1">
                              <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-semibold transition-colors">
                                <Edit size={14} />
                                Edit
                              </button>
                            </Link>
                          )}
                          
                          {project.is_draft && project.session_id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareClick(project);
                              }}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                              title="Share to Feed"
                            >
                              <Share2 size={14} />
                            </button>
                          )}
                          
                          {!project.is_draft && project.post_id && (
                            <Link href={`/post/${project.post_id}`} onClick={(e) => e.stopPropagation()}>
                              <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors" title="View Post">
                                <ExternalLink size={14} />
                              </button>
                            </Link>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project);
                            }}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Saved Posts Grid - Feed Style */}
            {activeTab === 'saved' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {savedPosts.map((post, index) => (
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
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm sm:text-base font-bold flex-shrink-0 overflow-hidden">
                          {post.profiles?.avatar_url ? (
                            <img 
                              src={post.profiles.avatar_url} 
                              alt={post.profiles.display_name || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{post.profiles?.display_name?.[0]?.toUpperCase() || '?'}</span>
                          )}
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
                              <Image 
                                src="/logo.png" 
                                alt="Liked" 
                                width={20} 
                                height={20}
                              />
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
                            onClick={() => handleSharePost(post)} 
                            className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                          >
                            <Share2 size={18} className="text-gray-500 hover:text-blue-400 transition-colors" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

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
              {!hasMore && displayItems.length > 0 && (
                <p className="text-gray-500 text-sm">You've reached the end!</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedItem(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-full max-w-6xl h-[90vh] bg-gray-900 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              <div className="p-3 sm:p-4 border-b border-gray-800 flex justify-between items-center bg-black/50 backdrop-blur-sm">
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {'caption' in selectedItem ? selectedItem.caption : 'title' in selectedItem ? selectedItem.title : 'Preview'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(selectedItem.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {'session_id' in selectedItem && selectedItem.session_id && isOwnProfile && (
                    <Link href={`/studio/${selectedItem.session_id}`}>
                      <button className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold flex items-center gap-2 text-xs sm:text-sm">
                        <Edit size={16} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    </Link>
                  )}
                  {'caption' in selectedItem && (
                    <Link href={`/post/${selectedItem.id}`}>
                      <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                        <ExternalLink size={18} className="text-gray-400" />
                      </button>
                    </Link>
                  )}
                  <button 
                    onClick={() => setSelectedItem(null)} 
                    className="text-gray-400 hover:text-white text-xl sm:text-2xl w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-full transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <iframe
                srcDoc={selectedItem.html_code}
                className="flex-1 w-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
                allow="autoplay; fullscreen"
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Share Project Modal */}
      <AnimatePresence>
        {showShareModal && shareProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={() => !sharing && setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold">📢 Share to Feed</h3>
                <button onClick={() => !sharing && setShowShareModal(false)} disabled={sharing}>
                  <span className="text-xl sm:text-2xl text-gray-400 hover:text-white">✕</span>
                </button>
              </div>

              <input
                type="text"
                value={shareCaption}
                onChange={(e) => setShareCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none mb-4 text-sm sm:text-base"
                disabled={sharing}
              />

              <label className="flex items-center gap-3 mb-4 sm:mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promptVisible}
                  onChange={(e) => setPromptVisible(e.target.checked)}
                  className="w-5 h-5"
                  disabled={sharing}
                />
                <span className="text-xs sm:text-sm text-gray-400">Share prompt publicly</span>
              </label>

              <motion.button
                onClick={handleShareProject}
                disabled={!shareCaption.trim() || sharing}
                whileHover={!sharing ? { scale: 1.02 } : {}}
                whileTap={!sharing ? { scale: 0.98 } : {}}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {sharing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      🧄
                    </motion.div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Share2 size={18} />
                    Publish to Feed
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token Purchase Modal */}
      <TokenPurchaseModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        userId={userId}
        currentBalance={tokenBalance}
        onSuccess={fetchTokenBalance}
      />
    </div>
  );
}