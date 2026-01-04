import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Globe, Share2, Bookmark, ExternalLink, Loader } from "lucide-react";
import { useSelector } from "react-redux";

const NewsDetail = () => {
  const user = useSelector((state) => state.user?.value);
  const { articleId } = useParams();
  const navigate = useNavigate();
  
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch the article by ID
        const response = await fetch(
          `${import.meta.env.VITE_BASEURL}/api/news/search?id=${encodeURIComponent(articleId)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch article");
        }

        const data = await response.json();
        
        // Handle both single article and array responses
        const fetchedArticle = Array.isArray(data.articles) ? data.articles[0] : data;
        
        if (!fetchedArticle) {
          throw new Error("Article not found");
        }

        setArticle(fetchedArticle);

        // Fetch related articles by category
        if (fetchedArticle.category?.[0]) {
          const relatedResponse = await fetch(
            `${import.meta.env.VITE_BASEURL}/api/news/search?category=${fetchedArticle.category[0]}&limit=3`
          );
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            const related = (relatedData.results || [])
              .filter((a) => a.article_id !== fetchedArticle.article_id)
              .slice(0, 3);
            setRelatedArticles(related);
          }
        }
      } catch (err) {
        console.error("Error fetching article:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Fetching article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold">{error || "Article not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/news/${encodeURIComponent(article.article_id || article.title)}`;
    const text = `Check out this article: ${article.title}`;

    if (navigator.share) {
      navigator.share({ title: article.title, text, url: shareUrl });
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert("Article link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to News
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share article"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Save article"
            >
              <Bookmark className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Category & Source */}
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full">
            {article.category?.[0]?.toUpperCase() || "News"}
          </span>
          <span className="text-sm text-gray-600">{article.source_id || "News Source"}</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 text-gray-600 mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>
              {article.pubDate
                ? new Date(article.pubDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unknown date"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <span>{article.source_id || "International"}</span>
          </div>
          {article.link && article.link !== "#" && (
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Original Source
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Featured Image */}
        {article.image_url && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}

        {/* Description */}
        {article.description && (
          <p className="text-xl text-gray-700 mb-8 leading-relaxed font-semibold">
            {article.description}
          </p>
        )}

        {/* Content */}
        {article.content && (
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {article.content}
            </p>
          </div>
        )}

        {/* Call to Action */}
        {article.link && article.link !== "#" && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 mb-12 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-2">Read the Full Article</h3>
            <p className="text-indigo-100 mb-4">Get the complete story directly from the source</p>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-indigo-600 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Open on {article.source_id || "Original Source"}
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((related, idx) => (
                <Link
                  key={idx}
                  to={`/news/${encodeURIComponent(related.article_id || related.title)}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl overflow-hidden transition-all group cursor-pointer"
                >
                  {related.image_url && (
                    <div className="w-full h-40 overflow-hidden bg-gray-200">
                      <img
                        src={related.image_url}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 mb-2">
                      {related.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {related.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsDetail;
