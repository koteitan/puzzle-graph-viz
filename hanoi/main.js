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