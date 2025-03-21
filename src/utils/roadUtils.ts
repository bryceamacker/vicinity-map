/**
 * Check if a road is important enough to include
 */
export function isSignificantRoad(tags: any): boolean {
  // Highway types that are significant
  const significantTypes = [
    'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 
    'residential', 'unclassified'
  ];
  
  // Include if it's a significant type or has a name
  return significantTypes.includes(tags.highway) || !!tags.name;
}

/**
 * Calculate angle for a road based on its path
 */
export function getCalculatedAngle(points: [number, number][]): number {
  if (points.length <= 1) return 0;
  
  const midPointIndex = Math.floor(points.length / 2);
  const p1Index = Math.max(0, midPointIndex - Math.min(3, Math.floor(points.length / 10)));
  const p2Index = Math.min(points.length - 1, midPointIndex + Math.min(3, Math.floor(points.length / 10)));
  
  const p1 = points[p1Index];
  const p2 = points[p2Index];
  
  // Calculate angle in degrees
  let angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * (180 / Math.PI);
  
  // Ensure text is not upside-down by adjusting angle
  if (angle > 90 || angle < -90) {
    angle += 180;
  }
  
  return angle;
} 