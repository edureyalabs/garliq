'use client';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Check, AlertCircle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    const validateRecoveryToken = async () => {
      // CRITICAL FIX: Exchange the URL hash token for a valid session
      const hash = window.location.hash;
      
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        console.log('🔍 Hash params:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken, type });
        
        if (accessToken && type === 'recovery') {
          try {
            // Method 1: Try setSession (modern approach)
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (sessionError) {
              console.error('❌ Session exchange error:', sessionError);
              setError('Invalid or expired reset link. Please request a new password reset.');
            } else if (data.session) {
              console.log('✅ Valid recovery session established via setSession');
            } else {
              setError('Invalid or expired reset link. Please request a new password reset.');
            }
          } catch (err) {
            console.error('❌ Exception during session exchange:', err);
            setError('Invalid or expired reset link. Please request a new password reset.');
          }
          
          setValidating(false);
          return;
        }
      }
      
      // Fallback: Check if session already exists (user came back to page)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session && !sessionError) {
        console.log('✅ Existing session found');
        setValidating(false);
        return;
      }
      
      // No valid token or session found
      console.error('❌ No valid recovery token or session found');
      console.log('Hash:', hash);
      console.log('Session error:', sessionError);
      setError('Invalid or expired reset link. Please request a new password reset.');
      setValidating(false);
    };

    validateRecoveryToken();
  }, [searchParams]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/feed'), 2000);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4 animate-bounce">🧄</div>
          <p className="text-gray-600">Validating reset link...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧄</div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Reset Password
          </h1>
          <p className="text-gray-600 mt-2">Enter your new password</p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center"
          >
            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-700 font-semibold">Password updated successfully!</p>
            <p className="text-green-600 text-sm mt-2">Redirecting to feed...</p>
          </motion.div>
        ) : error && !password ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-semibold mb-4">{error}</p>
            <button
              onClick={() => router.push('/auth')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold"
            >
              Back to Login
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter new password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2"
              >
                <AlertCircle className="text-red-500" size={20} />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:shadow-lg transition-all"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-6xl animate-bounce">🧄</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}