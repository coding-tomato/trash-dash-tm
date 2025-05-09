import React, { createContext, useContext, useState, useEffect } from 'react';
import Engine from '../game/Engine';

const GameContext = createContext();

export const useGameContext = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [gameEngine, setGameEngine] = useState(null);
  
  useEffect(() => {
    const engine = new Engine('game-container');
    setGameEngine(engine);
    
    return () => {
      if (engine) {
        engine.destroy();
      }
    };
  }, []);
  
  return (
    <GameContext.Provider value={gameEngine}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;