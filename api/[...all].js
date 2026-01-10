import handler from '../server/server.js';

// Vercel will route any /api/* request to this catch-all function
// and our Express app will handle the path as normal.
export default handler;
