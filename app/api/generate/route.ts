import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkApiSubscription } from '@/lib/api-subscription-check';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8000';

export const maxDuration = 300; // Set max duration to 5 minutes for Vercel/Render

export async function POST(request: Request) {
  // Add subscription check FIRST
  const authCheck = await checkApiSubscription();
  
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.error === 'Unauthorized' ? 401 : 403 }
    );
  }

  const user = authCheck.user;

  try {
    const { sessionId, message, userId, model } = await request.json();

    if (!sessionId || !message || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('🚀 Generation request received:', { sessionId, model });

    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    const selectedModel = model || session?.selected_model || 'llama-3.3-70b';

    // ==================== LLAMA FREE TIER LIMIT CHECK ====================
    if (selectedModel === 'llama-3.3-70b') {
      const { data: limitCheck, error: limitError } = await supabase
        .rpc('check_and_increment_daily_limit', {
          p_user_id: userId,
          p_max_limit: 50
        });

      if (limitError) {
        console.error('Daily limit check error:', limitError);
      } else if (limitCheck && !limitCheck.allowed) {
        await supabase
          .from('sessions')
          .update({ 
            generation_status: 'failed',
            generation_error: limitCheck.message || 'Daily free generation limit reached (50/day).'
          })
          .eq('id', sessionId);

        return NextResponse.json({ 
          error: limitCheck.message || 'Daily limit reached',
          success: false 
        }, { status: 429 });
      }
    }

    // ==================== CLAUDE TOKEN BALANCE CHECK ====================
    if (selectedModel === 'claude-sonnet-4.5') {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('token_balance')
        .eq('user_id', userId)
        .single();

      const balance = wallet?.token_balance || 0;

      if (balance < 4000) {
        await supabase
          .from('sessions')
          .update({ 
            generation_status: 'failed',
            generation_error: 'Insufficient tokens. You need at least 4,000 tokens to use Claude Sonnet 4.5.'
          })
          .eq('id', sessionId);

        return NextResponse.json({ 
          error: 'Insufficient tokens. You need at least 4,000 tokens to use Claude Sonnet 4.5.',
          success: false 
        }, { status: 402 });
      }
    }

    // ==================== UPDATE STATUS TO GENERATING ====================
    await supabase
      .from('sessions')
      .update({ 
        generation_status: 'generating',
        generation_error: null
      })
      .eq('id', sessionId);

    // Get chat history and current code
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    const { data: project } = await supabase
      .from('projects')
      .select('html_code')
      .eq('session_id', sessionId)
      .maybeSingle();

    // ==================== TRIGGER ASYNC GENERATION ====================
    console.log('🔥 Triggering async generation...');
    
    // Security: NO LONGER PASSING SUPABASE CREDENTIALS
    // Backend service uses its own credentials from environment variables
    fetch(`${AGENT_SERVICE_URL}/generate-async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: message,
        model: selectedModel,
        current_code: project?.html_code || null,
        chat_history: chatHistory || [],
        user_id: userId,
        session_id: sessionId
        // SECURITY FIX: Removed supabase_url and supabase_key
      })
    }).catch(err => {
      console.error('Failed to trigger async generation:', err);
    });

    // Return immediately - frontend will listen via Supabase Realtime
    return NextResponse.json({ 
      success: true,
      message: 'Generation started',
      sessionId: sessionId
    });

  } catch (error: any) {
    console.error('❌ API Route Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Server error',
      success: false 
    }, { status: 500 });
  }
}