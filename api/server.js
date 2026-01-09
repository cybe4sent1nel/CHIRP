import handler from '../server/server.js';

// Re-export the serverless handler so Vercel will deploy it as an API function at /api/server
export default handler;
