/**
 * Main UI Controller for Puzzle Graph Visualizer
 *
 * This is the Hanoi-specific main.js file.
 * For new puzzles, use ui.js (the generic UI controller) instead.
 *
 * This file uses ui.js for common functionality and adds Hanoi-specific behavior.
 */

window.addEventListener('load', () => {
    game = new HanoiGame();
    game.init();
    renderer = new HanoiRenderer();

    initUIController();

    // Hanoi-specific: reset selection on undo/reset
    document.getElementById('undoButton').addEventListener('click', () => {
        renderer.selectedTower = -1;
    });
    document.getElementById('resetButton').addEventListener('click', () => {
        renderer.selectedTower = -1;
    });
});
