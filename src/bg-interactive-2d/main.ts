
import { AUTO, Game } from 'phaser';
import { Game as MainGame } from './scenes/game';
import { Boot } from './scenes/boot';
import { Preloader } from './scenes/preloader';
import { MainMenu } from './scenes/main-menu';
import { GameOver } from './scenes/gameover';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver
    ]
};

const StartGame = (parent) => {

    return new Game({ ...config, parent });

}

export default StartGame;