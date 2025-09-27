window.addEventListener('load', () => {
    game = new IwahswapGame();
    game.init();
    renderer = new IwahswapRenderer();

    initUIController();
});