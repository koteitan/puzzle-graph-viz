// Graph Node
function GraphNode(game, depth = 0) {
  this.game = game;
  this.hash = game.hash();
  this.edgelist = [];
  this.edgedirs = {}; // Map from neighbor hash to move direction
  this.type = 'normal'; // 'start', 'goal', 'normal'
  this.depth = depth; // Distance from start node
  this.goalcount = -1; // Distance to goal node (-1 means not calculated yet)
  this.edgefrom = null; // Hash of the parent node in BFS tree
  
  // Physics properties - position will be set when added to visible graph
  this.x = 0;
  this.y = 0;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
}

// Solver
function Solver() {
  this.graph = new Map(); // hash -> GraphNode
  this.queue = [];
  this.running = false;
  this.startNode = null;
  this.goalNode = null;
  this.currentStateNode = null;
  this.goalPathCalculated = false; // Flag to ensure path is calculated only once
  
  // For visualization
  this.visibleGraph = new Map(); // Nodes currently visible
  this.visualizationQueue = []; // Queue of nodes to visualize
}

Solver.prototype.init = function(initialGame) {
  this.graph.clear();
  this.visibleGraph.clear();
  this.queue = [];
  this.visualizationQueue = [];
  this.running = false;
  
  // Create start node with depth 0
  this.startNode = new GraphNode(initialGame.clone(), 0);
  this.startNode.type = 'start';
  this.graph.set(this.startNode.hash, this.startNode);
  this.queue.push(this.startNode);
  
  // Add start node to visualization queue
  this.visualizationQueue.push(this.startNode);
  
  // Set current state
  this.currentStateNode = this.startNode;
}

Solver.prototype.step = function() {
  if (!this.running || this.queue.length === 0) {
    this.running = false;
    return false;
  }

  const node = this.queue.shift();

  // Get number of directions from the game
  const numDirections = node.game.getNumDirections();

  // Explore all possible moves from this node
  for (let dir = 0; dir < numDirections; dir++) {
    const nextGame = node.game.move(dir);
    if (nextGame) {
      const nextHash = nextGame.hash();
      if (this.graph.has(nextHash)) {
        // Node already exists - just add edge if needed
        const existingNode = this.graph.get(nextHash);
        if (!node.edgelist.includes(existingNode)) {
          node.edgelist.push(existingNode);
          existingNode.edgelist.push(node);
          // Store the direction of the move
          node.edgedirs[nextHash] = dir;
          existingNode.edgedirs[node.hash] = dir;
        }
      } else {
        // Found a new node to add! Set depth as current node's depth + 1
        const nextNode = new GraphNode(nextGame, node.depth + 1);
        nextNode.edgefrom = node.hash; // Store parent node hash for backtracking
        
        // Check if goal
        if (nextGame.isGoal()) {
          nextNode.type = 'goal';
          if (!this.goalNode) {
            this.goalNode = nextNode;
            console.log('Goal found at depth:', nextNode.depth);
          }
        }
        
        // Add to graph and queues
        this.graph.set(nextHash, nextNode);
        this.queue.push(nextNode);
        this.visualizationQueue.push(nextNode);
        
        // Add edge (bidirectional)
        node.edgelist.push(nextNode);
        nextNode.edgelist.push(node);
        // Store the direction of the move
        node.edgedirs[nextHash] = dir;
        nextNode.edgedirs[node.hash] = dir;
        
      }
    }
  }
  
  return true;
}

Solver.prototype.run = function(steps = 100) {
  this.running = true;
  let count = 0;
  
  while (this.running && count < steps && this.step()) {
    count++;
  }
  
  return count;
}

Solver.prototype.updateCurrentState = function(game) {
  const hash = game.hash();
  if (this.visibleGraph.has(hash)) {
    this.currentStateNode = this.visibleGraph.get(hash);
  } else if (this.graph.has(hash)) {
    this.currentStateNode = this.graph.get(hash);
  } else {
    this.currentStateNode = null;
  }
}

Solver.prototype.addNextVisibleNodes = function(count = 1) {
  let addedCount = 0;
  
  for (let i = 0; i < count; i++) {
    if (this.visualizationQueue.length === 0) {
      break;
    }
    
    const node = this.visualizationQueue.shift();
    
    // Set spawn position: below the lowest visible node
    if (this.visibleGraph.size === 0) {
      // First node (start node) - place at center
      node.x = 0;
      node.y = 0;
    } else {
      // Find lowest existing node
      let minY = 0;
      this.visibleGraph.forEach(existingNode => {
        if (existingNode.y > minY) {
          minY = existingNode.y;
        }
      });
      
      // Spawn below the lowest node with random horizontal position
      node.x = Math.random() * 400 - 200;
      node.y = minY + 10;
    }
    
    this.visibleGraph.set(node.hash, node);
    addedCount++;
  }
  
  return addedCount > 0;
}

// Keep the old method for backward compatibility
Solver.prototype.addNextVisibleNode = function() {
  return this.addNextVisibleNodes(1);
}

Solver.prototype.calculateGoalCounts = function() {
  if (!this.goalNode) {
    console.log('No goal node found, cannot calculate goal counts');
    return;
  }
  
  // Initialize all nodes with goalcount = -1 (not calculated)
  this.graph.forEach(node => {
    node.goalcount = -1;
  });
  
  // BFS from goal node to calculate distance to all reachable nodes
  const queue = [this.goalNode];
  this.goalNode.goalcount = 0;
  
  while (queue.length > 0) {
    const node = queue.shift();
    
    // Process all neighbors
    for (const neighbor of node.edgelist) {
      // If neighbor hasn't been visited yet
      if (neighbor.goalcount === -1) {
        neighbor.goalcount = node.goalcount + 1;
        queue.push(neighbor);
      }
    }
  }
  
  console.log('Goal counts calculated for all nodes');
  
  // Trigger redraw to show goal counts
  if (graphManager) {
    graphManager.draw();
  }
}

Solver.prototype.backtrack_edgefrom = function(targetHash) {
  // Trace back from the given hash to the start using edgefrom
  const path = [];
  let currentHash = targetHash;
  
  while (currentHash) {
    const node = this.graph.get(currentHash);
    if (!node) {
      console.log('Node not found for hash:', currentHash);
      break;
    }
    
    path.push(currentHash);
    currentHash = node.edgefrom;
  }
  
  console.log('Backtrack path from', targetHash, ':');
  path.forEach((hash, index) => {
    console.log(`  ${index}: ${hash}`);
  });
  
  return path;
}
