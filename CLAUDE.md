# purpose
- Please make a site for playing sliding puzzle game named Iwahswap.

# files
- index.html .... main page
- style.css ..... style sheet
- main.js ....... main UI behavior
- iwahswap.js ... game system
- \*.py ......... (no related to js)

# layout on index.html
- top: header
- middle:
  - top: 
    - left:canvas board
      - left: rod
      - right: board
    - right: graph board
  - bottom: buttons
    - top: undo button
    - medium: reset button
    - bottom: solver button
- bottom: footer

# components on index.html
- header ... Iwahswap simulator
- canvas board ... game board
  - board:
    - vertical 6 cells to put pieces
    - Game.board[i] is the index of piece on the cell i
    - piece2color[i] is the color of i th piece
    - the piece 1-5 are labeled with digits, piece 0 is blank
  - rod:
    - dial made by 6 pies
      - with the 6 digits of Game.rodtable[i]
      - Game.rodtable[i] is at the angle (i-Game.irod)*60-90 degree
        - right side is 0 degree
        - positive degree is counterclockwise
    - pivot:
      - triangle pointer to Game.irod
      - put below the dial
- undo button ... undo the last move (Game.undo())
- reset button ... reset the game to initial state (Game.init())
- solver button ... start solver (see below)
- address footer:
  - Iwahswap is a puzzle developed in a creative exchange between Iwahiro (Hirokazu Iwasawa), Goetz Schwandtner, Bram Cohen and Oscar van Deventer.
    - https://www.youtube.com/watch?v=3rFQOCd4fXE
    - https://twistypuzzles.com/forum/viewtopic.php?t=40126%29
  - Iwahswap Simulator is programmed by <a href="https://twitter.com/koteitan">koteitan</a>
  - Licensed under the MIT

# behavior on main.js
- onload ... initialize Game and draw
- onresize ... resize canvas and draw
- on click piece in the next cell of blank ... move the piece to blank by Game.move(0) or Game.move(1)
- on click piece in the next of the next cell of blank ... move the piece to blank through the next piece by Game.move(2) or Game.move(3)
- on click the cell on the dial in the next of the pivot ... rotate the dial to the cell by Game.move(4) or Game.move(5)
- on click undo button ... undo the last move:
  - enable infinite undo by history stack
  - reset button behavior can be undone as well
- on click reset button ... reset the game to initial state by Game.init()
- drawing after motion ... highlight the border of the next movable pieces and the rod pies.
- checking goal after motion ... if Game.board is equal to goalboard, alert "Goal!"

# memo of implementation
- don't git commit. I will git commit.
- Talk to me in Japanese.
- The languange of the code comments and site are English.

# solver and graph
- The solver explores the state space by breadth first search from the initial state and makes a graph of states.
- The graph consists of nodes.
- The nodes have edgelist, which is a list to the pointers to the nodes reachable by one move.
- The solver adds nodes to the graph until there is no new node to add.
- The solver adds the edges to the edgelist of the nodes.
- The edges are non-directional. Therefore, the edges are added to both nodes when a new node is added.
- The nodes has their type, start, goal, or normal.

# drawing of graph
- The graph is drawn on the right side of the canvas board.
- The nodes are drawn as circles.
- The edges are drawn as lines between the circles.
- The start node, goal node, normal nodes are drawn in green, red, white respectively.
- The graph has the physical engine to layout the nodes.
- The nodes repel each other.
- The nodes are attracted to the nodes in their edgelist.
- The node gravity center is always re-centered to the center of the graph area.
- The graph width and height are always resized with the canvas size.
- The graph structure and the physical positions are updated asynchronously and simaultaneously with the adding of nodes and edges by solver.

# game play and the graph
- The game state is marked by a circle on the node of the graph.

















