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
    
    // Set up the document
    dxf.setVariable('$INSUNITS', 1); // Inches
    
    // Add a custom railroad line pattern to the tables section
    // (Note: The actual method might differ, we'll make our railways visually distinct
    // by using different colors and line widths instead)
    
    // Add layers with appropriate colors
    // Color numbers in DXF:
    // 1=Red, 2=Yellow, 3=Green, 4=Cyan, 5=Blue, 6=Magenta, 7=White/Black, 8=Gray
    dxf.addLayer('Roads', 7); // White/Black for roads
    dxf.addLayer('Railways', 4); // Cyan color for railways - more distinct
    dxf.addLayer('Waterways', 5); // Blue color for waterways
    dxf.addLayer('Labels', 7); // White/Black for labels
    
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
    
    // Function to simulate railway tracks by adding parallel offset lines
    const addRailwaySegment = (p1: number[], p2: number[], layerName: string) => {
      // Calculate a perpendicular vector for the offset
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length < 0.001) return; // Skip extremely short segments
      
      // Normalize and get perpendicular
      const offsetX = (dy / length) * 2; // 2 units perpendicular offset
      const offsetY = -(dx / length) * 2;
      
      // Create two parallel lines to simulate railway tracks
      // First rail
      dxf.addLine(
        new point3d(p1[0] + offsetX, p1[1] + offsetY, 0),
        new point3d(p2[0] + offsetX, p2[1] + offsetY, 0),
        { layerName }
      );
      
      // Second rail
      dxf.addLine(
        new point3d(p1[0] - offsetX, p1[1] - offsetY, 0),
        new point3d(p2[0] - offsetX, p2[1] - offsetY, 0),
        { layerName }
      );
      
      // Add cross ties at regular intervals
      const numTies = Math.floor(length / 15); // One tie every 15 units
      if (numTies > 0) {
        const step = length / numTies;
        for (let i = 0; i <= numTies; i++) {
          // Position along the track
          const t = i / numTies;
          const tieX = p1[0] + t * dx;
          const tieY = p1[1] + t * dy;
          
          // Add a short line perpendicular to the track to represent a tie
          dxf.addLine(
            new point3d(tieX + offsetX * 1.2, tieY + offsetY * 1.2, 0),
            new point3d(tieX - offsetX * 1.2, tieY - offsetY * 1.2, 0),
            { layerName }
          );
        }
      }
    };
    
    // Add all visible roads with flipped Y coordinates
    roads.forEach(road => {
      if (!road.visible || !road.svgPoints || road.svgPoints.length < 2) return;
      
      // Determine which layer to use based on feature type
      const featureType = road.featureType || 'highway';
      let layerName = 'Roads';
      
      if (featureType === 'railway') {
        layerName = 'Railways';
      } else if (featureType === 'waterway') {
        layerName = 'Waterways';
      }
      
      // Add each segment
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
        
        if (featureType === 'railway') {
          // Use our custom function to draw railway tracks
          addRailwaySegment(p1Flipped, p2Flipped, layerName);
        } else {
          // Regular line for roads and waterways
          dxf.addLine(
            new point3d(p1Flipped[0], p1Flipped[1], 0),
            new point3d(p2Flipped[0], p2Flipped[1], 0),
            { layerName }
          );
        }
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