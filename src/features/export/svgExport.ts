import { Road, StandaloneLabel } from '../../types';
import { getCalculatedAngle } from '../../utils/roadUtils';
import { SVG_WIDTH, SVG_HEIGHT } from '../../context/EditorContext';

/**
 * Get style attributes for a road based on its feature type
 */
function getRoadStyle(road: Road): { stroke: string; strokeWidth: string; strokeDasharray?: string } {
  const featureType = road.featureType || 'highway';
  
  switch (featureType) {
    case 'railway':
      return { 
        stroke: '#555', 
        strokeWidth: '1.5', 
        strokeDasharray: '5,3' 
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
}

/**
 * Creates and downloads an SVG file from road and label data
 */
export function exportToSVG(roads: Road[], standaloneLabels: StandaloneLabel[] = []) {
  try {
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(SVG_WIDTH));
    svg.setAttribute('height', String(SVG_HEIGHT));
    svg.setAttribute('viewBox', `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`);
    
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
      
      // Get style based on feature type
      const style = getRoadStyle(road);
      path.setAttribute('stroke', style.stroke);
      path.setAttribute('stroke-width', style.strokeWidth);
      if (style.strokeDasharray) {
        path.setAttribute('stroke-dasharray', style.strokeDasharray);
      }
      
      path.setAttribute('fill', 'none');
      svg.appendChild(path);
    });

    // Track drawn label positions for deduplication
    const drawnLabels = new Map<string, Array<[number, number]>>();
    const MIN_LABEL_DISTANCE = 150;
    
    // Sort roads for drawing labels with prioritization
    const roadsWithNamesToDraw = [...roads]
      .filter(road => road.name && (road.showName !== false))
      .sort((a, b) => {
        // Prioritize by road type
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
    
    // Second pass: Draw road names with deduplication
    roadsWithNamesToDraw.forEach(road => {
      const points = road.svgPoints || road.points;
      if (!points || points.length === 0) return;
      
      // Calculate position for text
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
      
      // Get angle (custom or calculated)
      let angle = 0;
      if (road.customAngle !== undefined) {
        angle = road.customAngle;
      } else {
        angle = getCalculatedAngle(points);
      }
      
      // Check if we've already drawn this name nearby
      // Skip deduplication if this label has a custom position
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
    if (standaloneLabels.length > 0) {
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