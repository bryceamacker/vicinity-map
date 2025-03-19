import { DxfWriter, point3d } from '@tarikjabiri/dxf';
import { TextHorizontalAlignment, TextVerticalAlignment } from '@tarikjabiri/dxf';

interface Road {
  id: string;
  name: string;
  type?: string;
  visible: boolean;
  showName: boolean;
  points: [number, number][];
  svgPoints: [number, number][];
  labelOffset?: [number, number];
  fontSize?: number;
  customAngle?: number;
}

interface StandaloneLabel {
  id: string;
  text: string;
  position: [number, number];
  fontSize?: number;
  angle?: number;
  visible: boolean;
}

/**
 * Export roads and standalone labels to DXF format
 * @param roads The roads to include in the export
 * @param standaloneLabels Optional standalone labels to include
 */
export const exportToDXF = (roads: Road[], standaloneLabels: StandaloneLabel[] = []) => {
  try {
    // Create a new DXF writer
    const dxf = new DxfWriter();
    
    // Instead of using document.addLayer, just set the layer names directly on entities
    // We'll use these names when creating entities
    const ROAD_LAYER = "Roads";
    const LABEL_LAYER = "Labels";
    
    // First pass: Add all road paths as lines
    roads.forEach(road => {
      // Use svgPoints for the export if available, otherwise fall back to points
      const points = road.svgPoints || road.points;
      if (!points || points.length < 2) return;
      
      // Add each segment as a line entity
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        
        const line = dxf.addLine(
          point3d(p1[0], p1[1], 0),
          point3d(p2[0], p2[1], 0),
          { layerName: ROAD_LAYER }
        );
      }
    });
    
    // Second pass: Draw road names with deduplication
    // Track drawn label positions to prevent duplicates
    const drawnLabels = new Map<string, Array<[number, number]>>();
    
    // Minimum distance between same name labels
    const MIN_LABEL_DISTANCE = 150;
    
    // Filter and sort roads with names to draw
    const roadsWithNamesToDraw = roads
      .filter(road => road.name && road.showName)
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
        
        const aOrder = typeOrder[typeA as keyof typeof typeOrder] || 8;
        const bOrder = typeOrder[typeB as keyof typeof typeOrder] || 8;
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        
        // If same type, prefer longer roads
        return b.points.length - a.points.length;
      });
    
    // Add road labels
    roadsWithNamesToDraw.forEach(road => {
      // Use svgPoints for the export if available, otherwise fall back to points
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
      
      // Calculate angle based on nearby points or use custom angle
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
      
      // Add text entity
      const text = dxf.addText(
        point3d(labelPos[0], labelPos[1], 0),
        fontSize,
        road.name,
        {
          rotation: angle,
          horizontalAlignment: TextHorizontalAlignment.Center,
          verticalAlignment: TextVerticalAlignment.Middle,
          layerName: LABEL_LAYER
        }
      );
    });
    
    // Add standalone text labels
    if (standaloneLabels && standaloneLabels.length > 0) {
      standaloneLabels.forEach(label => {
        if (!label.visible) return;
        
        // Add text entity
        const text = dxf.addText(
          point3d(label.position[0], label.position[1], 0),
          label.fontSize || 12,
          label.text,
          {
            rotation: label.angle || 0,
            horizontalAlignment: TextHorizontalAlignment.Center,
            verticalAlignment: TextVerticalAlignment.Middle,
            layerName: LABEL_LAYER
          }
        );
      });
    }
    
    // Generate DXF string
    const dxfString = dxf.stringify();
    
    // Create download
    const blob = new Blob([dxfString], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vicinity-map.dxf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error creating DXF:', error);
  }
}; 