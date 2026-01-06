import { useState, useEffect } from "react";
import { MessageCircle, Search, Loader, Plus, Users, TrendingUp, Pin, Filter } from "lucide-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const ChirpChannels = () => {
  const user = useSelector((state) => state.user?.value);
  const [channels, setChannels] = useState([]);
  const [trendingChannels, setTrendingChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, joined, created
  const [category, setCategory] = useState(""); // empty = all categories
  const [pinningChannel, setPinningChannel] = useState(null);

  const categories = [
    { value: "", label: "All Categories" },
    { value: "general", label: "General" },
    { value: "tech", label: "Tech" },
    { value: "entertainment", label: "Entertainment" },
    { value: "sports", label: "Sports" },
    { value: "news", label: "News" },
    { value: "education", label: "Education" },
    { value: "business", label: "Business" },
    { value: "other", label: "Other" },
  ];

  const fetchTrendingChannels = async () => {
    try {
      setTrendingLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/channels/trending?limit=5`
      );

      if (!response.ok) throw new Error("Failed to fetch trending channels");

      const data = await response.json();
      setTrendingChannels(data.channels || []);
    } catch (err) {
      console.error("Trending channels error:", err);
    } finally {
      setTrendingLoading(false);
    }
  };

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (category) params.append("category", category);
      params.append("filter", filter);

      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/channels?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch channels");
      }

      const data = await response.json();
      setChannels(data.channels || []);
    } catch (err) {
      setError(err.message);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePinChannel = async (channelId, e) => {
    e.preventDefault(); // Prevent navigation to channel
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please login to pin channels");
      return;
    }

    setPinningChannel(channelId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/channels/${channelId}/pin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to pin channel");

      const data = await response.json();
      
      // Update the channel in the list
      setChannels((prev) =>
        prev.map((ch) =>
          ch._id === channelId ? { ...ch, isPinned: data.pinned } : ch
        )
      );

      toast.success(data.pinned ? "Channel pinned!" : "Channel unpinned!");
    } catch (err) {
      console.error("Pin error:", err);
      toast.error("Failed to pin channel");
    } finally {
      setPinningChannel(null);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [filter, category]);

  useEffect(() => {
    fetchTrendingChannels();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchChannels();
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-full">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Chirp Channels</h1>
                <p className="text-sm text-gray-500">Join communities and share ideas</p>
              </div>
            </div>
            <Link
              to="/create-channel"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Channel
            </Link>
          </div>

          {/* Search Bar with Category Filter */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search channels..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              
              {/* Category Dropdown */}
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 appearance-none pr-10 bg-white cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <Filter className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all"
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

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {["all", "joined", "created"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-indigo-500"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} Channels
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Trending Channels Section */}
        {!searchQuery && !category && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Trending Channels</h2>
            </div>

            {trendingLoading ? (
              <div className="text-center py-8">
                <Loader className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
              </div>
            ) : trendingChannels.length === 0 ? (
              <p className="text-gray-500 text-center py-8 bg-white rounded-lg">
                No trending channels yet
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingChannels.map((channel) => (
                  <Link
                    key={channel._id}
                    to={`/channel/${channel._id}`}
                    className="relative bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden transition-all group cursor-pointer border-2 border-yellow-400"
                  >
                    <div
                      className="h-32 w-full"
                      style={{
                        backgroundImage: channel.background_url
                          ? `url(${channel.background_url})`
                          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all"></div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                          {channel.name}
                        </h3>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Trending
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {channel.description || "No description"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{channel.members_count || 0} members</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Channels Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : category
                ? `${categories.find((c) => c.value === category)?.label} Channels`
                : "All Channels"}
            </h2>
            <span className="text-sm text-gray-500">
              {channels.length} channel{channels.length !== 1 ? "s" : ""}
            </span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading channels...</p>
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No channels found</p>
              <Link
                to="/create-channel"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                <Plus className="w-5 h-5" />
                Create First Channel
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {channels.map((channel) => (
                <div key={channel._id} className="relative group">
                  <Link
                    to={`/channel/${channel._id}`}
                    className="block bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden transition-all cursor-pointer"
                    style={{
                      backgroundImage: channel.background_url
                        ? `url(${channel.background_url})`
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all"></div>

                    <div className="relative p-6 flex flex-col min-h-[200px] text-white">
                      {/* Channel Name */}
                      <h3 className="text-2xl font-bold mb-2 line-clamp-2">
                        {channel.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-white/80 mb-4 line-clamp-2 flex-grow">
                        {channel.description || "No description"}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm mt-auto pt-4 border-t border-white/20">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{channel.members_count || 0} members</span>
                        </div>
                        {channel.isCreator && (
                          <span className="bg-yellow-400 text-gray-900 px-2 py-0.5 rounded text-xs font-semibold">
                            Admin
                          </span>
                        )}
                        {channel.isMember && !channel.isCreator && (
                          <span className="bg-blue-400 text-white px-2 py-0.5 rounded text-xs font-semibold">
                            Member
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Pin Button - Positioned absolutely on top right */}
                  {user && (
                    <button
                      onClick={(e) => handlePinChannel(channel._id, e)}
                      disabled={pinningChannel === channel._id}
                      className={`absolute top-3 right-3 z-20 p-2 rounded-full transition-all ${
                        channel.isPinned
                          ? "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                          : "bg-white/80 text-gray-700 hover:bg-white"
                      } disabled:opacity-50`}
                      title={channel.isPinned ? "Unpin channel" : "Pin channel"}
                    >
                      {pinningChannel === channel._id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Pin
                          className={`w-4 h-4 ${
                            channel.isPinned ? "fill-current" : ""
                          }`}
                        />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChirpChannels;
