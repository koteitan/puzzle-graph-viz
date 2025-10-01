/**
 * Main UI Controller for Puzzle Graph Visualizer
 *
 * This is the old Iwahswap-specific main.js file.
 * For new puzzles, use ui.js (the generic UI controller) instead.
 *
 * This file is kept for backward compatibility with the original Iwahswap implementation.
 */

// ============================================================================
// Global Variables
// ============================================================================

let game;            // AbstractGame instance - the puzzle game logic
let renderer;        // AbstractRenderer instance - handles drawing and interaction
let canvas;          // Main canvas element for game board
let ctx;             // 2D rendering context for the canvas
let history = [];    // Stack of game states for undo functionality
let graphManager = null;      // Manages the state space graph visualization
let debugTextarea = null;     // Debug output textarea element
let jumpMode = false;         // Flag: true when jump mode is active (click graph to jump to state)
let dragMode = false;         // Flag: true when drag mode is active (drag graph nodes)
let solverMode = false;       // Flag: true when solver mode is active
let display_goal_count = 0;   // Flag: whether to display goal count on graph nodes
let nodesPerVisualizationCycle = 25; // Number of nodes to add to visualization per cycle

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Log debug messages to both console and debug textarea
 * @param {string} message - The message to log
 */
function debugLog(message) {
    if (debugTextarea) {
        debugTextarea.value += new Date().toLocaleTimeString() + ': ' + message + '\n';
        debugTextarea.scrollTop = debugTextarea.scrollHeight;
    }
    console.log(message);
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the application on page load
 * Sets up game, renderer, graph manager, and all event listeners
 */
window.addEventListener('load', () => {
    // Get canvas and context
    canvas = document.getElementById('board');
    ctx = canvas.getContext('2d');
    debugTextarea = document.getElementById('debugout');

    // Initialize game and renderer (Iwahswap-specific)
    game = new IwahswapGame();
    game.init();
    renderer = new IwahswapRenderer();

    // Initialize graph manager with color config from game
    graphManager = new GraphManager();
    const colorConfig = game.getColorConfig();
    graphManager.init(document.getElementById('graph'), new Solver(), colorConfig);

    // Initialize renderer with canvas and graph manager
    renderer.init(canvas, ctx, graphManager);

    // Set jump callback to handle jumping to nodes in graph
    // This allows clicking on graph nodes to jump to that game state
    graphManager.setJumpCallback((gameState) => {
        // Save current state for undo
        history.push(game.clone());

        // Jump to the selected node's game state
        game = gameState.clone();

        // Update display
        draw();
        checkGoal();

        // Update graph visualization to show current state
        if (graphManager) {
            graphManager.updateCurrentState(game);
        }
    });

    // Initial render
    resizeCanvas();
    draw();

    // ========================================================================
    // Event Listeners
    // ========================================================================

    // Canvas interaction
    canvas.addEventListener('click', handleCanvasClick);

    // Touch events for mobile support
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Button controls
    document.getElementById('undoButton').addEventListener('click', handleUndoButton);
    document.getElementById('resetButton').addEventListener('click', handleResetButton);
    document.getElementById('graphButton').addEventListener('click', handleGraphButton);
    document.getElementById('solverButton').addEventListener('click', handleSolverButton);
    document.getElementById('jumpButton').addEventListener('click', handleJumpButton);
    document.getElementById('dragButton').addEventListener('click', handleDragButton);

    // Window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        draw();
    });
});

// ============================================================================
// Canvas Rendering
// ============================================================================

/**
 * Resize both board canvas and graph canvas to fit current layout
 */
function resizeCanvas() {
    renderer.resizeAllCanvases();
}

/**
 * Draw the current game state and graph visualization
 */
function draw() {
    renderer.drawAll(game);
}

// ============================================================================
// User Interaction Handlers
// ============================================================================

/**
 * Handle mouse clicks on the game canvas
 * Delegates to renderer which returns action result
 * @param {MouseEvent} event - The click event
 */
function handleCanvasClick(event) {
    // Delegate to renderer for puzzle-specific click handling
    const result = renderer.handleCanvasClick(event, game, canvas);

    if (result.moved && result.newGame) {
        // Valid move was made
        // Save current state for undo
        history.push(game.clone());

        // Update game state
        game = result.newGame;

        // Update display
        draw();
        checkGoal();

        // Update graph visualization to show current state
        if (graphManager) {
            graphManager.updateCurrentState(game);
        }
    } else if (result.selectionChanged === true) {
        // Selection changed but no move made (e.g., Hanoi tower selection)
        // Just redraw to show selection changes
        draw();
    }
}

/**
 * Handle undo button click
 * Restores previous game state from history
 */
function handleUndoButton() {
    if (history.length > 0) {
        game = history.pop();
        if (graphManager) {
            graphManager.updateCurrentState(game);
        }
        draw();
    }
}

/**
 * Handle reset button click
 * Resets game to initial state (with undo support)
 */
function handleResetButton() {
    // Save current state for undo (only if not already at initial state)
    const initialBoard = game.getInitialBoard();
    if (JSON.stringify(game.board) !== JSON.stringify(initialBoard)) {
        history.push(game.clone());
    }

    // Reset to initial state
    game.init();
    if (graphManager) {
        graphManager.updateCurrentState(game);
    }
    draw();
}

/**
 * Check if current game state is the goal state
 * Shows alert if goal is reached
 */
function checkGoal() {
    if (game.checkGoal()) {
        setTimeout(() => {
            alert('Goal!');
        }, 100);
    }
}

/**
 * Handle graph button click
 * Toggles graph visualization on/off and starts/stops solver
 */
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

/**
 * Handle solver button click
 * Auto-solve: move one step closer to goal using BFS solution
 */
function handleSolverButton() {
    // Check if solver is ready
    if (!graphManager || !graphManager.solver || !graphManager.solver.graph) {
        console.log('Solver not ready');
        return;
    }

    // Get current game state's node in the graph
    const currentHash = game.hash();
    const currentNode = graphManager.solver.graph.get(currentHash);

    if (!currentNode) {
        console.log('Current state not found in graph');
        return;
    }

    // Check if goal counts have been calculated
    if (currentNode.goalcount === -1) {
        console.log('Goal counts not calculated yet');
        return;
    }

    // Check if already at goal
    if (currentNode.goalcount === 0) {
        console.log('Already at goal!');
        return;
    }

    // Find the neighbor with the smallest goalcount (greedy step toward goal)
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

/**
 * Handle jump button click
 * Toggles jump mode (click graph nodes to jump to that state)
 */
function handleJumpButton() {
    jumpMode = !jumpMode;
    dragMode = false; // Turn off drag mode when jump mode is turned on

    const jumpButton = document.getElementById('jumpButton');
    const dragButton = document.getElementById('dragButton');

    // Update button appearance
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

/**
 * Handle drag button click
 * Toggles drag mode (drag graph nodes to reposition them)
 */
function handleDragButton() {
    dragMode = !dragMode;
    jumpMode = false; // Turn off jump mode when drag mode is turned on

    const jumpButton = document.getElementById('jumpButton');
    const dragButton = document.getElementById('dragButton');

    // Update button appearance
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

// ============================================================================
// Touch Event Handlers (Mobile Support)
// ============================================================================

let touchStartTime = 0;   // Timestamp when touch started
let touchStartX = 0;       // X coordinate where touch started
let touchStartY = 0;       // Y coordinate where touch started

/**
 * Handle touch start event
 * Records touch position and time for tap detection
 * @param {TouchEvent} event - The touch start event
 */
function handleTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        touchStartTime = Date.now();
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }
}

/**
 * Handle touch end event
 * Detects taps (quick touches without movement) and converts to click events
 * @param {TouchEvent} event - The touch end event
 */
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
