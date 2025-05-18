'use client';

import React from 'react';

interface AxesOverlayProps {
  size?: number; // Overall size of the axes widget
  strokeWidth?: number;
}

const AxesOverlay: React.FC<AxesOverlayProps> = ({ size = 50, strokeWidth = 2 }) => {
  const halfSize = size / 2;
  const arrowLength = size / 2.5; // Length of the axis line itself
  const arrowHeadSize = strokeWidth * 2.5;
  const textOffset = arrowHeadSize / 2;
  const labelFontSize = Math.max(8, size / 6);

  return (
    <div 
      className="absolute bottom-4 left-4 z-20 pointer-events-none"
      style={{ width: size, height: size }}
      role="img" // More appropriate role for a graphical widget
      aria-label='XYZ axes orientation guide: X (red, right), Y (green, up), Z (blue dot, out of screen)'
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
        {/* Y-axis (Green) - pointing up from center */}
        <line 
          x1={halfSize} y1={halfSize} 
          x2={halfSize} y2={halfSize - arrowLength} 
          stroke="green" 
          strokeWidth={strokeWidth} 
        />
        <polygon 
          points={`${halfSize},${halfSize - arrowLength - (arrowHeadSize/2)} ${halfSize - arrowHeadSize / 2},${halfSize - arrowLength + arrowHeadSize / 2} ${halfSize + arrowHeadSize / 2},${halfSize - arrowLength + arrowHeadSize / 2}`} 
          fill="green" 
        />
        <text x={halfSize + textOffset} y={halfSize - arrowLength - textOffset} fontSize={labelFontSize} fill="green" dominantBaseline="middle" textAnchor="start">Y</text>

        {/* X-axis (Red) - pointing right from center */}
        <line 
          x1={halfSize} y1={halfSize} 
          x2={halfSize + arrowLength} y2={halfSize} 
          stroke="red" 
          strokeWidth={strokeWidth} 
        />
        <polygon 
          points={`${halfSize + arrowLength + (arrowHeadSize/2)},${halfSize} ${halfSize + arrowLength - arrowHeadSize/2},${halfSize - arrowHeadSize / 2} ${halfSize + arrowLength - arrowHeadSize/2},${halfSize + arrowHeadSize / 2}`} 
          fill="red" 
        />
        <text x={halfSize + arrowLength + textOffset} y={halfSize - textOffset} fontSize={labelFontSize} fill="red" dominantBaseline="middle" textAnchor="start">X</text>
        
        {/* Z-axis (Blue) - represented by a dot at the center, suggesting depth (pointing out of screen) */}
        <circle cx={halfSize} cy={halfSize} r={strokeWidth * 1.5} fill="blue" stroke="lightblue" strokeWidth={strokeWidth/2} />
        <text x={halfSize + textOffset} y={halfSize + textOffset + (strokeWidth * 1.5)} fontSize={labelFontSize} fill="blue" dominantBaseline="middle" textAnchor="start">Z</text>
      </svg>
    </div>
  );
};

export default AxesOverlay; 