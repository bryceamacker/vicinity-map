import { DxfWriter, point3d } from '@tarikjabiri/dxf';
import { TextHorizontalAlignment, TextVerticalAlignment } from '@tarikjabiri/dxf';
import { Road, StandaloneLabel } from '../../../types';

/**
 * Exports road data to DXF format for use with CAD software
 * @param roads The roads to include in the export
 * @param standaloneLabels Optional standalone labels to include
 * @param options Options for the export process
 * @returns The DXF string if skipDownload is true, otherwise undefined
 */
export const exportToDXF = (
  roads: Road[], 
  standaloneLabels: StandaloneLabel[] = [], 
  options?: { skipDownload?: boolean }
): string | undefined => {
  try {
    // Create a new DXF document
    const dxf = new DxfWriter();
    
    // Set up the document with better color choices
    // Color 7 is white/black (depending on background)
    // Color 0 is white/black by block
    dxf.setVariable('$INSUNITS', 1); // Inches
    dxf.addLayer('Roads', 7); // Use white/black for roads (more readable)
    dxf.addLayer('Labels', 7); // Use white/black for labels (more readable)
    
    // Find the bounding box of all coordinates to calculate the center for Y-axis flipping
    let minY = Infinity, maxY = -Infinity;
    
    // First pass - find the Y-axis bounds
    roads.forEach(road => {
      if (!road.visible || !road.svgPoints || road.svgPoints.length < 2) return;
      
      road.svgPoints.forEach(point => {
        minY = Math.min(minY, point[1]);
        maxY = Math.max(maxY, point[1]);
      });
    });
    
    // Calculate the Y-axis midpoint for flipping
    const midY = (minY + maxY) / 2;
    
    // Add all visible roads with flipped Y coordinates
    roads.forEach(road => {
      if (!road.visible || !road.svgPoints || road.svgPoints.length < 2) return;
      
      // Add each segment as a line with flipped Y coordinates
      for (let i = 0; i < road.svgPoints.length - 1; i++) {
        const p1 = road.svgPoints[i];
        const p2 = road.svgPoints[i + 1];
        
        // Flip Y coordinate (mirror across horizontal axis)
        const p1Flipped = [
          p1[0], 
          2 * midY - p1[1]
        ];
        
        const p2Flipped = [
          p2[0],
          2 * midY - p2[1]
        ];
        
        const line = dxf.addLine(
          new point3d(p1Flipped[0], p1Flipped[1], 0),
          new point3d(p2Flipped[0], p2Flipped[1], 0),
          { layerName: 'Roads' }
        );
      }
    });
    
    // Track drawn label positions to prevent duplicates
    const drawnLabels = new Map<string, Array<[number, number]>>();
    
    // Minimum distance between same name labels
    const MIN_LABEL_DISTANCE = 150;
    
    // Filter and sort roads with names to draw
    const roadsWithNamesToDraw = roads
      .filter(road => road.visible && road.showName && road.name)
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
        return b.svgPoints.length - a.svgPoints.length;
      });
    
    // Add road labels with deduplication
    roadsWithNamesToDraw.forEach(road => {
      if (!road.svgPoints || road.svgPoints.length === 0) return;
      
      // Calculate middle point for text position
      const midPointIndex = Math.floor(road.svgPoints.length / 2);
      const midPoint = road.svgPoints[midPointIndex];
      
      // Apply custom offset if it exists
      const offsetX = road.labelOffset?.[0] || 0;
      const offsetY = road.labelOffset?.[1] || 0;
      
      // Calculate flipped position (only flip Y)
      const flippedY = 2 * midY - midPoint[1];
      
      const labelPos: [number, number] = [
        midPoint[0] + offsetX,
        flippedY - offsetY // Invert Y offset since Y axis is flipped
      ];
      
      // Get font size from road or use default
      const fontSize = road.fontSize || 10;
      
      // Calculate angle for the text
      let angle = 0;
      
      // Use custom angle if defined, otherwise calculate
      if (road.customAngle !== undefined) {
        // Invert angle since Y is flipped
        angle = -road.customAngle;
      } else if (road.svgPoints.length > 1) {
        // Use points before and after mid point if available
        const p1Index = Math.max(0, midPointIndex - Math.min(3, Math.floor(road.svgPoints.length / 10)));
        const p2Index = Math.min(road.svgPoints.length - 1, midPointIndex + Math.min(3, Math.floor(road.svgPoints.length / 10)));
        
        const p1 = road.svgPoints[p1Index];
        const p2 = road.svgPoints[p2Index];
        
        // Calculate angle in degrees
        angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * (180 / Math.PI);
        
        // Invert angle since Y is flipped
        angle = -angle;
        
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
      dxf.addText(
        new point3d(labelPos[0], labelPos[1], 0),
        fontSize,
        road.name,
        {
          rotation: angle,
          horizontalAlignment: TextHorizontalAlignment.Center,
          verticalAlignment: TextVerticalAlignment.Middle,
          layerName: 'Labels'
        }
      );
    });
    
    // Add standalone text labels - also with flipped Y
    standaloneLabels.forEach(label => {
      if (!label.visible) return;
      
      // Flip Y coordinate
      const flippedY = 2 * midY - label.position[1];
      
      // Add text entity with flipped position and angle
      dxf.addText(
        new point3d(label.position[0], flippedY, 0),
        label.fontSize || 12,
        label.text,
        {
          // Invert angle since Y is flipped
          rotation: -(label.angle || 0),
          horizontalAlignment: TextHorizontalAlignment.Center,
          verticalAlignment: TextVerticalAlignment.Middle,
          layerName: 'Labels'
        }
      );
    });
    
    // Generate DXF string
    const dxfString = dxf.stringify();
    
    // If skipDownload is true, return the DXF string instead of downloading
    if (options?.skipDownload) {
      return dxfString;
    }
    
    // Otherwise, download the file
    const blob = new Blob([dxfString], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vicinity-map.dxf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return undefined;
  } catch (error) {
    console.error('Error creating DXF:', error);
    alert('Failed to create DXF file. See console for details.');
    return undefined;
  }
}; 