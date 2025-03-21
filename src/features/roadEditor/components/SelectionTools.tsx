import React from 'react';
import { useEditorContext } from '../../../context/EditorContext';
import { SelectionMode } from '../../../types';

interface SelectionToolsProps {
  toggleSelectionMode: (mode: SelectionMode) => void;
}

/**
 * Component to render selection tools
 */
export function SelectionTools({ toggleSelectionMode }: SelectionToolsProps) {
  const { state } = useEditorContext();
  const { selectionMode, editorMode } = state;
  
  // Only show when in selection mode
  if (editorMode !== 'selection') {
    return null;
  }
  
  return (
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
  );
} 