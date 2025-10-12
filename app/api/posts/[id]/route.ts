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

    // Verify ownership and get project_id
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, project_id')
      .eq('id', postId)
      .single();

    if (!post || post.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update project to unlink post (set back to draft)
    if (post.project_id) {
      await supabase
        .from('projects')
        .update({ 
          post_id: null, 
          is_shared: false,
          is_draft: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.project_id);
      
      console.log('✅ Project unlinked from post');
    }

    // Delete post (likes/comments/saves cascade automatically)
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) throw deleteError;

    console.log('✅ Post deleted, project kept as draft');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Delete post error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete post',
      success: false 
    }, { status: 500 });
  }
}

// PATCH - Update post with new code (the "Update Post" button)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { htmlCode, caption, promptVisible, userId } = await request.json();
    const { id: postId } = await params;

    console.log('🔄 Updating post:', postId);

    // Verify ownership
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, project_id')
      .eq('id', postId)
      .single();

    if (!post || post.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (htmlCode !== undefined) updateData.html_code = htmlCode;
    if (caption !== undefined) updateData.caption = caption;
    if (promptVisible !== undefined) updateData.prompt_visible = promptVisible;

    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Post updated successfully');

    return NextResponse.json({ post: updatedPost, success: true });
  } catch (error: any) {
    console.error('❌ Update post error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update post',
      success: false 
    }, { status: 500 });
  }
}