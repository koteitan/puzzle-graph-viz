# Module Dependency Analysis for Iwahswap

## Legend
- (1) **Should be**: Whether the item should be iwahswap-specific or generic
  - "Iwahswap" = Should be specific to Iwahswap puzzle
  - "Generic" = Should be a reusable common module
- (2) **Currently is**: Current implementation state
  - "Iwahswap" = Contains iwahswap-specific implementation
  - "Generic" = Generic implementation without iwahswap dependencies

## Functions

| File | Function/Method | (1) Should be | (2) Currently is |
|------|----------------|---------------|------------------|
| **iwahswap.js** | | | |
| iwahswap.js | Game (constructor) | Iwahswap | Iwahswap |
| iwahswap.js | Game.prototype.init | Iwahswap | Iwahswap |
| iwahswap.js | Game.prototype.clone | Generic | Generic |
| iwahswap.js | Game.prototype.move | Iwahswap | Iwahswap |
| iwahswap.js | Game.prototype.checkmove | Iwahswap | Iwahswap |
| iwahswap.js | Game.prototype.hash | Generic | Generic |
| iwahswap.js | Game.prototype.isGoal | Iwahswap | Iwahswap |
| iwahswap.js | rod2i | Iwahswap | Iwahswap |
| iwahswap.js | findzero | Iwahswap | Iwahswap |
| **solver.js** | | | |
| solver.js | GraphNode (constructor) | Generic | Generic |
| solver.js | Solver (constructor) | Generic | Generic |
| solver.js | Solver.prototype.init | Generic | Generic |
| solver.js | Solver.prototype.step | Generic | Iwahswap (uses game.move, game.isGoal) |
| solver.js | Solver.prototype.run | Generic | Generic |
| solver.js | Solver.prototype.updateCurrentState | Generic | Generic |
| solver.js | Solver.prototype.addNextVisibleNodes | Generic | Generic |
| solver.js | Solver.prototype.addNextVisibleNode | Generic | Generic |
| solver.js | Solver.prototype.calculateGoalCounts | Generic | Generic |
| solver.js | Solver.prototype.backtrack_edgefrom | Generic | Generic |
| **graph.js** | | | |
| graph.js | GraphManager (constructor) | Generic | Generic |
| graph.js | GraphManager.prototype.init | Generic | Generic |
| graph.js | GraphManager.prototype.setupMouseEvents | Generic | Generic |
| graph.js | GraphManager.prototype.setupTouchEvents | Generic | Generic |
| graph.js | GraphManager.prototype.startSolver | Generic | Generic |
| graph.js | GraphManager.prototype.draw | Generic | Iwahswap (uses rodtable, label2color) |
| graph.js | GraphManager.prototype.updatePhysics | Generic | Generic |
| graph.js | GraphManager.prototype.updateCurrentState | Generic | Generic |
| graph.js | GraphManager.prototype.setMode | Generic | Generic |
| graph.js | GraphManager.prototype.setJumpCallback | Generic | Generic |
| graph.js | GraphManager.prototype.calculateShortestPath | Generic | Generic |
| graph.js | GraphManager.prototype.clearShortestPath | Generic | Generic |
| graph.js | GraphManager.prototype.findNearestNode | Generic | Generic |
| **main.js** | | | |
| main.js | debugLog | Generic | Generic |
| main.js | resizeCanvas | Generic | Generic |
| main.js | draw | Iwahswap | Iwahswap |
| main.js | drawBoard | Iwahswap | Iwahswap |
| main.js | drawRod | Iwahswap | Iwahswap |
| main.js | drawHighlights | Iwahswap | Iwahswap |
| main.js | getMovableCells | Iwahswap | Iwahswap |
| main.js | handleCanvasClick | Iwahswap | Iwahswap |
| main.js | handleBoardClick | Iwahswap | Iwahswap |
| main.js | handleRodClick | Iwahswap | Iwahswap |
| main.js | handleUndo | Generic | Iwahswap (uses initboard) |
| main.js | handleReset | Generic | Iwahswap (uses Game.init) |
| main.js | checkGoal | Iwahswap | Iwahswap |
| main.js | handleGraph | Generic | Generic |
| main.js | handleSolver | Generic | Generic |
| main.js | handleJumpToggle | Generic | Generic |
| main.js | handleDragToggle | Generic | Generic |
| main.js | handleTouchStart | Generic | Generic |
| main.js | handleTouchEnd | Generic | Generic |

## Global Variables and Constants

| File | Variable/Constant | (1) Should be | (2) Currently is |
|------|------------------|---------------|------------------|
| **iwahswap.js** | | | |
| iwahswap.js | rodtable | Iwahswap | Iwahswap |
| iwahswap.js | ribtable | Iwahswap | Iwahswap |
| iwahswap.js | notchtable | Iwahswap | Iwahswap |
| iwahswap.js | label2color | Iwahswap | Iwahswap |
| iwahswap.js | initboard | Iwahswap | Iwahswap |
| iwahswap.js | goalboard | Iwahswap | Iwahswap |
| **main.js** | | | |
| main.js | game | Generic | Iwahswap (Game instance) |
| main.js | canvas | Generic | Generic |
| main.js | ctx | Generic | Generic |
| main.js | history | Generic | Generic |
| main.js | graphManager | Generic | Generic |
| main.js | debugTextarea | Generic | Generic |
| main.js | jumpMode | Generic | Generic |
| main.js | dragMode | Generic | Generic |
| main.js | solverMode | Generic | Generic |
| main.js | display_goal_count | Generic | Generic |
| main.js | nodesPerVisualizationCycle | Generic | Generic |
| main.js | CELL_PADDING | Iwahswap | Iwahswap |
| main.js | BOARD_WIDTH_RATIO | Iwahswap | Iwahswap |
| main.js | ROD_DIAMETER_RATIO | Iwahswap | Iwahswap |
| main.js | touchStartTime | Generic | Generic |
| main.js | touchStartX | Generic | Generic |
| main.js | touchStartY | Generic | Generic |

## Analysis Summary

### Current Structure Issues
1. **solver.js** is mostly generic but has some iwahswap dependencies:
   - `Solver.prototype.step` directly calls `game.move()` and `game.isGoal()`
   - Should use an interface or callback pattern for game operations

2. **graph.js** is mostly generic but has visual dependencies:
   - `GraphManager.prototype.draw` uses `rodtable` and `label2color` for node coloring
   - Should accept color mapping as a parameter or configuration

3. **main.js** mixes generic UI handling with iwahswap-specific drawing:
   - Touch/click handling infrastructure is generic
   - Drawing functions are iwahswap-specific
   - Should separate UI framework from game-specific rendering

### Recommended Refactoring for Multi-Puzzle Support

1. **Create Abstract Base Classes/Interfaces**:
   - `AbstractGame` - Define interface for any puzzle game
   - `AbstractRenderer` - Define interface for game visualization
   - `AbstractMove` - Define interface for game moves

2. **Module Separation**:
   ```
   /core/
     - solver.js (fully generic BFS solver)
     - graph.js (fully generic graph visualization)
     - ui.js (generic UI handling)

   /games/
     /iwahswap/
       - iwahswap.js (game logic)
       - iwahswap-renderer.js (visual representation)
       - iwahswap-config.js (constants and configuration)
   ```

3. **Interface Requirements for New Puzzles**:
   - Implement `move(direction)` method
   - Implement `isGoal()` method
   - Implement `hash()` method for state identification
   - Implement `clone()` method for state copying
   - Provide rendering configuration (colors, layout, etc.)