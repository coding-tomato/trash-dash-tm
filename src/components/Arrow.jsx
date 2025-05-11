import React from "react";

const arrowImages = {
  up: "arrows1.png",
  left: "arrows2.png",
  down: "arrows3.png",
  right: "arrows4.png",
};

const Arrow = ({ direction = "up", alt = "Arrow", ...props }) => {
  const src = arrowImages[direction] || arrowImages.up;
  return (
    <>
      <img
        style={{
          width: "50px",
          height: "50px",
          imageRendering: "pixelated",
          opacity: 0,
          animation: "popUp 0.5s forwards",
        }}
        src={src}
        alt={alt}
        {...props}
      />
      <style>
        {`
          @keyframes popUp {
            0% {
              opacity: 0;
              transform: scale(0.5);
            }
            60% {
              opacity: 1;
              transform: scale(1.1);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </>
  );
};

export default Arrow;
