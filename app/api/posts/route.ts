import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Share project to feed (create new post)
export async function POST(request: Request) {
  try {
    const { projectId, caption, promptVisible, userId } = await request.json();

    if (!projectId || !caption || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('📤 Sharing project to feed:', projectId);

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    // Check if already shared
    if (project.post_id) {
      return NextResponse.json({ 
        error: 'Project already shared. Use update instead.',
        success: false 
      }, { status: 400 });
    }

    // Create new post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        project_id: projectId,
        caption,
        prompt: project.prompt,
        prompt_visible: promptVisible,
        html_code: project.html_code,
        likes_count: 0,
        comments_count: 0
      })
      .select()
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      return NextResponse.json({ error: postError.message, success: false }, { status: 500 });
    }

    // Update project to mark as shared
    await supabase
      .from('projects')
      .update({
        is_shared: true,
        is_draft: false,
        post_id: post.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    console.log('✅ Project shared to feed');

    return NextResponse.json({ post, success: true });
  } catch (error: any) {
    console.error('❌ Share project error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to share project',
      success: false 
    }, { status: 500 });
  }
}