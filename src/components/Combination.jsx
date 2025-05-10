import React from 'react';
import Arrow from './Arrow';

const Combination = ({ trashType, combination = ['up', 'up', 'up', 'up'], ...props }) => {
  // Map trash types to their corresponding icons
  const trashIcons = {
    glass: '/icon-glass.png',
    organic: '/icon-organic.png',
    paper: '/icon-paper.png',
    plastic: '/icon-plastic.png',
    wrong: '/icon-wrong.png',
  };

  // Get the correct icon path based on trash type
  const iconPath = trashIcons[trashType] || trashIcons.wrong;
  
  // Ensure combination always has exactly 4 arrows
  const arrowCombination = combination.slice(0, 4);
  while (arrowCombination.length < 4) {
    arrowCombination.push('up');
  }

  return (
    <div className="combination-container" {...props}>
      <div className="trash-icon">
        <img src={iconPath} alt={`${trashType} trash`} />
      </div>
      <div className="arrow-combination">
        {arrowCombination.map((direction, index) => (
          <Arrow 
            key={index} 
            direction={direction} 
            alt={`Arrow ${index + 1}`} 
            className="combination-arrow"
          />
        ))}
      </div>
    </div>
  );
};

export default Combination;