import L from 'leaflet';
import { Road } from '../types';
import { transformToSVGCoords } from '../utils/coordinateTransforms';
import { isSignificantRoad, categorizeRoadType } from '../utils/roadUtils';

/**
 * Fetches road data from OpenStreetMap via Overpass API
 */
export async function fetchRoadData(bounds: L.LatLngBounds): Promise<Road[]> {
  const query = `
    [out:json][timeout:25];
    (
      way["highway"]
        (${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
      way["railway"]
        (${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
      way["waterway"]
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
             (
               (element.tags.highway && isSignificantRoad(element.tags)) ||
               element.tags.railway ||
               element.tags.waterway
             );
    })
    .map((way: any) => {
      const points = way.nodes.map((nodeId: number) => nodes.get(nodeId));
      
      // Add SVG coordinates
      const svgPoints = points.map((p: [number, number]) => 
        transformToSVGCoords(p, bounds)
      );
      
      // Determine feature type (highway, railway, or waterway)
      let featureType = 'other';
      let originalType = '';
      
      if (way.tags.highway) {
        featureType = 'highway';
        originalType = way.tags.highway;
      } else if (way.tags.railway) {
        featureType = 'railway';
        originalType = way.tags.railway;
      } else if (way.tags.waterway) {
        featureType = 'waterway';
        originalType = way.tags.waterway;
      }
      
      // Get the OSM type and categorize it
      const categoryType = featureType === 'highway' 
        ? categorizeRoadType(originalType)
        : categorizeFeatureType(featureType, originalType);
      
      return {
        id: way.id.toString(),
        name: way.tags.name || '',
        type: categoryType, // Use our categorized type
        originalType: originalType, // Store the original OSM type for reference
        featureType: featureType, // Store whether this is a highway, railway, or waterway
        visible: true,
        showName: true,
        points: points,
        svgPoints: svgPoints
      };
    });

  return roads;
}

/**
 * Categorizes non-highway features like railways and waterways
 */
function categorizeFeatureType(featureType: string, originalType: string): string {
  if (featureType === 'railway') {
    // Categorize railway types
    if (['rail', 'light_rail', 'subway', 'tram'].includes(originalType)) {
      return 'railway_major';
    }
    return 'railway_minor';
  }
  
  if (featureType === 'waterway') {
    // Categorize waterway types
    if (['river', 'canal'].includes(originalType)) {
      return 'waterway_major';
    }
    return 'waterway_minor';
  }
  
  return 'other';
} 