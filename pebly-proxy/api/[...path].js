// Universal Custom Domain Proxy for Pebly
// This handles ALL custom domains and forwards requests to the backend

export default async function handler(req, res) {
  // Enable CORS for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { path } = req.query;
  const originalHost = req.headers.host;
  
  // Build the full path
  let fullPath = '/';
  if (Array.isArray(path) && path.length > 0) {
    fullPath = '/' + path.join('/');
  } else if (typeof path === 'string') {
    fullPath = '/' + path;
  }
  
  // Add query parameters if they exist
  const url = new URL(req.url, `https://${originalHost}`);
  const queryString = url.search;
  const finalUrl = fullPath + queryString;
  
  // Your backend URL
  const backendUrl = 'https://urlshortner-1-hpyu.onrender.com';
  const targetUrl = backendUrl + finalUrl;
  
  console.log(`🌐 Proxy Request: ${originalHost}${finalUrl} → ${targetUrl}`);
  
  try {
    // Prepare headers for backend request
    const forwardHeaders = {
      'User-Agent': req.headers['user-agent'] || 'Pebly-Proxy/1.0',
      'Accept': req.headers.accept || '*/*',
      'X-Forwarded-For': req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
      'X-Forwarded-Host': originalHost,
      'X-Original-Host': originalHost,
      'X-Forwarded-Proto': 'https',
      'Host': 'urlshortner-1-hpyu.onrender.com'
    };
    
    // Add referer if present
    if (req.headers.referer) {
      forwardHeaders['Referer'] = req.headers.referer;
    }
    
    // Make request to backend
    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders
    };
    
    // Add body for POST/PUT requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      forwardHeaders['Content-Type'] = 'application/json';
    }
    
    const backendResponse = await fetch(targetUrl, fetchOptions);
    
    console.log(`📡 Backend Response: ${backendResponse.status} ${backendResponse.statusText}`);
    
    // Handle redirects (this is the main purpose - short link redirects)
    if (backendResponse.status >= 300 && backendResponse.status < 400) {
      const location = backendResponse.headers.get('location');
      console.log(`🔄 Redirecting to: ${location}`);
      
      if (location) {
        return res.redirect(backendResponse.status, location);
      }
    }
    
    // Handle successful responses
    if (backendResponse.ok) {
      const contentType = backendResponse.headers.get('content-type') || 'text/html';
      const responseBody = await backendResponse.text();
      
      res.setHeader('Content-Type', contentType);
      return res.status(backendResponse.status).send(responseBody);
    }
    
    // Handle error responses from backend
    console.log(`❌ Backend Error: ${backendResponse.status}`);
    return showErrorPage(res, originalHost, fullPath, backendResponse.status);
    
  } catch (error) {
    console.error('❌ Proxy Error:', error.message);
    return showErrorPage(res, originalHost, fullPath, 500);
  }
}

// Error page function
function showErrorPage(res, host, path, statusCode = 404) {
  const errorMessages = {
    404: 'Link Not Found',
    500: 'Server Error',
    502: 'Backend Unavailable',
    503: 'Service Unavailable'
  };
  
  const title = errorMessages[statusCode] || 'Error';
  
  const errorHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Pebly</title>
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
        }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { font-size: 32px; margin-bottom: 16px; font-weight: 600; }
        p { margin: 12px 0; opacity: 0.9; line-height: 1.5; }
        .details { 
          background: rgba(0,0,0,0.2); 
          padding: 16px; 
          border-radius: 8px; 
          margin: 20px 0;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
        }
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🔗</div>
        <h1>${title}</h1>
        <p>The short link you're looking for ${statusCode === 404 ? "doesn't exist or has expired" : "encountered an error"}.</p>
        
        <div class="details">
          <div><strong>Domain:</strong> ${host}</div>
          <div><strong>Path:</strong> ${path}</div>
          <div><strong>Status:</strong> ${statusCode}</div>
          <div><strong>Time:</strong> ${new Date().toISOString()}</div>
        </div>
        
        <p>This might happen if:</p>
        <ul style="text-align: left; margin: 16px 0; opacity: 0.8;">
          <li>• The link has expired or been deleted</li>
          <li>• There's a typo in the URL</li>
          <li>• The custom domain is still propagating (wait 5-10 minutes)</li>
          <li>• The backend service is temporarily unavailable</li>
        </ul>
        
        <a href="https://pebly.vercel.app" class="btn">Create Your Own Short Links</a>
        
        <div class="footer">
          Powered by <strong>Pebly</strong> • Universal Custom Domain Proxy
        </div>
      </div>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(statusCode).send(errorHtml);
}