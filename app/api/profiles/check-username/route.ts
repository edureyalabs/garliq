import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, userId } = body;

    if (!username) {
      return NextResponse.json(
        { available: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate format
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({
        available: false,
        error: 'Username must be 3-20 characters'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({
        available: false,
        error: 'Only letters, numbers, and underscores allowed'
      });
    }

    if (/^_|_$/.test(username)) {
      return NextResponse.json({
        available: false,
        error: 'Cannot start or end with underscore'
      });
    }

    // Check availability
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', userId || '')
      .single();

    const available = !existingUser;

    return NextResponse.json({
      available,
      error: available ? null : 'Username is already taken'
    });
  } catch (error: any) {
    console.error('Check username error:', error);
    return NextResponse.json(
      { available: false, error: 'Failed to check username' },
      { status: 500 }
    );
  }
}