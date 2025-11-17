'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import TokenPurchaseModal from '@/components/TokenPurchaseModal';
import SubscriptionModal from '@/components/SubscriptionModal';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardContent from '@/components/dashboard/DashboardContent';
import ShareProjectModal from '@/components/dashboard/ShareProjectModal';
import {
  Profile,
  Post,
  Project,
  Simulation,
  SimulationPost,
  SubscriptionStatus,
  ActiveSection,
  DashboardStats,
} from '@/components/dashboard/types';

const ITEMS_PER_PAGE = 12;

export default function DashboardPage() {
  const router = useRouter();

  // User & Profile State
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Content State
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [sharedSimulations, setSharedSimulations] = useState<SimulationPost[]>([]);
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

  // Token & Subscription State
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Stats State
  const [stats, setStats] = useState<DashboardStats>({
    posts: 0,
    projects: 0,
    sharedSimulations: 0,
    myLabs: 0,
    savedCourses: 0,
    savedLabs: 0,
  });

  // Initial Load Effects
  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
      fetchAllStats();
      fetchTokenBalance();
      fetchSubscriptionStatus();
    }
  }, [currentUser]);

  useEffect(() => {
    if (profile && currentUser) {
      setIsOwnProfile(currentUser.id === profile.id);
    }
  }, [currentUser, profile]);

  useEffect(() => {
    resetPagination();
    loadContent();
  }, [activeSection]);

  // User Authentication Check
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/');
      return;
    }
    setCurrentUser(session.user);
  };

  // Profile Fetch
  const fetchProfile = async () => {
    if (!currentUser) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (data) setProfile(data);
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

  // Stats Fetch
  const fetchAllStats = async () => {
    if (!currentUser) return;

    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id);

    const { count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id);

    const { count: sharedSimsCount } = await supabase
      .from('simulation_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id);

    const { count: myLabsCount } = await supabase
      .from('simulations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id);

    const { count: savedCoursesCount } = await supabase
      .from('saves')
      .select('post_id', { count: 'exact', head: true })
      .eq('user_id', currentUser.id);

    const { count: savedLabsCount } = await supabase
      .from('simulation_saves')
      .select('post_id', { count: 'exact', head: true })
      .eq('user_id', currentUser.id);

    setStats({
      posts: postsCount || 0,
      projects: projectsCount || 0,
      sharedSimulations: sharedSimsCount || 0,
      myLabs: myLabsCount || 0,
      savedCourses: savedCoursesCount || 0,
      savedLabs: savedLabsCount || 0,
    });
  };

  // Pagination Reset
  const resetPagination = () => {
    setPosts([]);
    setProjects([]);
    setSavedPosts([]);
    setSimulations([]);
    setSharedSimulations([]);
    setSavedSimulations([]);
    setFeedPosts([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
  };

  // Content Loading Router
  const loadContent = () => {
    switch (activeSection) {
      case 'feed':
        fetchFeedPosts(0);
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

  // Feed Posts Fetch
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
        profiles: profilesMap.get(post.user_id),
      }));

      if (currentUser) {
        postsWithProfiles = await Promise.all(
          postsWithProfiles.map(async (post) => {
            const [likeData, saveData] = await Promise.all([
              supabase.from('likes').select('*').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle(),
              supabase.from('saves').select('*').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle(),
            ]);

            return {
              ...post,
              is_liked: !!likeData.data,
              is_saved: !!saveData.data,
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

  // User Posts Fetch
  const fetchUserPosts = async (pageNum: number) => {
    if (!currentUser) return;

    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('user_id', currentUser.id)
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
        first_page_content: post.session_id ? firstPagesMap.get(post.session_id) || null : null,
      }));

      if (currentUser) {
        postsWithFirstPage = await Promise.all(
          postsWithFirstPage.map(async (post) => {
            const [likeData, saveData] = await Promise.all([
              supabase.from('likes').select('*').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle(),
              supabase.from('saves').select('*').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle(),
            ]);

            return {
              ...post,
              is_liked: !!likeData.data,
              is_saved: !!saveData.data,
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
    if (!currentUser) return;

    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', currentUser.id)
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
        first_page_content: project.session_id ? firstPagesMap.get(project.session_id) || null : null,
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
            supabase.from('saves').select('*').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle(),
          ]);

          return {
            ...post,
            is_liked: !!likeData.data,
            is_saved: !!saveData.data,
            first_page_content: post.session_id ? firstPagesMap.get(post.session_id) || null : null,
            profiles: profilesMap.get(post.user_id),
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
    if (!currentUser) return;

    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('simulations')
      .select('*', { count: 'exact' })
      .eq('user_id', currentUser.id)
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
    if (!currentUser) return;

    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('simulation_posts')
      .select('*', { count: 'exact' })
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Fetch shared simulations error:', error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (data) {
      let postsWithInteractions = data;
      if (currentUser) {
        postsWithInteractions = await Promise.all(
          data.map(async (post) => {
            const [likeData, saveData] = await Promise.all([
              supabase.from('simulation_likes').select('*').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle(),
              supabase.from('simulation_saves').select('*').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle(),
            ]);

            return {
              ...post,
              is_liked: !!likeData.data,
              is_saved: !!saveData.data,
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
            supabase.from('simulation_saves').select('*').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle(),
          ]);

          return {
            ...post,
            is_liked: !!likeData.data,
            is_saved: !!saveData.data,
            profiles: profilesMap.get(post.user_id),
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
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);

      switch (activeSection) {
        case 'feed':
          fetchFeedPosts(nextPage);
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
          post.id === postId
            ? {
                ...post,
                is_liked: !!likeCheck,
                likes_count: updatedPost.likes_count || 0,
                comments_count: updatedPost.comments_count || 0,
              }
            : post;

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
          post.id === postId
            ? {
                ...post,
                is_liked: !!likeCheck,
                likes_count: updatedPost.likes_count || 0,
                comments_count: updatedPost.comments_count || 0,
              }
            : post;

        setSharedSimulations(prevPosts => prevPosts.map(updatePost));
        setSavedSimulations(prevPosts => prevPosts.map(updatePost));
      }
    } catch (error: any) {
      console.error('Like simulation error:', error);
    }
  };

  // Save Handler - Course Posts
  const handleSaveCourse = async (postId: string, isSaved: boolean) => {
    if (!currentUser) return;

    const updatePost = (post: Post) => (post.id === postId ? { ...post, is_saved: !isSaved } : post);

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
      setPosts(prevPosts => prevPosts.map(post => (post.id === postId ? { ...post, is_saved: isSaved } : post)));
      setSavedPosts(prevPosts => prevPosts.map(post => (post.id === postId ? { ...post, is_saved: isSaved } : post)));
      setFeedPosts(prevPosts => prevPosts.map(post => (post.id === postId ? { ...post, is_saved: isSaved } : post)));
    }
  };

  // Save Handler - Simulations
  const handleSaveSimulation = async (postId: string, isSaved: boolean) => {
    if (!currentUser) return;

    const updatePost = (post: SimulationPost) => (post.id === postId ? { ...post, is_saved: !isSaved } : post);

    setSharedSimulations(prevPosts => prevPosts.map(updatePost));
    setSavedSimulations(prevPosts => prevPosts.map(updatePost));

    try {
      if (isSaved) {
        await supabase.from('simulation_saves').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      } else {
        await supabase.from('simulation_saves').insert({ post_id: postId, user_id: currentUser.id });
      }
    } catch (error) {
      console.error('Save simulation error:', error);
      setSharedSimulations(prevPosts => prevPosts.map(post => (post.id === postId ? { ...post, is_saved: isSaved } : post)));
      setSavedSimulations(prevPosts => prevPosts.map(post => (post.id === postId ? { ...post, is_saved: isSaved } : post)));
    }
  };

  // Share Handler - Course Post
  const handleSharePost = async (post: Post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.caption} | Garliq`,
          url: shareUrl,
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
          title: `${post.caption} | Garliq Lab`,
          url: shareUrl,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied!');
    }
  };

  // Share Project Handler
  const handleShareProjectSubmit = async (caption: string, promptVisible: boolean) => {
    if (!shareProject || !currentUser) return;

    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: shareProject.id,
        caption,
        promptVisible,
        userId: currentUser.id,
      }),
    });

    const { success, error } = await response.json();

    if (!success || error) {
      throw new Error(error || 'Failed to publish');
    }

    setShowShareModal(false);
    setShareProject(null);

    resetPagination();
    await Promise.all([fetchUserProjects(0), fetchAllStats()]);

    alert('✅ Project published to feed!');
  };

  // Delete Project Handler
  const handleDeleteProject = async (project: Project) => {
    const hasPost = !project.is_draft && project.post_id;
    const message = hasPost
      ? '⚠️ This will delete the project AND its shared post. Continue?'
      : 'Delete this project? This cannot be undone.';

    if (!confirm(message)) return;

    try {
      const response = await fetch(`/api/projects?projectId=${project.id}&userId=${currentUser?.id}`, {
        method: 'DELETE',
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
    setShowShareModal(true);
  };

  // Delete Post Handler
  const handleDeletePost = async (postId: string) => {
    if (!confirm('⚠️ Delete this post? The project will remain saved.')) return;

    try {
      const response = await fetch(`/api/posts/${postId}?userId=${currentUser?.id}`, {
        method: 'DELETE',
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
        method: 'DELETE',
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
      const { error } = await supabase.from('simulation_posts').delete().eq('id', postId).eq('user_id', currentUser?.id);

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
          userId: currentUser.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Regeneration failed');
      }

      alert('✅ Regeneration started! Check back in a few minutes.');

      setSimulations(prev =>
        prev.map(sim =>
          sim.id === simulationId ? { ...sim, generation_status: 'generating' as const, generation_error: null } : sim
        )
      );
    } catch (error: any) {
      alert('❌ ' + error.message);
    }
  };

  // Section Change Handler
  const handleSectionChange = (section: ActiveSection) => {
    setActiveSection(section);
  };

  // Loading State
  if (!profile || !currentUser) {
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
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 bg-black pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* HEADER */}
      <DashboardHeader profile={profile} tokenBalance={tokenBalance} onBuyTokens={() => setShowTokenModal(true)} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SIDEBAR */}
        <DashboardSidebar
          activeSection={activeSection}
          stats={stats}
          userId={currentUser.id}
          isOwnProfile={isOwnProfile}
          onSectionChange={handleSectionChange}
        />

        {/* CONTENT */}
        <DashboardContent
          activeSection={activeSection}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          isOwnProfile={isOwnProfile}
          feedPosts={feedPosts}
          posts={posts}
          projects={projects}
          savedPosts={savedPosts}
          simulations={simulations}
          sharedSimulations={sharedSimulations}
          savedSimulations={savedSimulations}
          subscriptionStatus={subscriptionStatus}
          onLoadMore={handleLoadMore}
          onLikeCourse={handleLikeCourse}
          onSaveCourse={handleSaveCourse}
          onShareCourse={handleSharePost}
          onDeletePost={handleDeletePost}
          onShareProject={handleShareClick}
          onDeleteProject={handleDeleteProject}
          onLikeSimulation={handleLikeSimulation}
          onSaveSimulation={handleSaveSimulation}
          onShareSimulation={handleShareSimulation}
          onDeleteSimulation={handleDeleteSimulation}
          onDeleteSimulationPost={handleDeleteSimulationPost}
          onRegenerateSimulation={handleRegenerateSimulation}
          onSubscribe={() => setShowSubscriptionModal(true)}
        />
      </div>

      {/* MODALS */}
      <ShareProjectModal
        isOpen={showShareModal}
        project={shareProject}
        onClose={() => setShowShareModal(false)}
        onShare={handleShareProjectSubmit}
      />

      <TokenPurchaseModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        userId={currentUser.id}
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