import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRazorpayOrder } from '@/lib/razorpay';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/payments/create-order
 * Creates a new Razorpay payment order
 * 
 * Body:
 * {
 *   "amountUSD": 10.00,  // Amount in USD (min $3)
 *   "userId": "uuid"     // User's UUID
 * }
 */
export async function POST(request: Request) {
  try {
    const { amountUSD, userId } = await request.json();

    // Validation
    if (!amountUSD || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: amountUSD, userId' },
        { status: 400 }
      );
    }

    // Validate amount
    const amount = parseFloat(amountUSD);
    if (isNaN(amount) || amount < 3) {
      return NextResponse.json(
        { error: 'Minimum purchase amount is $3 USD' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('💰 Creating payment order:', { amountUSD, userId });

    // Step 1: Get current token price from database
    const { data: tokenPriceData, error: priceError } = await supabase
      .rpc('get_current_token_price');

    if (priceError) {
      console.error('Error fetching token price:', priceError);
      return NextResponse.json(
        { error: 'Failed to fetch token price' },
        { status: 500 }
      );
    }

    const tokensPerDollar = tokenPriceData || 1000000;
    const tokenAmount = Math.floor(amount * tokensPerDollar);

    console.log('📊 Token calculation:', {
      tokensPerDollar,
      tokenAmount,
    });

    // Step 2: Create Razorpay order
    const razorpayResult = await createRazorpayOrder(
      amount,
      userId,
      tokensPerDollar
    );

    if (!razorpayResult.success || !razorpayResult.order) {
      console.error('Razorpay order creation failed:', razorpayResult.error);
      return NextResponse.json(
        { error: razorpayResult.error || 'Failed to create payment order' },
        { status: 500 }
      );
    }

    const razorpayOrder = razorpayResult.order;

    console.log('✅ Razorpay order created:', razorpayOrder.id);

    // Step 3: Save order to database
    const { data: dbOrder, error: dbError } = await supabase
      .rpc('create_payment_order', {
        p_user_id: userId,
        p_amount_usd: amount,
        p_razorpay_order_id: razorpayOrder.id,
        p_ip_address: request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown',
        p_user_agent: request.headers.get('user-agent') || 'unknown',
      });

    if (dbError) {
      console.error('Database order creation failed:', dbError);
      return NextResponse.json(
        { error: 'Failed to save order to database' },
        { status: 500 }
      );
    }

    console.log('✅ Order saved to database:', dbOrder);

    // Step 4: Return order details to frontend
    return NextResponse.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount, // Amount in paise/smallest unit
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },
      tokens: {
        tokensPerDollar,
        tokenAmount,
        amountUSD: amount,
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID, // Frontend needs this
    });

  } catch (error: any) {
    console.error('❌ Create order error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create payment order',
        success: false 
      },
      { status: 500 }
    );
  }
}