import React from 'react';
import { Road } from '../../../types';
import { getCalculatedAngle } from '../../../utils/roadUtils';

interface RoadLabelsProps {
  roads: Road[];
}

/**
 * Component to render all visible road name labels
 */
export function RoadLabels({ roads }: RoadLabelsProps) {
  return (
    <>
      {roads.map(road => {
        if (!road.visible || !road.showName || !road.name || !road.svgPoints?.length) return null;
        
        // Calculate position for text (middle of the road)
        const midPointIndex = Math.floor(road.svgPoints.length / 2);
        const midPoint = road.svgPoints[midPointIndex];
        
        // Apply custom offset if it exists
        const offsetX = road.labelOffset?.[0] || 0;
        const offsetY = road.labelOffset?.[1] || 0;
        
        const labelPos: [number, number] = [
          midPoint[0] + offsetX,
          midPoint[1] + offsetY
        ];
        
        // Get font size from road or use default
        const fontSize = road.fontSize || 10;
        
        // Calculate angle
        let angle = 0;
        if (road.customAngle !== undefined) {
          angle = road.customAngle;
        } else {
          angle = getCalculatedAngle(road.svgPoints);
        }
        
        return (
          <text
            key={`label-${road.id}`}
            x={labelPos[0]}
            y={labelPos[1]}
            fontSize={fontSize}
            fill="black"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${angle}, ${labelPos[0]}, ${labelPos[1]})`}
          >
            {road.name}
          </text>
        );
      })}
    </>
  );
} 