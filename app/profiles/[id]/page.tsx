'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit, Calendar, Heart, Code2, Bookmark, GitFork, Share2, ExternalLink, Trash2, Eye } from 'lucide-react';
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
  session_id: string | null;
  is_draft: boolean;
  is_shared: boolean;
  post_id: string | null;
  prompt: string;
  updated_at: string;
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProject, setShareProject] = useState<Project | null>(null);
  const [shareCaption, setShareCaption] = useState('');
  const [promptVisible, setPromptVisible] = useState(true);
  const [sharing, setSharing] = useState(false);
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
  }, [userId]);

  useEffect(() => {
    if (currentUser?.id === userId) {
      fetchSavedPosts();
    }
  }, [currentUser, userId]);

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
      const totalLikes = data.reduce((sum, post) => sum + (post.likes_count || 0), 0);
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
      .order('updated_at', { ascending: false });

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
      
      await fetchUserProjects();
      
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
      await fetchUserProjects();
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
      await fetchUserPosts();
      await fetchUserProjects();
    } catch (error: any) {
      console.error('Delete post error:', error);
      alert('❌ ' + error.message);
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
              <Link href="/profiles/edit">
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
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-6xl font-black flex-shrink-0">
            {profile.display_name[0].toUpperCase()}
          </div>

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

        {/* Content Grid - ✅ FIXED */}
        {displayItems.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Code2 size={48} className="mx-auto mb-4 text-gray-700" />
            <p className="text-gray-500">
              {activeTab === 'posts' ? 'No posts yet' : activeTab === 'projects' ? 'No projects yet' : 'No saved posts'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayItems.map((item, i) => {
              // ✅ FIX: Better type checking based on active tab
              const isProject = activeTab === 'projects';
              const post = !isProject ? (item as Post) : null;
              const project = isProject ? (item as Project) : null;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
                >
                  {/* Preview */}
                  <div 
                    className="aspect-square bg-white cursor-pointer relative overflow-hidden"
                    onClick={() => setSelectedItem(item)}
                  >
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <style>
                              * { margin: 0; padding: 0; }
                              body { overflow: hidden; transform: scale(0.5); transform-origin: top left; width: 200%; height: 200%; }
                              audio, video { display: none !important; }
                            </style>
                          </head>
                          <body>
                            ${item.html_code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')}
                          </body>
                        </html>
                      `}
                      className="w-full h-full pointer-events-none"
                      sandbox=""
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="text-white drop-shadow-lg" size={32} />
                    </div>
                  </div>

                  {/* Info Overlay for Projects */}
                  {isProject && project && isOwnProfile && (
                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        project.is_draft 
                          ? 'bg-yellow-500/90 text-black' 
                          : 'bg-green-500/90 text-black'
                      }`}>
                        {project.is_draft ? 'Draft' : 'Live'}
                      </span>
                    </div>
                  )}

                  {/* Hover Actions for Projects */}
                  {isProject && project && isOwnProfile && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity space-y-2">
                      <p className="text-sm font-bold line-clamp-1 mb-2">
                        {project.title || 'Untitled'}
                      </p>
                      
                      <div className="flex gap-2">
                        {project.session_id && (
                          <Link href={`/studio/${project.session_id}`} className="flex-1">
                            <button className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-semibold">
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
                            className="px-2 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg"
                            title="Share"
                          >
                            <Share2 size={14} />
                          </button>
                        )}
                        
                        {!project.is_draft && project.post_id && (
                          <Link href={`/post/${project.post_id}`} onClick={(e) => e.stopPropagation()}>
                            <button className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg" title="View Post">
                              <ExternalLink size={14} />
                            </button>
                          </Link>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project);
                          }}
                          className="px-2 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Post Stats - ✅ FIXED */}
                  {!isProject && post && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm font-semibold line-clamp-2 mb-2">
                        {post.caption || 'Untitled'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Heart size={14} />
                            {post.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Code2 size={14} />
                            {post.comments_count || 0}
                          </span>
                        </div>
                        {isOwnProfile && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            className="px-2 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg"
                            title="Delete Post"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
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
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
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
                <h3 className="text-xl font-bold">📢 Share to Feed</h3>
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
    </div>
  );
}