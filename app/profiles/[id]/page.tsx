'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Calendar, Heart, Code2, Bookmark, GitFork, Settings, Share2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
}

interface Project {
  id: string;
  title: string;
  html_code: string;
  created_at: string;
}

type TabType = 'posts' | 'projects' | 'saved';

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
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [selectedItem, setSelectedItem] = useState<Post | Project | null>(null);
  const [stats, setStats] = useState({ 
    posts: 0, 
    totalLikes: 0,
    projects: 0,
    saves: 0,
    forks: 0
  });

  useEffect(() => {
    checkUser();
    fetchProfile();
    fetchUserPosts();
    fetchUserProjects();
    if (currentUser?.id === userId) {
      fetchSavedPosts();
    }
  }, [userId, currentUser?.id]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUser(session.user);
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) setProfile(data);
    setLoading(false);
  };

  const fetchUserPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setPosts(data);
      const totalLikes = data.reduce((sum, post) => sum + post.likes_count, 0);
      setStats(prev => ({ 
        ...prev, 
        posts: data.length, 
        totalLikes 
      }));
    }
  };

  const fetchUserProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setProjects(data);
      setStats(prev => ({ ...prev, projects: data.length }));
    }
  };

  const fetchSavedPosts = async () => {
    if (!currentUser) return;

    const { data: saves } = await supabase
      .from('saves')
      .select('post_id')
      .eq('user_id', currentUser.id);

    if (saves && saves.length > 0) {
      const postIds = saves.map(s => s.post_id);
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)
        .order('created_at', { ascending: false });

      if (posts) {
        setSavedPosts(posts);
        setStats(prev => ({ ...prev, saves: posts.length }));
      }
    }
  };

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/profile/${userId}`;
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <ArrowLeft size={24} />
            <span className="text-3xl">🧄</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-2.5 hover:bg-gray-800 rounded-full transition-colors"
            >
              <Share2 size={20} className="text-gray-400" />
            </button>

            {isOwnProfile && (
              <Link href="/profile/edit">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-full font-semibold flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit Profile
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-6xl font-black flex-shrink-0">
            {profile.display_name[0].toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-black mb-2">{profile.display_name}</h1>
            <p className="text-gray-500 mb-4">@{profile.username}</p>
            
            {profile.bio && (
              <p className="text-gray-300 mb-6 leading-relaxed max-w-2xl">{profile.bio}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
              <Calendar size={16} />
              <span>
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Posts', value: stats.posts, icon: Code2, color: 'text-purple-400' },
                { label: 'Garlics', value: stats.totalLikes, icon: Heart, color: 'text-pink-400' },
                { label: 'Projects', value: stats.projects, icon: GitFork, color: 'text-green-400' },
                { label: 'Saved', value: stats.saves, icon: Bookmark, color: 'text-orange-400', hideForOthers: true },
                { label: 'Forks', value: stats.forks, icon: GitFork, color: 'text-blue-400' }
              ].map((stat, i) => (
                (!stat.hideForOthers || isOwnProfile) && (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"
                  >
                    <stat.icon className={`${stat.color} mb-2`} size={20} />
                    <div className="text-2xl font-black">{stat.value}</div>
                    <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                  </motion.div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-gray-800">
          {[
            { id: 'posts', label: 'Posts', icon: Code2 },
            { id: 'projects', label: 'Projects', icon: GitFork },
            ...(isOwnProfile ? [{ id: 'saved', label: 'Saved', icon: Bookmark }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
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
        {displayItems.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Code2 size={48} className="mx-auto mb-4 text-gray-700" />
            <p className="text-gray-500">
              {activeTab === 'posts' ? 'No posts yet' : activeTab === 'projects' ? 'No projects yet' : 'No saved posts'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedItem(item)}
                className="group relative aspect-square bg-white rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
              >
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <style>
                          * { margin: 0; padding: 0; }
                          body { overflow: hidden; }
                          audio, video { display: none !important; }
                        </style>
                      </head>
                      <body>
                        ${item.html_code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')}
                      </body>
                    </html>
                  `}
                  className="w-full h-full pointer-events-none scale-100"
                  sandbox=""
                  loading="lazy"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-sm font-semibold line-clamp-2 mb-2">
                    {'caption' in item ? item.caption : 'title' in item ? item.title : 'Untitled'}
                  </p>
                  {'likes_count' in item && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Heart size={14} />
                        {item.likes_count}
                      </span>
                      {'comments_count' in item && (
                        <span className="flex items-center gap-1">
                          <Code2 size={14} />
                          {item.comments_count}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6"
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
                  <h3 className="font-bold">
                    {'caption' in selectedItem ? selectedItem.caption : 'title' in selectedItem ? selectedItem.title : 'Preview'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(selectedItem.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
    </div>
  );
}