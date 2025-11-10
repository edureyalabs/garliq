/**
 * Detect user's country from IP address
 */
export async function detectCountry(ip: string): Promise<'IN' | 'US'> {
  try {
    // Skip detection for localhost/unknown IPs
    if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('::')) {
      return 'US';
    }

    const response = await fetch(`https://ip-api.com/json/${ip}?fields=countryCode`);
    
    if (!response.ok) {
      throw new Error('Geo API failed');
    }
    
    const data = await response.json();
    
    // Return 'IN' for India, 'US' for everything else
    return data.countryCode === 'IN' ? 'IN' : 'US';
  } catch (error) {
    console.error('Geo detection failed:', error);
    // Default to US if detection fails
    return 'US';
  }
}

/**
 * Convert USD to INR (fixed rate for simplicity)
 */
export function convertUSDtoINR(usd: number): number {
  const rate = 83; // 1 USD = 83 INR (update as needed)
  return Math.round(usd * rate);
}