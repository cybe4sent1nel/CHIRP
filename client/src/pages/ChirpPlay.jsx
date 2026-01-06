import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useSelector } from 'react-redux';
import { Trophy, Flame, Target, Zap, Crown, Medal, TrendingUp, Users, Palette, Circle, Link2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ChirpPlay = () => {
  const { getToken, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const user = useSelector((state) => state.user.value);
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    streak: 0,
    rank: 0,
    points: 0
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSignedIn) {
      fetchPlayerStats();
      fetchLeaderboard();
    }
  }, [isSignedIn]);

  const fetchPlayerStats = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.log('No auth token available');
        setLoading(false);
        return;
      }
      
      const { data } = await api.get('/api/games/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      if (error.response?.status === 401) {
        toast.error('Please sign in to view your stats');
      }
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      const { data } = await api.get('/api/games/leaderboard?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const games = [
    {
      id: 'doodledash',
      name: 'DoodleDash',
      description: 'Draw and guess with friends in real-time! Fast-paced doodling fun.',
      icon: Palette,
      color: 'from-purple-500 to-pink-500',
      route: '/chirpplay/sketch',
      players: '2-8 players',
      duration: '5-15 min'
    },
    {
      id: 'queens',
      name: 'Queens',
      description: 'Place queens on the board without attacking each other!',
      icon: Crown,
      color: 'from-purple-600 to-pink-600',
      route: '/chirpplay/queens',
      players: 'Solo',
      duration: '2-5 min'
    },
    {
      id: 'tents',
      name: 'Tents',
      description: 'Place tents next to trees following the puzzle rules!',
      icon: Target,
      color: 'from-green-600 to-lime-600',
      route: '/chirpplay/tents',
      players: 'Solo',
      duration: '3-8 min'
    },
    {
      id: 'zip',
      name: 'Zip',
      description: 'Connect numbers in order and fill the entire grid!',
      icon: Link2,
      color: 'from-indigo-600 to-purple-600',
      route: '/chirpplay/zip',
      players: 'Solo',
      duration: '5-10 min'
    },
    {
      id: 'wordladder',
      name: 'Word Ladder',
      description: 'Change one word to another, one letter at a time!',
      icon: Medal,
      color: 'from-pink-500 to-rose-500',
      route: '/chirpplay/wordladder',
      players: 'Solo',
      duration: '3-8 min'
    },
    {
      id: 'quickmath',
      name: 'Quick Math',
      description: 'Solve math puzzles against the clock!',
      icon: Zap,
      color: 'from-orange-500 to-yellow-500',
      route: '/chirpplay/math',
      players: 'Solo',
      duration: '1 min'
    },
    {
      id: 'memoryflip',
      name: 'Memory Flip',
      description: 'Match pairs of cards before time runs out!',
      icon: Circle,
      color: 'from-green-500 to-emerald-500',
      route: '/chirpplay/memory',
      players: 'Solo',
      duration: '3-8 min'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-90"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              ChirpPlay
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Play, compete, and connect with friends through exciting mini-games!
            </p>
          </div>

          {/* Player Stats Cards */}
          {isSignedIn ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center">
                <Trophy className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{stats.points}</div>
                <div className="text-sm text-white/80">Points</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center">
                <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{stats.streak}</div>
                <div className="text-sm text-white/80">Day Streak</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center">
                <Medal className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{stats.wins}</div>
                <div className="text-sm text-white/80">Wins</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center">
                <TrendingUp className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">#{stats.rank || '--'}</div>
                <div className="text-sm text-white/80">Global Rank</div>
              </div>
            </div>
          ) : (
            <div className="mt-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center">
              <Trophy className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Sign in to track your stats!</h3>
              <p className="text-white/80 mb-6">Join ChirpPlay to compete with friends and climb the leaderboard</p>
              <button
                onClick={() => window.location.href = '/signin'}
                className="px-8 py-3 bg-white text-purple-600 font-bold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Sign In Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Games Section */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Circle className="w-8 h-8 text-purple-600" />
              Games
            </h2>

            <div className="grid gap-6">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="relative group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${game.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
                  
                  <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-400 transition-all duration-300 hover:shadow-xl">
                    <div className="flex items-start gap-6">
                      <div className={`p-4 bg-gradient-to-br ${game.color} rounded-2xl shadow-lg`}>
                        <game.icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                              {game.name}
                              {game.comingSoon && (
                                <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                                  Coming Soon
                                </span>
                              )}
                            </h3>
                            <p className="text-gray-600 mt-1">{game.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-500 mt-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {game.players}
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            {game.duration}
                          </div>
                        </div>

                        {isSignedIn ? (
                          <button
                            onClick={() => {
                              if (game.id === 'doodledash') {
                                window.open('http://localhost:8080', '_blank');
                              } else {
                                window.location.href = game.route;
                              }
                            }}
                            className={`mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${game.color} text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200`}
                          >
                            Play Now
                            <Zap className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              toast.error('Please sign in to play games');
                              setTimeout(() => {
                                window.location.href = '/signin';
                              }, 1000);
                            }}
                            className={`mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${game.color} text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200`}
                          >
                            Sign In to Play
                            <Zap className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard Section */}
          <div>
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden sticky top-6">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Crown className="w-7 h-7" />
                  Global Leaderboard
                </h2>
                <p className="text-white/90 text-sm mt-1">Top players this week</p>
              </div>

              <div className="p-6">
                {!isSignedIn ? (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Sign in to view the leaderboard</p>
                    <button
                      onClick={() => window.location.href = '/signin'}
                      className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                      Sign In
                    </button>
                  </div>
                ) : loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Be the first to play!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((player, index) => (
                      <div
                        key={player.user_id}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                          player.user_id === user?._id
                            ? 'bg-purple-50 border-2 border-purple-300'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${
                          index === 0 ? 'bg-yellow-400 text-white' :
                          index === 1 ? 'bg-gray-300 text-white' :
                          index === 2 ? 'bg-orange-400 text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        
                        {player.profile_picture ? (
                          <img
                            src={player.profile_picture}
                            alt={player.full_name}
                            className="w-10 h-10 rounded-full border-2 border-white shadow object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-10 h-10 rounded-full border-2 border-white shadow bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm"
                          style={{ display: player.profile_picture ? 'none' : 'flex' }}
                        >
                          {player.full_name ? player.full_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-900 truncate">
                              {player.full_name && player.full_name !== 'Unknown' ? player.full_name : (player.username || 'Player')}
                            </div>
                            {/* LinkedIn-style level badge */}
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              player.total_points >= 1000 ? 'bg-purple-100 text-purple-700' :
                              player.total_points >= 500 ? 'bg-blue-100 text-blue-700' :
                              player.total_points >= 200 ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {player.total_points >= 1000 ? 'Legend' :
                               player.total_points >= 500 ? 'Expert' :
                               player.total_points >= 200 ? 'Pro' : 'Rookie'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Trophy className="w-3 h-3" />
                            {player.total_points} pts
                            {player.average_time && (
                              <>
                                <span>•</span>
                                ⏱️ {player.average_time}s avg
                              </>
                            )}
                            {player.current_streak > 0 && (
                              <>
                                <span>•</span>
                                <Flame className="w-3 h-3 text-orange-500" />
                                {player.current_streak}
                              </>
                            )}
                          </div>
                        </div>

                        {player.user_id === user?._id && (
                          <div className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                            You
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChirpPlay;
