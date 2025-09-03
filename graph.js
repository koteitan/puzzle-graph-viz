// Graph visualization and physics
function GraphManager() {
  this.canvas = null;
  this.ctx = null;
  this.solver = null;
  this.physicsInterval = null;
  this.solverInterval = null;
  this.visualizationInterval = null;
}

GraphManager.prototype.init = function(canvas, solver) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.solver = solver;
}

GraphManager.prototype.startSolver = function(game) {
  // Clear any existing intervals
  if (this.physicsInterval) {
    clearInterval(this.physicsInterval);
    this.physicsInterval = null;
  }
  if (this.solverInterval) {
    clearInterval(this.solverInterval);
    this.solverInterval = null;
  }
  if (this.visualizationInterval) {
    clearInterval(this.visualizationInterval);
    this.visualizationInterval = null;
  }
  
  // Create new solver instance to ensure clean state
  this.solver = new Solver();
  
  // Initialize solver with current game state
  this.solver.init(game);
  
  console.log('Starting solver from state:', game.hash());
  
  // Start physics simulation
  this.physicsInterval = setInterval(() => this.updatePhysics(), 50);
  
  // Run solver fast (explore all states quickly)
  this.solverInterval = setInterval(() => {
    const steps = this.solver.run(100);  // Run many steps at once
    console.log('Solver explored:', this.solver.graph.size, 'total nodes, queue:', this.solver.queue.length, 'visualization queue:', this.solver.visualizationQueue.length);
    if (steps === 0) {
      clearInterval(this.solverInterval);
      this.solverInterval = null;
      console.log('Solver finished exploring. Total nodes:', this.solver.graph.size);
    }
  }, 100);  // Run solver every 100ms
  
  // Visualize nodes faster (10 per second)
  this.visualizationInterval = setInterval(() => {
    const added = this.solver.addNextVisibleNode();
    console.log('Visible nodes:', this.solver.visibleGraph.size, '/', this.solver.graph.size);
    if (!added && !this.solverInterval) {
      clearInterval(this.visualizationInterval);
      this.visualizationInterval = null;
      console.log('Visualization complete');
    }
  }, 100);  // Add 1 visible node per 100ms (10 per second)
}

GraphManager.prototype.draw = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
  if (!this.solver || this.solver.visibleGraph.size === 0) return;
  
  const centerX = this.canvas.width / 2;
  const centerY = this.canvas.height / 2;
  
  // Calculate the furthest node from center (0,0)
  let maxDistance = 1; // Minimum distance to avoid division by zero
  this.solver.visibleGraph.forEach(node => {
    const dist = Math.sqrt(node.x * node.x + node.y * node.y);
    if (dist > maxDistance) {
      maxDistance = dist;
    }
  });
  
  // Scale so the furthest node is at half canvas size (with some padding)
  const padding = 20; // Padding from canvas edge
  const targetRadius = Math.min(this.canvas.width / 2 - padding, this.canvas.height / 2 - padding);
  const scale = targetRadius / maxDistance;
  
  // Draw edges (only for visible nodes)
  this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  this.ctx.lineWidth = 1;
  
  this.solver.visibleGraph.forEach(node => {
    node.edgelist.forEach(neighbor => {
      // Only draw edge if neighbor is also visible
      if (this.solver.visibleGraph.has(neighbor.hash)) {
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + node.x * scale, centerY + node.y * scale);
        this.ctx.lineTo(centerX + neighbor.x * scale, centerY + neighbor.y * scale);
        this.ctx.stroke();
      }
    });
  });
  
  // Draw nodes
  this.solver.visibleGraph.forEach(node => {
    const x = centerX + node.x * scale;
    const y = centerY + node.y * scale;
    const radius = 5;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    
    // Color based on node type
    if (node.type === 'start') {
      this.ctx.fillStyle = 'green';
    } else if (node.type === 'goal') {
      this.ctx.fillStyle = 'red';
    } else {
      this.ctx.fillStyle = 'white';
    }
    
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  });
  
  // Mark current state
  if (this.solver.currentStateNode) {
    const x = centerX + this.solver.currentStateNode.x * scale;
    const y = centerY + this.solver.currentStateNode.y * scale;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 10, 0, 2 * Math.PI);
    this.ctx.strokeStyle = 'yellow';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
  }
}

GraphManager.prototype.updatePhysics = function() {
  if (!this.solver || this.solver.visibleGraph.size === 0) return;
  
  const nodes = Array.from(this.solver.visibleGraph.values());
  const REPULSION = 50;
  const ATTRACTION = 0.0025;  // Reduced to 1/4 of original (0.01 -> 0.0025)
  const DAMPING = 0.9;
  const CENTER_FORCE = 0.01;
  
  // Reset forces
  nodes.forEach(node => {
    node.fx = 0;
    node.fy = 0;
  });
  
  // Calculate repulsion forces
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
      const force = REPULSION / (dist * dist);
      
      nodes[i].fx -= force * dx / dist;
      nodes[i].fy -= force * dy / dist;
      nodes[j].fx += force * dx / dist;
      nodes[j].fy += force * dy / dist;
    }
  }
  
  // Calculate attraction forces (edges)
  nodes.forEach(node => {
    node.edgelist.forEach(neighbor => {
      const dx = neighbor.x - node.x;
      const dy = neighbor.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      node.fx += ATTRACTION * dx;
      node.fy += ATTRACTION * dy;
    });
  });
  
  // Calculate center of mass
  let cx = 0, cy = 0;
  nodes.forEach(node => {
    cx += node.x;
    cy += node.y;
  });
  cx /= nodes.length;
  cy /= nodes.length;
  
  // Apply forces and center attraction
  nodes.forEach(node => {
    // Center force
    node.fx -= (node.x - 0 + cx) * CENTER_FORCE;
    node.fy -= (node.y - 0 + cy) * CENTER_FORCE;
    
    // Update velocity
    node.vx = (node.vx + node.fx) * DAMPING;
    node.vy = (node.vy + node.fy) * DAMPING;
    
    // Update position
    node.x += node.vx;
    node.y += node.vy;
  });
  
  this.draw();
}

GraphManager.prototype.updateCurrentState = function(game) {
  if (this.solver && this.solver.graph.size > 0) {
    this.solver.updateCurrentState(game);
    this.draw();
  }
}