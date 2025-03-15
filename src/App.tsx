import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { fetchRoadsAndExportSVG, processRoads } from './utils/mapUtils';
import { Search, Download } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { RoadEditor } from './components/RoadEditor';

// Fix for Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Define type for standalone labels
interface StandaloneLabel {
  id: string;
  text: string;
  position: [number, number];
  fontSize?: number;
  angle?: number;
  visible: boolean;
}

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const [address, setAddress] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [roads, setRoads] = useState<any[]>([]);
  const mapRef = useRef<L.Map | null>(null);

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

  const handleExport = async () => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      const roadsData = await processRoads(bounds);
      setRoads(roadsData);
      setShowEditor(true);
    }
  };

  const handleFinalExport = (selectedRoads: any[], standaloneLabels: StandaloneLabel[] = []) => {
    fetchRoadsAndExportSVG(mapRef.current!.getBounds(), selectedRoads, standaloneLabels);
    setShowEditor(false);
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
              onClick={handleExport}
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

      {showEditor && (
        <RoadEditor
          roads={roads}
          onClose={() => setShowEditor(false)}
          onExport={handleFinalExport}
        />
      )}
    </div>
  );
}

export default App;