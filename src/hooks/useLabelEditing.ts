import { useState, useEffect } from 'react';
import { useEditorContext } from '../context/EditorContext';
import { Road, StandaloneLabel } from '../types';

/**
 * Custom hook for handling label editing functionality
 */
export function useLabelEditing(
  getSvgCoordinates: (event: MouseEvent) => [number, number]
) {
  const { state, dispatch } = useEditorContext();
  const { 
    roads, 
    draggedLabelId, 
    isRotating, 
    selectedLabelId,
    selectedStandaloneLabel,
    draggedStandaloneLabel
  } = state;

  // Handle label drag start
  const handleLabelDragStart = (event: React.MouseEvent, roadId: string) => {
    // Only work in label edit mode
    if (state.editorMode !== 'labelEdit') return;
    
    event.stopPropagation();
    const [mouseX, mouseY] = getSvgCoordinates(event as unknown as MouseEvent);
    
    // Find the road
    const road = roads.find(r => r.id === roadId);
    if (!road) return;
    
    // Calculate the middle point (original position)
    const midPointIndex = Math.floor(road.svgPoints.length / 2);
    const midPoint = road.svgPoints[midPointIndex];
    
    // Set drag offset as difference between mouse position and middle point (plus existing offset)
    const dragOffset: [number, number] = [
      mouseX - (midPoint[0] + (road.labelOffset?.[0] || 0)),
      mouseY - (midPoint[1] + (road.labelOffset?.[1] || 0))
    ];
    
    // Set flag to ignore background clicks
    dispatch({ type: 'SET_IGNORE_BACKGROUND_CLICK', payload: true });
    
    // Set dragged label id and selected label id
    dispatch({ type: 'SET_DRAGGED_LABEL_ID', payload: roadId });
    dispatch({ type: 'SELECT_LABEL', payload: roadId });
    
    // Return drag offset for use in drag handler
    return dragOffset;
  };

  // Handle label dragging
  const handleLabelDrag = (event: MouseEvent, dragOffset: [number, number]) => {
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
    
    // Update the road with new label offset
    dispatch({
      type: 'UPDATE_ROAD_LABEL_OFFSET',
      payload: {
        id: draggedLabelId,
        offset: [newOffsetX, newOffsetY]
      }
    });
  };

  // Handle label drag end
  const handleLabelDragEnd = () => {
    if (!draggedLabelId) return;
    
    // Save current state to history
    dispatch({ type: 'SAVE_TO_HISTORY', payload: roads });
    
    // We only clear the draggedLabelId but keep the selectedLabelId
    dispatch({ type: 'SET_DRAGGED_LABEL_ID', payload: null });
    
    // Reset the background click flag after a short delay
    setTimeout(() => {
      dispatch({ type: 'SET_IGNORE_BACKGROUND_CLICK', payload: false });
    }, 100);
  };

  // Handle label click (for selection without dragging)
  const handleLabelClick = (event: React.MouseEvent, roadId: string) => {
    if (state.editorMode !== 'labelEdit') return;
    
    // Prevent event from bubbling to SVG background
    event.stopPropagation();
    
    // Set flag to ignore background clicks
    dispatch({ type: 'SET_IGNORE_BACKGROUND_CLICK', payload: true });
    
    // Toggle selection - if already selected, deselect it
    if (selectedLabelId === roadId) {
      dispatch({ type: 'SELECT_LABEL', payload: null });
    } else {
      dispatch({ type: 'SELECT_LABEL', payload: roadId });
    }
    
    // Reset the background click flag after a short delay
    setTimeout(() => {
      dispatch({ type: 'SET_IGNORE_BACKGROUND_CLICK', payload: false });
    }, 100);
  };
  
  // Handle font size change
  const handleFontSizeChange = (event: React.MouseEvent, roadId: string, delta: number) => {
    // Stop event from bubbling to SVG background
    event.stopPropagation();
    
    // Set flag to ignore background clicks
    dispatch({ type: 'SET_IGNORE_BACKGROUND_CLICK', payload: true });
    
    // Update font size
    dispatch({
      type: 'UPDATE_ROAD_FONT_SIZE',
      payload: { id: roadId, delta }
    });
    
    // Save to history
    dispatch({ type: 'SAVE_TO_HISTORY', payload: roads.map(r => 
      r.id === roadId 
        ? { 
            ...r, 
            fontSize: Math.max(6, Math.min(20, (r.fontSize || 10) + delta)) 
          } 
        : r
    )});
    
    // Reset the flag after a short delay
    setTimeout(() => {
      dispatch({ type: 'SET_IGNORE_BACKGROUND_CLICK', payload: false });
    }, 100);
  };
  
  // Handle rotation start
  const handleRotateStart = (event: React.MouseEvent, roadId: string) => {
    // Stop event from bubbling and prevent default
    event.stopPropagation();
    event.preventDefault();
    
    dispatch({ type: 'SET_IS_ROTATING', payload: true });
    dispatch({ type: 'SET_DRAGGED_LABEL_ID', payload: roadId });
    dispatch({ type: 'SELECT_LABEL', payload: roadId });
    
    // Set flag to ignore background clicks
    dispatch({ type: 'SET_IGNORE_BACKGROUND_CLICK', payload: true });
    
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
    const fakeMouseEvent = {
      clientX: event.clientX,
      clientY: event.clientY,
    } as unknown as MouseEvent;
    
    const [mouseX, mouseY] = getSvgCoordinates(fakeMouseEvent);
    
    // Calculate angle between label center and mouse position
    const dx = mouseX - labelCenterX;
    const dy = mouseY - labelCenterY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Adjust angle if needed for better readability
    if (angle > 90 || angle < -90) {
      angle += 180;
    }
    
    // Update road with new rotation angle
    dispatch({
      type: 'UPDATE_ROAD_ANGLE',
      payload: { id: draggedLabelId, angle }
    });
  };
  
  // Handle rotation end
  const handleRotateEnd = () => {
    dispatch({ type: 'SET_IS_ROTATING', payload: false });
    
    // If we have a dragged label (from rotation), save to history
    if (draggedLabelId) {
      dispatch({ type: 'SAVE_TO_HISTORY', payload: roads });
      dispatch({ type: 'SET_DRAGGED_LABEL_ID', payload: null });
    }
    
    // Reset the background click flag
    setTimeout(() => {
      dispatch({ type: 'SET_IGNORE_BACKGROUND_CLICK', payload: false });
    }, 100);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleRotateMove as unknown as EventListener);
    document.removeEventListener('mouseup', handleRotateEnd as unknown as EventListener);
  };
  
  // Functions for standalone labels
  
  // Handle standalone label drag start
  const handleStandaloneLabelDragStart = (event: React.MouseEvent, labelId: string) => {
    if (state.editorMode !== 'labelEdit') return;
    
    event.stopPropagation();
    const [mouseX, mouseY] = getSvgCoordinates(event as unknown as MouseEvent);
    
    // Find the label
    const label = state.standaloneLabels.find(l => l.id === labelId);
    if (!label) return;
    
    // Set drag offset as difference between mouse position and label position
    const dragOffset: [number, number] = [
      mouseX - label.position[0],
      mouseY - label.position[1]
    ];
    
    // Set flag to ignore background clicks
    dispatch({ type: 'SET_IGNORE_BACKGROUND_CLICK', payload: true });
    
    dispatch({ type: 'SET_DRAGGED_STANDALONE_LABEL', payload: labelId });
    dispatch({ type: 'SELECT_STANDALONE_LABEL', payload: labelId });
    
    return dragOffset;
  };
  
  // Handle standalone label drag
  const handleStandaloneLabelDrag = (event: MouseEvent, dragOffset: [number, number]) => {
    if (!draggedStandaloneLabel) return;
    
    event.stopPropagation();
    const [mouseX, mouseY] = getSvgCoordinates(event);
    
    // Find the label
    const label = state.standaloneLabels.find(l => l.id === draggedStandaloneLabel);
    if (!label) return;
    
    // Calculate new position
    const newX = mouseX - dragOffset[0];
    const newY = mouseY - dragOffset[1];
    
    // Update the label position
    dispatch({
      type: 'UPDATE_STANDALONE_LABEL',
      payload: {
        id: draggedStandaloneLabel,
        updates: { position: [newX, newY] }
      }
    });
  };
  
  // Handle standalone label drag end
  const handleStandaloneLabelDragEnd = () => {
    if (!draggedStandaloneLabel) return;
    
    // Save to history
    dispatch({ type: 'SAVE_LABEL_TO_HISTORY', payload: state.standaloneLabels });
    
    // Clear drag state
    dispatch({ type: 'SET_DRAGGED_STANDALONE_LABEL', payload: null });
    
    // Reset the background click flag after a short delay
    setTimeout(() => {
      dispatch({ type: 'SET_IGNORE_BACKGROUND_CLICK', payload: false });
    }, 100);
  };
  
  // Handle standalone label click
  const handleStandaloneLabelClick = (event: React.MouseEvent, labelId: string) => {
    if (state.editorMode !== 'labelEdit') return;
    
    // Prevent event from bubbling
    event.stopPropagation();
    
    // Set flag to ignore background clicks
    dispatch({ type: 'SET_IGNORE_BACKGROUND_CLICK', payload: true });
    
    // Toggle selection
    if (selectedStandaloneLabel === labelId) {
      dispatch({ type: 'SELECT_STANDALONE_LABEL', payload: null });
    } else {
      dispatch({ type: 'SELECT_STANDALONE_LABEL', payload: labelId });
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
      dispatch({ type: 'SET_IGNORE_BACKGROUND_CLICK', payload: false });
    }, 100);
  };
  
  // Clean up event listeners when the component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleRotateMove as unknown as EventListener);
      document.removeEventListener('mouseup', handleRotateEnd as unknown as EventListener);
    };
  }, [draggedLabelId, isRotating]);
  
  return {
    handleLabelDragStart,
    handleLabelDrag,
    handleLabelDragEnd,
    handleLabelClick,
    handleFontSizeChange,
    handleRotateStart,
    handleRotateMove,
    handleRotateEnd,
    handleStandaloneLabelDragStart,
    handleStandaloneLabelDrag,
    handleStandaloneLabelDragEnd,
    handleStandaloneLabelClick
  };
} 