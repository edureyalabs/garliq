// app/api/simulations/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get single simulation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: simulationId } = await params;

    console.log('📖 Fetching simulation:', simulationId);

    const { data: simulation, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .single();

    if (error) {
      console.error('Simulation query error:', error);
      throw error;
    }

    if (!simulation) {
      return NextResponse.json({ 
        error: 'Simulation not found',
        simulation: null
      }, { status: 404 });
    }

    console.log('✅ Simulation loaded:', {
      simulationId,
      generation_status: simulation.generation_status
    });

    return NextResponse.json({
      simulation,
      success: true
    });

  } catch (error: any) {
    console.error('❌ Simulation fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch simulation',
      simulation: null
    }, { status: 500 });
  }
}

// PATCH - Update simulation (for publishing, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: simulationId } = await params;
    const body = await request.json();

    console.log('✏️ Updating simulation:', simulationId);

    const { data: simulation, error } = await supabase
      .from('simulations')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', simulationId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Simulation updated');

    return NextResponse.json({ 
      simulation,
      success: true 
    });

  } catch (error: any) {
    console.error('❌ Simulation update error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update simulation',
      success: false 
    }, { status: 500 });
  }
}

// DELETE - Delete simulation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: simulationId } = await params;

    console.log('🗑️ Deleting simulation:', simulationId);

    // Delete simulation (cascade will handle related records)
    const { error } = await supabase
      .from('simulations')
      .delete()
      .eq('id', simulationId);

    if (error) throw error;

    console.log('✅ Simulation deleted');

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Simulation delete error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete simulation',
      success: false 
    }, { status: 500 });
  }
}