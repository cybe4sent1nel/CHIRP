/**
 * News Routes - NewsData.io API Proxy
 * Proxies requests from frontend to NewsData.io to avoid CORS issues
 * Follows CHIRP2.0 pattern with fallback data
 */

import express from 'express';

const router = express.Router();

// Fallback news data when API fails or isn't configured
const FALLBACK_NEWS = [
  {
    article_id: 'fallback-1',
    title: 'Latest Technology Advances Shape Future',
    description: 'Recent innovations in AI and cloud computing are transforming industries.',
    content: 'Major technology breakthroughs continue to reshape the digital landscape...',
    link: '#',
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    pubDate: new Date().toISOString(),
    source_id: 'Tech Daily',
    source_url: '#',
    category: ['technology']
  },
  {
    article_id: 'fallback-2',
    title: 'Global Markets Show Growth',
    description: 'Economic indicators suggest positive momentum in business sectors.',
    content: 'Financial markets around the world are posting gains...',
    link: '#',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    source_id: 'Business Times',
    source_url: '#',
    category: ['business']
  },
  {
    article_id: 'fallback-3',
    title: 'Entertainment Industry Sees Major Changes',
    description: 'New streaming services and content strategies reshape entertainment landscape.',
    content: 'The entertainment industry continues to evolve with new platforms...',
    link: '#',
    image_url: 'https://images.unsplash.com/photo-1517604931442-7e0c6030e7bb?w=800',
    pubDate: new Date(Date.now() - 7200000).toISOString(),
    source_id: 'Entertainment Weekly',
    source_url: '#',
    category: ['entertainment']
  },
  {
    article_id: 'fallback-4',
    title: 'Health Researchers Discover New Treatments',
    description: 'Medical breakthroughs promise to improve patient outcomes.',
    content: 'Recent health studies show promising results...',
    link: '#',
    image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
    pubDate: new Date(Date.now() - 10800000).toISOString(),
    source_id: 'Health Today',
    source_url: '#',
    category: ['health']
  },
];

/**
 * GET /api/news/articles
 * Fetches full articles using NewsAPI.org /v2/everything endpoint
 * Used for the Articles section (full text articles)
 */
router.get('/articles', async (req, res) => {
  try {
    const { q, category, language = 'en', limit = 12, sortBy = 'publishedAt' } = req.query;
    const apiKey = process.env.NEWS_API_KEY;

    // Map categories to search terms
    const categoryMap = {
      'technology': 'technology',
      'tech': 'technology',
      'business': 'business',
      'entertainment': 'entertainment',
      'health': 'health',
      'science': 'science',
      'sports': 'sports',
      'world': 'world',
      'general': 'news'
    };

    const searchTerm = q || categoryMap[category] || 'news';

    // If no API key, return fallback news
    if (!apiKey) {
      console.log('No NewsAPI key configured, using fallback articles');
      return res.json({
        success: true,
        results: FALLBACK_NEWS,
        articles: FALLBACK_NEWS,
        source: 'fallback'
      });
    }

    // Build the NewsAPI.org /everything endpoint URL (for full articles)
    const params = new URLSearchParams();
    params.append('q', searchTerm);
    params.append('language', language);
    params.append('pageSize', Math.min(parseInt(limit) || 12, 100));
    params.append('apiKey', apiKey);
    params.append('sortBy', sortBy);

    const articlesApiUrl = `https://newsapi.org/v2/everything?${params.toString()}`;

    console.log('Fetching articles from NewsAPI.org:', articlesApiUrl.replace(apiKey, '[REDACTED]'));

    const response = await fetch(articlesApiUrl, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));

    // Check for errors from NewsAPI.org
    if (!response.ok || data.status !== 'ok') {
      console.error('NewsAPI.org articles error:', { status: response.status, data });
      // Return fallback on error
      return res.json({
        success: true,
        results: FALLBACK_NEWS,
        articles: FALLBACK_NEWS,
        source: 'fallback',
        error: data.message || 'Failed to fetch articles'
      });
    }

    // Transform NewsAPI.org response to match our format
    const articles = (data.articles || [])
      .filter(article => article.title && article.description)
      .map(article => ({
        article_id: article.url,
        title: article.title,
        description: article.description,
        content: article.content || article.description,
        link: article.url,
        image_url: article.urlToImage,
        pubDate: article.publishedAt,
        source_id: article.source.name,
        source_url: article.source.url,
        author: article.author,
        category: [category || 'general']
      }))
      .slice(0, Math.min(parseInt(limit) || 12, 100));
    
    // Return the results
    res.json({
      success: true,
      results: articles,
      articles: articles,
      totalResults: articles.length,
      source: 'newsapi'
    });

  } catch (error) {
    console.error('Articles API error:', error);
    // Return fallback on any error
    res.json({
      success: true,
      results: FALLBACK_NEWS,
      articles: FALLBACK_NEWS,
      source: 'fallback',
      error: error.message
    });
  }
});

/**
 * GET /api/news/search
 * Proxy request to NewsAPI.org /v2/top-headlines with fallback data
 * Used for the News section (headlines)
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category, language = 'en', limit = 12, id } = req.query;
    const apiKey = process.env.NEWS_API_KEY;

    // Map categories to NewsAPI.org supported categories
    const categoryMap = {
      'technology': 'technology',
      'tech': 'technology',
      'business': 'business',
      'entertainment': 'entertainment',
      'health': 'health',
      'science': 'science',
      'sports': 'sports',
      'world': 'general',
    };

    const mappedCategory = category ? categoryMap[category] || category : 'general';

    // If no API key, return fallback news
    if (!apiKey) {
      console.log('No NewsAPI key configured, using fallback news');
      let news = FALLBACK_NEWS;
      
      if (mappedCategory && mappedCategory !== 'general') {
        news = news.filter(article => 
          article.category && article.category.includes(mappedCategory)
        );
      }
      
      if (q) {
        news = news.filter(article =>
          article.title.toLowerCase().includes(q.toLowerCase()) ||
          article.description.toLowerCase().includes(q.toLowerCase())
        );
      }

      if (id) {
        news = news.filter(article => article.article_id === id);
      }
      
      return res.json({
        success: true,
        results: news,
        articles: news,
        source: 'fallback'
      });
    }

    // Build the NewsAPI.org URL
    const params = new URLSearchParams();
    
    // Prioritize search query if provided, otherwise use category
    if (q && q.toLowerCase() !== 'technology') {
      params.append('q', q);
    } else {
      // Use category endpoint for better results
      params.append('category', mappedCategory);
    }
    
    params.append('language', language);
    params.append('pageSize', Math.min(parseInt(limit) || 12, 100));
    params.append('apiKey', apiKey);
    params.append('sortBy', 'publishedAt');

    const newsApiUrl = `https://newsapi.org/v2/top-headlines?${params.toString()}`;

    console.log('Fetching from NewsAPI.org:', newsApiUrl.replace(apiKey, '[REDACTED]'));

    const response = await fetch(newsApiUrl, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));

    // Check for errors from NewsAPI.org
    if (!response.ok || data.status !== 'ok') {
      console.error('NewsAPI.org error:', { status: response.status, data });
      // Return fallback on error
      return res.json({
        success: true,
        results: FALLBACK_NEWS,
        articles: FALLBACK_NEWS,
        source: 'fallback',
        error: data.message || 'Failed to fetch news'
      });
    }

    // Transform NewsAPI.org response to match our format
    const articles = (data.articles || [])
      .filter(article => article.title && article.description)
      .map(article => ({
        article_id: article.url, // Use URL as unique ID
        title: article.title,
        description: article.description,
        content: article.content || article.description,
        link: article.url,
        image_url: article.urlToImage,
        pubDate: article.publishedAt,
        source_id: article.source.name,
        source_url: article.source.url,
        category: [mappedCategory]
      }))
      .slice(0, Math.min(parseInt(limit) || 12, 100));
    
    // Return the results
    res.json({
      success: true,
      results: articles,
      articles: articles,
      totalResults: articles.length,
      source: 'newsapi'
    });

  } catch (error) {
    console.error('News API error:', error);
    // Return fallback on any error
    res.json({
      success: true,
      results: FALLBACK_NEWS,
      articles: FALLBACK_NEWS,
      source: 'fallback',
      error: error.message
    });
  }
});

/**
 * GET /api/news/fetch-full
 * Fetches full article content from the original source
 * Extracts main text content from the article URL
 */
router.get('/fetch-full', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.json({
        success: false,
        error: 'URL is required'
      });
    }

    // Decode the URL
    const articleUrl = decodeURIComponent(url);

    console.log('Fetching full article from:', articleUrl);

    // Fetch the article from the original source
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch article');
    }

    const html = await response.text();

    // Extract text content from HTML
    // Remove script and style tags
    let content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // Extract meaningful paragraphs (at least 50 characters)
    const paragraphs = content
      .split(/\.\s+/)
      .filter(p => p.length > 50)
      .map(p => p.trim())
      .slice(0, 15) // Limit to 15 paragraphs
      .join('. ');

    res.json({
      success: true,
      content: paragraphs || 'Unable to extract article content. Please visit the original source for full content.',
      source: 'extracted'
    });

  } catch (error) {
    console.error('Error fetching full article:', error);
    res.json({
      success: false,
      error: 'Unable to fetch full article content',
      message: error.message
    });
  }
});

export default router;
