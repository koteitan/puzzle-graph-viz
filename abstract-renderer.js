// Abstract base class for puzzle game renderers
class AbstractRenderer {
  constructor() {
    if (this.constructor === AbstractRenderer) {
      throw new Error("Abstract class AbstractRenderer cannot be instantiated directly");
    }
    this.graphManager = null;
    this.canvas = null;
    this.ctx = null;
  }

  // Abstract methods that must be implemented by subclasses

  // Initialize the renderer with canvas and context
  init(canvas, ctx, graphManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.graphManager = graphManager;
  }

  // Draw the game state on the canvas
  draw(canvas, ctx, game) {
    throw new Error("draw() must be implemented by subclass");
  }

  // Handle canvas click events
  // Returns { moved: boolean, newGame: Game|null }
  handleCanvasClick(event, game, canvas) {
    throw new Error("handleCanvasClick() must be implemented by subclass");
  }

  // Handle canvas resize
  resizeCanvas(canvas, gameArea) {
    // Default implementation for standard resizing
    const isGraphVisible = gameArea.classList.contains('graph-visible');
    const isMobile = window.innerWidth <= 768;

    let canvasWidth, canvasHeight;

    if (isGraphVisible) {
      // When graph is visible, each canvas gets 45% of screen width
      canvasWidth = gameArea.clientWidth * 0.45;
      canvasHeight = window.innerHeight * 0.8;
    } else {
      // When graph is hidden, board can use more space
      if (isMobile) {
        canvasWidth = gameArea.clientWidth * 0.9;
        canvasHeight = window.innerHeight * 0.6;
      } else {
        const maxSize = Math.min(gameArea.clientWidth * 0.8, window.innerHeight * 0.9, 800);
        canvasWidth = canvasHeight = maxSize;
      }
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  }

  // Get layout constants (can be overridden)
  getLayoutConstants() {
    return {
      CELL_PADDING: 10,
      BOARD_WIDTH_RATIO: 1/3,
      ROD_DIAMETER_RATIO: 2/3
    };
  }

  // Handle undo action (can be overridden for renderer-specific cleanup)
  handleUndo() {
    // Default implementation - no special handling needed
  }

  // Handle reset action (can be overridden for renderer-specific cleanup)
  handleReset() {
    // Default implementation - no special handling needed
  }

  // Resize both board canvas and graph canvas
  resizeAllCanvases() {
    const gameArea = document.querySelector('.game-area');
    this.resizeCanvas(this.canvas, gameArea);
    if (this.graphManager && this.graphManager.canvas) {
      this.resizeCanvas(this.graphManager.canvas, gameArea);
    }
  }

  // Draw both board and graph
  drawAll(game) {
    this.draw(this.canvas, this.ctx, game);
    if (this.graphManager) {
      this.graphManager.draw();
    }
  }
}