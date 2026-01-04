/**
 * 🐦 Chirp Advanced AI Worker
 * Cloudflare Workers Script with:
 * - Context/conversation history management
 * - Smart model auto-selection (text, image, vision)
 * - Tool calling (function execution)
 * - Web search (SerpAPI)
 * - Vision capabilities (image analysis)
 * - Web scraping & content fetching
 *
 * Deploy this to: https://dash.cloudflare.com/
 * Environment Variables Required:
 *   - API_KEY: Bearer token for auth
 *   - SERPAPI_KEY: For web search
 *   - JSONDIFF_API: For vision (optional, use CF Workers AI)
 */

// Session storage for conversation context (in-memory, resets on worker restart)
const sessions = new Map();

const SESSION_TIMEOUT = 3600000; // 1 hour

// ═══════════════════════════════════════════════════════════════════════════════════
// 1. MODEL CATALOG WITH AUTO-SELECTION
// ═══════════════════════════════════════════════════════════════════════════════════

const MODEL_CATALOG = {
  TEXT: {
    quality: [
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
      '@cf/mistralai/mistral-small-3.1-24b-instruct',
    ],
    fast: [
      '@cf/mistral/mistral-7b-instruct-v0.1',
      '@cf/meta/llama-3-8b-instruct',
      '@cf/qwen/qwen1.5-0.5b-chat',
    ],
    code: [
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    ],
    reasoning: [
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    ],
  },
  IMAGE: {
    quality: [
      '@cf/black-forest-labs/flux-1-schnell',
      '@cf/stability/stable-diffusion-xl-base-1.0',
    ],
    fast: [
      '@cf/stability/stable-diffusion',
      '@cf/stability/stable-diffusion-xl-lightning',
    ],
    anime: [
      '@cf/dreamshaper/dreamshaper-8-lcm',
    ],
  },
  VISION: [
    '@cf/meta/llama-3.2-11b-vision-instruct',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════════
// 2. SMART MODEL SELECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════════

function selectModel(prompt, options = {}) {
  const lower = prompt.toLowerCase();
  const isImage = options.type === 'image' || /image|photo|picture|generate|illustration|design|render|create an image/i.test(lower);
  const isVision = options.vision || /analyze|describe|what.*image|tell.*about.*image|ocr|extract.*text|read/i.test(lower);
  const isCode = /code|javascript|typescript|python|sql|algorithm|function|debug/i.test(lower);
  const isReasoning = /explain|detailed|comprehensive|thorough|research|analyze deeply/i.test(lower);
  const isFast = /quick|brief|one sentence|short|tl;dr/i.test(lower);

  if (isVision && options.image) {
    return MODEL_CATALOG.VISION[0];
  }

  if (isImage) {
    const category = /anime|manga|cartoon|stylized/i.test(lower) ? 'anime' : isFast ? 'fast' : 'quality';
    return MODEL_CATALOG.IMAGE[category][0];
  }

  // Text model selection
  let category = 'quality';
  if (isFast) category = 'fast';
  else if (isCode) category = 'code';
  else if (isReasoning) category = 'reasoning';

  return MODEL_CATALOG.TEXT[category][0];
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 3. TOOL CALLING - FUNCTION EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════════

async function executeTool(toolName, args, env) {
  switch (toolName) {
    case 'web_search':
      return await searchWeb(args.query, env);
    case 'fetch_url':
      return await fetchAndParse(args.url);
    case 'scrape_web':
      return await scrapeWebsite(args.url, args.selector);
    case 'get_current_time':
      return { timestamp: new Date().toISOString() };
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function searchWeb(query, env) {
  if (!env.SERPAPI_KEY) {
    return { error: 'SERPAPI_KEY not configured' };
  }

  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${env.SERPAPI_KEY}&num=10`;
    const response = await fetch(url);
    const data = await response.json();

    const results = (data.organic_results || []).map((r) => ({
      title: r.title,
      snippet: r.snippet,
      link: r.link,
      date: r.date,
    }));

    return {
      query,
      count: results.length,
      results: results.slice(0, 5),
    };
  } catch (err) {
    return { error: `Web search failed: ${err.message}` };
  }
}

async function fetchAndParse(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();

    // Simple HTML parsing - extract title and first 1000 chars
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'No title';
    const content = text.substring(0, 2000).replace(/<[^>]*>/g, ' ');

    return {
      url,
      title,
      content: content.trim(),
      status: response.status,
    };
  } catch (err) {
    return { error: `Fetch failed: ${err.message}` };
  }
}

async function scrapeWebsite(url, selector = 'body') {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Simple CSS selector extraction (basic implementation)
    const selectorRegex = new RegExp(`<${selector}[^>]*>([^<]*)</${selector}>`, 'gi');
    const matches = html.match(selectorRegex) || [];

    return {
      url,
      selector,
      elementsFound: matches.length,
      preview: matches.slice(0, 3).join(' '),
    };
  } catch (err) {
    return { error: `Scraping failed: ${err.message}` };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 4. OPENROUTER FALLBACK (when Cloudflare AI not available)
// ═══════════════════════════════════════════════════════════════════════════════════

async function callOpenRouter(prompt, systemPrompt, env) {
  const apiKey = env.OPENROUTER_API_KEY || '';
  
  if (!apiKey) {
    return 'Error: No AI provider configured (need OPENROUTER_API_KEY in worker env)';
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chirp.social',
        'X-Title': 'Chirp AI',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return `OpenRouter error: ${err.error?.message || response.statusText}`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response from OpenRouter';
  } catch (err) {
    return `OpenRouter request failed: ${err.message}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 5. CONTEXT MANAGEMENT (CONVERSATION HISTORY)
// ═══════════════════════════════════════════════════════════════════════════════════

function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      history: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });
  }

  const session = sessions.get(sessionId);
  session.lastActivity = Date.now();

  // Clean up old sessions
  for (const [id, sess] of sessions.entries()) {
    if (Date.now() - sess.lastActivity > SESSION_TIMEOUT) {
      sessions.delete(id);
    }
  }

  return session;
}

function addToHistory(session, role, content) {
  session.history.push({ role, content, timestamp: Date.now() });
  // Keep last 20 messages to manage memory
  if (session.history.length > 20) {
    session.history = session.history.slice(-20);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 6. MAIN AI REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════════════════════════

async function processAIRequest(body, env) {
  const {
    prompt,
    sessionId = 'default',
    systemPrompt = '',
    type = 'text', // 'text' | 'image' | 'vision'
    image = null,
    tools = false,
    maxTokens = 1024,
  } = body;

  if (!prompt) {
    return { error: 'Prompt is required' };
  }

  const session = getOrCreateSession(sessionId);
  addToHistory(session, 'user', prompt);

  // System prompt
  const defaultSystem = `You are Chirp AI, an intelligent assistant for a professional social network. 
You are helpful, concise, and professional. You follow instructions carefully and provide accurate information.
Current time: ${new Date().toISOString()}`;

  const finalSystemPrompt = systemPrompt || defaultSystem;

  // Build messages array with context
  const messages = [];
  if (finalSystemPrompt) {
    messages.push({ role: 'system', content: finalSystemPrompt });
  }

  // Add conversation history
  for (const msg of session.history.slice(-10)) {
    messages.push(msg);
  }

  try {
    // Check if user wants to use a tool
    if (tools && /search|fetch|scrape|tool/.test(prompt.toLowerCase())) {
      const toolResult = await handleToolRequest(prompt, env);
      if (toolResult) {
        addToHistory(session, 'assistant', `Tool result: ${JSON.stringify(toolResult)}`);
        return {
          success: true,
          response: toolResult,
          usedTool: true,
          sessionId,
        };
      }
    }

    // Auto-detect and select appropriate model
    const model = selectModel(prompt, { type, image: !!image, vision: type === 'vision' });

    // Call Cloudflare Workers AI
    if (!env.AI) {
      return {
        error: 'AI binding not configured in Cloudflare Worker settings',
        sessionId,
      };
    }

    let response, generatedText;

    if (type === 'image') {
      // Image generation has different format
      try {
        response = await env.AI.run(model, {
          prompt: prompt,
          num_steps: 20,
        });
        // Image models return binary data or URL
        generatedText = response.image || response.url || response.response || 'Image generation completed';
      } catch (imgErr) {
        generatedText = `Image generation error: ${imgErr.message}. Try a simpler prompt.`;
      }
    } else {
      // Text/Vision generation
      const options = { messages };
      if (maxTokens) options.max_tokens = maxTokens;
      
      response = await env.AI.run(model, options);
      generatedText = response.response || response.output || response.result || '';
    }

    addToHistory(session, 'assistant', generatedText);

    return {
      success: true,
      response: generatedText,
      model,
      sessionId,
      contextMessages: session.history.length,
    };
  } catch (err) {
    return {
      error: `AI request failed: ${err.message}`,
      details: err.toString(),
    };
  }
}

async function handleToolRequest(prompt, env) {
  const lower = prompt.toLowerCase();

  if (/search|web search|find|look up/.test(lower)) {
    const query = prompt.replace(/^.*(search|find|look up)[:\s]*/i, '').trim();
    return await searchWeb(query, env);
  }

  if (/fetch|get|read.*url|visit/.test(lower)) {
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return await fetchAndParse(urlMatch[0]);
    }
  }

  if (/scrape|extract/.test(lower)) {
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return await scrapeWebsite(urlMatch[0]);
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 7. REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════════════════════════

async function handleRequest(request, env) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authentication
  const authHeader = request.headers.get('Authorization');
  const apiKey = env.API_KEY;

  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return json({ error: 'Unauthorized' }, 401, corsHeaders);
  }

  // Only POST allowed
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed. Use POST.' }, 405, corsHeaders);
  }

  try {
    const body = await request.json();
    const result = await processAIRequest(body, env);
    return json(result, 200, corsHeaders);
  } catch (err) {
    return json(
      { error: 'Failed to process request', details: err.message },
      400,
      corsHeaders
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 8. UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 9. EXPORT HANDLER
// ═══════════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};
