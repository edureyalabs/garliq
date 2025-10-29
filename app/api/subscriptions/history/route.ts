import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.rpc('get_subscription_history', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('History error:', error);
      return NextResponse.json(
        { error: 'Failed to get history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ payments: data || [] });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription history' },
      { status: 500 }
    );
  }
}