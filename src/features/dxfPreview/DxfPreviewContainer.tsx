import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowLeft, Download, Type, Eye, EyeOff } from 'lucide-react';
import { DxfViewer, DxfViewerRef } from './components/DxfViewer';
import { Road, StandaloneLabel } from '../../types';
import { exportToDXF } from '../export/dxfExport';
import { DxfViewer as DxfViewerLib } from 'dxf-viewer';

interface DxfPreviewContainerProps {
  dxfData: string;
  onClose: () => void;
  onBackToEdit: () => void;
  roads: Road[];
  standaloneLabels: StandaloneLabel[];
}

export function DxfPreviewContainer({ 
  dxfData, 
  onClose, 
  onBackToEdit,
  roads,
  standaloneLabels
}: DxfPreviewContainerProps) {
  const [showText, setShowText] = useState(true);
  const viewerRef = useRef<DxfViewerRef>(null);
  
  // This effect toggles the text layer visibility whenever showText changes
  useEffect(() => {
    const viewer = viewerRef.current?.getViewer();
    if (!viewer) return;
    
    const layers = viewer.GetLayers(true);
    const textLayer = layers.find(layer => layer.name === 'Labels');
    
    if (textLayer) {
      viewer.ShowLayer('Labels', showText);
    }
  }, [showText]);
  
  const handleDownload = () => {
    // Use the existing function to download the DXF file
    exportToDXF(roads, standaloneLabels);
  };

  const toggleTextVisibility = () => {
    setShowText(!showText);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">DXF Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={toggleTextVisibility}
              className="p-2 hover:bg-gray-100 rounded-full flex items-center gap-1"
              aria-label={showText ? "Hide Text" : "Show Text"}
              title={showText ? "Hide Text" : "Show Text"}
            >
              {showText ? (
                <>
                  <EyeOff size={16} /> <Type size={16} />
                </>
              ) : (
                <>
                  <Eye size={16} /> <Type size={16} />
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Close"
              title="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 p-4">
          <DxfViewer 
            dxfData={dxfData} 
            ref={viewerRef}
          />
        </div>
        
        <div className="p-4 border-t flex justify-between">
          <button
            onClick={onBackToEdit}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            title="Return to the editor to make changes"
          >
            <ArrowLeft size={16} /> Back to Editor
          </button>
          
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            title="Save the DXF file to your computer"
          >
            <Download size={16} /> Download DXF
          </button>
        </div>
      </div>
    </div>
  );
} 