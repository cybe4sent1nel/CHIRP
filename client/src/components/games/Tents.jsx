import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, RotateCcw, HelpCircle, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Tents = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [boardSize, setBoardSize] = useState(5);
  const [trees, setTrees] = useState([]);
  const [tents, setTents] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [solveTime, setSolveTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [rowHints, setRowHints] = useState([]);
  const [colHints, setColHints] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [showHint, setShowHint] = useState(null);

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
    // Generate a solvable puzzle with daily seed
    const seed = getDailySeed();
    const newTrees = [];
    const targetTents = Math.floor(size * size * 0.25);
    
    // Place trees using seeded random
    for (let i = 0; i < targetTents; i++) {
      let row, col, attempts = 0;
      do {
        const rand1 = seededRandom(seed + i * 100);
        const rand2 = seededRandom(seed + i * 200);
        row = Math.floor(rand1 * size);
        col = Math.floor(rand2 * size);
        attempts++;
      } while (newTrees.some(t => t.row === row && t.col === col) && attempts < 50);
      
      if (attempts < 50) {
        newTrees.push({ row, col });
      }
    }

    // Calculate hints
    const newRowHints = Array(size).fill(0);
    const newColHints = Array(size).fill(0);
    
    // For simplicity, calculate based on tree positions
    newTrees.forEach(tree => {
      // Place virtual tent adjacent to tree for hints
      const adjacentSpots = [
        { row: tree.row - 1, col: tree.col },
        { row: tree.row + 1, col: tree.col },
        { row: tree.row, col: tree.col - 1 },
        { row: tree.row, col: tree.col + 1 }
      ];
      
      const validSpot = adjacentSpots.find(spot => 
        spot.row >= 0 && spot.row < size && 
        spot.col >= 0 && spot.col < size &&
        !newTrees.some(t => t.row === spot.row && t.col === spot.col)
      );
      
      if (validSpot) {
        newRowHints[validSpot.row]++;
        newColHints[validSpot.col]++;
      }
    });

    return { trees: newTrees, rowHints: newRowHints, colHints: newColHints };
  };

  const initializeGame = (size) => {
    setBoardSize(size);
    const puzzle = generatePuzzle(size);
    setTrees(puzzle.trees);
    setRowHints(puzzle.rowHints);
    setColHints(puzzle.colHints);
    setTents([]);
    setGameStarted(true);
    setGameCompleted(false);
    setStartTime(Date.now());
    setMoves(0);
    setHintsLeft(size === 5 ? 3 : size === 7 ? 4 : 5);
    setShowHint(null);
  };

  const isValidTentPlacement = (row, col, currentTents) => {
    // Check if tent is adjacent to a tree
    const adjacentTrees = trees.filter(tree => 
      (Math.abs(tree.row - row) === 1 && tree.col === col) ||
      (Math.abs(tree.col - col) === 1 && tree.row === row)
    );
    
    if (adjacentTrees.length === 0) return false;

    // Check if tent is not touching other tents (including diagonally)
    for (let tent of currentTents) {
      const rowDiff = Math.abs(tent.row - row);
      const colDiff = Math.abs(tent.col - col);
      if (rowDiff <= 1 && colDiff <= 1) return false;
    }

    return true;
  };

  const handleCellClick = (row, col) => {
    if (gameCompleted) return;

    // Check if it's a tree
    if (trees.some(t => t.row === row && t.col === col)) {
      toast.error('Cannot place tent on a tree!');
      return;
    }

    // Check if there's already a tent
    const existingTentIndex = tents.findIndex(t => t.row === row && t.col === col);
    
    if (existingTentIndex !== -1) {
      // Remove tent
      const newTents = tents.filter((_, i) => i !== existingTentIndex);
      setTents(newTents);
      setMoves(moves + 1);
      return;
    }

    // Try to place a tent
    if (isValidTentPlacement(row, col, tents)) {
      const newTents = [...tents, { row, col }];
      setTents(newTents);
      setMoves(moves + 1);

      // Check if puzzle is solved
      const rowCounts = Array(boardSize).fill(0);
      const colCounts = Array(boardSize).fill(0);
      newTents.forEach(tent => {
        rowCounts[tent.row]++;
        colCounts[tent.col]++;
      });

      const solved = rowCounts.every((count, i) => count === rowHints[i]) &&
                    colCounts.every((count, i) => count === colHints[i]);

      if (solved) {
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        setSolveTime(timeTaken);
        setGameCompleted(true);
        saveScore(timeTaken, moves + 1);
        toast.success('Perfect! Puzzle solved!');
      }
    } else {
      toast.error('Invalid placement!');
    }
  };

  const saveScore = async (time, moveCount) => {
    try {
      const token = await getToken();
      const basePoints = boardSize === 5 ? 100 : boardSize === 7 ? 200 : 300;
      const timeBonus = Math.max(100 - time, 0);
      const moveBonus = Math.max(50 - moveCount, 0);
      const points = basePoints + timeBonus + moveBonus;

      await api.post('/api/games/update-stats', {
        gameType: 'tents',
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

    // Find a valid tent position
    for (let tree of trees) {
      const adjacentSpots = [
        { row: tree.row - 1, col: tree.col },
        { row: tree.row + 1, col: tree.col },
        { row: tree.row, col: tree.col - 1 },
        { row: tree.row, col: tree.col + 1 }
      ];
      
      for (let spot of adjacentSpots) {
        if (spot.row >= 0 && spot.row < boardSize && 
            spot.col >= 0 && spot.col < boardSize &&
            isValidTentPlacement(spot.row, spot.col, tents)) {
          setShowHint(spot);
          setHintsLeft(hintsLeft - 1);
          
          setTimeout(() => {
            setShowHint(null);
          }, 3000);
          
          return;
        }
      }
    }
  };

  const getTentCount = (row, col, type) => {
    if (type === 'row') {
      return tents.filter(t => t.row === row).length;
    } else {
      return tents.filter(t => t.col === col).length;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-yellow-50 p-6">
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
            <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 to-lime-600 bg-clip-text text-transparent mb-2">
              Tents
            </h1>
            <p className="text-gray-600">Place tents next to trees following the rules!</p>
            <button
              onClick={() => setShowRules(!showRules)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto"
            >
              <HelpCircle className="w-4 h-4" />
              {showRules ? 'Hide Rules' : 'Show Rules'}
            </button>
            {showRules && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl text-left text-sm space-y-2">
                <p>🌲 Each tree must have exactly one tent next to it (horizontally or vertically)</p>
                <p>⛺ Tents cannot touch each other, not even diagonally</p>
                <p>🔢 Numbers show how many tents are in each row/column</p>
                <p>🎯 Place all tents correctly to win!</p>
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
                <div className="text-center p-3 bg-green-50 rounded-xl flex-1">
                  <div className="text-xl font-bold text-green-600">{tents.length}</div>
                  <div className="text-xs text-gray-500">Tents</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl flex-1">
                  <div className="text-xl font-bold text-blue-600">{moves}</div>
                  <div className="text-xs text-gray-500">Moves</div>
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
                  onClick={() => { setTents([]); setMoves(0); }}
                  className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="mb-6 overflow-x-auto">
                <div className="inline-block min-w-full">
                  {/* Column hints */}
                  <div className="flex justify-center mb-2">
                    <div className="w-8"></div>
                    {colHints.map((hint, i) => (
                      <div key={i} className="w-12 text-center font-bold text-sm" style={{ 
                        color: getTentCount(0, i, 'col') === hint ? '#16a34a' : '#6b7280' 
                      }}>
                        {hint}
                      </div>
                    ))}
                  </div>

                  {/* Board */}
                  {Array(boardSize).fill().map((_, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center">
                      <div className="w-8 flex items-center justify-center font-bold text-sm" style={{
                        color: getTentCount(rowIndex, 0, 'row') === rowHints[rowIndex] ? '#16a34a' : '#6b7280'
                      }}>
                        {rowHints[rowIndex]}
                      </div>
                      {Array(boardSize).fill().map((_, colIndex) => {
                        const isTree = trees.some(t => t.row === rowIndex && t.col === colIndex);
                        const isTent = tents.some(t => t.row === rowIndex && t.col === colIndex);
                        const isEven = (rowIndex + colIndex) % 2 === 0;
                        const isHint = showHint && showHint.row === rowIndex && showHint.col === colIndex;
                        
                        return (
                          <button
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            disabled={gameCompleted}
                            className={`w-12 h-12 border flex items-center justify-center text-2xl transition-all ${
                              isTree ? 'bg-green-200 cursor-default' :
                              isTent ? 'bg-orange-400 hover:bg-orange-500' :
                              isHint ? 'bg-yellow-300 ring-4 ring-yellow-400 animate-pulse' :
                              isEven ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white hover:bg-gray-50'
                            } ${!gameCompleted && !isTree ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            {isTree && '🌲'}
                            {isTent && '⛺'}
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
                  <h3 className="text-2xl font-bold text-green-600">Perfect!</h3>
                  <div className="space-y-1">
                    <p className="text-lg">Time: {solveTime}s</p>
                    <p className="text-lg">Moves: {moves}</p>
                  </div>
                  <button
                    onClick={() => setGameStarted(false)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-lime-600 text-white font-bold rounded-xl hover:shadow-lg transition"
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

export default Tents;
