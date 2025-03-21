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
  originalType?: string; // The original OpenStreetMap highway type
  featureType?: 'highway' | 'railway' | 'waterway' | 'other'; // Type of feature
  visible: boolean;
  showName: boolean;
  points: [number, number][];
  svgPoints: [number, number][];
  labelOffset?: [number, number]; // Store custom position offset for the label
  fontSize?: number; // Custom font size
  customAngle?: number; // Custom rotation angle (overrides the automatic angle)
}

// Road type categories for grouping
export enum RoadType {
  // Highway types
  Motorway = 'motorway',
  Trunk = 'trunk',
  Primary = 'primary',
  Secondary = 'secondary',
  Tertiary = 'tertiary',
  Residential = 'residential',
  Service = 'service',
  Track = 'track',
  Path = 'path',
  Footway = 'footway',
  Cycleway = 'cycleway',
  Steps = 'steps',
  Unclassified = 'unclassified',
  Other = 'other',
  
  // Railway types
  RailwayMajor = 'railway_major',
  RailwayMinor = 'railway_minor',
  
  // Waterway types
  WaterwayMajor = 'waterway_major',
  WaterwayMinor = 'waterway_minor'
}

// Map of road types to display names
export const RoadTypeDisplayNames: Record<string, string> = {
  // Highway types
  [RoadType.Motorway]: 'Motorways & Freeways',
  [RoadType.Trunk]: 'Trunk Roads & Highways',
  [RoadType.Primary]: 'Primary Roads',
  [RoadType.Secondary]: 'Secondary Roads',
  [RoadType.Tertiary]: 'Tertiary Roads',
  [RoadType.Residential]: 'Residential Streets',
  [RoadType.Service]: 'Service Roads',
  [RoadType.Track]: 'Tracks',
  [RoadType.Path]: 'Paths',
  [RoadType.Footway]: 'Footways & Sidewalks',
  [RoadType.Cycleway]: 'Cycleways',
  [RoadType.Steps]: 'Steps & Stairs',
  [RoadType.Unclassified]: 'Unclassified Roads',
  [RoadType.Other]: 'Other Road Types',
  
  // Railway types
  [RoadType.RailwayMajor]: 'Major Railways',
  [RoadType.RailwayMinor]: 'Minor Railways & Tracks',
  
  // Waterway types
  [RoadType.WaterwayMajor]: 'Rivers & Canals',
  [RoadType.WaterwayMinor]: 'Streams & Creeks'
};

// Road type grouping priority (lower number = higher priority)
export const RoadTypePriority: Record<string, number> = {
  // Highway types (1-20)
  [RoadType.Motorway]: 1,
  [RoadType.Trunk]: 2,
  [RoadType.Primary]: 3,
  [RoadType.Secondary]: 4,
  [RoadType.Tertiary]: 5,
  [RoadType.Residential]: 6,
  [RoadType.Unclassified]: 7,
  [RoadType.Service]: 8,
  [RoadType.Track]: 9,
  [RoadType.Path]: 10,
  [RoadType.Footway]: 11,
  [RoadType.Cycleway]: 12,
  [RoadType.Steps]: 13,
  [RoadType.Other]: 14,
  
  // Railway types (21-30)
  [RoadType.RailwayMajor]: 21,
  [RoadType.RailwayMinor]: 22,
  
  // Waterway types (31-40)
  [RoadType.WaterwayMajor]: 31,
  [RoadType.WaterwayMinor]: 32
};

// Feature type categories for grouping headers
export enum FeatureTypeGroup {
  Highway = 'highway',
  Railway = 'railway',
  Waterway = 'waterway'
}

// Map of feature type groups to display names
export const FeatureTypeGroupNames: Record<string, string> = {
  [FeatureTypeGroup.Highway]: 'Roads & Paths',
  [FeatureTypeGroup.Railway]: 'Railways & Transit',
  [FeatureTypeGroup.Waterway]: 'Waterways'
};

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