import { Road, StandaloneLabel } from '../../../types';
import { useEditorContext } from '../../../context/EditorContext';
import { nanoid } from 'nanoid';

// Define the interface for export options
interface ExportOptions {
  onlySelectedFeatureTypes?: boolean;
  selectedFeatureTypes?: Record<string, boolean>;
}

/**
 * Exports road data to SVG format
 * @param roads Roads to export
 * @param standaloneLabels Optional standalone labels to export
 * @param options Export options
 * @returns SVG string
 */
export function exportToSVG(roads: Road[], standaloneLabels?: StandaloneLabel[], options?: ExportOptions): string {
  // Filter to only visible roads and optionally filter by feature type
  const visibleRoads = roads.filter(road => 
    road.visible && 
    (!options?.onlySelectedFeatureTypes || 
      options.selectedFeatureTypes?.[road.featureType || 'highway'])
  );

  if (visibleRoads.length === 0 && (!standaloneLabels || standaloneLabels.length === 0)) {
    return '';
  }

  // Find the bounding box of the coordinates
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const road of visibleRoads) {
    if (!road.svgPoints) continue;
    for (const [x, y] of road.svgPoints) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  // Add 20 units of padding
  const padding = 20;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const width = maxX - minX;
  const height = maxY - minY;

  // Build the SVG XML
  const svgContent = [];
  svgContent.push(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>`);
  svgContent.push(`<svg width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`);
  
  // Add a style section for the classes
  svgContent.push(`<style>
    .road { stroke: black; stroke-width: 1.5; fill: none; }
    .railway { stroke: #555; stroke-width: 1.5; fill: none; }
    .waterway { stroke: #2B7CE9; stroke-width: 1.8; fill: none; }
    .road-label { font-family: Arial; font-size: 10px; fill: black; text-anchor: middle; }
  </style>`);

  // Create a group for road paths
  svgContent.push(`<g id="roads">`);
  for (const road of visibleRoads) {
    if (!road.svgPoints || road.svgPoints.length < 2) continue;
    
    const featureType = road.featureType || 'highway';
    
    // Special handling for railways - draw as parallel tracks with cross ties
    if (featureType === 'railway') {
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
        
        // Add first rail
        svgContent.push(`<path class="railway" d="M ${p1[0] + offsetX},${p1[1] + offsetY} L ${p2[0] + offsetX},${p2[1] + offsetY}" />`);
        
        // Add second rail
        svgContent.push(`<path class="railway" d="M ${p1[0] - offsetX},${p1[1] - offsetY} L ${p2[0] - offsetX},${p2[1] - offsetY}" />`);
        
        // Add cross ties at regular intervals
        const numTies = Math.floor(length / 10); // One tie every 10 units
        if (numTies > 0) {
          for (let j = 0; j <= numTies; j++) {
            // Position along the track
            const t = j / numTies;
            const tieX = p1[0] + t * dx;
            const tieY = p1[1] + t * dy;
            
            // Add a short line perpendicular to the track to represent a tie
            svgContent.push(`<path class="railway" d="M ${tieX + offsetX * 1.2},${tieY + offsetY * 1.2} L ${tieX - offsetX * 1.2},${tieY - offsetY * 1.2}" />`);
          }
        }
      }
    } else {
      // Regular paths for roads and waterways
      const className = featureType === 'waterway' ? 'waterway' : 'road';
      svgContent.push(`<path class="${className}" d="M ${road.svgPoints.map(p => p.join(',')).join(' L ')}" />`);
    }

    // Add road name if it exists
    if (road.name) {
      // Find the midpoint of the road to place the label
      const midIndex = Math.floor(road.svgPoints.length / 2);
      const midPoint = road.svgPoints[midIndex];
      
      svgContent.push(`<text class="road-label" x="${midPoint[0]}" y="${midPoint[1] - 5}">${road.name}</text>`);
    }
  }
  svgContent.push(`</g>`);

  // Add standalone labels if any
  if (standaloneLabels && standaloneLabels.length > 0) {
    svgContent.push(`<g id="labels">`);
    for (const label of standaloneLabels) {
      svgContent.push(`<text class="road-label" x="${label.position[0]}" y="${label.position[1]}">${label.text}</text>`);
    }
    svgContent.push(`</g>`);
  }

  svgContent.push(`</svg>`);
  return svgContent.join('\n');
}

/**
 * Generates a downloadable SVG blob URL
 * @param svgContent SVG content string
 * @returns Blob URL for download
 */
export function generateSvgDownload(svgContent: string): string {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

/**
 * Returns a unique filename for SVG export
 * @returns Filename string
 */
export function getSvgFilename(): string {
  return `vicinity-map-${nanoid(6)}.svg`;
} 