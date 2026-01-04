/**
 * AI Service - Multi-Provider Integration
 * Supports: OpenRouter, Gemini, Stability, Replicate, Freepik
 * Based on CHIRP2.0's advanced AI library
 */

// Model selection based on task type
const AI_MODELS = {
  // Best for: Post suggestions, bio generation, general chat
  GENERAL: process.env.AI_MODEL_GENERAL || 'google/gemini-2.0-flash-exp:free',
  // Best for: Complex reasoning, analysis
  REASONING: process.env.AI_MODEL_REASONING || 'meta-llama/llama-3.3-70b-instruct:free',
  // Best for: Coding, technical content
  CODE: process.env.AI_MODEL_CODE || 'qwen/qwen-2.5-72b-instruct:free',
  // Best for: Quick responses, simple tasks
  FAST: process.env.AI_MODEL_FAST || 'mistralai/mistral-small-24b-instruct-2501:free',
  // Best for: Image generation
  IMAGE: process.env.AI_MODEL_IMAGE || 'black-forest-labs/flux-1.1-pro',
};

/**
 * Core AI request function with multi-provider fallback
 */
async function aiRequest(
  prompt,
  systemPrompt = '',
  options = {}
) {
  // Try Cloudflare Worker first if configured
  const workerUrl = process.env.TEXT_API_URL;
  const workerKey = process.env.TEXT_API_BEARER;

  if (workerUrl && workerKey) {
    try {
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${workerKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          systemPrompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.response || data.generatedText || data.result || null;
        if (typeof text === 'string' && text.length > 0) {
          return { success: true, content: text };
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn('Worker request failed:', errData);
      }
    } catch (err) {
      console.warn('Worker request error:', err.message);
      // Fall through to OpenRouter
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  // If no OpenRouter key, return error
  if (!apiKey) {
    return { success: false, error: 'No AI provider configured (configure Cloudflare Worker or OpenRouter)' };
  }

  const defaultSystemPrompt = `You are Chirp AI — a friendly, funky, and professional assistant for a LinkedIn-style app called Chirp. Follow these rules:
1) Be neutral, non-biased, and avoid discriminatory or harmful content.
2) Prioritize user safety; refuse clearly illegal, violent, or unsafe instructions and offer safe alternatives.
3) Keep replies concise, helpful, and professional. Use light humor and emojis sparingly.
4) Favor constructive, networking-focused guidance.`;

  const finalSystemPrompt = systemPrompt && systemPrompt.trim() ? systemPrompt : defaultSystemPrompt;

  // Determine max tokens based on request
  const determineMaxTokens = (text) => {
    const t = text.toLowerCase();
    if (/\b(one[- ]?liner|one sentence|short|brief|tl;dr)\b/.test(t)) return 60;
    if (/\b(long|detailed|in depth|comprehensive)\b/.test(t)) return 800;
    if (/\b(medium|moderate|paragraph)\b/.test(t)) return 250;
    return 300;
  };

  const maxTokens = options.maxTokens || determineMaxTokens(prompt + ' ' + finalSystemPrompt);
  const model = AI_MODELS[options.model || 'GENERAL'];
  const base = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        'X-Title': 'Chirp Social Network',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: options.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('AI request failed:', errorData);
      return {
        success: false,
        error: errorData.error?.message || `API Error: ${response.status}`
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'No response from AI' };
    }

    return { success: true, content };
  } catch (error) {
    console.error('AI Request Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI request failed'
    };
  }
}

/**
 * Generate image using Replicate API (stable way to get image URLs)
 */
async function generateImage(prompt, options = {}) {
  // Try Cloudflare Worker first if configured
  const workerUrl = process.env.IMAGE_API_URL;
  const workerKey = process.env.IMAGE_API_BEARER;

  if (workerUrl && workerKey) {
    try {
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${workerKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          ...options,
        }),
      });

      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(imageBuffer).toString('base64');
        return { success: true, content: `data:image/png;base64,${base64}` };
      } else {
        const errData = await response.text().catch(() => '');
        console.warn('Worker image request failed:', errData);
      }
    } catch (err) {
      console.warn('Worker image request error:', err.message);
      // Fall through to Replicate
    }
  }

  // Use Replicate API for stable image generation
  const replicateKey = process.env.REPLICATE_API_KEY;
  if (replicateKey) {
    return await generateImageViaReplicate(prompt, replicateKey);
  }

  // Fallback to OpenRouter if available
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    return await generateImageViaOpenRouter(prompt, openrouterKey);
  }

  return { success: false, error: 'No image provider configured' };
}

async function generateImageViaReplicate(prompt, apiKey) {
  try {
    // Step 1: Create prediction
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'a45f82a1d50fab339ca15f90cb29c7fdec53053bb6c56e8e49f2e8881577570e',
        input: {
          prompt: prompt,
          num_inference_steps: 20,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json().catch(() => ({}));
      console.error('Replicate creation error:', error);
      return { success: false, error: 'Failed to start image generation' };
    }

    const prediction = await createResponse.json();
    const predictionUrl = prediction.urls.get;

    // Step 2: Poll for completion
    let completed = false;
    let output = null;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes with 1 second intervals

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const statusResponse = await fetch(predictionUrl, {
        headers: {
          'Authorization': `Token ${apiKey}`,
        },
      });

      if (statusResponse.ok) {
        const status = await statusResponse.json();
        if (status.status === 'succeeded') {
          output = status.output?.[0];
          completed = true;
        } else if (status.status === 'failed') {
          return { success: false, error: 'Image generation failed' };
        }
      }

      attempts++;
    }

    if (!output) {
      return { success: false, error: 'Image generation timed out' };
    }

    return { success: true, content: output };
  } catch (error) {
    console.error('Replicate generation error:', error);
    return { success: false, error: 'Image generation failed' };
  }
}

async function generateImageViaOpenRouter(prompt, apiKey) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chirp.social',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux-1.1-pro',
        messages: [{ role: 'user', content: `Generate an image: ${prompt}` }],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter error:', response.statusText);
      return { success: false, error: 'OpenRouter image generation failed' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'No image generated' };
    }

    // OpenRouter returns image as markdown or direct content
    return { success: true, content: content };
  } catch (error) {
    console.error('OpenRouter image error:', error);
    return { success: false, error: 'Image generation failed' };
  }
}

/**
 * Generate post suggestions
 */
async function generatePostSuggestions(topic, industry, tone = 'professional') {
  const systemPrompt = `You are a professional social media content creator for Chirp (LinkedIn-like platform).
Generate 3 engaging post ideas that are relevant, valuable, and encourage engagement.
Keep posts concise (under 300 characters).
Focus on the ${industry || 'general professional'} industry.
Tone: ${tone}`;

  const prompt = `Generate 3 unique post ideas about: "${topic}"
Format each as:
1. [Post text]
---
2. [Post text]
---
3. [Post text]`;

  return aiRequest(prompt, systemPrompt, { model: 'GENERAL' });
}

/**
 * Generate comment suggestions
 */
async function generateCommentSuggestions(postContent, context) {
  const systemPrompt = `You are a helpful assistant that suggests thoughtful, engaging comments for social media posts.
Keep comments brief (under 100 characters).
Be genuine and add value to the conversation.
Avoid generic responses like "Great post!"`;

  const prompt = `Suggest 3 thoughtful comment options for this post:
"${postContent}"
${context ? `Context: ${context}` : ''}

Format:
1. [Comment]
2. [Comment]
3. [Comment]`;

  return aiRequest(prompt, systemPrompt, { model: 'FAST', maxTokens: 200 });
}

/**
 * Generate professional bio
 */
async function generateBio(name, role, skills = [], experience) {
  const systemPrompt = `You are an expert professional bio writer.
Create engaging, concise professional bios for LinkedIn-like platforms.
Keep bios between 150-300 characters.
Make them personable yet professional.`;

  const prompt = `Write a professional bio for:
Name: ${name}
Current Role: ${role}
Key Skills: ${skills.join(', ')}
${experience ? `Experience: ${experience}` : ''}

Generate 2 bio options - one formal, one casual.`;

  return aiRequest(prompt, systemPrompt, { model: 'GENERAL' });
}

/**
 * Improve post content
 */
async function improvePost(content, goal = 'engagement') {
  const systemPrompt = `You are a social media content optimizer.
Improve posts to maximize their effectiveness.
Maintain the original message while enhancing delivery.
Keep the improved version similar in length.`;

  const goalInstructions = {
    engagement: 'Optimize for engagement (likes, comments, shares). Add hooks and CTAs.',
    clarity: 'Improve clarity and readability. Make the message crystal clear.',
    professional: 'Make the tone more professional while keeping it personable.'
  };

  const prompt = `${goalInstructions[goal] || goalInstructions.engagement}

Original post:
"${content}"

Provide the improved version:`;

  return aiRequest(prompt, systemPrompt, { model: 'GENERAL' });
}

/**
 * Generate hashtags
 */
async function generateHashtags(content, industry) {
  const systemPrompt = `You are a social media hashtag expert.
Generate relevant, effective hashtags.
Mix popular and niche hashtags.
Keep hashtags professional and appropriate.`;

  const prompt = `Generate 5-7 relevant hashtags for this post:
"${content}"
${industry ? `Industry: ${industry}` : ''}

Format: #hashtag1 #hashtag2 #hashtag3 ...`;

  return aiRequest(prompt, systemPrompt, { model: 'FAST', maxTokens: 100 });
}

/**
 * Generate skill recommendations
 */
async function generateSkillRecommendations(currentRole, currentSkills = [], targetRole) {
  const systemPrompt = `You are a career development expert.
Recommend relevant professional skills that would enhance someone's career.
Focus on in-demand, practical skills.
Consider both technical and soft skills.`;

  const prompt = `Recommend 5 skills for someone who is:
Current Role: ${currentRole}
Current Skills: ${currentSkills.join(', ')}
${targetRole ? `Target Role: ${targetRole}` : ''}

Format as:
1. [Skill] - [Brief reason]
2. [Skill] - [Brief reason]
...`;

  return aiRequest(prompt, systemPrompt, { model: 'REASONING' });
}

/**
 * Generate connection message
 */
async function generateConnectionMessage(senderName, recipientName, recipientRole, recipientCompany, reason) {
  const systemPrompt = `You are a networking expert.
Write personalized connection request messages.
Be genuine, brief, and professional.
Avoid generic templates.
Keep messages under 200 characters.`;

  const prompt = `Write a connection request message:
From: ${senderName}
To: ${recipientName}${recipientRole ? `, ${recipientRole}` : ''}${recipientCompany ? ` at ${recipientCompany}` : ''}
${reason ? `Reason for connecting: ${reason}` : ''}

Generate 2 message options:`;

  return aiRequest(prompt, systemPrompt, { model: 'GENERAL', maxTokens: 250 });
}

export {
  AI_MODELS,
  aiRequest,
  generateImage,
  generatePostSuggestions,
  generateCommentSuggestions,
  generateBio,
  improvePost,
  generateHashtags,
  generateSkillRecommendations,
  generateConnectionMessage,
};
