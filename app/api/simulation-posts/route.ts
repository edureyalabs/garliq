// app/api/simulation-posts/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkApiSubscription } from '@/lib/api-subscription-check';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const authCheck = await checkApiSubscription();
  
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.error === 'Unauthorized' ? 401 : 403 }
    );
  }

  const user = authCheck.user;

  try {
    const { simulationId, caption, userId } = await request.json();

    if (!caption || !userId || !simulationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('📤 Publishing simulation:', simulationId);

    // Get simulation
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .eq('user_id', userId)
      .single();

    if (simError || !simulation) {
      return NextResponse.json({ error: 'Simulation not found or unauthorized' }, { status: 404 });
    }

    if (simulation.generation_status !== 'completed' || !simulation.html_code) {
      return NextResponse.json({ error: 'Simulation not ready to publish' }, { status: 400 });
    }

    // Check if already published
    if (simulation.is_published && simulation.post_id) {
      // Update existing post
      const { data: updatedPost, error: updateError } = await supabase
        .from('simulation_posts')
        .update({
          caption,
          html_code: simulation.html_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', simulation.post_id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({ 
        post: updatedPost, 
        updated: true, 
        success: true 
      });
    }

    // Create new post
    const { data: post, error: postError } = await supabase
      .from('simulation_posts')
      .insert({
        user_id: userId,
        simulation_id: simulationId,
        caption,
        prompt_visible: true,
        html_code: simulation.html_code,
        topic_category: simulation.topic_category,
        framework_used: simulation.framework_used,
        likes_count: 0,
        comments_count: 0,
        saves_count: 0,
        views_count: 0
      })
      .select()
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      throw postError;
    }

    // Update simulation record
    await supabase
      .from('simulations')
      .update({
        is_published: true,
        post_id: post.id
      })
      .eq('id', simulationId);

    console.log('✅ Simulation published:', post.id);

    return NextResponse.json({ 
      post, 
      success: true 
    });

  } catch (error: any) {
    console.error('❌ Publish error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to publish simulation',
      success: false 
    }, { status: 500 });
  }
}