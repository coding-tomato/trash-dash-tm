import React, { useCallback, useEffect, useState } from 'react';
import { useGameContext } from '../../contexts/GameContext';

const GameControls = () => {
  const gameEngine = useGameContext();
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    if (!gameEngine) return;
    
    // Event listeners to update local component state
    const handleGamePaused = () => setIsPlaying(false);
    const handleGameResumed = () => setIsPlaying(true);
    const handleGameReset = () => setIsPlaying(false);
    const handleStateChange = (newState) => {
      if (newState.isPlaying !== undefined) {
        setIsPlaying(newState.isPlaying);
      }
    };
    
    // Add event listeners
    gameEngine.addEventListener('gamePaused', handleGamePaused);
    gameEngine.addEventListener('gameResumed', handleGameResumed);
    gameEngine.addEventListener('gameReset', handleGameReset);
    gameEngine.addEventListener('stateChange', handleStateChange);
    
    // Initial state sync
    if (gameEngine.getGameState) {
      const state = gameEngine.getGameState();
      setIsPlaying(state.isPlaying);
    }
    
    // Clean up listeners on unmount
    return () => {
      gameEngine.removeEventListener('gamePaused', handleGamePaused);
      gameEngine.removeEventListener('gameResumed', handleGameResumed);
      gameEngine.removeEventListener('gameReset', handleGameReset);
      gameEngine.removeEventListener('stateChange', handleStateChange);
    };
  }, [gameEngine]);
  
  const handlePauseClick = useCallback(() => {
    if (gameEngine) gameEngine.pause();
  }, [gameEngine]);
  
  const handleStartClick = useCallback(() => {
    if (gameEngine) {
      if (!gameEngine.isInitialized) {
        gameEngine.init();
      } else {
        gameEngine.resume();
      }
    }
  }, [gameEngine]);

  const handleResetClick = useCallback(() => {
    if (gameEngine) gameEngine.resetGame();
  }, [gameEngine]);
  
  return (
    <div className="game-controls" style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '10px',
    }}>
      {!isPlaying ? (
        <button 
          onClick={handleStartClick}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Start Game
        </button>
      ) : (
        <button 
          onClick={handlePauseClick}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Pause
        </button>
      )}

      <button 
        onClick={handleResetClick}
        style={{
          padding: '10px 20px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Reset Game
      </button>
      
      {/* Instructions text */}
      <div style={{ 
        position: 'absolute', 
        bottom: '60px', 
        textAlign: 'center', 
        color: 'white', 
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '10px',
        borderRadius: '4px',
        width: '300px',
        left: '50%',
        transform: 'translateX(-50%)'
      }}>
        {isPlaying && (
          <p>Use arrow keys ↑ ↓ ← → in combinations to categorise the trash</p>
        )}
      </div>
    </div>
  );
};

export default GameControls;