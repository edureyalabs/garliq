/**
 * Detect user's country from IP address
 */
export async function detectCountry(ip: string): Promise<'IN' | 'US'> {
  try {
    // Skip detection for localhost/unknown IPs
    if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('::')) {
      return 'US';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(
      `https://ipapi.co/${ip}/country_code/`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const countryCode = await response.text();
      const country = countryCode.trim() === 'IN' ? 'IN' : 'US';
      console.log(`✅ Geo detected: ${ip} → ${countryCode.trim()} → ${country}`);
      return country;
    }
    
    throw new Error(`API returned status: ${response.status}`);
    
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