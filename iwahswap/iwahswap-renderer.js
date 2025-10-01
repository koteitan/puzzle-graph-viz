/**
 * IwahswapRenderer - Iwahswap puzzle renderer implementation
 *
 * Renders the Iwahswap puzzle which consists of:
 * - A vertical board with 6 cells (right side)
 * - A rotating dial/rod with 6 sections (left side)
 *
 * The puzzle involves sliding numbered pieces on the board and rotating the dial
 * to manipulate the pieces according to specific rules.
 *
 * Layout:
 * - Left 2/3: Rotating dial with 6 pie sections
 * - Right 1/3: Vertical board with 6 cells
 */
class IwahswapRenderer extends AbstractRenderer {
  constructor() {
    super();
  }

  // ============================================================================
  // Main Rendering
  // ============================================================================

  /**
   * Draw the complete Iwahswap puzzle state
   *
   * @param {HTMLCanvasElement} canvas - The canvas to draw on
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context
   * @param {IwahswapGame} game - The Iwahswap game state
   */
  draw(canvas, ctx, game) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const constants = this.getLayoutConstants();
    const boardWidth = canvas.width * constants.BOARD_WIDTH_RATIO;  // 1/3 of canvas width
    const rodRadius = canvas.width * constants.ROD_DIAMETER_RATIO / 2;  // Radius = diameter/2

    // Simple 3-section layout: rod takes 2/3, board takes 1/3
    const rodCenterX = canvas.width / 3;  // Rod center at 1/3 point
    const boardX = canvas.width * 2/3;  // Board starts at 2/3 point

    // Draw puzzle elements
    this.drawRod(ctx, game, rodCenterX, canvas.height / 2, rodRadius);
    this.drawBoard(ctx, game, boardX, constants.CELL_PADDING, boardWidth, canvas.height - 2 * constants.CELL_PADDING);

    // Draw highlights after all base elements are drawn (so they appear on top)
    this.drawHighlights(ctx, game, rodCenterX, canvas.height / 2, rodRadius, boardX, constants.CELL_PADDING, boardWidth, canvas.height - 2 * constants.CELL_PADDING);
  }

  // ============================================================================
  // Board Rendering
  // ============================================================================

  /**
   * Draw the vertical board with 6 cells
   * Each cell displays a numbered piece with colored background
   *
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context
   * @param {IwahswapGame} game - The game state
   * @param {number} x - X coordinate of board's left edge
   * @param {number} y - Y coordinate of board's top edge
   * @param {number} width - Width of the board
   * @param {number} height - Total height of the board
   */
  drawBoard(ctx, game, x, y, width, height) {
    const cellHeight = height / 6;
    const cellWidth = width;

    for (let i = 0; i < 6; i++) {
      const cellY = y + i * cellHeight;
      const piece = game.board[i];

      // Draw cell background (colored based on piece value)
      ctx.fillStyle = label2color[Math.abs(piece)];
      ctx.fillRect(x, cellY, cellWidth, cellHeight);

      // Draw cell border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, cellY, cellWidth, cellHeight);

      // Draw piece label (skip for blank cell which has piece value 0)
      if (piece !== 0) {
        ctx.fillStyle = 'black';
        ctx.font = 'bold 45px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(piece.toString(), x + cellWidth / 2, cellY + cellHeight / 2);
      }
    }
  }

  // ============================================================================
  // Rod (Dial) Rendering
  // ============================================================================

  /**
   * Draw the rotating dial (rod) with 6 pie sections
   * The dial shows numbers that can be swapped with board pieces
   *
   * Rod mechanics:
   * - 6 sections arranged in a circle
   * - Each section shows a value from rodtable
   * - Current position indicated by game.irod
   * - Sections at positions 1 and 5 (relative to pivot) are clickable
   *
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context
   * @param {IwahswapGame} game - The game state
   * @param {number} centerX - X coordinate of dial center
   * @param {number} centerY - Y coordinate of dial center
   * @param {number} radius - Radius of the dial
   */
  drawRod(ctx, game, centerX, centerY, radius) {
    // Draw dial sections (6 pie slices)
    for (let i = 0; i < 6; i++) {
      // Calculate angles for this pie slice
      // Each slice is 60 degrees, centered at i*60 - 90 degrees
      const startAngle = (i*60 - 90 - 30) * Math.PI / 180;
      const endAngle   = (i*60 - 90 + 30) * Math.PI / 180;

      // Determine the value at this position
      // rodIndex rotates based on game.irod to show current configuration
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

      // Draw label (number) in the section
      ctx.save();
      ctx.fillStyle = 'black';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Position label at 60% of radius
      const labelAngle = (startAngle + endAngle) / 2;
      const sx = centerX + Math.cos(labelAngle) * radius * 0.6;
      const sy = centerY - Math.sin(labelAngle) * radius * 0.6;

      ctx.fillText(value.toString(), Math.round(sx), Math.round(sy));
      ctx.restore();
    }

    // Draw pivot (triangle pointer at bottom of dial)
    // Points to the current rod position (game.irod)
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

  // ============================================================================
  // Highlight Rendering
  // ============================================================================

  /**
   * Draw highlights around movable pieces
   * Shows which pieces can be moved in the current state
   *
   * Highlight style:
   * - Outer magenta box (4px thick)
   * - Inner black box (2px thick)
   * This creates a distinctive double-border effect
   *
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context
   * @param {IwahswapGame} game - The game state
   * @param {number} rodCenterX - X coordinate of rod center
   * @param {number} rodCenterY - Y coordinate of rod center
   * @param {number} rodRadius - Radius of the rod
   * @param {number} boardX - X coordinate of board's left edge
   * @param {number} boardY - Y coordinate of board's top edge
   * @param {number} boardWidth - Width of the board
   * @param {number} boardHeight - Total height of the board
   */
  drawHighlights(ctx, game, rodCenterX, rodCenterY, rodRadius, boardX, boardY, boardWidth, boardHeight) {
    // Highlight movable board cells
    const movable = game.getMovableCells();
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
    const ismovable4 = game.checkmove(4); // Clockwise rotation
    const ismovable5 = game.checkmove(5); // Counter-clockwise rotation

    for (let i = 0; i < 6; i++) {
      // Section 1 is for clockwise, section 5 is for counter-clockwise
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

  // ============================================================================
  // Click Handling
  // ============================================================================

  /**
   * Handle canvas click events
   * Determines if click is on board or rod and delegates to appropriate handler
   *
   * @param {MouseEvent|TouchEvent} event - The click or touch event
   * @param {IwahswapGame} game - The current game state
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @returns {{moved: boolean, newGame: IwahswapGame|null}}
   */
  handleCanvasClick(event, game, canvas) {
    const rect = canvas.getBoundingClientRect();

    // Scale coordinates from display size to canvas internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const constants = this.getLayoutConstants();
    const boardWidth = canvas.width * constants.BOARD_WIDTH_RATIO;
    const rodRadius = canvas.width * constants.ROD_DIAMETER_RATIO / 2;
    const rodCenterX = canvas.width / 3;
    const rodCenterY = canvas.height / 2;
    const boardX = canvas.width * 2/3;

    // Check if click is on rod (left side)
    if (x < rodCenterX + rodRadius) {
      return this.handleRodClick(x, y, rodCenterX, rodCenterY, rodRadius, game);
    }
    // Check if click is on board (right side)
    else if (x >= boardX) {
      return this.handleBoardClick(x, y, boardX, game, constants.CELL_PADDING, canvas.height);
    }

    return { moved: false, newGame: null };
  }

  /**
   * Handle click on the board
   * Determines which cell was clicked and attempts to move that piece
   *
   * Valid moves:
   * - Move 0: Piece immediately above blank moves down
   * - Move 1: Piece immediately below blank moves up
   * - Move 2: Piece 2 cells below blank jumps up (over one piece)
   * - Move 3: Piece 2 cells above blank jumps down (over one piece)
   *
   * @param {number} x - X coordinate of click
   * @param {number} y - Y coordinate of click
   * @param {number} boardX - X coordinate of board's left edge
   * @param {IwahswapGame} game - The game state
   * @param {number} cellPadding - Padding around cells
   * @param {number} canvasHeight - Total canvas height
   * @returns {{moved: boolean, newGame: IwahswapGame|null}}
   */
  handleBoardClick(x, y, boardX, game, cellPadding, canvasHeight) {
    const constants = this.getLayoutConstants();
    const boardWidth = canvasHeight * constants.BOARD_WIDTH_RATIO;
    const cellHeight = (canvasHeight - 2 * cellPadding) / 6;
    const blankIndex = findzero(game.board);

    // Check if click is within board bounds
    if (x < boardX || x > boardX + boardWidth) {
      return { moved: false, newGame: null };
    }

    const clickedCell = Math.floor((y - cellPadding) / cellHeight);

    if (clickedCell < 0 || clickedCell >= 6) {
      return { moved: false, newGame: null };
    }

    // Try to move based on clicked cell position relative to blank
    let newGame = null;
    if (clickedCell === blankIndex - 1 && game.checkmove(0)) {
      // Piece above blank
      newGame = game.move(0);
    } else if (clickedCell === blankIndex + 1 && game.checkmove(1)) {
      // Piece below blank
      newGame = game.move(1);
    } else if (clickedCell === blankIndex + 2 && game.checkmove(2)) {
      // Piece 2 cells below blank (jump move)
      newGame = game.move(2);
    } else if (clickedCell === blankIndex - 2 && game.checkmove(3)) {
      // Piece 2 cells above blank (jump move)
      newGame = game.move(3);
    }

    return { moved: !!newGame, newGame: newGame };
  }

  /**
   * Handle click on the rod (dial)
   * Determines which section was clicked and attempts rotation
   *
   * Valid rod moves:
   * - Move 4: Clockwise rotation (section 1)
   * - Move 5: Counter-clockwise rotation (section 5)
   *
   * @param {number} x - X coordinate of click
   * @param {number} y - Y coordinate of click
   * @param {number} centerX - X coordinate of rod center
   * @param {number} centerY - Y coordinate of rod center
   * @param {number} radius - Radius of the rod
   * @param {IwahswapGame} game - The game state
   * @returns {{moved: boolean, newGame: IwahswapGame|null}}
   */
  handleRodClick(x, y, centerX, centerY, radius, game) {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < radius) {
      // Calculate which section was clicked
      let angle = Math.atan2(-dy, dx) * 180 / Math.PI;
      angle = (angle+90+30+360) % 360;
      const section = Math.floor(angle / 60);

      // Rotate to clicked section
      let move = -1;
      if (section === 1) {
        // Clockwise rotation
        move = 4;
      } else if (section === 5) {
        // Counter-clockwise rotation
        move = 5;
      }

      if(move !== -1){
        let newGame = game.move(move);
        return { moved: !!newGame, newGame: newGame };
      }
    }

    return { moved: false, newGame: null };
  }
}
