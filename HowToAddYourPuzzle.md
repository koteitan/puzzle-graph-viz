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

4. **Create HTML file** (`mypuzzle/index.html`) following the pattern of existing puzzles

5. **Update main index.html** to add your puzzle to the grid

## Architecture

### Abstract Classes

- **AbstractGame**: Defines the puzzle logic interface
- **AbstractRenderer**: Handles drawing and user interaction
- **Solver**: Generic BFS solver that works with any AbstractGame
- **GraphManager**: Visualizes state space as interactive graph

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
your-puzzle/
├── index.html              # Main page
├── style.css               # Styling
├── your-puzzle.js          # Game logic (extends AbstractGame)
├── your-puzzle-renderer.js # Renderer (extends AbstractRenderer)
├── main.js                 # UI handling (copy from existing puzzle)
└── [shared files]          # Abstract classes, solver, graph manager
```

## Tips

1. **State Representation**: Use simple data structures for game state
2. **Move Encoding**: Number your moves 0 to N-1 consistently
3. **Hash Function**: Ensure different states have different hashes
4. **Color Coding**: Use meaningful colors for visualization
5. **Click Handling**: Support both direct moves and 2-click selection

The framework handles all the complex parts (BFS solving, graph physics, UI controls) - you just focus on your puzzle's unique logic!
