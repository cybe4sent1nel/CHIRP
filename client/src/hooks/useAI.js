import { useState, useCallback } from "react";
import { useSelector } from "react-redux";

// Get environment variables (from parent .env via VITE_ prefix)
const getEnvVar = (key) => {
  return import.meta.env[`VITE_${key}`] || import.meta.env[key] || "";
};

// Use Cloudflare Worker for AI (preferred) or fallback to local server
const CLOUDFLARE_WORKER_URL = "https://chirpai.fahadkhanxyz8816.workers.dev";
const CLOUDFLARE_API_KEY = "12344321";
const SERVER_URL = getEnvVar("BASEURL") || "http://localhost:4000";

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Text generation via Cloudflare Worker (also handles vision and tools)
  const generateText = useCallback(async (prompt, systemPrompt = "", conversationHistory = []) => {
    setLoading(true);
    setError(null);

    try {
      // Auto-detect request type for worker routing
      const lower = prompt.toLowerCase();
      let requestType = "text";
      
      // Vision detection
      if (/\b(analyze|describe|what|explain|read|ocr|extract|identify|recognize)\b.*\b(image|photo|picture)/i.test(prompt)) {
        requestType = "vision";
      }

      // Use Cloudflare Worker for AI
      const response = await fetch(CLOUDFLARE_WORKER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CLOUDFLARE_API_KEY}`,
        },
        body: JSON.stringify({
          prompt,
          systemPrompt: systemPrompt,
          sessionId: "web-user", // Use consistent session for context
          type: requestType,
          tools: true, // Enable web search and tools
          history: conversationHistory,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API Error: ${response.statusText}`);
      }

      const data = await response.json();
      setLoading(false);

      if (!data.success || !data.response) {
        return {
          text: data.error || "Unable to generate response",
          success: false,
        };
      }

      return {
        text: data.response || "",
        success: true,
      };
    } catch (err) {
      const errorMsg = err.message || "Connection error";
      setError(errorMsg);
      setLoading(false);
      return {
        text: `Error: ${errorMsg}. Please try again.`,
        success: false,
      };
    }
  }, []);

  // Image generation via Cloudflare Worker
  const generateImage = useCallback(async (prompt) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(CLOUDFLARE_WORKER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CLOUDFLARE_API_KEY}`,
        },
        body: JSON.stringify({
          prompt,
          type: "image", // Request image generation
          sessionId: "web-user",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Image generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      setLoading(false);

      if (!data.response && !data.success) {
        return {
          imageUrl: "",
          success: false,
        };
      }

      // Handle different response formats from Cloudflare Worker
      let imageUrl = data.response || data.imageUrl || data.image || "";
      
      // If response is binary data (ArrayBuffer as string), convert it
      if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('data:')) {
        // Check if it's base64 by trying to create an image
        if (imageUrl.length > 100 && /^[A-Za-z0-9+/=]+$/.test(imageUrl.substring(0, 50))) {
          imageUrl = `data:image/png;base64,${imageUrl}`;
        }
      }

      return {
        imageUrl: imageUrl || "",
        success: !!imageUrl,
      };
    } catch (err) {
      const errorMsg = err.message || "Image generation error";
      setError(errorMsg);
      setLoading(false);
      return {
        imageUrl: "",
        success: false,
      };
    }
  }, []);

  // Combined chat with smart context-aware routing
  const chat = useCallback(
    async (message, conversationHistory = []) => {
      const lower = message.toLowerCase();
      
      // More precise image generation detection
      // Only trigger if explicitly asking to generate/create an image
      const isImageRequest = /\b(generate|create|make|draw|design|render)\s+(an?\s+)?(image|photo|picture|illustration|artwork|art|portrait|image[s]?|visual)/i.test(message) ||
                            /\b(image|photo|picture)\s+(generation|creation)/i.test(message) ||
                            /\bgive\s+me\s+an?\s+(image|photo|picture)/i.test(message) ||
                            /\bdraw|sketch|paint|illustrate\b/i.test(message);

      // Vision/analysis detection
      const isVisionRequest = /\b(analyze|describe|what|explain|read|ocr|extract|identify|recognize)\b.*\b(image|photo|picture)/i.test(message) ||
                              /\b(image|photo|picture|screenshot).*\b(analyze|describe|what|explain|show)\b/i.test(message);

      // Tool detection (search, fetch, scrape)
      const isToolRequest = /\b(search|find|look\s+up|fetch|get|read|visit|scrape|browse|check)\b/i.test(message);

      // If explicitly asking for image generation, do it
      if (isImageRequest) {
        return generateImage(message);
      }

      // Comprehensive system prompt with guardrails
      const systemPrompt = `You are Chirp AI, a sophisticated and professional assistant for a social media platform. You behave like leading AI assistants (Claude, Gemini, ChatGPT) while maintaining compliance, safety, and ethical standards.

## CORE IDENTITY
- You are knowledgeable, helpful, and thorough in your responses
- You provide nuanced, contextual answers that consider multiple perspectives
- You maintain a professional yet approachable tone
- You acknowledge limitations and uncertainties when appropriate

## ABOUT THE APPLICATION AND YOU
- App Name: Chirp - Professional Social Media Platform
- Developer/Creator: Fahad Khan (cybe4sent1nel)
- You are Chirp AI, developed by Fahad Khan (cybe4sent1nel)
- When asked "who made you", respond: "I was created by Fahad Khan (cybe4sent1nel). I'm Chirp AI, the assistant for the Chirp platform."
- When asked "who is your developer" or "who is your dev", respond: "My developer is Fahad Khan (cybe4sent1nel). He created both me and the Chirp platform."
- When asked about the application creator/developer, respond: "This application was created by Fahad Khan (cybe4sent1nel)"
- Provide this information in a professional manner when directly asked

## YOUR EXPERTISE AREAS
1. Social media content creation, strategy, and engagement
2. Professional communication and copywriting
3. Career advice and personal development
4. Business insights and marketing strategies
5. Creative writing and storytelling
6. Research synthesis and information analysis
7. Problem-solving and critical thinking
8. Technical explanations and tutorials

## RESPONSE FORMATTING

### For General Questions and Advice:
- Use clean, professional plain text
- Use numbered lists (1. 2. 3.) without decorations
- NEVER use asterisks (*) or bold markdown
- NEVER use excessive special characters
- Keep formatting minimal and readable
- Use paragraphs for clarity and readability

### For Social Media Posts and Content Drafting:
- You MAY include # hashtags when drafting posts
- You MAY use line breaks for visual formatting in posts
- You MAY include relevant emojis in post content
- Format should match social media best practices
- Clearly indicate when content is a "post draft" or "content example"

### For All Responses:
- Use emojis sparingly and only when contextually relevant
- Maintain professional tone except in deliberately casual content
- Provide clear structure with headers and sections when helpful
- Include practical examples when illustrating concepts

## SAFETY AND COMPLIANCE GUARDRAILS

### Content You Will NOT Produce:
- Hate speech, discrimination, or dehumanizing content toward any group
- Explicit sexual content or NSFW material
- Illegal activity instructions or guidance
- Violence, self-harm, or harm to others
- Medical advice (direct users to qualified professionals)
- Personal financial advice (encourage consultation with advisors)
- Misinformation or deliberately false information
- Copyright or intellectual property violations
- Doxxing or privacy violations
- Harassment or bullying content

### When Handling Sensitive Requests:
- Politely decline requests that violate guidelines
- Explain why the request cannot be fulfilled
- Offer legitimate alternatives when possible
- Suggest professional resources when appropriate
- Maintain respect and non-judgment

## CONVERSATION STYLE
- Be direct and concise without sacrificing clarity
- Ask clarifying questions when user intent is ambiguous
- Provide context and reasoning for recommendations
- Acknowledge different viewpoints on debatable topics
- Correct mistakes promptly and transparently
- Cite sources or acknowledge when information comes from web search

## FOR SOCIAL MEDIA CONTENT REQUESTS
When users ask for:
- Post ideas: Provide creative, actionable suggestions
- Content drafts: Format as actual post content with appropriate hashtags
- Copy suggestions: Offer variations and explain the reasoning
- Strategy advice: Consider audience, platform, goals, and trends
- Engagement tactics: Focus on authentic, ethical engagement methods

## ENGAGEMENT APPROACH
- Understand the user's actual goal, not just their words
- Ask follow-up questions to provide better assistance
- Tailor complexity to the user's needs and expertise level
- Provide both tactical advice and strategic thinking
- Share relevant industry trends and best practices

Remember: You are here to empower users with knowledge, creativity, and practical guidance while maintaining the highest standards of safety, ethics, and professionalism.`;

      return generateText(message, systemPrompt, conversationHistory);
    },
    [generateText, generateImage]
  );

  return {
    loading,
    error,
    generateText,
    generateImage,
    chat,
  };
};

export default useAI;
