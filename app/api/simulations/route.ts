// app/api/simulations/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkApiSubscription } from '@/lib/api-subscription-check';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Create new simulation
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
    const { prompt, topicCategory } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (prompt.length > 5000) {
      return NextResponse.json({ error: 'Prompt too long (max 5000 characters)' }, { status: 400 });
    }

    console.log('🎨 Creating simulation:', { userId: user!.id, prompt: prompt.substring(0, 100) });

    // Create simulation record
    const { data: simulation, error } = await supabase
      .from('simulations')
      .insert({
        user_id: user!.id,
        title: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        prompt: prompt,
        topic_category: topicCategory || 'other',
        generation_status: 'pending',
        retry_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Simulation creation error:', error);
      throw error;
    }

    console.log('✅ Simulation created:', simulation.id);

    return NextResponse.json({ 
      simulation,
      success: true 
    });

  } catch (error: any) {
    console.error('❌ Create simulation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create simulation',
      success: false 
    }, { status: 500 });
  }
}

// GET - List user's simulations
export async function GET(request: Request) {
  const authCheck = await checkApiSubscription();
  
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.error === 'Unauthorized' ? 401 : 403 }
    );
  }

  const user = authCheck.user;

  try {
    const { data: simulations, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ 
      simulations: simulations || [],
      success: true 
    });

  } catch (error: any) {
    console.error('Fetch simulations error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch simulations',
      success: false 
    }, { status: 500 });
  }
}