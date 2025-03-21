import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Road, StandaloneLabel, EditorMode, SelectionMode } from '../types';

// Define state interface
interface EditorState {
  roads: Road[];
  standaloneLabels: StandaloneLabel[];
  editorMode: EditorMode;
  selectionMode: SelectionMode;
  selectedLabelId: string | null;
  selectedStandaloneLabel: string | null;
  history: Road[][];
  historyIndex: number;
  labelHistory: StandaloneLabel[][];
  zoomLevel: number;
  viewCenter: [number, number];
  draggedLabelId: string | null;
  draggedStandaloneLabel: string | null;
  isRotating: boolean;
  ignoreBackgroundClick: boolean;
  newLabelText: string;
}

// Define action types
type EditorAction =
  | { type: 'SET_ROADS'; payload: Road[] }
  | { type: 'TOGGLE_ROAD_VISIBILITY'; payload: string }
  | { type: 'TOGGLE_ROAD_NAME'; payload: string }
  | { type: 'SET_EDITOR_MODE'; payload: EditorMode }
  | { type: 'SET_SELECTION_MODE'; payload: SelectionMode }
  | { type: 'SELECT_LABEL'; payload: string | null }
  | { type: 'SELECT_STANDALONE_LABEL'; payload: string | null }
  | { type: 'UPDATE_ROAD_LABEL_OFFSET'; payload: { id: string; offset: [number, number] } }
  | { type: 'UPDATE_ROAD_FONT_SIZE'; payload: { id: string; delta: number } }
  | { type: 'UPDATE_ROAD_ANGLE'; payload: { id: string; angle: number } }
  | { type: 'ADD_STANDALONE_LABEL'; payload: StandaloneLabel }
  | { type: 'UPDATE_STANDALONE_LABEL'; payload: { id: string; updates: Partial<StandaloneLabel> } }
  | { type: 'DELETE_STANDALONE_LABEL'; payload: string }
  | { type: 'TOGGLE_STANDALONE_LABEL_VISIBILITY'; payload: string }
  | { type: 'SET_ZOOM_LEVEL'; payload: number }
  | { type: 'SET_VIEW_CENTER'; payload: [number, number] }
  | { type: 'SET_DRAGGED_LABEL_ID'; payload: string | null }
  | { type: 'SET_DRAGGED_STANDALONE_LABEL'; payload: string | null }
  | { type: 'SET_IS_ROTATING'; payload: boolean }
  | { type: 'SET_IGNORE_BACKGROUND_CLICK'; payload: boolean }
  | { type: 'SET_NEW_LABEL_TEXT'; payload: string }
  | { type: 'SAVE_TO_HISTORY'; payload: Road[] }
  | { type: 'SAVE_LABEL_TO_HISTORY'; payload: StandaloneLabel[] }
  | { type: 'UNDO' }
  | { type: 'SELECT_ALL_ROADS' }
  | { type: 'DESELECT_ALL_ROADS' }
  | { type: 'SELECT_NAMED_ROADS_ONLY' }
  | { type: 'TOGGLE_ALL_ROAD_NAMES'; payload: boolean }
  | { type: 'TOGGLE_ROAD_TYPE_VISIBILITY'; payload: { roadType: string; visible: boolean } }
  | { type: 'TOGGLE_FEATURE_TYPE_VISIBILITY'; payload: { featureType: string; visible: boolean } };

// Reducer function
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_ROADS':
      return { ...state, roads: action.payload };
    
    case 'TOGGLE_ROAD_VISIBILITY':
      return {
        ...state,
        roads: state.roads.map(road =>
          road.id === action.payload ? { ...road, visible: !road.visible } : road
        ),
      };
    
    case 'TOGGLE_ROAD_NAME':
      return {
        ...state,
        roads: state.roads.map(road =>
          road.id === action.payload ? { ...road, showName: !road.showName } : road
        ),
      };
    
    case 'SET_EDITOR_MODE':
      return {
        ...state,
        editorMode: action.payload,
        // Reset related states when changing modes
        selectionMode: action.payload === 'selection' ? state.selectionMode : 'none',
        selectedLabelId: action.payload === 'labelEdit' ? state.selectedLabelId : null,
        selectedStandaloneLabel: action.payload === 'labelEdit' ? state.selectedStandaloneLabel : null,
      };
    
    case 'SET_SELECTION_MODE':
      return { ...state, selectionMode: action.payload };
    
    case 'SELECT_LABEL':
      return { ...state, selectedLabelId: action.payload };
    
    case 'SELECT_STANDALONE_LABEL':
      return { ...state, selectedStandaloneLabel: action.payload };
    
    case 'UPDATE_ROAD_LABEL_OFFSET':
      return {
        ...state,
        roads: state.roads.map(road =>
          road.id === action.payload.id
            ? { ...road, labelOffset: action.payload.offset }
            : road
        ),
      };
    
    case 'UPDATE_ROAD_FONT_SIZE':
      return {
        ...state,
        roads: state.roads.map(road => {
          if (road.id === action.payload.id) {
            const currentSize = road.fontSize || 10;
            const newSize = Math.max(6, Math.min(20, currentSize + action.payload.delta));
            return { ...road, fontSize: newSize };
          }
          return road;
        }),
      };
    
    case 'UPDATE_ROAD_ANGLE':
      return {
        ...state,
        roads: state.roads.map(road =>
          road.id === action.payload.id
            ? { ...road, customAngle: action.payload.angle }
            : road
        ),
      };
    
    case 'ADD_STANDALONE_LABEL':
      return {
        ...state,
        standaloneLabels: [...state.standaloneLabels, action.payload],
      };
    
    case 'UPDATE_STANDALONE_LABEL':
      return {
        ...state,
        standaloneLabels: state.standaloneLabels.map(label =>
          label.id === action.payload.id
            ? { ...label, ...action.payload.updates }
            : label
        ),
      };
    
    case 'DELETE_STANDALONE_LABEL':
      return {
        ...state,
        standaloneLabels: state.standaloneLabels.filter(label => label.id !== action.payload),
        selectedStandaloneLabel: state.selectedStandaloneLabel === action.payload ? null : state.selectedStandaloneLabel,
      };
    
    case 'TOGGLE_STANDALONE_LABEL_VISIBILITY':
      return {
        ...state,
        standaloneLabels: state.standaloneLabels.map(label =>
          label.id === action.payload
            ? { ...label, visible: !label.visible }
            : label
        ),
      };
    
    case 'SET_ZOOM_LEVEL':
      return { ...state, zoomLevel: action.payload };
    
    case 'SET_VIEW_CENTER':
      return { ...state, viewCenter: action.payload };
    
    case 'SET_DRAGGED_LABEL_ID':
      return { ...state, draggedLabelId: action.payload };
    
    case 'SET_DRAGGED_STANDALONE_LABEL':
      return { ...state, draggedStandaloneLabel: action.payload };
    
    case 'SET_IS_ROTATING':
      return { ...state, isRotating: action.payload };
    
    case 'SET_IGNORE_BACKGROUND_CLICK':
      return { ...state, ignoreBackgroundClick: action.payload };
    
    case 'SET_NEW_LABEL_TEXT':
      return { ...state, newLabelText: action.payload };
    
    case 'SAVE_TO_HISTORY':
      return {
        ...state,
        history: [...state.history.slice(0, state.historyIndex + 1), action.payload],
        historyIndex: state.historyIndex + 1,
      };
    
    case 'SAVE_LABEL_TO_HISTORY':
      return {
        ...state,
        labelHistory: [...state.labelHistory.slice(0, state.historyIndex + 1), action.payload],
        // historyIndex is incremented in SAVE_TO_HISTORY, so we don't need to do it here
      };
    
    case 'UNDO':
      if (state.historyIndex > 0) {
        return {
          ...state,
          historyIndex: state.historyIndex - 1,
          roads: state.history[state.historyIndex - 1],
          standaloneLabels: state.labelHistory[state.historyIndex - 1] || state.standaloneLabels,
        };
      }
      return state;
    
    case 'SELECT_ALL_ROADS':
      return {
        ...state,
        roads: state.roads.map(road => ({ ...road, visible: true })),
      };
    
    case 'DESELECT_ALL_ROADS':
      return {
        ...state,
        roads: state.roads.map(road => ({ ...road, visible: false })),
      };
    
    case 'SELECT_NAMED_ROADS_ONLY':
      return {
        ...state,
        roads: state.roads.map(road => ({ ...road, visible: !!road.name })),
      };
    
    case 'TOGGLE_ALL_ROAD_NAMES':
      return {
        ...state,
        roads: state.roads.map(road => ({ ...road, showName: action.payload })),
      };
    
    case 'TOGGLE_ROAD_TYPE_VISIBILITY':
      return {
        ...state,
        roads: state.roads.map(road => 
          road.type === action.payload.roadType 
            ? { ...road, visible: action.payload.visible }
            : road
        ),
      };
    
    case 'TOGGLE_FEATURE_TYPE_VISIBILITY':
      return {
        ...state,
        roads: state.roads.map(road => 
          road.featureType === action.payload.featureType 
            ? { ...road, visible: action.payload.visible }
            : road
        ),
      };
    
    default:
      return state;
  }
}

// Define the context type
interface EditorContextType {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
}

// Create context
const EditorContext = createContext<EditorContextType | undefined>(undefined);

// Provider Props interface
interface EditorProviderProps {
  children: ReactNode;
  initialRoads: Road[];
}

// SVG dimensions
export const SVG_WIDTH = 800;
export const SVG_HEIGHT = 600;

// Provider component
export function EditorProvider({ children, initialRoads }: EditorProviderProps) {
  // Process initial roads to ensure they have all required properties
  const processedInitialRoads = initialRoads.map(road => ({
    ...road,
    showName: road.showName !== undefined ? road.showName : true,
    labelOffset: road.labelOffset || [0, 0],
    fontSize: road.fontSize || 10,
    customAngle: road.customAngle,
  }));

  const [state, dispatch] = useReducer(editorReducer, {
    roads: processedInitialRoads,
    standaloneLabels: [],
    editorMode: 'selection' as EditorMode,
    selectionMode: 'none' as SelectionMode,
    selectedLabelId: null,
    selectedStandaloneLabel: null,
    history: [processedInitialRoads],
    historyIndex: 0,
    labelHistory: [[]],
    zoomLevel: 1,
    viewCenter: [SVG_WIDTH / 2, SVG_HEIGHT / 2],
    draggedLabelId: null,
    draggedStandaloneLabel: null,
    isRotating: false,
    ignoreBackgroundClick: false,
    newLabelText: 'New Label',
  });

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  );
}

// Custom hook for accessing the context
export function useEditorContext() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
}
