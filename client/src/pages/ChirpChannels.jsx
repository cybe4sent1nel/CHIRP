import { useState, useEffect } from "react";
import { MessageCircle, Search, Loader, Plus, Users } from "lucide-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const ChirpChannels = () => {
  const user = useSelector((state) => state.user?.value);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, joined, created

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
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

  useEffect(() => {
    fetchChannels();
  }, [filter]);

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

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
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
              <Link
                key={channel._id}
                to={`/channel/${channel._id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden transition-all group cursor-pointer flex flex-col h-full"
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

                <div className="relative p-6 flex flex-col flex-grow text-white">
                  {/* Channel Name */}
                  <h3 className="text-2xl font-bold mb-2 line-clamp-2">
                    {channel.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-white/80 mb-4 line-clamp-2">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChirpChannels;
