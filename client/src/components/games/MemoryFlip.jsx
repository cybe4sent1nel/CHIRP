import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const MemoryFlip = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');

  const emojis = ['🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🎹', '🎺', '🎻', '🎼', '🏀', '⚽', '🏈', '⚾', '🎾', '🏐'];

  const initializeGame = (level) => {
    const pairCount = level === 'easy' ? 6 : level === 'medium' ? 8 : 12;
    const selectedEmojis = emojis.slice(0, pairCount);
    const cardPairs = [...selectedEmojis, ...selectedEmojis]
      .map((emoji, index) => ({ id: index, emoji, matched: false }))
      .sort(() => Math.random() - 0.5);
    
    setCards(cardPairs);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameStarted(true);
    setGameCompleted(false);
    setStartTime(Date.now());
    setTimeElapsed(0);
    setDifficulty(level);
  };

  useEffect(() => {
    let timer;
    if (gameStarted && !gameCompleted) {
      timer = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameCompleted, startTime]);

  useEffect(() => {
    if (flipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = flipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        setMatched([...matched, first, second]);
        setFlipped([]);
        
        if (matched.length + 2 === cards.length) {
          setGameCompleted(true);
          saveScore(timeElapsed, moves + 1);
          toast.success('Congratulations! You won!');
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  }, [flipped]);

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    setFlipped([...flipped, index]);
  };

  const saveScore = async (time, moveCount) => {
    try {
      const token = await getToken();
      const basePoints = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 200 : 300;
      const points = Math.max(basePoints - time - (moveCount * 5), 50);
      
      await api.post('/api/games/update-stats', {
        gameType: 'memoryflip',
        points,
        timeTaken: time,
        metadata: { moves: moveCount, difficulty }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/chirpplay')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Games
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Memory Flip
            </h1>
            <p className="text-gray-600">Match all the pairs as fast as you can!</p>
          </div>

          {!gameStarted ? (
            <div className="space-y-4">
              <button
                onClick={() => initializeGame('easy')}
                className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition"
              >
                Easy (6 pairs)
              </button>
              <button
                onClick={() => initializeGame('medium')}
                className="w-full py-4 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition"
              >
                Medium (8 pairs)
              </button>
              <button
                onClick={() => initializeGame('hard')}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition"
              >
                Hard (12 pairs)
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl flex-1 mr-2">
                  <div className="text-sm text-gray-600 mb-1">Time</div>
                  <div className="text-2xl font-bold text-blue-600">{timeElapsed}s</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl flex-1 ml-2">
                  <div className="text-sm text-gray-600 mb-1">Moves</div>
                  <div className="text-2xl font-bold text-purple-600">{moves}</div>
                </div>
              </div>

              <div className={`grid gap-3 mb-6 ${
                difficulty === 'easy' ? 'grid-cols-4' :
                difficulty === 'medium' ? 'grid-cols-4' : 'grid-cols-6'
              }`}>
                {cards.map((card, index) => (
                  <button
                    key={index}
                    onClick={() => handleCardClick(index)}
                    disabled={flipped.includes(index) || matched.includes(index)}
                    className={`aspect-square rounded-xl text-4xl font-bold transition-all duration-300 transform ${
                      flipped.includes(index) || matched.includes(index)
                        ? 'bg-gradient-to-br from-green-400 to-emerald-400 text-white scale-95'
                        : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-200 hover:scale-105'
                    }`}
                  >
                    {(flipped.includes(index) || matched.includes(index)) ? card.emoji : '?'}
                  </button>
                ))}
              </div>

              {gameCompleted && (
                <div className="text-center space-y-4">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
                  <h3 className="text-2xl font-bold text-green-600">Victory!</h3>
                  <div className="space-y-1">
                    <p className="text-lg">Time: {timeElapsed}s</p>
                    <p className="text-lg">Moves: {moves}</p>
                  </div>
                  <button
                    onClick={() => setGameStarted(false)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg transition"
                  >
                    Play Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryFlip;
