import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { caption, promptVisible, userId } = await request.json();
    const { id: commitId } = await params;

    if (!caption || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Step 1: Get commit
    const { data: commit } = await supabase
      .from('commits')
      .select('*')
      .eq('id', commitId)
      .single();

    if (!commit) {
      return NextResponse.json({ error: 'Commit not found', success: false }, { status: 404 });
    }

    // Step 2: Get session separately
    const { data: session } = await supabase
      .from('sessions')
      .select('initial_prompt')
      .eq('id', commit.session_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found', success: false }, { status: 404 });
    }

    // Step 3: Check if already published
    if (commit.is_published && commit.post_id) {
      const { data: updatedPost } = await supabase
        .from('posts')
        .update({
          caption,
          prompt_visible: promptVisible,
          html_code: commit.html_code
        })
        .eq('id', commit.post_id)
        .select()
        .single();

      return NextResponse.json({ post: updatedPost, updated: true, success: true });
    }

    // Step 4: Create new post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        caption,
        prompt: session.initial_prompt,
        prompt_visible: promptVisible,
        html_code: commit.html_code,
        likes_count: 0,
        comments_count: 0,
        commit_id: commitId,
        session_id: commit.session_id
      })
      .select()
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      return NextResponse.json({ error: postError.message, success: false }, { status: 500 });
    }

    // Step 5: Mark commit as published
    await supabase
      .from('commits')
      .update({
        is_published: true,
        post_id: post.id
      })
      .eq('id', commitId);

    return NextResponse.json({ post, success: true });
  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to publish',
      success: false 
    }, { status: 500 });
  }
}