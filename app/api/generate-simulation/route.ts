// app/api/generate-simulation/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkApiSubscription } from '@/lib/api-subscription-check';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SIMULATION_SERVICE_URL = process.env.SIMULATION_SERVICE_URL || 'http://localhost:8000';

export const maxDuration = 300;

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
    const { simulationId, userId, topicCategory } = await request.json();

    if (!simulationId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('🚀 Generation request received:', { simulationId });

    // Get simulation
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .single();

    if (simError || !simulation) {
      console.error('Simulation not found:', simError);
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 });
    }

    // ==================== TOKEN BALANCE CHECK ====================
    const MINIMUM_TOKENS = 10000;
    
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('token_balance')
      .eq('user_id', userId)
      .single();

    const balance = wallet?.token_balance || 0;

    if (balance < MINIMUM_TOKENS) {
      await supabase
        .from('simulations')
        .update({ 
          generation_status: 'failed',
          generation_error: `Insufficient tokens. You need at least ${MINIMUM_TOKENS.toLocaleString()} tokens.`
        })
        .eq('id', simulationId);

      return NextResponse.json({ 
        error: `Insufficient tokens. Required: ${MINIMUM_TOKENS.toLocaleString()}, Available: ${balance.toLocaleString()}`,
        success: false 
      }, { status: 402 });
    }

    // ==================== UPDATE STATUS TO GENERATING ====================
    await supabase
      .from('simulations')
      .update({ 
        generation_status: 'generating',
        generation_error: null
      })
      .eq('id', simulationId);

    // ==================== TRIGGER ASYNC GENERATION ====================
    console.log('🔥 Triggering simulation generation...');
    
    fetch(`${SIMULATION_SERVICE_URL}/generate-simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: simulation.prompt,
        user_id: userId,
        simulation_id: simulationId,
        topic_category: topicCategory || simulation.topic_category,
        retry_count: simulation.retry_count || 0
      })
    }).catch(err => {
      console.error('Failed to trigger simulation generation:', err);
    });

    // Return immediately - frontend will listen via Supabase Realtime
    return NextResponse.json({ 
      success: true,
      message: 'Simulation generation started',
      simulationId: simulationId
    });

  } catch (error: any) {
    console.error('❌ API Route Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Server error',
      success: false 
    }, { status: 500 });
  }
}