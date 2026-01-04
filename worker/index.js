/**
 * Cloudflare Workers AI Script
 * Handles both text and image generation with model selection
 * Deploy to Cloudflare Workers
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Auth check
    const auth = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${env.API_KEY}`;
    if (auth !== expectedAuth) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // Parse route
    if (url.pathname === '/text' && request.method === 'POST') {
      return handleTextRequest(request, env);
    } else if (url.pathname === '/image' && request.method === 'POST') {
      return handleImageRequest(request, env);
    } else {
      return json({ error: 'Not found' }, 404);
    }
  },
};

async function handleTextRequest(request, env) {
  try {
    const body = await request.json();
    const prompt = body.prompt;
    const systemPrompt = body.systemPrompt || '';

    if (!prompt) {
      return json({ error: 'Prompt is required' }, 400);
    }

    // Model selection logic
    const model = selectTextModel(prompt);

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await env.AI.run(model, { messages });
    const text = response?.response || response?.output || response?.result || '';

    return json({ response: text });
  } catch (error) {
    console.error('Text generation error:', error);
    return json({ error: 'Failed to generate text', details: error.message }, 500);
  }
}

async function handleImageRequest(request, env) {
  try {
    const body = await request.json();
    const prompt = body.prompt;

    if (!prompt) {
      return json({ error: 'Prompt is required' }, 400);
    }

    // Model selection for images
    const model = selectImageModel(prompt);

    const response = await env.AI.run(model, {
      prompt,
      ...body.options,
    });

    // Return image data
    const imageData = response?.image || response?.output || response?.result;
    return new Response(imageData, {
      headers: {
        'Content-Type': 'image/png',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return json({ error: 'Failed to generate image', details: error.message }, 500);
  }
}

function selectTextModel(prompt) {
  const lower = prompt.toLowerCase();

  // Complex reasoning tasks
  if (/explain|detailed|comprehensive|thorough|research|analyze|complex/i.test(lower)) {
    return '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
  }

  // Code/technical
  if (/code|javascript|typescript|python|sql|algorithm|function/i.test(lower)) {
    return '@cf/qwen/qwen-2.5-72b-instruct';
  }

  // Quick responses
  if (/quick|brief|short|summary|tldr|one[- ]?liner/i.test(lower)) {
    return '@cf/mistral/mistral-7b-instruct-v0.2';
  }

  // Default - balanced model
  return '@cf/meta/llama-3.1-8b-instruct-fp8';
}

function selectImageModel(prompt) {
  const lower = prompt.toLowerCase();

  // Photo-realistic
  if (/photoreal|realistic|photo|portrait|headshot|photograph/i.test(lower)) {
    return '@cf/stability/stable-diffusion';
  }

  // Stylized/artistic
  if (/stylized|illustration|cartoon|anime|art|painting/i.test(lower)) {
    return '@cf/stability/stable-diffusion-xl-lightning';
  }

  // Default
  return '@cf/stability/stable-diffusion-xl-base-1.0';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
