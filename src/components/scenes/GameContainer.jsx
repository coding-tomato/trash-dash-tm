import React, { useEffect, useRef } from 'react';
import { useGameContext } from '../../contexts/GameContext';

const GameContainer = () => {
  const containerRef = useRef(null);
  const gameEngine = useGameContext();
  
  useEffect(() => {
    if (containerRef.current && gameEngine) {
      if (!gameEngine.isInitialized) {
        gameEngine.init();
      } else if (gameEngine.animationId === null) {
        gameEngine.resume();
      }
    }
  }, [gameEngine]);
  
  return (
    <div 
      id="game-container" 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '500px', 
        backgroundColor: '#000',
        position: 'relative'
      }}
    />
  );
};

export default GameContainer;