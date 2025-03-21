import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

/**
 * Component to render zoom controls
 */
export function ZoomControls({ zoomLevel, onZoomIn, onZoomOut, onResetZoom }: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-2 ml-2">
      <button
        onClick={onZoomOut}
        className="p-1 hover:bg-gray-100 rounded"
        title="Zoom out"
      >
        <ZoomOut size={18} />
      </button>
      <span className="text-xs text-gray-500 min-w-[40px] text-center">
        {Math.round(zoomLevel * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        className="p-1 hover:bg-gray-100 rounded"
        title="Zoom in"
      >
        <ZoomIn size={18} />
      </button>
      <button
        onClick={onResetZoom}
        className="p-1 hover:bg-gray-100 rounded"
        title="Reset zoom"
      >
        <RotateCcw size={18} />
      </button>
    </div>
  );
} 