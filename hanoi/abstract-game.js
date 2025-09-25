// Abstract base class for puzzle games
class AbstractGame {
  constructor() {
    if (this.constructor === AbstractGame) {
      throw new Error("Abstract class AbstractGame cannot be instantiated directly");
    }
  }

  // Abstract methods that must be implemented by subclasses

  // Initialize the game to its starting state
  init() {
    throw new Error("init() must be implemented by subclass");
  }

  // Clone the current game state
  clone() {
    throw new Error("clone() must be implemented by subclass");
  }

  // Attempt to make a move in the given direction
  // Returns new game state if move is valid, null/0 otherwise
  move(direction) {
    throw new Error("move() must be implemented by subclass");
  }

  // Check if a move in the given direction is valid
  // Returns boolean
  checkmove(direction) {
    throw new Error("checkmove() must be implemented by subclass");
  }

  // Generate a unique hash string for the current state
  hash() {
    throw new Error("hash() must be implemented by subclass");
  }

  // Check if the current state is a goal state
  isGoal() {
    throw new Error("isGoal() must be implemented by subclass");
  }

  // Get the number of possible move directions
  getNumDirections() {
    throw new Error("getNumDirections() must be implemented by subclass");
  }

  // Get color configuration for visualization
  // Returns an object with color mapping functions
  getColorConfig() {
    return {
      // Default implementation - can be overridden
      nodeColor: (game) => '#ffffff',
      edgeColor: (direction) => 'rgba(255, 255, 255, 0.3)'
    };
  }
}