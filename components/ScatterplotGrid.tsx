'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { IntervalValue, INTERVALS_PER_DAY } from '@/lib/types';

interface Behavior {
  id: string;
  name: string;
  color: string | null;
}

interface IntervalData {
  behaviorId: string;
  intervalIndex: number;
  value: IntervalValue;
}

interface ScatterplotGridProps {
  behaviors: Behavior[];
  initialIntervals?: IntervalData[];
  onSave: (intervals: IntervalData[]) => Promise<void>;
  saving?: boolean;
}

type BrushType = 'ind' | 'err' | 'skip' | 'empty';
type RowStatus = 'empty' | 'checked' | 'skipped';

// Format time for display (7:00 AM start)
function formatTime(intervalIndex: number): string {
  const totalMinutes = 7 * 60 + intervalIndex * 15;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  const startTime = `${displayHour}:${String(minutes).padStart(2, '0')}`;

  const endMinutes = totalMinutes + 14;
  const endHours = Math.floor(endMinutes / 60) % 24;
  const endMins = endMinutes % 60;
  const endDisplayHour = endHours % 12 || 12;
  const endTime = `${endDisplayHour}:${String(endMins).padStart(2, '0')}`;

  return `${startTime}-${endTime} ${period}`;
}

export function ScatterplotGrid({ behaviors, initialIntervals = [], onSave, saving }: ScatterplotGridProps) {
  // Grid data: grid[row][behaviorIndex] = value
  const [grid, setGrid] = useState<IntervalValue[][]>(() => {
    const g: IntervalValue[][] = [];
    for (let i = 0; i < INTERVALS_PER_DAY; i++) {
      g[i] = behaviors.map(() => '');
    }
    // Populate from initial intervals
    initialIntervals.forEach(interval => {
      const colIndex = behaviors.findIndex(b => b.id === interval.behaviorId);
      if (colIndex >= 0 && interval.intervalIndex >= 0 && interval.intervalIndex < INTERVALS_PER_DAY) {
        g[interval.intervalIndex][colIndex] = interval.value;
      }
    });
    return g;
  });

  const [rowStatus, setRowStatus] = useState<RowStatus[]>(() => {
    const status: RowStatus[] = new Array(INTERVALS_PER_DAY).fill('empty');
    // Determine initial status from data
    for (let i = 0; i < INTERVALS_PER_DAY; i++) {
      const hasInd = behaviors.some((_, col) => {
        const interval = initialIntervals.find(
          int => int.behaviorId === behaviors[col]?.id && int.intervalIndex === i
        );
        return interval?.value === 'ind';
      });
      const hasErr = behaviors.some((_, col) => {
        const interval = initialIntervals.find(
          int => int.behaviorId === behaviors[col]?.id && int.intervalIndex === i
        );
        return interval?.value === 'err';
      });
      const hasSkip = behaviors.some((_, col) => {
        const interval = initialIntervals.find(
          int => int.behaviorId === behaviors[col]?.id && int.intervalIndex === i
        );
        return interval?.value === 'skip';
      });

      if (hasInd || hasErr) {
        status[i] = 'checked';
      } else if (hasSkip) {
        status[i] = 'skipped';
      }
    }
    return status;
  });

  const [currentBrush, setCurrentBrush] = useState<BrushType>('ind');
  const [isDragging, setIsDragging] = useState(false);
  const [dragBrush, setDragBrush] = useState<BrushType | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const gridRef = useRef<HTMLTableElement>(null);

  // Calculate totals
  const totals = behaviors.map((_, colIndex) => {
    let observed = 0, indCount = 0, errCount = 0;
    for (let row = 0; row < INTERVALS_PER_DAY; row++) {
      const val = grid[row][colIndex];
      if (val === 'ind') { observed++; indCount++; }
      if (val === 'err') { observed++; errCount++; }
    }
    return { observed, indCount, errCount };
  });

  const totalFilled = grid.flat().filter(v => v !== '').length;

  // Check if row has any IND
  const hasAnyInd = useCallback((row: number) => {
    return grid[row].some(v => v === 'ind');
  }, [grid]);

  // Update a single cell
  const updateCell = useCallback((row: number, col: number, value: IntervalValue) => {
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = value;
      return newGrid;
    });
    setHasChanges(true);
  }, []);

  // Update entire row
  const updateRow = useCallback((row: number, value: IntervalValue, newStatus: RowStatus) => {
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      for (let col = 0; col < behaviors.length; col++) {
        newGrid[row][col] = value;
      }
      return newGrid;
    });
    setRowStatus(prev => {
      const newStatus2 = [...prev];
      newStatus2[row] = newStatus;
      return newStatus2;
    });
    setHasChanges(true);
  }, [behaviors.length]);

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    const currentValue = grid[row][col];

    if (currentValue === 'ind') {
      // Toggle off - back to err
      updateCell(row, col, 'err');
    } else {
      // Mark as ind
      updateCell(row, col, 'ind');
      setRowStatus(prev => {
        const newStatus = [...prev];
        newStatus[row] = 'checked';
        return newStatus;
      });
      // Fill other empty cells in row with err
      setGrid(prev => {
        const newGrid = prev.map(r => [...r]);
        for (let c = 0; c < behaviors.length; c++) {
          if (c !== col && (newGrid[row][c] === '' || newGrid[row][c] === 'skip')) {
            newGrid[row][c] = 'err';
          }
        }
        return newGrid;
      });
    }
    setHasChanges(true);
  }, [grid, updateCell, behaviors.length]);

  // Handle check column click
  const handleCheckClick = useCallback((row: number) => {
    if (hasAnyInd(row)) return;

    const current = rowStatus[row];
    if (current === 'checked') {
      updateRow(row, 'skip', 'skipped');
    } else {
      updateRow(row, 'err', 'checked');
    }
  }, [hasAnyInd, rowStatus, updateRow]);

  // Handle cell drag
  const handleCellMouseDown = useCallback((row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const cellValue = grid[row][col];
    if (cellValue === 'skip') {
      setDragBrush('skip');
    } else if (cellValue === 'ind') {
      setDragBrush('ind');
    } else if (cellValue === 'err' || rowStatus[row] === 'checked') {
      setDragBrush('err');
    } else {
      setDragBrush('ind');
    }
  }, [grid, rowStatus]);

  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (!isDragging || !dragBrush) return;

    if (dragBrush === 'err') {
      updateRow(row, 'err', 'checked');
    } else if (dragBrush === 'skip') {
      updateRow(row, 'skip', 'skipped');
    } else if (dragBrush === 'ind') {
      updateCell(row, col, 'ind');
      setRowStatus(prev => {
        const newStatus = [...prev];
        newStatus[row] = 'checked';
        return newStatus;
      });
      // Fill other empty cells
      setGrid(prev => {
        const newGrid = prev.map(r => [...r]);
        for (let c = 0; c < behaviors.length; c++) {
          if (c !== col && (newGrid[row][c] === '' || newGrid[row][c] === 'skip')) {
            newGrid[row][c] = 'err';
          }
        }
        return newGrid;
      });
    }
  }, [isDragging, dragBrush, updateRow, updateCell, behaviors.length]);

  // Handle mouse up
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragBrush(null);
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'i': setCurrentBrush('ind'); break;
        case 'e': setCurrentBrush('err'); break;
        case 's': setCurrentBrush('skip'); break;
        case 'c': setCurrentBrush('empty'); break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fill all with ERR
  const fillAllERR = useCallback(() => {
    setGrid(prev => prev.map(() => behaviors.map(() => 'err' as IntervalValue)));
    setRowStatus(prev => prev.map(() => 'checked' as RowStatus));
    setHasChanges(true);
  }, [behaviors]);

  // Fill all with Skip
  const fillAllSkip = useCallback(() => {
    setGrid(prev => prev.map(() => behaviors.map(() => 'skip' as IntervalValue)));
    setRowStatus(prev => prev.map(() => 'skipped' as RowStatus));
    setHasChanges(true);
  }, [behaviors]);

  // Clear all
  const clearAll = useCallback(() => {
    if (!confirm('Clear all data?')) return;
    setGrid(prev => prev.map(() => behaviors.map(() => '' as IntervalValue)));
    setRowStatus(prev => prev.map(() => 'empty' as RowStatus));
    setHasChanges(true);
  }, [behaviors]);

  // Save handler
  const handleSave = useCallback(async () => {
    const intervals: IntervalData[] = [];
    for (let row = 0; row < INTERVALS_PER_DAY; row++) {
      for (let col = 0; col < behaviors.length; col++) {
        const value = grid[row][col];
        if (value) {
          intervals.push({
            behaviorId: behaviors[col].id,
            intervalIndex: row,
            value,
          });
        }
      }
    }
    await onSave(intervals);
    setHasChanges(false);
  }, [grid, behaviors, onSave]);

  // Get cell class
  const getCellClass = (row: number, col: number) => {
    const value = grid[row][col];
    const status = rowStatus[row];

    if (status === 'skipped' || value === 'skip') return 'bg-red-50 text-red-500';
    if (value === 'ind') return 'bg-gray-300';
    return 'bg-white';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Brush:</span>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentBrush('ind')}
            className={`px-3 py-1.5 text-sm rounded border ${
              currentBrush === 'ind'
                ? 'bg-gray-300 border-gray-600'
                : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
            }`}
          >
            Shaded
          </button>
          <button
            onClick={() => setCurrentBrush('err')}
            className={`px-3 py-1.5 text-sm rounded border ${
              currentBrush === 'err'
                ? 'bg-gray-200 border-gray-600'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
          >
            Check (row)
          </button>
          <button
            onClick={() => setCurrentBrush('skip')}
            className={`px-3 py-1.5 text-sm rounded border ${
              currentBrush === 'skip'
                ? 'bg-red-100 border-red-500 text-red-600'
                : 'border-gray-300 hover:bg-red-50 text-red-500'
            }`}
          >
            Skip (row)
          </button>
          <button
            onClick={() => setCurrentBrush('empty')}
            className={`px-3 py-1.5 text-sm rounded border ${
              currentBrush === 'empty'
                ? 'bg-gray-100 border-gray-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Clear
          </button>
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={fillAllERR}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Fill All Check
          </button>
          <button
            onClick={fillAllSkip}
            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded"
          >
            Fill All Skip
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-sm text-gray-600">
        <strong>Click</strong> a cell to toggle behavior. <strong>Drag</strong> to fill.
        Keys: <kbd className="px-1 bg-gray-100 rounded text-xs">I</kbd> Shaded
        <kbd className="px-1 bg-gray-100 rounded text-xs ml-2">E</kbd> Check
        <kbd className="px-1 bg-gray-100 rounded text-xs ml-2">S</kbd> Skip
        <kbd className="px-1 bg-gray-100 rounded text-xs ml-2">C</kbd> Clear
      </div>

      {/* Grid */}
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table ref={gridRef} className="w-full border-collapse text-sm select-none">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50">
              <th className="px-2 py-2 text-left font-medium text-gray-600 border-b min-w-[100px]">Time</th>
              <th className="px-2 py-2 text-center font-medium text-gray-600 border-b w-10">Check</th>
              {behaviors.map(behavior => (
                <th
                  key={behavior.id}
                  className="px-2 py-2 text-center font-medium text-gray-600 border-b min-w-[80px]"
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: behavior.color || '#6b7280' }}
                  />
                  {behavior.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: INTERVALS_PER_DAY }).map((_, row) => (
              <tr key={row} className="hover:bg-gray-50">
                <td className="px-2 py-1 text-xs text-gray-500 border-b bg-gray-50">
                  {formatTime(row)}
                </td>
                <td className="px-2 py-1 text-center border-b">
                  <div
                    onClick={() => handleCheckClick(row)}
                    className={`w-7 h-7 flex items-center justify-center cursor-pointer rounded ${
                      hasAnyInd(row) ? 'text-gray-300' :
                      rowStatus[row] === 'checked' ? 'bg-gray-100 text-gray-700' :
                      rowStatus[row] === 'skipped' ? 'bg-red-50 text-red-500' : ''
                    }`}
                  >
                    {!hasAnyInd(row) && rowStatus[row] === 'checked' && 'check'}
                    {!hasAnyInd(row) && rowStatus[row] === 'skipped' && 'X'}
                  </div>
                </td>
                {behaviors.map((_, col) => (
                  <td key={col} className="px-1 py-1 border-b">
                    <div
                      onClick={() => handleCellClick(row, col)}
                      onMouseDown={(e) => handleCellMouseDown(row, col, e)}
                      onMouseEnter={() => handleCellMouseEnter(row, col)}
                      className={`w-full h-7 flex items-center justify-center cursor-pointer rounded transition-colors ${getCellClass(row, col)}`}
                    >
                      {rowStatus[row] === 'skipped' || grid[row][col] === 'skip' ? 'X' : ''}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-blue-50">
            <tr>
              <td className="px-2 py-2 font-medium text-gray-700 border-t">Observed</td>
              <td className="px-2 py-2 border-t"></td>
              {totals.map((t, i) => (
                <td key={i} className="px-2 py-2 text-center text-blue-600 font-medium border-t">
                  {t.observed}/{INTERVALS_PER_DAY}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-2 py-2 font-medium text-gray-700">IND count</td>
              <td className="px-2 py-2"></td>
              {totals.map((t, i) => (
                <td key={i} className="px-2 py-2 text-center text-gray-600">
                  {t.indCount}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-2 py-2 font-medium text-gray-700">ERR count</td>
              <td className="px-2 py-2"></td>
              {totals.map((t, i) => (
                <td key={i} className="px-2 py-2 text-center text-gray-600">
                  {t.errCount}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Total filled: {totalFilled} / {INTERVALS_PER_DAY * behaviors.length}
          {hasChanges && <span className="ml-2 text-yellow-600">(unsaved changes)</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearAll}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100"
          >
            Clear All
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
