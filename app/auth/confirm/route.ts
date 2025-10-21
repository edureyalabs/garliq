import { supabase } from '@/lib/supabase';
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

// This route handler processes email confirmation and password reset links
// Using the modern Supabase approach with token_hash and verifyOtp()
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const next = searchParams.get('next');
    
    // Default redirect destinations
    const defaultNext = type === 'recovery' ? '/auth/reset-password' : '/feed';
    const redirectTo = next?.startsWith('/') ? next : defaultNext;

    console.log('🔍 Auth confirm - Params:', { 
      hasTokenHash: !!token_hash, 
      type, 
      next,
      redirectTo
    });

    if (!token_hash || !type) {
      console.error('❌ Missing token_hash or type');
      return NextResponse.redirect(new URL('/auth/error?error=Missing+authentication+token', request.url));
    }

    // Verify the OTP token - this exchanges the token for a session
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      console.error('❌ Verification error:', error.message);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    console.log('✅ Token verified successfully');
    console.log('Session created:', !!data.session);
    console.log('Redirecting to:', redirectTo);

    // Successfully verified - redirect to the appropriate page
    return NextResponse.redirect(new URL(redirectTo, request.url));

  } catch (err) {
    console.error('❌ Exception in auth confirm:', err);
    return NextResponse.redirect(
      new URL('/auth/error?error=An+unexpected+error+occurred', request.url)
    );
  }
}