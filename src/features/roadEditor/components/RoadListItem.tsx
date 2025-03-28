import React from 'react';
import { Road } from '../../../types';
import { useEditorContext } from '../../../context/EditorContext';

interface RoadListItemProps {
  road: Road;
  isFiltered?: boolean;
}

/**
 * Component to render a single road item in the list
 */
export function RoadListItem({ road, isFiltered = false }: RoadListItemProps) {
  const { dispatch } = useEditorContext();
  
  // Toggle road visibility
  const toggleRoad = () => {
    dispatch({ type: 'TOGGLE_ROAD_VISIBILITY', payload: road.id });
    dispatch({ type: 'SAVE_TO_HISTORY', payload: [] }); // This will be filled by the reducer
  };
  
  // Toggle road name visibility
  const toggleRoadName = () => {
    dispatch({ type: 'TOGGLE_ROAD_NAME', payload: road.id });
    dispatch({ type: 'SAVE_TO_HISTORY', payload: [] }); // This will be filled by the reducer
  };
  
  // Get display name for the road
  const roadDisplayName = road.name || `Unnamed ${road.originalType || 'Road'}`;
  
  return (
    <div className={`flex items-center p-2 hover:bg-gray-50 rounded-lg ${isFiltered ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={road.visible}
        onChange={toggleRoad}
        className="w-4 h-4 rounded border-gray-300 mr-3"
      />
      <span
        className={`flex-grow cursor-pointer ${road.visible ? 'text-black' : 'text-gray-400'}`}
        onClick={toggleRoad}
      >
        {roadDisplayName}
      </span>
      {road.name && road.visible && (
        <div className="flex items-center pl-2">
          <label className="text-xs text-gray-500 mr-1">Name</label>
          <input
            type="checkbox"
            checked={road.showName}
            onChange={toggleRoadName}
            className="w-3 h-3 rounded border-gray-300"
          />
        </div>
      )}
    </div>
  );
} 