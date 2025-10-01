/**
 * IwahswapGame - Iwahswap puzzle game logic implementation
 *
 * Iwahswap is a sliding puzzle with a unique rotating rod mechanism.
 * The puzzle consists of:
 * - A vertical board with 6 cells numbered 0-5 (top to bottom)
 * - 6 pieces: a blank (0) and numbered pieces (1-5)
 * - A rotating rod (dial) with 6 positions containing values from rodtable
 *
 * Goal: Reverse the order of pieces (initial: 0,1,2,3,4,5 → goal: 0,5,4,3,2,1)
 *
 * Move types:
 * - Moves 0-1: Slide pieces adjacent to blank (if not blocked by ribs)
 * - Moves 2-3: Jump moves that swap blank with piece 2 cells away (requires notch match)
 * - Moves 4-5: Rotate the rod clockwise/counter-clockwise (if no piece/rib conflicts)
 *
 * Key concepts:
 * - Ribs: Physical barriers on certain cells that block movement when aligned with rod position
 * - Notches: Special positions that allow jump moves when piece matches notch value
 * - Rod rotation: Changes which ribs block and which notches are active
 */
class IwahswapGame extends AbstractGame {
  /**
   * Constructor
   * Initializes board and rod position to null (call init() to set up)
   */
  constructor() {
    super();
    this.board = null;  // Array[6] of piece values (0=blank, 1-5=pieces)
    this.irod = null;   // Current rod position index (0-5)
  }
}

// ============================================================================
// Game Constants
// ============================================================================

/**
 * Rod table: Values displayed on the 6 rod sections
 * These are the possible values that can be swapped with board pieces
 * Index represents rod position (0-5), value is displayed on that section
 */
const rodtable = [-4, -3, -2, 1, 2, 3];

/**
 * Rib table: Defines physical barriers (ribs) for each cell at each rod position
 * ribtable[cellIndex][rodPosition] = pieceValue or 0
 * - 0 means no rib (movement allowed)
 * - Non-zero means rib blocks movement unless piece matches the value
 *
 * Rows: board cells (0=top to 5=bottom)
 * Columns: rod positions corresponding to rodtable indices
 */
const ribtable = [
  //-4 -3 -2  1  2  3
    [0, 0, 0, 0, 1, 1], // Cell 0 (top)
    [0, 0, 0, 0, 0, 2], // Cell 1
    [0, 0, 0, 0, 0, 0], // Cell 2
    [3, 0, 0, 0, 0, 0], // Cell 3
    [2, 2, 0, 0, 0, 0], // Cell 4
    [1, 1, 1, 0, 0, 0], // Cell 5 (bottom)
];

/**
 * Notch table: Defines special positions that enable jump moves
 * notchtable[cellIndex][rodPosition] = requiredPieceValue or 0
 * - 0 means no notch (jump move not allowed)
 * - Non-zero means jump move allowed only if piece at this cell matches the value
 *
 * Jump moves (moves 2 and 3) can only occur when:
 * 1. There's a notch at the intermediate cell
 * 2. The piece at that cell matches the notch value
 *
 * Rows: board cells (0=top to 5=bottom)
 * Columns: rod positions corresponding to rodtable indices
 */
const notchtable = [
  //-4 -3 -2  1  2  3
    [0, 0, 0, 0, 0, 0], // Cell 0 (top)
    [4, 3, 2, 1, 0, 0], // Cell 1
    [0, 0, 0, 1, 0, 0], // Cell 2
    [0, 0, 2, 1, 2, 0], // Cell 3
    [0, 0, 0, 1, 0, 3], // Cell 4
    [0, 0, 0, 0, 0, 0], // Cell 5 (bottom)
];

/**
 * Color mapping for pieces
 * Index: piece value (0-5)
 * Value: CSS color name
 */
const label2color = [
  "black",  // 0 (blank/empty cell)
  "red",    // 1
  "orange", // 2
  "yellow", // 3
  "green",  // 4
  "blue",   // 5
];

/**
 * Initial board state
 * Pieces arranged in ascending order with blank at top
 */
const initboard = [0, 1, 2, 3, 4, 5];

/**
 * Goal board state
 * Pieces reversed with blank still at top
 */
const goalboard = [0, 5, 4, 3, 2, 1];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert rod value to rod position index
 * @param {number} rod - Rod value from rodtable
 * @returns {number} Index in rodtable (0-5), or -1 if not found
 */
const rod2i = function(rod) {
  for (var i = 0; i < rodtable.length; i++) {
    if (rodtable[i] == rod) return i;
  }
  return -1;
}

/**
 * Find the position of the blank (0) piece on the board
 * @param {Array} board - The game board array
 * @returns {number} Index of blank piece (0-5), or -1 if not found
 */
const findzero = function(board) {
  for (var i = 0; i < board.length; i++) {
    if (board[i] == 0) return i;
  }
  return -1;
}

// ============================================================================
// Core Game Methods
// ============================================================================

/**
 * Initialize the game to starting state
 * Sets up board with pieces in ascending order and rod at position for value 1
 */
IwahswapGame.prototype.init = function() {
  this.irod = rod2i(1);  // Set rod to position where value 1 is at pivot
  this.board = new Array(6);
  for (var i = 0; i < this.board.length; i++) {
    this.board[i] = i;  // Board: [0, 1, 2, 3, 4, 5]
  }
}

/**
 * Create a deep copy of the current game state
 * @returns {IwahswapGame} New game instance with copied state
 */
IwahswapGame.prototype.clone = function() {
  let g = new IwahswapGame();
  g.nmove = this.nmove;
  g.irod = this.irod;
  g.board = this.board.slice(0);  // Deep copy of board array
  return g;
}

/**
 * Execute a move and return the new game state
 * @param {number} dir - Move direction (0-5)
 *   0: Move piece down (piece above blank slides down)
 *   1: Move piece up (piece below blank slides up)
 *   2: Jump up (blank swaps with piece 2 cells below, requires notch)
 *   3: Jump down (blank swaps with piece 2 cells above, requires notch)
 *   4: Rotate rod clockwise (if no piece/rib conflicts)
 *   5: Rotate rod counter-clockwise (if no piece/rib conflicts)
 * @returns {IwahswapGame|number} New game state if move is valid, 0 otherwise
 */
IwahswapGame.prototype.move = function(dir) {
  const b0 = this.board;   /* original board */
  const y0 = findzero(b0); /* position of zero (blank) */
  let game;
  let x;
  let y;
  let piece;
  let ribpiece;

  switch(dir) {
    case 0: /* move piece down --------------------------- */
      // Move piece from cell above blank into blank position
      if(y0 <= 0) return 0; /* blank is at the top, can't move piece down */
      const src = y0-1;  // Source cell (above blank)
      const dst = y0;    // Destination cell (blank)
      // Check if ribs block movement
      if(ribtable[src][this.irod]!=0) return 0; /* source blocked by rib */
      if(ribtable[dst][this.irod]!=0) return 0; /* destination blocked by rib */
      // Execute move
      game = this.clone();
      game.board[dst] = b0[src];
      game.board[src] = 0;
      return game;

    case 1: /* move piece up ------------------------- */
      // Move piece from cell below blank into blank position
      if(y0 >= b0.length-1) return 0; /* blank is at the bottom */
      const src2 = y0+1;  // Source cell (below blank)
      const dst2 = y0;    // Destination cell (blank)
      // Check if ribs block movement
      if(ribtable[src2][this.irod]!=0) return 0; /* source blocked by rib */
      if(ribtable[dst2][this.irod]!=0) return 0; /* destination blocked by rib */
      // Execute move
      game = this.clone();
      game.board[dst2] = b0[src2];
      game.board[src2] = 0;
      return game;

    case 2: /* jump up (swap blank with piece 2 cells below) --- */
      // Requires: piece at intermediate cell matches notch value at that position
      if(y0 >= b0.length-2) return 0;  /* not enough cells below */
      x     = this.irod;    // Current rod position
      y     = y0+1;         // Intermediate cell (1 below blank)
      piece = b0[y];        // Piece at intermediate cell
      // Check if notch allows this jump (piece must match notch value)
      if(notchtable[y][x]!=piece) return 0;  /* notch doesn't match piece */
      // Execute jump (blank swaps with piece 2 cells below)
      game = this.clone();
      game.board[y0  ] = b0[y0+2];  // Piece 2 below moves to blank
      game.board[y0+2] = 0;          // Blank moves 2 cells down
      return game;

    case 3: /* jump down (swap blank with piece 2 cells above) - */
      // Requires: piece at intermediate cell matches notch value at that position
      if(y0 <= 1) return 0;  /* not enough cells above */
      x     = this.irod;     // Current rod position
      y     = y0-1;          // Intermediate cell (1 above blank)
      piece = b0[y];         // Piece at intermediate cell
      // Check if notch allows this jump (piece must match notch value)
      if(notchtable[y][x]!=piece) return 0;  /* notch doesn't match piece */
      // Execute jump (blank swaps with piece 2 cells above)
      game = this.clone();
      game.board[y0  ] = b0[y0-2];  // Piece 2 above moves to blank
      game.board[y0-2] = 0;          // Blank moves 2 cells up
      return game;

    case 4: /* rotate rod clockwise -------------------------- */
      // Check if rotation would cause any piece/rib conflicts
      x = (this.irod + 1 + 6)%6;  // New rod position (clockwise)
      for(y=0;y<6;y++){
        piece = b0[y];              // Piece at this cell
        ribpiece = ribtable[y][x];  // Rib value at this cell in new position
        // Conflict occurs if cell has a piece AND a rib AND they don't match
        if(piece!=0 && ribpiece!=0 && piece!=ribpiece) return 0;
      }
      // Execute rotation
      game = this.clone();
      game.irod = x;
      return game;

    case 5: /* rotate rod counter-clockwise ------------------------ */
      // Check if rotation would cause any piece/rib conflicts
      x = (this.irod - 1 + 6)%6;  // New rod position (counter-clockwise)
      for(y=0;y<6;y++){
        piece = b0[y];              // Piece at this cell
        ribpiece = ribtable[y][x];  // Rib value at this cell in new position
        // Conflict occurs if cell has a piece AND a rib AND they don't match
        if(piece!=0 && ribpiece!=0 && piece!=ribpiece) return 0;
      }
      // Execute rotation
      game = this.clone();
      game.irod = x;
      return game;
  }
}

/**
 * Check if a move is valid without executing it
 * @param {number} dir - Move direction (0-5)
 * @returns {boolean} True if move is valid, false otherwise
 */
IwahswapGame.prototype.checkmove = function(dir) {
  let game2 = this.move(dir);
  return (game2 != 0);
}

/**
 * Generate a unique hash string for this game state
 * Used for state space graph node identification
 * @returns {string} Hash string in format "piece0,piece1,...,piece5-rodPosition"
 */
IwahswapGame.prototype.hash = function() {
  return this.board.join(',') + '-' + this.irod;
}

/**
 * Check if current state matches the goal state
 * @returns {boolean} True if goal state is reached
 */
IwahswapGame.prototype.isGoal = function() {
  for (let i = 0; i < 6; i++) {
    if (this.board[i] !== goalboard[i]) {
      return false;
    }
  }
  return true;
}

// ============================================================================
// AbstractGame Interface Implementation
// ============================================================================

/**
 * Get the number of possible move directions
 * @returns {number} Always 6 for Iwahswap (4 board moves + 2 rod rotations)
 */
IwahswapGame.prototype.getNumDirections = function() {
  return 6; // Iwahswap has 6 possible move directions
}

/**
 * Get color configuration for graph visualization
 * @returns {Object} Color config with nodeColor and edgeColor functions
 */
IwahswapGame.prototype.getColorConfig = function() {
  return {
    nodeColor: (game) => {
      // Color nodes based on current rod position
      const rodValue = Math.abs(rodtable[game.irod]);
      return label2color[rodValue];
    },
    edgeColor: (direction) => {
      if (direction === 2 || direction === 3) {
        return 'rgba(0, 150, 255, 0.8)'; // Blue for jump moves
      } else if (direction === 4 || direction === 5) {
        return 'rgba(255, 255, 0, 0.8)'; // Yellow for rod rotations
      } else {
        return 'rgba(255, 255, 255, 0.3)'; // White for normal slides
      }
    }
  };
}

// ============================================================================
// UI Helper Methods
// ============================================================================

/**
 * Check if current state is the goal state (alias for isGoal)
 * @returns {boolean} True if goal state is reached
 */
IwahswapGame.prototype.checkGoal = function() {
  for (let i = 0; i < 6; i++) {
    if (this.board[i] !== goalboard[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Get list of cells with movable pieces (for highlighting in UI)
 * @returns {Array<number>} Array of cell indices (0-5) that can be moved
 */
IwahswapGame.prototype.getMovableCells = function() {
  const blankIndex = findzero(this.board);
  const movable = [];

  // Check each direction and add corresponding cell if move is valid
  if (this.checkmove(0)) movable.push(blankIndex - 1);  // Cell above blank
  if (this.checkmove(1)) movable.push(blankIndex + 1);  // Cell below blank
  if (this.checkmove(2)) movable.push(blankIndex + 2);  // Cell 2 below (jump)
  if (this.checkmove(3)) movable.push(blankIndex - 2);  // Cell 2 above (jump)

  // Filter out invalid indices (< 0 or >= 6)
  return movable.filter(i => i >= 0 && i < 6);
}

/**
 * Get the initial board state
 * @returns {Array<number>} Copy of initial board configuration
 */
IwahswapGame.prototype.getInitialBoard = function() {
  return initboard.slice();
}

/**
 * Get the goal board state
 * @returns {Array<number>} Copy of goal board configuration
 */
IwahswapGame.prototype.getGoalBoard = function() {
  return goalboard.slice();
}
