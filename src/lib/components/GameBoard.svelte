<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { elasticOut, bounceOut } from 'svelte/easing';
  import type { Cell, Player } from '$lib/types';
  
  export let grid: Cell[][] = [];
  export let gridSizeX: number = 6;
  export let gridSizeY: number = 6;
  export let onCellClick: (x: number, y: number) => void;
  export let currentPlayer: Player | null = null;
  export let isMyTurn: boolean = false;
  export let players: Player[] = [];
  
  // Track explosion animations
  let explosions: {x: number, y: number, timestamp: number}[] = [];
  let previousGrid: Cell[][] | null = null;
  
  // Animation settings
  const atomSize = 20; // Increased from 14px
  const explosionDuration = 800; // ms
  
  // Detect changes in the grid to trigger animations
  $: if (previousGrid && grid) {
    detectExplosions(previousGrid, grid);
  }
  
  // Track grid changes to detect explosions
  $: if (grid) {
    // Clone the grid to compare later
    previousGrid = JSON.parse(JSON.stringify(grid));
  }
  
  // Get player color from player ID
  function getPlayerColor(playerId: string | null): string {
    if (!playerId) return '#ccc';
    const player = players.find(p => p.id === playerId);
    return player ? player.color : '#ccc';
  }
  
  // Get the max atoms a cell can hold based on its position
  function getMaxAtoms(x: number, y: number): number {
    let edges = 0;
    if (x === 0) edges++;
    if (y === 0) edges++;
    if (x === gridSizeX - 1) edges++;
    if (y === gridSizeY - 1) edges++;
    
    return edges === 2 ? 2 : // corner
           edges === 1 ? 3 : // edge
           4; // middle
  }
  
  // Calculate positions of atoms within a cell based on count
  function getAtomPositions(count: number, max: number): {x: number, y: number}[] {
    const positions: {x: number, y: number}[] = [];
    
    switch(max) {
      case 2: // Corner
        if (count >= 1) positions.push({x: 0.5, y: 0.5});
        if (count >= 2) positions.push({x: 0.3, y: 0.3});
        break;
      case 3: // Edge
        if (count >= 1) positions.push({x: 0.5, y: 0.5});
        if (count >= 2) positions.push({x: 0.3, y: 0.5});
        if (count >= 3) positions.push({x: 0.7, y: 0.5});
        break;
      case 4: // Middle
        if (count >= 1) positions.push({x: 0.5, y: 0.5});
        if (count >= 2) positions.push({x: 0.3, y: 0.3});
        if (count >= 3) positions.push({x: 0.7, y: 0.3});
        if (count >= 4) positions.push({x: 0.5, y: 0.7});
        break;
    }
    
    return positions;
  }
  
  // Detect cells that exploded between grid states
  function detectExplosions(oldGrid: Cell[][], newGrid: Cell[][]): void {
    for (let x = 0; x < gridSizeX; x++) {
      for (let y = 0; y < gridSizeY; y++) {
        const oldCell = oldGrid[x][y];
        const newCell = newGrid[x][y];
        
        // A cell exploded if its count was at max and is now 0
        const maxAtoms = getMaxAtoms(x, y);
        if (oldCell.count >= maxAtoms && newCell.count === 0) {
          // Add to explosion animations
          explosions = [...explosions, { x, y, timestamp: Date.now() }];
          
          // Clean up old explosions (older than animation duration)
          const now = Date.now();
          explosions = explosions.filter(exp => (now - exp.timestamp) < explosionDuration);
        }
      }
    }
  }
  
  // Check if a cell is currently exploding
  function isExploding(x: number, y: number): boolean {
    const now = Date.now();
    return explosions.some(exp => 
      exp.x === x && exp.y === y && (now - exp.timestamp) < explosionDuration
    );
  }
  
  // Generate a random offset for atom animation
  function getRandomOffset(): number {
    return (Math.random() - 0.5) * 0.2; // Small random variation
  }
  
  // Generate column labels (A, B, C...)
  function getColumnLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }
  
  onMount(() => {
    // Clean up old explosions periodically
    const interval = setInterval(() => {
      const now = Date.now();
      explosions = explosions.filter(exp => (now - exp.timestamp) < explosionDuration);
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="mb-4 text-center">
  {#if isMyTurn}
    <div class="bg-green-100 border-l-4 border-green-500 p-2" in:fade={{duration: 300}}>
      Your turn! Click a cell to make a move.
    </div>
  {:else if currentPlayer}
    <div class="bg-gray-100 border-l-4 border-gray-500 p-2" in:fade={{duration: 300}}>
      Waiting for {currentPlayer.name} to make a move...
    </div>
  {/if}
</div>

<div class="board-container">
  <!-- Column headers (A, B, C...) -->
  <div class="column-headers">
    <div class="corner-spacer"></div>
    {#each Array(gridSizeX) as _, x}
      <div class="column-label">{getColumnLabel(x)}</div>
    {/each}
  </div>
  
  <div class="board-with-rows flex flex-row">
    <!-- Row numbers (1, 2, 3...) -->
    <div class="row-labels">
      {#each Array(gridSizeY) as _, y}
        <div class="row-label">{y + 1}</div>
      {/each}
    </div>
    
    <!-- The actual game board -->
    <div class="game-board flex-1" style="grid-template-columns: repeat({gridSizeX}, minmax(0, 1fr));">
      {#each Array(gridSizeY) as _, y}
        {#each Array(gridSizeX) as _, x}
          {@const cell = grid[x][y]}
          {@const maxAtoms = getMaxAtoms(x, y)}
          {@const playerColor = getPlayerColor(cell.player)}
          {@const isPlayable = isMyTurn && (!cell.player || cell.player === currentPlayer?.id)}
          {@const exploding = isExploding(x, y)}
          
          <div 
            class="cell relative border border-gray-300 aspect-square rounded-sm flex items-center justify-center
                  {isPlayable ? 'cursor-pointer hover:bg-blue-50' : 'cursor-not-allowed'}
                  {exploding ? 'exploding' : ''}"
            on:click={() => isPlayable && onCellClick(x, y)}
          >
            <!-- Explosion animation overlay -->
            {#if exploding}
              <div class="explosion-overlay absolute inset-0" transition:scale={{duration: 400, easing: elasticOut}}></div>
            {/if}
            
            <!-- Atoms -->
            {#if cell.count > 0}
              {#each getAtomPositions(cell.count, maxAtoms) as pos, i}
                <div 
                  class="atom absolute rounded-full shadow-md"
                  in:scale={{
                    delay: i * 100, 
                    duration: 400,
                    easing: elasticOut,
                  }}
                  style="
                    background-color: {playerColor}; 
                    width: {atomSize}px; 
                    height: {atomSize}px;
                    left: calc({pos.x} * 100% + {getRandomOffset()}em);
                    top: calc({pos.y} * 100% + {getRandomOffset()}em);
                    transform: translate(-50%, -50%);
                    z-index: 10;
                  "
                ></div>
              {/each}
            {/if}
            
            <!-- Debug info - can be removed in production -->
            <span class="text-[8px] text-gray-400 absolute bottom-0 right-1">
              {maxAtoms}
            </span>
          </div>
        {/each}
      {/each}
    </div>
  </div>
</div>

<style>
  .game-board {
    display: grid;
    gap: 2px;
    background-color: #f9fafb;
    padding: 8px;
    border-radius: 8px;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
  }
  
  .board-container {
    display: flex;
    flex-direction: column;
  }
  
  .column-headers {
    display: flex;
  }
  
  .column-label {
    flex: 1;
    text-align: center;
    font-size: 0.8rem;
    color: #666;
    padding-bottom: 4px;
  }
  
  .corner-spacer {
    width: 24px;
  }
  
  .board-with-rows {
    display: flex;
    align-items: stretch;
  }
  
  .row-labels {
    display: flex;
    flex-direction: column;
    width: 24px;
    justify-content: space-around;
    padding: 8px 0;
  }
  
  .row-label {
    font-size: 0.8rem;
    color: #666;
    text-align: center;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .cell {
    background-color: white;
    min-height: 50px;
    transition: transform 0.2s ease, background-color 0.3s ease;
    overflow: hidden;
  }
  
  .cell:hover {
    transform: scale(1.02);
  }
  
  .cell.exploding {
    background-color: rgba(255, 247, 237, 0.8);
  }
  
  .explosion-overlay {
    background: radial-gradient(circle, rgba(255,165,0,0.6) 0%, rgba(255,255,255,0) 70%);
    border-radius: 50%;
    z-index: 5;
    pointer-events: none;
  }
  
  .atom {
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  .atom:hover {
    transform: translate(-50%, -50%) scale(1.1);
  }
  
  /* Ripple effect when clicking cells */
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
</style>
