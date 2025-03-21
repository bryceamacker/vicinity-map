import { useState, RefObject } from 'react';
import { SelectionRect, SelectionMode, Road } from '../types';
import { useEditorContext } from '../context/EditorContext';

/**
 * Custom hook for handling rectangle selection
 */
export function useRectangleSelection(
  svgRef: RefObject<SVGSVGElement>,
  getSvgCoordinates: (event: MouseEvent) => [number, number]
) {
  const { state, dispatch } = useEditorContext();
  const { selectionMode } = state;
  
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Handle mouse down to start drawing selection rectangle
  const handleMouseDown = (event: React.MouseEvent) => {
    if (selectionMode === 'none') return;
    
    const [x, y] = getSvgCoordinates(event as unknown as MouseEvent);
    setSelectionRect({ startX: x, startY: y, width: 0, height: 0 });
    setIsDrawing(true);
  };

  // Handle mouse move to update selection rectangle dimensions
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDrawing || !selectionRect) return;
    
    const [currentX, currentY] = getSvgCoordinates(event as unknown as MouseEvent);
    const width = currentX - selectionRect.startX;
    const height = currentY - selectionRect.startY;
    
    setSelectionRect({
      ...selectionRect,
      width,
      height
    });
  };

  // Handle mouse up to finalize selection
  const handleMouseUp = () => {
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
    const newRoads = state.roads.map(road => {
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
    
    // Update roads and save to history
    dispatch({ type: 'SET_ROADS', payload: newRoads });
    dispatch({ type: 'SAVE_TO_HISTORY', payload: newRoads });
    
    // Reset selection
    setIsDrawing(false);
    setSelectionRect(null);
  };

  // Function to toggle selection mode
  const toggleSelectionMode = (mode: SelectionMode) => {
    dispatch({ 
      type: 'SET_SELECTION_MODE', 
      payload: state.selectionMode === mode ? 'none' : mode 
    });
    setSelectionRect(null);
    setIsDrawing(false);
  };

  return {
    selectionRect,
    isDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    toggleSelectionMode
  };
} 