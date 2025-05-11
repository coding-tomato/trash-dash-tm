import React from "react";

const Tutorial = ({ onContinue }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>¿Cómo jugar?</h1>
      <div style={{ maxWidth: 600, fontSize: "1.3rem", background: "rgba(34,34,34,0.7)", borderRadius: 12, padding: "2rem", marginBottom: "2rem", boxShadow: "0 4px 24px #0008" }}>
        <ul style={{ textAlign: "left", lineHeight: 1.2, display: "flex", flexDirection: "column", gap: "1rem" }}>
          <li>
            <b>¡Recicla correctamente!</b>
          </li>
          <li>
            <b>Combina flechas</b> (<span style={{color:'#eefab3'}}>↑ ↓ ← →</span>) para formar la secuencia correcta para cada tipo de residuo.
          </li>
          <li>
            <b>Puedes pulsar <span style={{color:'#eefab3'}}>Espacio</span></b> para descartar la combinación actual.
          </li>
          <li>
            <b>¡Cuidado!</b> Si te equivocas, perderas puntos.
          </li>
        </ul>
        <div style={{ marginTop: "1.5rem", fontSize: "1.1rem", color: "#eefab3" }}>
          ¡Buena suerte y a reciclar!
        </div>
      </div>
      <button
        onClick={onContinue}
        style={{
          fontSize: "1rem",
          padding: "0.8rem 2.5rem",
          background: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: "bold",
          boxShadow: "0 2px 8px #0006",
        }}
      >
        Continuar
      </button>
    </div>
  );
};

export default Tutorial
