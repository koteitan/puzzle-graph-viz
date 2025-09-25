// Graph visualization and physics
function GraphManager() {
  this.canvas = null;
  this.ctx = null;
  this.solver = null;
  this.physicsInterval = null;
  this.solverInterval = null;
  this.visualizationInterval = null;
  this.colorConfig = null; // Color configuration from game
  
  // View state for zoom and pan
  this.zoom = 0.1;  // Changed initial zoom to 0.1
  this.panX = 0;  // Camera centered at (0,0)
  this.panY = 0;  // Camera centered at (0,0)
  this.isDragging = false;
  this.lastMouseX = 0;
  this.lastMouseY = 0;
  
  // Touch/mobile state
  this.touches = [];
  this.lastTouchDistance = 0;
  this.lastTouchCenterX = 0;
  this.lastTouchCenterY = 0;
  
  // Mode state
  this.mode = 'normal'; // 'normal', 'jump', or 'drag'
  this.draggedNode = null;
  this.jumpCallback = null;
  
  // Jump mode state
  this.jumpStartX = 0;
  this.jumpStartY = 0;
  this.hasMovedSincePress = false;
  
  // Shortest path for solver mode
  this.shortestPath = [];
}

GraphManager.prototype.init = function(canvas, solver, colorConfig) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.solver = solver;
  this.colorConfig = colorConfig || { nodeColor: () => '#ffffff', edgeColor: () => 'rgba(255, 255, 255, 0.3)' };
  
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
    const newZoom = Math.max(0.02, Math.min(5.0, this.zoom * zoomFactor));
    
    // Convert mouse position to world coordinates before zoom
    const worldX = (mouseX - this.canvas.width / 2 - this.panX) / this.zoom;
    const worldY = (mouseY - this.canvas.height / 2 - this.panY) / this.zoom;
    
    // Update zoom
    this.zoom = newZoom;
    
    // Convert world coordinates back to screen coordinates and adjust pan
    this.panX = mouseX - this.canvas.width / 2 - worldX * this.zoom;
    this.panY = mouseY - this.canvas.height / 2 - worldY * this.zoom;
    
    this.draw();
  });
  
  // Mouse drag pan
  this.canvas.addEventListener('mousedown', (e) => {
    const rect = this.canvas.getBoundingClientRect();
    // Scale coordinates from display size to canvas internal size
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    if (this.mode === 'jump') {
      // Jump mode - prepare for potential jump, but allow dragging
      this.jumpStartX = mouseX;
      this.jumpStartY = mouseY;
      this.hasMovedSincePress = false;
      this.isDragging = true;
    } else if (this.mode === 'drag') {
      // Drag mode - find node to drag
      const nearestNode = this.findNearestNode(mouseX, mouseY);
      if (nearestNode) {
        this.draggedNode = nearestNode;
        this.isDragging = true;
      }
    } else {
      // Normal mode - pan the canvas
      this.isDragging = true;
      this.canvas.style.cursor = 'grabbing';
    }
    
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  });
  
  this.canvas.addEventListener('mousemove', (e) => {
    if (this.isDragging) {
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;
      
      // Check if we've moved significantly (for jump mode)
      if (this.mode === 'jump' && !this.hasMovedSincePress) {
        const totalMovement = Math.abs(deltaX) + Math.abs(deltaY);
        if (totalMovement > 3) { // 3px threshold
          this.hasMovedSincePress = true;
        }
      }
      
      if (this.mode === 'drag' && this.draggedNode) {
        // Move the dragged node
        this.draggedNode.x += deltaX / this.zoom;
        this.draggedNode.y += deltaY / this.zoom;
        this.draggedNode.vx = 0; // Reset velocity
        this.draggedNode.vy = 0;
      } else {
        // Pan the view (works in normal mode, jump mode when dragging, etc.)
        this.panX += deltaX;
        this.panY += deltaY;
      }
      
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      
      this.draw();
    }
  });
  
  this.canvas.addEventListener('mouseup', (e) => {
    // Handle jump mode on mouse release
    if (this.mode === 'jump' && !this.hasMovedSincePress && this.jumpCallback) {
      // Only jump if we haven't dragged significantly
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      
      const nearestNode = this.findNearestNode(mouseX, mouseY);
      if (nearestNode) {
        this.jumpCallback(nearestNode.game);
      }
    }
    
    this.isDragging = false;
    this.draggedNode = null;
    this.hasMovedSincePress = false;
    
    // Set cursor based on mode
    if (this.mode === 'jump') {
      this.canvas.style.cursor = 'crosshair';
    } else if (this.mode === 'drag') {
      this.canvas.style.cursor = 'move';
    } else {
      this.canvas.style.cursor = 'grab';
    }
  });
  
  this.canvas.addEventListener('mouseleave', () => {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  });
  
  // Set initial cursor
  this.canvas.style.cursor = 'grab';
  
  // Add touch events for mobile
  this.setupTouchEvents();
}

GraphManager.prototype.setupTouchEvents = function() {
  // Touch start
  this.canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    this.touches = Array.from(e.touches);
    
    if (this.touches.length === 1) {
      // Single touch - handle based on mode
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const touchX = (this.touches[0].clientX - rect.left) * scaleX;
      const touchY = (this.touches[0].clientY - rect.top) * scaleY;
      
      if (this.mode === 'jump') {
        // Jump mode - prepare for potential jump, but allow dragging
        this.jumpStartX = touchX;
        this.jumpStartY = touchY;
        this.hasMovedSincePress = false;
        this.isDragging = true;
      } else if (this.mode === 'drag') {
        // Drag mode - find node to drag
        const nearestNode = this.findNearestNode(touchX, touchY);
        if (nearestNode) {
          this.draggedNode = nearestNode;
          this.isDragging = true;
        } else {
          // No node found, fall back to pan
          this.isDragging = true;
        }
      } else {
        // Normal mode - pan
        this.isDragging = true;
      }
      
      this.lastMouseX = this.touches[0].clientX;
      this.lastMouseY = this.touches[0].clientY;
    } else if (this.touches.length === 2) {
      // Two touches - start pinch zoom and prepare for two-finger pan
      this.isDragging = false;
      const dx = this.touches[1].clientX - this.touches[0].clientX;
      const dy = this.touches[1].clientY - this.touches[0].clientY;
      this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Store initial center position for two-finger panning
      this.lastTouchCenterX = (this.touches[0].clientX + this.touches[1].clientX) / 2;
      this.lastTouchCenterY = (this.touches[0].clientY + this.touches[1].clientY) / 2;
    }
  }, { passive: false });
  
  // Touch move
  this.canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    this.touches = Array.from(e.touches);
    
    if (this.touches.length === 1 && this.isDragging) {
      // Single finger operation
      const deltaX = this.touches[0].clientX - this.lastMouseX;
      const deltaY = this.touches[0].clientY - this.lastMouseY;
      
      // Check if we've moved significantly (for jump mode)
      if (this.mode === 'jump' && !this.hasMovedSincePress) {
        const totalMovement = Math.abs(deltaX) + Math.abs(deltaY);
        if (totalMovement > 5) { // Slightly higher threshold for touch
          this.hasMovedSincePress = true;
        }
      }
      
      if (this.mode === 'drag' && this.draggedNode) {
        // Move the dragged node
        this.draggedNode.x += deltaX / this.zoom;
        this.draggedNode.y += deltaY / this.zoom;
        this.draggedNode.vx = 0; // Reset velocity
        this.draggedNode.vy = 0;
      } else {
        // Pan the view (works in normal mode, jump mode when dragging, etc.)
        this.panX += deltaX;
        this.panY += deltaY;
      }
      
      this.lastMouseX = this.touches[0].clientX;
      this.lastMouseY = this.touches[0].clientY;
      
      this.draw();
    } else if (this.touches.length === 2) {
      // Two-finger operations: pinch zoom and pan
      const dx = this.touches[1].clientX - this.touches[0].clientX;
      const dy = this.touches[1].clientY - this.touches[0].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const currentCenterX = (this.touches[0].clientX + this.touches[1].clientX) / 2;
      const currentCenterY = (this.touches[0].clientY + this.touches[1].clientY) / 2;
      
      if (this.lastTouchDistance > 0) {
        const rect = this.canvas.getBoundingClientRect();
        const centerX = currentCenterX - rect.left;
        const centerY = currentCenterY - rect.top;
        
        // Handle pinch zoom
        const zoomFactor = distance / this.lastTouchDistance;
        const newZoom = Math.max(0.02, Math.min(5.0, this.zoom * zoomFactor));
        
        // Convert touch center to world coordinates before zoom
        const worldX = (centerX - this.canvas.width / 2 - this.panX) / this.zoom;
        const worldY = (centerY - this.canvas.height / 2 - this.panY) / this.zoom;
        
        // Update zoom
        this.zoom = newZoom;
        
        // Convert world coordinates back to screen coordinates and adjust pan
        this.panX = centerX - this.canvas.width / 2 - worldX * this.zoom;
        this.panY = centerY - this.canvas.height / 2 - worldY * this.zoom;
        
        // Handle two-finger panning
        if (this.lastTouchCenterX !== 0 && this.lastTouchCenterY !== 0) {
          const centerDeltaX = currentCenterX - this.lastTouchCenterX;
          const centerDeltaY = currentCenterY - this.lastTouchCenterY;
          
          // Add panning movement
          this.panX += centerDeltaX;
          this.panY += centerDeltaY;
        }
        
        this.draw();
      }
      
      this.lastTouchDistance = distance;
      this.lastTouchCenterX = currentCenterX;
      this.lastTouchCenterY = currentCenterY;
    }
  }, { passive: false });
  
  // Touch end
  this.canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    // Handle jump mode on touch end
    if (this.touches.length === 1 && this.mode === 'jump' && !this.hasMovedSincePress && this.jumpCallback) {
      // Only jump if we haven't dragged significantly
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const touchX = (this.touches[0].clientX - rect.left) * scaleX;
      const touchY = (this.touches[0].clientY - rect.top) * scaleY;
      
      const nearestNode = this.findNearestNode(touchX, touchY);
      if (nearestNode) {
        this.jumpCallback(nearestNode.game);
      }
    }
    
    this.touches = Array.from(e.touches);
    
    if (this.touches.length === 0) {
      // All touches ended
      this.isDragging = false;
      this.draggedNode = null;
      this.hasMovedSincePress = false;
      this.lastTouchDistance = 0;
      this.lastTouchCenterX = 0;
      this.lastTouchCenterY = 0;
    } else if (this.touches.length === 1) {
      // Switch from pinch to pan
      this.isDragging = true;
      this.lastMouseX = this.touches[0].clientX;
      this.lastMouseY = this.touches[0].clientY;
      this.lastTouchDistance = 0;
      this.lastTouchCenterX = 0;
      this.lastTouchCenterY = 0;
    }
  }, { passive: false });
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
    // console.log('Solver explored:', this.solver.graph.size, 'total nodes, queue:', this.solver.queue.length, 'visualization queue:', this.solver.visualizationQueue.length);
    if (steps === 0) {
      clearInterval(this.solverInterval);
      this.solverInterval = null;
      console.log('Solver finished exploring. Total nodes:', this.solver.graph.size);
      
      // Calculate goal counts after exploration is complete
      this.solver.calculateGoalCounts();
      
      // Calculate shortest path using goal counts
      this.calculateShortestPath();
      this.draw();
    }
  }, 100);  // Run solver every 100ms
  
  // Visualize nodes at faster speed
  this.visualizationInterval = setInterval(() => {
    const added = this.solver.addNextVisibleNodes(nodesPerVisualizationCycle);
    // console.log('Visible nodes:', this.solver.visibleGraph.size, '/', this.solver.graph.size);
    if (!added && !this.solverInterval) {
      clearInterval(this.visualizationInterval);
      this.visualizationInterval = null;
      console.log('Visualization complete');
    }
  }, 5);  // Add multiple nodes per 5ms
}

GraphManager.prototype.draw = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
  if (!this.solver || this.solver.visibleGraph.size === 0) return;
  
  // Apply transformation: center -> pan -> zoom
  this.ctx.save();
  this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);  // Move origin to screen center
  this.ctx.translate(this.panX, this.panY);  // Apply pan offset
  this.ctx.scale(this.zoom, this.zoom);  // Apply zoom
  
  const centerX = 0;  // Now (0,0) in graph coordinates is at screen center
  const centerY = 0;
  
  // Use fixed scale for manual control
  const scale = 1.0;
  
  // Draw edges (only for visible nodes)
  this.ctx.lineWidth = 1 / this.zoom;  // Constant line width regardless of zoom

  this.solver.visibleGraph.forEach(node => {
    node.edgelist.forEach(neighbor => {
      // Only draw edge if neighbor is also visible
      if (this.solver.visibleGraph.has(neighbor.hash)) {
        // Get the direction of this edge
        const dir = node.edgedirs[neighbor.hash];

        // Set color based on direction using color config
        this.ctx.strokeStyle = this.colorConfig.edgeColor(dir);

        this.ctx.beginPath();
        this.ctx.moveTo(centerX + node.x * scale, centerY + node.y * scale);
        this.ctx.lineTo(centerX + neighbor.x * scale, centerY + neighbor.y * scale);
        this.ctx.stroke();
      }
    });
  });
  
  // Draw shortest path in bright green if solver mode is active
  if (this.shortestPath && this.shortestPath.length > 1) {
    this.ctx.strokeStyle = '#00FF00';  // Bright green
    this.ctx.lineWidth = 1.5 / this.zoom;  // Thinner line for path

    for (let i = 0; i < this.shortestPath.length - 1; i++) {
      const node = this.shortestPath[i];
      const nextNode = this.shortestPath[i + 1];

      // Only draw if both nodes are visible
      if (this.solver.visibleGraph.has(node.hash) && this.solver.visibleGraph.has(nextNode.hash)) {
        // Calculate the vector from node to nextNode
        const dx = nextNode.x - node.x;
        const dy = nextNode.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Calculate perpendicular vector for offset
        const perpX = -dy / dist * 2 / this.zoom;  // Perpendicular x component
        const perpY = dx / dist * 2 / this.zoom;   // Perpendicular y component

        // Draw first green line (offset to one side)
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + (node.x + perpX) * scale, centerY + (node.y + perpY) * scale);
        this.ctx.lineTo(centerX + (nextNode.x + perpX) * scale, centerY + (nextNode.y + perpY) * scale);
        this.ctx.stroke();

        // Draw second green line (offset to the other side)
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + (node.x - perpX) * scale, centerY + (node.y - perpY) * scale);
        this.ctx.lineTo(centerX + (nextNode.x - perpX) * scale, centerY + (nextNode.y - perpY) * scale);
        this.ctx.stroke();
      }
    }
  }
  
  // Draw nodes
  this.solver.visibleGraph.forEach(node => {
    const x = centerX + node.x * scale;
    const y = centerY + node.y * scale;
    const radius = 2.5 / this.zoom;  // Constant radius regardless of zoom
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    
    // Color based on game state using color config
    this.ctx.fillStyle = this.colorConfig.nodeColor(node.game);
    
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1 / this.zoom;  // Constant line width regardless of zoom
    this.ctx.stroke();
    
    // Draw goal count text if available and display is enabled
    if (display_goal_count == 1 && node.goalcount >= 0) {
      this.ctx.fillStyle = 'white';
      this.ctx.font = `${12 / this.zoom}px Arial`;  // Scale font with zoom
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(node.goalcount.toString(), x, y);
    }
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

GraphManager.prototype.setMode = function(mode) {
  this.mode = mode;
  this.draggedNode = null;
  
  // Update cursor style based on mode
  if (mode === 'jump') {
    this.canvas.style.cursor = 'crosshair';
  } else if (mode === 'drag') {
    this.canvas.style.cursor = 'move';
  } else {
    this.canvas.style.cursor = 'grab';
  }
}

GraphManager.prototype.setJumpCallback = function(callback) {
  this.jumpCallback = callback;
}

GraphManager.prototype.calculateShortestPath = function() {
  if (!this.solver || !this.solver.goalNode || !this.solver.startNode) {
    this.shortestPath = [];
    return;
  }
  
  // Forward search from start to goal using goal count
  const path = [];
  let currentNode = this.solver.startNode;
  path.push(currentNode);
  
  // Follow the path with minimum goal count until reaching goal
  while (currentNode !== this.solver.goalNode) {
    let nextNode = null;
    let minGoalCount = Infinity;
    
    // Find neighbor with minimum goal count
    for (const neighbor of currentNode.edgelist) {
      //const b0 = currentNode.game.board;
      //const b1 = neighbor.game.board;
      //if(b0[0]==0 && b0[1]==2 && b0[2]==3 && b0[3]==1 && b0[4]==4 && b0[5]==5 && rodtable[currentNode.game.irod]==1 &&
        //b1[0]==0 && b1[1]==2 && b1[2]==3 && b1[3]==1 && b1[4]==4 && b1[5]==5 && rodtable[neighbor.game.irod]==-2) {
        //console.log("edge found");
      //}
      //if(b1[0]==0 && b1[1]==2 && b1[2]==3 && b1[3]==1 && b1[4]==4 && b1[5]==5 && rodtable[neighbor.game.irod]==1 &&
        //b0[0]==0 && b0[1]==2 && b0[2]==3 && b0[3]==1 && b0[4]==4 && b0[5]==5 && rodtable[currentNode.game.irod]==-2) {
        //console.log("edge found");
      //}

      if (neighbor.goalcount >= 0 && neighbor.goalcount < minGoalCount) {
        minGoalCount = neighbor.goalcount;
        nextNode = neighbor;
      }
    }
    
    if (!nextNode) {
      // No path found (shouldn't happen if goal counts are properly calculated)
      console.error('No path found from start to goal using goal counts');
      this.shortestPath = [];
      return;
    }
    
    path.push(nextNode);
    currentNode = nextNode;
  }
  
  // Path is already in correct order (start to goal)
  this.shortestPath = path;
  console.log('Shortest path calculated using goal counts, length:', this.shortestPath.length);
}

GraphManager.prototype.clearShortestPath = function() {
  this.shortestPath = [];
}

GraphManager.prototype.findNearestNode = function(mouseX, mouseY) {
  if (!this.solver || this.solver.visibleGraph.size === 0) return null;
  
  // Convert mouse coordinates to world coordinates
  // Must match the transformation used in draw()
  const scale = 1.0; // Same scale used in draw()
  
  // In draw(), we do: translate(width/2, height/2) -> translate(panX, panY) -> scale(zoom, zoom)
  // So to reverse: (mouse - center - pan) / zoom
  const worldX = (mouseX - this.canvas.width / 2 - this.panX) / this.zoom;
  const worldY = (mouseY - this.canvas.height / 2 - this.panY) / this.zoom;
  
  let nearestNode = null;
  let minDistance = Infinity;
  
  this.solver.visibleGraph.forEach(node => {
    // In draw(), nodes are drawn at: centerX + node.x * scale = 0 + node.x * 1.0 = node.x
    const nodeScreenX = node.x * scale;
    const nodeScreenY = node.y * scale;
    
    const dx = nodeScreenX - worldX;
    const dy = nodeScreenY - worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestNode = node;
    }
  });
  
  // Always return the nearest node, no matter how far
  return nearestNode;
}
