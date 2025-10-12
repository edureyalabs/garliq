import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { sessionId, htmlCode, commitMessage } = await request.json();

    if (!sessionId || !htmlCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get latest commit number
    const { data: lastCommit } = await supabase
      .from('commits')
      .select('commit_number, id')
      .eq('session_id', sessionId)
      .order('commit_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextNumber = lastCommit ? lastCommit.commit_number + 1 : 1;

    // Create new commit
    const { data: newCommit, error: commitError } = await supabase
      .from('commits')
      .insert({
        session_id: sessionId,
        commit_number: nextNumber,
        commit_message: commitMessage || `Update #${nextNumber}`,
        html_code: htmlCode,
        parent_commit_id: lastCommit?.id || null,
        is_published: false
      })
      .select()
      .single();

    if (commitError) {
      console.error('Commit creation error:', commitError);
      throw commitError;
    }

    // Update session's current_commit_id
    await supabase
      .from('sessions')
      .update({ current_commit_id: newCommit.id })
      .eq('id', sessionId);

    // Update project's last_commit_id and html_code
    await supabase
      .from('projects')
      .update({ 
        last_commit_id: newCommit.id,
        html_code: htmlCode,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    // ✅ NEW: Check if this project has an associated post
    const { data: project } = await supabase
      .from('projects')
      .select('post_id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (project?.post_id) {
      // Update the post with new commit
      await supabase
        .from('posts')
        .update({
          current_commit_id: newCommit.id,
          html_code: htmlCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.post_id);
      
      console.log('✅ Post updated with new commit:', newCommit.id);
    }

    console.log('✅ Manual commit created:', newCommit.id);

    return NextResponse.json({ success: true, commit: newCommit });
  } catch (error: any) {
    console.error('❌ Manual commit error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create commit',
      success: false 
    }, { status: 500 });
  }
}