import React, { useState, useMemo } from 'react';
import { useEditorContext } from '../../../context/EditorContext';
import { RoadListItem } from './RoadListItem';
import { RoadTypeGroup } from './RoadTypeGroup';
import { StandaloneLabelList } from './StandaloneLabelList';
import { Road, RoadTypePriority, FeatureTypeGroup, FeatureTypeGroupNames } from '../../../types';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Component to render the list of roads
 */
export function RoadList() {
  const { state, dispatch } = useEditorContext();
  const { roads, standaloneLabels } = state;
  
  // State for search query and expanded feature groups
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    [FeatureTypeGroup.Highway]: true,
    [FeatureTypeGroup.Railway]: true,
    [FeatureTypeGroup.Waterway]: true
  });
  
  // Count significant types for display in the UI
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
  
  // Toggle a feature group's expanded state
  const toggleFeatureGroup = (featureType: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [featureType]: !prev[featureType]
    }));
  };
  
  // Toggle visibility for all roads of a feature type
  const toggleFeatureVisibility = (featureType: string) => {
    dispatch({ 
      type: 'TOGGLE_FEATURE_TYPE_VISIBILITY', 
      payload: { featureType, visible: !allFeatureTypesVisible(featureType) } 
    });
    dispatch({ type: 'SAVE_TO_HISTORY', payload: [] });
  };
  
  // Check if all roads of a feature type are visible
  const allFeatureTypesVisible = (featureType: string): boolean => {
    const featureRoads = roads.filter(road => road.featureType === featureType);
    return featureRoads.length > 0 && featureRoads.every(road => road.visible);
  };
  
  // Get count of visible roads by feature type
  const getVisibleFeatureCount = (featureType: string): [number, number] => {
    const featureRoads = roads.filter(road => road.featureType === featureType);
    const visibleCount = featureRoads.filter(road => road.visible).length;
    return [visibleCount, featureRoads.length];
  };
  
  // Group roads by feature type and then by road type
  const roadsByFeatureAndType = useMemo(() => {
    // First, organize roads by feature type (highway, railway, waterway)
    const featureGroups: Record<string, Road[]> = {};
    
    roads.forEach(road => {
      const featureType = road.featureType || 'highway';
      if (!featureGroups[featureType]) {
        featureGroups[featureType] = [];
      }
      featureGroups[featureType].push(road);
    });
    
    // Then, for each feature type, organize roads by road type
    const result: Record<string, [string, Road[]][]> = {};
    
    Object.entries(featureGroups).forEach(([featureType, featureRoads]) => {
      const typeGroups: Record<string, Road[]> = {};
      
      featureRoads.forEach(road => {
        const type = road.type || 'other';
        if (!typeGroups[type]) {
          typeGroups[type] = [];
        }
        typeGroups[type].push(road);
      });
      
      // Sort road type groups by priority
      result[featureType] = Object.entries(typeGroups)
        .sort(([typeA], [typeB]) => {
          const priorityA = RoadTypePriority[typeA] || 999;
          const priorityB = RoadTypePriority[typeB] || 999;
          return priorityA - priorityB;
        });
    });
    
    return result;
  }, [roads]);
  
  // Get display name function for a road (also used for sorting)
  const getRoadDisplayName = (road: Road): string => {
    return road.name || `Unnamed ${road.originalType || 'Road'}`;
  };

  // Sort and filter roads based on search query (legacy code kept for reference)
  const sortedAndFilteredRoads = useMemo(() => {
    // ... existing sorting/filtering code
    return []; // Not used since we're using road groups
  }, [roads, searchQuery]);
  
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
          placeholder="Search roads, railways and waterways..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="space-y-2">
        {/* Feature type groups */}
        {Object.entries(roadsByFeatureAndType).map(([featureType, typeGroups]) => {
          // Skip empty feature types
          if (typeGroups.length === 0) return null;
          
          // Get counts for this feature group
          const [visibleCount, totalCount] = getVisibleFeatureCount(featureType);
          
          // Get display name for feature type
          const displayName = FeatureTypeGroupNames[featureType] || featureType.charAt(0).toUpperCase() + featureType.slice(1);
          
          return (
            <div key={featureType} className="mb-6">
              {/* Feature type header */}
              <div className="flex items-center bg-gray-200 p-3 rounded-lg cursor-pointer hover:bg-gray-300 mb-2">
                <button onClick={() => toggleFeatureGroup(featureType)} className="mr-2">
                  {expandedGroups[featureType] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                
                <div className="flex-grow font-semibold" onClick={() => toggleFeatureGroup(featureType)}>
                  {displayName}
                  <span className="text-gray-500 ml-2">
                    {visibleCount} of {totalCount}
                  </span>
                </div>
                
                <button 
                  onClick={() => toggleFeatureVisibility(featureType)}
                  className={`px-2 py-1 rounded ${
                    visibleCount === totalCount 
                      ? 'bg-blue-500 text-white' 
                      : visibleCount > 0 
                        ? 'bg-blue-200 text-blue-700' 
                        : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {visibleCount === totalCount ? 'Hide All' : 'Show All'}
                </button>
              </div>
              
              {/* Road type groups within this feature type */}
              {expandedGroups[featureType] && (
                <div className="pl-4">
                  {typeGroups.map(([type, roads]) => (
                    <RoadTypeGroup 
                      key={`${featureType}-${type}`} 
                      type={type} 
                      roads={roads} 
                      searchQuery={searchQuery}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Standalone labels section */}
        {standaloneLabels.length > 0 && (
          <StandaloneLabelList />
        )}
      </div>
    </div>
  );
} 