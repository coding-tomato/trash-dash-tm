import React, { useEffect, useState, useRef } from "react";
import { useGameContext } from "../contexts/GameContext";

const phoneImages = ["phone1.png", "phone2.png", "phone3.png", "phone4.png"];

const MobileEvent = () => {
  const gameEngine = useGameContext();
  const [currentImage, setCurrentImage] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const prevSceneRef = useRef(null);

  useEffect(() => {
    if (!gameEngine) return;

    const handleKeyDown = (event) => {
      if (event.code === "Space") {
        hideMobilePhone();
      }
      else if (event.code === "Escape") {
        setShowOverlay(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleStateChange = (newState) => {
      const prevScene = prevSceneRef.current;
      const nextScene = newState.currentScene;
      if (nextScene === "GAME" && prevScene !== "GAME") {
        showMobilePhone();
      } else if (nextScene !== "GAME" && prevScene === "GAME") {
        hideMobilePhone();
      }
      prevSceneRef.current = nextScene;
    };
    gameEngine.addEventListener("stateChange", handleStateChange);

    if (
      gameEngine.getGameState &&
      gameEngine.getGameState().currentScene === "GAME"
    ) {
      prevSceneRef.current = "GAME";
      showMobilePhone();
    } else if (gameEngine.getGameState) {
      prevSceneRef.current = gameEngine.getGameState().currentScene;
    }

    return () => {
      gameEngine.removeEventListener("stateChange", handleStateChange);
      window.removeEventListener("keydown", handleKeyDown);
      hideMobilePhone();
    };
  }, [gameEngine]);

  const showMobilePhone = () => {
    const randomIdx = Math.floor(Math.random() * phoneImages.length);
    setCurrentImage(randomIdx);
    setShowOverlay(true);
  };

  const hideMobilePhone = () => {
    gameEngine.resume();
    setShowOverlay(false);
  };

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
      onClick={() => hideMobilePhone()}
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
          transform: showOverlay ? "translateY(0)" : "translateY(120%)",
          transition: "transform 0.5s ease-in-out",
        }}
      >
        <p
          style={{
            color: "white",
            opacity: showOverlay ? 1 : 0,
            zIndex: 1001,
            width: "100%",
            textAlign: "center",
          }}
        >
          Presiona espacio o click para esconder
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
