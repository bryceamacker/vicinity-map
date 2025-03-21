import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Search, Download } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { RoadEditorContainer } from './features/roadEditor/RoadEditorContainer';
import { fetchRoadData } from './services/overpassService';
import { exportToSVG } from './features/export/svgExport';
import { exportToDXF } from './features/export/dxfExport';
import { DxfPreviewContainer } from './features/dxfPreview/DxfPreviewContainer';
import { Road, StandaloneLabel, ExportFormat } from './types';

// Fix for Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const [address, setAddress] = useState('');
  const [locationName, setLocationName] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [roads, setRoads] = useState<Road[]>([]);
  const [dxfPreviewData, setDxfPreviewData] = useState<string | null>(null);
  const [cachedExportData, setCachedExportData] = useState<{
    roads: Road[],
    standaloneLabels: StandaloneLabel[]
  } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      
      if (data && data[0]) {
        const { lat, lon } = data[0];
        mapRef.current?.setView([parseFloat(lat), parseFloat(lon)], 15);
      }
    } catch (error) {
      console.error('Error searching address:', error);
    }
  };

  const handleFetchRoads = async () => {
    if (!mapRef.current) return;
    try {
      setIsLoading(true);
      setLoadingMessage('Fetching road data...');
      
      const bounds = mapRef.current.getBounds();
      const roadsData = await fetchRoadData(bounds);
      
      setRoads(roadsData);
      setShowEditor(true);
    } catch (error) {
      console.error('Error fetching roads:', error);
      setErrorMessage('Failed to fetch road data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuickExport = () => {
    if (!mapRef.current) return;
    
    // Quick export uses selected roads directly
    const selectedRoads = roads.filter(road => road.visible);
    const standaloneLabels: StandaloneLabel[] = []; // No standalone labels in quick export
    exportToSVG(selectedRoads, standaloneLabels);
  };
  
  const handleFinalExport = (exportRoads: Road[], standaloneLabels: StandaloneLabel[], format: ExportFormat) => {
    // Cache the exported data for later use (like re-download)
    setCachedExportData({
      roads: exportRoads,
      standaloneLabels
    });
    
    if (format === 'svg') {
      // SVG export still just downloads directly
      exportToSVG(exportRoads, standaloneLabels);
    } else if (format === 'dxf') {
      // For DXF, create a preview
      const dxfString = exportToDXF(exportRoads, standaloneLabels, { skipDownload: true });
      if (dxfString) {
        setDxfPreviewData(dxfString);
      }
    }
  };
  
  const handleCloseDxfPreview = () => {
    setDxfPreviewData(null);
    // Reset cached data when closing
    setCachedExportData(null);
  };
  
  const handleBackToEdit = () => {
    setDxfPreviewData(null);
    // Keep the cached data for when the user exports again
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h1 className="text-2xl font-bold mb-4">Vicinity Map Generator</h1>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Search size={20} /> Search
            </button>
            <button
              onClick={handleFetchRoads}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Download size={20} /> Export
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Pan and zoom the map to the desired area, then click Export to edit and generate a vicinity map of the visible region.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4" style={{ height: '70vh' }}>
          <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </MapContainer>
        </div>
      </div>

      {showEditor && !dxfPreviewData && (
        <RoadEditorContainer
          roads={roads}
          onClose={() => setShowEditor(false)}
          onExport={handleFinalExport}
        />
      )}
      
      {dxfPreviewData && cachedExportData && (
        <DxfPreviewContainer
          dxfData={dxfPreviewData}
          onClose={handleCloseDxfPreview}
          onBackToEdit={handleBackToEdit}
          roads={cachedExportData.roads}
          standaloneLabels={cachedExportData.standaloneLabels}
        />
      )}
    </div>
  );
}

export default App;