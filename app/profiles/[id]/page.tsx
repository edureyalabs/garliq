'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit, Calendar, Heart, Code2, Bookmark, Share2, ExternalLink, Trash2, Eye, Zap, Sparkles, MessageCircle, Plus, Crown, Clock, User, Folder } from 'lucide-react';
import Link from 'next/link';
import TokenPurchaseModal from '@/components/TokenPurchaseModal';
import SubscriptionModal from '@/components/SubscriptionModal';
import Image from 'next/image';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  subscription_status: 'none' | 'active' | 'expired' | 'cancelled' | 'trial';
  subscription_expires_at: string | null;
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
  session_id: string | null;
  is_liked?: boolean;
  is_saved?: boolean;
  first_page_content?: string | null;
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
  first_page_content?: string | null;
}

interface SubscriptionStatus {
  is_active: boolean;
  status: string;
  expires_at: string | null;
  days_remaining: number;
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
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
      fetchSubscriptionStatus();
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

  const fetchSubscriptionStatus = async () => {
    if (!currentUser?.id) return;

    const { data, error } = await supabase.rpc('check_subscription_status', {
      p_user_id: currentUser.id,
    });

    if (!error && data) {
      setSubscriptionStatus(data as SubscriptionStatus);
    }
  };

  const getSubscriptionBadge = () => {
    if (!subscriptionStatus) return null;

    const colors = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      trial: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      expired: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      none: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };

    const labels = {
      active: '✓ Active',
      trial: '⚡ Trial',
      expired: '✗ Expired',
      cancelled: '⊘ Cancelled',
      none: '○ None',
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[subscriptionStatus.status as keyof typeof colors]}`}>
        {labels[subscriptionStatus.status as keyof typeof labels]}
      </span>
    );
  };

  const fetchAllStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { count: postsCount, data: postsData } = await supabase
      .from('posts')
      .select('likes_count', { count: 'exact' })
      .eq('user_id', userId);
    
    const totalLikes = postsData?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;
    
    const { count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
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

  // Step 1: Fetch posts
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
    // Step 2: Get session IDs for multi-page posts
    const sessionIds = data
      .filter(post => post.session_id)
      .map(post => post.session_id);

    // Step 3: Fetch first pages for multi-page posts
    let firstPagesMap = new Map<string, string>();
    if (sessionIds.length > 0) {
      const { data: pagesData } = await supabase
        .from('course_pages')
        .select('session_id, html_content')
        .in('session_id', sessionIds)
        .eq('page_number', 0);

      if (pagesData) {
        firstPagesMap = new Map(
          pagesData.map(page => [page.session_id, page.html_content])
        );
      }
    }

    // Step 4: Map first page content to posts
    let postsWithFirstPage = data.map(post => ({
      ...post,
      first_page_content: post.session_id ? firstPagesMap.get(post.session_id) || null : null
    }));

    // Step 5: Add interaction data if logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      postsWithFirstPage = await Promise.all(
        postsWithFirstPage.map(async (post) => {
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
      setPosts(postsWithFirstPage);
    } else {
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = postsWithFirstPage.filter(p => !existingIds.has(p.id));
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

  // Step 1: Fetch projects
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
    // Step 2: Get session IDs for multi-page projects
    const sessionIds = data
      .filter(project => project.session_id)
      .map(project => project.session_id);

    // Step 3: Fetch first pages for multi-page projects
    let firstPagesMap = new Map<string, string>();
    if (sessionIds.length > 0) {
      const { data: pagesData } = await supabase
        .from('course_pages')
        .select('session_id, html_content')
        .in('session_id', sessionIds)
        .eq('page_number', 0);

      if (pagesData) {
        firstPagesMap = new Map(
          pagesData.map(page => [page.session_id, page.html_content])
        );
      }
    }

    // Step 4: Map first page content to projects
    const projectsWithFirstPage = data.map(project => ({
      ...project,
      first_page_content: project.session_id ? firstPagesMap.get(project.session_id) || null : null
    }));

    if (pageNum === 0) {
      setProjects(projectsWithFirstPage);
    } else {
      setProjects(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProjects = projectsWithFirstPage.filter(p => !existingIds.has(p.id));
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

// Step 1: Fetch posts
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .in('id', postIds)
  .order('created_at', { ascending: false });

if (posts) {
  // Step 2: Get session IDs for multi-page posts
  const sessionIds = posts
    .filter(post => post.session_id)
    .map(post => post.session_id);

  // Step 3: Fetch first pages for multi-page posts
  let firstPagesMap = new Map<string, string>();
  if (sessionIds.length > 0) {
    const { data: pagesData } = await supabase
      .from('course_pages')
      .select('session_id, html_content')
      .in('session_id', sessionIds)
      .eq('page_number', 0);

    if (pagesData) {
      firstPagesMap = new Map(
        pagesData.map(page => [page.session_id, page.html_content])
      );
    }
  }

  // Step 4: Get profiles
  const userIds = [...new Set(posts.map(p => p.user_id))];
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds);

  const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

  // Step 5: Combine all data
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
        first_page_content: post.session_id ? firstPagesMap.get(post.session_id) || null : null,
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

  const renderPreviewIframe = (item: Post | Project) => {
    const htmlContent = item.session_id && item.first_page_content
      ? `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;padding:20px;overflow:hidden}</style></head><body>${item.first_page_content}</body></html>`
      : `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{overflow:hidden;pointer-events:none;transform:scale(0.8);transform-origin:top left;width:125%;height:125%}</style></head><body>${item.html_code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')}</body></html>`;

    return (
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full pointer-events-none"
        sandbox=""
        loading="lazy"
      />
    );
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
      <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-b border-gray-800 z-40">
          <div className="px-3 py-2 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <Image 
                src="/logo.png" 
                alt="Garliq" 
                width={28} 
                height={28}
              />
              <h1 className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Garliq
              </h1>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
              >
                <Share2 size={16} className="text-gray-400" />
              </button>

              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  Create
                </motion.button>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="flex-shrink-0 bg-gradient-to-b from-gray-900/50 to-black border-b border-gray-800">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold overflow-hidden flex-shrink-0">
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
                <h1 className="text-2xl font-black mb-1">{profile.display_name}</h1>
                <p className="text-sm text-gray-400 mb-2">@{profile.username}</p>
                
                {profile.bio && (
                  <p className="text-sm text-gray-300 leading-relaxed mb-3">{profile.bio}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={14} />
                  <span>
                    Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs with Stats */}
        <div className="flex-shrink-0 bg-black border-b border-gray-800">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-2 px-4 py-3 font-semibold transition-all border-b-2 border-purple-500 text-white text-sm">
                <User size={16} />
                Posts
                <span className="ml-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold">
                  {stats.posts}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-4">
            {posts.length === 0 && !loading ? (
              <div className="text-center py-16">
                <div className="mb-4 flex justify-center">
                  <Image 
                    src="/logo.png" 
                    alt="Garliq" 
                    width={80} 
                    height={80}
                  />
                </div>
                <h2 className="text-xl font-bold mb-2">No Posts Yet</h2>
                <p className="text-gray-500 text-sm">This user hasn't shared any creations yet</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.map((post, index) => (
                    <motion.div
                      key={`${post.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                      className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
                    >
                      <Link href={`/post/${post.id}`}>
                        <div className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer">
                          {renderPreviewIframe(post)}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                      </Link>

                      <div className="p-3 space-y-2">
                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{post.caption}</p>

                        {post.prompt_visible && post.prompt && (
                          <div className="bg-purple-500/5 border border-purple-500/10 rounded p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Code2 size={9} className="text-purple-400" />
                              <span className="text-[9px] font-bold text-purple-400 uppercase">Prompt</span>
                            </div>
                            <p className="text-[10px] text-gray-400 line-clamp-2 font-mono">{post.prompt}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Heart size={15} className="text-gray-500" />
                              <span className="text-xs font-bold text-gray-400">{post.likes_count || 0}</span>
                            </div>

                            <Link href={`/post/${post.id}#comments`}>
                              <div className="flex items-center gap-1 text-gray-500">
                                <MessageCircle size={15} />
                                <span className="text-xs font-bold">{post.comments_count || 0}</span>
                              </div>
                            </Link>
                          </div>

                          <button 
                            onClick={() => handleSharePost(post)} 
                            className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                          >
                            <Share2 size={15} className="text-gray-500 hover:text-blue-400 transition-colors" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

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
                      <span className="text-sm">Loading...</span>
                    </div>
                  )}
                  {!hasMore && posts.length > 0 && (
                    <p className="text-gray-500 text-sm">End of posts</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN VIEW - COMPACT PROFILE PAGE
  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-b border-gray-800 z-40">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/feed')} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <User size={16} className="text-purple-400" />
                {isOwnProfile ? 'My Profile' : `${profile.display_name}'s Profile`}
              </h2>
              <p className="text-xs text-gray-500">@{profile.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 rounded-full border border-gray-800">
                  <Zap size={16} className="text-yellow-400" />
                  <span className="text-sm font-bold">{tokenBalance.toLocaleString()}</span>
                </div>
                
                <motion.button
                  onClick={() => setShowTokenModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-1.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full font-semibold flex items-center gap-2 text-sm"
                >
                  <Zap size={16} />
                  Buy Tokens
                </motion.button>

                <Link href={`/profiles/${userId}/edit`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-full font-semibold flex items-center gap-2 text-sm"
                  >
                    <Edit size={16} />
                    Edit
                  </motion.button>
                </Link>
              </>
            )}

            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <Share2 size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* COMPACT Profile Info Section - Side by Side Layout */}
      <div className="flex-shrink-0 bg-gradient-to-b from-gray-900/50 to-black border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-start gap-4">
            {/* Left: Avatar + Basic Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold overflow-hidden flex-shrink-0">
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

              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-black mb-0.5 truncate">{profile.display_name}</h1>
                <p className="text-xs text-gray-400 mb-1.5 truncate">@{profile.username}</p>
                
                {profile.bio && (
                  <p className="text-xs text-gray-300 leading-relaxed mb-2 line-clamp-2">{profile.bio}</p>
                )}

                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <Calendar size={11} />
                  <span>
                    Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Subscription Panel (Only for Own Profile) */}
            {isOwnProfile && subscriptionStatus && (
              <div className="w-72 flex-shrink-0 bg-gray-900/70 border border-gray-800 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Crown size={13} className="text-purple-400" />
                    <span className="font-bold text-xs">Subscription</span>
                  </div>
                  {getSubscriptionBadge()}
                </div>

                <div className="space-y-1 text-[10px] mb-2">
                  {subscriptionStatus.expires_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {subscriptionStatus.is_active ? 'Expires' : 'Expired'}:
                      </span>
                      <span className="font-medium text-[10px]">
                        {new Date(subscriptionStatus.expires_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}

                  {subscriptionStatus.is_active && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Days Left:</span>
                      <span className={`font-bold text-[10px] ${
                        subscriptionStatus.days_remaining <= 3 ? 'text-red-400' :
                        subscriptionStatus.days_remaining <= 7 ? 'text-orange-400' :
                        'text-green-400'
                      }`}>
                        {subscriptionStatus.days_remaining}
                      </span>
                    </div>
                  )}
                </div>

                {/* Compact Button */}
                {!subscriptionStatus.is_active ? (
                  <motion.button
                    onClick={() => setShowSubscriptionModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 font-semibold flex items-center justify-center gap-1.5 text-[11px]"
                  >
                    <Crown size={12} />
                    Renew - $3/mo
                  </motion.button>
                ) : subscriptionStatus.days_remaining <= 7 && (
                  <motion.button
                    onClick={() => setShowSubscriptionModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-3 py-1.5 border border-purple-600 text-purple-400 rounded-md hover:bg-purple-600/10 font-semibold flex items-center justify-center gap-1.5 text-[11px]"
                  >
                    <Crown size={12} />
                    Extend
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs with Stats */}
      <div className="flex-shrink-0 bg-black border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-1">
            {[
              { id: 'posts', label: 'My Posts', icon: User, count: stats.posts },
              { id: 'projects', label: 'Projects', icon: Folder, count: stats.projects },
              ...(isOwnProfile ? [{ id: 'saved', label: 'Saved', icon: Bookmark, count: stats.saves }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all border-b-2 whitespace-nowrap text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-gray-800 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-4">
          {displayItems.length === 0 && !loading ? (
            <div className="text-center py-16">
              <div className="mb-6 flex justify-center">
                <Image 
                  src="/logo.png" 
                  alt="Garliq" 
                  width={80} 
                  height={80}
                />
              </div>
              <h2 className="text-xl font-bold mb-2">
                {activeTab === 'posts' ? 'No Posts Yet' : activeTab === 'projects' ? 'No Projects Yet' : 'No Saved Posts'}
              </h2>
              <p className="text-gray-500 mb-6 text-sm">
                {activeTab === 'posts' 
                  ? 'Share your first creation' 
                  : activeTab === 'projects' 
                  ? 'Start building something'
                  : 'Save posts to view here'}
              </p>
              {isOwnProfile && activeTab !== 'saved' && (
                <Link href="/create">
                  <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full font-bold flex items-center gap-2 mx-auto">
                    <Plus size={18} />
                    Start Creating
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Posts Grid */}
              {activeTab === 'posts' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.map((post, index) => (
                    <motion.div
                      key={`${post.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                      className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
                    >
                      <Link href={`/post/${post.id}`}>
                        <div className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer">
                          {renderPreviewIframe(post)}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                      </Link>

                      <div className="p-3 space-y-2">
                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{post.caption}</p>

                        {post.prompt_visible && post.prompt && (
                          <div className="bg-purple-500/5 border border-purple-500/10 rounded p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Code2 size={9} className="text-purple-400" />
                              <span className="text-[9px] font-bold text-purple-400 uppercase">Prompt</span>
                            </div>
                            <p className="text-[10px] text-gray-400 line-clamp-2 font-mono">{post.prompt}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleLike(post.id, post.is_liked || false)}
                              className="flex items-center gap-1 hover:scale-110 transition-transform"
                            >
                              {post.is_liked ? (
                                <Image 
                                  src="/logo.png" 
                                  alt="Liked" 
                                  width={16} 
                                  height={16}
                                />
                              ) : (
                                <Heart size={15} className="text-gray-500 hover:text-purple-400 transition-colors" />
                              )}
                              <span className="text-xs font-bold text-gray-400">{post.likes_count || 0}</span>
                            </button>

                            <Link href={`/post/${post.id}#comments`}>
                              <button className="flex items-center gap-1 text-gray-500 hover:text-pink-400 transition-colors">
                                <MessageCircle size={15} />
                                <span className="text-xs font-bold">{post.comments_count || 0}</span>
                              </button>
                            </Link>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSave(post.id, post.is_saved || false)}
                              className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                            >
                              <Bookmark 
                                size={15} 
                                className={post.is_saved ? 'fill-purple-400 text-purple-400' : 'text-gray-500'} 
                              />
                            </button>

                            <button 
                              onClick={() => handleSharePost(post)} 
                              className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                            >
                              <Share2 size={15} className="text-gray-500 hover:text-blue-400 transition-colors" />
                            </button>

                            {isOwnProfile && (
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                              >
                                <Trash2 size={15} className="text-gray-500 hover:text-red-400 transition-colors" />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project, index) => (
                    <motion.div
                      key={`${project.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                      className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
                    >
                      {isOwnProfile && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold shadow-lg ${
                            project.is_draft 
                              ? 'bg-yellow-500/90 text-black' 
                              : 'bg-green-500/90 text-black'
                          }`}>
                            {project.is_draft ? 'Draft' : 'Live'}
                          </span>
                        </div>
                      )}

                      <div 
                        className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer"
                        onClick={() => setSelectedItem(project)}
                      >
                        {renderPreviewIframe(project)}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                          <Eye className="text-white drop-shadow-lg" size={28} />
                        </div>
                      </div>

                      <div className="p-3">
                        <p className="text-sm font-bold mb-1 line-clamp-1">{project.title || 'Untitled Project'}</p>
                        <p className="text-xs text-gray-500 mb-2">
                          {new Date(project.updated_at).toLocaleDateString()}
                        </p>

                        {isOwnProfile && (
                          <div className="flex gap-2 pt-2 border-t border-gray-800/50">
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
                                title="Share"
                              >
                                <Share2 size={14} />
                              </button>
                            )}
                            
                            {!project.is_draft && project.post_id && (
                              <Link href={`/post/${project.post_id}`} onClick={(e) => e.stopPropagation()}>
                                <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors" title="View">
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
                              title="Delete"
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

              {/* Saved Posts Grid */}
              {activeTab === 'saved' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedPosts.map((post, index) => (
                    <motion.div
                      key={`${post.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                      className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
                    >
                      <div className="p-2.5 border-b border-gray-800/50 bg-black/40">
                        <Link href={`/profiles/${post.user_id}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold overflow-hidden">
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
                            <p className="text-xs font-semibold truncate">{post.profiles?.display_name || 'Anonymous'}</p>
                            <p className="text-[10px] text-gray-500 truncate">@{post.profiles?.username || 'unknown'}</p>
                          </div>
                        </Link>
                      </div>

                      <Link href={`/post/${post.id}`}>
                        <div className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer">
                          {renderPreviewIframe(post)}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                      </Link>

                      <div className="p-3 space-y-2">
                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{post.caption}</p>

                        {post.prompt_visible && post.prompt && (
                          <div className="bg-purple-500/5 border border-purple-500/10 rounded p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Code2 size={9} className="text-purple-400" />
                              <span className="text-[9px] font-bold text-purple-400 uppercase">Prompt</span>
                            </div>
                            <p className="text-[10px] text-gray-400 line-clamp-2 font-mono">{post.prompt}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleLike(post.id, post.is_liked || false)}
                              className="flex items-center gap-1 hover:scale-110 transition-transform"
                            >
                              {post.is_liked ? (
                                <Image 
                                  src="/logo.png" 
                                  alt="Liked" 
                                  width={16} 
                                  height={16}
                                />
                              ) : (
                                <Heart size={15} className="text-gray-500 hover:text-purple-400 transition-colors" />
                              )}
                              <span className="text-xs font-bold text-gray-400">{post.likes_count || 0}</span>
                            </button>

                            <Link href={`/post/${post.id}#comments`}>
                              <button className="flex items-center gap-1 text-gray-500 hover:text-pink-400 transition-colors">
                                <MessageCircle size={15} />
                                <span className="text-xs font-bold">{post.comments_count || 0}</span>
                              </button>
                            </Link>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSave(post.id, post.is_saved || false)}
                              className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                            >
                              <Bookmark 
                                size={15} 
                                className={post.is_saved ? 'fill-purple-400 text-purple-400' : 'text-gray-500'} 
                              />
                            </button>

                            <button 
                              onClick={() => handleSharePost(post)} 
                              className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
                            >
                              <Share2 size={15} className="text-gray-500 hover:text-blue-400 transition-colors" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

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
                    <span className="text-sm">Loading...</span>
                  </div>
                )}
                {!hasMore && displayItems.length > 0 && (
                  <p className="text-gray-500 text-sm">End of {activeTab}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-full max-w-6xl h-[90vh] bg-gray-900 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/50 backdrop-blur-sm">
                <div>
                  <h3 className="font-bold text-base">
                    {'caption' in selectedItem ? selectedItem.caption : 'title' in selectedItem ? selectedItem.title : 'Preview'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(selectedItem.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {'session_id' in selectedItem && selectedItem.session_id && isOwnProfile && (
                    <Link href={`/studio/${selectedItem.session_id}`}>
                      <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold flex items-center gap-2 text-sm">
                        <Edit size={16} />
                        Edit
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
                    className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-full transition-colors"
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
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => !sharing && setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">📢 Share to Feed</h3>
                <button onClick={() => !sharing && setShowShareModal(false)} disabled={sharing}>
                  <span className="text-2xl text-gray-400 hover:text-white">✕</span>
                </button>
              </div>

              <input
                type="text"
                value={shareCaption}
                onChange={(e) => setShareCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none mb-4"
                disabled={sharing}
              />

              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promptVisible}
                  onChange={(e) => setPromptVisible(e.target.checked)}
                  className="w-5 h-5"
                  disabled={sharing}
                />
                <span className="text-sm text-gray-400">Share prompt publicly</span>
              </label>

              <motion.button
                onClick={handleShareProject}
                disabled={!shareCaption.trim() || sharing}
                whileHover={!sharing ? { scale: 1.02 } : {}}
                whileTap={!sharing ? { scale: 0.98 } : {}}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      <TokenPurchaseModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        userId={userId}
        currentBalance={tokenBalance}
        onSuccess={fetchTokenBalance}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => {
          fetchSubscriptionStatus();
          setShowSubscriptionModal(false);
        }}
      />
    </div>
  );
}