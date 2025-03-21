import React from 'react';
import { useEditorContext } from '../../context/EditorContext';
import { RoadListItem } from './RoadListItem';
import { StandaloneLabelList } from './StandaloneLabelList';

/**
 * Component to render the list of roads
 */
export function RoadList() {
  const { state, dispatch } = useEditorContext();
  const { roads, standaloneLabels } = state;
  
  // Count significant road types for display in the UI
  const namedRoads = roads.filter(road => road.name).length;
  const unnamedRoads = roads.length - namedRoads;
  const visibleRoads = roads.filter(road => road.visible).length;
  const visibleNames = roads.filter(road => road.visible && road.showName && road.name).length;
  
  // Handle batch actions
  const selectAllRoads = () => {
    dispatch({ type: 'SELECT_ALL_ROADS' });
    dispatch({ type: 'SAVE_TO_HISTORY', payload: [] }); // This will be filled by the reducer
  };
  
  const deselectAllRoads = () => {
    dispatch({ type: 'DESELECT_ALL_ROADS' });
    dispatch({ type: 'SAVE_TO_HISTORY', payload: [] }); // This will be filled by the reducer
  };
  
  const selectNamedRoadsOnly = () => {
    dispatch({ type: 'SELECT_NAMED_ROADS_ONLY' });
    dispatch({ type: 'SAVE_TO_HISTORY', payload: [] }); // This will be filled by the reducer
  };
  
  const toggleAllRoadNames = (show: boolean) => {
    dispatch({ type: 'TOGGLE_ALL_ROAD_NAMES', payload: show });
    dispatch({ type: 'SAVE_TO_HISTORY', payload: [] }); // This will be filled by the reducer
  };
  
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 rounded-lg mb-4">
        <div className="flex justify-between">
          <span>{namedRoads} named • {unnamedRoads} unnamed</span>
          <span>{visibleRoads} selected • {visibleNames} names shown</span>
        </div>
        
        <div className="mt-2 flex gap-2 flex-wrap">
          <button 
            onClick={selectAllRoads}
            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            Select All
          </button>
          <button 
            onClick={deselectAllRoads}
            className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
          >
            Deselect All
          </button>
          <button 
            onClick={selectNamedRoadsOnly}
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
      
      <div className="space-y-2">
        {roads.map(road => (
          <RoadListItem key={road.id} road={road} />
        ))}
        
        {/* Standalone labels section */}
        {standaloneLabels.length > 0 && (
          <StandaloneLabelList />
        )}
      </div>
    </div>
  );
} 