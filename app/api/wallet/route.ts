import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ 
      wallet: data || { token_balance: 0 },
      success: true 
    });
  } catch (error: any) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch wallet',
      success: false 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, amount, description } = await request.json();

    if (!userId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase.rpc('add_tokens', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description || 'Token purchase'
    });

    if (error) throw error;

    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('token_balance')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({ 
      success: true,
      balance: wallet?.token_balance || 0
    });
  } catch (error: any) {
    console.error('Add tokens error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to add tokens',
      success: false 
    }, { status: 500 });
  }
}