import React, { useState, useRef, MouseEvent, useEffect } from 'react';
import { X, Download, Undo, ZoomIn, ZoomOut, RotateCcw, Move, MousePointer, RotateCw, Type, ChevronUp, ChevronDown } from 'lucide-react';

interface Road {
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

// Selection rectangle type
interface SelectionRect {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

// Selection mode type
type SelectionMode = 'select' | 'deselect' | 'none';

// Editor mode type - add label edit mode
type EditorMode = 'selection' | 'labelEdit';

interface RoadEditorProps {
  roads: Road[];
  onClose: () => void;
  onExport: (roads: Road[]) => void;
}

export function RoadEditor({ roads: initialRoads, onClose, onExport }: RoadEditorProps) {
  // Initialize roads with showName property if not already present
  const processedInitialRoads = initialRoads.map(road => ({
    ...road,
    showName: road.showName !== undefined ? road.showName : true,
    labelOffset: road.labelOffset || [0, 0],
    fontSize: road.fontSize || 10, // Default font size
    customAngle: road.customAngle
  }));
  
  const [roads, setRoads] = useState(processedInitialRoads);
  const [history, setHistory] = useState<Road[][]>([processedInitialRoads]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Selection mode and rectangle state
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none');
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Refs for SVG container and coordinates
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // SVG dimensions - these match the viewBox in the SVG
  const svgWidth = 800;
  const svgHeight = 600;
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewCenter, setViewCenter] = useState<[number, number]>([svgWidth / 2, svgHeight / 2]);
  
  // Calculate viewBox based on zoom
  const getViewBox = () => {
    const width = svgWidth / zoomLevel;
    const height = svgHeight / zoomLevel;
    const x = viewCenter[0] - width / 2;
    const y = viewCenter[1] - height / 2;
    return `${x} ${y} ${width} ${height}`;
  };
  
  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 10)); // Max zoom 10x
  };
  
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5)); // Min zoom 0.5x
  };
  
  const resetZoom = () => {
    setZoomLevel(1);
    setViewCenter([svgWidth / 2, svgHeight / 2]);
  };
  
  // Handle mouse wheel for zoom
  const handleWheel = (event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.5, Math.min(10, zoomLevel * factor));
      
      // Get mouse position in SVG coordinates
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (svgRect) {
        const mouseX = event.clientX - svgRect.left;
        const mouseY = event.clientY - svgRect.top;
        
        // Calculate mouse position ratio within the viewport
        const ratioX = mouseX / svgRect.width;
        const ratioY = mouseY / svgRect.height;
        
        // Update view center to zoom toward mouse position
        const currentWidth = svgWidth / zoomLevel;
        const currentHeight = svgHeight / zoomLevel;
        const newWidth = svgWidth / newZoom;
        const newHeight = svgHeight / newZoom;
        
        const newCenterX = viewCenter[0] + (currentWidth - newWidth) * (ratioX - 0.5);
        const newCenterY = viewCenter[1] + (currentHeight - newHeight) * (ratioY - 0.5);
        
        setViewCenter([newCenterX, newCenterY]);
      }
      
      setZoomLevel(newZoom);
    }
  };
  
  // Handle panning
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<[number, number]>([0, 0]);
  
  const handlePanStart = (event: MouseEvent) => {
    if (event.altKey && selectionMode === 'none') {
      setIsPanning(true);
      setPanStart(getSvgCoordinates(event));
      event.preventDefault();
    }
  };
  
  const handlePanMove = (event: MouseEvent) => {
    if (isPanning) {
      const current = getSvgCoordinates(event);
      const dx = (current[0] - panStart[0]) / zoomLevel;
      const dy = (current[1] - panStart[1]) / zoomLevel;
      
      setViewCenter([
        viewCenter[0] - dx,
        viewCenter[1] - dy
      ]);
      
      setPanStart(current);
      event.preventDefault();
    }
  };
  
  const handlePanEnd = () => {
    setIsPanning(false);
  };
  
  // Update getSvgCoordinates to account for zoom
  const getSvgCoordinates = (event: MouseEvent): [number, number] => {
    if (!containerRef.current || !svgRef.current) return [0, 0];
    
    // Get the bounding rectangle of the SVG element
    const svgRect = svgRef.current.getBoundingClientRect();
    
    // Calculate the actual dimensions of the SVG as displayed (accounting for aspect ratio)
    const aspectRatio = svgWidth / svgHeight;
    const containerAspectRatio = svgRect.width / svgRect.height;
    
    let scaledWidth = svgRect.width;
    let scaledHeight = svgRect.height;
    let offsetX = 0;
    let offsetY = 0;
    
    // Adjust for preserveAspectRatio="xMidYMid meet"
    if (containerAspectRatio > aspectRatio) {
      // Container is wider than SVG viewBox
      scaledWidth = svgRect.height * aspectRatio;
      offsetX = (svgRect.width - scaledWidth) / 2;
    } else {
      // Container is taller than SVG viewBox
      scaledHeight = svgRect.width / aspectRatio;
      offsetY = (svgRect.height - scaledHeight) / 2;
    }
    
    // Get mouse coordinates relative to the scaled SVG
    const mouseX = event.clientX - svgRect.left - offsetX;
    const mouseY = event.clientY - svgRect.top - offsetY;
    
    // Calculate the visible portion of the SVG (taking zoom into account)
    const visibleWidth = svgWidth / zoomLevel;
    const visibleHeight = svgHeight / zoomLevel;
    const visibleLeft = viewCenter[0] - visibleWidth / 2;
    const visibleTop = viewCenter[1] - visibleHeight / 2;
    
    // Convert mouse coordinates to zoomed SVG coordinates
    const svgX = visibleLeft + (mouseX / scaledWidth) * visibleWidth;
    const svgY = visibleTop + (mouseY / scaledHeight) * visibleHeight;
    
    return [svgX, svgY];
  };
  
  const toggleRoad = (roadId: string) => {
    const newRoads = roads.map(road => 
      road.id === roadId ? { ...road, visible: !road.visible } : road
    );
    setRoads(newRoads);
    saveToHistory(newRoads);
  };
  
  const toggleRoadName = (roadId: string) => {
    const newRoads = roads.map(road => 
      road.id === roadId ? { ...road, showName: !road.showName } : road
    );
    setRoads(newRoads);
    saveToHistory(newRoads);
  };
  
  const toggleAllRoadNames = (show: boolean) => {
    const newRoads = roads.map(road => ({ ...road, showName: show }));
    setRoads(newRoads);
    saveToHistory(newRoads);
  };
  
  const saveToHistory = (newRoads: Road[]) => {
    setHistory([...history.slice(0, historyIndex + 1), [...newRoads]]);
    setHistoryIndex(historyIndex + 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setRoads(history[historyIndex - 1] as any);
    }
  };

  const handleExport = () => {
    onExport(roads.filter(road => road.visible));
  };

  // Mouse event handlers for rectangle selection
  const handleMouseDown = (event: MouseEvent) => {
    if (selectionMode === 'none') return;
    
    const [x, y] = getSvgCoordinates(event);
    setSelectionRect({ startX: x, startY: y, width: 0, height: 0 });
    setIsDrawing(true);
  };
  
  const handleMouseMove = (event: MouseEvent) => {
    if (draggedLabelId) {
      handleLabelDrag(event);
      return;
    }
    
    if (!isDrawing || !selectionRect) return;
    
    const [currentX, currentY] = getSvgCoordinates(event);
    const width = currentX - selectionRect.startX;
    const height = currentY - selectionRect.startY;
    
    setSelectionRect({
      ...selectionRect,
      width,
      height
    });
  };
  
  const handleMouseUp = () => {
    if (draggedLabelId) {
      handleLabelDragEnd();
      return;
    }
    
    if (!isDrawing || !selectionRect) {
      setIsDrawing(false);
      return;
    }
    
    // Normalize rectangle coordinates (handle negative width/height)
    const normalizedRect = {
      x: selectionRect.width < 0 ? selectionRect.startX + selectionRect.width : selectionRect.startX,
      y: selectionRect.height < 0 ? selectionRect.startY + selectionRect.height : selectionRect.startY,
      width: Math.abs(selectionRect.width),
      height: Math.abs(selectionRect.height)
    };
    
    // Apply selection to roads that intersect with the rectangle
    const newRoads = roads.map(road => {
      // Check if any point of the road is inside the selection rectangle
      const isInside = road.svgPoints.some(point => 
        point[0] >= normalizedRect.x && 
        point[0] <= normalizedRect.x + normalizedRect.width &&
        point[1] >= normalizedRect.y && 
        point[1] <= normalizedRect.y + normalizedRect.height
      );
      
      if (isInside) {
        // If in select mode, make visible. If in deselect mode, make invisible
        return { ...road, visible: selectionMode === 'select' };
      }
      
      return road;
    });
    
    setRoads(newRoads);
    saveToHistory(newRoads);
    
    // Reset selection
    setIsDrawing(false);
    setSelectionRect(null);
  };
  
  // Toggle selection mode
  const toggleSelectionMode = (mode: SelectionMode) => {
    setSelectionMode(prevMode => prevMode === mode ? 'none' : mode);
    setSelectionRect(null);
    setIsDrawing(false);
  };

  // Count significant road types for display in the UI
  const namedRoads = roads.filter(road => road.name).length;
  const unnamedRoads = roads.length - namedRoads;
  const visibleRoads = roads.filter(road => road.visible).length;
  const visibleNames = roads.filter(road => road.visible && road.showName && road.name).length;

  // Add editor mode state
  const [editorMode, setEditorMode] = useState<EditorMode>('selection');
  
  // Add state for dragging labels
  const [draggedLabelId, setDraggedLabelId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<[number, number]>([0, 0]);
  const [dragStart, setDragStart] = useState<[number, number]>([0, 0]);
  
  // Add new state for tracking selected label
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  
  // Add a flag to prevent deselection when interacting with controls
  const [ignoreBackgroundClick, setIgnoreBackgroundClick] = useState(false);
  
  // Toggle editor mode between selection and label edit
  const toggleEditorMode = (mode: EditorMode) => {
    if (editorMode === mode) {
      // If already in this mode, stay in selection mode but reset selection mode
      setEditorMode('selection');
      setSelectionMode('none');
      setSelectedLabelId(null); // Clear selected label when exiting label edit mode
    } else {
      setEditorMode(mode);
      // Reset selection mode when switching to label edit
      if (mode === 'labelEdit') {
        setSelectionMode('none');
      } else {
        setSelectedLabelId(null); // Clear selected label when switching to selection mode
      }
    }
  };
  
  // Add state for tracking label controls
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStartAngle, setRotateStartAngle] = useState(0);
  
  // Handle label drag start
  const handleLabelDragStart = (event: React.MouseEvent, roadId: string) => {
    if (editorMode !== 'labelEdit') return;
    
    event.stopPropagation();
    const [mouseX, mouseY] = getSvgCoordinates(event as unknown as MouseEvent);
    
    // Find the road
    const road = roads.find(r => r.id === roadId);
    if (!road) return;
    
    // Calculate the middle point (original position)
    const midPointIndex = Math.floor(road.svgPoints.length / 2);
    const midPoint = road.svgPoints[midPointIndex];
    
    // Set drag offset as difference between mouse position and middle point (plus existing offset)
    setDragOffset([
      mouseX - (midPoint[0] + (road.labelOffset?.[0] || 0)),
      mouseY - (midPoint[1] + (road.labelOffset?.[1] || 0))
    ]);
    
    // Set flag to ignore background clicks
    setIgnoreBackgroundClick(true);
    
    setDraggedLabelId(roadId);
    setSelectedLabelId(roadId); // Also set as the selected label
    setDragStart([mouseX, mouseY]);
  };
  
  // Handle label dragging
  const handleLabelDrag = (event: MouseEvent) => {
    if (!draggedLabelId) return;
    
    event.stopPropagation();
    const [mouseX, mouseY] = getSvgCoordinates(event);
    
    // Find the road
    const road = roads.find(r => r.id === draggedLabelId);
    if (!road) return;
    
    // Calculate the middle point (original position)
    const midPointIndex = Math.floor(road.svgPoints.length / 2);
    const midPoint = road.svgPoints[midPointIndex];
    
    // Calculate new offset
    const newOffsetX = mouseX - midPoint[0] - dragOffset[0];
    const newOffsetY = mouseY - midPoint[1] - dragOffset[1];
    
    // Update the road with new label offset - ensure type safety
    const newRoads = roads.map(r => 
      r.id === draggedLabelId 
        ? { ...r, labelOffset: [newOffsetX, newOffsetY] as [number, number] } 
        : r
    );
    
    setRoads(newRoads);
  };
  
  // Handle label drag end
  const handleLabelDragEnd = () => {
    if (!draggedLabelId) return;
    
    // Save current state to history - cast to ensure type safety
    saveToHistory([...roads]);
    
    // We only clear the draggedLabelId but keep the selectedLabelId
    // This ensures the label remains selected after dragging
    setDraggedLabelId(null);
    
    // Reset the background click flag after a short delay
    // This ensures we don't immediately deselect the label
    setTimeout(() => {
      setIgnoreBackgroundClick(false);
    }, 100);
  };

  // Handle label click (for selection without dragging)
  const handleLabelClick = (event: React.MouseEvent, roadId: string) => {
    if (editorMode !== 'labelEdit') return;
    
    // Prevent event from bubbling to SVG background
    event.stopPropagation();
    
    // Set flag to ignore background clicks
    setIgnoreBackgroundClick(true);
    
    // Toggle selection - if already selected, deselect it
    if (selectedLabelId === roadId) {
      setSelectedLabelId(null);
    } else {
      setSelectedLabelId(roadId);
    }
    
    // Reset the background click flag after a short delay
    setTimeout(() => {
      setIgnoreBackgroundClick(false);
    }, 100);
  };
  
  // Handle background click to deselect label
  const handleBackgroundClick = (event: React.MouseEvent) => {
    // If we're ignoring background clicks, do nothing
    if (ignoreBackgroundClick) return;
    
    // Only deselect if we're in label edit mode, not in the middle of a drag operation,
    // and not clicking a control button (the event target shouldn't be a control element)
    if (editorMode === 'labelEdit' && selectedLabelId && !draggedLabelId) {
      // Check if the click is directly on the SVG background
      const target = event.target as Element;
      
      // If the target is the SVG element or the background rect, then deselect
      // This prevents deselection when clicking on control buttons
      if (target.tagName === 'svg' || (target.tagName === 'rect' && !target.getAttribute('rx'))) {
        setSelectedLabelId(null);
      }
    }
  };
  
  // Handle font size change
  const handleFontSizeChange = (event: React.MouseEvent, roadId: string, delta: number) => {
    // Stop event from bubbling to SVG background
    event.stopPropagation();
    
    // Set flag to ignore background clicks
    setIgnoreBackgroundClick(true);
    
    const newRoads = roads.map(road => {
      if (road.id === roadId) {
        const currentSize = road.fontSize || 10;
        const newSize = Math.max(6, Math.min(20, currentSize + delta)); // Limit size between 6 and 20
        return { ...road, fontSize: newSize };
      }
      return road;
    });
    
    setRoads(newRoads);
    saveToHistory([...newRoads]);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setIgnoreBackgroundClick(false);
    }, 100);
  };
  
  // Handle rotation start
  const handleRotateStart = (event: React.MouseEvent, roadId: string) => {
    // Stop event from bubbling and prevent default
    event.stopPropagation();
    event.preventDefault();
    
    console.log('Rotation start for road:', roadId);
    
    setIsRotating(true);
    setDraggedLabelId(roadId); // Set the dragged label ID to ensure rotation works
    setSelectedLabelId(roadId); // Also set as selected label
    
    // Set flag to ignore background clicks
    setIgnoreBackgroundClick(true);
    
    // Add event listeners for mouse movement and mouse up
    document.addEventListener('mousemove', handleRotateMove as unknown as EventListener);
    document.addEventListener('mouseup', handleRotateEnd as unknown as EventListener);
  };
  
  // Handle rotation movement
  const handleRotateMove = (event: globalThis.MouseEvent) => {
    if (!isRotating || !draggedLabelId) return;
    
    // Prevent default to avoid text selection or other browser actions
    event.preventDefault();
    
    const road = roads.find(r => r.id === draggedLabelId);
    if (!road) return;
    
    // Get label position (center of the label)
    const midPointIndex = Math.floor(road.svgPoints.length / 2);
    const midPoint = road.svgPoints[midPointIndex];
    const labelCenterX = midPoint[0] + (road.labelOffset?.[0] || 0);
    const labelCenterY = midPoint[1] + (road.labelOffset?.[1] || 0);
    
    // Convert mouse position to SVG coordinates
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    
    const fakeMouseEvent = {
      clientX: event.clientX,
      clientY: event.clientY,
    } as unknown as MouseEvent;
    
    const [mouseX, mouseY] = getSvgCoordinates(fakeMouseEvent);
    
    // Calculate angle between label center and mouse position
    // This gives us a direct rotation angle
    const dx = mouseX - labelCenterX;
    const dy = mouseY - labelCenterY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Adjust angle if needed for better readability
    // Ensure text isn't upside down
    if (angle > 90 || angle < -90) {
      angle += 180;
    }
    
    console.log('Setting rotation angle:', angle);
    
    // Update road with new rotation angle
    const newRoads = roads.map(r => 
      r.id === draggedLabelId
        ? { ...r, customAngle: angle } 
        : r
    );
    
    setRoads(newRoads);
  };
  
  // Handle rotation end
  const handleRotateEnd = () => {
    setIsRotating(false);
    
    // If we have a dragged label (from rotation), save to history
    if (draggedLabelId) {
      saveToHistory([...roads]);
      setDraggedLabelId(null); // Release the drag but keep the label selected
    }
    
    // Reset the background click flag
    setTimeout(() => {
      setIgnoreBackgroundClick(false);
    }, 100);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleRotateMove as unknown as EventListener);
    document.removeEventListener('mouseup', handleRotateEnd as unknown as EventListener);
  };
  
  // Calculate the angle for a road based on its path
  const getCalculatedAngle = (road: Road): number => {
    if (road.svgPoints.length <= 1) return 0;
    
    const midPointIndex = Math.floor(road.svgPoints.length / 2);
    const p1Index = Math.max(0, midPointIndex - Math.min(3, Math.floor(road.svgPoints.length / 10)));
    const p2Index = Math.min(road.svgPoints.length - 1, midPointIndex + Math.min(3, Math.floor(road.svgPoints.length / 10)));
    
    const p1 = road.svgPoints[p1Index];
    const p2 = road.svgPoints[p2Index];
    
    // Calculate angle in degrees
    let angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * (180 / Math.PI);
    
    // Ensure text is not upside-down by adjusting angle
    if (angle > 90 || angle < -90) {
      angle += 180;
    }
    
    return angle;
  };
  
  // Get label angle (either custom or calculated)
  const getLabelAngle = (road: Road): number => {
    if (road.customAngle !== undefined) {
      return road.customAngle;
    }
    
    return getCalculatedAngle(road);
  };
  
  // Modify SVG element cursor based on mode
  const getSvgCursor = () => {
    if (isPanning) return 'grabbing';
    if (editorMode === 'labelEdit') return 'move';
    if (selectionMode !== 'none') return 'crosshair';
    return 'default';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 modal-overlay">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Edit Roads</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-1 min-h-0">
          {/* Preview Panel */}
          <div className="flex-1 border-r p-4 flex flex-col">
            {/* Tool Bar */}
            <div className="flex justify-between items-center mb-2">
              {/* Modes and Tools */}
              <div className="flex items-center gap-2">
                {/* Mode Toggle */}
                <div className="flex border rounded overflow-hidden mr-2">
                  <button
                    onClick={() => toggleEditorMode('selection')}
                    className={`px-3 py-1 flex items-center gap-1 ${
                      editorMode === 'selection' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                    }`}
                    title="Selection Mode"
                  >
                    <MousePointer size={16} className="mr-1" />
                    Select
                  </button>
                  <button
                    onClick={() => toggleEditorMode('labelEdit')}
                    className={`px-3 py-1 flex items-center gap-1 ${
                      editorMode === 'labelEdit' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
                    }`}
                    title="Label Edit Mode - Drag labels to reposition"
                  >
                    <Move size={16} className="mr-1" />
                    Move Labels
                  </button>
                </div>
                
                {/* Selection Tools - Only show when in selection mode */}
                {editorMode === 'selection' && (
                  <>
                    <button
                      onClick={() => toggleSelectionMode('select')}
                      className={`px-3 py-1 rounded flex items-center gap-1 ${selectionMode === 'select' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                      title="Select roads within rectangle"
                    >
                      <div className="w-4 h-4 border border-current inline-block mr-1"></div>
                      Select
                    </button>
                    <button
                      onClick={() => toggleSelectionMode('deselect')}
                      className={`px-3 py-1 rounded flex items-center gap-1 ${selectionMode === 'deselect' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}
                      title="Deselect roads within rectangle"
                    >
                      <div className="w-4 h-4 border border-current inline-block mr-1"></div>
                      Deselect
                    </button>
                  </>
                )}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={zoomOut}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Zoom out"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-xs text-gray-500 min-w-[40px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Zoom in"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  onClick={resetZoom}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Reset zoom"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
              
              <div className="ml-auto text-sm text-gray-500 hidden sm:block">
                {editorMode === 'selection' && selectionMode === 'select' && "Draw rectangle to select roads"}
                {editorMode === 'selection' && selectionMode === 'deselect' && "Draw rectangle to deselect roads"}
                {editorMode === 'selection' && selectionMode === 'none' && (
                  <>
                    <span className="mr-2">Mouse wheel to zoom</span>
                    <span>Alt+click drag to pan</span>
                  </>
                )}
                {editorMode === 'labelEdit' && "Click a label to select it. Drag to move, or use controls to resize and rotate."}
              </div>
            </div>
            
            {/* SVG Preview */}
            <div 
              ref={containerRef}
              className="bg-white w-full h-full relative flex-1 overflow-hidden"
              style={{ 
                minHeight: "500px", 
                cursor: editorMode === 'labelEdit' ? 'default' : 'crosshair' 
              }}
              onWheel={handleWheel}
            >
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={getViewBox()}
                preserveAspectRatio="xMidYMid meet"
                style={{ cursor: getSvgCursor() }}
                onMouseDown={(e) => {
                  handlePanStart(e);
                  if (!isPanning) {
                    handleMouseDown(e);
                    // Only call handleBackgroundClick when directly clicking on the SVG or background rect
                    // This prevents deselection when clicking on labels or control buttons
                    const target = e.target as Element;
                    if (target.tagName === 'svg' || (target.tagName === 'rect' && !target.getAttribute('rx'))) {
                      handleBackgroundClick(e);
                    }
                  }
                }}
                onMouseMove={(e) => {
                  handlePanMove(e);
                  if (!isPanning) handleMouseMove(e as unknown as MouseEvent);
                }}
                onMouseUp={(e) => {
                  handlePanEnd();
                  if (!isPanning) handleMouseUp();
                }}
                onMouseLeave={(e) => {
                  handlePanEnd();
                  if (!isPanning) handleMouseUp();
                }}
              >
                {/* White background */}
                <rect width={svgWidth} height={svgHeight} fill="white" />
                
                {/* First pass: Draw all roads */}
                {roads.map(road => (
                  road.visible && (
                    <path
                      key={`path-${road.id}`}
                      d={`M ${road.svgPoints.map(p => p.join(',')).join(' L ')}`}
                      stroke="black"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  )
                ))}
                
                {/* Second pass: Draw road names with deduplication */}
                {(() => {
                  // Track drawn label positions for deduplication
                  const drawnLabels = new Map<string, Array<[number, number]>>();
                  
                  // Minimum distance in pixels between same name labels
                  const MIN_LABEL_DISTANCE = 150;
                  
                  // Sort roads by importance and length to prioritize major roads
                  const roadsWithNamesToDraw = roads
                    .filter(road => road.visible && road.showName && road.name)
                    .sort((a, b) => {
                      // Prioritize by road type first (simple heuristic)
                      const typeOrder = {
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
                  
                  return roadsWithNamesToDraw.map(road => {
                    // Calculate position for text (middle point + offset)
                    const midPointIndex = Math.floor(road.svgPoints.length / 2);
                    const midPoint = road.svgPoints[midPointIndex];
                    
                    // Apply custom offset if it exists
                    const offsetX = road.labelOffset?.[0] || 0;
                    const offsetY = road.labelOffset?.[1] || 0;
                    
                    const labelPos: [number, number] = [
                      midPoint[0] + offsetX,
                      midPoint[1] + offsetY
                    ];
                    
                    // Use custom angle if set, otherwise calculate
                    const angle = getLabelAngle(road);
                    
                    // Check if we've already drawn this name nearby (if no custom offset)
                    const isDragging = draggedLabelId === road.id;
                    const hasCustomPosition = offsetX !== 0 || offsetY !== 0;
                    
                    // Skip deduplication check if this label is being dragged or has a custom position
                    if (!isDragging && !hasCustomPosition) {
                      const existingPositions = drawnLabels.get(road.name) || [];
                      const isTooClose = existingPositions.some(pos => {
                        const dx = labelPos[0] - pos[0];
                        const dy = labelPos[1] - pos[1];
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        return distance < MIN_LABEL_DISTANCE;
                      });
                      
                      // If it's too close to an existing label with the same name, don't draw it
                      if (isTooClose) {
                        return null;
                      }
                      
                      // Otherwise, add this position to our tracking map
                      drawnLabels.set(road.name, [...existingPositions, labelPos]);
                    }
                    
                    // Determine if label is being dragged
                    const isBeingDragged = road.id === draggedLabelId;
                    
                    // Get font size (default or custom)
                    const fontSize = road.fontSize || 10;
                    
                    return (
                      <g key={`text-${road.id}`}>
                        <text
                          x={labelPos[0]}
                          y={labelPos[1]}
                          fontSize={fontSize}
                          fill="black"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${angle}, ${labelPos[0]}, ${labelPos[1]})`}
                          cursor={editorMode === 'labelEdit' ? 'move' : 'default'}
                          onMouseDown={(e) => handleLabelDragStart(e, road.id)}
                          onClick={(e) => handleLabelClick(e, road.id)}
                          className={editorMode === 'labelEdit' ? 'hover:text-blue-600' : ''}
                        >
                          {road.name}
                        </text>
                        
                        {/* Visual indicator for draggable labels in label edit mode */}
                        {editorMode === 'labelEdit' && (
                          <>
                            <rect
                              x={labelPos[0] - 40}
                              y={labelPos[1] - 10}
                              width="80"
                              height="20"
                              fill="transparent"
                              stroke={isBeingDragged || selectedLabelId === road.id ? "blue" : "rgba(0,0,255,0.3)"}
                              strokeWidth={isBeingDragged || selectedLabelId === road.id ? "1.5" : "1"}
                              strokeDasharray={isBeingDragged || selectedLabelId === road.id ? "none" : "2 2"}
                              opacity="0.6"
                              rx="4"
                              ry="4"
                              transform={`rotate(${angle}, ${labelPos[0]}, ${labelPos[1]})`}
                              cursor="move"
                              onMouseDown={(e) => handleLabelDragStart(e, road.id)}
                              onClick={(e) => handleLabelClick(e, road.id)}
                              pointerEvents="all"
                            />
                            
                            {/* Controls that appear when a label is selected */}
                            {(isBeingDragged || selectedLabelId === road.id) && (
                              <g pointerEvents="all">
                                {/* Font size controls */}
                                <g 
                                  transform={`translate(${labelPos[0] - 60}, ${labelPos[1]}) rotate(${angle}, 15, 0)`}
                                  cursor="pointer"
                                >
                                  <circle cx="0" cy="0" r="15" fill="white" stroke="blue" strokeWidth="1" />
                                  <g transform="translate(-6, -6)">
                                    <Type size={12} color="blue" />
                                  </g>
                                  <circle 
                                    cx="0" 
                                    cy="20" 
                                    r="10" 
                                    fill="white" 
                                    stroke="blue" 
                                    strokeWidth="1" 
                                    onClick={(e) => handleFontSizeChange(e, road.id, -1)} 
                                  />
                                  <g transform="translate(-4, 16)">
                                    <ChevronDown size={8} color="blue" />
                                  </g>
                                  <circle 
                                    cx="0" 
                                    cy="-20" 
                                    r="10" 
                                    fill="white" 
                                    stroke="blue" 
                                    strokeWidth="1" 
                                    onClick={(e) => handleFontSizeChange(e, road.id, 1)} 
                                  />
                                  <g transform="translate(-4, -24)">
                                    <ChevronUp size={8} color="blue" />
                                  </g>
                                </g>
                                
                                {/* Rotation control */}
                                <g 
                                  transform={`translate(${labelPos[0] + 60}, ${labelPos[1]}) rotate(${angle}, -15, 0)`}
                                  cursor="pointer"
                                  onMouseDown={(e) => handleRotateStart(e, road.id)}
                                >
                                  <circle 
                                    cx="0" 
                                    cy="0" 
                                    r="15" 
                                    fill="white" 
                                    stroke="blue" 
                                    strokeWidth="1" 
                                    onMouseDown={(e) => handleRotateStart(e, road.id)}
                                  />
                                  <g 
                                    transform="translate(-8, -8)"
                                    onMouseDown={(e) => handleRotateStart(e, road.id)}
                                  >
                                    <RotateCw size={16} color="blue" />
                                  </g>
                                </g>
                              </g>
                            )}
                          </>
                        )}
                      </g>
                    );
                  }).filter(Boolean); // Remove nulls for skipped labels
                })()}
                
                {/* Selection Rectangle */}
                {selectionRect && (
                  <rect
                    x={selectionRect.width < 0 ? selectionRect.startX + selectionRect.width : selectionRect.startX}
                    y={selectionRect.height < 0 ? selectionRect.startY + selectionRect.height : selectionRect.startY}
                    width={Math.abs(selectionRect.width)}
                    height={Math.abs(selectionRect.height)}
                    fill={selectionMode === 'select' ? "rgba(0, 100, 255, 0.2)" : "rgba(255, 50, 50, 0.2)"}
                    stroke={selectionMode === 'select' ? "rgba(0, 100, 255, 0.8)" : "rgba(255, 50, 50, 0.8)"}
                    strokeWidth="1"
                    strokeDasharray="4 2"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Road List Panel */}
          <div className="w-96 flex flex-col">
            <div className="p-4 border-b flex gap-2">
              <button
                onClick={undo}
                disabled={historyIndex === 0}
                className={`px-3 py-1 rounded-lg flex items-center gap-1 ${
                  historyIndex === 0
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                <Undo size={16} /> Undo
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1 ml-auto"
              >
                <Download size={16} /> Export
              </button>
            </div>
            
            <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>{namedRoads} named • {unnamedRoads} unnamed</span>
                <span>{visibleRoads} selected • {visibleNames} names shown</span>
              </div>
              
              <div className="mt-2 flex gap-2 flex-wrap">
                <button 
                  onClick={() => {
                    const newRoads = roads.map(road => ({ ...road, visible: true }));
                    setRoads(newRoads);
                    saveToHistory(newRoads);
                  }}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  Select All
                </button>
                <button 
                  onClick={() => {
                    const newRoads = roads.map(road => ({ ...road, visible: false }));
                    setRoads(newRoads);
                    saveToHistory(newRoads);
                  }}
                  className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                >
                  Deselect All
                </button>
                <button 
                  onClick={() => {
                    const newRoads = roads.map(road => ({ ...road, visible: !!road.name }));
                    setRoads(newRoads);
                    saveToHistory(newRoads);
                  }}
                  className="text-xs px-2 py-1 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"
                >
                  Named Only
                </button>
                <button 
                  onClick={() => toggleAllRoadNames(true)}
                  className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                >
                  Show Names
                </button>
                <button 
                  onClick={() => toggleAllRoadNames(false)}
                  className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                >
                  Hide Names
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {roads.map(road => (
                  <div
                    key={road.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={road.visible}
                      onChange={() => toggleRoad(road.id)}
                      className="w-4 h-4 rounded border-gray-300 mr-3"
                    />
                    <span
                      className={`flex-grow cursor-pointer ${road.visible ? 'text-black' : 'text-gray-400'}`}
                      onClick={() => toggleRoad(road.id)}
                    >
                      {road.name || `Unnamed ${road.type || 'Road'}`}
                    </span>
                    {road.name && road.visible && (
                      <div className="flex items-center pl-2">
                        <label className="text-xs text-gray-500 mr-1">Name</label>
                        <input
                          type="checkbox"
                          checked={road.showName}
                          onChange={() => toggleRoadName(road.id)}
                          className="w-3 h-3 rounded border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}