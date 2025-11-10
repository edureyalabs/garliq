/**
 * Detect user's country from IP address
 * Uses IP range detection (no external API calls)
 */
export async function detectCountry(ip: string): Promise<'IN' | 'US'> {
  try {
    // Skip detection for localhost/unknown IPs
    if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('::')) {
      return 'US';
    }

    // Check if IP is in Indian range
    const ipParts = ip.split('.');
    if (ipParts.length === 4) {
      const firstOctet = parseInt(ipParts[0]);
      
      // Common Indian IP ranges (major ISPs)
      // BSNL, Airtel, Jio, Vodafone, MTNL, etc.
      const indianRanges = [
        14, 27, 49, 59, 103, 106, 110, 112, 115, 117, 
        121, 122, 125, 150, 157, 163, 171, 175, 180, 
        182, 183, 202, 203, 210, 220
      ];
      
      if (indianRanges.includes(firstOctet)) {
        console.log(`✅ Geo detected (IP range): ${ip} → IN`);
        return 'IN';
      }
    }

    // Default to US for non-Indian IPs
    console.log(`✅ Geo detected (IP range): ${ip} → US`);
    return 'US';
    
  } catch (error) {
    console.error('Geo detection failed:', error);
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