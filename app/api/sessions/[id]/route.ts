import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get session with chat history and commits
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    console.log('Fetching session:', sessionId);

    // Get session details with better error handling
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) {
      console.error('Session query error:', sessionError);
      throw sessionError;
    }

    if (!session) {
      console.log('Session not found:', sessionId);
      return NextResponse.json({ 
        error: 'Session not found',
        session: null,
        messages: [],
        commits: []
      }, { status: 404 });
    }

    // Get chat messages
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Get commits
    const { data: commits } = await supabase
      .from('commits')
      .select('*')
      .eq('session_id', sessionId)
      .order('commit_number', { ascending: true });

    console.log('Session loaded:', {
      sessionId,
      messagesCount: messages?.length || 0,
      commitsCount: commits?.length || 0
    });

    return NextResponse.json({
      session,
      messages: messages || [],
      commits: commits || []
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch session',
      session: null,
      messages: [],
      commits: []
    }, { status: 500 });
  }
}

// PATCH - Update session title
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { title } = await request.json();
    const { id: sessionId } = await params;

    const { data, error } = await supabase
      .from('sessions')
      .update({ title })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ session: data });
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE - Delete session
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session delete error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}