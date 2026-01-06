import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Crown, RotateCcw, HelpCircle, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Queens = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [boardSize, setBoardSize] = useState(5);
  const [board, setBoard] = useState([]);
  const [queens, setQueens] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [solveTime, setSolveTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [showHint, setShowHint] = useState(false);

  const initializeGame = (size) => {
    setBoardSize(size);
    const newBoard = Array(size).fill().map(() => Array(size).fill(false));
    setBoard(newBoard);
    setQueens([]);
    setGameStarted(true);
    setGameCompleted(false);
    setStartTime(Date.now());
    setMoves(0);
    setHighlightedCells([]);
    setHintsLeft(size === 5 ? 2 : size === 6 ? 3 : 4);
    setShowHint(false);
  };

  const isValidPlacement = (row, col, currentQueens) => {
    // Check if there's already a queen in the same row
    if (currentQueens.some(q => q.row === row)) return false;
    
    // Check if there's already a queen in the same column
    if (currentQueens.some(q => q.col === col)) return false;
    
    // Check diagonals
    for (let queen of currentQueens) {
      const rowDiff = Math.abs(queen.row - row);
      const colDiff = Math.abs(queen.col - col);
      if (rowDiff === colDiff) return false;
    }
    
    return true;
  };

  const highlightThreats = (row, col) => {
    const threats = [];
    
    // Add all cells in the same row and column
    for (let i = 0; i < boardSize; i++) {
      threats.push({ row, col: i });
      threats.push({ row: i, col });
    }
    
    // Add diagonal cells
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const rowDiff = Math.abs(i - row);
        const colDiff = Math.abs(j - col);
        if (rowDiff === colDiff && rowDiff !== 0) {
          threats.push({ row: i, col: j });
        }
      }
    }
    
    setHighlightedCells(threats);
  };

  const handleCellClick = (row, col) => {
    if (gameCompleted) return;

    // Check if clicking on existing queen to remove it
    const existingQueenIndex = queens.findIndex(q => q.row === row && q.col === col);
    
    if (existingQueenIndex !== -1) {
      // Remove queen
      const newQueens = queens.filter((_, i) => i !== existingQueenIndex);
      setQueens(newQueens);
      setMoves(moves + 1);
      setHighlightedCells([]);
      return;
    }

    // Try to place a new queen
    if (isValidPlacement(row, col, queens)) {
      const newQueens = [...queens, { row, col }];
      setQueens(newQueens);
      setMoves(moves + 1);
      highlightThreats(row, col);

      // Check if game is complete
      if (newQueens.length === boardSize) {
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        setSolveTime(timeTaken);
        setGameCompleted(true);
        saveScore(timeTaken, moves + 1);
        toast.success(`Perfect! Completed in ${timeTaken}s!`);
      }
    } else {
      toast.error('Invalid placement! Queens cannot attack each other.');
    }
  };

  const saveScore = async (time, moveCount) => {
    try {
      const token = await getToken();
      const basePoints = boardSize === 5 ? 100 : boardSize === 6 ? 200 : 300;
      const timeBonus = Math.max(50 - time, 0);
      const moveBonus = Math.max(30 - moveCount, 0);
      const points = basePoints + timeBonus + moveBonus;

      await api.post('/api/games/update-stats', {
        gameType: 'queens',
        points,
        timeTaken: time,
        metadata: { moves: moveCount, boardSize }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };

  const useHint = () => {
    if (hintsLeft <= 0) {
      toast.error('No hints left!');
      return;
    }

    // Find a safe row for next queen
    for (let row = 0; row < boardSize; row++) {
      if (queens.some(q => q.row === row)) continue;
      
      for (let col = 0; col < boardSize; col++) {
        if (isValidPlacement(row, col, queens)) {
          highlightThreats(row, col);
          setShowHint(true);
          setHintsLeft(hintsLeft - 1);
          
          setTimeout(() => {
            setShowHint(false);
            setHighlightedCells([]);
          }, 3000);
          
          return;
        }
      }
    }
  };

  const resetGame = () => {
    setQueens([]);
    setMoves(0);
    setStartTime(Date.now());
    setGameCompleted(false);
    setHighlightedCells([]);
  };

  const isCellThreatened = (row, col) => {
    return highlightedCells.some(cell => cell.row === row && cell.col === col);
  };

  const hasQueen = (row, col) => {
    return queens.some(q => q.row === row && q.col === col);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 p-6">
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
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Queens
            </h1>
            <p className="text-gray-600">Place queens so they don't attack each other!</p>
            
            <button
              onClick={() => setShowRules(!showRules)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto"
            >
              <HelpCircle className="w-4 h-4" />
              {showRules ? 'Hide Rules' : 'Show Rules'}
            </button>

            {showRules && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl text-left text-sm space-y-2">
                <p className="font-bold text-blue-900">🎯 The Goal:</p>
                <p>Place one queen in each row without any queens attacking each other.</p>
                
                <p className="font-bold text-blue-900 mt-3">📋 The Rules:</p>
                <p>♕ Queens attack horizontally, vertically, and diagonally</p>
                <p>♕ No two queens can be in the same row, column, or diagonal</p>
                <p>♕ You must place exactly one queen per row</p>
                <p>♕ Red highlighted cells show where a queen would attack</p>
                
                <p className="font-bold text-blue-900 mt-3">💡 Strategy Tips:</p>
                <p>• Start with corners - they have fewer attack paths</p>
                <p>• Work row by row systematically</p>
                <p>• Use the hint button if you get stuck!</p>
              </div>
            )}
          </div>

          {!gameStarted ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-4">
                  Place queens so that no two queens can attack each other.
                  <br />Queens attack horizontally, vertically, and diagonally.
                </p>
              </div>
              <button
                onClick={() => initializeGame(5)}
                className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition"
              >
                Easy (5×5) - 2 Hints
              </button>
              <button
                onClick={() => initializeGame(6)}
                className="w-full py-4 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition"
              >
                Medium (6×6) - 3 Hints
              </button>
              <button
                onClick={() => initializeGame(8)}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition"
              >
                Hard (8×8) - 4 Hints
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6 gap-2">
                <div className="text-center p-3 bg-purple-50 rounded-xl flex-1">
                  <Crown className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <div className="text-xl font-bold text-purple-600">{queens.length}/{boardSize}</div>
                  <div className="text-xs text-gray-500">Queens</div>
                </div>
                <button
                  onClick={useHint}
                  disabled={hintsLeft === 0}
                  className={`p-3 rounded-xl transition ${
                    hintsLeft > 0 
                      ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title={`${hintsLeft} hints left`}
                >
                  <Lightbulb className="w-5 h-5" />
                  <span className="text-xs block">{hintsLeft}</span>
                </button>
                <div className="text-center p-3 bg-blue-50 rounded-xl flex-1 mx-2">
                  <div className="text-xl font-bold text-blue-600">{moves}</div>
                  <div className="text-xs text-gray-500">Moves</div>
                </div>
                <button
                  onClick={resetGame}
                  className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="mb-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-2xl">
                <div 
                  className="grid gap-0.5 mx-auto"
                  style={{ 
                    gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
                    maxWidth: boardSize <= 5 ? '400px' : boardSize === 6 ? '480px' : '560px'
                  }}
                >
                  {board.map((row, rowIndex) => (
                    row.map((_, colIndex) => {
                      const isQueen = hasQueen(rowIndex, colIndex);
                      const threatLevel = getThreatLevel(rowIndex, colIndex);
                      const isHintCell = showHint && highlightedCells.some(cell => cell.row === rowIndex && cell.col === colIndex);
                      
                      // Determine cell background color
                      let bgClass = 'bg-lime-300'; // Default safe zone
                      
                      if (isQueen) {
                        bgClass = 'bg-gray-400'; // Queen cell
                      } else if (threatLevel === 3) {
                        bgClass = 'bg-red-400'; // High threat (all directions)
                      } else if (threatLevel === 2) {
                        bgClass = 'bg-orange-300'; // Medium threat (2 directions)
                      } else if (threatLevel === 1) {
                        bgClass = 'bg-yellow-200'; // Low threat (1 direction)
                      } else if (isHintCell) {
                        bgClass = 'bg-blue-400 animate-pulse'; // Hint
                      }
                      
                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          onMouseEnter={() => !isQueen && !gameCompleted && highlightThreats(rowIndex, colIndex)}
                          onMouseLeave={() => !gameCompleted && setHighlightedCells([])}
                          disabled={gameCompleted}
                          className={`aspect-square border-2 border-black flex items-center justify-center text-4xl transition-all ${bgClass} ${
                            !gameCompleted ? 'cursor-pointer hover:brightness-110 active:scale-95' : 'cursor-default'
                          }`}
                          style={{
                            minHeight: boardSize <= 5 ? '60px' : boardSize === 6 ? '60px' : '55px'
                          }}
                        >
                          {isQueen && <span className="drop-shadow-lg">👑</span>}
                          {!isQueen && threatLevel > 0 && (
                            <span className="text-gray-700 text-2xl">×</span>
                          )}
                        </button>
                      );
                    })
                  ))}
                </div>
              </div>

              {gameCompleted && (
                <div className="text-center space-y-4">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
                  <h3 className="text-2xl font-bold text-purple-600">Victory!</h3>
                  <div className="space-y-1">
                    <p className="text-lg">Time: {solveTime}s</p>
                    <p className="text-lg">Moves: {moves}</p>
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

export default Queens;
