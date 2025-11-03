import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkApiSubscription } from '@/lib/api-subscription-check';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    const { initialPrompt, userId, selectedModel, courseSettings } = await request.json();

    if (!initialPrompt || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract course settings (with defaults)
    const chapterCount = courseSettings?.chapterCount || 5;
    const courseDepth = courseSettings?.depth || 'basic';

    // Validate chapter count
    if (chapterCount < 1 || chapterCount > 15) {
      return NextResponse.json({ error: 'Chapter count must be between 1 and 15' }, { status: 400 });
    }

    // Validate course depth
    if (!['basic', 'intermediate', 'advanced'].includes(courseDepth)) {
      return NextResponse.json({ error: 'Invalid course depth' }, { status: 400 });
    }

    console.log(`📚 Creating session: ${chapterCount} chapters, ${courseDepth} depth`);

    // Create session with multi-page settings
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        title: initialPrompt.substring(0, 50) + '...',
        initial_prompt: initialPrompt,
        generation_status: 'pending',
        selected_model: selectedModel || 'llama-3.3-70b',
        retry_count: 0,
        chapter_count: chapterCount,           // ← NEW
        course_depth: courseDepth              // ← NEW
      })
      .select()
      .single();

    if (error) {
      console.error('Session creation error:', error);
      throw error;
    }

    // Immediately save user prompt to chat_messages
    await supabase
      .from('chat_messages')
      .insert({
        session_id: data.id,
        role: 'user',
        content: initialPrompt
      });

    console.log(`✅ Session created: ${data.id} (${chapterCount} chapters, ${courseDepth})`);

    return NextResponse.json({ session: data });
  } catch (error: any) {
    console.error('Session creation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create session' 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ sessions: data });
  } catch (error: any) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch sessions' 
    }, { status: 500 });
  }
}