/**
 * AbstractRenderer - Base class for puzzle game renderers
 *
 * This abstract class defines the interface that all puzzle renderers must implement.
 * It provides common functionality for canvas rendering, event handling, and layout management.
 *
 * Subclasses must implement:
 * - draw(): Render the game state
 * - handleCanvasClick(): Process user clicks on the canvas
 *
 * Subclasses may override:
 * - resizeCanvas(): Custom canvas sizing logic
 * - getLayoutConstants(): Custom layout parameters
 */
class AbstractRenderer {
  /**
   * Constructor
   * Prevents direct instantiation of abstract class
   * Initializes canvas and graph manager references to null
   */
  constructor() {
    if (this.constructor === AbstractRenderer) {
      throw new Error("Abstract class AbstractRenderer cannot be instantiated directly");
    }
    this.graphManager = null;  // Reference to GraphManager for state space visualization
    this.canvas = null;         // Main canvas element
    this.ctx = null;            // 2D rendering context
  }

  // ============================================================================
  // Abstract Methods (must be implemented by subclasses)
  // ============================================================================

  /**
   * Initialize the renderer with canvas and context
   * Called once during setup to provide canvas access
   *
   * @param {HTMLCanvasElement} canvas - The canvas element to draw on
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context
   * @param {GraphManager} graphManager - The graph manager for state visualization
   */
  init(canvas, ctx, graphManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.graphManager = graphManager;
  }

  /**
   * Draw the game state on the canvas
   * ABSTRACT METHOD - must be implemented by subclass
   *
   * @param {HTMLCanvasElement} canvas - The canvas to draw on
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context
   * @param {AbstractGame} game - The game state to render
   * @throws {Error} If not implemented by subclass
   */
  draw(canvas, ctx, game) {
    throw new Error("draw() must be implemented by subclass");
  }

  /**
   * Handle canvas click events
   * ABSTRACT METHOD - must be implemented by subclass
   *
   * Process user clicks and return the result of the interaction.
   * The return object indicates whether a move was made and provides the new game state.
   *
   * @param {MouseEvent|TouchEvent} event - The click or touch event
   * @param {AbstractGame} game - The current game state
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @returns {{moved: boolean, newGame: AbstractGame|null, selectionChanged?: boolean}}
   *   - moved: true if a valid move was executed
   *   - newGame: the new game state (if moved is true)
   *   - selectionChanged: optional, true if UI selection state changed without moving
   * @throws {Error} If not implemented by subclass
   */
  handleCanvasClick(event, game, canvas) {
    throw new Error("handleCanvasClick() must be implemented by subclass");
  }

  // ============================================================================
  // Canvas Sizing and Layout
  // ============================================================================

  /**
   * Handle canvas resize based on current layout
   * Default implementation provides responsive sizing for board and graph views
   *
   * Layout modes:
   * - Graph visible: Board takes 45% width, graph takes 45% width
   * - Graph hidden (desktop): Square canvas up to 800px
   * - Graph hidden (mobile): 90% width, 60% height
   *
   * @param {HTMLCanvasElement} canvas - The canvas to resize
   * @param {HTMLElement} gameArea - The game area container element
   */
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

  /**
   * Get layout constants for rendering
   * Can be overridden by subclasses to provide custom layout parameters
   *
   * @returns {{CELL_PADDING: number, BOARD_WIDTH_RATIO: number, ROD_DIAMETER_RATIO: number}}
   *   Layout constants object with puzzle-specific dimensions
   */
  getLayoutConstants() {
    return {
      CELL_PADDING: 10,           // Padding around cells
      BOARD_WIDTH_RATIO: 1/3,     // Board width as ratio of canvas width
      ROD_DIAMETER_RATIO: 2/3     // Rod diameter as ratio of canvas width
    };
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  /**
   * Resize both board canvas and graph canvas
   * Applies resizing to both the main game canvas and the graph visualization canvas
   */
  resizeAllCanvases() {
    const gameArea = document.querySelector('.game-area');
    this.resizeCanvas(this.canvas, gameArea);
    if (this.graphManager && this.graphManager.canvas) {
      this.resizeCanvas(this.graphManager.canvas, gameArea);
    }
  }

  /**
   * Draw both board and graph
   * Renders both the game state and the state space graph visualization
   *
   * @param {AbstractGame} game - The game state to render
   */
  drawAll(game) {
    this.draw(this.canvas, this.ctx, game);
    if (this.graphManager) {
      this.graphManager.draw();
    }
  }
}
