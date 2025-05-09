import React from 'react';
import GameContainer from './GameContainer';
import GameHUD from './GameHUD';
import GameControls from './GameControls';
import { GameProvider } from '../contexts/GameContext';

const Game = () => {
  return (
    <GameProvider>
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden'
      }}>
        <GameContainer />
        <GameHUD />
        <GameControls />
      </div>
    </GameProvider>
  );
};

export default Game;