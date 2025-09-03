// Graph Node
function GraphNode(game) {
  this.game = game;
  this.hash = game.hash();
  this.edgelist = [];
  this.type = 'normal'; // 'start', 'goal', 'normal'
  
  // Physics properties
  this.x = Math.random() * 400 - 200;
  this.y = Math.random() * 400 - 200;
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
  
  // Create start node
  this.startNode = new GraphNode(initialGame.clone());
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
  
  // Explore all possible moves from this node
  for (let dir = 0; dir < 6; dir++) {
    const nextGame = node.game.move(dir);
    if (nextGame) {
      const nextHash = nextGame.hash();
      
      if (this.graph.has(nextHash)) {
        // Node already exists - just add edge if needed
        const existingNode = this.graph.get(nextHash);
        if (!node.edgelist.includes(existingNode)) {
          node.edgelist.push(existingNode);
          existingNode.edgelist.push(node);
        }
      } else {
        // Found a new node to add!
        const nextNode = new GraphNode(nextGame);
        
        // Check if goal
        if (nextGame.isGoal()) {
          nextNode.type = 'goal';
          if (!this.goalNode) {
            this.goalNode = nextNode;
            console.log('Goal found at depth:', this.visualizationQueue.length);
          }
        }
        
        // Add to graph and queues
        this.graph.set(nextHash, nextNode);
        this.queue.push(nextNode);
        this.visualizationQueue.push(nextNode);
        
        // Add edge (bidirectional)
        node.edgelist.push(nextNode);
        nextNode.edgelist.push(node);
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

Solver.prototype.addNextVisibleNode = function() {
  if (this.visualizationQueue.length === 0) {
    return false;
  }
  
  const node = this.visualizationQueue.shift();
  this.visibleGraph.set(node.hash, node);
  
  return true;
}