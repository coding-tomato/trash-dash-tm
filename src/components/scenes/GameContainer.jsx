import React, { useEffect, useRef, useState } from 'react';
import { useGameContext } from '../../contexts/GameContext';

const GameContainer = () => {
  const containerRef = useRef(null);
  const gameEngine = useGameContext();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    if (containerRef.current && gameEngine) {
      if (!gameEngine.isInitialized) {
        gameEngine.init();
        setIsInitialLoad(false);
      } else if (gameEngine.animationId === null && isInitialLoad) {
        // Only auto-resume on initial load, not when manually paused
        gameEngine.resume();
        setIsInitialLoad(false);
      }
    }
  }, [gameEngine, isInitialLoad]);
  
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