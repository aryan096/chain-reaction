import type { Cell } from '$lib/types';

/**
 * Compares old and new grid states to detect cell changes
 * Returns an object with arrays of cells that were affected
 */
export function detectGridChanges(
  oldGrid: Cell[][] | null, 
  newGrid: Cell[][], 
  gridSizeX: number, 
  gridSizeY: number
) {
  if (!oldGrid) return { added: [], removed: [], exploded: [] };
  
  const added: [number, number][] = [];    // Cells where atoms were added
  const removed: [number, number][] = [];  // Cells where atoms were removed
  const exploded: [number, number][] = []; // Cells that likely exploded
  
  for (let x = 0; x < gridSizeX; x++) {
    for (let y = 0; y < gridSizeY; y++) {
      const oldCell = oldGrid[x][y];
      const newCell = newGrid[x][y];
      
      // Detect additions (more atoms than before)
      if (newCell.count > oldCell.count) {
        added.push([x, y]);
      }
      
      // Detect removals (fewer atoms than before or player changed)
      if (newCell.count < oldCell.count || 
          (oldCell.player !== null && newCell.player !== oldCell.player)) {
        removed.push([x, y]);
        
        // Detect explosion (cell went from having atoms to zero)
        if (oldCell.count > 0 && newCell.count === 0) {
          exploded.push([x, y]);
        }
      }
    }
  }
  
  return { added, removed, exploded };
}

/**
 * Calculate the maximum number of atoms a cell can hold
 */
export function getMaxAtoms(x: number, y: number, gridSizeX: number, gridSizeY: number): number {
  let edges = 0;
  if (x === 0) edges++;
  if (y === 0) edges++;
  if (x === gridSizeX - 1) edges++;
  if (y === gridSizeY - 1) edges++;
  
  return edges === 2 ? 2 : // corner
         edges === 1 ? 3 : // edge
         4; // middle
}

/**
 * Determines if a cell is in a critical state (one atom away from exploding)
 */
export function isCriticalState(cell: Cell, x: number, y: number, gridSizeX: number, gridSizeY: number): boolean {
  if (!cell.count) return false;
  const maxAtoms = getMaxAtoms(x, y, gridSizeX, gridSizeY);
  return cell.count === maxAtoms - 1;
}
