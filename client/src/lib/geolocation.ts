export interface LocationInfo {
  country: string;
  isFromIndia: boolean;
  preferredLanguage: 'en' | 'hi';
}

// Simple function to detect user's location and preferred language
export async function detectUserLocation(): Promise<LocationInfo> {
  try {
    // Try to get user's timezone first
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isIndianTimezone = timezone.includes('Asia/Kolkata') || timezone.includes('Asia/Calcutta');
    
    // Check browser language preferences
    const browserLang = navigator.language.toLowerCase();
    const isHindiPreferred = browserLang.includes('hi') || browserLang.includes('hindi');
    
    // Try to get more accurate location using a free IP geolocation service
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const isFromIndia = data.country_code === 'IN';
      const preferredLanguage = (isFromIndia && !browserLang.includes('en-us')) ? 'hi' : 'en';
      
      return {
        country: data.country_code || 'US',
        isFromIndia,
        preferredLanguage
      };
    } catch (ipError) {
      // Fallback to timezone and browser language detection
      const isFromIndia = isIndianTimezone;
      const preferredLanguage = (isFromIndia && isHindiPreferred) ? 'hi' : 'en';
      
      return {
        country: isFromIndia ? 'IN' : 'US',
        isFromIndia,
        preferredLanguage
      };
    }
  } catch (error) {
    // Default to English for international users
    return {
      country: 'US',
      isFromIndia: false,
      preferredLanguage: 'en'
    };
  }
}

// Cache the location to avoid multiple API calls
let cachedLocation: LocationInfo | null = null;

export async function getUserLocation(): Promise<LocationInfo> {
  if (cachedLocation) {
    return cachedLocation;
  }
  
  cachedLocation = await detectUserLocation();
  return cachedLocation;
}