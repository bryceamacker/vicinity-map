// Common type definitions for the application

// Export format type
export type ExportFormat = 'svg' | 'dxf';

// Editor mode type
export type EditorMode = 'selection' | 'labelEdit' | 'textAdd';

// Selection mode type
export type SelectionMode = 'select' | 'deselect' | 'none';

// Road interface
export interface Road {
  id: string;
  name: string;
  type?: string;
  visible: boolean;
  showName: boolean;
  points: [number, number][];
  svgPoints: [number, number][];
  labelOffset?: [number, number]; // Store custom position offset for the label
  fontSize?: number; // Custom font size
  customAngle?: number; // Custom rotation angle (overrides the automatic angle)
}

// Standalone text label interface
export interface StandaloneLabel {
  id: string;
  text: string;
  position: [number, number];
  fontSize?: number;
  angle?: number;
  visible: boolean;
}

// Selection rectangle type
export interface SelectionRect {
  startX: number;
  startY: number;
  width: number;
  height: number;
} 