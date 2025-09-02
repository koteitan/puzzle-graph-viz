// Global variables
let game;
let canvas;
let ctx;
let history = [];

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
    
    resizeCanvas();
    draw();
    
    // Event listeners
    canvas.addEventListener('click', handleCanvasClick);
    document.getElementById('undoButton').addEventListener('click', handleUndo);
    document.getElementById('resetButton').addEventListener('click', handleReset);
    window.addEventListener('resize', () => {
        resizeCanvas();
        draw();
    });
});

function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const maxWidth = container.clientWidth * 0.9;
    const maxHeight = window.innerHeight * 0.6;
    
    canvas.width = Math.min(maxWidth, 800);
    canvas.height = Math.min(maxHeight, 600);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const boardWidth = canvas.width * BOARD_WIDTH_RATIO;
    const rodRadius = Math.min(canvas.width * ROD_WIDTH_RATIO, canvas.height * 0.4) / 2;
    
    // Draw rod on the left, board on the right
    drawRod(rodRadius + CELL_PADDING * 2, canvas.height / 2, rodRadius);
    drawBoard(canvas.width - boardWidth - CELL_PADDING, CELL_PADDING, boardWidth, canvas.height - 2 * CELL_PADDING);
}

function drawBoard(x, y, width, height) {
    const cellHeight = height / 6;
    const cellWidth = width;
    
    for (let i = 0; i < 6; i++) {
        const cellY = y + i * cellHeight;
        const piece = game.board[i];
        
        // Draw cell background
        ctx.fillStyle = piece2color[piece];
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
        ctx.fillStyle = getRodColor(value);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Highlight next movable sections
        if (i === 1 || i === 5) {
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
        
        ctx.fillText(value.toString(), Math.round(sx), Math.round(sy));
        ctx.restore();

        console.log('i=',i);
        console.log('rodIndex=',rodIndex);
        console.log('vrod=',value);
        console.log('(wx,wy)=(',canvas.width,',',canvas.height,')');
        console.log('(cx,cy)=(',centerX,',',centerY,')');
        console.log('(sx,sy)=(',sx,',',sy,')');
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

function getRodColor(value) {
    const colors = {
        '-4': '#8b4513',
        '-3': '#d2691e',
        '-2': '#daa520',
        '1': '#32cd32',
        '2': '#00ced1',
        '3': '#4169e1'
    };
    return colors[value] || '#888';
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
            game = game.move(move);
            history.push(prevState);
            draw();
        }
        console.log('angle =', angle, 'section=', section, 
          'game.move('+move+')', 'irod=', game.irod,
          'rod=', rodtable[game.irod]);
    }
}

function handleUndo() {
    if (history.length > 0) {
        game = history.pop();
        draw();
    }
}

function handleReset() {
    // Save current state for undo
    if (JSON.stringify(game.board) !== JSON.stringify(initboard)) {
        history.push(game.clone());
    }
    
    game.init();
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
