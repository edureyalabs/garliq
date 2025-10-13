import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { initialPrompt, userId, selectedModel } = await request.json();

    if (!initialPrompt || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create session with generation_status = 'pending'
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        title: initialPrompt.substring(0, 50) + '...',
        initial_prompt: initialPrompt,
        generation_status: 'pending', // ✅ CHANGED: was 'status: active'
        selected_model: selectedModel || 'llama-3.3-70b',
        retry_count: 0 // ✅ NEW: initialize retry count
      })
      .select()
      .single();

    if (error) {
      console.error('Session creation error:', error);
      throw error;
    }

    // ✅ NEW: Immediately save user prompt to chat_messages
    await supabase
      .from('chat_messages')
      .insert({
        session_id: data.id,
        role: 'user',
        content: initialPrompt
      });

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