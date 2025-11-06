/**
 * Analytics and monitoring utilities for Pebly Universal Proxy
 */

export class ProxyAnalytics {
  constructor(env) {
    this.env = env;
  }

  /**
   * Track a request through the proxy
   */
  async trackRequest(request, response, hostname, startTime) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const analytics = {
      timestamp: new Date().toISOString(),
      hostname,
      path: new URL(request.url).pathname,
      method: request.method,
      status: response.status,
      duration,
      country: request.headers.get('CF-IPCountry') || 'unknown',
      userAgent: request.headers.get('User-Agent') || 'unknown',
      referer: request.headers.get('Referer') || 'direct',
      cfRay: request.headers.get('CF-Ray') || 'unknown'
    };

    // Log to console for debugging
    console.log('📊 Analytics:', JSON.stringify(analytics));

    // In production, you could send this to your analytics service
    // await this.sendToAnalytics(analytics);
    
    return analytics;
  }

  /**
   * Send analytics data to external service (implement as needed)
   */
  async sendToAnalytics(data) {
    // Example: Send to your backend analytics endpoint
    // try {
    //   await fetch('https://your-backend.com/api/analytics', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(data)
    //   });
    // } catch (error) {
    //   console.error('Failed to send analytics:', error);
    // }
  }

  /**
   * Track domain verification attempts
   */
  async trackDomainVerification(hostname, success, error = null) {
    const verification = {
      timestamp: new Date().toISOString(),
      hostname,
      success,
      error: error?.message || null,
      type: 'domain_verification'
    };

    console.log('🔍 Domain Verification:', JSON.stringify(verification));
    // await this.sendToAnalytics(verification);
  }

  /**
   * Track redirect performance
   */
  async trackRedirect(hostname, targetUrl, duration) {
    const redirect = {
      timestamp: new Date().toISOString(),
      hostname,
      targetUrl,
      duration,
      type: 'redirect'
    };

    console.log('🔄 Redirect Tracked:', JSON.stringify(redirect));
    // await this.sendToAnalytics(redirect);
  }
}

/**
 * Health check utilities
 */
export class HealthCheck {
  static async checkBackendHealth(backendUrl) {
    try {
      const response = await fetch(`${backendUrl}/actuator/health`, {
        method: 'GET',
        headers: { 'User-Agent': 'Pebly-Proxy-HealthCheck/2.0' }
      });
      
      return {
        healthy: response.ok,
        status: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  static async performHealthCheck(env) {
    const backendUrl = env.BACKEND_URL || 'https://urlshortner-1-hpyu.onrender.com';
    const health = await this.checkBackendHealth(backendUrl);
    
    console.log('🏥 Health Check:', JSON.stringify(health));
    return health;
  }
}