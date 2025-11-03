import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkApiSubscription } from '@/lib/api-subscription-check';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8000';

export const maxDuration = 300;

export async function POST(request: Request) {
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

    // Get session with multi-page settings
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const selectedModel = model || session?.selected_model || 'llama-3.3-70b';
    const chapterCount = session.chapter_count || 5;
    const courseDepth = session.course_depth || 'basic';

    console.log(`📚 Multi-page settings: ${chapterCount} chapters, ${courseDepth} depth`);

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

      // Calculate required tokens based on settings
      const tokenRequirements = {
        basic: 15000,
        intermediate: 22000,
        advanced: 30000
      };
      const chapterTokens = chapterCount * tokenRequirements[courseDepth as keyof typeof tokenRequirements];
      const otherTokens = 28000; // intro + toc + conclusion
      const totalRequired = chapterTokens + otherTokens;

      if (balance < totalRequired) {
        await supabase
          .from('sessions')
          .update({ 
            generation_status: 'failed',
            generation_error: `Insufficient tokens. You need at least ${totalRequired.toLocaleString()} tokens for this course (${chapterCount} chapters, ${courseDepth} depth).`
          })
          .eq('id', sessionId);

        return NextResponse.json({ 
          error: `Insufficient tokens. Required: ${totalRequired.toLocaleString()}, Available: ${balance.toLocaleString()}`,
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

    // Get chat history
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // ==================== TRIGGER ASYNC MULTI-PAGE GENERATION ====================
    console.log('🔥 Triggering multi-page async generation...');
    
    fetch(`${AGENT_SERVICE_URL}/generate-async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: message,
        model: selectedModel,
        user_id: userId,
        session_id: sessionId,
        chapter_count: chapterCount,      // ← NEW
        course_depth: courseDepth         // ← NEW
      })
    }).catch(err => {
      console.error('Failed to trigger async generation:', err);
    });

    // Return immediately - frontend will listen via Supabase Realtime
    return NextResponse.json({ 
      success: true,
      message: 'Multi-page generation started',
      sessionId: sessionId,
      chapterCount: chapterCount,
      courseDepth: courseDepth
    });

  } catch (error: any) {
    console.error('❌ API Route Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Server error',
      success: false 
    }, { status: 500 });
  }
}