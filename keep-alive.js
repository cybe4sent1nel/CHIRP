// Keep-Alive Script for Render.com
// This script pings your Render backend every 10 minutes to prevent cold starts
// Run this on a free service like cron-job.org or deploy on Vercel as a cron function

import https from 'https';
import http from 'http';

const BACKEND_URL = process.env.BACKEND_URL || 'https://your-backend.onrender.com';

function ping() {
  const url = new URL(`${BACKEND_URL}/health`);
  const protocol = url.protocol === 'https:' ? https : http;
  
  const startTime = Date.now();
  
  const req = protocol.get(url.href, (res) => {
    const duration = Date.now() - startTime;
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`[${new Date().toISOString()}] Ping successful - ${res.statusCode} (${duration}ms)`);
      if (res.statusCode === 200) {
        try {
          const json = JSON.parse(data);
          console.log('Server status:', json);
        } catch (e) {
          console.log('Response:', data.substring(0, 100));
        }
      }
    });
  });
  
  req.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Ping failed:`, error.message);
  });
  
  req.setTimeout(30000, () => {
    req.destroy();
    console.error(`[${new Date().toISOString()}] Ping timeout after 30s`);
  });
}

// Ping immediately on start
console.log(`Starting keep-alive for: ${BACKEND_URL}`);
ping();

// Then ping every 10 minutes (600000ms)
setInterval(ping, 600000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Keep-alive stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Keep-alive stopped');
  process.exit(0);
});
