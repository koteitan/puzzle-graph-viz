// HanoiRenderer - Hanoi Tower puzzle renderer implementation
class HanoiRenderer extends AbstractRenderer {
  constructor() {
    super();
  }

  draw(canvas, ctx, game) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const constants = this.getLayoutConstants();
    this.drawTowers(ctx, game, canvas.width, canvas.height, constants);
    this.drawHighlights(ctx, game, canvas.width, canvas.height, constants);
  }

  getLayoutConstants() {
    return {
      TOWER_WIDTH: 200,      // Width of each tower area
      TOWER_HEIGHT: 300,     // Height of tower area
      BASE_WIDTH: 180,       // Width of tower base
      BASE_HEIGHT: 10,       // Height of tower base
      POST_WIDTH: 8,         // Width of tower post
      DISK_HEIGHT: 25,       // Height of each disk
      DISK_MIN_WIDTH: 30,    // Minimum disk width (smallest disk)
      DISK_MAX_WIDTH: 160,   // Maximum disk width (largest disk)
      TOWER_SPACING: 50      // Space between towers
    };
  }

  drawTowers(ctx, game, canvasWidth, canvasHeight, constants) {
    const totalWidth = 3 * constants.TOWER_WIDTH + 2 * constants.TOWER_SPACING;
    const startX = (canvasWidth - totalWidth) / 2;
    const startY = (canvasHeight - constants.TOWER_HEIGHT) / 2;

    for (let towerIndex = 0; towerIndex < 3; towerIndex++) {
      const towerX = startX + towerIndex * (constants.TOWER_WIDTH + constants.TOWER_SPACING);
      const towerCenterX = towerX + constants.TOWER_WIDTH / 2;

      // Draw tower base
      ctx.fillStyle = '#8B4513';  // Brown
      ctx.fillRect(
        towerCenterX - constants.BASE_WIDTH / 2,
        startY + constants.TOWER_HEIGHT - constants.BASE_HEIGHT,
        constants.BASE_WIDTH,
        constants.BASE_HEIGHT
      );

      // Draw tower post
      ctx.fillStyle = '#8B4513';  // Brown
      ctx.fillRect(
        towerCenterX - constants.POST_WIDTH / 2,
        startY,
        constants.POST_WIDTH,
        constants.TOWER_HEIGHT - constants.BASE_HEIGHT
      );

      // Draw disks
      const disks = game.getTowerDisks(towerIndex);
      for (let diskIndex = 0; diskIndex < disks.length; diskIndex++) {
        const diskSize = disks[diskIndex];
        const diskY = startY + constants.TOWER_HEIGHT - constants.BASE_HEIGHT - (diskIndex + 1) * constants.DISK_HEIGHT;

        // Calculate disk width based on size
        const diskWidthRatio = (diskSize - 1) / (game.numDisks - 1);
        const diskWidth = constants.DISK_MIN_WIDTH + diskWidthRatio * (constants.DISK_MAX_WIDTH - constants.DISK_MIN_WIDTH);

        // Color based on disk size (rainbow colors)
        const hue = ((diskSize - 1) / game.numDisks) * 300;
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;

        // Draw disk
        const diskX = towerCenterX - diskWidth / 2;
        ctx.fillRect(diskX, diskY, diskWidth, constants.DISK_HEIGHT - 2);

        // Draw disk border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(diskX, diskY, diskWidth, constants.DISK_HEIGHT - 2);

        // Draw disk number
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(diskSize.toString(), towerCenterX, diskY + constants.DISK_HEIGHT / 2 - 1);
      }

      // Draw tower label
      ctx.fillStyle = 'black';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`Tower ${towerIndex + 1}`, towerCenterX, startY + constants.TOWER_HEIGHT + 10);
    }
  }

  drawHighlights(ctx, game, canvasWidth, canvasHeight, constants) {
    const validMoves = game.getValidMoves();
    const totalWidth = 3 * constants.TOWER_WIDTH + 2 * constants.TOWER_SPACING;
    const startX = (canvasWidth - totalWidth) / 2;
    const startY = (canvasHeight - constants.TOWER_HEIGHT) / 2;

    // Highlight towers that can be moved from (have disks and valid moves)
    for (const move of validMoves) {
      const fromTowerX = startX + move.from * (constants.TOWER_WIDTH + constants.TOWER_SPACING);
      const fromTowerCenterX = fromTowerX + constants.TOWER_WIDTH / 2;

      // Highlight the top disk that can be moved
      const disks = game.getTowerDisks(move.from);
      if (disks.length > 0) {
        const topDiskSize = disks[disks.length - 1];
        const diskY = startY + constants.TOWER_HEIGHT - constants.BASE_HEIGHT - disks.length * constants.DISK_HEIGHT;

        const diskWidthRatio = (topDiskSize - 1) / (game.numDisks - 1);
        const diskWidth = constants.DISK_MIN_WIDTH + diskWidthRatio * (constants.DISK_MAX_WIDTH - constants.DISK_MIN_WIDTH);

        // Draw highlight around the movable disk
        ctx.strokeStyle = '#ff00ff';  // Magenta
        ctx.lineWidth = 4;
        ctx.strokeRect(
          fromTowerCenterX - diskWidth / 2 - 2,
          diskY - 2,
          diskWidth + 4,
          constants.DISK_HEIGHT + 2
        );
      }
    }

    // Highlight destination towers
    const destinationTowers = [...new Set(validMoves.map(move => move.to))];
    for (const towerIndex of destinationTowers) {
      const towerX = startX + towerIndex * (constants.TOWER_WIDTH + constants.TOWER_SPACING);
      const towerCenterX = towerX + constants.TOWER_WIDTH / 2;

      // Highlight the tower post
      ctx.strokeStyle = '#00ff00';  // Green
      ctx.lineWidth = 3;
      ctx.strokeRect(
        towerCenterX - constants.POST_WIDTH / 2 - 2,
        startY - 2,
        constants.POST_WIDTH + 4,
        constants.TOWER_HEIGHT - constants.BASE_HEIGHT + 4
      );
    }
  }

  handleCanvasClick(event, game, canvas) {
    const rect = canvas.getBoundingClientRect();

    // Scale coordinates from display size to canvas internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const constants = this.getLayoutConstants();
    const totalWidth = 3 * constants.TOWER_WIDTH + 2 * constants.TOWER_SPACING;
    const startX = (canvas.width - totalWidth) / 2;

    // Determine which tower was clicked
    let clickedTower = -1;
    for (let i = 0; i < 3; i++) {
      const towerX = startX + i * (constants.TOWER_WIDTH + constants.TOWER_SPACING);
      if (x >= towerX && x <= towerX + constants.TOWER_WIDTH) {
        clickedTower = i;
        break;
      }
    }

    if (clickedTower === -1) {
      return { moved: false, newGame: null };
    }

    // Simple clicking logic: find the best move involving the clicked tower
    const validMoves = game.getValidMoves();

    // First try moves FROM the clicked tower (pick first valid destination)
    for (const move of validMoves) {
      if (move.from === clickedTower) {
        const newGame = game.move(move.direction);
        return { moved: !!newGame, newGame: newGame };
      }
    }

    // Then try moves TO the clicked tower (pick first valid source)
    for (const move of validMoves) {
      if (move.to === clickedTower) {
        const newGame = game.move(move.direction);
        return { moved: !!newGame, newGame: newGame };
      }
    }

    return { moved: false, newGame: null };
  }

  resizeCanvas(canvas, gameArea) {
    // Custom resize logic for Hanoi towers
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
        // Desktop: Optimize for tower layout (wider than tall)
        canvasWidth = Math.min(gameArea.clientWidth * 0.9, 1000);
        canvasHeight = Math.min(window.innerHeight * 0.7, 600);
      }
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  }
}