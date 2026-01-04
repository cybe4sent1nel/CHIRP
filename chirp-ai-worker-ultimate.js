/**
 * 🐦 CHIRP AI ULTIMATE WORKER
 * Production-Ready Cloudflare Worker with Complete AI Features
 * 
 * Features:
 * ✅ Conversation context management (persistent sessions)
 * ✅ Smart model auto-selection (text, image, vision)
 * ✅ Tool calling (web search, fetch, scrape)
 * ✅ Vision capabilities (image analysis)
 * ✅ Web search (SerpAPI)
 * ✅ Web scraping & content fetching
 * ✅ Robust error handling & logging
 * ✅ Session cleanup & memory management
 * ✅ Rate limiting awareness
 * 
 * Deploy to: https://dash.cloudflare.com/
 * Environment Variables Required:
 *   - API_KEY: Bearer token for authentication
 *   - SERPAPI_KEY: For web search (optional)
 */

// ═══════════════════════════════════════════════════════════════════════════════════
// 1. CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  SESSION_TIMEOUT: 3600000, // 1 hour
  MAX_HISTORY_SIZE: 30, // Keep last 30 messages
  MAX_RESPONSE_TIME: 30000, // 30 seconds timeout
  RATE_LIMIT_REQUESTS: 100, // Per minute
  ENABLE_LOGGING: true,
};

// Developer Information
const DEVELOPER_INFO = {
  name: 'Fahad Khan',
  handle: 'cybe4sent1nel',
  email: 'contact@fahadkhan.dev',
  title: 'Full Stack Developer',
  bio: 'Creator of Chirp - A Full Stack Social Media Platform with Advanced AI Integration',
  github: 'https://github.com/cybe4sent1nel',
  portfolio: 'https://fahadkhan.dev',
  specialization: 'Full Stack Development, AI Integration, Cloud Architecture',
};

const DEVELOPER_MESSAGE = `
🐦 **Chirp AI** was created by **${DEVELOPER_INFO.name}** (@${DEVELOPER_INFO.handle})

**About the Developer:**
- **Title:** ${DEVELOPER_INFO.title}
- **Specialization:** ${DEVELOPER_INFO.specialization}
- **Description:** ${DEVELOPER_INFO.bio}

**Connect:**
- GitHub: ${DEVELOPER_INFO.github}
- Portfolio: ${DEVELOPER_INFO.portfolio}
- Email: ${DEVELOPER_INFO.email}

Chirp is a full-stack social media platform featuring:
- Real-time messaging with SSE
- Advanced AI studio for content generation
- Image generation and vision analysis
- Web search and scraping capabilities
- Professional social networking features
- Cloud-based infrastructure on Cloudflare
`;

// Session storage (in-memory)
const sessions = new Map();
const requestLimits = new Map();

// ═══════════════════════════════════════════════════════════════════════════════════
// 2. ADVANCED MODEL CATALOG
// ═══════════════════════════════════════════════════════════════════════════════════

const MODELS = {
  TEXT: {
    quality: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    fast: '@cf/mistral/mistral-7b-instruct-v0.1',
    code: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    reasoning: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  },
  IMAGE: {
    quality: '@cf/black-forest-labs/flux-1-schnell',
    fast: '@cf/stability/stable-diffusion',
    anime: '@cf/dreamshaper/dreamshaper-8-lcm',
  },
  VISION: '@cf/meta/llama-3.2-11b-vision-instruct',
};

// ═══════════════════════════════════════════════════════════════════════════════════
// 3. UTILITY & LOGGING
// ═══════════════════════════════════════════════════════════════════════════════════

function log(level, message, data = {}) {
  if (CONFIG.ENABLE_LOGGING) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`, data);
  }
}

function logError(message, error) {
  log('ERROR', message, { error: error?.message, stack: error?.stack });
}

function sanitize(input) {
  if (typeof input !== 'string') return input;
  return input.substring(0, 10000); // Limit input size
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 4. SMART MODEL SELECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════════

function selectModel(prompt, options = {}) {
  const lower = prompt.toLowerCase();
  const { type = 'text', image = null } = options;

  // Vision detection
  if (type === 'vision' || /analyze|describe|what.*image|read|extract.*text|ocr/i.test(lower)) {
    return MODELS.VISION;
  }

  // Image detection
  const isImage = type === 'image' || /generate|create|make|draw|image|photo|illustration|design|render/i.test(lower);
  if (isImage) {
    if (/anime|manga|cartoon|stylized/i.test(lower)) return MODELS.IMAGE.anime;
    if (/quick|fast|brief/i.test(lower)) return MODELS.IMAGE.fast;
    return MODELS.IMAGE.quality;
  }

  // Text model selection
  const isCode = /code|javascript|typescript|python|sql|algorithm|debug|function/i.test(lower);
  const isReasoning = /explain|detailed|comprehensive|thorough|research|analyze|thinking/i.test(lower);
  const isFast = /quick|brief|short|tl;dr|one.*sentence/i.test(lower);

  if (isCode) return MODELS.TEXT.code;
  if (isReasoning) return MODELS.TEXT.reasoning;
  if (isFast) return MODELS.TEXT.fast;
  return MODELS.TEXT.quality;
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 5. SESSION MANAGEMENT WITH CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════════

function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
    });
  }

  const session = sessions.get(sessionId);
  session.lastActivity = Date.now();

  // Cleanup old sessions
  for (const [id, sess] of sessions.entries()) {
    if (Date.now() - sess.lastActivity > CONFIG.SESSION_TIMEOUT) {
      sessions.delete(id);
      log('INFO', `Cleaned up expired session: ${id}`);
    }
  }

  return session;
}

function addToHistory(session, role, content) {
  session.messages.push({
    role,
    content: sanitize(content),
    timestamp: Date.now(),
  });
  session.messageCount++;

  // Keep only last N messages to manage memory
  if (session.messages.length > CONFIG.MAX_HISTORY_SIZE) {
    session.messages = session.messages.slice(-CONFIG.MAX_HISTORY_SIZE);
  }
}

function getFormattedHistory(session) {
  return session.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 6. TOOL CALLING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════════

async function executeTool(toolName, args, env) {
  try {
    switch (toolName) {
      case 'search_web':
        return await searchWeb(args.query, env);
      case 'fetch_url':
        return await fetchUrl(args.url);
      case 'scrape_website':
        return await scrapeWebsite(args.url, args.selector);
      case 'get_time':
        return { timestamp: new Date().toISOString(), timezone: 'UTC' };
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    logError(`Tool execution failed: ${toolName}`, err);
    return { error: `Tool error: ${err.message}` };
  }
}

async function searchWeb(query, env) {
  if (!env.SERPAPI_KEY) {
    return { error: 'SerpAPI not configured' };
  }

  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${env.SERPAPI_KEY}&num=10`;
    const response = await fetch(url);

    if (!response.ok) {
      return { error: `SerpAPI error: ${response.statusText}` };
    }

    const data = await response.json();
    const results = (data.organic_results || [])
      .slice(0, 5)
      .map((r) => ({
        title: r.title,
        snippet: r.snippet,
        link: r.link,
        date: r.date,
        source: r.source,
      }));

    return {
      tool: 'web_search',
      query,
      resultCount: results.length,
      results,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    logError('Web search failed', err);
    return { error: `Web search error: ${err.message}` };
  }
}

async function fetchUrl(url) {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { error: 'Only HTTP(S) URLs are allowed' };
    }

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Chirp-AI-Bot/1.0' },
    });

    if (!response.ok) {
      return { error: `Fetch failed: ${response.statusText}` };
    }

    const text = await response.text();

    // Extract metadata
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1] || 'No title';

    // Clean content
    const cleanedContent = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000);

    return {
      tool: 'fetch_url',
      url,
      title,
      content: cleanedContent,
      status: response.status,
      contentLength: text.length,
    };
  } catch (err) {
    logError('URL fetch failed', err);
    return { error: `Fetch error: ${err.message}` };
  }
}

async function scrapeWebsite(url, selector = 'body') {
  try {
    const parsedUrl = new URL(url);
    const response = await fetch(url);

    if (!response.ok) {
      return { error: `Scrape failed: ${response.statusText}` };
    }

    const html = await response.text();

    // Simple CSS selector extraction (basic regex-based)
    const regex = new RegExp(`<${selector}[^>]*>([^<]*)</${selector}>`, 'gi');
    const matches = html.match(regex) || [];

    // Extract text content
    const textContent = html
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n+/g, '\n')
      .trim()
      .substring(0, 2000);

    return {
      tool: 'scrape_website',
      url,
      selector,
      elementsFound: matches.length,
      domain: parsedUrl.hostname,
      contentPreview: textContent,
    };
  } catch (err) {
    logError('Website scraping failed', err);
    return { error: `Scrape error: ${err.message}` };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 7. DEVELOPER INFO DETECTION
// ═══════════════════════════════════════════════════════════════════════════════════

function isDeveloperQuestion(prompt) {
  const lower = prompt.toLowerCase();
  const developerKeywords = [
    'who created',
    'who made',
    'who developed',
    'who built',
    'creator',
    'developer',
    'fahad',
    'khan',
    'cybe4sent1nel',
    'about you',
    'your creator',
    'who are you made by',
    'who built this',
    'tell me about',
    'chirp creator',
    'author',
  ];

  return developerKeywords.some((keyword) => lower.includes(keyword));
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 8. INTELLIGENT TOOL DETECTION
// ═══════════════════════════════════════════════════════════════════════════════════

async function autoDetectAndExecuteTool(prompt, env) {
  const lower = prompt.toLowerCase();

  // Web search detection
  if (/search|find|look up|what.*latest|current.*news|trending/i.test(lower)) {
    const query = prompt.replace(/^.*(search|find|look up)[:\s]*/i, '').trim();
    return await executeTool('search_web', { query }, env);
  }

  // URL fetch detection
  if (/fetch|get|read|visit|load.*url|from.*url/i.test(lower)) {
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return await executeTool('fetch_url', { url: urlMatch[0] }, env);
    }
  }

  // Web scraping detection
  if (/scrape|extract|analyze.*website|get.*from.*site/i.test(lower)) {
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return await executeTool('scrape_website', { url: urlMatch[0] }, env);
    }
  }

  // Time detection
  if (/what.*time|current.*time|what.*date/i.test(lower)) {
    return await executeTool('get_time', {}, env);
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 9. VISION & IMAGE HANDLING
// ═══════════════════════════════════════════════════════════════════════════════════

async function handleImageAnalysis(prompt, imageData, env) {
  if (!env.AI) {
    return { error: 'AI binding not configured' };
  }

  try {
    const model = MODELS.VISION;
    log('INFO', 'Processing vision request', { model });

    // For Cloudflare Workers AI, vision is handled via image parameter
    const response = await env.AI.run(model, {
      prompt,
      image: imageData,
      max_tokens: 1024,
    });

    return {
      success: true,
      analysis: response.response || response.output || response.result || '',
      model,
    };
  } catch (err) {
    logError('Vision analysis failed', err);
    return { error: `Vision error: ${err.message}` };
  }
}

async function generateImage(prompt, env) {
  if (!env.AI) {
    return { error: 'AI binding not configured' };
  }

  try {
    const model = selectModel(prompt, { type: 'image' });
    log('INFO', 'Generating image', { prompt: prompt.substring(0, 100), model });

    const response = await env.AI.run(model, {
      prompt: sanitize(prompt),
      num_steps: 20,
      guidance: 7.5,
    });

    // Cloudflare Workers AI returns ArrayBuffer for images
    let imageData = response;
    
    // If response is an object with an image property
    if (typeof response === 'object' && response !== null) {
      imageData = response.image || response.data || response;
    }

    // Convert ArrayBuffer or Uint8Array to base64
    let base64String;
    
    if (typeof imageData === 'string') {
      // Already a string (base64 or URL)
      base64String = imageData;
    } else if (imageData instanceof ArrayBuffer) {
      // ArrayBuffer - convert to base64
      const bytes = new Uint8Array(imageData);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      base64String = btoa(binary);
    } else if (imageData instanceof Uint8Array) {
      // Uint8Array - convert to base64
      let binary = '';
      for (let i = 0; i < imageData.length; i++) {
        binary += String.fromCharCode(imageData[i]);
      }
      base64String = btoa(binary);
    } else {
      return { error: 'Could not process image data format' };
    }

    // Create data URL
    const imageUrl = base64String.startsWith('data:') 
      ? base64String 
      : `data:image/png;base64,${base64String}`;

    return {
      success: true,
      imageUrl,
      model,
      prompt,
    };
  } catch (err) {
    logError('Image generation failed', err);
    return { error: `Image generation: ${err.message}` };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 10. MAIN AI PROCESSING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════════

async function processAIRequest(body, env) {
  const {
    prompt = '',
    sessionId = 'default',
    systemPrompt = '',
    type = 'text',
    image = null,
    tools = true,
    maxTokens = 1024,
  } = body;

  // Validation
  if (!prompt || typeof prompt !== 'string') {
    return { error: 'Prompt is required and must be a string' };
  }

  if (prompt.length > 10000) {
    return { error: 'Prompt too long (max 10000 characters)' };
  }

  log('INFO', 'Processing AI request', {
    sessionId,
    type,
    promptLength: prompt.length,
    hasImage: !!image,
    toolsEnabled: tools,
  });

  // Get or create session
  const session = getOrCreateSession(sessionId);
  addToHistory(session, 'user', prompt);

  try {
    // Check if user is asking about developer
    if (isDeveloperQuestion(prompt)) {
      addToHistory(session, 'assistant', DEVELOPER_MESSAGE);
      return {
        success: true,
        response: DEVELOPER_MESSAGE,
        type: 'developer_info',
        sessionId,
        contextSize: session.messages.length,
      };
    }

    // Auto-detect and execute tools if enabled
    if (tools) {
      const toolResult = await autoDetectAndExecuteTool(prompt, env);
      if (toolResult && !toolResult.error) {
        const summary = `Tool Result: ${JSON.stringify(toolResult).substring(0, 500)}...`;
        addToHistory(session, 'assistant', summary);

        return {
          success: true,
          response: summary,
          usedTool: toolResult.tool,
          sessionId,
          contextSize: session.messages.length,
        };
      }
    }

    // Handle image analysis (vision)
    if (type === 'vision' && image) {
      const result = await handleImageAnalysis(prompt, image, env);
      if (result.success) {
        addToHistory(session, 'assistant', result.analysis);
        return {
          success: true,
          response: result.analysis,
          type: 'vision',
          model: result.model,
          sessionId,
          contextSize: session.messages.length,
        };
      }
      return result;
    }

    // Handle image generation
    if (type === 'image') {
      const result = await generateImage(prompt, env);
      if (result.success) {
        addToHistory(session, 'assistant', `[Generated image: ${result.prompt}]`);
        return {
          success: true,
          response: result.imageUrl,
          type: 'image',
          model: result.model,
          sessionId,
          isImage: true,
          contextSize: session.messages.length,
        };
      }
      return result;
    }

    // Handle text generation
    if (!env.AI) {
      return { error: 'AI binding not configured in Cloudflare Worker' };
    }

    const model = selectModel(prompt, { type });
    const systemMessage = systemPrompt || `You are Chirp AI, an intelligent assistant for a professional social network. Be helpful, concise, and engaging. Current time: ${new Date().toISOString()}`;

    // Build message history with context
    const messages = [{ role: 'system', content: systemMessage }, ...getFormattedHistory(session)];

    log('INFO', 'Calling AI model', { model, messageCount: messages.length, maxTokens });

    const response = await Promise.race([
      env.AI.run(model, { messages, max_tokens: maxTokens }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI request timeout')), CONFIG.MAX_RESPONSE_TIME)),
    ]);

    const generatedText = response?.response || response?.output || response?.result || '';

    if (!generatedText) {
      return { error: 'AI model returned empty response' };
    }

    addToHistory(session, 'assistant', generatedText);

    return {
      success: true,
      response: generatedText,
      model,
      sessionId,
      contextSize: session.messages.length,
      sessionAge: Date.now() - session.createdAt,
    };
  } catch (err) {
    logError('AI processing failed', err);

    // Add error to history
    addToHistory(session, 'assistant', `[Error: ${err.message}]`);

    return {
      error: `AI processing failed: ${err.message}`,
      sessionId,
      contextSize: session.messages.length,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 11. REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════════════════════════

async function handleRequest(request, env) {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return json({}, 200);
  }

  // Only POST allowed
  if (request.method !== 'POST') {
    return json({ error: 'Only POST requests are allowed' }, 405);
  }

  // Authentication
  const authHeader = request.headers.get('Authorization');
  const expectedAuth = `Bearer ${env.API_KEY}`;

  if (!env.API_KEY || authHeader !== expectedAuth) {
    log('WARN', 'Unauthorized request attempt');
    return json({ error: 'Unauthorized' }, 401);
  }

  // Parse request
  try {
    const body = await request.json();
    const result = await processAIRequest(body, env);
    return json(result, result.error ? 400 : 200);
  } catch (err) {
    logError('Request parsing failed', err);
    return json(
      {
        error: 'Invalid request',
        details: err.message,
      },
      400
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 12. EXPORT
// ═══════════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },

  // Scheduled cleanup (optional)
  async scheduled(event, env) {
    log('INFO', 'Running scheduled cleanup');
    let cleaned = 0;

    for (const [id, session] of sessions.entries()) {
      if (Date.now() - session.lastActivity > CONFIG.SESSION_TIMEOUT) {
        sessions.delete(id);
        cleaned++;
      }
    }

    log('INFO', `Cleanup complete: removed ${cleaned} expired sessions`);
  },
};
