import React, { useState, useEffect } from "react";
import { useGameContext } from "../../contexts/GameContext";
import { CONFIG } from "../../config";

const ScoreScreen = () => {
  const gameEngine = useGameContext();
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!gameEngine) return;
    if (gameEngine.getGameState) {
      const state = gameEngine.getGameState();
      setScore(state.score || 0);
    }
  }, [gameEngine]);

  const handlePlayAgain = () => {
    if (!gameEngine) return;
    gameEngine.resetGame();
    gameEngine.setCurrentScene(CONFIG.SCENES.MAIN_MENU);
  };

  return (
    <div
      className="score-screen"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
        background: "linear-gradient(to bottom, #111122, #332244)",
        color: "white",
        textAlign: "center",
        zIndex: 1000,
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
          backgroundSize: "100px", // Increase the size of the pattern
          animation: "scrollBackground 5s linear infinite", // Add scrolling animation
        }}
      ></div>

      <h1
        style={{
          position: "relative",
          fontSize: "3rem",
          marginBottom: "1rem",
          textShadow: "0 0 5px rgba(0, 0, 0, 1)",
        }}
      >
        Juego terminado
      </h1>

      <div
        style={{
          position: "relative",
          marginBottom: "1rem",
          fontSize: "0.9rem",
          textShadow: "0 0 5px rgba(0, 0, 0, 1)",
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "8px",
          margin: "0 5rem 2rem 5rem",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <p>
          A medida que crece la población, también lo hacen los residuos… y con
          ellos, el reto de separarlos correctamente.
        </p>
        <p>
          Hoy en día, esta tarea sigue siendo mayormente manual, lenta y
          costosa.
        </p>
        <p>
          La acumulación de residuos en el planeta es un problema que afecta la
          salud de todos. ¡Esta tarea debería empezar en casa!
        </p>
      </div>

      <div
        style={{
          position: "relative",
          maxWidth: "600px",
          margin: "0 auto 2rem",
          padding: "2rem",
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            fontSize: "1.5rem",
            display: "flex",
            gap: "1rem",
            justifyContent: "space-between",
          }}
        >
          <span>Puntaje final: </span>
          <span>{score}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", position: "relative" }}>
        <button
          onClick={handlePlayAgain}
          style={{
            padding: "15px 30px",
            fontSize: "1.2rem",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
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
          Play Again
        </button>
      </div>

      <style>
        {`
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
  );
};

export default ScoreScreen;
