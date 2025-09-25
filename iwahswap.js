// IwahswapGame - Iwahswap puzzle implementation
class IwahswapGame extends AbstractGame {
  constructor() {
    super();
    this.board = null;
    this.irod = null;
  }
}
const rodtable=[-4,-3,-2,1,2,3];
const ribtable=[
//-4-3-2 1 2 3
  [0,0,0,0,1,1], // 0
  [0,0,0,0,0,2], // 1
  [0,0,0,0,0,0], // 2
  [3,0,0,0,0,0], // 3
  [2,2,0,0,0,0], // 4
  [1,1,1,0,0,0], // 5
];
const notchtable=[
//-4-3-2 1 2 3
  [0,0,0,0,0,0], // 0
  [4,3,2,1,0,0], // 1
  [0,0,0,1,0,0], // 2
  [0,0,2,1,2,0], // 3
  [0,0,0,1,0,3], // 4
  [0,0,0,0,0,0], // 5
];
const label2color=[
  "black", // 0 (empty)
  "red",   // 1
  "orange",// 2
  "yellow",// 3
  "green", // 4
  "blue",  // 5
];
const initboard=[0,1,2,3,4,5];
const goalboard=[0,5,4,3,2,1];
const rod2i=function(rod) {
  for (var i = 0; i < rodtable.length; i++) {
    if (rodtable[i] == rod) return i;
  }
  return -1;
}
const findzero=function(board) {
  for (var i = 0; i < board.length; i++) {
    if (board[i] == 0) return i;
  }
  return -1;
}
IwahswapGame.prototype.init = function() {
  this.irod = rod2i(1);
  this.board = new Array(6);
  for (var i = 0; i < this.board.length; i++) {
    this.board[i] = i;
  }
}
IwahswapGame.prototype.clone = function() {
  let g = new IwahswapGame();
  g.nmove = this.nmove;
  g.irod = this.irod;
  g.board = this.board.slice(0);
  return g;
}
IwahswapGame.prototype.move = function(dir) {
  const b0 = this.board;   /* original board */
  const y0 = findzero(b0); /* position of zero */
  let game;
  let x;
  let y;
  let piece;
  let ribpiece;
  switch(dir) {
    case 0: /* move piece down --------------------------- */
      if(y0 <= 0) return 0; /* 0 is at the top */
      const src = y0-1;
      const dst = y0;
      if(ribtable[src][this.irod]!=0) return 0; /* blocked by rib */
      if(ribtable[dst][this.irod]!=0) return 0; /* blocked by rib */
      game = this.clone();
      game.board[dst] = b0[src];
      game.board[src] = 0;
      return game;
    case 1: /* move piece up ------------------------- */
      if(y0 >= b0.length-1) return 0; /* 0 is at the bottom */
      const src2 = y0+1;
      const dst2 = y0;
      if(ribtable[src2][this.irod]!=0) return 0; /* blocked by rib */
      if(ribtable[dst2][this.irod]!=0) return 0; /* blocked by rib */
      game = this.clone();
      game.board[dst2] = b0[src2];
      game.board[src2] = 0;
      return game;
    case 2: /* swap up ------------------------- */
      if(y0 >= b0.length-2) return 0;
      x     = this.irod;
      y     = y0+1;
      piece = b0[y];
      if(notchtable[y][x]!=piece) return 0;
      game = this.clone();
      game.board[y0  ] = b0[y0+2];
      game.board[y0+2] = 0;
      return game;
    case 3: /* swap down ----------------------- */
      if(y0 <= 1) return 0;
      x     = this.irod;
      y     = y0-1;
      piece = b0[y];
      if(notchtable[y][x]!=piece) return 0;
      game = this.clone();
      game.board[y0  ] = b0[y0-2];
      game.board[y0-2] = 0;
      return game;
    case 4: /* rod up -------------------------- */
      x = (this.irod + 1 + 6)%6;
      for(y=0;y<6;y++){
        piece = b0[y];
        ribpiece = ribtable[y][x];
        if(piece!=0 && ribpiece!=0 && piece!=ribpiece) return 0;
      }
      game = this.clone();
      game.irod = x;
      return game;
    case 5: /* rod down ------------------------ */
      x = (this.irod - 1 + 6)%6;
      for(y=0;y<6;y++){
        piece = b0[y];
        ribpiece = ribtable[y][x];
        if(piece!=0 && ribpiece!=0 && piece!=ribpiece) return 0;
      }
      game = this.clone();
      game.irod = x;
      return game;
  }
}
IwahswapGame.prototype.checkmove = function(dir) {
  let game2 = this.move(dir);
  return (game2 != 0);
}

IwahswapGame.prototype.hash = function() {
  return this.board.join(',') + '-' + this.irod;
}

IwahswapGame.prototype.isGoal = function() {
  for (let i = 0; i < 6; i++) {
    if (this.board[i] !== goalboard[i]) {
      return false;
    }
  }
  return true;
}

// Additional methods for AbstractGame interface
IwahswapGame.prototype.getNumDirections = function() {
  return 6; // Iwahswap has 6 possible move directions
}

IwahswapGame.prototype.getColorConfig = function() {
  return {
    nodeColor: (game) => {
      // Color based on rod position
      const rodValue = Math.abs(rodtable[game.irod]);
      return label2color[rodValue];
    },
    edgeColor: (direction) => {
      if (direction === 2 || direction === 3) {
        return 'rgba(0, 150, 255, 0.8)'; // Blue for piece jumps
      } else if (direction === 4 || direction === 5) {
        return 'rgba(255, 255, 0, 0.8)'; // Yellow for rod rotations
      } else {
        return 'rgba(255, 255, 255, 0.3)'; // White for normal moves
      }
    }
  };
}
