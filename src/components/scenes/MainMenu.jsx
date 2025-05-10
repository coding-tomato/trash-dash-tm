import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../contexts/GameContext';
import { CONFIG } from '../../config';

const MainMenu = () => {
  const gameEngine = useGameContext();
  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    if (!gameEngine) return;
    
    const handleLoadingAssets = (data) => {
      setLoadingAssets(data.loading);
    };
    
    // Add event listener for asset loading
    gameEngine.addEventListener("loadingAssets", handleLoadingAssets);
    
    // Clean up listener
    return () => {
      gameEngine.removeEventListener("loadingAssets", handleLoadingAssets);
    };
  }, [gameEngine]);

  const handleStartGame = () => {
    if (!gameEngine) return;
    
    setLoading(true);
    
    // Initialize the game engine if not already initialized
    if (!gameEngine.isInitialized) {
      gameEngine.init();
    }

    gameEngine.resetGame();
    gameEngine.resume();
    
    // Change the current scene to GAME
    gameEngine.setCurrentScene(CONFIG.SCENES.GAME);
    
    setLoading(false);
  };

  return (
    <div className="main-menu" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100%',
      background: 'linear-gradient(to bottom, #111122, #332244)',
      color: 'white',
      textAlign: 'center',
      zIndex: 1000,
    }}>
      <h1 style={{ 
        fontSize: '3rem', 
        marginBottom: '2rem',
        textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
      }}>
        Trash Dash!
      </h1>
      
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto 2rem',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px'
      }}>
        <p style={{ marginBottom: '1rem' }}>
          Help clean up the environment by collecting trash! 
          Use arrow key combos to sort different types of waste.
        </p>
      </div>
      
      <button
        onClick={handleStartGame}
        disabled={loading || loadingAssets}
        style={{
          padding: '15px 30px',
          fontSize: '1.2rem',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: (loading || loadingAssets) ? 'wait' : 'pointer',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.1s, box-shadow 0.1s'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)'}
        onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)'}
      >
        {loadingAssets ? 'Loading Assets...' : loading ? 'Loading...' : 'Start Game'}
      </button>
      
      {loadingAssets && (
        <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          Pre-loading 3D models for smoother gameplay...
        </div>
      )}
    </div>
  );
};

export default MainMenu;