'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Calendar, Heart, Code2, User } from 'lucide-react';
import Link from 'next/link';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  created_at: string;
}

interface Post {
  id: string;
  caption: string;
  html_code: string;
  likes_count: number;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, likes: 0 });

  useEffect(() => {
    checkUser();
    fetchProfile();
    fetchUserPosts();
  }, [userId]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUser(session.user);
  };

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) setProfile(data);
    setLoading(false);
  };

  const fetchUserPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setPosts(data);
      const totalLikes = data.reduce((sum, post) => sum + post.likes_count, 0);
      setStats({ posts: data.length, likes: totalLikes });
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <ArrowLeft size={24} />
            <span className="text-3xl">🧄</span>
          </button>

          {isOwnProfile && (
            <Link href="/profile/edit">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-full font-bold flex items-center gap-2"
              >
                <Edit size={18} />
                Edit Profile
              </motion.button>
            </Link>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-5xl font-black">
            {profile.display_name[0].toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-black mb-2">{profile.display_name}</h1>
            <p className="text-gray-500 mb-4">@{profile.username}</p>
            
            {profile.bio && (
              <p className="text-gray-300 mb-6">{profile.bio}</p>
            )}

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                <span className="text-gray-400">
                  Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-6 pt-6 border-t border-gray-800">
              <div>
                <div className="text-2xl font-black text-purple-400">{stats.posts}</div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
              <div>
                <div className="text-2xl font-black text-pink-400">{stats.likes}</div>
                <div className="text-sm text-gray-500">Total Garlics</div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Code2 className="text-purple-400" />
            Creations
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800">
              <User size={48} className="mx-auto mb-4 text-gray-700" />
              <p className="text-gray-500">No posts yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all"
                >
                  <div className="h-48 bg-white relative overflow-hidden">
                    <iframe
                      srcDoc={post.html_code}
                      className="w-full h-full pointer-events-none scale-50 origin-top-left"
                      style={{ width: '200%', height: '200%' }}
                      sandbox="allow-scripts"
                    />
                  </div>

                  <div className="p-4">
                    <p className="text-sm mb-3 line-clamp-2">{post.caption}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Heart size={14} />
                        <span>{post.likes_count}</span>
                      </div>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}