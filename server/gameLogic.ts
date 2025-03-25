import { Cell, GameSettings, GameState, Player } from './types.js';

/**
 * Create an empty game state with initial configuration
 */
export function createGameState(settings: GameSettings, players: Player[]): GameState {
  const { gridSizeX, gridSizeY } = settings;
  
  // Create empty grid
  const grid: Cell[][] = Array(gridSizeX)
    .fill(null)
    .map(() => Array(gridSizeY).fill(null).map(() => ({ count: 0, player: null })));
  
  return {
    grid,
    players: [...players].map(p => ({...p, isEliminated: false})), // Add isEliminated flag
    currentPlayer: players[0], // First player starts
    settings,
    gameOver: false,
    winner: null,
    moveCount: 0, // Track the number of moves made
    eliminatedPlayers: [] // Initialize empty array for eliminated players
  };
}

/**
 * Check if a move is valid
 */
export function isValidMove(gameState: GameState, x: number, y: number, playerId: string): boolean {
  // Check if coordinates are valid
  if (x < 0 || x >= gameState.settings.gridSizeX || 
      y < 0 || y >= gameState.settings.gridSizeY) {
    return false;
  }
  
  // Check if the cell is empty or owned by the current player
  const cell = gameState.grid[x][y];
  return cell.player === null || cell.player === playerId;
}

/**
 * Process a player's move and return updated game state
 */
export function processMove(gameState: GameState, x: number, y: number): GameState {
  // Create a deep clone of the game state
  const newState: GameState = JSON.parse(JSON.stringify(gameState));
  const currentPlayerId = newState.currentPlayer.id;
  
  // Increment move counter
  newState.moveCount++;
  
  // Add atom to the cell and handle cascading explosions
  addAtom(newState.grid, x, y, currentPlayerId);
  
  // Update player cell counts
  updateCellCounts(newState);
  
  // Only consider eliminating players after the first full round of moves
  // This prevents premature elimination when players haven't even had a chance to place atoms
  if (newState.moveCount > newState.players.length) {
    // Check for and mark eliminated players (those with 0 cells after the move)
    // Only consider players who aren't already eliminated
    const activePlayers = newState.players.filter(p => !p.isEliminated);
    
    // Find players who now have 0 cells
    const newlyEliminated = activePlayers.filter(p => p.cellCount === 0);
    
    // Mark these players as eliminated
    if (newlyEliminated.length > 0) {
      newlyEliminated.forEach(player => {
        const playerIndex = newState.players.findIndex(p => p.id === player.id);
        if (playerIndex !== -1) {
          newState.players[playerIndex].isEliminated = true;
          
          // Add to eliminated players list if not already there
          if (!newState.eliminatedPlayers?.includes(player.id)) {
            if (!newState.eliminatedPlayers) {
              newState.eliminatedPlayers = [];
            }
            newState.eliminatedPlayers.push(player.id);
          }
        }
      });
    }
    
    // Check for game over condition - only if we've made at least one full round of moves
    // Count non-eliminated players who have cells
    const remainingPlayers = newState.players.filter(p => !p.isEliminated && p.cellCount > 0);
    
    // Game is over when only one player remains
    if (remainingPlayers.length === 1) {
      newState.gameOver = true;
      newState.winner = remainingPlayers[0];
      return newState;
    }
  }
  
  // Find next player that isn't eliminated
  let nextPlayerIndex = newState.players.findIndex(p => p.id === currentPlayerId);
  let startingPlayerIndex = nextPlayerIndex;
  let loopCount = 0;
  
  do {
    nextPlayerIndex = (nextPlayerIndex + 1) % newState.players.length;
    loopCount++;
    
    // If we've checked all players and came back to the starting player, the game is over
    // But only check this after we've completed one full round of moves
    if (nextPlayerIndex === startingPlayerIndex || loopCount >= newState.players.length) {
      if (newState.moveCount > newState.players.length) {
        // This should only happen if all other players are eliminated
        // Find any remaining player with cells
        const winner = newState.players.find(p => p.cellCount > 0);
        if (winner) {
          newState.gameOver = true;
          newState.winner = winner;
        }
      }
      break;
    }
    
  // In the first round, don't skip players because of cell count (they start with 0)
  } while (newState.players[nextPlayerIndex].isEliminated || 
           (newState.moveCount > newState.players.length && newState.players[nextPlayerIndex].cellCount === 0));
  
  // Set next player
  newState.currentPlayer = newState.players[nextPlayerIndex];
  
  return newState;
}

/**
 * Count the total number of cells that have atoms in them
 */
function countCellsWithAtoms(grid: Cell[][]): number {
  let count = 0;
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      if (grid[x][y].count > 0) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Add an atom to a cell and handle explosions if needed
 */
function addAtom(grid: Cell[][], x: number, y: number, playerId: string): void {
  const cell = grid[x][y];
  
  // If cell was owned by another player, convert it
  cell.player = playerId;
  
  // Increment atom count
  cell.count++;
  
  // Check if cell should explode
  if (cell.count >= getMaxAtoms(grid, x, y)) {
    // Reset the cell when it explodes
    cell.count = 0;
    // Cell should become unoccupied after explosion
    cell.player = null;
    
    // Spread to adjacent cells - this triggers cascading explosions
    const adjacent = getAdjacentCells(grid, x, y);
    for (const [adjX, adjY] of adjacent) {
      // Still pass the original player ID for adjacent cells
      // This ensures chain reactions maintain the right ownership
      addAtom(grid, adjX, adjY, playerId);
    }
  }
}

/**
 * Count cells for each player
 */
function updateCellCounts(gameState: GameState): void {
  const { grid, players } = gameState;
  
  // Reset all cell counts
  players.forEach(p => p.cellCount = 0);
  
  // Count cells
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      const cell = grid[x][y];
      if (cell.player !== null && cell.count > 0) {
        const player = players.find(p => p.id === cell.player);
        if (player) {
          player.cellCount += 1;
        }
      }
    }
  }
}

/**
 * Get the maximum number of atoms a cell can hold before exploding
 */
function getMaxAtoms(grid: Cell[][], x: number, y: number): number {
  // Count edges
  let edges = 0;
  
  // Top edge
  if (y === 0) edges++;
  
  // Left edge
  if (x === 0) edges++;
  
  // Bottom edge
  if (y === grid[0].length - 1) edges++;
  
  // Right edge
  if (x === grid.length - 1) edges++;
  
  // Return max atoms based on edges
  if (edges === 2) return 2; // Corner- has two edges
  if (edges === 1) return 3; // Edge- has one edge
  return 4; // Middle - has no edges
}

/**
 * Get adjacent cells (up, down, left, right)
 */
function getAdjacentCells(grid: Cell[][], x: number, y: number): [number, number][] {
  const adjacent: [number, number][] = [];
  const gridSizeX = grid.length;
  const gridSizeY = grid[0].length;
  
  // Up
  if (y > 0) adjacent.push([x, y - 1]);
  
  // Down
  if (y < gridSizeY - 1) adjacent.push([x, y + 1]);
  
  // Left
  if (x > 0) adjacent.push([x - 1, y]);
  
  // Right
  if (x < gridSizeX - 1) adjacent.push([x + 1, y]);
  
  return adjacent;
}
