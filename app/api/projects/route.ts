import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { sessionId, userId } = await request.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Saving project for session:', sessionId);

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

    // Get latest commit
    const { data: commits } = await supabase
      .from('commits')
      .select('*')
      .eq('session_id', sessionId)
      .order('commit_number', { ascending: false })
      .limit(1);

    const latestCommit = commits && commits.length > 0 ? commits[0] : null;

    if (!latestCommit) {
      return NextResponse.json({ error: 'No commits found' }, { status: 400 });
    }

    console.log('Latest commit found:', latestCommit.id);

    // Check if project already exists for this session
    const { data: existingProject } = await supabase
      .from('projects')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existingProject) {
      console.log('Updating existing project:', existingProject.id);
      
      // Update existing project
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({
          title: session.title,
          prompt: session.initial_prompt,
          html_code: latestCommit.html_code,
          last_commit_id: latestCommit.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProject.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      console.log('Project updated successfully');
      return NextResponse.json({ project: updatedProject, isNew: false, success: true });
    } else {
      console.log('Creating new project');
      
      // Create new project
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          session_id: sessionId,
          title: session.title,
          prompt: session.initial_prompt,
          html_code: latestCommit.html_code,
          is_draft: true,
          last_commit_id: latestCommit.id,
          is_shared: false
        })
        .select()
        .single();

      if (createError) {
        console.error('Create error:', createError);
        throw createError;
      }

      console.log('Project created successfully:', newProject.id);
      return NextResponse.json({ project: newProject, isNew: true, success: true });
    }
  } catch (error: any) {
    console.error('Save project error:', error);
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