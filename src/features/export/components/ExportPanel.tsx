import React from 'react';
import { Download, Undo } from 'lucide-react';
import { ExportFormat } from '../../../types';
import { useEditorContext } from '../../../context/EditorContext';

interface ExportPanelProps {
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  onExport: () => void;
}

/**
 * Component for the export panel, including format selection and export button
 */
export function ExportPanel({ format, onFormatChange, onExport }: ExportPanelProps) {
  const { state, dispatch } = useEditorContext();
  const { historyIndex } = state;
  
  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFormatChange(e.target.value as ExportFormat);
  };
  
  const handleUndo = () => {
    dispatch({ type: 'UNDO' });
  };
  
  return (
    <div className="p-4 border-b flex gap-2">
      <button
        onClick={handleUndo}
        disabled={historyIndex === 0}
        className={`px-3 py-1 rounded-lg flex items-center gap-1 ${
          historyIndex === 0
            ? 'bg-gray-100 text-gray-400'
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
        }`}
      >
        <Undo size={16} /> Undo
      </button>
      
      <div className="ml-auto flex items-center gap-2">
        <label className="text-sm text-gray-700">Export Format:</label>
        <select 
          value={format}
          onChange={handleFormatChange}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="dxf">AutoCAD (DXF)</option>
          <option value="svg">SVG</option>
        </select>
        <button
          onClick={onExport}
          className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
        >
          <Download size={16} /> Export
        </button>
      </div>
    </div>
  );
} 