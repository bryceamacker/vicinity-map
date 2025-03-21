import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
// Note: The dxf-viewer library uses Three.js internally, and there may be warnings
// about multiple instances of Three.js being loaded. This is addressed in vite.config.ts
// by aliasing all Three.js imports to the same instance.
import { DxfViewer as DxfViewerLib } from 'dxf-viewer';
import * as three from 'three';
// Import the worker dynamically to prevent issues with Vite/webpack
import DxfViewerWorker from './DxfViewerWorker';

// Use local font files to avoid CORS issues and ensure availability
const FONT_URLS = [
  '/fonts/Roboto-Regular.ttf',
  '/fonts/OpenSans-Regular.ttf'
];

interface DxfViewerProps {
  dxfData: string;
}

export type DxfViewerRef = {
  getViewer: () => DxfViewerLib | null;
};

export const DxfViewer = forwardRef<DxfViewerRef, DxfViewerProps>(({ dxfData }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(-1);
  const [progressText, setProgressText] = useState<string | null>("Loading DXF data...");
  const viewerRef = useRef<DxfViewerLib | null>(null);

  // Expose the viewer instance to the parent component
  useImperativeHandle(ref, () => ({
    getViewer: () => viewerRef.current
  }));

  // Add event handler to prevent wheel events from propagating
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: WheelEvent) => {
      e.stopPropagation();
    };

    // The 'passive: false' option allows preventDefault to work
    container.addEventListener('wheel', preventScroll, { passive: false });

    return () => {
      container.removeEventListener('wheel', preventScroll);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !dxfData) return;

    // Clear any previous error
    setError(null);
    setIsLoading(true);
    setProgress(-1);
    setProgressText("Preparing DXF viewer...");

    try {
      // Create a new DXF viewer instance
      const viewer = new DxfViewerLib(containerRef.current, {
        clearColor: new three.Color("#fff"),
        autoResize: true,
        colorCorrection: true,
        sceneOptions: {
          wireframeMesh: true
        }
      });

      viewerRef.current = viewer;

      // Convert string to blob for loading
      const blob = new Blob([dxfData], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);

      // Create a worker factory function
      const workerFactory = () => {
        // The worker module is already set up
        return new Worker(new URL('./DxfViewerWorker.ts', import.meta.url), { type: 'module' });
      };

      // Load the DXF data
      viewer.Load({
        url,
        fonts: FONT_URLS, // Use local font files
        progressCbk: handleProgress,
        workerFactory
      }).then(() => {
        setIsLoading(false);
        setProgress(null);
        setProgressText(null);
        // Revoke the URL after loading
        URL.revokeObjectURL(url);

        // Ensure all layers are visible after loading
        const layers = viewer.GetLayers(true);
        for (const layer of layers) {
          if (!layer.isVisible) {
            viewer.ShowLayer(layer.name, true);
          }
        }
      }).catch(err => {
        console.error('Error loading DXF:', err);
        setError(`Failed to load DXF: ${err.toString()}`);
        setIsLoading(false);
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('Error initializing DXF viewer:', err);
      setError(`Failed to initialize DXF viewer: ${String(err)}`);
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (viewerRef.current) {
        viewerRef.current.Destroy();
        viewerRef.current = null;
      }
    };
  }, [dxfData]);

  const handleProgress = (phase: string, size: number, totalSize: number | null) => {
    switch (phase) {
      case "font":
        setProgressText("Loading fonts...");
        break;
      case "fetch":
        setProgressText("Fetching DXF data...");
        break;
      case "parse":
        setProgressText("Parsing DXF data...");
        break;
      case "prepare":
        setProgressText("Preparing rendering data...");
        break;
    }

    if (totalSize === null) {
      setProgress(-1); // Indeterminate
    } else {
      setProgress(size / totalSize);
    }
  };

  return (
    <div 
      className="relative w-full h-full min-h-[400px] overflow-hidden touch-none" 
      ref={containerRef}
      style={{ 
        // Prevent page scrolling when interacting with the viewer
        touchAction: 'none'
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          {progressText && <p className="text-gray-700">{progressText}</p>}
          {progress !== null && progress >= 0 && (
            <div className="w-64 bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-blue-500 h-2.5 rounded-full" 
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative max-w-md">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}); 