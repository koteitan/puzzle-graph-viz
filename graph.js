// Graph visualization and physics
function GraphManager() {
  this.canvas = null;
  this.ctx = null;
  this.solver = null;
  this.physicsInterval = null;
  this.solverInterval = null;
  this.visualizationInterval = null;
  
  // View state for zoom and pan
  this.zoom = 1.0;
  this.panX = 0;
  this.panY = 0;
  this.isDragging = false;
  this.lastMouseX = 0;
  this.lastMouseY = 0;
}

GraphManager.prototype.init = function(canvas, solver) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.solver = solver;
  
  // Add event listeners for mouse interaction
  this.setupMouseEvents();
}

GraphManager.prototype.setupMouseEvents = function() {
  // Mouse wheel zoom
  this.canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5.0, this.zoom * zoomFactor));
    
    // Zoom towards mouse position
    this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
    this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;
    
    this.draw();
  });
  
  // Mouse drag pan
  this.canvas.addEventListener('mousedown', (e) => {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.canvas.style.cursor = 'grabbing';
  });
  
  this.canvas.addEventListener('mousemove', (e) => {
    if (this.isDragging) {
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;
      
      this.panX += deltaX;
      this.panY += deltaY;
      
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      
      this.draw();
    }
  });
  
  this.canvas.addEventListener('mouseup', () => {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  });
  
  this.canvas.addEventListener('mouseleave', () => {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  });
  
  // Set initial cursor
  this.canvas.style.cursor = 'grab';
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
  
  // Visualize nodes at faster speed (4 per second)
  this.visualizationInterval = setInterval(() => {
    const added = this.solver.addNextVisibleNode();
    console.log('Visible nodes:', this.solver.visibleGraph.size, '/', this.solver.graph.size);
    if (!added && !this.solverInterval) {
      clearInterval(this.visualizationInterval);
      this.visualizationInterval = null;
      console.log('Visualization complete');
    }
  }, 125);  // Add 1 visible node per 125ms (8 per second)
}

GraphManager.prototype.draw = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
  if (!this.solver || this.solver.visibleGraph.size === 0) return;
  
  // Apply zoom and pan transformation
  this.ctx.save();
  this.ctx.translate(this.panX, this.panY);
  this.ctx.scale(this.zoom, this.zoom);
  
  const centerX = this.canvas.width / 2;
  const centerY = this.canvas.height / 2;
  
  // Use fixed scale for manual control
  const scale = 1.0;
  
  // Draw edges (only for visible nodes)
  this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  this.ctx.lineWidth = 1 / this.zoom;  // Constant line width regardless of zoom
  
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
    const radius = 2.5 / this.zoom;  // Constant radius regardless of zoom
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    
    // Color based on current rod position using label2color
    const rodValue = Math.abs(rodtable[node.game.irod]);
    this.ctx.fillStyle = label2color[rodValue];
    
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1 / this.zoom;  // Constant line width regardless of zoom
    this.ctx.stroke();
  });
  
  // Draw start node as large green circle
  if (this.solver.startNode && this.solver.visibleGraph.has(this.solver.startNode.hash)) {
    const x = centerX + this.solver.startNode.x * scale;
    const y = centerY + this.solver.startNode.y * scale;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8 / this.zoom, 0, 2 * Math.PI);  // Constant radius regardless of zoom
    this.ctx.strokeStyle = 'green';
    this.ctx.lineWidth = 3 / this.zoom;  // Constant line width regardless of zoom
    this.ctx.stroke();
  }
  
  // Draw goal node as large red circle
  if (this.solver.goalNode && this.solver.visibleGraph.has(this.solver.goalNode.hash)) {
    const x = centerX + this.solver.goalNode.x * scale;
    const y = centerY + this.solver.goalNode.y * scale;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8 / this.zoom, 0, 2 * Math.PI);  // Constant radius regardless of zoom
    this.ctx.strokeStyle = 'red';
    this.ctx.lineWidth = 3 / this.zoom;  // Constant line width regardless of zoom
    this.ctx.stroke();
  }
  
  // Mark current state
  if (this.solver.currentStateNode) {
    const x = centerX + this.solver.currentStateNode.x * scale;
    const y = centerY + this.solver.currentStateNode.y * scale;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 5 / this.zoom, 0, 2 * Math.PI);  // Constant radius regardless of zoom
    this.ctx.strokeStyle = 'yellow';
    this.ctx.lineWidth = 3 / this.zoom;  // Constant line width regardless of zoom
    this.ctx.stroke();
  }
  
  // Restore canvas state
  this.ctx.restore();
}

GraphManager.prototype.updatePhysics = function() {
  if (!this.solver || this.solver.visibleGraph.size === 0) return;
  
  const nodes = Array.from(this.solver.visibleGraph.values());
  const REPULSION = 3000;  // 5x from 600 to 3000
  const ATTRACTION = 0.0025;  // Already reduced to 1/4 of original
  const DAMPING = 0.9;
  const CENTER_FORCE = 0.00125;  // Reduced to half (0.0025 -> 0.00125)
  
  // Count nodes per depth level
  const depthCounts = new Map();
  nodes.forEach(node => {
    const count = depthCounts.get(node.depth) || 0;
    depthCounts.set(node.depth, count + 1);
  });
  
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
      let force = REPULSION / (dist * dist);
      
      // Add extra repulsion for nodes at the same depth
      if (nodes[i].depth === nodes[j].depth) {
        const depthCount = depthCounts.get(nodes[i].depth) || 1;
        const depthMultiplier = Math.sqrt(depthCount) * 0.5; // Scale with sqrt of node count
        force += (REPULSION * depthMultiplier) / (dist * dist);
      }
      
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
    
    // Depth-based downward gravity (reduced to half)
    const DEPTH_GRAVITY = 0.0625; // Reduced to half (0.125 -> 0.0625)
    node.fy += node.depth * DEPTH_GRAVITY;
    
    // Update velocity
    node.vx = (node.vx + node.fx) * DAMPING;
    node.vy = (node.vy + node.fy) * DAMPING;
    
    // Apply velocity limits to prevent nodes from flying away
    const MAX_VELOCITY = 50;  // Reduced to half (100 -> 50)
    const currentSpeed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (currentSpeed > MAX_VELOCITY) {
      const scale = MAX_VELOCITY / currentSpeed;
      node.vx *= scale;
      node.vy *= scale;
    }
    
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