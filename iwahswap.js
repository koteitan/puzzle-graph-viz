Game = function() {
}
const rodtable=[-4,-3,-2,1,2,3];
const ribtable=[ //1=rib, 2=notch
  [0,2,0,1,1,1], // -4
  [0,2,0,0,1,1], // -3
  [0,2,0,2,0,1], // -2
  [0,2,2,2,2,0], // 1
  [1,0,0,2,0,0], // 2
  [1,1,0,0,2,0], // 3
];
const piece2color=[
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
Game.prototype.init = function() {
  this.irod = rod2i(1);
  this.board = new Array(6);
  for (var i = 0; i < this.board.length; i++) {
    this.board[i] = i;
  }
}
Game.prototype.clone = function() {
  let g = new Game();
  g.nmove = this.nmove;
  g.irod = this.irod;
  g.board = this.board.slice(0);
  return g;
}
Game.prototype.move = function(dir) {
  const b0 = this.board; 
  const i0 = findzero(b0);
  let game;
  switch(dir) {
    case 0: /* up 0 --------------------------- */
      if(i0 <= 0) return 0;
      game = this.clone();
      game.board[i0  ] = b0[i0-1];
      game.board[i0-1] = 0;
      return game;
    case 1: /* down 0 ------------------------- */
      if(i0 >= b0.length-1) return 0;
      game = this.clone();
      game.board[i0  ] = b0[i0+1];
      game.board[i0+1] = 0;
      return game;
    case 2: /* swap up ------------------------- */
      if(i0 >= b0.length-2) return 0;
      if(ribtable[this.irod][b0[i0+1]]!=2) return 0;
      game = this.clone();
      game.board[i0  ] = b0[i0+2];
      game.board[i0+2] = 0;
      return game;
    case 3: /* swap down ----------------------- */
      if(i0 <= 1) return 0;
      if(ribtable[this.irod][b0[i0-1]]!=2) return 0;
      game = this.clone();
      game.board[i0  ] = b0[i0-2];
      game.board[i0-2] = 0;
      return game;
    case 4: /* rod up -------------------------- */
      if(ribtable[this.irod+1][b0[i0]]!=1) return 0;
      game = this.clone();
      game.irod = (game.irod + 1 + 6)%6;
      return game;
    case 5: /* rod down ------------------------ */
      if(ribtable[this.irod-1][b0[i0]]!=1) return 0;
      game = this.clone();
      game.irod = (game.irod - 1 + 6)%6;
      return game;
  }
}
Game.prototype.checkmove = function(dir) {
  let game2 = this.move(dir);
  return (game2 != 0);
}
