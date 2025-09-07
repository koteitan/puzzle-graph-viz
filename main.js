// Global variables
let game;
let canvas;
let ctx;
let history = [];
let graphManager = null;
let debugTextarea = null;
let jumpMode = false;
let dragMode = false;
let solverMode = false;
let display_goal_count = 0;

// Debug logging function
function debugLog(message) {
    if (debugTextarea) {
        debugTextarea.value += new Date().toLocaleTimeString() + ': ' + message + '\n';
        debugTextarea.scrollTop = debugTextarea.scrollHeight;
    }
    console.log(message);
}

// Drawing parameters
const CELL_PADDING = 10;  // Reset to original padding
const BOARD_WIDTH_RATIO = 1/3;  // 1/3 of canvas width for pieces
const ROD_DIAMETER_RATIO = 2/3;  // 2/3 of canvas width for rod diameter

// Initialize on load
window.addEventListener('load', () => {
    canvas = document.getElementById('board');
    ctx = canvas.getContext('2d');
    debugTextarea = document.getElementById('debugout');
    
    game = new Game();
    game.init();
    
    // Initialize graph manager
    graphManager = new GraphManager();
    graphManager.init(document.getElementById('graph'), new Solver());
    
    // Set jump callback to handle jumping to nodes
    graphManager.setJumpCallback((gameState) => {
        // Save current state for undo
        history.push(game.clone());
        
        // Jump to the selected node's game state
        game = gameState.clone();
        
        // Update display
        draw();
        checkGoal();
        
        // Update graph visualization
        if (graphManager) {
            graphManager.updateCurrentState(game);
        }
    });
    
    resizeCanvas();
    draw();
    
    // Event listeners
    canvas.addEventListener('click', handleCanvasClick);
    // Add touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    document.getElementById('undoButton').addEventListener('click', handleUndo);
    document.getElementById('resetButton').addEventListener('click', handleReset);
    document.getElementById('graphButton').addEventListener('click', handleGraph);
    document.getElementById('solverButton').addEventListener('click', handleSolver);
    document.getElementById('jumpButton').addEventListener('click', handleJumpToggle);
    document.getElementById('dragButton').addEventListener('click', handleDragToggle);
    window.addEventListener('resize', () => {
        resizeCanvas();
        draw();
    });
});

function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    const isGraphVisible = gameArea.classList.contains('graph-visible');
    const isMobile = window.innerWidth <= 768;
    
    let canvasWidth, canvasHeight;
    
    if (isGraphVisible) {
        // When graph is visible, each canvas gets 50% of screen width, maximize height
        canvasWidth = gameArea.clientWidth * 0.45;  // 45% to account for padding/margins
        canvasHeight = window.innerHeight * 0.8;  // Maximize height, don't constrain to square
        // Don't force square - let each canvas use full available dimensions
    } else {
        // When graph is hidden, board can use more space
        if (isMobile) {
            // Mobile: Use full width, maximize height
            canvasWidth = gameArea.clientWidth * 0.9;
            canvasHeight = window.innerHeight * 0.6;  // Use more vertical space
        } else {
            // Desktop: Keep square
            const maxSize = Math.min(gameArea.clientWidth * 0.8, window.innerHeight * 0.9, 800);
            canvasWidth = canvasHeight = maxSize;
        }
    }
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    if (graphManager && graphManager.canvas) {
        graphManager.canvas.width = canvasWidth;
        graphManager.canvas.height = canvasHeight;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const boardWidth = canvas.width * BOARD_WIDTH_RATIO;  // 1/3 of canvas width
    const rodRadius = canvas.width * ROD_DIAMETER_RATIO / 2;  // Radius = diameter/2, diameter = 2/3 canvas width
    
    // Simple 3-section layout: rod takes 2/3, board takes 1/3
    const rodCenterX = canvas.width / 3;  // Rod center at 1/3 point
    const boardX = canvas.width * 2/3;  // Board starts at 2/3 point
    
    drawRod(rodCenterX, canvas.height / 2, rodRadius);
    drawBoard(boardX, CELL_PADDING, boardWidth, canvas.height - 2 * CELL_PADDING);
    
    // Draw highlights after all base elements are drawn
    drawHighlights(rodCenterX, canvas.height / 2, rodRadius, boardX, CELL_PADDING, boardWidth, canvas.height - 2 * CELL_PADDING);
    
    // Draw graph
    if (graphManager) {
        graphManager.draw();
    }
}

function drawBoard(x, y, width, height) {
    const cellHeight = height / 6;
    const cellWidth = width;
    
    for (let i = 0; i < 6; i++) {
        const cellY = y + i * cellHeight;
        const piece = game.board[i];
        
        // Draw cell background
        ctx.fillStyle = label2color[Math.abs(piece)];
        ctx.fillRect(x, cellY, cellWidth, cellHeight);
        
        // Draw cell border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, cellY, cellWidth, cellHeight);
        
        // Draw piece label
        if (piece !== 0) {
            ctx.fillStyle = 'black';
            ctx.font = 'bold 45px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(piece.toString(), x + cellWidth / 2, cellY + cellHeight / 2);
        }
    }
}

function drawRod(centerX, centerY, radius) {
    // Draw dial sections
    for (let i = 0; i < 6; i++) {
        const startAngle = (i*60 - 90 - 30) * Math.PI / 180;
        const endAngle   = (i*60 - 90 + 30) * Math.PI / 180;
        
        // Determine the value at this position
        const rodIndex = (i + game.irod + 6) % 6;
        const value = rodtable[rodIndex];
        
        // Draw pie section
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, -endAngle, -startAngle, false);
        ctx.closePath();
        
        // Color based on value
        ctx.fillStyle = label2color[Math.abs(value)];
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw label
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const labelAngle = (startAngle + endAngle) / 2;
        const sx = centerX + Math.cos(labelAngle) * radius * 0.6;
        const sy = centerY - Math.sin(labelAngle) * radius * 0.6;
       
        //console.log('irod=',game.irod);
        //console.log('i=',i);
        //console.log('rodIndex=',rodIndex);
        //console.log('vrod=',value);
        
        ctx.fillText(value.toString(), Math.round(sx), Math.round(sy));
        ctx.restore();

        //console.log('(wx,wy)=(',canvas.width,',',canvas.height,')');
        //console.log('(cx,cy)=(',centerX,',',centerY,')');
        //console.log('(sx,sy)=(',sx,',',sy,')');
    }
    
    // Draw pivot (triangle pointer at bottom of dial)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + radius - 10);
    ctx.lineTo(centerX - 15, centerY + radius + 10);
    ctx.lineTo(centerX + 15, centerY + radius + 10);
    ctx.closePath();
    
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawHighlights(rodCenterX, rodCenterY, rodRadius, boardX, boardY, boardWidth, boardHeight) {
    // Highlight movable board cells
    const movable = getMovableCells();
    const cellHeight = boardHeight / 6;
    const cellWidth = boardWidth;
    
    for (let i = 0; i < 6; i++) {
        if (movable.includes(i)) {
            const cellY = boardY + i * cellHeight;
            
            // Outer magenta box (line-width 4px)
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 4;
            ctx.strokeRect(boardX + 2, cellY + 2, cellWidth - 4, cellHeight - 4);
            
            // Inner black box (line-width 2px, inscribed)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(boardX + 4, cellY + 4, cellWidth - 8, cellHeight - 8);
        }
    }
    
    // Highlight movable rod sections
    const ismovable4 = game.checkmove(4); // Clockwise
    const ismovable5 = game.checkmove(5); // Counter-clockwise
    
    for (let i = 0; i < 6; i++) {
        if (i === 1 && ismovable4 || i === 5 && ismovable5) {
            const startAngle = (i*60 - 90 - 30) * Math.PI / 180;
            const endAngle   = (i*60 - 90 + 30) * Math.PI / 180;
            
            // Outer magenta arc (line-width 6px)
            ctx.beginPath();
            ctx.moveTo(rodCenterX, rodCenterY);
            ctx.arc(rodCenterX, rodCenterY, rodRadius, -endAngle, -startAngle, false);
            ctx.closePath();
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 6;
            ctx.stroke();
            
            // Inner black arc (line-width 2px, smaller radius)
            ctx.beginPath();
            ctx.moveTo(rodCenterX, rodCenterY);
            ctx.arc(rodCenterX, rodCenterY, rodRadius - 4, -endAngle, -startAngle, false);
            ctx.closePath();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

function getMovableCells() {
    const blankIndex = findzero(game.board);
    const movable = [];
    
    // Check each direction
    if (game.checkmove(0)) movable.push(blankIndex - 1);
    if (game.checkmove(1)) movable.push(blankIndex + 1);
    if (game.checkmove(2)) movable.push(blankIndex + 2);
    if (game.checkmove(3)) movable.push(blankIndex - 2);
    
    return movable.filter(i => i >= 0 && i < 6);
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    
    // Scale coordinates from display size to canvas internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    debugLog('Raw event coordinates: clientX=' + event.clientX + ', clientY=' + event.clientY);
    debugLog('Canvas rect: left=' + rect.left + ', top=' + rect.top + ', width=' + rect.width + ', height=' + rect.height);
    debugLog('Scale factors: scaleX=' + scaleX + ', scaleY=' + scaleY);
    debugLog('Canvas click/tap at: ' + x + ', ' + y + ' (canvas: ' + canvas.width + 'x' + canvas.height + ')');
    
    const boardWidth = canvas.width * BOARD_WIDTH_RATIO;  // 1/3 of canvas width
    const rodRadius = canvas.width * ROD_DIAMETER_RATIO / 2;  // Radius = diameter/2, diameter = 2/3 canvas width
    const rodCenterX = canvas.width / 3;  // Rod center at 1/3 point
    const rodCenterY = canvas.height / 2;
    const boardX = canvas.width * 2/3;  // Board starts at 2/3 point
    
    debugLog('boardWidth=' + boardWidth + ', rodRadius=' + rodRadius + ', rodCenterX=' + rodCenterX + ', boardX=' + boardX);
    debugLog('Board area: x >= ' + boardX + ', Rod area: x < ' + (rodCenterX + rodRadius));
    
    // Check if click is on rod (left side)
    if (x < rodCenterX + rodRadius) {
        debugLog('Handling rod click');
        handleRodClick(x, y, rodCenterX, rodCenterY, rodRadius);
    }
    // Check if click is on board (right side)
    else if (x >= boardX) {
        debugLog('Handling board click');
        handleBoardClick(x, y, boardX);
    } else {
        debugLog('Click was between rod and board areas');
    }
}

function handleBoardClick(x, y, boardX) {
    const boardWidth = canvas.width * BOARD_WIDTH_RATIO;
    const cellHeight = (canvas.height - 2 * CELL_PADDING) / 6;
    const blankIndex = findzero(game.board);
    
    debugLog('Board click at: ' + x + ', ' + y + ' (boardX: ' + boardX + ', width: ' + boardWidth + ')');
    
    // Check if click is within board bounds
    if (x < boardX || x > boardX + boardWidth) {
        debugLog('Click outside board bounds');
        return;
    }
    
    const clickedCell = Math.floor((y - CELL_PADDING) / cellHeight);
    debugLog('Clicked cell: ' + clickedCell + ', blank at: ' + blankIndex);
    
    if (clickedCell < 0 || clickedCell >= 6) {
        debugLog('Invalid cell index');
        return;
    }
    
    // Save current state for undo
    const prevState = game.clone();
    let moved = false;
    
    // Try to move based on clicked cell position relative to blank
    if (clickedCell === blankIndex - 1 && game.checkmove(0)) {
        debugLog('Moving up (direction 0)');
        game = game.move(0);
        moved = true;
    } else if (clickedCell === blankIndex + 1 && game.checkmove(1)) {
        debugLog('Moving down (direction 1)');
        game = game.move(1);
        moved = true;
    } else if (clickedCell === blankIndex + 2 && game.checkmove(2)) {
        debugLog('Moving skip down (direction 2)');
        game = game.move(2);
        moved = true;
    } else if (clickedCell === blankIndex - 2 && game.checkmove(3)) {
        debugLog('Moving skip up (direction 3)');
        game = game.move(3);
        moved = true;
    } else {
        debugLog('No valid move for clicked cell');
    }
    
    if (moved && game) {
        debugLog('Move successful');
        history.push(prevState);
        if (graphManager) {
            graphManager.updateCurrentState(game);
        }
        draw();
        checkGoal();
    } else {
        debugLog('Move failed or invalid');
    }
}

function handleRodClick(x, y, centerX, centerY, radius) {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    debugLog('Rod click at: ' + x + ', ' + y + ' (center: ' + centerX + ', ' + centerY + ', radius: ' + radius + ', distance: ' + distance + ')');
    
    if (distance < radius) {
        let angle = Math.atan2(-dy, dx) * 180 / Math.PI;
        angle = (angle+90+30+360) % 360;
        const section = Math.floor(angle / 60);
        debugLog('Rod angle: ' + angle + ', section: ' + section);
        
        // Save current state for undo
        const prevState = game.clone();
         
        // Rotate to clicked section
        let move = -1;
        if (section === 1) {
            // Clockwise
            move = 4;
            debugLog('Attempting clockwise rotation (move 4)');
        } else if (section === 5) {
            // Counter-clockwise
            move = 5;
            debugLog('Attempting counter-clockwise rotation (move 5)');
        } else {
            debugLog('Clicked section ' + section + ' is not rotatable');
        }
        
        if(move!=-1){
            let game2 = game.move(move);
            if(game2) {
                debugLog('Rod rotation successful');
                game = game2;
                history.push(prevState);
                if (graphManager) {
                    graphManager.updateCurrentState(game);
                }
                draw();
            } else {
                debugLog('Rod rotation failed');
            }
        }
    } else {
        debugLog('Click outside rod radius');
    }
    //console.log('angle =', angle, 'section=', section, 
    //  'game.move('+move+')', 'irod=', game.irod,
    //  'rod=', rodtable[game.irod]);
}

function handleUndo() {
    if (history.length > 0) {
        game = history.pop();
        if (graphManager) {
            graphManager.updateCurrentState(game);
        }
        draw();
    }
}

function handleReset() {
    // Save current state for undo
    if (JSON.stringify(game.board) !== JSON.stringify(initboard)) {
        history.push(game.clone());
    }
    
    game.init();
    if (graphManager) {
        graphManager.updateCurrentState(game);
    }
    draw();
}

function checkGoal() {
    let isGoal = true;
    for (let i = 0; i < 6; i++) {
        if (game.board[i] !== goalboard[i]) {
            isGoal = false;
            break;
        }
    }
    
    if (isGoal) {
        setTimeout(() => {
            alert('Goal!');
        }, 100);
    }
}

function handleGraph() {
    const gameArea = document.querySelector('.game-area');
    const graphCanvas = document.getElementById('graph');
    
    if (gameArea.classList.contains('graph-visible')) {
        // Hide graph
        gameArea.classList.remove('graph-visible');
        // Stop solver if running
        if (graphManager) {
            // Clear any running intervals
            if (graphManager.physicsInterval) {
                clearInterval(graphManager.physicsInterval);
                graphManager.physicsInterval = null;
            }
            if (graphManager.solverInterval) {
                clearInterval(graphManager.solverInterval);
                graphManager.solverInterval = null;
            }
            if (graphManager.visualizationInterval) {
                clearInterval(graphManager.visualizationInterval);
                graphManager.visualizationInterval = null;
            }
        }
    } else {
        // Show graph and start solver
        gameArea.classList.add('graph-visible');
        if (graphManager) {
            graphManager.startSolver(game);
        }
    }
    
    // Resize canvases for new layout
    resizeCanvas();
    draw();
}

function handleSolver() {
    // Auto-solve: move one step closer to goal
    if (!graphManager || !graphManager.solver || !graphManager.solver.graph) {
        console.log('Solver not ready');
        return;
    }
    
    // Get current game state's node
    const currentHash = game.hash();
    const currentNode = graphManager.solver.graph.get(currentHash);
    
    if (!currentNode) {
        console.log('Current state not found in graph');
        return;
    }
    
    if (currentNode.goalcount === -1) {
        console.log('Goal counts not calculated yet');
        return;
    }
    
    if (currentNode.goalcount === 0) {
        console.log('Already at goal!');
        return;
    }
    
    // Find the neighbor with the smallest goalcount
    let bestNode = null;
    let minGoalCount = Infinity;
    
    for (const neighbor of currentNode.edgelist) {
        if (neighbor.goalcount >= 0 && neighbor.goalcount < minGoalCount) {
            minGoalCount = neighbor.goalcount;
            bestNode = neighbor;
        }
    }
    
    if (bestNode) {
        console.log(`Moving from node with goalcount ${currentNode.goalcount} to ${bestNode.goalcount}`);
        
        // Save current state for undo
        history.push(game.clone());
        
        // Move to the best neighbor
        game = bestNode.game.clone();
        
        // Update display
        draw();
        checkGoal();
        
        // Update graph visualization
        if (graphManager) {
            graphManager.updateCurrentState(game);
        }
    } else {
        console.log('No better neighbor found');
    }
}

function handleJumpToggle() {
    jumpMode = !jumpMode;
    dragMode = false; // Turn off drag mode when jump mode is turned on
    
    const jumpButton = document.getElementById('jumpButton');
    const dragButton = document.getElementById('dragButton');
    
    if (jumpMode) {
        jumpButton.style.backgroundColor = '#4CAF50';
        jumpButton.style.color = 'white';
    } else {
        jumpButton.style.backgroundColor = '';
        jumpButton.style.color = '';
    }
    
    // Reset drag button appearance
    dragButton.style.backgroundColor = '';
    dragButton.style.color = '';
    
    // Update graph manager mode
    if (graphManager) {
        graphManager.setMode(jumpMode ? 'jump' : 'normal');
    }
}

function handleDragToggle() {
    dragMode = !dragMode;
    jumpMode = false; // Turn off jump mode when drag mode is turned on
    
    const jumpButton = document.getElementById('jumpButton');
    const dragButton = document.getElementById('dragButton');
    
    if (dragMode) {
        dragButton.style.backgroundColor = '#4CAF50';
        dragButton.style.color = 'white';
    } else {
        dragButton.style.backgroundColor = '';
        dragButton.style.color = '';
    }
    
    // Reset jump button appearance
    jumpButton.style.backgroundColor = '';
    jumpButton.style.color = '';
    
    // Update graph manager mode
    if (graphManager) {
        graphManager.setMode(dragMode ? 'drag' : 'normal');
    }
}

// Touch event handlers for mobile
let touchStartTime = 0;
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        touchStartTime = Date.now();
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }
}

function handleTouchEnd(event) {
    event.preventDefault();
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    
    // Only process as tap if it was a quick touch (less than 300ms) and single finger
    if (event.changedTouches.length === 1 && touchDuration < 300) {
        const touch = event.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        
        // Check if touch didn't move much (less than 10 pixels)
        const deltaX = Math.abs(touchEndX - touchStartX);
        const deltaY = Math.abs(touchEndY - touchStartY);
        
        if (deltaX < 10 && deltaY < 10) {
            debugLog('Touch tap detected at: ' + touchEndX + ', ' + touchEndY);
            debugLog('Touch start was at: ' + touchStartX + ', ' + touchStartY);
            
            // Create mock event that matches the mouse event format
            const mockEvent = {
                clientX: touchEndX,
                clientY: touchEndY
            };
            
            debugLog('Calling handleCanvasClick with mock event');
            // Call the same handler as mouse click
            handleCanvasClick(mockEvent);
        } else {
            debugLog('Touch moved too much: deltaX=' + deltaX + ', deltaY=' + deltaY);
        }
    } else {
        debugLog('Touch duration too long or multiple fingers: duration=' + touchDuration + ', fingers=' + event.changedTouches.length);
    }
}
