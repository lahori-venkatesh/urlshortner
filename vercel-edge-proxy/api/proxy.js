/**
 * Vercel Edge Function - Universal Custom Domain Proxy
 * Handles unlimited custom domains for Pebly URL Shortener
 */

export default async function handler(request) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  const pathname = url.pathname;
  const search = url.search;
  
  // Your backend URL
  const BACKEND_URL = 'https://urlshortner-1-hpyu.onrender.com';
  
  console.log(`🌐 Edge Proxy: ${hostname}${pathname} → ${BACKEND_URL}${pathname}`);
  
  // Handle health check
  if (pathname === '/health' || pathname === '/_health' || url.searchParams.get('health')) {
    return new Response(JSON.stringify({
      status: 'healthy',
      proxy: 'vercel-edge',
      timestamp: new Date().toISOString(),
      hostname
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Handle debug requests
  if (pathname === '/debug' || pathname === '/_debug' || url.searchParams.get('debug')) {
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      hostname,
      pathname,
      search,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      backendUrl: BACKEND_URL,
      proxyType: 'vercel-edge'
    }, null, 2), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  try {
    // Create request to backend
    const backendUrl = `${BACKEND_URL}${pathname}${search}`;
    
    const backendRequest = new Request(backendUrl, {
      method: request.method,
      headers: {
        // Forward important headers
        'User-Agent': request.headers.get('User-Agent') || 'Pebly-Edge-Proxy/1.0',
        'Accept': request.headers.get('Accept') || '*/*',
        'Accept-Language': request.headers.get('Accept-Language') || 'en-US,en;q=0.9',
        
        // Custom headers for backend
        'X-Forwarded-Host': hostname,
        'X-Original-Host': hostname,
        'X-Forwarded-Proto': 'https',
        'X-Forwarded-For': request.headers.get('X-Forwarded-For') || 'unknown',
        'X-Real-IP': request.headers.get('X-Real-IP') || 'unknown',
        
        // Vercel specific headers
        'X-Vercel-Edge': 'true',
        'X-Proxy-Version': '1.0',
        'X-Proxy-Timestamp': new Date().toISOString(),
        
        // Set host to backend
        'Host': new URL(BACKEND_URL).hostname
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });
    
    // Fetch from backend
    const response = await fetch(backendRequest);
    
    console.log(`📡 Backend Response: ${response.status} ${response.statusText}`);
    
    // Handle redirects (main purpose for short links)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        console.log(`🔄 Redirecting to: ${location}`);
        
        return Response.redirect(location, response.status);
      }
    }
    
    // Handle successful responses
    if (response.ok) {
      const contentType = response.headers.get('content-type') || 'text/html';
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Cache-Control': response.headers.get('Cache-Control') || 'public, max-age=300',
          'X-Powered-By': 'Pebly Edge Proxy v1.0',
          'X-Proxy-Host': hostname,
          'X-Response-Time': new Date().toISOString()
        }
      });
    }
    
    // Handle error responses from backend
    console.log(`❌ Backend Error: ${response.status} - ${response.statusText}`);
    return createErrorPage(hostname, pathname, response.status, 'Backend Error');
    
  } catch (error) {
    console.error('❌ Proxy Error:', error.message);
    return createErrorPage(hostname, pathname, 500, error.message);
  }
}

/**
 * Create error page
 */
function createErrorPage(hostname, pathname, statusCode = 404, errorMessage = 'Not Found') {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Link Not Found - Pebly</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }
        .error { color: #e74c3c; font-size: 48px; margin-bottom: 20px; }
        h1 { color: #2c3e50; margin-bottom: 20px; }
        p { color: #7f8c8d; margin: 10px 0; }
        .details { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error">🔗</div>
        <h1>Link Not Found</h1>
        <p>The short link you're looking for doesn't exist or has expired.</p>
        <div class="details">
          <strong>Domain:</strong> ${hostname}<br>
          <strong>Path:</strong> ${pathname}<br>
          <strong>Status:</strong> ${statusCode}<br>
          <strong>Error:</strong> ${errorMessage}<br>
          <strong>Time:</strong> ${new Date().toISOString()}
        </div>
        <p><a href="https://pebly.vercel.app">Create your own short links</a></p>
      </div>
    </body>
    </html>
  `;
  
  return new Response(html, {
    status: statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Powered-By': 'Pebly Edge Proxy'
    }
  });
}

export const config = {
  runtime: 'edge'
};