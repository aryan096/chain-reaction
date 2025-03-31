import { createGameState, isValidMove, processMove } from '../gameLogic.js';
import { Cell, GameSettings, GameState, Player } from '../types.js';

// Test helpers to create game states for testing
function createTestPlayers(): Player[] {
  return [
    { id: 'player1', name: 'Player 1', color: 'red', order: 0, isHost: true, cellCount: 0, isEliminated: false },
    { id: 'player2', name: 'Player 2', color: 'blue', order: 1, isHost: false, cellCount: 0, isEliminated: false },
  ];
}

function createTestSettings(gridSizeX = 3, gridSizeY = 3, playerCount = 2): GameSettings {
  return { gridSizeX, gridSizeY, playerCount };
}

// Helper to create a custom grid for testing specific scenarios
function createCustomGrid(gridSizeX: number, gridSizeY: number, setup: (grid: Cell[][]) => void): Cell[][] {
  const grid: Cell[][] = Array(gridSizeX)
    .fill(null)
    .map(() => Array(gridSizeY).fill(null).map(() => ({ count: 0, player: null })));
  
  setup(grid);
  return grid;
}

// Helper to create a custom game state with a specific grid setup
function createCustomGameState(gridSetup: (grid: Cell[][]) => void, currentPlayerId = 'player1'): GameState {
  const players = createTestPlayers();
  const settings = createTestSettings();
  const gameState = createGameState(settings, players);
  
  gameState.grid = createCustomGrid(settings.gridSizeX, settings.gridSizeY, gridSetup);
  gameState.currentPlayer = players.find(p => p.id === currentPlayerId) || players[0];
  
  return gameState;
}

describe('Game Logic', () => {
  // Test game state initialization
  describe('createGameState', () => {
    it('should create an empty game state with the correct settings', () => {
      const players = createTestPlayers();
      const settings = createTestSettings(4, 5, 2);
      const gameState = createGameState(settings, players);
      
      expect(gameState.grid.length).toBe(4);
      expect(gameState.grid[0].length).toBe(5);
      expect(gameState.players.length).toBe(2);
      expect(gameState.currentPlayer).toEqual(players[0]);
      expect(gameState.gameOver).toBe(false);
      expect(gameState.winner).toBeNull();
      expect(gameState.moveCount).toBe(0);
    });

    it('should initialize all cells as empty', () => {
      const gameState = createGameState(createTestSettings(), createTestPlayers());
      
      for (let x = 0; x < gameState.settings.gridSizeX; x++) {
        for (let y = 0; y < gameState.settings.gridSizeY; y++) {
          expect(gameState.grid[x][y].count).toBe(0);
          expect(gameState.grid[x][y].player).toBeNull();
        }
      }
    });
  });

  // Test valid move detection
  describe('isValidMove', () => {
    it('should return false for out-of-bounds coordinates', () => {
      const gameState = createGameState(createTestSettings(), createTestPlayers());
      
      expect(isValidMove(gameState, -1, 0, 'player1')).toBe(false);
      expect(isValidMove(gameState, 0, -1, 'player1')).toBe(false);
      expect(isValidMove(gameState, 3, 0, 'player1')).toBe(false);
      expect(isValidMove(gameState, 0, 3, 'player1')).toBe(false);
    });

    it('should allow a player to place on empty cells', () => {
      const gameState = createGameState(createTestSettings(), createTestPlayers());
      
      expect(isValidMove(gameState, 0, 0, 'player1')).toBe(true);
      expect(isValidMove(gameState, 2, 2, 'player2')).toBe(true);
    });

    it('should allow a player to place on their own cells', () => {
      const gameState = createCustomGameState((grid) => {
        grid[1][1] = { count: 1, player: 'player1' };
      });
      
      expect(isValidMove(gameState, 1, 1, 'player1')).toBe(true);
    });

    it('should prevent a player from placing on opponent cells', () => {
      const gameState = createCustomGameState((grid) => {
        grid[1][1] = { count: 1, player: 'player2' };
      });
      
      expect(isValidMove(gameState, 1, 1, 'player1')).toBe(false);
    });
  });

  // Test explosion mechanics
  describe('processMove - Explosion Mechanics', () => {
    it('should explode a corner cell when it reaches 2 atoms', () => {
      // First, set up a game state with a corner cell that has 1 atom
      const gameState = createCustomGameState((grid) => {
        grid[0][0] = { count: 1, player: 'player1' };
      });
      
      // Process a move to add another atom to the corner cell, triggering explosion
      const newState = processMove(gameState, 0, 0);
      
      // The corner cell should now be empty
      expect(newState.grid[0][0].count).toBe(0);
      expect(newState.grid[0][0].player).toBeNull();
      
      // And adjacent cells should have 1 atom each of player1
      expect(newState.grid[1][0].count).toBe(1);
      expect(newState.grid[1][0].player).toBe('player1');
      
      expect(newState.grid[0][1].count).toBe(1);
      expect(newState.grid[0][1].player).toBe('player1');
    });

    it('should explode an edge cell when it reaches 3 atoms', () => {
      // Set up an edge cell with 2 atoms
      const gameState = createCustomGameState((grid) => {
        grid[0][1] = { count: 2, player: 'player1' }; // Middle of top edge
      });
      
      // Add another atom to trigger explosion
      const newState = processMove(gameState, 0, 1);
      
      // The edge cell should now be empty
      expect(newState.grid[0][1].count).toBe(0);
      expect(newState.grid[0][1].player).toBeNull();
      
      // And the three adjacent cells should have 1 atom each
      expect(newState.grid[0][0].count).toBe(1); // Top-left corner
      expect(newState.grid[0][0].player).toBe('player1');
      
      expect(newState.grid[0][2].count).toBe(1); // Top-right corner
      expect(newState.grid[0][2].player).toBe('player1');
      
      expect(newState.grid[1][1].count).toBe(1); // Middle cell below
      expect(newState.grid[1][1].player).toBe('player1');
    });

    it('should explode a middle cell when it reaches 4 atoms', () => {
      // Set up a middle cell with 3 atoms
      const gameState = createCustomGameState((grid) => {
        grid[1][1] = { count: 3, player: 'player1' }; // Center cell in 3x3 grid
      });
      
      // Add another atom to trigger explosion
      const newState = processMove(gameState, 1, 1);
      
      // The middle cell should now be empty
      expect(newState.grid[1][1].count).toBe(0);
      expect(newState.grid[1][1].player).toBeNull();
      
      // And all four adjacent cells should have 1 atom each
      expect(newState.grid[0][1].count).toBe(1); // Left
      expect(newState.grid[0][1].player).toBe('player1');
      
      expect(newState.grid[2][1].count).toBe(1); // Right
      expect(newState.grid[2][1].player).toBe('player1');
      
      expect(newState.grid[1][0].count).toBe(1); // Top
      expect(newState.grid[1][0].player).toBe('player1');
      
      expect(newState.grid[1][2].count).toBe(1); // Bottom
      expect(newState.grid[1][2].player).toBe('player1');
    });

    it('should trigger chain reactions when explosions cascade', () => {
      // Create a game state with a critical setup for chain reaction
      const gameState = createCustomGameState((grid) => {
        // Set a corner cell with 1 atom
        grid[0][0] = { count: 1, player: 'player1' };
        
        // And adjacent cells each with 2 atoms (at critical mass)
        grid[1][0] = { count: 2, player: 'player1' }; // Right of the corner (edge cell)
        grid[0][1] = { count: 2, player: 'player1' }; // Below the corner (edge cell)
      });
      
      // Add another atom to the corner to start the chain reaction
      const newState = processMove(gameState, 0, 0);
      
      // The corner and edge cells should all be empty after the cascading explosions
      expect(newState.grid[0][0].count).toBe(0);
      expect(newState.grid[0][0].player).toBeNull();
      
      expect(newState.grid[1][0].count).toBe(1);
      
      expect(newState.grid[0][1].count).toBe(1);
      
      // And atoms should have spread to adjacent cells
      // Cell (2,0) should have an atom from the explosion of (1,0)
      expect(newState.grid[2][0].count).toBe(1);
      expect(newState.grid[2][0].player).toBe('player1');
      
      // Cell (0,2) should have an atom from the explosion of (0,1)
      expect(newState.grid[0][2].count).toBe(1);
      expect(newState.grid[0][2].player).toBe('player1');
      
      // Cell (1,1) should have 2 atoms from both explosions
      expect(newState.grid[1][1].count).toBe(2);
      expect(newState.grid[1][1].player).toBe('player1');
    });

    it('should convert opponent cells during explosions', () => {
      // Create a game state with player1's cell about to explode near player2's cells
      const gameState = createCustomGameState((grid) => {
        grid[1][1] = { count: 3, player: 'player1' }; // Center cell about to explode
        grid[0][1] = { count: 1, player: 'player2' }; // Left cell owned by player2
        grid[1][0] = { count: 1, player: 'player2' }; // Top cell owned by player2
      });
      
      // Process the move to trigger explosion
      const newState = processMove(gameState, 1, 1);
      
      // Player2's cells should now be converted to player1
      expect(newState.grid[0][1].count).toBe(2); // Left cell now has 2 atoms
      expect(newState.grid[0][1].player).toBe('player1'); // and belongs to player1
      
      expect(newState.grid[1][0].count).toBe(2); // Top cell now has 2 atoms
      expect(newState.grid[1][0].player).toBe('player1'); // and belongs to player1
    });
  });

  // Test game over detection
  describe('processMove - Game Over Conditions', () => {
    it('should detect when a player has been eliminated', () => {
      // Create a game state where player2 has only one cell, and player1 is about to take it over
      const gameState = createCustomGameState((grid) => {
        grid[0][0] = { count: 1, player: 'player1' };
        grid[1][0] = { count: 1, player: 'player2' }; // Player2's only cell
      });
      
      // Update cell counts to reflect the setup
      gameState.players[0].cellCount = 1; // player1 has 1 cell
      gameState.players[1].cellCount = 1; // player2 has 1 cell
      
      // Move counter must be greater than player count for elimination logic to kick in
      gameState.moveCount = 3;
      
      // Make a move that will eliminate player2
      const newState = processMove(gameState, 0, 0);
      
      // Verify player2 has been eliminated
      const player2 = newState.players.find(p => p.id === 'player2');
      expect(player2?.isEliminated).toBe(true);
      expect(player2?.cellCount).toBe(0);
      
      // Check that eliminatedPlayers list contains player2
      expect(newState.eliminatedPlayers).toContain('player2');
    });

    it('should end the game when only one player remains', () => {
      // Same setup as previous test
      const gameState = createCustomGameState((grid) => {
        grid[0][0] = { count: 1, player: 'player1' };
        grid[1][0] = { count: 1, player: 'player2' }; // Player2's only cell
      });
      
      gameState.players[0].cellCount = 1;
      gameState.players[1].cellCount = 1;
      gameState.moveCount = 3;
      
      // Make a move that will eliminate player2
      const newState = processMove(gameState, 0, 0);
      
      // Game should be over with player1 as winner
      expect(newState.gameOver).toBe(true);
      expect(newState.winner?.id).toBe('player1');
    });
  });
});
