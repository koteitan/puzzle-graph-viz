// Global variables
let game;
let canvas;
let ctx;
let history = [];
let graphManager = null;

// Drawing parameters
const CELL_PADDING = 10;
const BOARD_WIDTH_RATIO = 0.3;
const ROD_WIDTH_RATIO = 0.6;

// Initialize on load
window.addEventListener('load', () => {
    canvas = document.getElementById('board');
    ctx = canvas.getContext('2d');
    
    game = new Game();
    game.init();
    
    // Initialize graph manager
    graphManager = new GraphManager();
    graphManager.init(document.getElementById('graph'), new Solver());
    
    resizeCanvas();
    draw();
    
    // Event listeners
    canvas.addEventListener('click', handleCanvasClick);
    document.getElementById('undoButton').addEventListener('click', handleUndo);
    document.getElementById('resetButton').addEventListener('click', handleReset);
    document.getElementById('solverButton').addEventListener('click', handleSolver);
    window.addEventListener('resize', () => {
        resizeCanvas();
        draw();
    });
});

function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    const maxWidth = gameArea.clientWidth * 0.45;
    const maxHeight = window.innerHeight * 0.6;
    
    canvas.width = Math.min(maxWidth, 600);
    canvas.height = Math.min(maxHeight, 600);
    
    if (graphManager && graphManager.canvas) {
        graphManager.canvas.width = Math.min(maxWidth, 600);
        graphManager.canvas.height = Math.min(maxHeight, 600);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const boardWidth = canvas.width * BOARD_WIDTH_RATIO;
    const rodRadius = Math.min(canvas.width * ROD_WIDTH_RATIO, canvas.height * 0.4) / 2;
    
    // Draw rod on the left, board on the right
    drawRod(rodRadius + CELL_PADDING * 2, canvas.height / 2, rodRadius);
    drawBoard(canvas.width - boardWidth - CELL_PADDING, CELL_PADDING, boardWidth, canvas.height - 2 * CELL_PADDING);
    
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
        
        // Highlight movable cells
        const movable = getMovableCells();
        if (movable.includes(i)) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 5; 
            ctx.strokeRect(x + 2, cellY + 2, cellWidth - 4, cellHeight - 4);
        }
        
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
        
        // Highlight next movable sections
        const ismovable4 = game.checkmove(4); // Clockwise
        const ismovable5 = game.checkmove(5); // Counter-clockwise
        if (i === 1 && ismovable4 || i === 5 && ismovable5) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 5;
            ctx.stroke();
        }
        
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
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const boardWidth = canvas.width * BOARD_WIDTH_RATIO;
    const rodRadius = Math.min(canvas.width * ROD_WIDTH_RATIO, canvas.height * 0.4) / 2;
    const rodCenterX = rodRadius + CELL_PADDING * 2;  // Rod is now on the left
    const rodCenterY = canvas.height / 2;
    const boardX = canvas.width - boardWidth - CELL_PADDING;  // Board is now on the right
    
    // Check if click is on rod (left side)
    if (x < rodCenterX + rodRadius) {
        handleRodClick(x, y, rodCenterX, rodCenterY, rodRadius);
    }
    // Check if click is on board (right side)
    else if (x >= boardX) {
        handleBoardClick(x, y, boardX);
    }
}

function handleBoardClick(x, y, boardX) {
    const boardWidth = canvas.width * BOARD_WIDTH_RATIO;
    const cellHeight = (canvas.height - 2 * CELL_PADDING) / 6;
    const blankIndex = findzero(game.board);
    
    // Check if click is within board bounds
    if (x < boardX || x > boardX + boardWidth) return;
    
    const clickedCell = Math.floor((y - CELL_PADDING) / cellHeight);
    
    if (clickedCell < 0 || clickedCell >= 6) return;
    
    // Save current state for undo
    const prevState = game.clone();
    let moved = false;
    
    // Try to move based on clicked cell position relative to blank
    if (clickedCell === blankIndex - 1 && game.checkmove(0)) {
        game = game.move(0);
        moved = true;
    } else if (clickedCell === blankIndex + 1 && game.checkmove(1)) {
        game = game.move(1);
        moved = true;
    } else if (clickedCell === blankIndex + 2 && game.checkmove(2)) {
        game = game.move(2);
        moved = true;
    } else if (clickedCell === blankIndex - 2 && game.checkmove(3)) {
        game = game.move(3);
        moved = true;
    }
    
    if (moved && game) {
        history.push(prevState);
        if (graphManager) {
            graphManager.updateCurrentState(game);
        }
        draw();
        checkGoal();
    }
}

function handleRodClick(x, y, centerX, centerY, radius) {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < radius) {
        let angle = Math.atan2(-dy, dx) * 180 / Math.PI;
        angle = (angle+90+30+360) % 360;
        const section = Math.floor(angle / 60);
        // Save current state for undo
        const prevState = game.clone();
         
        // Rotate to clicked section
        let move = -1;
        if (section === 1) {
            // Clockwise
            move = 4;
        } else if (section === 5) {
            // Counter-clockwise
            move = 5;
        }
        if(move!=-1){
            let game2 = game.move(move);
            if(game2) {
                game = game2;
                history.push(prevState);
                if (graphManager) {
                    graphManager.updateCurrentState(game);
                }
                draw();
            }
        }
        //console.log('angle =', angle, 'section=', section, 
        //  'game.move('+move+')', 'irod=', game.irod,
        //  'rod=', rodtable[game.irod]);
    }
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

function handleSolver() {
    if (graphManager) {
        graphManager.startSolver(game);
    }
}
