import React from 'react';
import { Road } from '../../../types';

interface RoadPathsProps {
  roads: Road[];
}

/**
 * Component to render all visible road paths
 */
export function RoadPaths({ roads }: RoadPathsProps) {
  /**
   * Get style attributes for a road based on its feature type
   */
  const getRoadStyle = (road: Road): { stroke: string; strokeWidth: string; strokeDasharray?: string } => {
    const featureType = road.featureType || 'highway';
    
    switch (featureType) {
      case 'railway':
        return { 
          stroke: '#555', 
          strokeWidth: '1.5'
        };
      case 'waterway':
        return { 
          stroke: '#2B7CE9', 
          strokeWidth: '1.8'
        };
      case 'highway':
      default:
        return { 
          stroke: 'black', 
          strokeWidth: '1.5' 
        };
    }
  };
  
  /**
   * Renders a railway with parallel tracks and cross ties
   */
  const RailwayPath = ({ road }: { road: Road }) => {
    if (!road.svgPoints || road.svgPoints.length < 2) return null;
    
    const style = getRoadStyle(road);
    const paths = [];
    const ties = [];
    
    // Calculate parallel tracks and cross ties
    for (let i = 0; i < road.svgPoints.length - 1; i++) {
      const p1 = road.svgPoints[i];
      const p2 = road.svgPoints[i + 1];
      
      // Calculate a perpendicular vector for the offset
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length < 0.001) continue; // Skip extremely short segments
      
      // Normalize and get perpendicular
      const offsetX = (dy / length) * 2; // 2 units perpendicular offset
      const offsetY = -(dx / length) * 2;
      
      // First rail
      paths.push(
        <path
          key={`rail1-${road.id}-${i}`}
          d={`M ${p1[0] + offsetX},${p1[1] + offsetY} L ${p2[0] + offsetX},${p2[1] + offsetY}`}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          fill="none"
        />
      );
      
      // Second rail
      paths.push(
        <path
          key={`rail2-${road.id}-${i}`}
          d={`M ${p1[0] - offsetX},${p1[1] - offsetY} L ${p2[0] - offsetX},${p2[1] - offsetY}`}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          fill="none"
        />
      );
      
      // Add cross ties at regular intervals
      const numTies = Math.floor(length / 10); // One tie every 10 units
      if (numTies > 0) {
        for (let j = 0; j <= numTies; j++) {
          // Position along the track
          const t = j / numTies;
          const tieX = p1[0] + t * dx;
          const tieY = p1[1] + t * dy;
          
          // Add a short line perpendicular to the track to represent a tie
          ties.push(
            <path
              key={`tie-${road.id}-${i}-${j}`}
              d={`M ${tieX + offsetX * 1.2},${tieY + offsetY * 1.2} L ${tieX - offsetX * 1.2},${tieY - offsetY * 1.2}`}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              fill="none"
            />
          );
        }
      }
    }
    
    return (
      <>
        {paths}
        {ties}
      </>
    );
  };
  
  return (
    <>
      {roads.map(road => {
        if (!road.visible) return null;
        
        // Use special rendering for railways
        if (road.featureType === 'railway') {
          return <RailwayPath key={`railway-${road.id}`} road={road} />;
        }
        
        // Regular path for roads and waterways
        const style = getRoadStyle(road);
        
        return (
          <path
            key={`path-${road.id}`}
            d={`M ${road.svgPoints.map(p => p.join(',')).join(' L ')}`}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            fill="none"
          />
        );
      })}
    </>
  );
} 