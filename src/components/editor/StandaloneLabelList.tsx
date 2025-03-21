import React from 'react';
import { useEditorContext } from '../../context/EditorContext';
import { PlusCircle, X } from 'lucide-react';

/**
 * Component to render the list of standalone text labels
 */
export function StandaloneLabelList() {
  const { state, dispatch } = useEditorContext();
  const { standaloneLabels } = state;

  const toggleEditorMode = () => {
    dispatch({ type: 'SET_EDITOR_MODE', payload: 'textAdd' });
  };
  
  const updateLabelText = (id: string, text: string) => {
    dispatch({
      type: 'UPDATE_STANDALONE_LABEL',
      payload: { id, updates: { text } }
    });
  };
  
  const toggleLabelVisibility = (id: string) => {
    dispatch({
      type: 'TOGGLE_STANDALONE_LABEL_VISIBILITY',
      payload: id
    });
    
    dispatch({
      type: 'SAVE_LABEL_TO_HISTORY',
      payload: standaloneLabels.map(label => 
        label.id === id ? { ...label, visible: !label.visible } : label
      )
    });
  };
  
  const deleteLabel = (id: string) => {
    dispatch({
      type: 'DELETE_STANDALONE_LABEL',
      payload: id
    });
    
    dispatch({
      type: 'SAVE_LABEL_TO_HISTORY',
      payload: standaloneLabels.filter(label => label.id !== id)
    });
  };
  
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
        Text Labels
        <button 
          onClick={toggleEditorMode}
          className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 flex items-center"
        >
          <PlusCircle size={12} className="mr-1" /> Add Label
        </button>
      </h3>
      <div className="divide-y">
        {standaloneLabels.map(label => (
          <div
            key={label.id}
            className="flex items-center py-2 hover:bg-gray-50 rounded"
          >
            <input
              type="checkbox"
              checked={label.visible}
              onChange={() => toggleLabelVisibility(label.id)}
              className="w-4 h-4 rounded border-gray-300 mr-3"
            />
            <div className="flex-grow">
              <input
                type="text"
                value={label.text}
                onChange={(e) => updateLabelText(label.id, e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <button
              onClick={() => deleteLabel(label.id)}
              className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
              title="Delete label"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 