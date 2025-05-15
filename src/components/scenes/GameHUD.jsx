import React, { useState, useEffect, useCallback } from "react";
import { useGameContext } from "../../contexts/GameContext";
import MainMenu from "./MainMenu";
import ScoreScreen from "./ScoreScreen";
import { CONFIG } from "../../config";
import Combination from "../Combination";
import Arrow from "../Arrow";

const GameHUD = () => {
  const gameEngine = useGameContext();
  const [gameStats, setGameStats] = useState({
    currentScene: gameEngine?.getGameState()?.currentScene || "MAIN_MENU",
    score: 0,
    isPlaying: gameEngine?.getGameState()?.isPlaying || true,
  });
  const [trashInstructions, setTrashInstructions] = useState({
    visible: false,
    type: null,
    requiredCombo: [],
    modelName: null, // Add modelName to track the specific trash model
  });
  // New state to track current key combination
  const [currentKeyCombo, setCurrentKeyCombo] = useState([]);
  // State to toggle combinations visibility
  const [showCombinations, setShowCombinations] = useState(true);

  // Timer state for countdown
  const [secondsLeft, setSecondsLeft] = useState(120);
  const timerRef = React.useRef(null);

  // Handle pause and resume
  const togglePauseResume = useCallback(() => {
    if (!gameEngine) return;

    if (gameStats.isPlaying) {
      gameEngine.pause();
    } else {
      gameEngine.resume();
    }
  }, [gameEngine, gameStats.isPlaying]);

  // Listen for requestPause events
  useEffect(() => {
    if (!gameEngine) return;

    const handleRequestPause = () => {
      if (gameStats.currentScene === CONFIG.SCENES.GAME) {
        togglePauseResume();
      }
    };

    gameEngine.addEventListener("requestPause", handleRequestPause);

    return () => {
      gameEngine.removeEventListener("requestPause", handleRequestPause);
    };
  }, [gameEngine, gameStats.currentScene, togglePauseResume]);

  useEffect(() => {
    if (!gameEngine) return;

    // Event listener for game state changes
    const handleStateChange = (newState) => {
      setGameStats((prevStats) => ({
        ...prevStats,
        currentScene: newState.currentScene ?? prevStats.currentScene,
        score: newState.score ?? prevStats.score,
        isPlaying: newState.isPlaying ?? prevStats.isPlaying,
      }));
    };

    // Event listeners for pause/resume specifically
    const handleGamePaused = () => {
      setGameStats((prevStats) => ({
        ...prevStats,
        isPlaying: false,
      }));
    };

    const handleGameResumed = () => {
      setGameStats((prevStats) => ({
        ...prevStats,
        isPlaying: true,
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
        modelName: data.modelName || null, // Store the model name if available
      });

      // Hide instructions after 5 seconds (longer for non-recyclables to let players read the hint)
      setTimeout(
        () => {
          setTrashInstructions((prev) => ({ ...prev, visible: false }));
        },
        isNonRecyclable ? 3000 : 2000
      );
    };

    // Event listener for successful trash disposal
    const handleTrashDisposed = (newData) => {
      setTrashInstructions((prev) => ({ ...prev, visible: false }));
      setGameStats((prevStats) => ({
        ...prevStats,
        score: newData.score,
      }));
    };

    // Add event listeners
    gameEngine.addEventListener("stateChange", handleStateChange);
    gameEngine.addEventListener("collision", handleCollision);
    gameEngine.addEventListener("trashDisposed", handleTrashDisposed);
    gameEngine.addEventListener("levelUp", handleLevelUp);
    gameEngine.addEventListener("keyCombo", handleKeyCombo); // Add listener for key combinations
    gameEngine.addEventListener("gamePaused", handleGamePaused);
    gameEngine.addEventListener("gameResumed", handleGameResumed);

    // Initial state sync
    if (gameEngine.getGameState) {
      const state = gameEngine.getGameState();
      setGameStats((prevStats) => ({
        ...prevStats,
        score: state.score || 0,
        isPlaying: state.isPlaying,
        currentScene: state.currentScene,
      }));
    }

    // Clean up listener on unmount
    return () => {
      gameEngine.removeEventListener("stateChange", handleStateChange);
      gameEngine.removeEventListener("collision", handleCollision);
      gameEngine.removeEventListener("trashDisposed", handleTrashDisposed);
      gameEngine.removeEventListener("levelUp", handleLevelUp);
      gameEngine.removeEventListener("keyCombo", handleKeyCombo); // Remove listener for key combinations
      gameEngine.removeEventListener("gamePaused", handleGamePaused);
      gameEngine.removeEventListener("gameResumed", handleGameResumed);
    };
  }, [gameEngine]);

  // Countdown timer effect
  useEffect(() => {
    if (gameStats.currentScene !== CONFIG.SCENES.GAME) {
      setSecondsLeft(120);
      clearInterval(timerRef.current);
      return;
    }
    if (!gameStats.isPlaying) {
      clearInterval(timerRef.current);
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 0) return prev - 1;
        clearInterval(timerRef.current);
        return 0;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameStats.currentScene, gameStats.isPlaying]);

  // Function to get the appropriate color for the trash type
  const getTrashColor = (type) => {
    switch (type) {
      case "glass":
        return "#2ECC40"; // blue for glass (paper is also blue, but glass is often blue in recycling)
      case "metal_and_plastic":
        return "#FFDC00"; // yellow for plastic and metal
      case "organic":
        return "#8B4513"; // brown for organic
      case "paper":
        return "#0074D9"; // blue for paper
      case "nonRecyclable":
        return "#FF4136"; // red for non recyclable
      default:
        return "white";
    }
  };

  // Function to get descriptive name for trash items
  const getTrashItemName = (modelName, type) => {
    // If we have a model name, use that to get a specific description
    if (modelName) {
      switch (modelName) {
        // Glass items
        case "botellaVino":
          return "Botella de vino";
        case "botellin":
          return "Botellín";
        case "copaRota":
          return "Copa rota";
        case "botellaLicor":
          return "Botella de licor";

        // Plastic items
        case "botellaPlastico":
          return "Botella de plástico";
        case "bolsa":
          return "Bolsa plástica";
        case "sodaCan":
          return "Lata de refresco";
        case "lataAtun":
          return "Lata de atún";

        // Organic items
        case "bananaPeel":
          return "Cáscara de plátano";
        case "manzana":
          return "Manzana";
        case "musloPollo":
          return "Muslo de pollo";
        case "pizzaSlice":
          return "Trozo de pizza";
        case "eggShell":
          return "Cáscara de huevo";

        // Paper items
        case "pizzaBox":
          return "Caja de pizza";
        case "paper":
          return "Papel";
        case "paperRoll":
          return "Rollo de papel";

        // Non-recyclable items
        case "jeringuilla":
          return "Jeringuilla";
        case "bateria":
          return "Batería";
        case "movil":
          return "Móvil";

        default:
          // Fallback to type label if model name is unrecognized
          return getTrashTypeLabel(type);
      }
    }

    // Fallback to just the trash type if no model name is available
    return getTrashTypeLabel(type);
  };

  // Traducción de tipos de basura
  const getTrashTypeLabel = (type) => {
    switch (type) {
      case "glass":
        return "Vidrio";
      case "metal_and_plastic":
        return "Plástico";
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
      <div
        style={{
          position: "absolute",
          top: "20px",
          color: "#eefab3",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          zIndex: 10,
        }}
      >
        <img style={{ imageRendering: "pixelated" }} src={"trash.png"} />
        <p style={{ marginTop: '8px', scale: 2 }}>{gameStats.score}</p>
      </div>

      <div
        style={{
          position: "absolute",
          top: "50%",
          height: "450px",
          width: showCombinations ? "280px" : "80px",
          transform: "translateY(-50%)",
          right: "10px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "10px",
          padding: "10px 15px",
          backgroundColor: "#eefab3",
          border: "4px solid #c2d97d",
          cursor: "pointer",
          transition: "all 0.3s ease",
          zIndex: 10,
        }}
        onClick={() => setShowCombinations(!showCombinations)}
        title={
          showCombinations
            ? "Click to hide combinations"
            : "Click to show combinations"
        }
      >
        {/* Arrow toggle button */}
        {/* Vertical toggle button */}
        <div
          style={{
            position: "absolute",
            left: "-40px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#FFFFFF",
            width: "40px",
            height: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            cursor: "pointer",
            zIndex: 2,
            transition: "background 0.2s",
            userSelect: "none",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            padding: 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowCombinations(!showCombinations);
          }}
          title={
            showCombinations ? "Ocultar combinaciones" : "Mostrar combinaciones"
          }
        >
          <span
            style={{
              transform: "rotate(180deg)",
              display: "inline-block",
              fontWeight: "bold",
              letterSpacing: "2px",
            }}
          >
            {showCombinations ? "Esconder" : "Mostrar"}
          </span>
        </div>
        <Combination
          trashType={"glass"}
          combination={CONFIG.TRASH_COMBINATIONS.glass}
          showArrows={showCombinations}
        />
        <Combination
          trashType={"plastic"}
          combination={CONFIG.TRASH_COMBINATIONS.metal_and_plastic}
          showArrows={showCombinations}
        />
        <Combination
          trashType={"organic"}
          combination={CONFIG.TRASH_COMBINATIONS.organic}
          showArrows={showCombinations}
        />
        <Combination
          trashType={"paper"}
          combination={CONFIG.TRASH_COMBINATIONS.paper}
          showArrows={showCombinations}
        />
        <Combination
          trashType={"wrong"}
          combination={["down", "down", "down", "down"]}
          showArrows={showCombinations}
        />
      </div>

      <div
        style={{
          position: "absolute",
          width: "200px",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 15px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          borderRadius: "5px",
          textAlign: "center",
          fontSize: "16px",
          zIndex: 10,
        }}
      >
        <img
          style={{
            position: "absolute",
            imageRendering: "pixelated",
            left: "3rem",
            top: "-1rem",
            scale: 4,
            zIndex: -20,
            border: `2px solid ${getTrashColor(trashInstructions.type)}`,
          }}
          src="sheet.png"
        ></img>

        {trashInstructions.type && (
          <>
            <div
              style={{
                position: "absolute",
                left: 0,
                color: "#0d282b",
                fontSize: "20px",
                whiteSpace: "nowrap",
                width: "100%",
                textAlign: "center",
              }}
            >
              <strong>
                {getTrashItemName(
                  trashInstructions.modelName,
                  trashInstructions.type
                )}
              </strong>
            </div>
            <div
              style={{
                position: "absolute",
                top: "3rem",
                left: "-3rem",
                width: "100%",
                fontSize: "16px",
                marginTop: "5px",
                color: "#af0000",
                whiteSpace: "nowrap",
              }}
            >
              <span>¡Es peligroso clasificar mal!</span>
            </div>
          </>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "40px",
          color: "#eefab3",
          height: "40px",
          width: "80px",
          background: "rgba(0,0,0,0.7)",
          padding: "8px 18px",
          fontSize: "28px",
          fontWeight: "bold",
          zIndex: 20,
          minWidth: "90px",
          textAlign: "center",
          letterSpacing: "2px",
        }}
      >
        {gameStats.currentScene === CONFIG.SCENES.GAME ? `${secondsLeft}s` : ""}
      </div>

      {gameStats.currentScene === CONFIG.SCENES.SCORE_SCREEN && <ScoreScreen />}
      {gameStats.currentScene === CONFIG.SCENES.MAIN_MENU && <MainMenu />}

      {/* Pause Overlay - Only show when game is paused and in GAME scene */}
      {gameStats.currentScene === CONFIG.SCENES.GAME &&
        !gameStats.isPlaying && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "32px",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              JUEGO PAUSADO
            </div>
            <p>Presiona Escape para continuar</p>
          </div>
        )}

      {/* Current Key Combo Display */}
      {gameStats.currentScene === CONFIG.SCENES.GAME && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            height: "80px",
            width: "300px",
            left: "50%",
            transform: "translateX(-50%)",
            border: "4px solid #c2d97d",
            backgroundColor: "#eefab3",
            borderRadius: "5px",
            padding: "10px 15px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <div
            style={{ fontSize: "14px", marginBottom: "5px", color: "#0d282b" }}
          >
            Combinación actual:
          </div>
          <div
            style={{
              minHeight: "30px",
              minWidth: "120px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "24px",
              letterSpacing: "8px",
              gap: "8px",
            }}
          >
            {currentKeyCombo.length > 0 ? (
              currentKeyCombo.map((direction, idx) => (
                <Arrow
                  key={idx}
                  direction={direction}
                  alt={`Arrow ${idx + 1}`}
                />
              ))
            ) : (
              <span style={{ opacity: 0.3, fontSize: "32px" }}>⋯</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHUD;
