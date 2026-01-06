import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Clock, Target as TargetIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const QuickMath = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [streak, setStreak] = useState(0);
  const [problemsSolved, setProblemsSolved] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');

  const generateProblem = (level) => {
    let num1, num2, operator, answer;
    
    if (level === 'easy') {
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      operator = ['+', '-'][Math.floor(Math.random() * 2)];
    } else if (level === 'medium') {
      num1 = Math.floor(Math.random() * 50) + 1;
      num2 = Math.floor(Math.random() * 50) + 1;
      operator = ['+', '-', '*'][Math.floor(Math.random() * 3)];
    } else {
      num1 = Math.floor(Math.random() * 100) + 1;
      num2 = Math.floor(Math.random() * 100) + 1;
      operator = ['+', '-', '*', '/'][Math.floor(Math.random() * 4)];
      if (operator === '/') {
        num1 = num2 * (Math.floor(Math.random() * 10) + 1);
      }
    }

    switch (operator) {
      case '+': answer = num1 + num2; break;
      case '-': answer = num1 - num2; break;
      case '*': answer = num1 * num2; break;
      case '/': answer = num1 / num2; break;
    }

    return { num1, num2, operator, answer };
  };

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      endGame();
    }
  }, [timeLeft, gameActive]);

  const startGame = (level) => {
    setDifficulty(level);
    setScore(0);
    setTimeLeft(60);
    setGameActive(true);
    setStreak(0);
    setProblemsSolved(0);
    setCurrentProblem(generateProblem(level));
  };

  const endGame = async () => {
    setGameActive(false);
    await saveScore();
    toast.success(`Game Over! Score: ${score}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const answer = parseFloat(userAnswer);
    
    if (answer === currentProblem.answer) {
      const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
      const bonusPoints = Math.floor(streak / 3) * 5;
      setScore(score + points + bonusPoints);
      setStreak(streak + 1);
      setProblemsSolved(problemsSolved + 1);
      toast.success(`Correct! +${points + bonusPoints}`);
    } else {
      setStreak(0);
      toast.error('Wrong answer!');
    }
    
    setUserAnswer('');
    setCurrentProblem(generateProblem(difficulty));
  };

  const saveScore = async () => {
    try {
      const token = await getToken();
      await api.post('/api/games/update-stats', {
        gameType: 'quickmath',
        points: score,
        timeTaken: 60,
        metadata: { problemsSolved, difficulty }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 p-6">
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
            <h1 className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Quick Math
            </h1>
            <p className="text-gray-600">Solve as many problems as you can in 60 seconds!</p>
          </div>

          {!gameActive ? (
            <div className="space-y-4">
              {score > 0 && (
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl mb-6">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">{score}</div>
                  <div className="text-sm text-gray-600">Final Score</div>
                  <div className="text-sm text-gray-600 mt-2">Problems Solved: {problemsSolved}</div>
                </div>
              )}
              <button
                onClick={() => startGame('easy')}
                className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition"
              >
                Easy (+, -)
              </button>
              <button
                onClick={() => startGame('medium')}
                className="w-full py-4 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition"
              >
                Medium (+, -, ×)
              </button>
              <button
                onClick={() => startGame('hard')}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition"
              >
                Hard (+, -, ×, ÷)
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl flex-1 mr-2">
                  <Clock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-blue-600">{timeLeft}s</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl flex-1 ml-2">
                  <Trophy className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-purple-600">{score}</div>
                </div>
              </div>

              {streak >= 3 && (
                <div className="text-center mb-4 p-3 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl">
                  <span className="text-orange-600 font-bold">🔥 {streak} Streak!</span>
                </div>
              )}

              <div className="text-center mb-8 p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                <div className="text-5xl font-black text-gray-900 mb-4">
                  {currentProblem?.num1} {currentProblem?.operator} {currentProblem?.num2} = ?
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Your answer"
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-center text-2xl font-bold focus:border-orange-500 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:shadow-lg transition text-xl"
                >
                  Submit
                </button>
              </form>

              <div className="text-center mt-4 text-sm text-gray-500">
                Problems Solved: {problemsSolved}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickMath;
