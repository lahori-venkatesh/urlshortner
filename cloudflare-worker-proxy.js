// Cloudflare Worker for Universal Custom Domain Proxy
// This handles ALL custom domains pointing to your service

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const pathname = url.pathname;

    // Skip if it's your main domain
    if (hostname === 'tinyslash.com') {
      return fetch(request);
    }

    // For all custom domains, proxy to your backend
    const backendUrl = 'https://urlshortner-1-hpyu.onrender.com';

    // Create new request to your backend
    const backendRequest = new Request(`${backendUrl}${pathname}${url.search}`, {
      method: request.method,
      headers: {
        ...request.headers,
        'Host': hostname, // Pass original hostname
        'X-Forwarded-Host': hostname,
        'X-Original-Host': hostname
      },
      body: request.body
    });

    try {
      const response = await fetch(backendRequest);

      // If it's a redirect response, return it directly
      if (response.status >= 300 && response.status < 400) {
        return response;
      }

      // For other responses, return with CORS headers
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
      // Fallback error page
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1 class="error">Link Not Found</h1>
          <p>The short link you're looking for doesn't exist or has expired.</p>
          <p><a href="https://tinyslash.com">Create your own short links</a></p>
        </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }
};