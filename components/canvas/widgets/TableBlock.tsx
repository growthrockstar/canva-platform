"use client";

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2 } from 'lucide-react';
import type { Widget } from '@/types/canvas';
import { Button } from '@/components/ui/Button';
import { sheetEngine, type FunctionMetadata } from '@/lib/sheetEngine';
import { useCanvasStore } from '@/lib/store/useCanvasStore';

interface TableBlockProps {
  widget: Widget;
  onUpdate: (data: Partial<Widget>) => void;
}

export const TableBlock: React.FC<TableBlockProps> = ({ widget, onUpdate }) => {
  const { isExporting } = useCanvasStore();
  const rawData = widget.tableData || [['Header 1', 'Header 2'], ['Row 1', 'Row 2']];
  const [editingCell, setEditingCell] = useState<{ r: number, c: number } | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Range Selection State
  const [isDragging, setIsDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ r: number, c: number } | null>(null);
  // We need to track where in the text string the reference started to replace it correctly
  const selectionRefIndex = useRef<number | null>(null);

  // Formula Hints state
  // const [functions, setFunctions] = useState<string[]>([]); // Removed, using metadata now
  const [functionMeta, setFunctionMeta] = useState<FunctionMetadata[]>([]);
  const [suggestions, setSuggestions] = useState<FunctionMetadata[]>([]);
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
    // setFunctions(sheetEngine.getRegisteredFunctions());
    setFunctionMeta(sheetEngine.getFunctionsWithMetadata());
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
      setEditingValue(rawData[r][c]); // Initialize local state
      setShowSuggestions(false);
    }
  }




  const coordsToAddress = (r: number, c: number) => {
    const colChar = String.fromCharCode(65 + c);
    const rowNum = r + 1;
    return `${colChar}${rowNum}`;
  };

  const getRangeString = (start: { r: number, c: number }, end: { r: number, c: number }) => {
    const startAddr = coordsToAddress(start.r, start.c);
    if (start.r === end.r && start.c === end.c) return startAddr;
    const endAddr = coordsToAddress(end.r, end.c);
    // Sort logic handled by Excel/Sheets usually, but let's just put start:end
    // Actually, normally ranges are TopLeft:BottomRight.
    // Let's ensure proper ordering if we want strict rects, but simple start:end works for most engines or we can sort.
    // Let's just do Start:End and if engine complains we fix. HyperFormula handles A10:A1 fine.
    return `${startAddr}:${endAddr}`;
  };


  // Handle click to select range (if editing another cell with formula)
  const handleMouseDown = (e: React.MouseEvent, r: number, c: number) => {
    if (editingCell && (editingCell.r !== r || editingCell.c !== c)) {
      const currentVal = rawData[editingCell.r][editingCell.c];

      // If we are editing a formula
      if (currentVal.startsWith('=')) {
        e.preventDefault(); // Prevent focus loss on editing cell

        // Start selection
        setIsDragging(true);
        setSelectionStart({ r, c });

        // If we were already selecting a range (dragging), we might want to restart?
        // Simpler: Just append new reference.

        const address = coordsToAddress(r, c);
        const newVal = currentVal + address;
        selectionRefIndex.current = currentVal.length; // Mark where this reference starts

        // Update local state instead of onUpdate
        setEditingValue(newVal);
        // We essentially need to "persist" this local change to the 'currentVal' logic used by subsequent drags?
        // Actually, subsequent drags use rawData to find start.
        // BUT rawData is not updated yet!
        // This is tricky. Range drag needs to know the *current prospective value* if we dragged before?
        // No, range drag usually REPLACES the last inserted range.
        // My previous logic in handleMouseEnter: `const currentVal = rawData...` uses stale data if we don't commit.

        // Fix: `selectionRefIndex` allows us to construct new value from Original Base + New Range.
        // So we just need to keep `editingValue` updated.

        // updateCell(editingCell.r, editingCell.c, newVal); // Don't commit yet

        // Keep focus
        const key = `${editingCell.r}-${editingCell.c}`;
        // We need to maintain cursor position at end?
        // Input is controlled, so updating value moves cursor to end usually.
        setTimeout(() => inputRefs.current[key]?.focus(), 0);
        return;
      }
    }
    // Normal click behavior (start editing this cell)
    if (!editingCell) {
      setEditingCell({ r, c });
    }
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (isDragging && selectionStart && editingCell) {
      // We need the base value from before the *current* range selection started.
      // The rawData has the committed value (without ANY range if we started fresh, OR with previous chars).
      // Actually, we shouldn't use rawData[editingCell.r][editingCell.c] if we already appended something in handleMouseDown?
      // Wait, in handleMouseDown I did NOT commit to rawData. So rawData is clean (pre-selection).
      // Perfect.
      const baseVal = rawData[editingCell.r][editingCell.c];

      // Calculate new range string
      const newRange = getRangeString(selectionStart, { r, c });

      // Replace the part of string from selectionRefIndex to end
      if (selectionRefIndex.current !== null) {
        // If we are in the middle of dragging, we construct from base.
        // Note: handleMouseDown appended to `editingValue`. 
        // But here we reconstruct from `baseVal` (which doesn't have the first click address yet! wait).
        // handleMouseDown: `currentVal = rawData...`. Then `newVal = currentVal + address`.
        // If we drag, we want `currentVal + newRange`.
        // So yes, using rawData is correct as the "stable prefix source".

        // Wait, if I typed `=SUM(` and then clicked. rawData is `=SUM(`.
        // handleMouseDown sets `editingValue` to `=SUM(A1`. `selectionRefIndex` points to `A`.
        // handleMouseEnter usage: `prefix = currentVal.substring(0, selectionRefIndex)`. `currentVal` is `=SUM(`.
        // Yes.

        const prefix = baseVal.substring(0, selectionRefIndex.current);
        setEditingValue(prefix + newRange);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setSelectionStart(null);
      selectionRefIndex.current = null;
      // Focus back to input
      if (editingCell) {
        const key = `${editingCell.r}-${editingCell.c}`;
        inputRefs.current[key]?.focus();
      }
    }
  };

  // Add global mouse up to stop dragging if released outside
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

  const handleKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    // Stop propagation to prevent dnd-kit or other listeners from intercepting keys (like . or Backspace)
    e.stopPropagation();

    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions[selectedSuggestionIndex].name);
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
      commitEditing();
      focusCell(r + 1, c);
    }
  }


  const handleChange = (r: number, c: number, value: string) => {
    setEditingValue(value);

    // Basic hint logic: if starts with = and typing letters
    if (value.startsWith('=')) {
      const match = value.match(/([A-Z]+)$/i);
      if (match) {
        const text = match[1].toUpperCase();
        const filtered = functionMeta.filter(f => f.name.startsWith(text));
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
    // const { r, c } = editingCell;
    // Use editingValue instead of rawData since we might have typed more
    const currentVal = editingValue;
    const newVal = currentVal.substring(0, currentVal.length - filterText.length) + funcName + '(';
    setEditingValue(newVal);
    // Focus back ensures we keep editing
    const key = `${editingCell.r}-${editingCell.c}`;
    inputRefs.current[key]?.focus();

    setShowSuggestions(false);
  };

  const commitEditing = () => {
    if (editingCell) {
      updateCell(editingCell.r, editingCell.c, editingValue);
      // We do NOT plain clear editingCell here if we are just moving focus, 
      // but typically commit implies we are done with THIS cell or moving to another.
      // The movement logic (focusCell) sets new editingCell.
      // So this just persists.
    }
  }

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
      return editingValue;
    }
    return sheetEngine.getComputedValue(widget.id, r, c) || rawValue;
  }

  return (
    <div className={`relative ${isExporting ? 'overflow-visible w-max min-w-full' : 'overflow-x-auto'}`}>
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
                  {isExporting ? (
                    <div className={`w-full h-full p-2 bg-transparent ${rowIndex === 0 ? 'font-bold text-[var(--color-primary)]' : 'text-white/80'}`}>
                      {getCellDisplayValue(rowIndex, colIndex, cell)}
                    </div>
                  ) : (
                    <input
                      ref={el => { inputRefs.current[`${rowIndex}-${colIndex}`] = el }}
                      value={getCellDisplayValue(rowIndex, colIndex, cell)}
                      onChange={(e) => handleChange(rowIndex, colIndex, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                      onMouseDown={(e) => handleMouseDown(e, rowIndex, colIndex)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                      onBlur={() => {
                        // Commit on blur
                        if (editingCell?.r === rowIndex && editingCell?.c === colIndex) {
                          commitEditing();
                        }

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
                  )}
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
              {!isExporting && (
                <td className="p-2 w-10 border-none">
                  <Button size="sm" variant="ghost" onClick={() => removeRow(rowIndex)} title="Borrar fila">
                    <Trash2 className="w-4 h-4 text-red-500/50 hover:text-red-500" />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {
        showSuggestions && popoverPosition && createPortal(
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
                key={s.name}
                className={`px-3 py-2 cursor-pointer text-sm border-b border-white/5 last:border-0 ${i === selectedSuggestionIndex ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                onMouseDown={(e) => { e.preventDefault(); applySuggestion(s.name); }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-white">{s.name}</span>
                  <span className="text-xs text-white/50 font-mono">
                    ({s.parameters.join(', ')})
                  </span>
                </div>
                {s.description && (
                  <div className="text-xs text-white/70 italic truncate">
                    {s.description}
                  </div>
                )}
              </div>
            ))}
          </div>,
          document.body
        )
      }

      {
        !isExporting && (
          <div className="flex gap-2 mt-2">
            <Button variant="secondary" size="sm" onClick={addRow}>
              <Plus className="w-4 h-4 mr-2" /> Agregar Fila
            </Button>
            <Button variant="secondary" size="sm" onClick={addColumn}>
              <Plus className="w-4 h-4 mr-2" /> Agregar Columna
            </Button>
          </div>
        )
      }
    </div >
  );
};
