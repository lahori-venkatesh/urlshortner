interface GoogleAuthResponse {
  access_token: string;
  id_token: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  verified_email: boolean;
}

class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;
  private scope: string;

  constructor() {
    this.clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
    this.redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback';
    this.scope = 'openid email profile';
    
    // Debug logging
    console.log('GoogleAuthService initialized with:');
    console.log('Client ID:', this.clientId ? `${this.clientId.substring(0, 20)}...` : 'NOT SET');
    console.log('Redirect URI:', this.redirectUri);
    
    if (!this.clientId) {
      console.warn('Google OAuth Client ID not found. Please set REACT_APP_GOOGLE_CLIENT_ID in your .env file and restart your development server.');
    }
  }

  // Check backend configuration
  async checkBackendConfig(): Promise<any> {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/v1/auth/google/config`);
      return await response.json();
    } catch (error) {
      console.error('Failed to check backend config:', error);
      return { success: false, error: 'Unable to connect to backend' };
    }
  }

  // Generate Google OAuth URL
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Exchange authorization code for access token (via backend)
  async exchangeCodeForToken(code: string): Promise<GoogleAuthResponse> {
    console.log('=== Exchanging code for token ===');
    console.log('Code length:', code.length);
    console.log('Redirect URI:', this.redirectUri);
    console.log('API URL:', process.env.REACT_APP_API_URL);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    const endpoint = `${apiUrl}/v1/auth/google/callback`;
    
    console.log('Calling endpoint:', endpoint);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: code,
          redirectUri: this.redirectUri 
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}: Failed to exchange code for token`);
      }

      if (!responseData.success) {
        throw new Error(responseData.message || 'Backend authentication failed');
      }

      return responseData;
    } catch (error) {
      console.error('Token exchange error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to authentication server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  // Get user info from Google
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';
    
    const response = await fetch(userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  // Initiate Google OAuth flow
  initiateAuth(): void {
    const authUrl = this.getAuthUrl();
    window.location.href = authUrl;
  }

  // Handle OAuth callback
  async handleCallback(code: string): Promise<any> {
    try {
      // Exchange code for tokens and get user info from backend
      const authResponse = await this.exchangeCodeForToken(code);
      
      // Store tokens in localStorage (in production, use secure storage)
      if (authResponse.access_token) {
        localStorage.setItem('google_access_token', authResponse.access_token);
      }
      
      return authResponse;
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('google_access_token');
  }

  // Logout user
  logout(): void {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_id_token');
    localStorage.removeItem('user_info');
  }

  // Get stored user info
  getStoredUserInfo(): GoogleUserInfo | null {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  // Store user info
  storeUserInfo(userInfo: GoogleUserInfo): void {
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  }
}

export const googleAuthService = new GoogleAuthService();
export type { GoogleUserInfo, GoogleAuthResponse };