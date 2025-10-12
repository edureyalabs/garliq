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
    let commitHtmlCode = null;
    
    if (!commitToUse) {
      // Fallback: Get latest commit from database
      const { data: commits } = await supabase
        .from('commits')
        .select('id, html_code')
        .eq('session_id', sessionId)
        .order('commit_number', { ascending: false })
        .limit(1);

      if (commits && commits.length > 0) {
        commitToUse = commits[0].id;
        commitHtmlCode = commits[0].html_code;
      }
      // If still no commit, we'll create project with null values (first generation pending)
    }

// Get commit HTML code (if commit exists)
    if (commitToUse && !commitHtmlCode) {
      const { data: commit, error: commitError } = await supabase
        .from('commits')
        .select('html_code')
        .eq('id', commitToUse)
        .single();

      if (commit) {
        commitHtmlCode = commit.html_code;
      }
    }

    console.log('✅ Using commit:', commitToUse || 'none (first generation pending)');

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
          html_code: commitHtmlCode || existingProject.html_code,
          last_commit_id: commitToUse || existingProject.last_commit_id,
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
          html_code: commitHtmlCode || '<html><body><h1>Generating...</h1></body></html>',
          is_draft: true,
          last_commit_id: commitToUse,
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

// DELETE - Delete project with cascade
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    console.log('🗑️ Deleting project:', projectId);

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('session_id, post_id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      console.error('Project not found:', projectError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete associated post if exists
    if (project.post_id) {
      const { error: postError } = await supabase
        .from('posts')
        .delete()
        .eq('id', project.post_id);
      
      if (postError) {
        console.error('Error deleting post:', postError);
      } else {
        console.log('✅ Deleted associated post:', project.post_id);
      }
    }

    // Delete commits (this will cascade to chat_messages if FK is set)
    const { error: commitsError } = await supabase
      .from('commits')
      .delete()
      .eq('session_id', project.session_id);
    
    if (commitsError) {
      console.error('Error deleting commits:', commitsError);
    } else {
      console.log('✅ Deleted commits');
    }

    // Delete chat messages
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', project.session_id);
    
    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
    } else {
      console.log('✅ Deleted chat messages');
    }

    // Delete session
    const { error: sessionError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', project.session_id);
    
    if (sessionError) {
      console.error('Error deleting session:', sessionError);
    } else {
      console.log('✅ Deleted session');
    }

    // Finally, delete project
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      throw deleteError;
    }

    console.log('✅ Project fully deleted:', projectId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Delete project error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete project',
      success: false 
    }, { status: 500 });
  }
}