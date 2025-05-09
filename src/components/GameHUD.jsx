import React, { useState, useEffect } from 'react';
import { useGameContext } from '../contexts/GameContext';

const GameHUD = () => {
  const gameEngine = useGameContext();
  const [gameStats, setGameStats] = useState({
    level: 1,
    score: 0,
  });
  const [trashInstructions, setTrashInstructions] = useState({
    visible: false,
    type: null,
    requiredCombo: []
  });
  
  useEffect(() => {
    if (!gameEngine) return;
    
    // Event listener for game state changes
    const handleStateChange = (newState) => {
      setGameStats(prevStats => ({
        ...prevStats,
        score: newState.score ?? prevStats.score,
      }));
    };
    
    // Event listener for collisions with trash
    const handleCollision = (data) => {
      setTrashInstructions({
        visible: true,
        type: data.type,
        requiredCombo: data.requiredCombo || []
      });
      
      // Hide instructions after 5 seconds
      setTimeout(() => {
        setTrashInstructions(prev => ({...prev, visible: false}));
      }, 2000);
    };
    
    // Event listener for successful trash disposal
    const handleTrashDisposed = (data) => {
      setTrashInstructions(prev => ({...prev, visible: false}));
    };
    
    // Add event listeners
    gameEngine.addEventListener('stateChange', handleStateChange);
    gameEngine.addEventListener('collision', handleCollision);
    gameEngine.addEventListener('trashDisposed', handleTrashDisposed);
    
    // Initial state sync
    if (gameEngine.getGameState) {
      const state = gameEngine.getGameState();
      setGameStats({
        score: state.score || 0,
      });
    }
    
    // Clean up listener on unmount
    return () => {
      gameEngine.removeEventListener('stateChange', handleStateChange);
      gameEngine.removeEventListener('collision', handleCollision);
      gameEngine.removeEventListener('trashDisposed', handleTrashDisposed);
    };
  }, [gameEngine]);
  
  // Helper function to display key combination nicely
  const formatKeyCombo = (combo) => {
    if (!combo || !Array.isArray(combo)) return '';
    
    return combo.map(key => {
      switch(key) {
        case 'up': return '↑';
        case 'down': return '↓';
        case 'left': return '←';
        case 'right': return '→';
        default: return key;
      }
    }).join(' ');
  };
  
  return (
    <div className="game-hud" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '10px',
      display: 'flex',
      justifyContent: 'space-between',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      textShadow: '1px 1px 2px black',
      pointerEvents: 'none',
    }}>
      <div>
        <div>Score: {gameStats.score}</div>
      </div>
      
      {trashInstructions.type && (
        <div style={{
          position: 'absolute',
          top: '20px',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 15px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <div>
            <strong>Trash Detected: {trashInstructions.type}</strong>
          </div>
          <div>
            Press keys to dispose: {formatKeyCombo(trashInstructions.requiredCombo)}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHUD;