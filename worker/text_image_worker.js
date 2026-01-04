/**
 * Enhanced Cloudflare Worker - Intelligent AI Handler
 * Features:
 * - Automatic model selection based on query analysis
 * - Image generation detection & routing
 * - Web search with multiple providers
 * - Robust error handling & retries
 * - Vision/multimodal support
 * - Streaming-ready architecture
 */

const handler = {
  async fetch(request, env) {
    const API_KEY = env.API_KEY;
    const url = new URL(request.url);
    const auth = request.headers.get("Authorization");

    // Authentication check
    if (auth !== `Bearer ${API_KEY}`) {
      return json({ error: "Unauthorized" }, 401);
    }

    if (request.method !== "POST" || url.pathname !== "/") {
      return json({ error: "Not allowed" }, 405);
    }

    try {
      const body = await request.json();
      const prompt = body.prompt;
      const systemPrompt = body.systemPrompt || '';
      const history = Array.isArray(body.history) ? body.history : [];
      const maxRetries = body.maxRetries || 2;
      const timeout = body.timeout || 30000;

      if (!prompt) return json({ error: "Prompt is required" }, 400);

      // Advanced query analyzer
      const queryAnalysis = analyzeQuery(prompt);

      // Model catalog with Cloudflare Workers AI models
      const MODEL_CATALOG = [
        // Image models (quality tier)
        { id: '@cf/stability/stable-diffusion', type: 'image', free: true, tier: 'standard', speed: 'medium' },
        { id: '@cf/stability/stable-diffusion-xl-lightning', type: 'image', free: true, tier: 'fast', speed: 'fast' },
        { id: '@cf/black-forest-labs/flux-1-schnell', type: 'image', free: false, tier: 'premium', speed: 'medium' },
        { id: '@cf/black-forest-labs/flux-2-dev', type: 'image', free: false, tier: 'ultra', speed: 'slow' },

        // Text models - Small (fast, free)
        { id: '@cf/meta/llama-3.2-3b-instruct', type: 'text', free: true, size: 'small', tier: 'fast', quality: 2 },
        { id: '@cf/qwen/qwen1.5-0.5b-chat', type: 'text', free: true, size: 'tiny', tier: 'fastest', quality: 1 },
        { id: '@cf/tiiuae/falcon-7b-instruct', type: 'text', free: true, size: 'small', tier: 'fast', quality: 3 },

        // Text models - Medium (balanced)
        { id: '@cf/meta/llama-3-8b-instruct', type: 'text', free: true, size: 'medium', tier: 'balanced', quality: 4 },
        { id: '@cf/mistral/mistral-7b-instruct-v0.1', type: 'text', free: true, size: 'medium', tier: 'balanced', quality: 4 },

        // Text models - Large (quality, paid)
        { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', type: 'text', free: false, size: 'large', tier: 'premium', quality: 8 },
        { id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', type: 'text', free: false, size: 'large', tier: 'premium', quality: 7 },
        { id: '@cf/google/gemma-3-12b-it', type: 'text', free: false, size: 'medium-large', tier: 'premium', quality: 6 },
      ];

      // Smart model picker based on multiple criteria
      const pickModel = (type, criteria = {}) => {
        const { preferFree = body.freePreferred !== false, preferSpeed = false, preferQuality = false } = criteria;

        let candidates = MODEL_CATALOG.filter(m => m.type === type);

        if (!candidates.length) return null;

        // Filter by free preference
        if (preferFree) {
          const free = candidates.filter(m => m.free);
          if (free.length) candidates = free;
        }

        // Sort by preference
        if (type === 'text') {
          candidates.sort((a, b) => {
            if (preferQuality) return (b.quality || 0) - (a.quality || 0);
            if (preferSpeed) {
              const tierPriority = { 'fastest': 5, 'fast': 4, 'balanced': 3, 'premium': 2 };
              return (tierPriority[b.tier] || 0) - (tierPriority[a.tier] || 0);
            }
            return (b.quality || 0) - (a.quality || 0); // Default: balance quality
          });
        }

        return candidates[0]?.id || null;
      };

      // Intelligent text model selection
      const pickTextModel = () => {
        const { isComplex, isCode, isCreative, isTechnical, complexity, length } = queryAnalysis;

        // Complex reasoning & research → Largest model
        if (isComplex || complexity > 7 || length > 1000) {
          return pickModel('text', { preferQuality: true }) ||
                 pickModel('text', { preferQuality: true, preferFree: true });
        }

        // Code & technical → Medium+ model (Llama or Mistral)
        if (isCode || isTechnical) {
          const candidates = MODEL_CATALOG.filter(m => m.type === 'text' && (m.id.includes('llama') || m.id.includes('mistral')));
          return candidates[0]?.id || pickModel('text', { preferQuality: true });
        }

        // Creative writing → Larger balanced model
        if (isCreative) {
          const candidates = MODEL_CATALOG.filter(m => m.type === 'text' && (m.size === 'medium' || m.size === 'large'));
          return candidates[0]?.id || pickModel('text', { preferQuality: true });
        }

        // Quick tasks → Fast model
        if (length < 100 && complexity < 3) {
          return pickModel('text', { preferSpeed: true });
        }

        // Default: balanced quality model
        return pickModel('text');
      };

      // Smart image model selection
      const pickImageModel = () => {
        const { style } = queryAnalysis;

        if (!style) return pickModel('image');

        if (style.includes('photorealistic') || style.includes('portrait') || style.includes('realistic')) {
          const stable = MODEL_CATALOG.find(m => m.type === 'image' && m.id.includes('stable'));
          return stable?.id || pickModel('image');
        }

        if (style.includes('stylized') || style.includes('illustration') || style.includes('cartoon') || style.includes('anime')) {
          const flux = MODEL_CATALOG.find(m => m.type === 'image' && m.id.includes('flux'));
          return flux?.id || pickModel('image');
        }

        return pickModel('image');
      };

      // Enhanced web search with retry & multiple providers
      const doWebSearch = async (q) => {
        const searchProviders = [];

        // Try SerpAPI (best quality)
        if (env.SERPAPI_KEY) {
          searchProviders.push({
            name: 'SerpAPI',
            fn: async () => {
              const resp = await fetch(
                `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&api_key=${env.SERPAPI_KEY}&num=10`,
                { signal: AbortSignal.timeout(10000) }
              );
              if (!resp.ok) throw new Error('SerpAPI failed');
              const jr = await resp.json();
              const items = jr.organic_results || [];
              return items.slice(0, 10).map((v) => ({
                title: v.title || '',
                snippet: v.snippet || '',
                url: v.link || '',
                source: 'SerpAPI',
                position: v.position || 0
              }));
            }
          });
        }

        // Try Bing Search (reliable fallback)
        if (env.SEARCH_API_KEY) {
          searchProviders.push({
            name: 'Bing',
            fn: async () => {
              const resp = await fetch(
                `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}&count=10&setLang=en`,
                {
                  headers: { 'Ocp-Apim-Subscription-Key': env.SEARCH_API_KEY },
                  signal: AbortSignal.timeout(10000)
                }
              );
              if (!resp.ok) throw new Error('Bing failed');
              const jr = await resp.json();
              return (jr.webPages?.value || []).slice(0, 10).map((v) => ({
                title: v.name || '',
                snippet: v.snippet || '',
                url: v.url || '',
                source: 'Bing',
                position: 0
              }));
            }
          });
        }

        // Try Brave Search (free alternative)
        if (env.BRAVE_API_KEY) {
          searchProviders.push({
            name: 'Brave',
            fn: async () => {
              const resp = await fetch(
                `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=10`,
                {
                  headers: { 'Accept': 'application/json', 'X-Subscription-Token': env.BRAVE_API_KEY },
                  signal: AbortSignal.timeout(10000)
                }
              );
              if (!resp.ok) throw new Error('Brave failed');
              const jr = await resp.json();
              return (jr.web || []).slice(0, 10).map((v) => ({
                title: v.title || '',
                snippet: v.description || '',
                url: v.url || '',
                source: 'Brave',
                position: 0
              }));
            }
          });
        }

        if (searchProviders.length === 0) {
          return { error: 'No search provider configured', results: [] };
        }

        // Try providers in sequence with fallback
        for (const provider of searchProviders) {
          try {
            const results = await provider.fn();
            return { results, provider: provider.name };
          } catch (e) {
            console.warn(`${provider.name} search failed:`, e.message);
            continue;
          }
        }

        return { error: 'All search providers failed', results: [] };
      };

      // Fetch with retry logic
      const fetchWithRetry = async (fetchUrl, options = {}, retries = 3) => {
        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            const signal = AbortSignal.timeout(timeout);
            const resp = await fetch(fetchUrl, { ...options, signal });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return resp;
          } catch (e) {
            if (attempt === retries - 1) throw e;
            const backoff = Math.pow(2, attempt) * 1000;
            await new Promise(r => setTimeout(r, backoff));
          }
        }
      };

      // Route: Web search
      if (body.tool === 'search' || queryAnalysis.needsSearch) {
        const q = body.q || prompt.replace(/^(search|search the web[:\-]?|look up[:\-]?)/i, '').trim();
        const res = await doWebSearch(q);
        return json({ response: res });
      }

      // Route: Image generation (auto-detect + automatic routing)
      if (queryAnalysis.isImage || body.type === 'image') {
        const model = pickImageModel();
        if (!model) return json({ error: 'No image model available' }, 400);

        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push(...history);
        messages.push({ role: 'user', content: prompt });

        const runOpts = {
          width: body.width || 768,
          height: body.height || 768,
          steps: body.steps || 20,
          guidance_scale: body.guidance_scale !== undefined ? body.guidance_scale : 7.5,
        };

        if (body.negative_prompt) runOpts.negative_prompt = body.negative_prompt;
        if (body.seed) runOpts.seed = body.seed;

        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const aiResponse = await env.AI.run(model, { messages, ...runOpts });
            
            // Handle different response formats from Cloudflare Workers AI
            let imageData = aiResponse?.response || aiResponse?.output || aiResponse?.result || aiResponse;
            
            // Convert ArrayBuffer or binary data to base64
            if (imageData instanceof ArrayBuffer) {
              const bytes = new Uint8Array(imageData);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              imageData = btoa(binary);
            } else if (imageData instanceof Uint8Array) {
              let binary = '';
              for (let i = 0; i < imageData.length; i++) {
                binary += String.fromCharCode(imageData[i]);
              }
              imageData = btoa(binary);
            }
            
            return json({ response: imageData, model, attempt });
          } catch (e) {
            lastError = e;
            if (attempt < maxRetries - 1) {
              await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
            }
          }
        }

        return json({ error: 'Image generation failed', details: lastError?.message }, 500);
      }

      // Route: Vision/Image analysis
      if (body.vision || body.image) {
        const model = pickModel('text', { preferQuality: true }) || pickModel('text');
        if (!model) return json({ error: 'No model available' }, 400);

        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push(...history);
        messages.push({ role: 'user', content: prompt });

        if (body.image) {
          messages.push({ role: 'user', name: 'image', content: body.image });
        }

        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const aiResponse = await env.AI.run(model, { messages });
            const result = aiResponse?.response || aiResponse?.output || aiResponse?.result;
            return json({ response: result, model });
          } catch (e) {
            lastError = e;
            if (attempt < maxRetries - 1) {
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            }
          }
        }

        return json({ error: 'Vision request failed', details: lastError?.message }, 500);
      }

      // Route: Text generation (default)
      const model = pickTextModel() || pickModel('text');
      if (!model) return json({ error: 'No text model available' }, 400);

      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push(...history);
      messages.push({ role: 'user', content: prompt });

      let lastError;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const aiResponse = await env.AI.run(model, { messages });
          const generatedText = aiResponse?.response || aiResponse?.output || aiResponse?.result || '';
          return json({ response: generatedText, model, analysis: queryAnalysis });
        } catch (e) {
          lastError = e;
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          }
        }
      }

      return json({ error: 'Text generation failed', details: lastError?.message }, 500);

    } catch (err) {
      console.error('Worker error:', err);
      return json({
        error: "Failed to process request",
        details: err?.message || String(err)
      }, 500);
    }
  },
};

export default handler;

/**
 * Query Analysis Engine
 * Detects intent, complexity, style, and routing
 */
function analyzeQuery(prompt) {
  const lower = prompt.toLowerCase();
  const length = prompt.length;
  const tokens = prompt.split(/\s+/).length;

  // Image detection patterns
  const imagePatterns = /image|photo|cover|illustration|album cover|render|png|jpg|jpeg|create an image|generate an image|draw|paint|design|picture|artwork|graphic|visual/i;
  const isImage = imagePatterns.test(lower);

  // Style detection
  const style = [];
  if (/photorealistic|realistic|photo|portrait|headshot|professional|cinematic|accurate|detailed photo/i.test(lower)) {
    style.push('photorealistic');
  }
  if (/stylized|illustration|cartoon|anime|vector|art|creative|abstract|painting|sketch|aesthetic/i.test(lower)) {
    style.push('stylized');
  }

  // Complexity indicators
  const complexityKeywords = /explain|detailed|comprehensive|thorough|research|analyze|break down|compare|contrast|summarize|evaluate|complex|advanced|deep dive/i;
  const isComplex = complexityKeywords.test(lower) || length > 500;
  const complexity = isComplex ? Math.min(10, 3 + Math.floor(tokens / 50)) : Math.min(5, Math.floor(tokens / 20));

  // Code detection
  const codeKeywords = /code|javascript|typescript|python|sql|algorithm|function|class|method|variable|loop|array|database|html|css|json|xml|git|bash|terminal|command/i;
  const isCode = codeKeywords.test(lower);

  // Technical/Professional
  const techKeywords = /technical|api|server|database|architecture|system design|infrastructure|devops|kubernetes|docker|cloud|deployment|performance|optimization/i;
  const isTechnical = techKeywords.test(lower) || isCode;

  // Creative writing
  const creativeKeywords = /story|poem|creative|write|novel|fiction|dialogue|character|narrative|plot|script|drama|humor|joke|riddle|tongue twister/i;
  const isCreative = creativeKeywords.test(lower);

  // Search intent
  const searchKeywords = /search|look up|find|latest|current|recent|news|information|what is|how to|best|top|list|where|when|who|trending/i;
  const needsSearch = searchKeywords.test(lower) && !isImage && !isCode;

  return {
    isImage,
    isCode,
    isTechnical,
    isComplex,
    isCreative,
    needsSearch,
    style,
    length,
    tokens,
    complexity,
  };
}

/**
 * JSON Response Helper
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}
