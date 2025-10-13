import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get session with chat history
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    console.log('📖 Fetching session:', sessionId);

    // Get session details (now includes generation_status, generation_error, retry_count)
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
        messages: []
      }, { status: 404 });
    }

    // Get chat messages
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    console.log('✅ Session loaded:', {
      sessionId,
      generation_status: session.generation_status, // ✅ NEW: log status
      messagesCount: messages?.length || 0
    });

    return NextResponse.json({
      session,
      messages: messages || []
    });
  } catch (error) {
    console.error('❌ Session fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch session',
      session: null,
      messages: []
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

    console.log('✏️ Updating session title:', sessionId);

    const { data, error } = await supabase
      .from('sessions')
      .update({ 
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Session title updated');

    return NextResponse.json({ session: data });
  } catch (error) {
    console.error('❌ Session update error:', error);
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

    console.log('🗑️ Deleting session:', sessionId);

    // Delete chat messages first
    await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId);

    // Delete session
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;

    console.log('✅ Session deleted');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Session delete error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}