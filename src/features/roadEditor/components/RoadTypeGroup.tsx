import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Road, RoadTypeDisplayNames } from '../../../types';
import { RoadListItem } from './RoadListItem';
import { useEditorContext } from '../../../context/EditorContext';

interface RoadTypeGroupProps {
  type: string;
  roads: Road[];
  searchQuery: string;
}

/**
 * Component to render a group of roads by type
 */
export function RoadTypeGroup({ type, roads, searchQuery }: RoadTypeGroupProps) {
  const { dispatch } = useEditorContext();
  const [isOpen, setIsOpen] = useState(true);
  
  // Get display name for this road type
  const displayName = RoadTypeDisplayNames[type] || `${type.charAt(0).toUpperCase() + type.slice(1)} Roads`;
  
  // Calculate stats for this group
  const visibleRoads = roads.filter(road => road.visible).length;
  const totalRoads = roads.length;
  
  // Toggle this group expand/collapse
  const toggleGroup = () => {
    setIsOpen(!isOpen);
  };
  
  // Toggle visibility for all roads in this group
  const toggleGroupVisibility = () => {
    const allVisible = visibleRoads === totalRoads;
    dispatch({ 
      type: 'TOGGLE_ROAD_TYPE_VISIBILITY', 
      payload: { roadType: type, visible: !allVisible } 
    });
    dispatch({ type: 'SAVE_TO_HISTORY', payload: [] });
  };
  
  // Check if any roads match the search query
  const hasMatchingRoads = searchQuery ? 
    roads.some(road => {
      const roadName = road.name || `Unnamed ${road.originalType || 'Road'}`;
      return roadName.toLowerCase().includes(searchQuery.toLowerCase());
    }) : true;
  
  // If no matches and we're searching, don't render
  if (searchQuery && !hasMatchingRoads) {
    return null;
  }
  
  // Determine if a road matches the search query
  const roadMatchesSearch = (road: Road): boolean => {
    if (!searchQuery) return true;
    const roadName = road.name || `Unnamed ${road.originalType || 'Road'}`;
    return roadName.toLowerCase().includes(searchQuery.toLowerCase());
  };
  
  return (
    <div className="mb-2">
      <div className="flex items-center bg-gray-100 p-2 rounded cursor-pointer hover:bg-gray-200">
        <button onClick={toggleGroup} className="mr-1">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        <div className="flex-grow" onClick={toggleGroup}>
          <span className="font-medium">{displayName}</span>
          <span className="text-gray-500 ml-2 text-sm">
            {visibleRoads} of {totalRoads}
          </span>
        </div>
        
        <button 
          onClick={toggleGroupVisibility}
          className={`px-2 py-1 text-xs rounded ${
            visibleRoads === totalRoads 
              ? 'bg-blue-500 text-white' 
              : visibleRoads > 0 
                ? 'bg-blue-200 text-blue-700' 
                : 'bg-gray-200 text-gray-700'
          }`}
        >
          {visibleRoads === totalRoads ? 'Hide All' : 'Show All'}
        </button>
      </div>
      
      {isOpen && (
        <div className="pl-2 mt-1 space-y-1 border-l-2 border-gray-200 ml-2">
          {roads.map(road => (
            <RoadListItem 
              key={road.id} 
              road={road} 
              isFiltered={!roadMatchesSearch(road)} 
            />
          ))}
        </div>
      )}
    </div>
  );
} 