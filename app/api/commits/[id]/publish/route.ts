import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { caption, promptVisible, userId } = await request.json();
    const commitId = params.id;

    if (!caption || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get commit details
    const { data: commit, error: commitError } = await supabase
      .from('commits')
      .select('*, sessions(initial_prompt, id)')
      .eq('id', commitId)
      .single();

    if (commitError) throw commitError;

    // Check if this commit is already published
    if (commit.is_published && commit.post_id) {
      // Update existing post
      const { data: updatedPost, error: updateError } = await supabase
        .from('posts')
        .update({
          caption,
          prompt_visible: promptVisible,
          html_code: commit.html_code
        })
        .eq('id', commit.post_id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({ post: updatedPost, updated: true });
    }

    // Create new post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        caption,
        prompt: commit.sessions.initial_prompt,
        prompt_visible: promptVisible,
        html_code: commit.html_code,
        likes_count: 0,
        comments_count: 0,
        commit_id: commitId,
        session_id: commit.session_id
      })
      .select()
      .single();

    if (postError) throw postError;

    // Mark commit as published
    await supabase
      .from('commits')
      .update({
        is_published: true,
        post_id: post.id
      })
      .eq('id', commitId);

    return NextResponse.json({ post, success: true });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: 'Failed to publish commit' }, { status: 500 });
  }
}