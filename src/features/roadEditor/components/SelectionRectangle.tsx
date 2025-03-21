import React from 'react';
import { SelectionRect, SelectionMode } from '../../../types';

interface SelectionRectangleProps {
  rect: SelectionRect;
  mode: SelectionMode;
}

/**
 * Component to render the selection rectangle
 */
export function SelectionRectangle({ rect, mode }: SelectionRectangleProps) {
  if (!rect) return null;
  
  // Normalize rectangle coordinates for negative width/height
  const x = rect.width < 0 ? rect.startX + rect.width : rect.startX;
  const y = rect.height < 0 ? rect.startY + rect.height : rect.startY;
  const width = Math.abs(rect.width);
  const height = Math.abs(rect.height);
  
  // Set colors based on selection mode
  const fillColor = mode === 'select' ? "rgba(0, 100, 255, 0.2)" : "rgba(255, 50, 50, 0.2)";
  const strokeColor = mode === 'select' ? "rgba(0, 100, 255, 0.8)" : "rgba(255, 50, 50, 0.8)";
  
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth="1"
      strokeDasharray="4 2"
    />
  );
} 