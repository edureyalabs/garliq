import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE - Delete post only (keep project)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('🗑️ Deleting post:', postId);

    // Verify ownership by checking the post itself
    const { data: post, error: postFetchError } = await supabase
      .from('posts')
      .select('user_id, session_id')
      .eq('id', postId)
      .single();

    if (postFetchError || !post) {
      console.error('Post not found:', postFetchError);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.user_id !== userId) {
      console.error('Unauthorized delete attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update project to unlink post
    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ 
        post_id: null, 
        is_shared: false,
        is_draft: true
      })
      .eq('session_id', post.session_id);

    if (projectUpdateError) {
      console.error('Error updating project:', projectUpdateError);
    }

    // Delete post (likes/comments cascade automatically if FK set)
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      throw deleteError;
    }

    console.log('✅ Post deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete post',
      success: false 
    }, { status: 500 });
  }
}

// PATCH - Update post with new code
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { htmlCode, commitId, caption, promptVisible } = await request.json();
    const { id: postId } = await params;

    console.log('🔄 Updating post:', postId);

    const updateData: any = {};

    if (htmlCode) updateData.html_code = htmlCode;
    if (commitId) updateData.current_commit_id = commitId;
    if (caption !== undefined) updateData.caption = caption;
    if (promptVisible !== undefined) updateData.prompt_visible = promptVisible;

    const { data: post, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update post error:', error);
      throw error;
    }

    console.log('✅ Post updated successfully');
    return NextResponse.json({ post, success: true });
  } catch (error: any) {
    console.error('Update post error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update post',
      success: false 
    }, { status: 500 });
  }
}