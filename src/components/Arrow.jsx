import React from 'react';

const arrowImages = {
  up: '/arrow1.png',
  left: '/arrow2.png',
  down: '/arrow3.png',
  right: '/arrow4.png',
};

const Arrow = ({ direction = 'up', alt = 'Arrow', ...props }) => {
  const src = arrowImages[direction] || arrowImages.up;
  return <img src={src} alt={alt} {...props} />;
};

export default Arrow;