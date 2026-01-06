import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, RotateCcw, HelpCircle, Lightbulb, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Zip = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [boardSize, setBoardSize] = useState(5);
  const [numbers, setNumbers] = useState([]);
  const [path, setPath] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [solveTime, setSolveTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [showHint, setShowHint] = useState(false);

  // Generate daily seed based on date
  const getDailySeed = () => {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  };

  // Seeded random number generator
  const seededRandom = (seed) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const generatePuzzle = (size) => {
    const seed = getDailySeed();
    const totalNumbers = Math.floor(size * 1.5);
    const newNumbers = [];
    const grid = Array(size).fill().map(() => Array(size).fill(null));

    // Place numbers using seeded random
    for (let i = 1; i <= totalNumbers; i++) {
      let row, col, attempts = 0;
      do {
        const rand1 = seededRandom(seed + i * 100);
        const rand2 = seededRandom(seed + i * 200);
        row = Math.floor(rand1 * size);
        col = Math.floor(rand2 * size);
        attempts++;
      } while (grid[row][col] !== null && attempts < 50);
      
      if (attempts < 50) {
        grid[row][col] = i;
        newNumbers.push({ number: i, row, col });
      }
    }

    return newNumbers;
  };

  const initializeGame = (size) => {
    setBoardSize(size);
    const puzzle = generatePuzzle(size);
    setNumbers(puzzle);
    setPath([]);
    setCurrentNumber(1);
    setGameStarted(true);
    setGameCompleted(false);
    setStartTime(Date.now());
    setMoves(0);
    setHintsLeft(size === 5 ? 3 : size === 7 ? 4 : 5);
    setShowHint(false);
  };

  const isAdjacent = (cell1, cell2) => {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  const isValidMove = (row, col) => {
    // Check if cell is already in path
    if (path.some(cell => cell.row === row && cell.col === col)) {
      return false;
    }

    // If path is empty, must start at 1
    if (path.length === 0) {
      const num1 = numbers.find(n => n.number === 1);
      return row === num1.row && col === num1.col;
    }

    // Must be adjacent to last cell
    const lastCell = path[path.length - 1];
    return isAdjacent(lastCell, { row, col });
  };

  const handleCellDown = (row, col) => {
    if (gameCompleted) return;
    
    if (path.length === 0) {
      const num1 = numbers.find(n => n.number === 1);
      if (row === num1.row && col === num1.col) {
        setPath([{ row, col }]);
        setIsDragging(true);
        setMoves(1);
      }
    }
  };

  const handleCellEnter = (row, col) => {
    if (!isDragging || gameCompleted) return;

    if (isValidMove(row, col)) {
      const newPath = [...path, { row, col }];
      setPath(newPath);
      setMoves(moves + 1);

      // Check if landed on a number
      const numberCell = numbers.find(n => n.row === row && n.col === col);
      if (numberCell) {
        if (numberCell.number === currentNumber + 1) {
          setCurrentNumber(currentNumber + 1);
          
          // Check if puzzle is complete
          if (numberCell.number === numbers[numbers.length - 1].number && 
              newPath.length === boardSize * boardSize) {
            const timeTaken = Math.floor((Date.now() - startTime) / 1000);
            setSolveTime(timeTaken);
            setGameCompleted(true);
            setIsDragging(false);
            saveScore(timeTaken, moves + 1);
            toast.success('Perfect! Puzzle solved!');
          }
        } else if (numberCell.number !== currentNumber) {
          toast.error(`Must reach ${currentNumber + 1} next!`);
          handleUndo();
        }
      }
    }
  };

  const handleCellUp = () => {
    setIsDragging(false);
  };

  const handleUndo = () => {
    if (path.length > 0) {
      const newPath = path.slice(0, -1);
      setPath(newPath);
      
      // Update current number
      let lastNumber = 1;
      for (let cell of newPath) {
        const numCell = numbers.find(n => n.row === cell.row && n.col === cell.col);
        if (numCell) lastNumber = numCell.number;
      }
      setCurrentNumber(lastNumber);
    }
  };

  const useHint = () => {
    if (hintsLeft <= 0) {
      toast.error('No hints left!');
      return;
    }

    setShowHint(true);
    setHintsLeft(hintsLeft - 1);
    
    setTimeout(() => {
      setShowHint(false);
    }, 3000);
  };

  const getNextNumberPosition = () => {
    return numbers.find(n => n.number === currentNumber + 1);
  };

  const saveScore = async (time, moveCount) => {
    try {
      const token = await getToken();
      const basePoints = boardSize === 5 ? 150 : boardSize === 7 ? 250 : 400;
      const timeBonus = Math.max(150 - time, 0);
      const moveBonus = Math.max(100 - moveCount, 0);
      const points = basePoints + timeBonus + moveBonus;

      await api.post('/api/games/update-stats', {
        gameType: 'zip',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/chirpplay')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Games
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Zip
            </h1>
            <p className="text-gray-600">Connect numbers in order and fill the entire grid!</p>
            
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
                <p>Draw a single continuous line connecting numbers sequentially (1→2→3...) while filling EVERY square.</p>
                
                <p className="font-bold text-blue-900 mt-3">📋 The Rules:</p>
                <p>✓ Connect in Order: Start at 1, go to 2, then 3, etc.</p>
                <p>✓ Fill the Grid: Your path must pass through every square</p>
                <p>✓ No Crossing: Cannot cross your own path</p>
                <p>✓ Orthogonal Only: Move up, down, left, right (no diagonals)</p>
                
                <p className="font-bold text-blue-900 mt-3">💡 Strategy Tips:</p>
                <p>• Look for dead ends first (corners with only one exit)</p>
                <p>• Don't go straight to the next number - "snake" around</p>
                <p>• Work backwards from the final number</p>
                <p>• Undo moves when stuck - it's part of solving!</p>
              </div>
            )}
          </div>

          {!gameStarted ? (
            <div className="space-y-4">
              <button
                onClick={() => initializeGame(5)}
                className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition"
              >
                Easy (5×5) - 3 Hints
              </button>
              <button
                onClick={() => initializeGame(7)}
                className="w-full py-4 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition"
              >
                Medium (7×7) - 4 Hints
              </button>
              <button
                onClick={() => initializeGame(10)}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition"
              >
                Hard (10×10) - 5 Hints
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">
                🗓️ Daily puzzle changes every day!
              </p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6 gap-2">
                <div className="text-center p-3 bg-indigo-50 rounded-xl flex-1">
                  <div className="text-xl font-bold text-indigo-600">
                    {currentNumber}/{numbers.length}
                  </div>
                  <div className="text-xs text-gray-500">Numbers</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-xl flex-1">
                  <div className="text-xl font-bold text-purple-600">
                    {path.length}/{boardSize * boardSize}
                  </div>
                  <div className="text-xs text-gray-500">Filled</div>
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
                <button
                  onClick={handleUndo}
                  disabled={path.length === 0}
                  className="p-3 bg-orange-100 rounded-xl hover:bg-orange-200 transition disabled:opacity-50"
                >
                  <RotateCcw className="w-5 h-5 text-orange-600" />
                </button>
                <button
                  onClick={() => { setPath([]); setCurrentNumber(1); setMoves(0); }}
                  className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="mb-6 overflow-x-auto">
                <div className="inline-block min-w-full">
                  {Array(boardSize).fill().map((_, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center">
                      {Array(boardSize).fill().map((_, colIndex) => {
                        const inPath = path.some(cell => cell.row === rowIndex && cell.col === colIndex);
                        const numberCell = numbers.find(n => n.row === rowIndex && n.col === colIndex);
                        const pathIndex = path.findIndex(cell => cell.row === rowIndex && cell.col === colIndex);
                        const nextNumber = getNextNumberPosition();
                        const isNextHint = showHint && nextNumber && 
                                          nextNumber.row === rowIndex && nextNumber.col === colIndex;
                        
                        return (
                          <button
                            key={`${rowIndex}-${colIndex}`}
                            onMouseDown={() => handleCellDown(rowIndex, colIndex)}
                            onMouseEnter={() => handleCellEnter(rowIndex, colIndex)}
                            onMouseUp={handleCellUp}
                            onTouchStart={() => handleCellDown(rowIndex, colIndex)}
                            onTouchMove={(e) => {
                              const touch = e.touches[0];
                              const element = document.elementFromPoint(touch.clientX, touch.clientY);
                              if (element && element.dataset.cell) {
                                const [r, c] = element.dataset.cell.split('-').map(Number);
                                handleCellEnter(r, c);
                              }
                            }}
                            onTouchEnd={handleCellUp}
                            disabled={gameCompleted}
                            data-cell={`${rowIndex}-${colIndex}`}
                            className={`w-12 h-12 border-2 flex items-center justify-center font-bold transition-all relative
                              ${inPath ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white border-gray-300'}
                              ${isNextHint ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                              ${!gameCompleted ? 'cursor-pointer hover:border-indigo-400' : 'cursor-default'}
                            `}
                          >
                            {numberCell && (
                              <span className={`text-lg font-bold ${inPath ? 'text-white' : 'text-indigo-600'}`}>
                                {numberCell.number}
                              </span>
                            )}
                            {inPath && !numberCell && pathIndex >= 0 && (
                              <span className="text-xs text-white opacity-50">{pathIndex + 1}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {gameCompleted && (
                <div className="text-center space-y-4">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
                  <h3 className="text-2xl font-bold text-indigo-600">Zipped!</h3>
                  <div className="space-y-1">
                    <p className="text-lg">Time: {solveTime}s</p>
                    <p className="text-lg">Moves: {moves}</p>
                  </div>
                  <button
                    onClick={() => setGameStarted(false)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition"
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

export default Zip;
