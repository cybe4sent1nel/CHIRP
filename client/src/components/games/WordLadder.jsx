import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const WordLadder = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [startWord, setStartWord] = useState('');
  const [targetWord, setTargetWord] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [ladder, setLadder] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [solveTime, setSolveTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [level, setLevel] = useState('novice');

  const puzzles = {
    easy: [
      { start: 'COLD', target: 'WARM', optimal: 4 },
      { start: 'HEAD', target: 'TAIL', optimal: 4 },
      { start: 'WORK', target: 'PLAY', optimal: 4 },
    ],
    medium: [
      { start: 'STONE', target: 'MONEY', optimal: 5 },
      { start: 'BREAD', target: 'TOAST', optimal: 5 },
      { start: 'HAPPY', target: 'SORRY', optimal: 6 },
    ],
    hard: [
      { start: 'SMART', target: 'BRAIN', optimal: 7 },
      { start: 'LIGHT', target: 'SOUND', optimal: 8 },
    ]
  };

  const startNewGame = (difficulty) => {
    const puzzleSet = puzzles[difficulty];
    const puzzle = puzzleSet[Math.floor(Math.random() * puzzleSet.length)];
    setStartWord(puzzle.start);
    setTargetWord(puzzle.target);
    setCurrentWord(puzzle.start);
    setLadder([puzzle.start]);
    setGameStarted(true);
    setGameCompleted(false);
    setStartTime(Date.now());
    setMoves(0);
    setLevel(difficulty);
  };

  const isValidWord = (word) => {
    // Simple validation - in production, use dictionary API
    return word.length === startWord.length && /^[A-Z]+$/.test(word);
  };

  const isOneLetterDiff = (word1, word2) => {
    let diff = 0;
    for (let i = 0; i < word1.length; i++) {
      if (word1[i] !== word2[i]) diff++;
    }
    return diff === 1;
  };

  const handleSubmitWord = async () => {
    const word = currentWord.toUpperCase();
    
    if (!isValidWord(word)) {
      toast.error('Invalid word!');
      return;
    }

    if (ladder.includes(word)) {
      toast.error('Word already used!');
      return;
    }

    if (!isOneLetterDiff(ladder[ladder.length - 1], word)) {
      toast.error('Change only one letter!');
      return;
    }

    const newLadder = [...ladder, word];
    setLadder(newLadder);
    setMoves(moves + 1);

    if (word === targetWord) {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      setSolveTime(timeTaken);
      setGameCompleted(true);
      await saveScore(timeTaken, moves + 1);
      toast.success(`Completed in ${moves + 1} moves!`);
    }

    setCurrentWord('');
  };

  const saveScore = async (time, moveCount) => {
    try {
      const token = await getToken();
      await api.post('/api/games/update-stats', {
        gameType: 'wordladder',
        points: Math.max(100 - moveCount * 5, 10),
        timeTaken: time,
        metadata: { moves: moveCount, level }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/chirpplay')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Games
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Word Ladder
            </h1>
            <p className="text-gray-600">Change one word to another, one letter at a time!</p>
          </div>

          {!gameStarted ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-4">Choose Difficulty</h2>
              </div>
              <button
                onClick={() => startNewGame('easy')}
                className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition"
              >
                Easy (4-letter words)
              </button>
              <button
                onClick={() => startNewGame('medium')}
                className="w-full py-4 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition"
              >
                Medium (5-letter words)
              </button>
              <button
                onClick={() => startNewGame('hard')}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition"
              >
                Hard (5+ letter words)
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{startWord}</div>
                  <div className="text-xs text-gray-500">Start</div>
                </div>
                <div className="text-gray-400">→</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{targetWord}</div>
                  <div className="text-xs text-gray-500">Target</div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="text-sm font-semibold text-gray-600 mb-2">Your Ladder:</div>
                {ladder.map((word, idx) => (
                  <div key={idx} className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg text-center font-bold">
                    {word}
                  </div>
                ))}
              </div>

              {!gameCompleted ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={currentWord}
                    onChange={(e) => setCurrentWord(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitWord()}
                    placeholder="Enter next word"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-lg font-bold uppercase focus:border-purple-500 focus:outline-none"
                    maxLength={startWord.length}
                  />
                  <button
                    onClick={handleSubmitWord}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition"
                  >
                    Submit Word
                  </button>
                  <div className="text-center text-sm text-gray-500">
                    Moves: {moves}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
                  <h3 className="text-2xl font-bold text-green-600">Completed!</h3>
                  <div className="space-y-2">
                    <p className="text-lg">Moves: {moves}</p>
                    <p className="text-lg">Time: {solveTime}s</p>
                  </div>
                  <button
                    onClick={() => setGameStarted(false)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition"
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

export default WordLadder;
