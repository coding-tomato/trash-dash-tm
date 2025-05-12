import React, { useEffect, useState, useRef } from "react";
import { useGameContext } from "../contexts/GameContext";

const phoneImages = ["phone1.png", "phone2.png", "phone3.png", "phone4.png"];

const MobileEvent = () => {
  const gameEngine = useGameContext();
  const [currentImage, setCurrentImage] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const prevSceneRef = useRef(null); // Track previous scene

  // Helper to start the mobile event (show once, random image)
  const startMobileEvent = () => {
    const randomIdx = Math.floor(Math.random() * phoneImages.length);
    setCurrentImage(randomIdx);
    setShowOverlay(true);
    setAnimating(true);
  };

  // Helper to stop the mobile event
  const stopMobileEvent = () => {
    setShowOverlay(false);
    setAnimating(false);
  };

  // Handle keyboard events (space or arrow keys)
  const handleKeyDown = (event) => {
    if (!animating) return;
    
    // Hide overlay on space or any arrow key
    if (
      event.code === "Space" || 
      event.code === "ArrowUp" || 
      event.code === "ArrowDown" || 
      event.code === "ArrowLeft" || 
      event.code === "ArrowRight"
    ) {
      setAnimating(false);
      setShowOverlay(false);
    }
  };

  useEffect(() => {
    if (!gameEngine) return;
    // Listen for game start/stop events
    const handleStateChange = (newState) => {
      const prevScene = prevSceneRef.current;
      const nextScene = newState.currentScene;
      if (nextScene === "GAME" && prevScene !== "GAME") {
        startMobileEvent();
      } else if (nextScene !== "GAME" && prevScene === "GAME") {
        stopMobileEvent();
      }
      prevSceneRef.current = nextScene;
    };
    gameEngine.addEventListener("stateChange", handleStateChange);
    if (
      gameEngine.getGameState &&
      gameEngine.getGameState().currentScene === "GAME"
    ) {
      prevSceneRef.current = "GAME";
      startMobileEvent();
    } else if (gameEngine.getGameState) {
      prevSceneRef.current = gameEngine.getGameState().currentScene;
    }
    return () => {
      gameEngine.removeEventListener("stateChange", handleStateChange);
      stopMobileEvent();
    };
  }, [gameEngine]);

  // Add and remove keyboard event listener
  useEffect(() => {
    if (animating) {
      window.addEventListener("keydown", handleKeyDown);
    }
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [animating]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: showOverlay ? "auto" : "none",
        cursor: "pointer",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-start",
        transition: "background 0.5s",
      }}
      onClick={() => {
        if (animating) {
          setAnimating(false);
          setShowOverlay(false);
        }
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.7)",
          opacity: showOverlay ? 1 : 0,
          transition: "opacity 0.5s",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          transform: animating ? "translateY(0)" : "translateY(120%)",
          transition: "transform 0.5s ease-in-out",
        }}
      >
        <p
          style={{
            color: "white",
            opacity: animating ? 1 : 0,
            zIndex: 1001,
            width: "100%",
            textAlign: "center",
          }}
        >
          Presiona espacio o flechas para esconder
        </p>
        <img
          src={`${phoneImages[currentImage]}`}
          alt="Mobile Event"
          style={{
            imageRendering: "pixelated",
            width: "500px",
            opacity: 1,
            marginLeft: "20px",
          }}
        />
      </div>
    </div>
  );
};

export default MobileEvent;
