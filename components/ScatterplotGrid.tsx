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
type CheckDragAction = 'check' | 'skip' | null;

// Wavy pattern SVG for "ind" (shaded) cells - uses CSS variable color
// Light theme uses #8898A8, dark theme uses #666666
const getWavyPatternSvg = (color: string) =>
  `data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 3 Q5 0 10 3 T20 3 M0 8 Q5 5 10 8 T20 8 M0 13 Q5 10 10 13 T20 13 M0 18 Q5 15 10 18 T20 18' stroke='${encodeURIComponent(color)}' stroke-width='1.5' fill='none'/%3E%3C/svg%3E`;

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

  // Check column drag state
  const [isCheckDragging, setIsCheckDragging] = useState(false);
  const [checkDragAction, setCheckDragAction] = useState<CheckDragAction>(null);
  const [hasCheckDragged, setHasCheckDragged] = useState(false);
  const startCheckRowRef = useRef<number | null>(null);

  // Track if behavior cell was dragged (to prevent toggle on drag)
  const [hasDragged, setHasDragged] = useState(false);
  const startCellRef = useRef<{row: number, col: number} | null>(null);

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

  // Toggle a single behavior cell (IND ↔ ERR)
  const toggleBehaviorCell = useCallback((row: number, col: number) => {
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

  // Toggle check column between ✓ and ✗
  const toggleCheckColumn = useCallback((row: number) => {
    if (hasAnyInd(row)) return;

    const current = rowStatus[row];
    if (current === 'checked') {
      // Check → Skip
      updateRow(row, 'skip', 'skipped');
    } else {
      // Skip or empty → Check
      updateRow(row, 'err', 'checked');
    }
  }, [hasAnyInd, rowStatus, updateRow]);

  // Handle check column mouse down (start drag)
  const handleCheckMouseDown = useCallback((row: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (hasAnyInd(row)) return;

    setIsCheckDragging(true);
    setHasCheckDragged(false);
    startCheckRowRef.current = row;

    // Determine drag action based on current state (format painter)
    const currentStatus = rowStatus[row];
    if (currentStatus === 'skipped') {
      setCheckDragAction('skip');
    } else {
      setCheckDragAction('check');
    }
  }, [hasAnyInd, rowStatus]);

  // Handle check column mouse enter (during drag)
  const handleCheckMouseEnter = useCallback((row: number) => {
    if (!isCheckDragging || !checkDragAction) return;
    if (hasAnyInd(row)) return;

    setHasCheckDragged(true);

    if (checkDragAction === 'skip' && rowStatus[row] !== 'skipped') {
      updateRow(row, 'skip', 'skipped');
    } else if (checkDragAction === 'check' && rowStatus[row] !== 'checked') {
      updateRow(row, 'err', 'checked');
    }
  }, [isCheckDragging, checkDragAction, hasAnyInd, rowStatus, updateRow]);

  // Handle check column mouse up (end drag, toggle if no drag)
  const handleCheckMouseUp = useCallback((row: number) => {
    if (!hasCheckDragged && startCheckRowRef.current !== null) {
      const startRow = startCheckRowRef.current;
      if (!hasAnyInd(startRow)) {
        toggleCheckColumn(startRow);
      }
    }
  }, [hasCheckDragged, hasAnyInd, toggleCheckColumn]);

  // Handle cell drag
  const handleCellMouseDown = useCallback((row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    startCellRef.current = { row, col };

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

    setHasDragged(true);

    if (dragBrush === 'err') {
      updateRow(row, 'err', 'checked');
    } else if (dragBrush === 'skip') {
      updateRow(row, 'skip', 'skipped');
    } else if (dragBrush === 'ind') {
      // Toggle behavior: if already IND, turn to ERR; otherwise turn to IND
      setGrid(prev => {
        const newGrid = prev.map(r => [...r]);
        if (newGrid[row][col] === 'ind') {
          // Already shaded - toggle it off (back to ERR since row was observed)
          newGrid[row][col] = 'err';
        } else {
          // Mark this cell as IND
          newGrid[row][col] = 'ind';
          // Fill other empty/skip cells with ERR
          for (let c = 0; c < behaviors.length; c++) {
            if (c !== col && (newGrid[row][c] === '' || newGrid[row][c] === 'skip')) {
              newGrid[row][c] = 'err';
            }
          }
        }
        return newGrid;
      });
      setRowStatus(prev => {
        const newStatus = [...prev];
        newStatus[row] = 'checked';
        return newStatus;
      });
      setHasChanges(true);
    } else if (dragBrush === 'empty') {
      // Clear this cell
      setGrid(prev => {
        const newGrid = prev.map(r => [...r]);
        newGrid[row][col] = '';
        // Check if entire row is now empty
        const allEmpty = newGrid[row].every(v => v === '');
        if (allEmpty) {
          setRowStatus(prevStatus => {
            const newStatus = [...prevStatus];
            newStatus[row] = 'empty';
            return newStatus;
          });
        }
        return newGrid;
      });
      setHasChanges(true);
    }
  }, [isDragging, dragBrush, updateRow, behaviors.length]);

  // Handle cell mouse up (toggle if no drag happened)
  const handleCellMouseUp = useCallback((row: number, col: number) => {
    if (!hasDragged && startCellRef.current !== null) {
      const startCell = startCellRef.current;
      // Only toggle if mouseup is on the same cell as mousedown
      if (startCell.row === row && startCell.col === col) {
        toggleBehaviorCell(row, col);
      }
    }
  }, [hasDragged, toggleBehaviorCell]);

  // Handle global mouse up - reset all drag states
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragBrush(null);
      setHasDragged(false);
      startCellRef.current = null;

      // Reset check column drag state
      setIsCheckDragging(false);
      setCheckDragAction(null);
      setHasCheckDragged(false);
      startCheckRowRef.current = null;
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

  // Get cell style - uses CSS variables for theme awareness
  // Grid cells are ALWAYS white with black text for readability
  const getCellStyle = (row: number, col: number): React.CSSProperties => {
    const value = grid[row][col];
    const status = rowStatus[row];

    // Skip cells - light red background
    if (status === 'skipped' || value === 'skip') {
      return {
        background: '#FEE2E2',
        color: '#DC2626',
      };
    }
    // IND cells - grey shaded with wavy pattern
    if (value === 'ind') {
      return {
        backgroundColor: 'var(--grid-shaded-bg)',
        backgroundImage: `url("${getWavyPatternSvg('#888888')}")`,
        backgroundSize: '20px 20px',
        color: 'var(--grid-text)',
      };
    }
    // Default - white cell with black text
    return {
      background: 'var(--grid-cell-bg)',
      color: 'var(--grid-text)',
    };
  };

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: '10px',
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* Instructions */}
      <div style={{
        padding: '12px 20px',
        background: 'var(--surface-elevated)',
        borderBottom: '1px solid var(--border)',
        fontSize: '13px',
        color: 'var(--text-muted)',
      }}>
        <strong style={{ color: 'var(--text)' }}>How to use:</strong>{' '}
        <strong style={{ color: 'var(--primary)' }}>Shaded</strong> = behavior occurred |{' '}
        <strong style={{ color: 'var(--text)' }}>✓ Check</strong> = observed, no behavior (fills row) |{' '}
        <strong style={{ color: 'var(--danger)' }}>✗ Skip</strong> = not observed (fills row).{' '}
        Click+drag to fill. Keys:{' '}
        <kbd style={{ background: 'var(--mist)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text)' }}>I</kbd>{' '}
        <kbd style={{ background: 'var(--mist)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text)' }}>E</kbd>{' '}
        <kbd style={{ background: 'var(--mist)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text)' }}>S</kbd>{' '}
        <kbd style={{ background: 'var(--mist)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text)' }}>C</kbd>
      </div>

      {/* Toolbar */}
      <div style={{
        padding: '12px 20px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Brush:</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setCurrentBrush('ind')}
            style={{
              padding: '8px 16px',
              border: `2px solid ${currentBrush === 'ind' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              background: currentBrush === 'ind'
                ? `repeating-linear-gradient(-45deg, var(--primary) 0px, var(--primary) 2px, var(--secondary) 2px, var(--secondary) 4px)`
                : `repeating-linear-gradient(-45deg, var(--surface-elevated) 0px, var(--surface-elevated) 2px, var(--surface) 2px, var(--surface) 4px)`,
              color: currentBrush === 'ind' ? 'white' : 'var(--primary)',
              transition: 'all 0.15s',
            }}
          >
            Shaded
          </button>
          <button
            onClick={() => setCurrentBrush('err')}
            style={{
              padding: '8px 16px',
              border: `2px solid ${currentBrush === 'err' ? 'var(--text)' : 'var(--border)'}`,
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              background: currentBrush === 'err' ? 'var(--surface-elevated)' : 'var(--surface)',
              color: 'var(--text)',
              transition: 'all 0.15s',
            }}
          >
            ✓ Check (row)
          </button>
          <button
            onClick={() => setCurrentBrush('skip')}
            style={{
              padding: '8px 16px',
              border: `2px solid ${currentBrush === 'skip' ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              background: currentBrush === 'skip' ? 'var(--danger-bg)' : 'var(--surface)',
              color: 'var(--danger)',
              transition: 'all 0.15s',
            }}
          >
            ✗ Skip (row)
          </button>
          <button
            onClick={() => setCurrentBrush('empty')}
            style={{
              padding: '8px 16px',
              border: `2px solid ${currentBrush === 'empty' ? 'var(--text-muted)' : 'var(--border)'}`,
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              background: 'var(--surface)',
              color: 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            Clear
          </button>
        </div>
        <span style={{ borderLeft: '1px solid var(--border)', height: '24px', margin: '0 8px' }}></span>
        <button
          onClick={fillAllERR}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            background: 'var(--surface-elevated)',
            color: 'var(--text)',
          }}
        >
          Fill All ✓
        </button>
        <button
          onClick={fillAllSkip}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
          }}
        >
          Fill All ✗
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)' }}>
          Click and drag to fill cells
        </span>
      </div>

      {/* Grid */}
      <div style={{ padding: '16px 20px', overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
        <table ref={gridRef} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', userSelect: 'none' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{
                background: 'var(--grid-header-bg)',
                padding: '10px 8px',
                textAlign: 'left',
                fontWeight: 600,
                border: '1px solid var(--grid-cell-border, var(--border))',
                minWidth: '100px',
                color: 'var(--text)',
              }}>Time</th>
              <th style={{
                background: 'var(--grid-header-bg)',
                padding: '10px 8px',
                textAlign: 'center',
                fontWeight: 600,
                border: '1px solid var(--grid-cell-border, var(--border))',
                width: '36px',
                minWidth: '36px',
                maxWidth: '36px',
                color: 'var(--text)',
              }}>✓</th>
              {behaviors.map(behavior => (
                <th
                  key={behavior.id}
                  style={{
                    background: 'var(--grid-header-bg)',
                    padding: '10px 8px',
                    textAlign: 'center',
                    fontWeight: 600,
                    border: '1px solid var(--grid-cell-border, var(--border))',
                    minWidth: '100px',
                    color: 'var(--text)',
                  }}
                >
                  {behavior.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: INTERVALS_PER_DAY }).map((_, row) => (
              <tr key={row}>
                <td style={{
                  padding: '6px 8px',
                  textAlign: 'left',
                  background: 'var(--grid-time-bg)',
                  fontWeight: 500,
                  fontSize: '11px',
                  color: 'var(--grid-time-text, var(--text-muted))',
                  border: '1px solid var(--grid-cell-border, var(--border))',
                }}>
                  {formatTime(row)}
                </td>
                <td style={{
                  border: '1px solid var(--grid-cell-border, var(--border))',
                  padding: 0,
                  textAlign: 'center',
                  width: '36px',
                  minWidth: '36px',
                  maxWidth: '36px',
                }}>
                  <div
                    onMouseDown={(e) => handleCheckMouseDown(row, e)}
                    onMouseEnter={() => handleCheckMouseEnter(row)}
                    onMouseUp={() => handleCheckMouseUp(row)}
                    style={{
                      width: '100%',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '14px',
                      background: hasAnyInd(row) ? 'var(--grid-cell-bg)' :
                        rowStatus[row] === 'checked' ? '#F5F5F5' :
                        rowStatus[row] === 'skipped' ? '#FEE2E2' : 'var(--grid-cell-bg)',
                      color: hasAnyInd(row) ? 'transparent' :
                        rowStatus[row] === 'checked' ? '#1A1A1A' :
                        rowStatus[row] === 'skipped' ? '#DC2626' : 'transparent',
                    }}
                  >
                    {!hasAnyInd(row) && rowStatus[row] === 'checked' && '✓'}
                    {!hasAnyInd(row) && rowStatus[row] === 'skipped' && '✗'}
                  </div>
                </td>
                {behaviors.map((_, col) => (
                  <td key={col} style={{ border: '1px solid var(--grid-cell-border, var(--border))', padding: 0, textAlign: 'center' }}>
                    <div
                      onMouseDown={(e) => handleCellMouseDown(row, col, e)}
                      onMouseEnter={() => handleCellMouseEnter(row, col)}
                      onMouseUp={() => handleCellMouseUp(row, col)}
                      style={{
                        width: '100%',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                        fontWeight: 600,
                        fontSize: '14px',
                        ...getCellStyle(row, col),
                      }}
                    >
                      {(rowStatus[row] === 'skipped' || grid[row][col] === 'skip') && '✗'}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--surface-elevated)' }}>
              <td style={{ padding: '8px', fontWeight: 600, fontSize: '11px', border: '1px solid var(--border)', color: 'var(--text)' }}>
                <strong>Observed</strong>
              </td>
              <td style={{ padding: '8px', border: '1px solid var(--border)', color: 'var(--primary)' }}></td>
              {totals.map((t, i) => (
                <td key={i} style={{ padding: '8px', textAlign: 'center', border: '1px solid var(--border)', color: 'var(--primary)', fontWeight: 600, fontSize: '11px' }}>
                  {t.observed}/{INTERVALS_PER_DAY}
                </td>
              ))}
            </tr>
            <tr style={{ background: 'var(--surface-elevated)' }}>
              <td style={{ padding: '8px', fontWeight: 600, fontSize: '11px', border: '1px solid var(--border)', color: 'var(--text)' }}>
                <strong>IND count</strong>
              </td>
              <td style={{ padding: '8px', border: '1px solid var(--border)' }}></td>
              {totals.map((t, i) => (
                <td key={i} style={{ padding: '8px', textAlign: 'center', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px' }}>
                  {t.indCount}
                </td>
              ))}
            </tr>
            <tr style={{ background: 'var(--surface-elevated)' }}>
              <td style={{ padding: '8px', fontWeight: 600, fontSize: '11px', border: '1px solid var(--border)', color: 'var(--text)' }}>
                <strong>ERR count</strong>
              </td>
              <td style={{ padding: '8px', border: '1px solid var(--border)' }}></td>
              {totals.map((t, i) => (
                <td key={i} style={{ padding: '8px', textAlign: 'center', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px' }}>
                  {t.errCount}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        background: 'var(--surface-elevated)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Total cells filled: <span style={{ color: 'var(--text)' }}>{totalFilled}</span> / {INTERVALS_PER_DAY * behaviors.length}
          {hasChanges && <span style={{ marginLeft: '8px', color: '#f59e0b' }}>(unsaved changes)</span>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearAll}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: 'var(--surface)',
              fontSize: '13px',
              cursor: 'pointer',
              color: 'var(--text)',
            }}
          >
            Clear All
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: saving || !hasChanges ? 'var(--border)' : 'var(--primary)',
              color: saving || !hasChanges ? 'var(--text-muted)' : 'var(--bg)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: saving || !hasChanges ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
