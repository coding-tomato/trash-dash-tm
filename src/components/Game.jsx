import React from 'react';
import GameContainer from './views/GameContainer';
import GameUI from './views/GameUI';
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
        <GameUI />
      </div>
    </GameProvider>
  );
};

export default Game;