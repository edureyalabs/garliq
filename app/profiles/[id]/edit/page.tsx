'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
      return;
    }

    setUserId(session.user.id);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setFormData({
        username: data.username || '',
        display_name: data.display_name || '',
        bio: data.bio || ''
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        username: formData.username,
        display_name: formData.display_name,
        bio: formData.bio
      })
      .eq('id', userId);

    if (!error) {
      router.push(`/profile/${userId}`);
    } else {
      alert('Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-3 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={24} />
            <span className="text-xl font-bold">Edit Profile</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none"
                placeholder="username"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Display Name</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full h-32 px-4 py-3 bg-black/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <motion.button
              onClick={handleSave}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}