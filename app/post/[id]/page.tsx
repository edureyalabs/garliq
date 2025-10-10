'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Download, Copy, Check, Code, ArrowLeft } from 'lucide-react';
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
}

export default function PublicPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    const { data: postData, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postData) {
      setPost(postData);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', postData.user_id)
        .single();

      if (profileData) setProfile(profileData);
    }

    setLoading(false);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!post) return;
    const blob = new Blob([post.html_code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garlic-${post.id.slice(0, 8)}.html`;
    a.click();
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
          <Link href="/">
            <button className="bg-purple-600 px-6 py-3 rounded-full">Go Home</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-4xl">🧄</span>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              GARLIC
            </h1>
          </Link>

          <Link href="/auth">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 rounded-full font-bold">
              Join Garlic
            </button>
          </Link>
        </div>
      </div>

      {/* Post Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden">
          {/* Post Header */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg">
                {profile?.display_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="font-bold">{profile?.display_name || 'Anonymous'}</div>
                <div className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-4">{post.caption}</h1>

            {post.prompt_visible && post.prompt && (
              <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Code size={16} className="text-purple-400" />
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Prompt</span>
                </div>
                <p className="text-sm text-gray-300 font-mono">{post.prompt}</p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-purple-400" />
                <span>{post.likes_count} Garlics</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-pink-400" />
                <span>{post.comments_count} Comments</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-gray-800 bg-white">
            <iframe
              srcDoc={post.html_code}
              className="w-full h-[600px]"
              sandbox="allow-scripts"
              title="post-preview"
            />
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-800 flex gap-4">
            <button
              onClick={() => handleCopy(post.html_code, 'code')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition-colors"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
              {copied ? 'Copied!' : 'Copy HTML'}
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition-colors"
            >
              <Download size={20} />
              Download
            </button>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center p-8 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl backdrop-blur-xl"
        >
          <h3 className="text-2xl font-bold mb-2">Want to create your own?</h3>
          <p className="text-gray-400 mb-6">Join Garlic and start vibe coding</p>
          <Link href="/auth">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-full font-bold">
              Get Started Free
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}