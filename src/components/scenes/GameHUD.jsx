import React, { useState, useEffect } from "react";
import { useGameContext } from "../../contexts/GameContext";
import MainMenu from "./MainMenu";
import ScoreScreen from "./ScoreScreen";
import { CONFIG } from "../../config";

const GameHUD = () => {
  const gameEngine = useGameContext();
  const [gameStats, setGameStats] = useState({
    currentScene: gameEngine?.getGameState()?.currentScene || "MAIN_MENU",
    level: 0,
    score: 0,
  });
  const [trashInstructions, setTrashInstructions] = useState({
    visible: false,
    type: null,
    requiredCombo: [],
  });

  useEffect(() => {
    if (!gameEngine) return;

    // Event listener for game state changes
    const handleStateChange = (newState) => {
      setGameStats((prevStats) => ({
        ...prevStats,
        currentScene: newState.currentScene ?? prevStats.currentScene,
        level: newState.level ?? prevStats.level,
        score: newState.score ?? prevStats.score,
      }));
    };

    const handleLevelUp = (newLevel) => {
      setGameStats((prevStats) => ({
        ...prevStats,
        level: newLevel,
      }));
    };

    // Event listener for collisions with trash
    const handleCollision = (data) => {
      setTrashInstructions({
        visible: true,
        type: data.type,
        requiredCombo: data.requiredCombo || [],
      });

      // Hide instructions after 5 seconds
      setTimeout(() => {
        setTrashInstructions((prev) => ({ ...prev, visible: false }));
      }, 2000);
    };

    // Event listener for successful trash disposal
    const handleTrashDisposed = (newData) => {
      setTrashInstructions((prev) => ({ ...prev, visible: false }));
      setGameStats((prevStats) => ({
        ...prevStats,
        score: newData.points,
      }));
    };

    // Add event listeners
    gameEngine.addEventListener("stateChange", handleStateChange);
    gameEngine.addEventListener("collision", handleCollision);
    gameEngine.addEventListener("trashDisposed", handleTrashDisposed);
    gameEngine.addEventListener("levelUp", handleLevelUp);

    // Initial state sync
    if (gameEngine.getGameState) {
      const state = gameEngine.getGameState();
      setGameStats((prevStats) => ({
        ...prevStats,
        score: state.score || 0,
      }));
    }

    // Clean up listener on unmount
    return () => {
      gameEngine.removeEventListener("stateChange", handleStateChange);
      gameEngine.removeEventListener("collision", handleCollision);
      gameEngine.removeEventListener("trashDisposed", handleTrashDisposed);
      gameEngine.removeEventListener("levelUp", handleLevelUp);
    };
  }, [gameEngine]);

  // Helper function to display key combination nicely
  const formatKeyCombo = (combo) => {
    if (!combo || !Array.isArray(combo)) return "";

    return combo
      .map((key) => {
        switch (key) {
          case "up":
            return "↑";
          case "down":
            return "↓";
          case "left":
            return "←";
          case "right":
            return "→";
          default:
            return key;
        }
      })
      .join(" ");
  };

  // Function to get the appropriate color for the trash type
  const getTrashColor = (type) => {
    switch (type) {
      case "glass":
        return "#88ccff";
      case "plastic":
        return "#ffcc99";
      case "metal":
        return "#aaaaaa";
      case "organic":
        return "#99cc66";
      default:
        return "white";
    }
  };

  // Function to get an emoji icon for each trash type
  const getTrashIcon = (type) => {
    switch (type) {
      case "glass":
        return "🍾"; // Bottle emoji
      case "plastic":
        return "🧴"; // Plastic bottle emoji
      case "metal":
        return "🥫"; // Can emoji
      case "organic":
        return "🍌"; // Banana emoji
      case "nonRecyclable":
        return "❌"; // Cross mark emoji
      default:
        return "🗑️"; // Generic trash emoji
    }
  };

  return (
    <div
      className="game-hud"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: "10px",
        display: "flex",
        justifyContent: "space-between",
        color: "white",
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        textShadow: "1px 1px 2px black",
      }}
    >
      <div>
        <div>Level: {gameStats.level}</div>
        <div>Score: {gameStats.score}</div>
      </div>

      {trashInstructions.type && (
        <div
          style={{
            position: "absolute",
            minHeight: "100px",
            top: "20px",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 15px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderRadius: "5px",
            textAlign: "center",
            border: `2px solid ${getTrashColor(trashInstructions.type)}`,
          }}
        >
          <div>
            <strong>
              {getTrashIcon(trashInstructions.type)} {trashInstructions.type.charAt(0).toUpperCase() + trashInstructions.type.slice(1)} Detected
            </strong>
          </div>
          <div>
            Press keys to dispose:{" "}
            {formatKeyCombo(trashInstructions.requiredCombo)}
          </div>
        </div>
      )}

      {gameStats.currentScene === CONFIG.SCENES.SCORE_SCREEN && <ScoreScreen />}
      {gameStats.currentScene === CONFIG.SCENES.MAIN_MENU && <MainMenu />}
    </div>
  );
};

export default GameHUD;
