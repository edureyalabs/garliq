import Razorpay from 'razorpay';
import crypto from 'crypto';
import { convertUSDtoINR } from './geo';

/**
 * Create a Razorpay client instance
 * Must be called inside functions to ensure env vars are loaded
 */
function createRazorpayClient() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('Missing credentials:', { 
      hasKeyId: !!keyId, 
      hasKeySecret: !!keySecret 
    });
    throw new Error('Razorpay credentials are not configured');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Create a Razorpay order
 * @param amountUSD - Amount in USD (e.g., 10.00 for $10)
 * @param userId - User's UUID
 * @param tokensPerDollar - Current token rate
 * @param currency - 'USD' or 'INR'
 * @returns Razorpay order object
 */
export async function createRazorpayOrder(
  amountUSD: number,
  userId: string,
  tokensPerDollar: number,
  currency: 'USD' | 'INR' = 'USD'
) {
  try {
    const razorpay = createRazorpayClient();

    // Calculate amount based on currency
    let amountInSmallestUnit: number;
    let displayAmount: number;

    if (currency === 'INR') {
      // Convert USD to INR
      const amountINR = convertUSDtoINR(amountUSD);
      amountInSmallestUnit = amountINR * 100; // Paisa
      displayAmount = amountINR;
    } else {
      // USD
      amountInSmallestUnit = Math.round(amountUSD * 100); // Cents
      displayAmount = amountUSD;
    }

    const tokenAmount = Math.floor(amountUSD * tokensPerDollar);

    const options = {
      amount: amountInSmallestUnit,
      currency: currency,
      receipt: `rcpt_${Date.now()}`,
      notes: {
        user_id: userId,
        amount_usd: amountUSD.toFixed(2),
        tokens_per_dollar: tokensPerDollar.toString(),
        token_amount: tokenAmount.toString(),
        product: 'garliq_tokens',
        display_amount: displayAmount.toString(),
      },
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      order,
      amountUSD,
      tokenAmount,
    };
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create Razorpay order',
    };
  }
}

/**
 * Verify Razorpay payment signature
 * This is CRITICAL for security - ensures payment is legitimate
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param signature - Signature from Razorpay
 * @returns boolean - true if signature is valid
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay secret key is not configured');
    }

    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 * Useful for verification and debugging
 * @param paymentId - Razorpay payment ID
 * @returns Payment object from Razorpay
 */
export async function fetchPaymentDetails(paymentId: string) {
  try {
    const razorpay = createRazorpayClient();
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment,
    };
  } catch (error: any) {
    console.error('Fetch payment details error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate tokens from USD amount
 * @param amountUSD - Amount in USD
 * @param tokensPerDollar - Current rate
 * @returns Token amount
 */
export function calculateTokens(amountUSD: number, tokensPerDollar: number): number {
  return Math.floor(amountUSD * tokensPerDollar);
}