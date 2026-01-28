import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2 } from 'lucide-react';
import type { Widget } from '../../../types/canvas';
import { Button } from '../../ui/Button';
import { sheetEngine } from '../../../lib/sheetEngine';

interface TableBlockProps {
  widget: Widget;
  onUpdate: (data: Partial<Widget>) => void;
}

export const TableBlock: React.FC<TableBlockProps> = ({ widget, onUpdate }) => {
  const rawData = widget.tableData || [['Header 1', 'Header 2'], ['Row 1', 'Row 2']];
  const [editingCell, setEditingCell] = useState<{ r: number, c: number } | null>(null);

  // Formula Hints state
  const [functions, setFunctions] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [popoverPosition, setPopoverPosition] = useState<{ top: number, left: number } | null>(null);

  // Ref for input elements to manage focus
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync with engine whenever data changes
  useEffect(() => {
    sheetEngine.updateSheet(widget.id, rawData);
  }, [widget.id, rawData]);

  // Load functions on mount
  useEffect(() => {
    setFunctions(sheetEngine.getRegisteredFunctions());
  }, []);

  // Auto-scroll to selected suggestion
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedSuggestionIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedSuggestionIndex, showSuggestions]);

  const updatePopoverPosition = (r: number, c: number) => {
    const input = inputRefs.current[`${r}-${c}`];
    if (input) {
      const rect = input.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
  };

  const focusCell = (r: number, c: number) => {
    const key = `${r}-${c}`;
    if (inputRefs.current[key]) {
      inputRefs.current[key]?.focus();
      setEditingCell({ r, c });
      setShowSuggestions(false);
    }
  }

  // Handle click to select range (if editing another cell with formula)
  const handleCellClick = (e: React.MouseEvent, r: number, c: number) => {
    if (editingCell && (editingCell.r !== r || editingCell.c !== c)) {
      const currentVal = rawData[editingCell.r][editingCell.c];
      if (currentVal.startsWith('=')) {
        e.preventDefault();
        // Calculate cell address (e.g., A1, B2)
        const colChar = String.fromCharCode(65 + c);
        const rowNum = r + 1;
        const address = `${colChar}${rowNum}`;

        const newVal = currentVal + address;
        updateCell(editingCell.r, editingCell.c, newVal);

        // Keep focus on the editing cell
        const key = `${editingCell.r}-${editingCell.c}`;
        setTimeout(() => inputRefs.current[key]?.focus(), 0);
        return;
      }
    }
    // Normal behavior
    setEditingCell({ r, c });
  };

  const handleKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions[selectedSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      // e.preventDefault(); // Default behavior allows cursor movement inside text
    } else if (e.key === 'ArrowLeft') {
      // e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusCell(r + 1, c);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusCell(r - 1, c);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      focusCell(r + 1, c);
    }
  };

  const handleChange = (r: number, c: number, value: string) => {
    updateCell(r, c, value);

    // Basic hint logic: if starts with = and typing letters
    if (value.startsWith('=')) {
      const match = value.match(/([A-Z]+)$/i);
      if (match) {
        const text = match[1].toUpperCase();
        const filtered = functions.filter(f => f.startsWith(text));
        if (filtered.length > 0) {
          setSuggestions(filtered);
          setFilterText(text);
          setShowSuggestions(true);
          setSelectedSuggestionIndex(0);
          updatePopoverPosition(r, c);
          return;
        }
      }
    }
    setShowSuggestions(false);
  };

  const applySuggestion = (funcName: string) => {
    if (!editingCell) return;
    const { r, c } = editingCell;
    const currentVal = rawData[r][c];
    const newVal = currentVal.substring(0, currentVal.length - filterText.length) + funcName + '(';
    updateCell(r, c, newVal);
    setShowSuggestions(false);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...rawData];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = value;
    onUpdate({ tableData: newData });
  };

  const addRow = () => {
    const cols = rawData[0].length;
    const newRow = Array(cols).fill('');
    onUpdate({ tableData: [...rawData, newRow] });
  };

  const addColumn = () => {
    const newData = rawData.map(row => [...row, '']);
    onUpdate({ tableData: newData });
  };

  const removeRow = (index: number) => {
    if (rawData.length <= 1) return;
    const newData = rawData.filter((_, i) => i !== index);
    onUpdate({ tableData: newData });
  }

  const removeColumn = (index: number) => {
    if (rawData[0].length <= 1) return;
    const newData = rawData.map(row => row.filter((_, i) => i !== index));
    onUpdate({ tableData: newData });
  }

  const getCellDisplayValue = (r: number, c: number, rawValue: string) => {
    if (editingCell?.r === r && editingCell?.c === c) {
      return rawValue;
    }
    return sheetEngine.getComputedValue(widget.id, r, c) || rawValue;
  }

  return (
    <div className="overflow-x-auto relative">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 w-8 bg-black/20 text-xs text-white/30 border border-white/10"></th>
            {rawData[0].map((_, i) => (
              <th key={i} className="p-2 bg-black/20 text-xs text-white/50 border border-white/10 font-mono">
                {String.fromCharCode(65 + i)}
              </th>
            ))}
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {rawData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="p-2 bg-black/20 text-xs text-white/50 border border-white/10 font-mono text-center">
                {rowIndex + 1}
              </td>
              {row.map((cell, colIndex) => (
                <td key={colIndex} className="border border-white/10 p-0 relative group min-w-[100px]">
                  <input
                    ref={el => { inputRefs.current[`${rowIndex}-${colIndex}`] = el }}
                    value={getCellDisplayValue(rowIndex, colIndex, cell)}
                    onChange={(e) => handleChange(rowIndex, colIndex, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    onMouseDown={(e) => handleCellClick(e, rowIndex, colIndex)}
                    onBlur={() => {
                      // Delay clearing editing cell to allow suggestion click to fire
                      setTimeout(() => {
                        // If we weren't just picking a suggestion (logic handled in click)
                        // But here we need to be careful not to clear if we are just clicking another cell for range selection
                        // Actually range selection keeps focus on original cell, so blur happens on original cell only if we click outside entirely 
                        // or if we switch focus to another cell normally. 
                        // If we click another cell in range mode, we preventDefault so blur shouldn't happen?
                        // Wait, if I click another input, the current one blurs.
                        // Range selection is tricky: if I mouseDown on another cell, browser attempts to focus it, firing blur on current.
                        // preventDefault on mouseDown should stop focus change.

                        // Let's rely on setEditingCell(null) only if we aren't in range select mode? 
                        // Simplified: Just update `setEditingCell(null)` here unless we deal with specific retention cases.
                        // The ranges selection logic is: click other cell -> preventDefault -> focus stays on current cell. 
                        // So onBlur shouldn't fire for the current cell in that case.
                        // We only setEditingCell(null) if focus actually leaves.
                        if (!showSuggestions) {
                          // We check relatedTarget? checking activeElement might be too late.
                          // For now standard behavior.
                          setEditingCell(null);
                        }
                      }, 150);
                    }}
                    className={`w-full h-full p-2 bg-transparent border-none focus:outline-none 
                                    ${rowIndex === 0 ? 'font-bold text-[var(--color-primary)]' : 'text-white/80'}
                                    focus:bg-white/10 transition-colors
                               `}
                  />

                  {/* Suggestions Popover moved to Portal */}

                  {rowIndex === 0 && (
                    <button
                      onClick={() => removeColumn(colIndex)}
                      className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-0.5 z-10"
                      title="Borrar columna"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </td>
              ))}
              <td className="p-2 w-10 border-none">
                <Button size="sm" variant="ghost" onClick={() => removeRow(rowIndex)} title="Borrar fila">
                  <Trash2 className="w-4 h-4 text-red-500/50 hover:text-red-500" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showSuggestions && popoverPosition && createPortal(
        <div
          ref={suggestionsRef}
          className="fixed z-[9999] bg-gray-900 border border-white/20 rounded shadow-lg max-h-48 overflow-y-auto w-48 font-sans"
          style={{
            top: popoverPosition.top - window.scrollY, // Fixed position is relative to viewport, so we need calculated client coordinates
            left: popoverPosition.left - window.scrollX
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={s}
              className={`px-3 py-1 cursor-pointer text-sm ${i === selectedSuggestionIndex ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
              onMouseDown={(e) => { e.preventDefault(); applySuggestion(s); }}
            >
              {s}
            </div>
          ))}
        </div>,
        document.body
      )}

      <div className="flex gap-2 mt-2">
        <Button variant="secondary" size="sm" onClick={addRow}>
          <Plus className="w-4 h-4 mr-2" /> Agregar Fila
        </Button>
        <Button variant="secondary" size="sm" onClick={addColumn}>
          <Plus className="w-4 h-4 mr-2" /> Agregar Columna
        </Button>
      </div>
    </div>
  );
};
