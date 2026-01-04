/**
 * AI Routes - RESTful endpoints for AI features
 * Based on CHIRP2.0's modular AI API
 */

import express from 'express';
import {
  aiRequest,
  generateImage,
  generatePostSuggestions,
  generateCommentSuggestions,
  generateBio,
  improvePost,
  generateHashtags,
  generateSkillRecommendations,
  generateConnectionMessage,
} from '../lib/ai.js';

const router = express.Router();

/**
 * POST /api/ai/chat
 * General purpose chat with image generation support
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, model, systemContext } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if image generation is requested
    if (model === 'IMAGE' || message.toLowerCase().includes('generate image') || message.toLowerCase().includes('create image')) {
      const imageRes = await generateImage(message);
      if (!imageRes.success) {
        return res.status(200).json({
          success: true,
          response: 'Image generation is currently unavailable. Please try again later.',
          responseHtml: null
        });
      }
      return res.json({
        success: true,
        response: imageRes.content,
        isImage: true
      });
    }

    // Regular chat
    const systemPrompt = systemContext || 'You are Chirp AI, a helpful assistant for a professional social network.';
    const aiRes = await aiRequest(message, systemPrompt, { model: 'GENERAL', maxTokens: 400 });

    if (!aiRes.success) {
      return res.status(200).json({
        success: true,
        response: "I couldn't generate a response. Please try again.",
        responseHtml: null
      });
    }

    res.json({
      success: true,
      response: aiRes.content,
      responseHtml: null
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

/**
 * POST /api/ai/post-suggestions
 * Generate creative post ideas
 */
router.post('/post-suggestions', async (req, res) => {
  try {
    const { topic, industry, tone = 'professional' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const result = await generatePostSuggestions(topic, industry, tone);

    if (!result.success) {
      return res.status(200).json({
        success: true,
        suggestions: ['Unable to generate suggestions. Please try again.']
      });
    }

    // Parse the response to extract individual suggestions
    const suggestions = result.content
      .split('---')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('1.') && !s.startsWith('2.') && !s.startsWith('3.'))
      .slice(0, 3);

    res.json({
      success: true,
      suggestions: suggestions.length > 0 ? suggestions : [result.content]
    });
  } catch (error) {
    console.error('Post suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate post suggestions' });
  }
});

/**
 * POST /api/ai/comment-suggestions
 * Generate comment ideas for posts
 */
router.post('/comment-suggestions', async (req, res) => {
  try {
    const { postContent, context } = req.body;

    if (!postContent) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    const result = await generateCommentSuggestions(postContent, context);

    if (!result.success) {
      return res.status(200).json({
        success: true,
        suggestions: ['Unable to generate suggestions. Please try again.']
      });
    }

    // Parse suggestions
    const suggestions = result.content
      .split(/\d\.\s/)
      .filter(s => s.trim())
      .map(s => s.trim())
      .slice(0, 3);

    res.json({
      success: true,
      suggestions: suggestions.length > 0 ? suggestions : [result.content]
    });
  } catch (error) {
    console.error('Comment suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate comment suggestions' });
  }
});

/**
 * POST /api/ai/generate-bio
 * Generate professional bio
 */
router.post('/generate-bio', async (req, res) => {
  try {
    const { name, role, skills, experience } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    const result = await generateBio(name, role, skills || [], experience);

    if (!result.success) {
      return res.status(200).json({
        success: true,
        bios: 'Unable to generate bio. Please try again.'
      });
    }

    res.json({
      success: true,
      bios: result.content
    });
  } catch (error) {
    console.error('Bio generation error:', error);
    res.status(500).json({ error: 'Failed to generate bio' });
  }
});

/**
 * POST /api/ai/improve-post
 * Improve post content
 */
router.post('/improve-post', async (req, res) => {
  try {
    const { content, goal = 'engagement' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await improvePost(content, goal);

    if (!result.success) {
      return res.status(200).json({
        success: true,
        improvedContent: content
      });
    }

    res.json({
      success: true,
      improvedContent: result.content
    });
  } catch (error) {
    console.error('Improve post error:', error);
    res.status(500).json({ error: 'Failed to improve post' });
  }
});

/**
 * POST /api/ai/hashtags
 * Generate hashtags for content
 */
router.post('/hashtags', async (req, res) => {
  try {
    const { content, industry } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await generateHashtags(content, industry);

    if (!result.success) {
      return res.status(200).json({
        success: true,
        hashtags: []
      });
    }

    // Parse hashtags
    const hashtags = result.content
      .split(/\s+/)
      .filter(tag => tag.startsWith('#') || tag.length > 0)
      .slice(0, 8);

    res.json({
      success: true,
      hashtags
    });
  } catch (error) {
    console.error('Hashtags error:', error);
    res.status(500).json({ error: 'Failed to generate hashtags' });
  }
});

/**
 * POST /api/ai/skill-recommendations
 * Get skill recommendations
 */
router.post('/skill-recommendations', async (req, res) => {
  try {
    const { currentRole, currentSkills, targetRole } = req.body;

    if (!currentRole) {
      return res.status(400).json({ error: 'Current role is required' });
    }

    const result = await generateSkillRecommendations(currentRole, currentSkills || [], targetRole);

    if (!result.success) {
      return res.status(200).json({
        success: true,
        skills: []
      });
    }

    // Parse skills
    const skills = result.content
      .split(/\d\.\s/)
      .filter(s => s.trim())
      .map(s => {
        const [skill, reason] = s.split('-').map(p => p.trim());
        return { skill: skill || s.trim(), reason: reason || '' };
      })
      .slice(0, 5);

    res.json({
      success: true,
      skills
    });
  } catch (error) {
    console.error('Skill recommendations error:', error);
    res.status(500).json({ error: 'Failed to get skill recommendations' });
  }
});

/**
 * POST /api/ai/connection-message
 * Generate connection request messages
 */
router.post('/connection-message', async (req, res) => {
  try {
    const { senderName, recipientName, recipientRole, recipientCompany, reason } = req.body;

    if (!senderName || !recipientName) {
      return res.status(400).json({ error: 'Sender and recipient names are required' });
    }

    const result = await generateConnectionMessage(
      senderName,
      recipientName,
      recipientRole,
      recipientCompany,
      reason
    );

    if (!result.success) {
      return res.status(200).json({
        success: true,
        messages: 'Unable to generate message. Please try again.'
      });
    }

    res.json({
      success: true,
      messages: result.content
    });
  } catch (error) {
    console.error('Connection message error:', error);
    res.status(500).json({ error: 'Failed to generate connection message' });
  }
});

export default router;
