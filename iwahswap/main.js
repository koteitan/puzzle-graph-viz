/**
 * Main UI Controller for Puzzle Graph Visualizer
 *
 * This is the Iwahswap-specific main.js file.
 * For new puzzles, use ui.js (the generic UI controller) instead.
 *
 * This file uses ui.js for common functionality.
 */

window.addEventListener('load', () => {
    game = new IwahswapGame();
    game.init();
    renderer = new IwahswapRenderer();

    initUIController();
});
