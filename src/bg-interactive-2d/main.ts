
import { AUTO, Game } from 'phaser';
import { Game as MainGame } from './scenes/game';
import { Boot } from './scenes/boot';
import { Preloader } from './scenes/preloader';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#00ff00',
    scale: {
        // mode: Phaser.Scale.FIT,
        // autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        MainGame,
    ]
};

const StartGame = (parent) => {

    return new Game({ ...config, parent });

}

export default StartGame;