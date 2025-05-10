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
  // New state to track current key combination
  const [currentKeyCombo, setCurrentKeyCombo] = useState([]);

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

    // New event listener for key combinations
    const handleKeyCombo = (combo) => {
      setCurrentKeyCombo(combo);
    };

    // Event listener for collisions with trash
    const handleCollision = (data) => {
      // Add a hint for non-recyclable items
      const isNonRecyclable = data.type === "nonRecyclable";
      
      setTrashInstructions({
        visible: true,
        type: data.type,
        requiredCombo: data.requiredCombo || [],
        isNonRecyclable: isNonRecyclable, // Flag to indicate non-recyclable items
      });

      // Hide instructions after 5 seconds (longer for non-recyclables to let players read the hint)
      setTimeout(() => {
        setTrashInstructions((prev) => ({ ...prev, visible: false }));
      }, isNonRecyclable ? 3000 : 2000);
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
    gameEngine.addEventListener("keyCombo", handleKeyCombo); // Add listener for key combinations

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
      gameEngine.removeEventListener("keyCombo", handleKeyCombo); // Remove listener for key combinations
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

  // Traducción de tipos de basura
  const getTrashTypeLabel = (type) => {
    switch (type) {
      case "glass":
        return "Vidrio";
      case "plastic":
        return "Plástico";
      case "metal":
        return "Metal";
      case "organic":
        return "Orgánico";
      case "nonRecyclable":
        return "No reciclable";
      default:
        return "Basura";
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
        width: "100%",
        height: "100%",
      }}
    >
      <div>
        <div>Nivel: {gameStats.level}</div>
        <div>Puntaje: {gameStats.score}</div>
      </div>

      {trashInstructions.type && (
        <div
          style={{
            position: "absolute",
            top: 0,
            minHeight: "80px",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 15px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderRadius: "5px",
            textAlign: "center",
            fontSize: "16px",
            border: `2px solid ${getTrashColor(trashInstructions.type)}`,
          }}
        >
          <div>
            <strong>
              {getTrashIcon(trashInstructions.type)} {getTrashTypeLabel(trashInstructions.type)} detectado
            </strong>
          </div>
          {trashInstructions.isNonRecyclable && (
            <div style={{ 
              fontSize: "12px", 
              marginTop: "5px", 
              fontStyle: "italic",
              color: "#ff9999" 
            }}>
              <span>¿Seguro que no hay otra forma? 👀</span>
            </div>
          )}
        </div>
      )}

      {gameStats.currentScene === CONFIG.SCENES.SCORE_SCREEN && <ScoreScreen />}
      {gameStats.currentScene === CONFIG.SCENES.MAIN_MENU && <MainMenu />}

      {/* Current Key Combo Display */}
      {(gameStats.currentScene === CONFIG.SCENES.GAME) && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            height: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderRadius: "5px",
            padding: "10px 15px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "14px", marginBottom: "5px", color: "#aaaaaa" }}>
            Combinación actual:
          </div>
          <div style={{ 
            minHeight: "30px", 
            minWidth: "120px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "24px",
            letterSpacing: "8px"
          }}>
            {currentKeyCombo.length > 0 ? formatKeyCombo(currentKeyCombo) : "⋯"}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHUD;
