import React, { useCallback, useEffect, useState } from "react";
import { useGameContext } from "../../contexts/GameContext";
import { CONFIG } from "../../config";

const GameControls = () => {
  const gameEngine = useGameContext();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!gameEngine) return;

    // Event listeners to update local component state
    const handleGameReset = () => setIsPlaying(false);
    const handleStateChange = (newState) => {
      if (newState.isPlaying !== undefined) {
        setIsPlaying(newState.isPlaying);
      }
    };

    // Add event listeners
    gameEngine.addEventListener("gameReset", handleGameReset);
    gameEngine.addEventListener("stateChange", handleStateChange);

    // Initial state sync
    if (gameEngine.getGameState) {
      const state = gameEngine.getGameState();
      setIsPlaying(state.isPlaying);
    }

    // Clean up listeners on unmount
    return () => {
      gameEngine.removeEventListener("gameReset", handleGameReset);
      gameEngine.removeEventListener("stateChange", handleStateChange);
    };
  }, [gameEngine]);

  const handleResetClick = useCallback(() => {
    if (gameEngine) gameEngine.resetGame();
  }, [gameEngine]);

  return (
    <div
      className="game-controls"
      style={{
        position: "absolute",
        bottom: "20px",
        right: "0.5rem",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "10px",
      }}
    >
      {CONFIG.SHOW_DEBUG && (
        <button
          onClick={handleResetClick}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reiniciar Juego
        </button>
      )}
    </div>
  );
};

export default GameControls;
