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

Key features:
- Uses `MapContainer` from react-leaflet to display the map
- Implements address search through Nominatim OpenStreetMap API
- Manages map state through a ref (`mapRef`)
- Handles the final export process for SVG and DXF formats

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
- `RoadList`: Displays the list of roads with checkboxes
- `RoadListItem`: Individual road item with toggle controls
- `StandaloneLabelList`: List of standalone text labels
- `EditorToolbar`: Contains editor tools and controls
- `EditorModeSelector`: UI for switching between editor modes
- `SelectionTools`: Tools for rectangle selection
- `ZoomControls`: Zoom in/out and reset buttons
- `ExportPanel`: Format selection and export button
- `NewLabelInput`: Input for adding new text labels

##### Rendering Components
- `RoadPaths`: Renders the SVG paths for roads
- `RoadLabels`: Renders the text labels for road names
- `StandaloneLabelsRenderer`: Renders standalone text labels
- `SelectionRectangle`: Renders the selection rectangle

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

### Export Functionality

#### SVG Export (`svgExport.ts`)
- Creates an SVG document with proper viewbox
- Renders roads as path elements
- Renders road names and standalone labels as text elements
- Handles deduplication of road labels
- Generates and downloads the SVG file

#### DXF Export (`dxfExport/index.ts`)
- Creates a DXF document using the @tarikjabiri/dxf library
- Adds roads as line entities in a "Roads" layer
- Adds road names and standalone labels as text entities in a "Labels" layer
- Preserves custom positioning, rotation, and font size
- Generates and downloads the DXF file

### Utility Functions

#### `coordinateTransforms.ts`
- Transforms between geographic coordinates and SVG coordinates
- Handles scaling and positioning of elements

#### `roadUtils.ts`
- Contains utilities for working with road data
- Provides functions for calculating road angles and label positions

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

## Limitations and Future Improvements

- SVG viewBox is directly using geographic coordinates which may lead to scaling issues
- Road name positioning is simplistic (middle point of the road)
- Limited styling options for the exported files
- No ability to customize road colors or widths
- No support for saving or loading previous selections

## Conclusion

The Vicinity Map Generator successfully implements its core purpose of creating vector images of roads from selected map areas. The implementation follows a logical flow from map navigation to road selection to file export, with appropriate user interfaces at each step. With support for both SVG and AutoCAD DXF formats, the application serves both web/graphics users and CAD/engineering users who need to incorporate roads into technical drawings. 