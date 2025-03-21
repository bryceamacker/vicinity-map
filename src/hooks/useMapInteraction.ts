import { useState, useRef, RefObject, useEffect } from 'react';
import { SVG_WIDTH, SVG_HEIGHT } from '../context/EditorContext';

/**
 * Custom hook for handling map interactions (zoom, pan, etc.)
 */
export function useMapInteraction(
  svgRef: RefObject<SVGSVGElement>,
  containerRef: RefObject<HTMLDivElement>,
  initialZoom = 1,
  initialCenter: [number, number] = [SVG_WIDTH / 2, SVG_HEIGHT / 2]
) {
  const [zoomLevel, setZoomLevel] = useState(initialZoom);
  const [viewCenter, setViewCenter] = useState(initialCenter);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<[number, number]>([0, 0]);

  // Calculate viewBox based on zoom and center
  const getViewBox = () => {
    const width = SVG_WIDTH / zoomLevel;
    const height = SVG_HEIGHT / zoomLevel;
    const x = viewCenter[0] - width / 2;
    const y = viewCenter[1] - height / 2;
    return `${x} ${y} ${width} ${height}`;
  };

  // Zoom in function
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 10)); // Max zoom 10x
  };

  // Zoom out function
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5)); // Min zoom 0.5x
  };

  // Reset zoom and center
  const resetZoom = () => {
    setZoomLevel(1);
    setViewCenter([SVG_WIDTH / 2, SVG_HEIGHT / 2]);
  };

  // Handle mouse wheel for zooming
  const handleWheel = (event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.5, Math.min(10, zoomLevel * factor));
      
      // Get mouse position in SVG coordinates
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (svgRect) {
        const mouseX = event.clientX - svgRect.left;
        const mouseY = event.clientY - svgRect.top;
        
        // Calculate mouse position ratio within viewport
        const ratioX = mouseX / svgRect.width;
        const ratioY = mouseY / svgRect.height;
        
        // Update view center to zoom toward mouse position
        const currentWidth = SVG_WIDTH / zoomLevel;
        const currentHeight = SVG_HEIGHT / zoomLevel;
        const newWidth = SVG_WIDTH / newZoom;
        const newHeight = SVG_HEIGHT / newZoom;
        
        const newCenterX = viewCenter[0] + (currentWidth - newWidth) * (ratioX - 0.5);
        const newCenterY = viewCenter[1] + (currentHeight - newHeight) * (ratioY - 0.5);
        
        setViewCenter([newCenterX, newCenterY]);
      }
      
      setZoomLevel(newZoom);
    }
  };

  // Convert client coordinates to SVG coordinates
  const getSvgCoordinates = (event: MouseEvent): [number, number] => {
    if (!containerRef.current || !svgRef.current) return [0, 0];
    
    // Get the bounding rectangle of the SVG element
    const svgRect = svgRef.current.getBoundingClientRect();
    
    // Calculate the actual dimensions of the SVG as displayed (accounting for aspect ratio)
    const aspectRatio = SVG_WIDTH / SVG_HEIGHT;
    const containerAspectRatio = svgRect.width / svgRect.height;
    
    let scaledWidth = svgRect.width;
    let scaledHeight = svgRect.height;
    let offsetX = 0;
    let offsetY = 0;
    
    // Adjust for preserveAspectRatio="xMidYMid meet"
    if (containerAspectRatio > aspectRatio) {
      // Container is wider than SVG viewBox
      scaledWidth = svgRect.height * aspectRatio;
      offsetX = (svgRect.width - scaledWidth) / 2;
    } else {
      // Container is taller than SVG viewBox
      scaledHeight = svgRect.width / aspectRatio;
      offsetY = (svgRect.height - scaledHeight) / 2;
    }
    
    // Get mouse coordinates relative to the scaled SVG
    const mouseX = event.clientX - svgRect.left - offsetX;
    const mouseY = event.clientY - svgRect.top - offsetY;
    
    // Calculate the visible portion of the SVG (taking zoom into account)
    const visibleWidth = SVG_WIDTH / zoomLevel;
    const visibleHeight = SVG_HEIGHT / zoomLevel;
    const visibleLeft = viewCenter[0] - visibleWidth / 2;
    const visibleTop = viewCenter[1] - visibleHeight / 2;
    
    // Convert mouse coordinates to zoomed SVG coordinates
    const svgX = visibleLeft + (mouseX / scaledWidth) * visibleWidth;
    const svgY = visibleTop + (mouseY / scaledHeight) * visibleHeight;
    
    return [svgX, svgY];
  };

  // Handle pan start
  const handlePanStart = (event: React.MouseEvent) => {
    if (event.altKey) {
      setIsPanning(true);
      setPanStart(getSvgCoordinates(event as unknown as MouseEvent));
      event.preventDefault();
    }
  };

  // Handle pan move
  const handlePanMove = (event: React.MouseEvent) => {
    if (!isPanning) return;
    
    const current = getSvgCoordinates(event as unknown as MouseEvent);
    const dx = (current[0] - panStart[0]) / zoomLevel;
    const dy = (current[1] - panStart[1]) / zoomLevel;
    
    setViewCenter([
      viewCenter[0] - dx,
      viewCenter[1] - dy
    ]);
    
    setPanStart(current);
    event.preventDefault();
  };

  // Handle pan end
  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', () => {});
      document.removeEventListener('mouseup', () => {});
    };
  }, []);

  return {
    zoomLevel,
    viewCenter,
    isPanning,
    getViewBox,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    zoomIn,
    zoomOut,
    resetZoom,
    getSvgCoordinates
  };
} 