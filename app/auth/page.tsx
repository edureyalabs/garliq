'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      
      console.log('🔍 Auth Callback - Full URL:', window.location.href);
      console.log('🔍 Hash:', hash);
      console.log('🔍 Type:', params.get('type'));
      console.log('🔍 Access Token:', params.get('access_token'));
      
      const type = params.get('type');
      
      // If it's a recovery token, redirect to reset-password with the hash
      if (type === 'recovery') {
        console.log('✅ Recovery detected, redirecting to reset-password');
        router.push('/auth/reset-password' + hash);
        return;
      }
      
      // Otherwise, handle normal auth callback
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session error:', error);
        router.push('/auth');
        return;
      }
      
      if (data.session) {
        console.log('✅ Session found, redirecting to feed');
        router.push('/feed');
      } else {
        console.log('⚠️ No session, redirecting to auth');
        router.push('/auth');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🧄</div>
        <p className="text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
}