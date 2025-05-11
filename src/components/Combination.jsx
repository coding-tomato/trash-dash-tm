import React from "react";
import Arrow from "./Arrow";

const trashTypes = {
  glass: "Vidrio",
  organic: "Orgánico",
  paper: "Papel",
  plastic: "Plástico o metal",
  wrong: "No reciclable",
};

const Combination = ({
  trashType,
  combination = ["up", "up", "up", "up"],
  showArrows = true,
  ...props
}) => {
  // Map trash types to their corresponding icons
  const trashIcons = {
    glass: "icon-glass.png",
    organic: "icon-organic.png",
    paper: "icon-paper.png",
    plastic: "icon-plastic.png",
    wrong: "icon-wrong.png",
  };

  // Get the correct icon path based on trash type
  const iconPath = trashIcons[trashType] || trashIcons.wrong;

  // Ensure combination always has exactly 4 arrows
  const arrowCombination = combination.slice(0, 4);
  while (arrowCombination.length < 4) {
    arrowCombination.push("up");
  }

  return (
    <div
      style={{ position: "relative" }}
      className="combination-fade-in"
      title={trashTypes[trashType] || trashTypes.wrong}
      {...props}
    >
      <p style={{ color: "#0d282b", marginBottom: "12px", whiteSpace: "nowrap", opacity: showArrows ? 1 : 0 }}>
        {trashTypes[trashType] || trashTypes.wrong}
      </p>
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <div className="trash-icon">
          <img
            style={{
              imageRendering: "pixelated",
              scale: 1.5,
              marginRight: "10px",
              pointerEvents: "none",
            }}
            src={iconPath}
            alt={`${trashType} trash`}
          />
        </div>
        {showArrows && (
          <div
            style={{
              position: "absolute",
              left: "30px",
              top: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {arrowCombination.map((direction, index) => (
              <Arrow
                key={index}
                direction={direction}
                alt={`Arrow ${index + 1}`}
                className="combination-arrow"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Combination;
