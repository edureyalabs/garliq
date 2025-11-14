// app/api/regenerate-simulation/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SIMULATION_SERVICE_URL = process.env.SIMULATION_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const { simulationId, userId } = await request.json();

    if (!simulationId || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        success: false 
      }, { status: 400 });
    }

    console.log(`🔄 Regenerating simulation ${simulationId}`);

    // Get simulation
    const { data: simulation } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .single();

    if (!simulation) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 });
    }

    // Update status to generating
    await supabase
      .from('simulations')
      .update({
        generation_status: 'generating',
        generation_error: null
      })
      .eq('id', simulationId);

    // Trigger regeneration
    fetch(`${SIMULATION_SERVICE_URL}/generate-simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: simulation.prompt,
        user_id: userId,
        simulation_id: simulationId,
        topic_category: simulation.topic_category,
        retry_count: (simulation.retry_count || 0) + 1
      })
    }).catch(err => {
      console.error('Failed to trigger regeneration:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Regeneration started',
      simulationId: simulationId
    });

  } catch (error: any) {
    console.error('❌ Regenerate simulation API error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to regenerate simulation'
    }, { status: 500 });
  }
}