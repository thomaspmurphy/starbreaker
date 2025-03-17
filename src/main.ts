import { Game } from './game/Game';

function init() {
    const game = new Game();
    game.start();
}

if (typeof window !== 'undefined') {
    init();
}
