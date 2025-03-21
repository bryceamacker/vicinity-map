import React from 'react';
import { useEditorContext } from '../../../context/EditorContext';
import { useRectangleSelection } from '../../../hooks/useRectangleSelection';
import { EditorModeSelector } from './EditorModeSelector';
import { ZoomControls } from './ZoomControls';
import { SelectionTools } from './SelectionTools';

interface EditorToolbarProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  toggleSelectionMode: (mode: any) => void;
}

/**
 * Component for the editor toolbar
 */
export function EditorToolbar({ 
  zoomLevel, 
  onZoomIn, 
  onZoomOut, 
  onResetZoom,
  toggleSelectionMode
}: EditorToolbarProps) {
  const { state } = useEditorContext();
  const { editorMode, selectionMode } = state;
  
  // Helper to get appropriate help text based on the current mode
  const getHelpText = () => {
    if (editorMode === 'selection' && selectionMode === 'select') 
      return "Draw rectangle to select roads";
    if (editorMode === 'selection' && selectionMode === 'deselect') 
      return "Draw rectangle to deselect roads";
    if (editorMode === 'selection' && selectionMode === 'none') 
      return "Mouse wheel to zoom, Alt+click drag to pan";
    if (editorMode === 'labelEdit') 
      return "Click a label to select it. Drag to move, or use controls to resize and rotate.";
    if (editorMode === 'textAdd') 
      return "Click anywhere on the map to add a new text label.";
    return "";
  };
  
  return (
    <div className="flex justify-between items-center mb-2">
      {/* Modes and Tools */}
      <div className="flex items-center gap-2">
        {/* Mode Toggle */}
        <EditorModeSelector />
        
        {/* Selection Tools */}
        <SelectionTools toggleSelectionMode={toggleSelectionMode} />
      </div>

      {/* Zoom Controls */}
      <ZoomControls 
        zoomLevel={zoomLevel}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
      />
      
      <div className="ml-auto text-sm text-gray-500 hidden sm:block">
        {getHelpText()}
      </div>
    </div>
  );
} 