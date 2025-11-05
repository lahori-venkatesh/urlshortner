/**
 * Pebly Universal Custom Domain Proxy v2.0
 * Handles UNLIMITED custom domains automatically
 * Enhanced with better error handling, caching, and analytics
 */

import { ProxyAnalytics, HealthCheck } from './analytics.js';

export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const url = new URL(request.url);
    const hostname = url.hostname;
    const pathname = url.pathname;
    const search = url.search;
    
    // Initialize analytics
    const analytics = new ProxyAnalytics(env);
    
    // Handle health check requests
    if (pathname === '/health' || pathname === '/_health') {
      const health = await HealthCheck.performHealthCheck(env);
      return new Response(JSON.stringify(health), {
        headers: { 'Content-Type': 'application/json' },
        status: health.healthy ? 200 : 503
      });
    }
    
    // Handle debug requests for troubleshooting
    if (pathname === '/debug' || pathname === '/_debug') {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        hostname,
        pathname,
        search,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        backendUrl: BACKEND_URL,
        proxyVersion: '2.0',
        cloudflareRay: request.headers.get('CF-Ray'),
        country: request.headers.get('CF-IPCountry'),
        userAgent: request.headers.get('User-Agent')
      };
      
      return new Response(JSON.stringify(debugInfo, null, 2), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Skip if it's your main domains or worker domain
    if (hostname.includes('pebly.vercel.app') || 
        hostname.includes('workers.dev') ||
        hostname.includes('pebly-universal-proxy')) {
      return fetch(request);
    }
    
    // Your backend URL - can be configured via environment variables
    const BACKEND_URL = env.BACKEND_URL || 'https://urlshortner-1-hpyu.onrender.com';
    
    console.log(`🌐 Universal Proxy: ${hostname}${pathname} → ${BACKEND_URL}${pathname}`);
    console.log(`🔍 Request details:`, {
      hostname,
      pathname,
      method: request.method,
      userAgent: request.headers.get('User-Agent'),
      cfCountry: request.headers.get('CF-IPCountry')
    });
    
    // Check cache first for GET requests
    const cacheKey = `${hostname}${pathname}${search}`;
    const cache = caches.default;
    
    if (request.method === 'GET') {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log(`💾 Cache hit: ${cacheKey}`);
        return cachedResponse;
      }
    }
    
    try {
      // Create request to your backend
      const backendUrl = `${BACKEND_URL}${pathname}${search}`;
      
      const backendRequest = new Request(backendUrl, {
        method: request.method,
        headers: {
          // Forward important headers
          'User-Agent': request.headers.get('User-Agent') || 'Pebly-Universal-Proxy/2.0',
          'Accept': request.headers.get('Accept') || '*/*',
          'Accept-Language': request.headers.get('Accept-Language') || 'en-US,en;q=0.9',
          'Accept-Encoding': request.headers.get('Accept-Encoding') || 'gzip, deflate, br',
          
          // Custom headers for your backend
          'X-Forwarded-Host': hostname,
          'X-Original-Host': hostname,
          'X-Forwarded-Proto': 'https',
          'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown',
          'X-Real-IP': request.headers.get('CF-Connecting-IP') || 'unknown',
          
          // Cloudflare specific headers for analytics
          'CF-Ray': request.headers.get('CF-Ray') || 'unknown',
          'CF-Country': request.headers.get('CF-IPCountry') || 'unknown',
          'CF-Visitor': request.headers.get('CF-Visitor') || '{"scheme":"https"}',
          
          // Additional analytics headers
          'X-Proxy-Version': '2.0',
          'X-Proxy-Timestamp': new Date().toISOString(),
          
          // Set host to backend
          'Host': new URL(BACKEND_URL).hostname
        },
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
      });
      
      // Fetch from backend
      const response = await fetch(backendRequest);
      
      console.log(`📡 Backend Response: ${response.status} ${response.statusText}`);
      console.log(`🔍 Response headers:`, Object.fromEntries(response.headers.entries()));
      
      // Handle redirects (main purpose for short links)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          console.log(`🔄 Redirecting to: ${location}`);
          
          // Create redirect response with analytics headers
          const redirectResponse = Response.redirect(location, response.status);
          
          // Add analytics headers to redirect
          redirectResponse.headers.set('X-Proxy-Host', hostname);
          redirectResponse.headers.set('X-Proxy-Version', '2.0');
          redirectResponse.headers.set('X-Redirect-Time', new Date().toISOString());
          
          // Cache successful redirects briefly
          if (request.method === 'GET' && response.status === 301) {
            ctx.waitUntil(cache.put(request, redirectResponse.clone()));
          }
          
          // Track redirect analytics
          ctx.waitUntil(analytics.trackRedirect(hostname, location, Date.now() - startTime));
          
          return redirectResponse;
        }
      }
      
      // Handle successful responses
      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'text/html';
        
        // Create new response with enhanced headers
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Cache-Control': response.headers.get('Cache-Control') || 'public, max-age=300',
            'X-Powered-By': 'Pebly Universal Proxy v2.0',
            'X-Proxy-Host': hostname,
            'X-Proxy-Country': request.headers.get('CF-IPCountry') || 'unknown',
            'X-Response-Time': new Date().toISOString()
          }
        });
        
        // Cache GET responses for performance
        if (request.method === 'GET' && response.status === 200) {
          ctx.waitUntil(cache.put(request, newResponse.clone()));
        }
        
        // Track successful request analytics
        ctx.waitUntil(analytics.trackRequest(request, newResponse, hostname, startTime));
        
        return newResponse;
      }
      
      // Handle error responses from backend
      console.log(`❌ Backend Error: ${response.status} - ${response.statusText}`);
      const errorResponse = createErrorPage(hostname, pathname, response.status, 'Backend Error');
      
      // Track error analytics
      ctx.waitUntil(analytics.trackRequest(request, errorResponse, hostname, startTime));
      
      return errorResponse;
      
    } catch (error) {
      console.error('❌ Proxy Error:', error.message);
      const errorResponse = createErrorPage(hostname, pathname, 500, error.message);
      
      // Track error analytics
      ctx.waitUntil(analytics.trackRequest(request, errorResponse, hostname, startTime));
      
      return errorResponse;
    }
  }
};

/**
 * Create beautiful error page
 */
function createErrorPage(hostname, pathname, statusCode = 404, errorMessage = 'Not Found') {
  const errorMessages = {
    404: 'Link Not Found',
    500: 'Server Error',
    502: 'Backend Unavailable',
    503: 'Service Unavailable'
  };
  
  const title = errorMessages[statusCode] || 'Error';
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Pebly</title>
      <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔗</text></svg>">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          line-height: 1.6;
        }
        .container {
          background: rgba(255,255,255,0.1);
          padding: 40px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          text-align: center;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .icon { 
          font-size: 64px; 
          margin-bottom: 20px; 
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        h1 { 
          font-size: 32px; 
          margin-bottom: 16px; 
          font-weight: 600;
          background: linear-gradient(45deg, #fff, #f0f0f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        p { margin: 12px 0; opacity: 0.9; }
        .details { 
          background: rgba(0,0,0,0.2); 
          padding: 16px; 
          border-radius: 12px; 
          margin: 20px 0;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 14px;
          text-align: left;
        }
        .details div { margin: 4px 0; }
        .btn { 
          display: inline-block;
          color: #4ecdc4; 
          text-decoration: none; 
          font-weight: 600;
          padding: 14px 28px;
          background: rgba(78, 205, 196, 0.2);
          border-radius: 12px;
          margin-top: 20px;
          transition: all 0.3s ease;
          border: 1px solid rgba(78, 205, 196, 0.3);
        }
        .btn:hover { 
          background: rgba(78, 205, 196, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(78, 205, 196, 0.3);
        }
        .footer {
          margin-top: 30px;
          opacity: 0.7;
          font-size: 14px;
        }
        .status-badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          margin: 0 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🔗</div>
        <h1>${title}</h1>
        <p>The short link you're looking for ${statusCode === 404 ? "doesn't exist or has expired" : "encountered an error"}.</p>
        
        <div class="details">
          <div><strong>Domain:</strong> ${hostname}</div>
          <div><strong>Path:</strong> ${pathname}</div>
          <div><strong>Status:</strong> <span class="status-badge">${statusCode}</span></div>
          <div><strong>Error:</strong> ${errorMessage}</div>
          <div><strong>Time:</strong> ${new Date().toISOString()}</div>
          <div><strong>Proxy:</strong> Cloudflare Workers</div>
        </div>
        
        <p><strong>Possible reasons:</strong></p>
        <ul style="text-align: left; margin: 16px 0; opacity: 0.8; padding-left: 20px;">
          <li>The link has expired or been deleted</li>
          <li>There's a typo in the URL</li>
          <li>The custom domain is still propagating (wait 5-10 minutes)</li>
          <li>The backend service is temporarily unavailable</li>
        </ul>
        
        <a href="https://pebly.vercel.app" class="btn">Create Your Own Short Links</a>
        
        <div class="footer">
          Powered by <strong>Pebly</strong> • Universal Custom Domain Proxy<br>
          <small>Cloudflare Workers • Global Edge Network</small>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return new Response(html, {
    status: statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Powered-By': 'Pebly Universal Proxy'
    }
  });
}