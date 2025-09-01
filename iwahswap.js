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
  switch(dir) {
    case 0: /* up 0 --------------------------- */
      if(i0 <= 0) return 0;
      let game0 = this.clone();
      for(var i = i0; i > 0; i--) {
        game0.board[i] = b0[i-1];
      }
      game0.board[0] = 0;
      return game0;
    case 1: /* down 0 ------------------------- */
      if(i0 >= b0.length-1) return 0;
      let game1 = this.clone();
      for(var i = i0; i < b0.length-1; i++) {
        game1.board[i] = b0[i+1];
      }
      game1.board[b0.length-1] = 0;
      return game1;
    case 2: /* swap up ------------------------- */
      if(i0 >= b0.length-2) return 0;
      if(ribtable[this.irod][b0[i0+1]]!=2) return 0;
      let game2 = this.clone();
      game2.board[i0  ] = b0[i0+2];
      game2.board[i0+2] = 0;
      return game2;
    case 3: /* swap down ----------------------- */
      if(i0 <= 1) return 0;
      if(ribtable[this.irod][b0[i0-1]]!=2) return 0;
      let game3 = this.clone();
      game3.board[i0  ] = b0[i0-2];
      game3.board[i0-2] = 0;
      return game3;
  }
}
Game.prototype.checkmove = function(dir) {
  const b0 = this.board; 
  const i0 = findzero(b0);
  switch(dir) {
    case 0: /* up 0 --------------------------- */
      if(i0 <= 0) return false;
      return true;
    case 1: /* down 0 ------------------------- */
      if(i0 >= b0.length-1) return false;
      return true;
    case 2: /* swap up ------------------------- */
      if(i0 >= b0.length-2) return false;
      if(ribtable[this.irod][b0[i0+1]]!=2) return false;
      return true;
    case 3: /* swap down ----------------------- */
      if(i0 <= 1) return false;
      if(ribtable[this.irod][b0[i0-1]]!=2) return false;
      return true;
  }
  return false;
}
