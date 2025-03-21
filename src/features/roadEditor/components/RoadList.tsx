import React, { useState, useMemo } from 'react';
import { useEditorContext } from '../../../context/EditorContext';
import { RoadListItem } from './RoadListItem';
import { StandaloneLabelList } from './StandaloneLabelList';
import { Road } from '../../../types';
import { Search } from 'lucide-react';

/**
 * Component to render the list of roads
 */
export function RoadList() {
  const { state, dispatch } = useEditorContext();
  const { roads, standaloneLabels } = state;
  
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  
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
  
  // Get display name function for a road (also used for sorting)
  const getRoadDisplayName = (road: Road): string => {
    return road.name || `Unnamed ${road.type || 'Road'}`;
  };

  // Sort and filter roads based on search query
  const sortedAndFilteredRoads = useMemo(() => {
    // 1. Sort alphabetically by name
    const sortedRoads = [...roads].sort((a, b) => {
      const nameA = getRoadDisplayName(a).toLowerCase();
      const nameB = getRoadDisplayName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    // 2. If there's a search query, filter and sort by match relevance
    if (!searchQuery) return sortedRoads;
    
    const query = searchQuery.toLowerCase();
    
    // Separate matching and non-matching roads
    const matchingRoads: Road[] = [];
    const nonMatchingRoads: Road[] = [];
    
    sortedRoads.forEach(road => {
      const roadName = getRoadDisplayName(road).toLowerCase();
      if (roadName.includes(query)) {
        matchingRoads.push(road);
      } else {
        nonMatchingRoads.push(road);
      }
    });
    
    // Sort matching roads by how closely they match the query
    // (exact match first, then starts with query, then includes query)
    matchingRoads.sort((a, b) => {
      const nameA = getRoadDisplayName(a).toLowerCase();
      const nameB = getRoadDisplayName(b).toLowerCase();
      
      // Exact matches come first
      if (nameA === query && nameB !== query) return -1;
      if (nameB === query && nameA !== query) return 1;
      
      // Then starts with query
      if (nameA.startsWith(query) && !nameB.startsWith(query)) return -1;
      if (nameB.startsWith(query) && !nameA.startsWith(query)) return 1;
      
      // Then alphabetical order
      return nameA.localeCompare(nameB);
    });
    
    // Combine matching and non-matching roads
    return [...matchingRoads, ...nonMatchingRoads];
  }, [roads, searchQuery]);
  
  // Determine if a road matches the search query
  const roadMatchesSearch = (road: Road): boolean => {
    if (!searchQuery) return true;
    return getRoadDisplayName(road).toLowerCase().includes(searchQuery.toLowerCase());
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
      
      {/* Search bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search roads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="space-y-2">
        {sortedAndFilteredRoads.map(road => (
          <RoadListItem 
            key={road.id} 
            road={road} 
            isFiltered={!roadMatchesSearch(road)} 
          />
        ))}
        
        {/* Standalone labels section */}
        {standaloneLabels.length > 0 && (
          <StandaloneLabelList />
        )}
      </div>
    </div>
  );
} 