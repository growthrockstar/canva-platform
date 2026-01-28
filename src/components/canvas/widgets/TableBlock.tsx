import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Widget } from '../../../types/canvas';
import { Button } from '../../ui/Button';

interface TableBlockProps {
  widget: Widget;
  onUpdate: (data: Partial<Widget>) => void;
}

export const TableBlock: React.FC<TableBlockProps> = ({ widget, onUpdate }) => {
  const data = widget.tableData || [['Header 1', 'Header 2'], ['Row 1', 'Row 2']];

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = value;
    onUpdate({ tableData: newData });
  };

  const addRow = () => {
    const cols = data[0].length;
    const newRow = Array(cols).fill('');
    onUpdate({ tableData: [...data, newRow] });
  };

  const addColumn = () => {
    const newData = data.map(row => [...row, '']);
    onUpdate({ tableData: newData });
  };

  const removeRow = (index: number) => {
      if (data.length <= 1) return;
      const newData = data.filter((_, i) => i !== index);
      onUpdate({ tableData: newData });
  }

  const removeColumn = (index: number) => {
      if (data[0].length <= 1) return;
      const newData = data.map(row => row.filter((_, i) => i !== index));
      onUpdate({ tableData: newData });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {data[0].map((cell, i) => (
              <th key={i} className="border border-white/20 bg-[var(--color-primary)]/20 p-2 min-w-[100px] relative group">
                <input
                  value={cell}
                  onChange={(e) => updateCell(0, i, e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none font-bold text-[var(--color-text)]"
                />
                 <button 
                    onClick={() => removeColumn(i)}
                    className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-0.5"
                    title="Borrar columna"
                 >
                     <Trash2 className="w-3 h-3" />
                 </button>
              </th>
            ))}
            <th className="p-2 w-10">
                <Button size="sm" variant="ghost" onClick={addColumn} title="Agregar columna">
                    <Plus className="w-4 h-4" />
                </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex + 1}>
              {row.map((cell, colIndex) => (
                <td key={colIndex} className="border border-white/10 p-2 min-w-[100px]">
                  <input
                    value={cell}
                    onChange={(e) => updateCell(rowIndex + 1, colIndex, e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none text-white/80"
                  />
                </td>
              ))}
               <td className="p-2 w-10 border-none">
                <Button size="sm" variant="ghost" onClick={() => removeRow(rowIndex + 1)} title="Borrar fila">
                    <Trash2 className="w-4 h-4 text-red-500/50 hover:text-red-500" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button variant="secondary" size="sm" onClick={addRow} className="mt-2">
        <Plus className="w-4 h-4 mr-2" /> Agregar Fila
      </Button>
    </div>
  );
};
