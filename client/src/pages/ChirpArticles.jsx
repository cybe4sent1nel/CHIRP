import { useState, useEffect } from "react";
import { BookOpen, Search, Loader, Calendar } from "lucide-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const ChirpArticles = () => {
  const user = useSelector((state) => state.user?.value);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("technology");
  const [category, setCategory] = useState("technology");
  const [error, setError] = useState(null);

  const categories = [
    "technology",
    "business",
    "entertainment",
    "health",
    "science",
    "sports",
    "general",
  ];

  const fetchArticles = async (query = searchQuery, cat = category) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query && query !== 'technology') {
        params.append('q', query);
      }
      if (cat) params.append('category', cat);
      params.append('language', 'en');
      params.append('limit', '12');
      params.append('sortBy', 'publishedAt');

      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/news/articles?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch articles");
      }

      const data = await response.json();
      setArticles(data.results || data.articles || []);
    } catch (err) {
      setError(err.message);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchArticles(searchQuery, category);
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    fetchArticles(searchQuery, cat);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading Articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2.5 rounded-full">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
              <p className="text-sm text-gray-500">
                Read full articles from trusted sources
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                Search
              </button>
            </div>
          </form>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                  category === cat
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-purple-500"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Fetching latest articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No articles found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, idx) => (
              <Link
                key={idx}
                to={`/article/${encodeURIComponent(article.article_id || article.link || article.title)}`}
                state={{ article }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden transition-all group cursor-pointer block h-full flex flex-col"
              >
                {article.image_url && (
                  <div className="w-full h-48 overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => (e.target.src = 'https://images.unsplash.com/photo-1585776245865-ce0dcc73d58e?w=400')}
                    />
                  </div>
                )}

                <div className="p-5 flex flex-col flex-grow">
                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                      {Array.isArray(article.category) ? article.category[0]?.toUpperCase() : "Article"}
                    </span>
                    {article.source_id && (
                      <span className="text-xs text-gray-500 truncate">{article.source_id}</span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 min-h-[3.5rem]">
                    {article.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">
                    {article.description || "Read more about this story..."}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-gray-200 pt-4 mt-auto">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        {article.pubDate
                          ? new Date(article.pubDate).toLocaleDateString()
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChirpArticles;
