import React from 'react';
import { useEditorContext } from '../../../context/EditorContext';

/**
 * Component for the new label input field shown in text add mode
 */
export function NewLabelInput() {
  const { state, dispatch } = useEditorContext();
  const { newLabelText, editorMode } = state;
  
  // Only show in textAdd mode
  if (editorMode !== 'textAdd') {
    return null;
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_NEW_LABEL_TEXT', payload: e.target.value });
  };
  
  return (
    <div className="mb-2 flex items-center bg-green-50 p-2 rounded border border-green-200">
      <label className="text-sm font-medium text-gray-700 mr-2">Label text:</label>
      <input
        type="text"
        value={newLabelText}
        onChange={handleChange}
        className="flex-grow px-3 py-1 border rounded"
        placeholder="Enter label text"
      />
    </div>
  );
} 