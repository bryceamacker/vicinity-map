# Vicinity Map Technical Documentation

## Application Overview

The Vicinity Map Generator is a web application that allows users to create vector images of roads and road names from a selected area on a map. The application supports exporting to SVG format or AutoCAD-compatible DXF format. It is built with Vite, React, and TypeScript, with styling provided by Tailwind CSS. It leverages the OpenStreetMap API via Overpass to fetch road data and Leaflet for map visualization.

## Core Application Flow

1. User navigates to a location on the map (by searching an address or panning/zooming)
2. User selects "Export" to capture the currently visible area
3. A modal editor appears showing all roads in the area with checkboxes to select/deselect them
4. User selects the roads they want to include in the final output
5. User selects the desired export format (SVG or AutoCAD DXF)
6. User clicks "Export" to download the file containing only the selected roads in the chosen format
7. For DXF exports, users can preview the file before downloading to verify content and orientation

## Technical Implementation

### Directory Structure

The application follows a feature-based directory structure:

```
src/
├── types/                 # Centralized type definitions
├── context/               # Context-based state management
├── hooks/                 # Custom hooks for complex logic
├── utils/                 # Utility functions
├── services/              # API and data services
├── features/              # Feature-specific components and logic
│   ├── roadEditor/        # Road editor feature
│   │   ├── components/    # Editor-specific components
│   │   └── RoadEditorContainer.tsx
│   ├── dxfPreview/        # DXF preview functionality
│   │   ├── components/    # DXF preview components
│   │   └── DxfPreviewContainer.tsx
│   └── export/            # Export functionality
│       ├── components/    # Export-related components
│       ├── dxfExport/     # DXF export functionality
│       └── svgExport.ts   # SVG export functionality
└── App.tsx                # Main application component
```

### Component Architecture

The application follows a component-based architecture with a focus on separation of concerns. Each component has a single responsibility and is organized hierarchically:

#### 1. App Component (`App.tsx`)

The main application container that:
- Manages the Leaflet map view
- Provides address search functionality
- Triggers the road data fetching from OpenStreetMap
- Controls the visibility of the road editor modal
- Manages the DXF preview state and data

Key features:
- Uses `MapContainer` from react-leaflet to display the map
- Implements address search through Nominatim OpenStreetMap API
- Manages map state through a ref (`mapRef`)
- Handles the final export process for SVG and DXF formats
- Caches export data for the DXF preview

#### 2. Road Editor Container (`RoadEditorContainer.tsx`)

A container component that orchestrates the road editor functionality:
- Provides a context provider for state management
- Manages the overall editor layout
- Coordinates interactions between child components

Key features:
- Wraps the editor content with the `EditorProvider` for context-based state
- Handles logic for combined mouse events (pan, select, drag)
- Coordinates the export process

#### 3. Road Editor Components

The road editor is composed of multiple specialized components:

##### UI Components
- `RoadList`: Displays the list of roads with checkboxes, grouped by feature type
- `RoadListItem`: Individual road item with toggle controls
- `RoadTypeGroup`: Groups roads by type within feature categories (highway, railway, waterway)
- `StandaloneLabelList`: List of standalone text labels
- `EditorToolbar`: Contains editor tools and controls
- `EditorModeSelector`: UI for switching between editor modes
- `SelectionTools`: Tools for rectangle selection
- `ZoomControls`: Zoom in/out and reset buttons
- `ExportPanel`: Format selection and export button
- `NewLabelInput`: Input for adding new text labels

##### Rendering Components
- `RoadPaths`: Renders the SVG paths for roads, railways, and waterways with appropriate styling
- `RoadLabels`: Renders the text labels for road names
- `StandaloneLabelsRenderer`: Renders standalone text labels
- `SelectionRectangle`: Renders the selection rectangle

#### 4. DXF Preview Container (`DxfPreviewContainer.tsx`)

A modal container that shows a preview of the DXF file before exporting:
- Embeds the `DxfViewer` component 
- Provides navigation controls to go back to the editor
- Includes a download button to save the DXF file
- Features a text visibility toggle for showing/hiding text labels

Key features:
- Modal interface with clear actions (back, close, download)
- Text visibility toggle for better visualization
- Full-screen preview of the DXF content

#### 5. DXF Viewer Component (`DxfViewer.tsx`)

A specialized component that renders DXF content:
- Loads and renders DXF data using the `dxf-viewer` library
- Shows loading progress and error states
- Provides a reference to the viewer instance for parent components

Key features:
- Uses local font files to ensure consistent text rendering
- Handles proper cleanup of resources when unmounted
- Provides touch interaction handling and scroll prevention
- Progress and error indicators during loading

### State Management

The application uses React Context for state management:

#### `EditorContext.tsx`

Provides a centralized state for the editor:
- Road data and visibility state
- Standalone labels
- Editor mode (selection, label editing, text adding)
- Selection mode (select, deselect, none)
- History for undo functionality
- Zoom and pan state
- Selected labels and dragging state
- Feature type visibility management

A reducer pattern is used to handle state updates in a predictable way:
- Each action has a specific type and payload
- The reducer function processes actions and returns a new state
- Dispatch function is used to trigger state updates

### Custom Hooks

Custom hooks encapsulate complex logic:

#### `useMapInteraction`
- Manages zoom and pan functionality
- Provides viewport calculations
- Handles mouse wheel events
- Converts between screen and SVG coordinates

#### `useRectangleSelection`
- Manages rectangle selection state
- Handles mouse events for drawing selection rectangles
- Applies selection to roads that intersect with the rectangle

#### `useLabelEditing`
- Handles label selection and dragging
- Manages label rotation and resizing
- Handles standalone label interactions

### Services

Services handle API interactions and data processing:

#### `overpassService.ts`
- Fetches road data from OpenStreetMap via Overpass API
- Processes the response into a structured format
- Transforms geographic coordinates to SVG coordinates
- Categorizes roads, railways, and waterways into feature types
- Processes complex road type structures into simplified categories

### Data Model

#### Road Interface
The application uses a comprehensive data model to represent roads and other linear features:

```typescript
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
  labelOffset?: [number, number]; // Custom position offset for the label
  fontSize?: number; // Custom font size
  customAngle?: number; // Custom rotation angle (overrides the automatic angle)
}
```

Key additions:
- `featureType` property allows distinguishing between highways, railways, and waterways
- `originalType` stores the original OSM type for better identification of unnamed roads

#### Feature Type Categorization

The application categorizes features to enable better organization and visualization:

```typescript
// Road type categories for grouping
export enum RoadType {
  // Highway types
  Motorway = 'motorway',
  Trunk = 'trunk',
  Primary = 'primary',
  // ...other highway types...
  
  // Railway types
  RailwayMajor = 'railway_major',
  RailwayMinor = 'railway_minor',
  
  // Waterway types
  WaterwayMajor = 'waterway_major',
  WaterwayMinor = 'waterway_minor'
}

// Feature type categories for grouping headers
export enum FeatureTypeGroup {
  Highway = 'highway',
  Railway = 'railway',
  Waterway = 'waterway'
}
```

### Export Functionality

#### SVG Export (`svgExport/index.ts`)
- Creates an SVG document with proper viewbox
- Renders roads as path elements with appropriate styling
- Renders railways as parallel tracks with cross ties for realistic representation
- Renders waterways with distinctive blue styling
- Renders road names and standalone labels as text elements
- Handles deduplication of road labels
- Generates and downloads the SVG file

#### DXF Export (`dxfExport/index.ts`)
- Creates a DXF document using the @tarikjabiri/dxf library
- Adds roads as line entities in a "Roads" layer
- Adds railways as specialized track representations with parallel lines and cross ties
- Adds waterways as line entities in a "Waterways" layer with distinct color
- Adds road names and standalone labels as text entities in a "Labels" layer
- Preserves custom positioning, rotation, and font size
- Flips Y-coordinates to match the editor orientation
- Properly handles rotation and positioning of text elements
- Generates and downloads the DXF file or returns DXF content for preview

#### DXF Preview (`DxfPreviewContainer.tsx` and `DxfViewer.tsx`)
- Renders a preview of the DXF file before downloading
- Uses local font files to ensure consistent text rendering
- Provides a toggle for text visibility
- Allows users to verify the content and layout before finalizing

### Feature Type Visualization

#### Railway Visualization
Railways are rendered with a realistic track representation:
- Two parallel lines represent the rails
- Cross ties are drawn at regular intervals
- This specialized rendering is consistent across the editor, SVG export, and DXF export
- In the DXF export, railways are assigned to a dedicated "Railways" layer with cyan color

#### Waterway Visualization
Waterways are displayed with distinctive styling:
- Blue color to represent water
- Slightly thicker lines for major waterways
- In the DXF export, waterways are assigned to a dedicated "Waterways" layer with blue color

### Font Management

The application includes local font files for consistent rendering:
- Roboto Regular and Open Sans fonts are stored in the `public/fonts` directory
- These fonts are used by the DXF viewer component to ensure proper text rendering
- Local fonts eliminate issues with CORS, network connectivity, or unsupported font formats

### Utility Functions

#### `coordinateTransforms.ts`
- Transforms between geographic coordinates and SVG coordinates
- Handles scaling and positioning of elements

#### `roadUtils.ts`
- Contains utilities for working with road data
- Provides functions for calculating road angles and label positions
- Categorizes roads, railways, and waterways into appropriate types

## Architectural Strengths

### Separation of Concerns
- Each component, hook, and utility has a single responsibility
- Logic is cleanly separated from presentation
- Features are isolated and self-contained

### Maintainability
- Smaller files are easier to understand and modify
- Changes to one feature don't affect others
- New features can be added with minimal changes to existing code

### State Management
- Centralized state management using context
- Reducer pattern for predictable state updates
- State is accessible throughout the component tree

### Reusability
- Custom hooks encapsulate complex logic that can be reused
- Components are designed for reusability
- Utility functions provide common functionality

### Performance
- Components only re-render when their props or context changes
- Heavy computations are isolated in specialized components
- Data fetching is optimized to only retrieve necessary data

### Feature Type Organization
- Clear separation between highways, railways, and waterways
- Hierarchical organization of road types within feature categories
- Consistent visual representation across editor and exports

### Preview and Validation
- DXF preview feature allows users to validate their exports before downloading
- Text visibility toggle improves the preview experience
- Local font handling ensures consistent rendering across devices

## Limitations and Future Improvements

- SVG viewBox is directly using geographic coordinates which may lead to scaling issues
- Road name positioning is simplistic (middle point of the road)
- Limited styling options for the exported files
- No ability to customize road colors or widths
- No support for saving or loading previous selections
- Limited styling customization for different railway types (e.g., subway vs. tram)
- No direct support for non-linear water features like lakes and ponds

## Conclusion

The Vicinity Map Generator successfully implements its core purpose of creating vector images of roads from selected map areas, now with enhanced support for railways and waterways. The implementation follows a logical flow from map navigation to road selection to file export, with appropriate user interfaces at each step. With support for both SVG and AutoCAD DXF formats, the application serves both web/graphics users and CAD/engineering users who need to incorporate transportation and water features into technical drawings. The DXF preview functionality enhances the user experience by allowing verification of exports before downloading, ensuring the exported files meet user expectations. 