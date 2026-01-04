/**
 * useChirpAI Hook - Advanced AI Features
 * Based on CHIRP2.0's useChirpAI with full TypeScript support
 */

import { useState, useCallback } from 'react';

export default function useChirpAI() {
  const [state, setState] = useState({ loading: false, error: null });

  const makeRequest = useCallback(async (endpoint, body) => {
    setState({ loading: true, error: null });

    try {
      const response = await fetch(`${import.meta.env.VITE_BASEURL}/api/ai/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setState({ loading: false, error: data.error || 'Request failed' });
        return null;
      }

      setState({ loading: false, error: null });
      return data;
    } catch (error) {
      setState({ loading: false, error: 'Network error' });
      console.error('AI request error:', error);
      return null;
    }
  }, []);

  /**
   * Generate post suggestions
   */
  const getPostSuggestions = useCallback(async (topic, industry, tone = 'professional') => {
    const result = await makeRequest('post-suggestions', { topic, industry, tone });
    return result?.suggestions || [];
  }, [makeRequest]);

  /**
   * Generate bio
   */
  const generateBio = useCallback(async (name, role, skills, experience) => {
    const result = await makeRequest('generate-bio', { name, role, skills, experience });
    return result?.bios || '';
  }, [makeRequest]);

  /**
   * Generate comment suggestions
   */
  const getCommentSuggestions = useCallback(async (postContent, context) => {
    const result = await makeRequest('comment-suggestions', { postContent, context });
    return result?.suggestions || [];
  }, [makeRequest]);

  /**
   * Improve post content
   */
  const improvePost = useCallback(async (content, goal = 'engagement') => {
    const result = await makeRequest('improve-post', { content, goal });
    return result?.improvedContent || '';
  }, [makeRequest]);

  /**
   * Generate hashtags
   */
  const getHashtags = useCallback(async (content, industry) => {
    const result = await makeRequest('hashtags', { content, industry });
    return result?.hashtags || [];
  }, [makeRequest]);

  /**
   * Get skill recommendations
   */
  const getSkillRecommendations = useCallback(async (currentRole, currentSkills, targetRole) => {
    const result = await makeRequest('skill-recommendations', {
      currentRole,
      currentSkills,
      targetRole,
    });
    return result?.skills || [];
  }, [makeRequest]);

  /**
   * Generate connection message
   */
  const getConnectionMessage = useCallback(
    async (senderName, recipientName, recipientRole, recipientCompany, reason) => {
      const result = await makeRequest('connection-message', {
        senderName,
        recipientName,
        recipientRole,
        recipientCompany,
        reason,
      });
      return result?.messages || '';
    },
    [makeRequest]
  );

  /**
   * General chat with optional image generation
   */
  const chat = useCallback(async (message, model, systemContext, attachments) => {
    const body = { message };
    if (model) body.model = model;
    if (systemContext) body.systemContext = systemContext;
    if (attachments) body.attachments = attachments;

    const result = await makeRequest('chat', body);
    return {
      response: result?.response || '',
      responseHtml: result?.responseHtml || undefined,
      isImage: result?.isImage || false,
    };
  }, [makeRequest]);

  return {
    loading: state.loading,
    error: state.error,
    getPostSuggestions,
    generateBio,
    getCommentSuggestions,
    improvePost,
    getHashtags,
    getSkillRecommendations,
    getConnectionMessage,
    chat,
  };
}
