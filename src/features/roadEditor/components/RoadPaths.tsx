import React from 'react';
import { Road } from '../../../types';

interface RoadPathsProps {
  roads: Road[];
}

/**
 * Component to render all visible road paths
 */
export function RoadPaths({ roads }: RoadPathsProps) {
  return (
    <>
      {roads.map(road => (
        road.visible && (
          <path
            key={`path-${road.id}`}
            d={`M ${road.svgPoints.map(p => p.join(',')).join(' L ')}`}
            stroke="black"
            strokeWidth="1.5"
            fill="none"
          />
        )
      ))}
    </>
  );
} 