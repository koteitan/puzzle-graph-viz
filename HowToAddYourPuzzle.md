# How to Have AI Add Your Puzzle

If you're using an AI assistant to add your puzzle, you can use this prompt:

```
Please read the "How to Add Your Puzzle" section below and add a new puzzle called [YOUR_PUZZLE_NAME].
```

# How to Add Your Puzzle

This framework allows you to easily add new puzzles to the system. Each puzzle consists of a game logic class and a renderer class that extend the abstract base classes.

## Quick Start

1. **Create a new directory** for your puzzle (e.g., `mypuzzle/`)

2. **Implement AbstractGame** (`mypuzzle/mypuzzle.js`):
   ```javascript
   class MyPuzzleGame extends AbstractGame {
     init() {
       /* Initialize game state to starting position */
     }

     clone() {
       /* Return deep copy of this game instance */
     }

     move(direction) {
       /* Execute move in given direction (integer 0 to getNumDirections()-1)
        * Returns: new game state if move is valid, null if invalid */
     }

     checkmove(direction) {
       /* Check if move is valid without executing it
        * Params: direction (integer) - move direction to check
        * Returns: boolean - true if move is valid */
     }

     hash() {
       /* Return unique string representation of current game state
        * Returns: string - must be unique for each different game state */
     }

     isGoal() {
       /* Check if current state is the goal/solved state
        * Returns: boolean - true if puzzle is solved */
     }

     getNumDirections() {
       /* Return total number of possible move directions
        * Returns: integer - should match the range used in move(direction) */
     }

     getColorConfig() {
       /* Return object with coloring functions for graph visualization
        * Returns: {nodeColor: (game) => string, edgeColor: (direction) => string} */
     }
   }
   ```

3. **Implement AbstractRenderer** (`mypuzzle/mypuzzle-renderer.js`):
   ```javascript
   class MyPuzzleRenderer extends AbstractRenderer {
     draw(canvas, ctx, game) {
       /* Draw current game state on canvas
        * Params: canvas (HTMLCanvasElement), ctx (CanvasRenderingContext2D), game (AbstractGame instance) */
     }

     handleCanvasClick(event, game, canvas) {
       /* Handle user mouse/touch clicks on canvas
        * Params: event (MouseEvent/TouchEvent), game (AbstractGame instance), canvas (HTMLCanvasElement)
        * Returns: {moved: boolean, newGame: AbstractGame|null, selectionChanged: boolean} */
     }

     resizeCanvas(canvas, gameArea) {
       /* Optional: custom canvas sizing logic
        * Params: canvas (HTMLCanvasElement), gameArea (HTMLElement)
        * Default implementation available in AbstractRenderer */
     }
   }
   ```

4. **Copy main.js** to `mypuzzle/main.js` and modify it for your puzzle:
   ```javascript
   window.addEventListener('load', () => {
       game = new MyPuzzleGame();
       game.init();
       renderer = new MyPuzzleRenderer();
   ```

5. **Copy index.html** from `hanoi/index.html` to `mypuzzle/index.html`) and modify it to include your scripts:
   ```html
   <script src="../abstract-game.js"></script>
   <script src="../abstract-renderer.js"></script>
   <script src="mypuzzle.js"></script>
   <script src="mypuzzle-renderer.js"></script>
   <script src="../solver.js"></script>
   <script src="../graph.js"></script>
   <script src="../ui-controller.js"></script>
   <script src="main.js"></script>
   ```

## Architecture

### Shared Components

- **AbstractGame**: Defines the puzzle logic interface (in root directory)
- **AbstractRenderer**: Handles drawing and user interaction (in root directory)
- **Solver**: Generic BFS solver that works with any AbstractGame (in root directory)
- **GraphManager**: Visualizes state space as interactive graph (in root directory)
- **UIController**: Manages all common UI interactions (in root directory)
  - Global variables (game, renderer, canvas, ctx, history, graphManager, etc.)
  - Button handlers (undo, reset, graph, solver, jump, drag)
  - Canvas click handling and touch events
  - `initUIController()`: Initializes all UI components (called from puzzle's main.js)

### Key Methods

#### Game Logic
- `move(direction)`: **Core game mechanics**
  - `direction` (integer): Move direction from 0 to getNumDirections()-1
  - Returns: new game state if valid move, null if invalid
- `hash()`: **State identification**
  - Returns: unique string for each game state (used for graph nodes)
  - Must be consistent: same state = same hash
- `getColorConfig()`: **Graph visualization colors**
  - Returns: `{nodeColor: (game) => string, edgeColor: (direction) => string}`
  - `nodeColor` function receives game instance, returns CSS color
  - `edgeColor` function receives direction integer, returns CSS color

#### Renderer
- `draw(canvas, ctx, game)`: **Visual rendering**
  - Renders current game state on canvas using 2D context
- `handleCanvasClick(event, game, canvas)`: **User interaction**
  - Processes mouse/touch clicks and returns action result
  - Returns: `{moved: boolean, newGame: Game|null, selectionChanged: boolean}`
  - `moved`: true if a valid move was executed
  - `newGame`: new game state after move (if moved=true)
  - `selectionChanged`: true if UI selection state changed (for multi-click systems)

### Graph Visualization

The framework automatically creates interactive force-directed graphs showing:
- **Nodes**: Game states (colored by your `nodeColor` function)
- **Edges**: Valid moves (colored by your `edgeColor` function)
- **Physics**: Nodes repel, connected nodes attract
- **Interaction**: Jump to states, drag nodes around

## Examples

See the existing implementations:
- **Iwahswap**: Complex sliding puzzle with rod mechanism
- **Hanoi Tower**: Classic recursive puzzle

## File Structure

```
./                          # Root directory (shared files)
├── abstract-game.js        # Abstract game class
├── abstract-renderer.js    # Abstract renderer class
├── solver.js               # BFS solver
├── graph.js                # Graph visualization
├── ui-controller.js        # Common UI controller
├── index.html              # Main puzzle list page
│
└── your-puzzle/            # Your puzzle directory
    ├── index.html          # Puzzle page (includes scripts in correct order)
    ├── style.css           # Puzzle-specific styling
    ├── your-puzzle.js      # Game logic (extends AbstractGame)
    ├── your-puzzle-renderer.js # Renderer (extends AbstractRenderer)
    └── main.js             # Puzzle initialization (5-15 lines)
```

### Script Loading Order in HTML

**Critical**: Scripts must be loaded in this exact order:
1. `abstract-game.js` - Base game class
2. `abstract-renderer.js` - Base renderer class
3. `your-puzzle.js` - Your game implementation
4. `your-puzzle-renderer.js` - Your renderer implementation
5. `solver.js` - Solver algorithm
6. `graph.js` - Graph visualization
7. `ui-controller.js` - **Must come before main.js**
8. `main.js` - Your puzzle initialization

## Tips

1. **State Representation**: Use simple data structures for game state
2. **Move Encoding**: Number your moves 0 to N-1 consistently
3. **Hash Function**: Ensure different states have different hashes
4. **Color Coding**: Use meaningful colors for visualization
5. **Click Handling**: Support both direct moves and 2-click selection
6. **Keep main.js Minimal**: All common UI logic is in ui-controller.js - only add puzzle-specific handlers in main.js

The framework handles all the complex parts (BFS solving, graph physics, UI controls) - you just focus on your puzzle's unique logic!
