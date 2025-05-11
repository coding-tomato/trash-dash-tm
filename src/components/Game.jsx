import React from 'react';
import GameContainer from './scenes/GameContainer';
import GameHUD from './scenes/GameHUD';
import { GameProvider } from '../contexts/GameContext';
import MobileEvent from './MobileEvent';

const Game = () => {
  return (
    <GameProvider>
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden'
      }}>
        <MobileEvent />
        <GameContainer />
        <GameHUD />
      </div>
    </GameProvider>
  );
};

export default Game;