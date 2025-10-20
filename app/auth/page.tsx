'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CRITICAL: Check for password reset token in URL hash and preserve it
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery') {
        // Redirect to reset password page WITH the complete hash containing all tokens
        console.log('🔄 Recovery token detected, redirecting to reset-password with hash');
        router.push('/auth/reset-password' + hash);
        return;
      }
    }

    // Check if user already has a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/feed');
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Preserve the hash when redirecting for password recovery
        const currentHash = window.location.hash;
        console.log('🔄 PASSWORD_RECOVERY event, redirecting with hash');
        router.push('/auth/reset-password' + currentHash);
      } else if (session) {
        router.push('/feed');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-6xl animate-bounce">🧄</div>
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
          <div className="mb-4 flex justify-center">
            <Image 
              src="/logo.png" 
              alt="Garliq" 
              width={80} 
              height={80}
            />
          </div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Welcome to Garliq
          </h1>
          <p className="text-gray-600 mt-2">Join the vibe coding revolution</p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#9333ea',
                  brandAccent: '#ec4899',
                }
              }
            },
            className: {
              container: 'auth-container',
              button: 'auth-button',
              input: 'auth-input',
            }
          }}
          providers={[]}
          view="sign_in"
          showLinks={true}
        />
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-6xl animate-bounce">🧄</div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}