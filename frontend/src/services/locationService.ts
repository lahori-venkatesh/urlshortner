interface LocationInfo {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
}

interface ClickEvent {
  linkId: string;
  userId: string;
  timestamp: string;
  location: LocationInfo;
  userAgent: string;
  referrer: string;
  ip: string;
}

class LocationService {
  private baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '/api/v1') || 'https://urlshortner-mrrl.onrender.com/api/v1';

  // Get user's current location using IP geolocation
  async getCurrentLocation(): Promise<LocationInfo | null> {
    try {
      // First try to get location from browser geolocation API
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false
          });
        });

        // Use reverse geocoding to get location details
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
        );
        
        if (response.ok) {
          const data = await response.json();
          return {
            country: data.countryName || 'Unknown',
            countryCode: data.countryCode || 'XX',
            city: data.city || data.locality || 'Unknown',
            region: data.principalSubdivision || 'Unknown',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            isp: 'Unknown'
          };
        }
      }

      // Fallback to IP-based geolocation
      const ipResponse = await fetch('https://ipapi.co/json/');
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        return {
          country: ipData.country_name || 'Unknown',
          countryCode: ipData.country_code || 'XX',
          city: ipData.city || 'Unknown',
          region: ipData.region || 'Unknown',
          latitude: ipData.latitude || 0,
          longitude: ipData.longitude || 0,
          timezone: ipData.timezone || 'UTC',
          isp: ipData.org || 'Unknown'
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  // Track a click event with location data
  async trackClick(linkId: string, userId: string): Promise<void> {
    try {
      const location = await this.getCurrentLocation();
      
      const clickEvent: ClickEvent = {
        linkId,
        userId,
        timestamp: new Date().toISOString(),
        location: location || {
          country: 'Unknown',
          countryCode: 'XX',
          city: 'Unknown',
          region: 'Unknown',
          latitude: 0,
          longitude: 0,
          timezone: 'UTC',
          isp: 'Unknown'
        },
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        ip: 'hidden' // IP will be captured on backend
      };

      // Send to backend
      await fetch(`${this.baseUrl}/analytics/track-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clickEvent)
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  // Get location analytics for a user
  async getLocationAnalytics(userId: string, timeRange: string = '30d'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/location/${userId}?timeRange=${timeRange}`);
      if (response.ok) {
        return await response.json();
      }
      return { success: false, data: [] };
    } catch (error) {
      console.error('Error fetching location analytics:', error);
      return { success: false, data: [] };
    }
  }

  // Get real-time location stats
  async getRealTimeLocationStats(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/location/realtime/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return { success: false, data: {} };
    } catch (error) {
      console.error('Error fetching real-time location stats:', error);
      return { success: false, data: {} };
    }
  }

  // Get country flags and info
  getCountryFlag(countryCode: string): string {
    const flags: { [key: string]: string } = {
      'IN': '🇮🇳',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'JP': '🇯🇵',
      'CN': '🇨🇳',
      'BR': '🇧🇷',
      'SG': '🇸🇬',
      'NL': '🇳🇱',
      'SE': '🇸🇪',
      'CH': '🇨🇭',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'KR': '🇰🇷',
      'MX': '🇲🇽',
      'RU': '🇷🇺',
      'ZA': '🇿🇦'
    };
    return flags[countryCode] || '🌍';
  }

  // Format location display name
  formatLocationName(city: string, region: string, country: string): string {
    if (city && region && country) {
      return `${city}, ${region}, ${country}`;
    } else if (city && country) {
      return `${city}, ${country}`;
    } else if (country) {
      return country;
    }
    return 'Unknown Location';
  }

  // Calculate distance between two coordinates
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in kilometers
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Get timezone offset for a location
  getTimezoneOffset(timezone: string): string {
    try {
      const now = new Date();
      const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
      const targetTime = new Date(utc.toLocaleString("en-US", {timeZone: timezone}));
      const offset = (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
      return offset >= 0 ? `+${offset}` : `${offset}`;
    } catch (error) {
      return '+0';
    }
  }
}

export const locationService = new LocationService();
export default locationService;