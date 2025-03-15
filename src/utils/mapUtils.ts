import L from 'leaflet';

// Function to transform geographic coordinates to SVG viewport coordinates
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

// Function to check if a road is important enough to include
export function isSignificantRoad(tags: any): boolean {
  // Highway types that are significant
  const significantTypes = [
    'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 
    'residential', 'unclassified'
  ];
  
  // Include if it's a significant type or has a name
  return significantTypes.includes(tags.highway) || !!tags.name;
}

export async function processRoads(bounds: L.LatLngBounds) {
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
    const nodes = new Map();
    data.elements.forEach((element: any) => {
      if (element.type === 'node') {
        nodes.set(element.id, [element.lon, element.lat]);
      }
    });

    // Convert ways to road objects with filtering for significant roads
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
          points: points,
          svgPoints: svgPoints
        };
      });

    return roads;
  } catch (error) {
    console.error('Error fetching road data:', error);
    return [];
  }
}

export async function fetchRoadsAndExportSVG(bounds: L.LatLngBounds, roads: any[] = [], standaloneLabels: any[] = []) {
  try {
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '800');
    svg.setAttribute('height', '600');
    svg.setAttribute('viewBox', '0 0 800 600');
    
    // Set white background
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', 'white');
    svg.appendChild(background);

    // First pass: Draw all road paths
    roads.forEach(road => {
      // Use svgPoints for the SVG export if available, otherwise fall back to points
      const points = road.svgPoints || road.points;
      if (!points || points.length === 0) return;
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = `M ${points.map((p: number[]) => p.join(',')).join(' L ')}`;
      path.setAttribute('d', d);
      path.setAttribute('stroke', 'black');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('fill', 'none');
      svg.appendChild(path);
    });

    // Second pass: Draw road names with deduplication
    // Track drawn label positions to prevent duplicates
    const drawnLabels = new Map<string, Array<[number, number]>>();
    
    // Minimum distance between same name labels (in pixel units for SVG)
    const MIN_LABEL_DISTANCE = 150;
    
    // Sort roads by importance and length to prioritize major roads
    const roadsWithNamesToDraw = [...roads]
      .filter(road => road.name && (road.showName !== false))
      .sort((a, b) => {
        // Prioritize by road type first (simple heuristic)
        const typeOrder: Record<string, number> = {
          'motorway': 1,
          'trunk': 2,
          'primary': 3,
          'secondary': 4,
          'tertiary': 5,
          'residential': 6,
          'unclassified': 7
        };
        
        const typeA = a.type || 'unclassified';
        const typeB = b.type || 'unclassified';
        
        const aOrder = typeOrder[typeA] || 8;
        const bOrder = typeOrder[typeB] || 8;
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        
        // If same type, prefer longer roads
        return b.points.length - a.points.length;
      });
    
    // Draw labels with deduplication
    roadsWithNamesToDraw.forEach(road => {
      // Use svgPoints for the SVG export if available, otherwise fall back to points
      const points = road.svgPoints || road.points;
      if (!points || points.length === 0) return;
      
      // Calculate middle point for text position
      const midPointIndex = Math.floor(points.length / 2);
      const midPoint = points[midPointIndex];
      
      // Apply custom offset if it exists
      const offsetX = road.labelOffset?.[0] || 0;
      const offsetY = road.labelOffset?.[1] || 0;
      
      const labelPos: [number, number] = [
        midPoint[0] + offsetX,
        midPoint[1] + offsetY
      ];
      
      // Get font size from road or use default
      const fontSize = road.fontSize || 10;
      
      // Calculate angle based on nearby points to get road orientation
      let angle = 0;
      
      // Use custom angle if defined, otherwise calculate
      if (road.customAngle !== undefined) {
        angle = road.customAngle;
      } else if (points.length > 1) {
        // Use points before and after mid point if available
        const p1Index = Math.max(0, midPointIndex - Math.min(3, Math.floor(points.length / 10)));
        const p2Index = Math.min(points.length - 1, midPointIndex + Math.min(3, Math.floor(points.length / 10)));
        
        const p1 = points[p1Index];
        const p2 = points[p2Index];
        
        // Calculate angle in degrees
        angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * (180 / Math.PI);
        
        // Ensure text is not upside-down by adjusting angle
        if (angle > 90 || angle < -90) {
          angle += 180;
        }
      }
      
      // Check if we've already drawn this name nearby
      // Skip deduplication check if this label has a custom position
      const hasCustomPosition = offsetX !== 0 || offsetY !== 0;
      
      if (!hasCustomPosition) {
        const existingPositions = drawnLabels.get(road.name) || [];
        const isTooClose = existingPositions.some(pos => {
          const dx = labelPos[0] - pos[0];
          const dy = labelPos[1] - pos[1];
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < MIN_LABEL_DISTANCE;
        });
        
        // If it's too close to an existing label with the same name, don't draw it
        if (isTooClose) {
          return;
        }
        
        // Otherwise, add this position to our tracking map
        drawnLabels.set(road.name, [...existingPositions, labelPos]);
      }
      
      // Create and add the text element
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.textContent = road.name;
      text.setAttribute('x', labelPos[0].toString());
      text.setAttribute('y', labelPos[1].toString());
      text.setAttribute('font-size', fontSize.toString());
      text.setAttribute('fill', 'black');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('transform', `rotate(${angle}, ${labelPos[0]}, ${labelPos[1]})`);
      svg.appendChild(text);
    });

    // Render standalone text labels
    if (standaloneLabels && standaloneLabels.length > 0) {
      standaloneLabels.forEach(label => {
        if (!label.visible) return;
        
        // Create and add the text element
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.textContent = label.text;
        text.setAttribute('x', label.position[0].toString());
        text.setAttribute('y', label.position[1].toString());
        text.setAttribute('font-size', (label.fontSize || 12).toString());
        text.setAttribute('fill', 'black');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('transform', `rotate(${label.angle || 0}, ${label.position[0]}, ${label.position[1]})`);
        svg.appendChild(text);
      });
    }

    // Download SVG
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vicinity-map.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error creating SVG:', error);
  }
}