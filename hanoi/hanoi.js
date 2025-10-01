/**
 * HanoiGame - Tower of Hanoi puzzle game logic implementation
 *
 * The Tower of Hanoi is a classic mathematical puzzle consisting of three towers
 * and a set of disks of different sizes that can slide onto any tower.
 *
 * Rules:
 * - Only one disk can be moved at a time
 * - A disk can only be moved if it is the uppermost disk on a tower
 * - A larger disk cannot be placed on top of a smaller disk
 *
 * Goal: Move all disks from the first tower to the third tower
 *
 * State representation:
 * - board: Array of 3 towers, each tower is an array of disk sizes
 * - Disks are numbered 1 (smallest) to numDisks (largest)
 * - Each tower array is ordered bottom-to-top (first element is bottom disk)
 *
 * Move encoding:
 * - 6 possible moves (3 towers × 2 directions, excluding same-tower moves)
 * - Direction 0: Tower 0 → Tower 1
 * - Direction 1: Tower 0 → Tower 2
 * - Direction 2: Tower 1 → Tower 0
 * - Direction 3: Tower 1 → Tower 2
 * - Direction 4: Tower 2 → Tower 0
 * - Direction 5: Tower 2 → Tower 1
 */
class HanoiGame extends AbstractGame {
  /**
   * Constructor
   * Initializes the game with 6 disks and sets up the move mapping
   */
  constructor() {
    super();
    this.board = null;   // Array of 3 towers, each is an array of disks
    this.numDisks = 6;   // Number of disks in the puzzle
    // Move map: [fromTower, toTower] for each direction (0-5)
    this.moveMap = [
      [0, 1], // Direction 0: Tower 0 → Tower 1
      [0, 2], // Direction 1: Tower 0 → Tower 2
      [1, 0], // Direction 2: Tower 1 → Tower 0
      [1, 2], // Direction 3: Tower 1 → Tower 2
      [2, 0], // Direction 4: Tower 2 → Tower 0
      [2, 1]  // Direction 5: Tower 2 → Tower 1
    ];
  }

  // ============================================================================
  // Core Game Methods
  // ============================================================================

  /**
   * Initialize the game to starting state
   * Places all disks on the first tower (tower 0) in descending size order
   */
  init() {
    // Initialize with all disks on the first tower (largest at bottom)
    this.board = [[], [], []];
    for (let i = this.numDisks; i >= 1; i--) {
      this.board[0].push(i);  // Disk sizes: numDisks(largest) down to 1(smallest)
    }
  }

  /**
   * Create a deep copy of the current game state
   * @returns {HanoiGame} New game instance with copied state
   */
  clone() {
    const g = new HanoiGame();
    g.numDisks = this.numDisks;
    g.moveMap = this.moveMap; // Share the same moveMap reference (immutable)
    // Deep copy each tower's disk array
    g.board = [
      this.board[0].slice(),
      this.board[1].slice(),
      this.board[2].slice()
    ];
    return g;
  }

  /**
   * Execute a move and return the new game state
   * Moves the top disk from one tower to another if the move is valid
   *
   * @param {number} direction - Move direction (0-5) as encoded in moveMap
   * @returns {HanoiGame|null} New game state if move is valid, null otherwise
   */
  move(direction) {
    // Validate direction
    if (direction < 0 || direction >= this.moveMap.length) return null;

    // Decode direction to tower indices
    const [fromTower, toTower] = this.moveMap[direction];

    // Check if source tower has a disk to move
    if (this.board[fromTower].length === 0) return null;  // No disk to move

    // Get the top disk from source tower
    const topDisk = this.board[fromTower][this.board[fromTower].length - 1];

    // Check if move is valid (can only place smaller disk on larger disk)
    if (this.board[toTower].length > 0) {
      const targetTopDisk = this.board[toTower][this.board[toTower].length - 1];
      if (topDisk >= targetTopDisk) return null;  // Invalid: larger on smaller
    }

    // Make the move (create new state with disk moved)
    const newGame = this.clone();
    const disk = newGame.board[fromTower].pop();  // Remove from source
    newGame.board[toTower].push(disk);             // Add to destination

    return newGame;
  }

  /**
   * Check if a move is valid without executing it
   * @param {number} direction - Move direction (0-5)
   * @returns {boolean} True if move is valid, false otherwise
   */
  checkmove(direction) {
    const result = this.move(direction);
    return result !== null;
  }

  /**
   * Generate a unique hash string for this game state
   * Used for state space graph node identification
   * @returns {string} Hash string with tower states separated by '|'
   *   Format: "tower0disks|tower1disks|tower2disks"
   *   Example: "6,5,4,3,2,1||" (all disks on tower 0)
   */
  hash() {
    return this.board.map(tower => tower.join(',')).join('|');
  }

  /**
   * Check if current state matches the goal state
   * Goal: all disks on the third tower (index 2)
   * @returns {boolean} True if goal state is reached
   */
  isGoal() {
    // Goal: all disks on the third tower (index 2)
    return this.board[2].length === this.numDisks &&
           this.board[0].length === 0 &&
           this.board[1].length === 0;
  }

  // ============================================================================
  // AbstractGame Interface Implementation
  // ============================================================================

  /**
   * Get the number of possible move directions
   * @returns {number} Always 6 for Hanoi (3 towers × 2 directions)
   */
  getNumDirections() {
    return 6; // 3 towers * 2 directions (excluding same tower moves)
  }

  /**
   * Get color configuration for graph visualization
   * Hanoi uses simple black and white colors for all nodes and edges
   * @returns {Object} Color config with nodeColor and edgeColor functions
   */
  getColorConfig() {
    return {
      nodeColor: (game) => {
        return 'black';  // All nodes are black
      },
      edgeColor: (direction) => {
        return 'white';  // All edges are white
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
  checkGoal() {
    return this.isGoal();
  }

  /**
   * Get the initial board state
   * @returns {Array<Array<number>>} Copy of initial board (all disks on tower 0)
   */
  getInitialBoard() {
    const initial = new HanoiGame();
    initial.init();
    return initial.board;
  }

  /**
   * Get the goal board state
   * @returns {Array<Array<number>>} Goal board (all disks on tower 2)
   */
  getGoalBoard() {
    const goal = [[], [], []];
    for (let i = this.numDisks; i >= 1; i--) {
      goal[2].push(i);  // All disks on third tower
    }
    return goal;
  }

  /**
   * Get valid moves for the current state (for highlighting in UI)
   * @returns {Array<Object>} Array of move objects with from, to, and direction
   *   Each object: { from: towerIndex, to: towerIndex, direction: directionCode }
   */
  getValidMoves() {
    const moves = [];
    for (let dir = 0; dir < 6; dir++) {
      if (this.checkmove(dir)) {
        const [fromTower, toTower] = this.moveMap[dir];
        moves.push({ from: fromTower, to: toTower, direction: dir });
      }
    }
    return moves;
  }

  /**
   * Get the top disk of a tower (for rendering)
   * @param {number} towerIndex - Tower index (0-2)
   * @returns {number} Size of top disk (1-numDisks), or 0 if tower is empty
   */
  getTopDisk(towerIndex) {
    const tower = this.board[towerIndex];
    return tower.length > 0 ? tower[tower.length - 1] : 0;
  }

  /**
   * Get all disks on a tower from bottom to top (for rendering)
   * @param {number} towerIndex - Tower index (0-2)
   * @returns {Array<number>} Array of disk sizes (bottom to top)
   */
  getTowerDisks(towerIndex) {
    return this.board[towerIndex].slice();
  }
}
