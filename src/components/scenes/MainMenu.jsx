import React, { useState, useEffect } from "react";
import { useGameContext } from "../../contexts/GameContext";
import { CONFIG } from "../../config";
import Tutorial from "../Tutorial";

const MainMenu = () => {
  const gameEngine = useGameContext();
  const [selectedCharacter, setSelectedCharacter] = useState(2);
  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!gameEngine) return;

    const handleLoadingAssets = (data) => {
      setLoadingAssets(data.loading);
    };

    gameEngine.addEventListener("loadingAssets", handleLoadingAssets);

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

    gameEngine.setPlayerCharacter(selectedCharacter);
    gameEngine.setCurrentScene(CONFIG.SCENES.GAME);
    gameEngine.startIntroAnimation();

    setLoading(false);
  };

  // Show tutorial first, then start game
  const handleMenuStart = () => {
    setShowTutorial(true);
  };
  const handleContinueFromTutorial = () => {
    setShowTutorial(false);
    handleStartGame();
  };

  return (
    <>
      {showTutorial && <Tutorial onContinue={handleContinueFromTutorial} />}
      <div
        style={{
          position: "absolute",
          left: '4rem',
          top: "50%",
          width: '100px',
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          zIndex: 1001,
        }}
      >
        <p style={{fontSize: '1rem'}}>Selecciona tu personaje</p>

        <img
          style={{
            width: "100px",
            height: "100px",
            outline: selectedCharacter === 1 ? "8px solid #eefab3" : "none",
            backgroundColor: "#174f39",
          }}
          onClick={() => setSelectedCharacter(1)}
          src="portraits1.png"
        ></img>
        <img
          style={{
            width: "100px",
            height: "100px",
            outline: selectedCharacter === 2 ? "8px solid #eefab3" : "none",
            backgroundColor: "#174f39",
          }}
          onClick={() => setSelectedCharacter(2)}
          src="portraits2.png"
        ></img>
        <img
          style={{
            width: "100px",
            height: "100px",
            outline: selectedCharacter === 3 ? "8px solid #eefab3" : "none",
            backgroundColor: "#174f39",
          }}
          onClick={() => setSelectedCharacter(3)}
          src="portraits3.png"
        ></img>
      </div>
      <div
        className="main-menu"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(to bottom, #111122, #332244)",
          color: "white",
          textAlign: "center",
          zIndex: 1000,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            imageRendering: "pixelated",
            position: "absolute",
            height: "100%",
            width: "100%",
            backgroundImage: "url('bg-pattern.png')",
            backgroundRepeat: "repeat",
            backgroundSize: "100px",
            animation: "scrollBackground 5s linear infinite",
          }}
        ></div>

        <img
          src="title.png"
          style={{
            imageRendering: "pixelated",
            width: "150px",
            transform: "scale(3)",
            marginBottom: "8rem",
            animation: "dropAndBounce 1s linear",
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: "600px",
            margin: "0 auto 2rem",
            padding: "1rem",
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: "8px",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>
            ¡Entra en la fabrica y ayuda a reciclar los residuos!
          </p>
        </div>

        <button
          onClick={handleMenuStart}
          disabled={loading || loadingAssets}
          style={{
            position: "relative",
            padding: "15px 30px",
            fontSize: "1.2rem",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading || loadingAssets ? "wait" : "pointer",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            transition: "transform 0.1s, box-shadow 0.1s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseOver={(e) =>
            (e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.4)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)")
          }
        >
          {loadingAssets
            ? "Cargando archivos..."
            : loading
            ? "Cargando..."
            : "¡Empezar!"}
        </button>

        {loadingAssets && (
          <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
            Pre-cargando archivos. Por favor, espera...
          </div>
        )}

        <style>
          {`
          @keyframes dropAndBounce {
            0% {
              transform: scale(3) translateY(-200px);
              opacity: 0;
            }
            60% {
              transform: scale(3) translateY(0px);
              opacity: 1;
            }
            80% {
              transform: scale(3) translateY(-10px);
            }
            90% {
              transform: scale(3) translateY(-2px);
            }
            93% {
              transform: scale(3) translateY(0);
            }
            96% {
              transform: scale(3) translateY(-2px);
            }
            100% {
              transform: scale(3) translateY(0);
            }
          }

          @keyframes scrollBackground {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: 100px 100px;
            }
          }
        `}
        </style>
      </div>
    </>
  );
};

export default MainMenu;
