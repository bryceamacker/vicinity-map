import React from 'react';
import { MousePointer, Move, Type } from 'lucide-react';
import { EditorMode } from '../../types';
import { useEditorContext } from '../../context/EditorContext';

/**
 * Component to render editor mode selection buttons
 */
export function EditorModeSelector() {
  const { state, dispatch } = useEditorContext();
  const { editorMode } = state;
  
  // Toggle editor mode
  const toggleEditorMode = (mode: EditorMode) => {
    dispatch({ 
      type: 'SET_EDITOR_MODE', 
      payload: editorMode === mode ? 'selection' : mode 
    });
  };
  
  return (
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
      <button
        onClick={() => toggleEditorMode('textAdd')}
        className={`px-3 py-1 flex items-center gap-1 ${
          editorMode === 'textAdd' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100'
        }`}
        title="Add Text Labels"
      >
        <Type size={16} className="mr-1" />
        Add Text
      </button>
    </div>
  );
} 