import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
// Make sure to add these to your .env.local file
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Create a Razorpay order
 * @param amountUSD - Amount in USD (e.g., 10.00 for $10)
 * @param userId - User's UUID
 * @param tokensPerDollar - Current token rate
 * @returns Razorpay order object
 */
export async function createRazorpayOrder(
  amountUSD: number,
  userId: string,
  tokensPerDollar: number
) {
  try {
    // Razorpay accepts amount in smallest currency unit (paise for INR, cents for USD)
    // We'll use INR as Razorpay's base, convert USD to INR
    const INR_RATE = 83; // You can make this dynamic by calling a currency API
    const amountInINR = Math.round(amountUSD * INR_RATE * 100); // Convert to paise

    const tokenAmount = Math.floor(amountUSD * tokensPerDollar);

    const options = {
      amount: amountInINR, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        user_id: userId,
        amount_usd: amountUSD.toFixed(2),
        tokens_per_dollar: tokensPerDollar.toString(),
        token_amount: tokenAmount.toString(),
        product: 'garliq_tokens',
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
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
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

/**
 * Convert USD to INR for display
 * @param amountUSD - Amount in USD
 * @returns Amount in INR
 */
export function convertUSDtoINR(amountUSD: number): number {
  const INR_RATE = 83; // You can make this dynamic
  return Math.round(amountUSD * INR_RATE);
}

export default razorpay;