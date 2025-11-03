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
    const { sessionId, message, userId } = await request.json();

    if (!sessionId || !message || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('🚀 Generation request received:', { sessionId });

    // Get session with multi-page settings
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const chapterCount = session.chapter_count || 5;
    const courseDepth = session.course_depth || 'basic';

    console.log(`📚 Multi-page settings: ${chapterCount} chapters, ${courseDepth} depth`);

    // ==================== TOKEN BALANCE CHECK (MINIMUM 4000) ====================
    const MINIMUM_TOKENS = 4000;
    
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('token_balance')
      .eq('user_id', userId)
      .single();

    const balance = wallet?.token_balance || 0;

    if (balance < MINIMUM_TOKENS) {
      await supabase
        .from('sessions')
        .update({ 
          generation_status: 'failed',
          generation_error: `Insufficient tokens. You need at least ${MINIMUM_TOKENS.toLocaleString()} tokens to generate a course.`
        })
        .eq('id', sessionId);

      return NextResponse.json({ 
        error: `Insufficient tokens. Required: ${MINIMUM_TOKENS.toLocaleString()}, Available: ${balance.toLocaleString()}`,
        success: false 
      }, { status: 402 });
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
        model: 'llama-3.3-70b', // Hardcoded to Basic Agent (Groq)
        user_id: userId,
        session_id: sessionId,
        chapter_count: chapterCount,
        course_depth: courseDepth
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