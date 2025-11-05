// Universal Custom Domain Handler - Cloudflare Workers
// Handles UNLIMITED custom domains automatically

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const pathname = url.pathname;
    
    // Skip if it's your main domains
    if (hostname === 'pebly.vercel.app' || hostname === 'pebly-proxy.vercel.app') {
      return fetch(request);
    }
    
    // For ALL custom domains, proxy to your backend
    const backendUrl = 'https://urlshortner-1-hpyu.onrender.com';
    
    console.log(`🌐 Universal Proxy: ${hostname}${pathname} → ${backendUrl}${pathname}`);
    
    try {
      // Create new request to your backend
      const backendRequest = new Request(`${backendUrl}${pathname}${url.search}`, {
        method: request.method,
        headers: {
          ...request.headers,
          'Host': hostname, // Pass original hostname
          'X-Forwarded-Host': hostname,
          'X-Original-Host': hostname,
          'X-Forwarded-Proto': 'https',
          'User-Agent': request.headers.get('User-Agent') || 'Universal-Proxy/1.0'
        },
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
      });
      
      const response = await fetch(backendRequest);
      
      // Handle redirects (main purpose for short links)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        console.log(`🔄 Redirect: ${response.status} → ${location}`);
        return Response.redirect(location, response.status);
      }
      
      // Handle successful responses
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...response.headers,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
      
      return newResponse;
      
    } catch (error) {
      console.error('❌ Proxy Error:', error);
      
      // Beautiful error page
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Not Found - Pebly</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
              padding: 20px;
            }
            .container {
              background: rgba(255,255,255,0.1);
              padding: 40px;
              border-radius: 20px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255,255,255,0.2);
              text-align: center;
              max-width: 500px;
            }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { font-size: 32px; margin-bottom: 16px; }
            p { margin: 12px 0; opacity: 0.9; }
            .btn { 
              display: inline-block;
              color: #4ecdc4; 
              text-decoration: none; 
              font-weight: 600;
              padding: 14px 28px;
              background: rgba(78, 205, 196, 0.2);
              border-radius: 8px;
              margin-top: 20px;
              transition: all 0.3s ease;
            }
            .btn:hover { 
              background: rgba(78, 205, 196, 0.3);
              transform: translateY(-2px);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🔗</div>
            <h1>Link Not Found</h1>
            <p>The short link you're looking for doesn't exist or has expired.</p>
            <p><strong>Domain:</strong> ${hostname}</p>
            <a href="https://pebly.vercel.app" class="btn">Create Your Own Short Links</a>
          </div>
        </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }
};