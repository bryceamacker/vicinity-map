import L from 'leaflet';
import { Road } from '../types';
import { transformToSVGCoords } from '../utils/coordinateTransforms';
import { isSignificantRoad } from '../utils/roadUtils';

/**
 * Fetches road data from OpenStreetMap via Overpass API
 */
export async function fetchRoadData(bounds: L.LatLngBounds): Promise<Road[]> {
  const query = `
    [out:json][timeout:25];
    (
      way["highway"]
        (${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    });
    
    const data = await response.json();
    
    // Process ways and nodes
    const roads = processOverpassResponse(data, bounds);
    return roads;
  } catch (error) {
    console.error('Error fetching road data:', error);
    return [];
  }
}

/**
 * Processes Overpass API response into Road objects
 */
function processOverpassResponse(data: any, bounds: L.LatLngBounds): Road[] {
  // Process nodes
  const nodes = new Map<number, [number, number]>();
  data.elements.forEach((element: any) => {
    if (element.type === 'node') {
      nodes.set(element.id, [element.lon, element.lat]);
    }
  });

  // Convert ways to road objects
  const roads = data.elements
    .filter((element: any) => {
      return element.type === 'way' && 
             element.tags && 
             element.tags.highway && 
             isSignificantRoad(element.tags);
    })
    .map((way: any) => {
      const points = way.nodes.map((nodeId: number) => nodes.get(nodeId));
      
      // Add SVG coordinates
      const svgPoints = points.map((p: [number, number]) => 
        transformToSVGCoords(p, bounds)
      );
      
      return {
        id: way.id.toString(),
        name: way.tags.name || '',
        type: way.tags.highway || '',
        visible: true,
        showName: true,
        points: points,
        svgPoints: svgPoints
      };
    });

  return roads;
} 