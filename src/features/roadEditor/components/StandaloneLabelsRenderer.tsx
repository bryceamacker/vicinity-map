import React from 'react';
import { StandaloneLabel } from '../../../types';

interface StandaloneLabelsRendererProps {
  labels: StandaloneLabel[];
}

/**
 * Component to render all visible standalone text labels
 */
export function StandaloneLabelsRenderer({ labels }: StandaloneLabelsRendererProps) {
  return (
    <>
      {labels.map(label => {
        if (!label.visible) return null;
        
        return (
          <text
            key={`standalone-${label.id}`}
            x={label.position[0]}
            y={label.position[1]}
            fontSize={label.fontSize || 12}
            fill="black"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${label.angle || 0}, ${label.position[0]}, ${label.position[1]})`}
          >
            {label.text}
          </text>
        );
      })}
    </>
  );
} 