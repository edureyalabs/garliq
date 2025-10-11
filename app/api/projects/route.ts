import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { sessionId, userId, lastCommitId } = await request.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('📦 Saving project:', { sessionId, lastCommitId });

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Session not found:', sessionError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Determine which commit to use
    let commitToUse = lastCommitId;
    
    if (!commitToUse) {
      // Fallback: Get latest commit from database
      const { data: commits } = await supabase
        .from('commits')
        .select('id')
        .eq('session_id', sessionId)
        .order('commit_number', { ascending: false })
        .limit(1);

      if (!commits || commits.length === 0) {
        return NextResponse.json({ error: 'No commits found. Generate code first.' }, { status: 400 });
      }
      commitToUse = commits[0].id;
    }

    // Get commit HTML code
    const { data: commit, error: commitError } = await supabase
      .from('commits')
      .select('html_code')
      .eq('id', commitToUse)
      .single();

    if (commitError || !commit) {
      console.error('Commit not found:', commitError);
      return NextResponse.json({ error: 'Commit not found' }, { status: 404 });
    }

    console.log('✅ Using commit:', commitToUse);

    // Check if project exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existingProject) {
      // UPDATE existing project
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({
          title: session.title,
          prompt: session.initial_prompt,
          html_code: commit.html_code,
          last_commit_id: commitToUse,  // ✅ Store last commit
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProject.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      console.log('✅ Project updated');
      return NextResponse.json({ project: updatedProject, isNew: false, success: true });
      
    } else {
      // CREATE new project
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          session_id: sessionId,
          title: session.title,
          prompt: session.initial_prompt,
          html_code: commit.html_code,
          is_draft: true,
          last_commit_id: commitToUse,  // ✅ Store last commit
          is_shared: false
        })
        .select()
        .single();

      if (createError) {
        console.error('Create error:', createError);
        throw createError;
      }

      console.log('✅ Project created');
      return NextResponse.json({ project: newProject, isNew: true, success: true });
    }
    
  } catch (error: any) {
    console.error('❌ Save project error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to save project',
      success: false 
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
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ projects: data, success: true });
  } catch (error: any) {
    console.error('Fetch projects error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch projects',
      success: false 
    }, { status: 500 });
  }
}