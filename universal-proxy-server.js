// Universal Proxy Server - Node.js/Express
// Handles unlimited custom domains

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*'
}));

// Universal proxy middleware
const universalProxy = createProxyMiddleware({
  target: 'https://urlshortner-1-hpyu.onrender.com',
  changeOrigin: true,
  ws: true,
  
  // Add original host headers
  onProxyReq: (proxyReq, req, res) => {
    const originalHost = req.headers.host;
    proxyReq.setHeader('X-Forwarded-Host', originalHost);
    proxyReq.setHeader('X-Original-Host', originalHost);
    proxyReq.setHeader('X-Forwarded-Proto', 'https');
    
    console.log(`🌐 Proxying: ${originalHost}${req.url} → ${proxyReq.getHeader('host')}${req.url}`);
  },
  
  // Handle errors
  onError: (err, req, res) => {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Service Unavailable</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1>🔗 Service Temporarily Unavailable</h1>
        <p>Please try again in a few moments.</p>
        <a href="https://pebly.vercel.app">Create Your Own Short Links</a>
      </body>
      </html>
    `);
  }
});

// Apply proxy to all routes
app.use('/', universalProxy);

app.listen(PORT, () => {
  console.log(`🚀 Universal Proxy Server running on port ${PORT}`);
  console.log(`📡 Proxying all domains to: https://urlshortner-1-hpyu.onrender.com`);
});

module.exports = app;