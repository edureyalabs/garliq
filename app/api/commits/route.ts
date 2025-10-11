import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST - Create new commit
export async function POST(request: Request) {
  try {
    const { sessionId, htmlCode, commitMessage } = await request.json();

    if (!sessionId || !htmlCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get next commit number
    const { data: lastCommit } = await supabase
      .from('commits')
      .select('commit_number, id')
      .eq('session_id', sessionId)
      .order('commit_number', { ascending: false })
      .limit(1)
      .single();

    const nextNumber = lastCommit ? lastCommit.commit_number + 1 : 1;

    // Create commit
    const { data: commit, error } = await supabase
      .from('commits')
      .insert({
        session_id: sessionId,
        commit_number: nextNumber,
        commit_message: commitMessage || `Commit #${nextNumber}`,
        html_code: htmlCode,
        parent_commit_id: lastCommit?.id || null
      })
      .select()
      .single();

    if (error) throw error;

    // Update session's current_commit_id
    await supabase
      .from('sessions')
      .update({ current_commit_id: commit.id })
      .eq('id', sessionId);

    return NextResponse.json({ commit, success: true });
  } catch (error) {
    console.error('Commit creation error:', error);
    return NextResponse.json({ error: 'Failed to create commit' }, { status: 500 });
  }
}