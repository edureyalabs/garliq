import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Create new post from project
export async function POST(request: Request) {
  try {
    const { projectId, caption, promptVisible, userId } = await request.json();

    if (!projectId || !caption || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('📤 Creating post from project:', projectId);

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('html_code, prompt, session_id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      console.error('Project not found:', projectError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        caption,
        prompt: project.prompt,
        prompt_visible: promptVisible,
        html_code: project.html_code,
        likes_count: 0,
        comments_count: 0,
        session_id: project.session_id
      })
      .select()
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }

    // Update project with post_id
    await supabase
      .from('projects')
      .update({
        post_id: post.id,
        is_shared: true,
        is_draft: false
      })
      .eq('id', projectId);

    console.log('✅ Post created successfully:', post.id);

    return NextResponse.json({ post, success: true });
  } catch (error: any) {
    console.error('❌ Create post error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create post',
      success: false 
    }, { status: 500 });
  }
}