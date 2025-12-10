'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit, 
  Calendar, 
  Heart, 
  Code2, 
  Bookmark, 
  Share2, 
  Trash2, 
  Eye, 
  Zap, 
  Sparkles, 
  Plus, 
  Crown, 
  Clock, 
  FlaskConical, 
  RotateCcw, 
  Loader2,
  TrendingUp,
  LogOut
} from 'lucide-react';
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

interface Simulation {
  id: string;
  title: string;
  prompt: string;
  html_code: string | null;
  topic_category: string;
  framework_used: string | null;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  generation_error: string | null;
  retry_count: number;
  is_published: boolean;
  post_id: string | null;
  created_at: string;
  updated_at: string;
}

interface SimulationPost {
  id: string;
  caption: string;
  html_code: string;
  topic_category: string;
  framework_used: string;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  created_at: string;
  user_id: string;
  simulation_id: string;
  is_liked?: boolean;
  is_saved?: boolean;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface SubscriptionStatus {
  is_active: boolean;
  status: string;
  expires_at: string | null;
  days_remaining: number;
}

type ActiveSection = 'feed' | 'sim-trending' | 'course-posts' | 'course-projects' | 'sim-shared' | 'sim-labs' | 'saved-courses' | 'saved-labs' | 'subscription';

const ITEMS_PER_PAGE = 12;

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  // Profile & User State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Content State
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [sharedSimulations, setSharedSimulations] = useState<SimulationPost[]>([]);
  const [trendingSimulations, setTrendingSimulations] = useState<SimulationPost[]>([]);
  const [savedSimulations, setSavedSimulations] = useState<SimulationPost[]>([]);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);

  // Loading & Pagination State
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // UI State
  const [activeSection, setActiveSection] = useState<ActiveSection>('feed');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProject, setShareProject] = useState<Project | null>(null);
  const [shareCaption, setShareCaption] = useState('');
  const [promptVisible, setPromptVisible] = useState(true);
  const [sharing, setSharing] = useState(false);

  // Token & Subscription State
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Stats State
  const [stats, setStats] = useState({ 
    posts: 0, 
    projects: 0,
    sharedSimulations: 0,
    myLabs: 0,
    savedCourses: 0,
    savedLabs: 0
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  // Initial Load Effects
  useEffect(() => {
    checkUser();
    fetchProfile();
    fetchAllStats();
  }, [userId]);

  useEffect(() => {
    setIsOwnProfile(currentUser?.id === userId);
  }, [currentUser, userId]);

  useEffect(() => {
    resetPagination();
    loadContent();
  }, [activeSection, userId]);

  useEffect(() => {
    if (currentUser?.id === userId) {
      fetchTokenBalance();
      fetchSubscriptionStatus();
    }
  }, [currentUser, userId]);

  // Infinite Scroll Observer
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

  // Pagination Reset
  const resetPagination = () => {
    setPosts([]);
    setProjects([]);
    setSavedPosts([]);
    setSimulations([]);
    setSharedSimulations([]);
    setTrendingSimulations([]);
    setSavedSimulations([]);
    setFeedPosts([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
  };

  // Content Loading Router
  const loadContent = () => {
    switch(activeSection) {
      case 'feed':
        fetchFeedPosts(0);
        break;
      case 'sim-trending':
        fetchTrendingSimulations(0);
        break;
      case 'course-posts':
        fetchUserPosts(0);
        break;
      case 'course-projects':
        fetchUserProjects(0);
        break;
      case 'sim-shared':
        fetchSharedSimulations(0);
        break;
      case 'sim-labs':
        fetchUserSimulations(0);
        break;
      case 'saved-courses':
        fetchSavedPosts(0);
        break;
      case 'saved-labs':
        fetchSavedSimulations(0);
        break;
      case 'subscription':
        setLoading(false);
        setHasMore(false);
        break;
    }
  };
  // User Authentication Check
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUser(session.user);
  };

  // Token Balance Fetch
  const fetchTokenBalance = async () => {
    if (!currentUser?.id) return;
    
    const { data } = await supabase
      .from('user_wallets')
      .select('token_balance')
      .eq('user_id', currentUser.id)
      .single();

    setTokenBalance(data?.token_balance || 0);
  };

  // Subscription Status Fetch
  const fetchSubscriptionStatus = async () => {
    if (!currentUser?.id) return;

    const { data, error } = await supabase.rpc('check_subscription_status', {
      p_user_id: currentUser.id,
    });

    if (!error && data) {
      setSubscriptionStatus(data as SubscriptionStatus);
    }
  };

  // Subscription Badge Component
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

  // Stats Fetch
  const fetchAllStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    const { count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: sharedSimsCount } = await supabase
      .from('simulation_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: myLabsCount } = await supabase
      .from('simulations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    let savedCoursesCount = 0;
    let savedLabsCount = 0;
    if (session && session.user.id === userId) {
      const { count: savedCoursesC } = await supabase
        .from('saves')
        .select('post_id', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      savedCoursesCount = savedCoursesC || 0;

      const { count: savedLabsC } = await supabase
        .from('simulation_saves')
        .select('post_id', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      savedLabsCount = savedLabsC || 0;
    }
    
    setStats({
      posts: postsCount || 0,
      projects: projectsCount || 0,
      sharedSimulations: sharedSimsCount || 0,
      myLabs: myLabsCount || 0,
      savedCourses: savedCoursesCount,
      savedLabs: savedLabsCount
    });
  };

  // Profile Fetch
  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) setProfile(data);
  };

  // Feed Posts Fetch (Trending Courses)
  const fetchFeedPosts = async (pageNum: number) => {
    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('status', 'APPROVED')
      .order('likes_count', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Fetch feed posts error:', error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (data) {
      const sessionIds = data.filter(post => post.session_id).map(post => post.session_id);
      let firstPagesMap = new Map<string, string>();
      
      if (sessionIds.length > 0) {
        const { data: pagesData } = await supabase
          .from('course_pages')
          .select('session_id, html_content')
          .in('session_id', sessionIds)
          .eq('page_number', 0);

        if (pagesData) {
          firstPagesMap = new Map(pagesData.map(page => [page.session_id, page.html_content]));
        }
      }

      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      let postsWithProfiles = data.map(post => ({
        ...post,
        likes_count: post.likes_count ?? 0,
        comments_count: post.comments_count ?? 0,
        first_page_content: post.session_id ? firstPagesMap.get(post.session_id) || null : null,
        profiles: profilesMap.get(post.user_id)
      }));

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        postsWithProfiles = await Promise.all(
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
      }

      if (pageNum === 0) {
        setFeedPosts(postsWithProfiles);
      } else {
        setFeedPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = postsWithProfiles.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      }

      setHasMore(data.length === ITEMS_PER_PAGE && (count || 0) > to + 1);
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  // Trending Simulations Fetch (NEW - Universal Feed)
  const fetchTrendingSimulations = async (pageNum: number) => {
    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('simulation_posts')
      .select('*', { count: 'exact' })
      .eq('status', 'APPROVED')
      .order('likes_count', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Fetch trending simulations error:', error);
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

      const { data: { session } } = await supabase.auth.getSession();
      
      let postsWithInteractions = data.map(post => ({
        ...post,
        likes_count: post.likes_count ?? 0,
        comments_count: post.comments_count ?? 0,
        profiles: profilesMap.get(post.user_id)
      }));

      if (session) {
        postsWithInteractions = await Promise.all(
          postsWithInteractions.map(async (post) => {
            const [likeData, saveData] = await Promise.all([
              supabase.from('simulation_likes').select('*').eq('post_id', post.id).eq('user_id', session.user.id).maybeSingle(),
              supabase.from('simulation_saves').select('*').eq('post_id', post.id).eq('user_id', session.user.id).maybeSingle()
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
        setTrendingSimulations(postsWithInteractions);
      } else {
        setTrendingSimulations(prev => {
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

  // User Posts Fetch
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
      const sessionIds = data.filter(post => post.session_id).map(post => post.session_id);
      let firstPagesMap = new Map<string, string>();
      
      if (sessionIds.length > 0) {
        const { data: pagesData } = await supabase
          .from('course_pages')
          .select('session_id, html_content')
          .in('session_id', sessionIds)
          .eq('page_number', 0);

        if (pagesData) {
          firstPagesMap = new Map(pagesData.map(page => [page.session_id, page.html_content]));
        }
      }

      let postsWithFirstPage = data.map(post => ({
        ...post,
        first_page_content: post.session_id ? firstPagesMap.get(post.session_id) || null : null
      }));

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
  // User Projects Fetch
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
      const sessionIds = data.filter(project => project.session_id).map(project => project.session_id);
      let firstPagesMap = new Map<string, string>();
      
      if (sessionIds.length > 0) {
        const { data: pagesData } = await supabase
          .from('course_pages')
          .select('session_id, html_content')
          .in('session_id', sessionIds)
          .eq('page_number', 0);

        if (pagesData) {
          firstPagesMap = new Map(pagesData.map(page => [page.session_id, page.html_content]));
        }
      }

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

  // Saved Posts Fetch
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
      if (pageNum === 0) setSavedPosts([]);
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
      const sessionIds = posts.filter(post => post.session_id).map(post => post.session_id);
      let firstPagesMap = new Map<string, string>();
      
      if (sessionIds.length > 0) {
        const { data: pagesData } = await supabase
          .from('course_pages')
          .select('session_id, html_content')
          .in('session_id', sessionIds)
          .eq('page_number', 0);

        if (pagesData) {
          firstPagesMap = new Map(pagesData.map(page => [page.session_id, page.html_content]));
        }
      }

      const userIds = [...new Set(posts.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

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

  // User Simulations Fetch
  const fetchUserSimulations = async (pageNum: number) => {
    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('simulations')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Fetch simulations error:', error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (data) {
      if (pageNum === 0) {
        setSimulations(data);
      } else {
        setSimulations(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newSims = data.filter(s => !existingIds.has(s.id));
          return [...prev, ...newSims];
        });
      }

      setHasMore(data.length === ITEMS_PER_PAGE && (count || 0) > to + 1);
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  // Shared Simulations Fetch
  const fetchSharedSimulations = async (pageNum: number) => {
    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('simulation_posts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Fetch shared simulations error:', error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (data) {
      const { data: { session } } = await supabase.auth.getSession();
      
      let postsWithInteractions = data;
      if (session) {
        postsWithInteractions = await Promise.all(
          data.map(async (post) => {
            const [likeData, saveData] = await Promise.all([
              supabase.from('simulation_likes').select('*').eq('post_id', post.id).eq('user_id', session.user.id).maybeSingle(),
              supabase.from('simulation_saves').select('*').eq('post_id', post.id).eq('user_id', session.user.id).maybeSingle()
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
        setSharedSimulations(postsWithInteractions);
      } else {
        setSharedSimulations(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newSims = postsWithInteractions.filter(s => !existingIds.has(s.id));
          return [...prev, ...newSims];
        });
      }

      setHasMore(data.length === ITEMS_PER_PAGE && (count || 0) > to + 1);
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  // Saved Simulations Fetch
  const fetchSavedSimulations = async (pageNum: number) => {
    if (!currentUser) return;

    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: saves, error: savesError, count } = await supabase
      .from('simulation_saves')
      .select('post_id', { count: 'exact' })
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (savesError || !saves || saves.length === 0) {
      if (pageNum === 0) setSavedSimulations([]);
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const postIds = saves.map(s => s.post_id);
    const { data: posts } = await supabase
      .from('simulation_posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false });

    if (posts) {
      const userIds = [...new Set(posts.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const postsWithInteractions = await Promise.all(
        posts.map(async (post) => {
          const [likeData, saveData] = await Promise.all([
            supabase.from('simulation_likes').select('*').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle(),
            supabase.from('simulation_saves').select('*').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle()
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
        setSavedSimulations(postsWithInteractions);
      } else {
        setSavedSimulations(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newSims = postsWithInteractions.filter(s => !existingIds.has(s.id));
          return [...prev, ...newSims];
        });
      }

      setHasMore(saves.length === ITEMS_PER_PAGE && (count || 0) > to + 1);
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  // Load More Handler
  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      
      switch(activeSection) {
        case 'feed':
          fetchFeedPosts(nextPage);
          break;
        case 'sim-trending':
          fetchTrendingSimulations(nextPage);
          break;
        case 'course-posts':
          fetchUserPosts(nextPage);
          break;
        case 'course-projects':
          fetchUserProjects(nextPage);
          break;
        case 'sim-shared':
          fetchSharedSimulations(nextPage);
          break;
        case 'sim-labs':
          fetchUserSimulations(nextPage);
          break;
        case 'saved-courses':
          fetchSavedPosts(nextPage);
          break;
        case 'saved-labs':
          fetchSavedSimulations(nextPage);
          break;
      }
    }
  };
  // Like Handler - Course Posts
  const handleLikeCourse = async (postId: string, isLiked: boolean) => {
    if (!currentUser) return;

    try {
      if (isLiked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
        await supabase.rpc('decrement_likes', { post_id: postId });
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id });
        await supabase.rpc('increment_likes', { post_id: postId });
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: updatedPost } = await supabase
        .from('posts')
        .select('likes_count, comments_count')
        .eq('id', postId)
        .single();

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
        setFeedPosts(prevPosts => prevPosts.map(updatePost));
      }
    } catch (error: any) {
      console.error('Like error:', error);
      alert('Failed to update like: ' + error.message);
    }
  };

  // Like Handler - Simulations
  const handleLikeSimulation = async (postId: string, isLiked: boolean) => {
    if (!currentUser) return;

    try {
      if (isLiked) {
        await supabase.from('simulation_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      } else {
        await supabase.from('simulation_likes').insert({ post_id: postId, user_id: currentUser.id });
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: updatedPost } = await supabase
        .from('simulation_posts')
        .select('likes_count, comments_count')
        .eq('id', postId)
        .single();

      if (updatedPost) {
        const { data: likeCheck } = await supabase
          .from('simulation_likes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', currentUser.id)
          .maybeSingle();

        const updatePost = (post: SimulationPost) => 
          post.id === postId ? {
            ...post,
            is_liked: !!likeCheck,
            likes_count: updatedPost.likes_count || 0,
            comments_count: updatedPost.comments_count || 0
          } : post;

        setSharedSimulations(prevPosts => prevPosts.map(updatePost));
        setTrendingSimulations(prevPosts => prevPosts.map(updatePost));
        setSavedSimulations(prevPosts => prevPosts.map(updatePost));
      }
    } catch (error: any) {
      console.error('Like simulation error:', error);
    }
  };

  // Save Handler - Course Posts
  const handleSaveCourse = async (postId: string, isSaved: boolean) => {
    if (!currentUser) return;

    const updatePost = (post: Post) => 
      post.id === postId ? { ...post, is_saved: !isSaved } : post;

    setPosts(prevPosts => prevPosts.map(updatePost));
    setSavedPosts(prevPosts => prevPosts.map(updatePost));
    setFeedPosts(prevPosts => prevPosts.map(updatePost));

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
      setFeedPosts(prevPosts => prevPosts.map(post => 
        post.id === postId ? { ...post, is_saved: isSaved } : post
      ));
    }
  };

  // Save Handler - Simulations
  const handleSaveSimulation = async (postId: string, isSaved: boolean) => {
    if (!currentUser) return;

    const updatePost = (post: SimulationPost) => 
      post.id === postId ? { ...post, is_saved: !isSaved } : post;

    setSharedSimulations(prevPosts => prevPosts.map(updatePost));
    setTrendingSimulations(prevPosts => prevPosts.map(updatePost));
    setSavedSimulations(prevPosts => prevPosts.map(updatePost));

    try {
      if (isSaved) {
        await supabase.from('simulation_saves').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      } else {
        await supabase.from('simulation_saves').insert({ post_id: postId, user_id: currentUser.id });
      }
    } catch (error) {
      console.error('Save simulation error:', error);
      setSharedSimulations(prevPosts => prevPosts.map(post => 
        post.id === postId ? { ...post, is_saved: isSaved } : post
      ));
      setTrendingSimulations(prevPosts => prevPosts.map(post => 
        post.id === postId ? { ...post, is_saved: isSaved } : post
      ));
      setSavedSimulations(prevPosts => prevPosts.map(post => 
        post.id === postId ? { ...post, is_saved: isSaved } : post
      ));
    }
  };

  // Share Handler - Course Post
  const handleSharePost = async (post: Post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.caption} | GarliQ`,
          url: shareUrl
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied!');
    }
  };

  // Share Handler - Simulation
  const handleShareSimulation = async (post: SimulationPost) => {
    const shareUrl = `${window.location.origin}/simulation/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.caption} | GarliQ Lab`,
          url: shareUrl
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied!');
    }
  };

  // Share Project Handler
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
      
      resetPagination();
      await Promise.all([fetchUserProjects(0), fetchAllStats()]);
      
      alert('✅ Project published to feed!');
    } catch (error: any) {
      console.error('Share failed:', error);
      alert('❌ ' + (error.message || 'Failed to share project'));
    }

    setSharing(false);
  };

  // Delete Project Handler
  const handleDeleteProject = async (project: Project) => {
    const hasPost = !project.is_draft && project.post_id;
    const message = hasPost 
      ? '⚠️ This will delete the project AND its shared post. Continue?' 
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
      resetPagination();
      await Promise.all([fetchUserProjects(0), fetchAllStats()]);
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('❌ ' + error.message);
    }
  };

  // Share Click Handler
  const handleShareClick = (project: Project) => {
    setShareProject(project);
    setShareCaption(project.title);
    setShowShareModal(true);
  };

  // Delete Post Handler
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
      resetPagination();
      await Promise.all([fetchUserPosts(0), fetchUserProjects(0), fetchAllStats()]);
    } catch (error: any) {
      console.error('Delete post error:', error);
      alert('❌ ' + error.message);
    }
  };

  // Delete Simulation Handler
  const handleDeleteSimulation = async (simulationId: string) => {
    if (!confirm('⚠️ Delete this simulation? This cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/simulations/${simulationId}`, {
        method: 'DELETE'
      });
      
      const { success, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to delete');
      }
      
      alert('✅ Simulation deleted successfully');
      resetPagination();
      await Promise.all([fetchUserSimulations(0), fetchAllStats()]);
    } catch (error: any) {
      console.error('Delete simulation error:', error);
      alert('❌ ' + error.message);
    }
  };

  // Delete Simulation Post Handler
  const handleDeleteSimulationPost = async (postId: string) => {
    if (!confirm('⚠️ Delete this shared simulation? The lab will remain saved.')) return;
    
    try {
      const { error } = await supabase
        .from('simulation_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      alert('✅ Simulation post deleted successfully');
      resetPagination();
      await Promise.all([fetchSharedSimulations(0), fetchAllStats()]);
    } catch (error: any) {
      console.error('Delete simulation post error:', error);
      alert('❌ ' + error.message);
    }
  };

  // Regenerate Simulation Handler
  const handleRegenerateSimulation = async (simulationId: string) => {
    if (!currentUser) return;
    
    if (!confirm('🔄 Regenerate this simulation? This will use ~10,000 tokens.')) return;

    try {
      const response = await fetch('/api/regenerate-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId,
          userId: currentUser.id
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Regeneration failed');
      }

      alert('✅ Regeneration started! Check back in a few minutes.');
      
      setSimulations(prev => prev.map(sim => 
        sim.id === simulationId 
          ? { ...sim, generation_status: 'generating' as const, generation_error: null }
          : sim
      ));
      
    } catch (error: any) {
      alert('❌ ' + error.message);
    }
  };

  // Preview Iframe Renderer - Courses
  const renderCoursePreviewIframe = (item: Post | Project) => {
    const htmlContent = item.session_id && item.first_page_content
      ? `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;overflow:hidden;}</style></head><body>${item.first_page_content}</body></html>`
      : `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;overflow:hidden;pointer-events:none;}</style></head><body>${item.html_code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')}</body></html>`;

    return (
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full pointer-events-none"
        sandbox=""
        loading="lazy"
      />
    );
  };

  // Preview Iframe Renderer - Simulations
  const renderSimulationPreviewIframe = (htmlCode: string) => {
    const htmlContent = `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;overflow:hidden;pointer-events:none;}</style></head><body>${htmlCode.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')}</body></html>`;

    return (
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full pointer-events-none"
        sandbox=""
        loading="lazy"
      />
    );
  };

  // Get Current Display Items
  const getCurrentDisplayItems = () => {
    switch(activeSection) {
      case 'feed': return feedPosts;
      case 'sim-trending': return trendingSimulations;
      case 'course-posts': return posts;
      case 'course-projects': return projects;
      case 'sim-shared': return sharedSimulations;
      case 'sim-labs': return simulations;
      case 'saved-courses': return savedPosts;
      case 'saved-labs': return savedSimulations;
      case 'subscription': return [];
      default: return [];
    }
  };

  // Time Ago Helper
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  const displayItems = getCurrentDisplayItems();

  // Loading State
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

  // Profile Not Found
  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
          <Link href="/">
            <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
              Go Home
            </button>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-b border-gray-800 z-50">
        <div className="px-6 py-3 flex items-start justify-between gap-6">
          {/* LEFT: Profile Info */}
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
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

            <div className="flex-1 min-w-0 pt-0.5">
              <h1 className="text-sm font-bold truncate">{profile.display_name}</h1>
              <p className="text-xs text-gray-500 truncate">@{profile.username}</p>
              {profile.bio && (
                <p className="text-xs text-gray-400 truncate mt-1 leading-relaxed">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* CENTER-LEFT: Token Section (Own Profile Only) */}
          {isOwnProfile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-xl border border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-xs font-bold">{tokenBalance.toLocaleString()}</span>
              </div>
              
              <div className="w-px h-4 bg-gray-700" />
              
              <motion.button
                onClick={() => setShowTokenModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-2.5 py-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-md font-semibold text-xs"
              >
                Buy
              </motion.button>
            </div>
          )}

          {/* RIGHT: Create Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg"
              >
                <Sparkles size={14} />
                Course
              </motion.button>
            </Link>

            <Link href="/create-simulation">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg"
              >
                <FlaskConical size={14} />
                Simulation
              </motion.button>
            </Link>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-56 bg-black/40 backdrop-blur-sm border-r border-gray-800 overflow-y-auto flex-shrink-0 flex flex-col">
          <div className="flex-1 p-3 space-y-1">
            {/* FEED SECTION */}
<div className="mb-4">
  <div className="flex items-center gap-2 px-2 py-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
    <TrendingUp size={11} />
    Feed
  </div>
  
  <button
    onClick={() => setActiveSection('feed')}
    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
      activeSection === 'feed'
        ? 'bg-white text-black'
        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
    }`}
  >
    <span>Trending Courses</span>
  </button>

  <button
    onClick={() => setActiveSection('sim-trending')}
    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all mt-2 ${
      activeSection === 'sim-trending'
        ? 'bg-white text-black'
        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
    }`}
  >
    <span>Trending Simulations</span>
  </button>
</div>

            {/* COURSES SECTION */}
            <div className="mb-4">
              <div className="flex items-center gap-2 px-2 py-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                <Code2 size={11} />
                Courses
              </div>
              
              <button
                onClick={() => setActiveSection('course-projects')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeSection === 'course-projects'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <span>My Courses</span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                  activeSection === 'course-projects' ? 'bg-black/10' : 'bg-gray-800 text-gray-500'
                }`}>
                  {stats.projects}
                </span>
              </button>

              <button
                onClick={() => setActiveSection('course-posts')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeSection === 'course-posts'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <span>Shared Courses</span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                  activeSection === 'course-posts' ? 'bg-black/10' : 'bg-gray-800 text-gray-500'
                }`}>
                  {stats.posts}
                </span>
              </button>
            </div>

            {/* SIMULATIONS SECTION */}
            <div className="mb-4">
              <div className="flex items-center gap-2 px-2 py-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                <FlaskConical size={11} />
                Simulations
              </div>
              
              {isOwnProfile && (
                <button
                  onClick={() => setActiveSection('sim-labs')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeSection === 'sim-labs'
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <span>My Simulations</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    activeSection === 'sim-labs' ? 'bg-black/10' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {stats.myLabs}
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveSection('sim-shared')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeSection === 'sim-shared'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <span>Shared Simulations</span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                  activeSection === 'sim-shared' ? 'bg-black/10' : 'bg-gray-800 text-gray-500'
                }`}>
                  {stats.sharedSimulations}
                </span>
              </button>
            </div>

            {/* SAVED SECTION */}
            {isOwnProfile && (
              <div className="mb-4">
                <div className="flex items-center gap-2 px-2 py-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                  <Bookmark size={11} />
                  Saved
                </div>
                
                <button
                  onClick={() => setActiveSection('saved-courses')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeSection === 'saved-courses'
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <span>Courses</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    activeSection === 'saved-courses' ? 'bg-black/10' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {stats.savedCourses}
                  </span>
                </button>

                <button
                  onClick={() => setActiveSection('saved-labs')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeSection === 'saved-labs'
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <span>Simulations</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    activeSection === 'saved-labs' ? 'bg-black/10' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {stats.savedLabs}
                  </span>
                </button>
              </div>
            )}

            {/* ACCOUNT SECTION */}
            {isOwnProfile && (
              <div className="mb-4">
                <div className="flex items-center gap-2 px-2 py-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                  <Crown size={11} />
                  Account
                </div>
                
                <button
                  onClick={() => setActiveSection('subscription')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeSection === 'subscription'
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <span>Subscription</span>
                </button>

                <Link href={`/profiles/${userId}/edit`}>
                  <button className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-gray-400 hover:bg-gray-800/50 hover:text-white mt-1">
                    <Edit size={11} />
                    <span>Edit Profile</span>
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* BOTTOM SECTION: Branding + Logout */}
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2">
                <Image 
                  src="/logo.png" 
                  alt="GarliQ" 
                  width={24} 
                  height={24}
                />
                <span className="text-sm font-bold">GarliQ</span>
              </div>
              
              {isOwnProfile && (
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/');
                  }}
                  className="p-1 hover:bg-gray-800/50 rounded-lg transition-colors group"
                  title="Logout"
                >
                  <LogOut size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1920px] mx-auto px-6 py-6">
            {/* SUBSCRIPTION VIEW */}
            {activeSection === 'subscription' && subscriptionStatus && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto"
              >
                <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Crown size={20} className="text-purple-400" />
                      <span className="font-bold text-lg">Subscription</span>
                    </div>
                    {getSubscriptionBadge()}
                  </div>

                  <div className="space-y-4 text-sm mb-8">
                    {subscriptionStatus.expires_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-2">
                          <Clock size={16} />
                          {subscriptionStatus.is_active ? 'Expires' : 'Expired'}:
                        </span>
                        <span className="font-medium">
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
                        <span className="text-gray-400">Days Remaining:</span>
                        <span className={`font-bold ${
                          subscriptionStatus.days_remaining <= 3 ? 'text-red-400' :
                          subscriptionStatus.days_remaining <= 7 ? 'text-orange-400' :
                          'text-green-400'
                        }`}>
                          {subscriptionStatus.days_remaining}
                        </span>
                      </div>
                    )}
                  </div>

                  {!subscriptionStatus.is_active ? (
                    <motion.button
                      onClick={() => setShowSubscriptionModal(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-3 bg-white text-black rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      <Crown size={18} />
                      Renew Subscription - $3/mo
                    </motion.button>
                  ) : subscriptionStatus.days_remaining <= 7 && (
                    <motion.button
                      onClick={() => setShowSubscriptionModal(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-3 border border-gray-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-800/50 transition-colors"
                    >
                      <Crown size={18} />
                      Extend Subscription
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* EMPTY STATE */}
            {activeSection !== 'subscription' && displayItems.length === 0 && !loading && (
              <div className="text-center py-32">
                <div className="mb-6 flex justify-center">
                  <Image 
                    src="/logo.png" 
                    alt="GarliQ" 
                    width={80} 
                    height={80}
                  />
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  {activeSection === 'feed' && 'No Trending Courses'}
                  {activeSection === 'sim-trending' && 'No Trending Simulations'}
                  {activeSection === 'course-posts' && 'No Posts Yet'}
                  {activeSection === 'course-projects' && 'No Projects Yet'}
                  {activeSection === 'sim-shared' && 'No Shared Simulations'}
                  {activeSection === 'sim-labs' && 'No Labs Yet'}
                  {activeSection === 'saved-courses' && 'No Saved Courses'}
                  {activeSection === 'saved-labs' && 'No Saved Labs'}
                </h2>
                <p className="text-gray-400 mb-8 text-sm">
                  {activeSection === 'feed' && 'Check back later for trending content'}
                  {activeSection === 'sim-trending' && 'Check back later for trending simulations'}
                  {activeSection === 'course-posts' && 'Share your first creation'}
                  {activeSection === 'course-projects' && 'Start building something'}
                  {activeSection === 'sim-shared' && 'Publish your first lab'}
                  {activeSection === 'sim-labs' && 'Create your first simulation'}
                  {(activeSection === 'saved-courses' || activeSection === 'saved-labs') && 'Start saving content you love'}
                </p>
                {isOwnProfile && !activeSection.startsWith('saved') && activeSection !== 'feed' && activeSection !== 'sim-trending' && (
                  <div className="flex items-center justify-center gap-3">
                    {activeSection.startsWith('course') && (
                      <Link href="/create">
                        <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:bg-gray-200 transition-colors">
                          <Plus size={18} />
                          Create Course
                        </button>
                      </Link>
                    )}
                    {activeSection.startsWith('sim') && (
                      <Link href="/create-simulation">
                        <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:bg-gray-200 transition-colors">
                          <Plus size={18} />
                          Create Lab
                        </button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* CONTENT GRID - Will continue in next message due to length */}
            {activeSection !== 'subscription' && displayItems.length > 0 && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                  {/* ========== FEED POSTS CARDS ========== */}
                  {activeSection === 'feed' && feedPosts.map((post, index) => (
                    <motion.div
                      key={`${post.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                      className="group relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
                    >
                      {/* Preview with 16:9 Aspect Ratio */}
                      <Link href={`/post/${post.id}`}>
                        <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black overflow-hidden cursor-pointer">
                          <div className="absolute inset-0">
                            {renderCoursePreviewIframe(post)}
                          </div>
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                          
                          {/* View Icon Overlay on Hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-transform">
                              <Eye size={18} className="text-black" />
                            </div>
                          </div>

                          {/* Author Info Overlay - Top Left */}
                          <div className="absolute top-3 left-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/profiles/${post.user_id}`);
                              }}
                              className="flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-full px-2.5 py-1.5 hover:bg-black/80 transition-colors cursor-pointer"
                            >
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-[10px] font-bold overflow-hidden">
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
                              <span className="text-xs font-semibold text-white pr-1">{post.profiles?.display_name || 'Anonymous'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Card Content */}
                      <div className="p-3.5">
                        {/* Title */}
                        <Link href={`/post/${post.id}`}>
                          <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 mb-2 hover:text-purple-400 transition-colors cursor-pointer">
                            {post.caption}
                          </h3>
                        </Link>

                        {/* Prompt Section - Compact */}
                        {post.prompt_visible && post.prompt && (
                          <div className="mb-2.5 bg-purple-500/5 border border-purple-500/10 rounded-lg p-2">
                            <p className="text-[10px] text-gray-400 line-clamp-1 font-mono">{post.prompt}</p>
                          </div>
                        )}

                        {/* Stats and Actions Bar */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-gray-800/50">
                          <div className="flex items-center gap-3">
                            {/* Like */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikeCourse(post.id, post.is_liked || false);
                              }}
                              className="flex items-center gap-1.5 hover:scale-105 transition-transform group/like"
                            >
                              {post.is_liked ? (
                                <Image 
                                  src="/logo.png" 
                                  alt="Liked" 
                                  width={16} 
                                  height={16}
                                />
                              ) : (
                                <Heart size={16} className="text-gray-500 group-hover/like:text-purple-400 transition-colors" />
                              )}
                              <span className="text-[11px] font-semibold text-gray-400 group-hover/like:text-gray-300">{post.likes_count || 0}</span>
                            </button>

                            {/* Time Ago */}
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Clock size={12} />
                              <span className="text-[11px] font-medium">{getTimeAgo(post.created_at)}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveCourse(post.id, post.is_saved || false);
                              }}
                              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/save"
                            >
                              <Bookmark 
                                size={14} 
                                className={post.is_saved ? 'fill-purple-400 text-purple-400' : 'text-gray-500 group-hover/save:text-purple-400 transition-colors'} 
                              />
                            </button>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSharePost(post);
                              }}
                              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/share"
                            >
                              <Share2 size={14} className="text-gray-500 group-hover/share:text-blue-400 transition-colors" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* ========== TRENDING SIMULATIONS CARDS (NEW) ========== */}
                  {activeSection === 'sim-trending' && trendingSimulations.map((sim, index) => (
                    <motion.div
                      key={`${sim.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                      className="group relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10"
                    >
                      {/* Preview */}
                      <Link href={`/simulation/${sim.id}`}>
                        <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black overflow-hidden cursor-pointer">
                          <div className="absolute inset-0">
                            {renderSimulationPreviewIframe(sim.html_code)}
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-cyan-400/90 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-transform">
                              <FlaskConical size={18} className="text-black" />
                            </div>
                          </div>

                          {/* Author Info Overlay - Top Left */}
                          <div className="absolute top-3 left-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/profiles/${sim.user_id}`);
                              }}
                              className="flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-full px-2.5 py-1.5 hover:bg-black/80 transition-colors cursor-pointer"
                            >
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                {sim.profiles?.avatar_url ? (
                                  <img 
                                    src={sim.profiles.avatar_url} 
                                    alt={sim.profiles.display_name || 'User'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{sim.profiles?.display_name?.[0]?.toUpperCase() || '?'}</span>
                                )}
                              </div>
                              <span className="text-xs font-semibold text-white pr-1">{sim.profiles?.display_name || 'Anonymous'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Card Content */}
                      <div className="p-3.5">
                        <Link href={`/simulation/${sim.id}`}>
                          <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 mb-2 hover:text-cyan-400 transition-colors cursor-pointer">
                            {sim.caption}
                          </h3>
                        </Link>

                        <div className="flex items-center justify-between pt-2.5 border-t border-gray-800/50">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikeSimulation(sim.id, sim.is_liked || false);
                              }}
                              className="flex items-center gap-1.5 hover:scale-105 transition-transform group/like"
                            >
                              {sim.is_liked ? (
                                <Image 
                                  src="/logo.png" 
                                  alt="Liked" 
                                  width={16} 
                                  height={16}
                                />
                              ) : (
                                <Heart size={16} className="text-gray-500 group-hover/like:text-cyan-400 transition-colors" />
                              )}
                              <span className="text-[11px] font-semibold text-gray-400 group-hover/like:text-gray-300">{sim.likes_count || 0}</span>
                            </button>

                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Clock size={12} />
                              <span className="text-[11px] font-medium">{getTimeAgo(sim.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveSimulation(sim.id, sim.is_saved || false);
                              }}
                              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/save"
                            >
                              <Bookmark 
                                size={14} 
                                className={sim.is_saved ? 'fill-cyan-400 text-cyan-400' : 'text-gray-500 group-hover/save:text-cyan-400 transition-colors'} 
                              />
                            </button>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareSimulation(sim);
                              }}
                              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/share"
                            >
                              <Share2 size={14} className="text-gray-500 group-hover/share:text-cyan-400 transition-colors" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* ========== COURSE POSTS CARDS ========== */}
                  {activeSection === 'course-posts' && posts.map((post, index) => (
                    <motion.div
                      key={`${post.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                      className="group relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
                    >
                      {/* Preview */}
                      <Link href={`/post/${post.id}`}>
                        <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black overflow-hidden cursor-pointer">
                          <div className="absolute inset-0">
                            {renderCoursePreviewIframe(post)}
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-transform">
                              <Eye size={18} className="text-black" />
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Card Content */}
                      <div className="p-3.5">
                        <Link href={`/post/${post.id}`}>
                          <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 mb-2 hover:text-purple-400 transition-colors cursor-pointer">
                            {post.caption}
                          </h3>
                        </Link>

                        {post.prompt_visible && post.prompt && (
                          <div className="mb-2.5 bg-purple-500/5 border border-purple-500/10 rounded-lg p-2">
                            <p className="text-[10px] text-gray-400 line-clamp-1 font-mono">{post.prompt}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2.5 border-t border-gray-800/50">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikeCourse(post.id, post.is_liked || false);
                              }}
                              className="flex items-center gap-1.5 hover:scale-105 transition-transform group/like"
                            >
                              {post.is_liked ? (
                                <Image 
                                  src="/logo.png" 
                                  alt="Liked" 
                                  width={16} 
                                  height={16}
                                />
                              ) : (
                                <Heart size={16} className="text-gray-500 group-hover/like:text-purple-400 transition-colors" />
                              )}
                              <span className="text-[11px] font-semibold text-gray-400 group-hover/like:text-gray-300">{post.likes_count || 0}</span>
                            </button>

                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Clock size={12} />
                              <span className="text-[11px] font-medium">{getTimeAgo(post.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveCourse(post.id, post.is_saved || false);
                              }}
                              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/save"
                            >
                              <Bookmark 
                                size={14} 
                                className={post.is_saved ? 'fill-purple-400 text-purple-400' : 'text-gray-500 group-hover/save:text-purple-400 transition-colors'} 
                              />
                            </button>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSharePost(post);
                              }}
                              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/share"
                            >
                              <Share2 size={14} className="text-gray-500 group-hover/share:text-blue-400 transition-colors" />
                            </button>

                            {isOwnProfile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePost(post.id);
                                }}
                                className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/delete"
                              >
                                <Trash2 size={14} className="text-gray-500 group-hover/delete:text-red-400 transition-colors" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {/* ========== COURSE PROJECTS CARDS ========== */}
                  {activeSection === 'course-projects' && projects.map((project, index) => (
                    <motion.div
                      key={`${project.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                      className="group relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
                    >
                      {/* Status Badge */}
                      {isOwnProfile && (
                        <div className="absolute top-2.5 right-2.5 z-10">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold shadow-lg backdrop-blur-sm ${
                            project.is_draft 
                              ? 'bg-yellow-500/90 text-black' 
                              : 'bg-green-500/90 text-black'
                          }`}>
                            {project.is_draft ? 'Draft' : 'Live'}
                          </span>
                        </div>
                      )}

                      {/* Preview */}
                      <Link href={`/projects/${project.id}`}>
                        <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black overflow-hidden cursor-pointer">
                          <div className="absolute inset-0">
                            {renderCoursePreviewIframe(project)}
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-transform">
                              <Eye size={18} className="text-black" />
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Card Content */}
                      <div className="p-3.5">
                        <Link href={`/projects/${project.id}`}>
                          <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 mb-2 hover:text-purple-400 transition-colors cursor-pointer">
                            {project.title || 'Untitled Project'}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-1.5 text-gray-500 mb-2.5">
                          <Clock size={12} />
                          <span className="text-[11px] font-medium">{getTimeAgo(project.updated_at)}</span>
                        </div>

                        {/* Action Buttons */}
                        {isOwnProfile && (
                          <div className="flex items-center gap-2 pt-2.5 border-t border-gray-800/50">
                            {project.session_id && (
                              <Link href={`/studio/${project.session_id}`} className="flex-1">
                                <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-lg text-[11px] font-semibold hover:bg-gray-200 transition-colors">
                                  <Edit size={13} />
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
                                className="p-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                title="Share"
                              >
                                <Share2 size={14} />
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project);
                              }}
                              className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* ========== SHARED SIMULATIONS CARDS ========== */}
                  {activeSection === 'sim-shared' && sharedSimulations.map((sim, index) => (
                    <motion.div
                      key={`${sim.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                      className="group relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10"
                    >
                      {/* Preview */}
                      <Link href={`/simulation/${sim.id}`}>
                        <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black overflow-hidden cursor-pointer">
                          <div className="absolute inset-0">
                            {renderSimulationPreviewIframe(sim.html_code)}
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-cyan-400/90 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-transform">
                              <FlaskConical size={18} className="text-black" />
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Card Content */}
                      <div className="p-3.5">
                        <Link href={`/simulation/${sim.id}`}>
                          <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 mb-2 hover:text-cyan-400 transition-colors cursor-pointer">
                            {sim.caption}
                          </h3>
                        </Link>

                        <div className="flex items-center justify-between pt-2.5 border-t border-gray-800/50">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikeSimulation(sim.id, sim.is_liked || false);
                              }}
                              className="flex items-center gap-1.5 hover:scale-105 transition-transform group/like"
                            >
                              {sim.is_liked ? (
                                <Image 
                                  src="/logo.png" 
                                  alt="Liked" 
                                  width={16} 
                                  height={16}
                                />
                              ) : (
                                <Heart size={16} className="text-gray-500 group-hover/like:text-cyan-400 transition-colors" />
                              )}
                              <span className="text-[11px] font-semibold text-gray-400 group-hover/like:text-gray-300">{sim.likes_count || 0}</span>
                            </button>

                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Clock size={12} />
                              <span className="text-[11px] font-medium">{getTimeAgo(sim.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveSimulation(sim.id, sim.is_saved || false);
                              }}
                              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/save"
                            >
                              <Bookmark 
                                size={14} 
                                className={sim.is_saved ? 'fill-cyan-400 text-cyan-400' : 'text-gray-500 group-hover/save:text-cyan-400 transition-colors'} 
                              />
                            </button>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareSimulation(sim);
                              }}
                              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/share"
                            >
                              <Share2 size={14} className="text-gray-500 group-hover/share:text-cyan-400 transition-colors" />
                            </button>

                            {isOwnProfile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSimulationPost(sim.id);
                                }}
                                className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/delete"
                              >
                                <Trash2 size={14} className="text-gray-500 group-hover/delete:text-red-400 transition-colors" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* ========== MY LABS CARDS ========== */}
                  {activeSection === 'sim-labs' && simulations.map((sim, index) => (
                    <motion.div
                      key={`${sim.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                      className="group relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10"
                    >
                      {/* Preview or Status */}
                      {sim.generation_status === 'completed' && sim.html_code ? (
                        <Link href={`/simulation-studio/${sim.id}`}>
                          <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black overflow-hidden cursor-pointer">
                            <div className="absolute inset-0">
                              {renderSimulationPreviewIframe(sim.html_code)}
                            </div>
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                            
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-12 h-12 rounded-full bg-cyan-400/90 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                <Eye size={18} className="text-black" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                          {sim.generation_status === 'generating' && (
                            <div className="text-center">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="text-4xl mb-2"
                              >
                                🧄
                              </motion.div>
                              <p className="text-[11px] text-cyan-400 font-semibold">Generating...</p>
                            </div>
                          )}
                          {sim.generation_status === 'failed' && (
                            <div className="text-center px-4">
                              <div className="text-3xl mb-2">💥</div>
                              <p className="text-[11px] text-red-400 line-clamp-2 font-medium">{sim.generation_error || 'Generation failed'}</p>
                            </div>
                          )}
                          {sim.generation_status === 'pending' && (
                            <div className="text-center px-4">
                              <div className="text-3xl mb-2">⏳</div>
                              <p className="text-[11px] text-yellow-400 font-semibold">Pending...</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="p-3.5">
                        <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 mb-2">
                          {sim.title || 'Untitled Lab'}
                        </h3>

                        <div className="flex items-center gap-1.5 text-gray-500 mb-2.5">
                          <Clock size={12} />
                          <span className="text-[11px] font-medium">{getTimeAgo(sim.updated_at)}</span>
                        </div>

                        {/* Action Buttons */}
                        {isOwnProfile && (
                          <div className="flex items-center gap-2 pt-2.5 border-t border-gray-800/50">
                            {sim.generation_status === 'completed' && sim.html_code && (
                              <Link href={`/simulation-studio/${sim.id}`} className="flex-1">
                                <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-lg text-[11px] font-semibold hover:bg-gray-200 transition-colors">
                                  <Eye size={13} />
                                  View
                                </button>
                              </Link>
                            )}
                            
                            {sim.generation_status === 'failed' && (
                              <button
                                onClick={() => handleRegenerateSimulation(sim.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-lg text-[11px] font-semibold transition-colors"
                              >
                                <RotateCcw size={13} />
                                Retry
                              </button>
                            )}
                            
                            {sim.generation_status === 'generating' && (
                              <button
                                disabled
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-700 rounded-lg text-[11px] font-semibold cursor-not-allowed opacity-50"
                              >
                                <Loader2 size={13} className="animate-spin" />
                                Generating...
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteSimulation(sim.id)}
                              className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {/* ========== SAVED COURSES CARDS ========== */}
                  {activeSection === 'saved-courses' && savedPosts.map((post, index) => (
                    <motion.div
                      key={`${post.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                      className="group relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
                    >
                      {/* Preview */}
                      <Link href={`/post/${post.id}`}>
                        <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black overflow-hidden cursor-pointer">
                          <div className="absolute inset-0">
                            {renderCoursePreviewIframe(post)}
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-transform">
                              <Eye size={18} className="text-black" />
                            </div>
                          </div>

                          {/* Author Info Overlay */}
                          <div className="absolute top-3 left-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/profiles/${post.user_id}`);
                              }}
                              className="flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-full px-2.5 py-1.5 hover:bg-black/80 transition-colors cursor-pointer"
                            >
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-[10px] font-bold overflow-hidden">
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
                              <span className="text-xs font-semibold text-white pr-1">{post.profiles?.display_name || 'Anonymous'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Card Content */}
                      <div className="p-3.5">
                        <Link href={`/post/${post.id}`}>
                          <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 mb-2 hover:text-purple-400 transition-colors cursor-pointer">
                            {post.caption}
                          </h3>
                        </Link>

                        {post.prompt_visible && post.prompt && (
                          <div className="mb-2.5 bg-purple-500/5 border border-purple-500/10 rounded-lg p-2">
                            <p className="text-[10px] text-gray-400 line-clamp-1 font-mono">{post.prompt}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2.5 border-t border-gray-800/50">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikeCourse(post.id, post.is_liked || false);
                              }}
                              className="flex items-center gap-1.5 hover:scale-105 transition-transform group/like"
                            >
                              {post.is_liked ? (
                                <Image 
                                  src="/logo.png" 
                                  alt="Liked" 
                                  width={16} 
                                  height={16}
                                />
                              ) : (
                                <Heart size={16} className="text-gray-500 group-hover/like:text-purple-400 transition-colors" />
                              )}
                              <span className="text-[11px] font-semibold text-gray-400 group-hover/like:text-gray-300">{post.likes_count || 0}</span>
                            </button>

                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Clock size={12} />
                              <span className="text-[11px] font-medium">{getTimeAgo(post.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveCourse(post.id, post.is_saved || false);
                              }}
                              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/save"
                            >
                              <Bookmark 
                                size={14} 
                                className={post.is_saved ? 'fill-purple-400 text-purple-400' : 'text-gray-500 group-hover/save:text-purple-400 transition-colors'} 
                              />
                            </button>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSharePost(post);
                              }}
                              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/share"
                            >
                              <Share2 size={14} className="text-gray-500 group-hover/share:text-blue-400 transition-colors" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* ========== SAVED LABS CARDS ========== */}
                  {activeSection === 'saved-labs' && savedSimulations.map((sim, index) => (
                    <motion.div
                      key={`${sim.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index % 12, 11) * 0.03 }}
                      className="group relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10"
                    >
                      {/* Preview */}
                      <Link href={`/simulation/${sim.id}`}>
                        <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black overflow-hidden cursor-pointer">
                          <div className="absolute inset-0">
                            {renderSimulationPreviewIframe(sim.html_code)}
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-cyan-400/90 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-transform">
                              <FlaskConical size={18} className="text-black" />
                            </div>
                          </div>

                          {/* Author Info Overlay */}
                          <div className="absolute top-3 left-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/profiles/${sim.user_id}`);
                              }}
                              className="flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-full px-2.5 py-1.5 hover:bg-black/80 transition-colors cursor-pointer"
                            >
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                {sim.profiles?.avatar_url ? (
                                  <img 
                                    src={sim.profiles.avatar_url} 
                                    alt={sim.profiles.display_name || 'User'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{sim.profiles?.display_name?.[0]?.toUpperCase() || '?'}</span>
                                )}
                              </div>
                              <span className="text-xs font-semibold text-white pr-1">{sim.profiles?.display_name || 'Anonymous'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Card Content */}
                      <div className="p-3.5">
                        <Link href={`/simulation/${sim.id}`}>
                          <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 mb-2 hover:text-cyan-400 transition-colors cursor-pointer">
                            {sim.caption}
                          </h3>
                        </Link>

                        <div className="flex items-center justify-between pt-2.5 border-t border-gray-800/50">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikeSimulation(sim.id, sim.is_liked || false);
                              }}
                              className="flex items-center gap-1.5 hover:scale-105 transition-transform group/like"
                            >
                              {sim.is_liked ? (
                                <Image 
                                  src="/logo.png" 
                                  alt="Liked" 
                                  width={16} 
                                  height={16}
                                />
                              ) : (
                                <Heart size={16} className="text-gray-500 group-hover/like:text-cyan-400 transition-colors" />
                              )}
                              <span className="text-[11px] font-semibold text-gray-400 group-hover/like:text-gray-300">{sim.likes_count || 0}</span>
                            </button>

                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Clock size={12} />
                              <span className="text-[11px] font-medium">{getTimeAgo(sim.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveSimulation(sim.id, sim.is_saved || false);
                              }}
                              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/save"
                            >
                              <Bookmark 
                                size={14} 
                                className={sim.is_saved ? 'fill-cyan-400 text-cyan-400' : 'text-gray-500 group-hover/save:text-cyan-400 transition-colors'} 
                              />
                            </button>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareSimulation(sim);
                              }}
                              className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group/share"
                            >
                              <Share2 size={14} className="text-gray-500 group-hover/share:text-cyan-400 transition-colors" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* INFINITE SCROLL TRIGGER */}
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
                    <p className="text-gray-500 text-sm">You've reached the end 🎉</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SHARE PROJECT MODAL */}
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
              className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Share to Feed</h3>
                <button onClick={() => !sharing && setShowShareModal(false)} disabled={sharing}>
                  <span className="text-2xl text-gray-400 hover:text-white">✕</span>
                </button>
              </div>

              <input
                type="text"
                value={shareCaption}
                onChange={(e) => setShareCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-4 py-3 bg-black/50 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none mb-4 text-sm"
                disabled={sharing}
              />

              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promptVisible}
                  onChange={(e) => setPromptVisible(e.target.checked)}
                  className="w-4 h-4"
                  disabled={sharing}
                />
                <span className="text-sm text-gray-400">Share prompt publicly</span>
              </label>

              <motion.button
                onClick={handleShareProject}
                disabled={!shareCaption.trim() || sharing}
                whileHover={!sharing ? { scale: 1.02 } : {}}
                whileTap={!sharing ? { scale: 0.98 } : {}}
                className="w-full bg-white text-black py-3 rounded-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* MODALS */}
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