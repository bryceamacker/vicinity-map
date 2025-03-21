import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Road, StandaloneLabel, ExportFormat, SelectionMode } from '../../types';
import { EditorProvider } from '../../context/EditorContext';
import { useEditorContext } from '../../context/EditorContext';
import { useMapInteraction } from '../../hooks/useMapInteraction';
import { useRectangleSelection } from '../../hooks/useRectangleSelection';
import { useLabelEditing } from '../../hooks/useLabelEditing';
import { RoadList } from '../../components/editor/RoadList';
import { ExportPanel } from '../../features/export/components/ExportPanel';
import { EditorToolbar } from '../../components/editor/EditorToolbar';
import { NewLabelInput } from '../../features/export/components/NewLabelInput';
import { RoadPaths } from '../../components/editor/RoadPaths';
import { SelectionRectangle } from '../../components/editor/SelectionRectangle';

interface RoadEditorContainerProps {
  roads: Road[];
  onClose: () => void;
  onExport: (roads: Road[], standaloneLabels: StandaloneLabel[], format: ExportFormat) => void;
}

/**
 * Main container component for the road editor
 */
function RoadEditorContent({ onClose, onExport }: Omit<RoadEditorContainerProps, 'roads'>) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('svg');
  
  const { state, dispatch } = useEditorContext();
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use custom hooks
  const {
    zoomLevel,
    getViewBox,
    handleWheel,
    isPanning,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    zoomIn,
    zoomOut,
    resetZoom,
    getSvgCoordinates
  } = useMapInteraction(svgRef, containerRef);
  
  const {
    selectionRect,
    isDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    toggleSelectionMode
  } = useRectangleSelection(svgRef, getSvgCoordinates);
  
  const {
    handleLabelDragStart,
    handleLabelDrag,
    handleLabelDragEnd,
    handleLabelClick,
    handleRotateStart
  } = useLabelEditing(getSvgCoordinates);
  
  // Helper to get cursor style based on current mode
  const getSvgCursor = () => {
    if (isPanning) return 'grabbing';
    if (state.editorMode === 'labelEdit') return 'move';
    if (state.editorMode === 'textAdd') return 'text';
    if (state.selectionMode !== 'none') return 'crosshair';
    return 'default';
  };
  
  // Handle background click for adding text or deselecting labels
  const handleBackgroundClick = (event: React.MouseEvent) => {
    // If ignoring background clicks, do nothing
    if (state.ignoreBackgroundClick) return;
    
    // If in text add mode, add a new standalone label
    if (state.editorMode === 'textAdd') {
      const [x, y] = getSvgCoordinates(event as unknown as MouseEvent);
      
      const newLabel: StandaloneLabel = {
        id: `label-${Date.now()}`,
        text: state.newLabelText,
        position: [x, y],
        fontSize: 12,
        angle: 0,
        visible: true
      };
      
      dispatch({ type: 'ADD_STANDALONE_LABEL', payload: newLabel });
      dispatch({ type: 'SAVE_LABEL_TO_HISTORY', payload: [...state.standaloneLabels, newLabel] });
      dispatch({ type: 'SELECT_STANDALONE_LABEL', payload: newLabel.id });
      
      return;
    }
    
    // Only deselect if we're in label edit mode and not in the middle of a drag
    if (state.editorMode === 'labelEdit' && 
        (state.selectedLabelId || state.selectedStandaloneLabel) && 
        !state.draggedLabelId && 
        !state.draggedStandaloneLabel) {
      
      // Check if the click is directly on the SVG background
      const target = event.target as Element;
      
      // If the target is the SVG element or the background rect, then deselect
      if (target.tagName === 'svg' || (target.tagName === 'rect' && !target.getAttribute('rx'))) {
        if (state.selectedLabelId) {
          dispatch({ type: 'SELECT_LABEL', payload: null });
        }
        if (state.selectedStandaloneLabel) {
          dispatch({ type: 'SELECT_STANDALONE_LABEL', payload: null });
        }
      }
    }
  };
  
  // Combined mouse event handlers
  const handleMouseDownCombined = (e: React.MouseEvent) => {
    handlePanStart(e);
    if (!isPanning) {
      handleMouseDown(e);
      // Only call handleBackgroundClick when directly clicking on the SVG or background rect
      const target = e.target as Element;
      if (target.tagName === 'svg' || (target.tagName === 'rect' && !target.getAttribute('rx'))) {
        handleBackgroundClick(e);
      }
    }
  };
  
  const handleMouseMoveCombined = (e: React.MouseEvent) => {
    handlePanMove(e);
    if (!isPanning) {
      handleMouseMove(e);
    }
    
    // Handle label dragging if needed
    if (state.draggedLabelId) {
      handleLabelDrag(e as unknown as MouseEvent, [0, 0]); // The drag offset would be stored elsewhere
    }
  };
  
  const handleMouseUpCombined = () => {
    handlePanEnd();
    if (!isPanning) {
      handleMouseUp();
    }
    
    if (state.draggedLabelId) {
      handleLabelDragEnd();
    }
  };
  
  // Handle export
  const handleExport = () => {
    onExport(
      state.roads.filter(road => road.visible),
      state.standaloneLabels.filter(label => label.visible),
      exportFormat
    );
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
            <EditorToolbar 
              zoomLevel={zoomLevel}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onResetZoom={resetZoom}
              toggleSelectionMode={toggleSelectionMode}
            />
            
            {/* Text input for new labels */}
            <NewLabelInput />
            
            {/* SVG Preview */}
            <div 
              ref={containerRef}
              className="bg-white w-full h-full relative flex-1 overflow-hidden"
              style={{ 
                minHeight: "500px", 
                cursor: getSvgCursor()
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
                onMouseDown={handleMouseDownCombined}
                onMouseMove={handleMouseMoveCombined}
                onMouseUp={handleMouseUpCombined}
                onMouseLeave={handleMouseUpCombined}
              >
                {/* White background */}
                <rect width="800" height="600" fill="white" />
                
                {/* Draw roads */}
                <RoadPaths roads={state.roads} />
                
                {/* Draw road labels and standalone labels would go here */}
                {/* This is more complex and would be extracted to dedicated components */}
                
                {/* Selection rectangle */}
                {selectionRect && (
                  <SelectionRectangle rect={selectionRect} mode={state.selectionMode} />
                )}
              </svg>
            </div>
          </div>
          
          {/* Road List Panel */}
          <div className="w-96 flex flex-col">
            <ExportPanel 
              format={exportFormat}
              onFormatChange={setExportFormat}
              onExport={handleExport}
            />
            <RoadList />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Container component that wraps the editor with the EditorProvider
 */
export function RoadEditorContainer(props: RoadEditorContainerProps) {
  return (
    <EditorProvider initialRoads={props.roads}>
      <RoadEditorContent
        onClose={props.onClose}
        onExport={props.onExport}
      />
    </EditorProvider>
  );
} 