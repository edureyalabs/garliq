import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Sign up user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Start trial subscription
    const { data: trialData, error: trialError } = await supabase.rpc(
      'start_trial_subscription',
      {
        p_user_id: authData.user.id,
      }
    );

    if (trialError) {
      console.error('Failed to start trial:', trialError);
      // Don't fail signup if trial fails, just log it
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      trial: trialData,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}