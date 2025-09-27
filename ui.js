// Global variables
let game;            // AbstractGame
let renderer;        // AbstractRenderer
let canvas;
let ctx;
let history = [];
let graphManager = null;
let debugTextarea = null;
let jumpMode = false;
let dragMode = false;
let solverMode = false;
let display_goal_count = 0;
let nodesPerVisualizationCycle = 25;

// Debug logging function
function debugLog(message) {
    if (debugTextarea) {
        debugTextarea.value += new Date().toLocaleTimeString() + ': ' + message + '\n';
        debugTextarea.scrollTop = debugTextarea.scrollHeight;
    }
    console.log(message);
}

// Initialize UI controller
function initUIController() {
    canvas = document.getElementById('board');
    ctx = canvas.getContext('2d');
    debugTextarea = document.getElementById('debugout');

    // Initialize graph manager with color config from game
    graphManager = new GraphManager();
    const colorConfig = game.getColorConfig();
    graphManager.init(document.getElementById('graph'), new Solver(), colorConfig);

    // Initialize renderer with canvas and graph manager
    renderer.init(canvas, ctx, graphManager);

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

    document.getElementById('undoButton').addEventListener('click', handleUndoButton);
    document.getElementById('resetButton').addEventListener('click', handleResetButton);
    document.getElementById('graphButton').addEventListener('click', handleGraphButton);
    document.getElementById('solverButton').addEventListener('click', handleSolverButton);
    document.getElementById('jumpButton').addEventListener('click', handleJumpButton);
    document.getElementById('dragButton').addEventListener('click', handleDragButton);
    window.addEventListener('resize', () => {
        resizeCanvas();
        draw();
    });
}

function resizeCanvas() {
    renderer.resizeAllCanvases();
}

function draw() {
    renderer.drawAll(game);
}

function handleCanvasClick(event) {
    // Delegate to renderer
    const result = renderer.handleCanvasClick(event, game, canvas);

    if (result.moved && result.newGame) {
        // Save current state for undo
        history.push(game.clone());

        // Update game state
        game = result.newGame;

        // Update display
        draw();
        checkGoal();

        // Update graph visualization
        if (graphManager) {
            graphManager.updateCurrentState(game);
        }
    } else if (result.selectionChanged === true) {
        // Just redraw to show selection changes
        draw();
    }
}

function handleUndoButton() {
    if (history.length > 0) {
        game = history.pop();
        if (graphManager) {
            graphManager.updateCurrentState(game);
        }
        draw();
    }
}

function handleResetButton() {
    // Save current state for undo
    const initialBoard = game.getInitialBoard();
    if (JSON.stringify(game.board) !== JSON.stringify(initialBoard)) {
        history.push(game.clone());
    }

    game.init();
    if (graphManager) {
        graphManager.updateCurrentState(game);
    }
    draw();
}

function checkGoal() {
    if (game.checkGoal()) {
        setTimeout(() => {
            alert('Goal!');
        }, 100);
    }
}

function handleGraphButton() {
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

function handleSolverButton() {
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

function handleJumpButton() {
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

function handleDragButton() {
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