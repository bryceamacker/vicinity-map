import L from 'leaflet';

/**
 * Transforms geographic coordinates to SVG viewport coordinates
 */
export function transformToSVGCoords(
  point: [number, number], 
  bounds: L.LatLngBounds, 
  svgWidth: number = 800, 
  svgHeight: number = 600
): [number, number] {
  // Get the bounds dimensions
  const boundWidth = bounds.getEast() - bounds.getWest();
  const boundHeight = bounds.getNorth() - bounds.getSouth();
  
  // Calculate the scale factors
  const scaleX = svgWidth / boundWidth;
  const scaleY = svgHeight / boundHeight;
  
  // Transform the coordinates
  const x = (point[0] - bounds.getWest()) * scaleX;
  const y = svgHeight - ((point[1] - bounds.getSouth()) * scaleY); // Invert Y axis
  
  return [x, y];
}

/**
 * Transforms SVG coordinates back to geographic coordinates
 */
export function transformToGeoCoords(
  point: [number, number],
  bounds: L.LatLngBounds,
  svgWidth: number = 800,
  svgHeight: number = 600
): [number, number] {
  // Get the bounds dimensions
  const boundWidth = bounds.getEast() - bounds.getWest();
  const boundHeight = bounds.getNorth() - bounds.getSouth();
  
  // Calculate the scale factors
  const scaleX = svgWidth / boundWidth;
  const scaleY = svgHeight / boundHeight;
  
  // Transform the coordinates back to geographic
  const lon = (point[0] / scaleX) + bounds.getWest();
  const lat = bounds.getSouth() + ((svgHeight - point[1]) / scaleY); // Revert Y inversion
  
  return [lon, lat];
} 