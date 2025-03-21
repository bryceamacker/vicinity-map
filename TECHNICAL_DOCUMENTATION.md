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

### Component Structure

Let's explore the key components and their roles:

#### 1. App Component (`App.tsx`)

The main application container that:
- Manages the Leaflet map view
- Provides address search functionality
- Handles the initial export process
- Controls the visibility of the road editor modal

Key features:
- Uses `MapContainer` from react-leaflet to display the map
- Implements address search through Nominatim OpenStreetMap API
- Manages map state through a ref (`mapRef`)
- Triggers the road processing when "Export" is clicked
- Handles conditional export to SVG or DXF based on user selection

#### 2. Road Editor Component (`RoadEditor.tsx`)

A modal interface that allows users to:
- View the roads in the selected area
- Toggle visibility of individual roads
- Preview the selection in real-time
- Choose the export format (SVG or DXF)
- Export the final selection in the chosen format

Key features:
- Maintains a list of roads with visibility states
- Implements undo functionality with a history stack
- Provides a live preview of the selected roads
- Offers format selection between SVG and AutoCAD DXF
- Handles the final export process

#### 3. Map Utilities (`mapUtils.ts`)

Contains utility functions for:
- Fetching road data from OpenStreetMap via Overpass API
- Processing geographic data into usable road objects
- Generating and downloading SVG files

#### 4. DXF Export Utilities (`dxfExport.ts`)

Contains utility functions for:
- Converting road and label data to AutoCAD-compatible DXF format
- Organizing entities into appropriate layers (Roads and Labels)
- Generating and downloading DXF files

### Data Flow and Processing

#### 1. Road Data Acquisition

When the user clicks "Export" in the main view:
1. The application captures the current map bounds using `mapRef.current.getBounds()`
2. It calls `processRoads(bounds)` which:
   - Constructs an Overpass API query for highways within the bounds
   - Fetches road and node data from OpenStreetMap
   - Processes the response into a structured format with:
     - Road IDs
     - Road names
     - Visibility flags
     - Coordinate points for each road

#### 2. Road Selection Interface

The RoadEditor component:
1. Receives the processed road data
2. Displays each road with a checkbox for selection
3. Renders a preview SVG showing only the currently selected roads
4. Maintains a history stack for undo operations
5. When roads are toggled, it updates both the list and preview
6. Provides a dropdown to select the export format (SVG or DXF)

Key state management:
```typescript
const [roads, setRoads] = useState(initialRoads);
const [history, setHistory] = useState<Road[][]>([initialRoads]);
const [historyIndex, setHistoryIndex] = useState(0);
const [exportFormat, setExportFormat] = useState<ExportFormat>('svg');
```

#### 3. File Generation and Export

When the user finalizes their selection:
1. The `handleFinalExport` function in App.tsx is called with the selected roads and format option
2. Depending on the selected format:
   
   For SVG export:
   - Calls `fetchRoadsAndExportSVG` which:
     - Creates an SVG document with appropriate viewport settings
     - Adds a white background rectangle
     - Draws each selected road as a path
     - Adds text elements for road names
     - Serializes the SVG to a string
     - Creates a downloadable blob
     - Triggers the download via a temporary anchor element
   
   For DXF export:
   - Dynamically imports and calls `exportToDXF` which:
     - Creates a new DXF document using the @tarikjabiri/dxf library
     - Adds each road segment as line entities in a "Roads" layer
     - Adds road labels as text entities in a "Labels" layer
     - Adds standalone labels as text entities
     - Preserves all custom positioning, rotation, and font size settings
     - Generates the DXF string
     - Creates a downloadable blob
     - Triggers the download via a temporary anchor element

### Technical Implementation Details

#### Map Integration

The application uses Leaflet for map rendering and interaction:
- The map is initialized with a default view (London: `[51.505, -0.09]`)
- TileLayer uses OpenStreetMap tiles
- A ref (`mapRef`) allows direct access to the map instance for operations like getting bounds and setting views

#### Geographic Data Processing

The Overpass API is used to fetch roads:
```typescript
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
```

This query:
- Requests highways within the specified geographic bounds
- Retrieves both the roads and their constituent nodes
- The response is processed to:
  - Map node IDs to coordinates
  - Convert ways (roads) to structured objects with coordinates derived from nodes

#### SVG Rendering

Two levels of SVG rendering occur:
1. **Preview rendering** - A React-based SVG in the Road Editor:
   ```jsx
   <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
     {roads.map(road => (
       road.visible && (
         <g key={road.id}>
           <path
             d={`M ${road.points.map(p => p.join(',')).join(' L ')}`}
             stroke="black"
             strokeWidth="1"
             fill="none"
           />
           {/* Road name text elements */}
         </g>
       )
     ))}
   </svg>
   ```

2. **Final SVG export** - A programmatically generated SVG using the DOM API:
   - Creates SVG, path, and text elements
   - Sets appropriate attributes based on road data
   - Serializes to a string and creates a downloadable file

#### DXF Generation

For AutoCAD-compatible export, the application uses the @tarikjabiri/dxf library:
1. **DXF document creation**:
   ```typescript
   const dxf = new DxfWriter();
   ```

2. **Adding roads as line entities**:
   ```typescript
   for (let i = 0; i < points.length - 1; i++) {
     const p1 = points[i];
     const p2 = points[i + 1];
     
     const line = dxf.addLine(
       point3d(p1[0], p1[1], 0),
       point3d(p2[0], p2[1], 0),
       { layerName: ROAD_LAYER }
     );
   }
   ```

3. **Adding text labels**:
   ```typescript
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
   ```

4. **Exporting the DXF file**:
   ```typescript
   const dxfString = dxf.stringify();
   // Create download with the generated string
   ```

## Architectural Strengths and Limitations

### Strengths:
- Clear separation of concerns between map viewing, road selection, and file generation
- Efficient use of OpenStreetMap API to fetch only necessary data
- Real-time preview of selected roads
- Multiple export formats (SVG for web/vector graphics and DXF for CAD applications)
- Undo functionality for selection mistakes
- Clean user interface with intuitive workflow
- Support for custom label positioning, rotation, and sizing
- Layer organization in DXF exports for better CAD workflow

### Limitations:
- SVG viewBox is directly using geographic coordinates which may lead to scaling issues
- Road name positioning is simplistic (middle point of the road)
- Limited styling options for the exported files
- No ability to customize road colors or widths
- No support for saving or loading previous selections

## Conclusion

The Vicinity Map Generator successfully implements its core purpose of creating vector images of roads from selected map areas. The implementation follows a logical flow from map navigation to road selection to file export, with appropriate user interfaces at each step. With support for both SVG and AutoCAD DXF formats, the application serves both web/graphics users and CAD/engineering users who need to incorporate roads into technical drawings. 