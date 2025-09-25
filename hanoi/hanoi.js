// HanoiGame - Hanoi Tower puzzle implementation
class HanoiGame extends AbstractGame {
  constructor() {
    super();
    this.towers = null;  // Array of 3 towers, each is an array of disks
    this.numDisks = 6;   // Number of disks
    this.moveMap = [
      [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1]
    ];
  }

  init() {
    // Initialize with all disks on the first tower (largest at bottom)
    this.towers = [[], [], []];
    for (let i = this.numDisks; i >= 1; i--) {
      this.towers[0].push(i);  // Disk sizes: 1(smallest) to 5(largest)
    }
  }

  clone() {
    const g = new HanoiGame();
    g.numDisks = this.numDisks;
    g.moveMap = this.moveMap; // Share the same moveMap reference
    g.towers = [
      this.towers[0].slice(),
      this.towers[1].slice(),
      this.towers[2].slice()
    ];
    return g;
  }

  move(direction) {
    // Direction encoding: 0: 0→1, 1: 0→2, 2: 1→0, 3: 1→2, 4: 2→0, 5: 2→1
    if (direction < 0 || direction >= this.moveMap.length) return null;

    const [fromTower, toTower] = this.moveMap[direction];

    if (this.towers[fromTower].length === 0) return null;  // No disk to move

    const topDisk = this.towers[fromTower][this.towers[fromTower].length - 1];

    // Check if move is valid (can only place smaller disk on larger disk)
    if (this.towers[toTower].length > 0) {
      const targetTopDisk = this.towers[toTower][this.towers[toTower].length - 1];
      if (topDisk >= targetTopDisk) return null;  // Invalid move
    }

    // Make the move
    const newGame = this.clone();
    const disk = newGame.towers[fromTower].pop();
    newGame.towers[toTower].push(disk);

    return newGame;
  }

  checkmove(direction) {
    const result = this.move(direction);
    return result !== null;
  }

  hash() {
    return this.towers.map(tower => tower.join(',')).join('|');
  }

  isGoal() {
    // Goal: all disks on the third tower (index 2)
    return this.towers[2].length === this.numDisks &&
           this.towers[0].length === 0 &&
           this.towers[1].length === 0;
  }

  getNumDirections() {
    return 6; // 3 towers * 2 directions (excluding same tower moves)
  }

  getColorConfig() {
    return {
      nodeColor: (game) => {
        // Color based on how many disks are on the goal tower
        const progress = game.towers[2].length;
        const hue = (progress / this.numDisks) * 120; // Green when complete
        return `hsl(${hue}, 70%, 50%)`;
      },
      edgeColor: (direction) => {
        if (direction < 0 || direction >= this.moveMap.length) return 'rgba(128, 128, 128, 0.6)';

        const [fromTower, toTower] = this.moveMap[direction];

        // Color code by source tower
        const colors = ['rgba(255, 100, 100, 0.6)', 'rgba(100, 255, 100, 0.6)', 'rgba(100, 100, 255, 0.6)'];
        return colors[fromTower];
      }
    };
  }

  // Additional methods for UI
  checkGoal() {
    return this.isGoal();
  }

  getInitialBoard() {
    const initial = new HanoiGame();
    initial.init();
    return initial.towers;
  }

  getGoalBoard() {
    const goal = [[], [], []];
    for (let i = this.numDisks; i >= 1; i--) {
      goal[2].push(i);
    }
    return goal;
  }

  // Get valid moves for highlighting
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

  // Get the top disk of a tower (for rendering)
  getTopDisk(towerIndex) {
    const tower = this.towers[towerIndex];
    return tower.length > 0 ? tower[tower.length - 1] : 0;
  }

  // Get all disks on a tower from bottom to top
  getTowerDisks(towerIndex) {
    return this.towers[towerIndex].slice();
  }
}