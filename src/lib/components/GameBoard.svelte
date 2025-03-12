<script lang="ts">
  import type { Cell, Player } from '$lib/types';
  
  export let grid: Cell[][] = [];
  export let gridSizeX: number = 6;
  export let gridSizeY: number = 6;
  export let onCellClick: (x: number, y: number) => void;
  export let currentPlayer: Player | null = null;
  export let isMyTurn: boolean = false;
  export let players: Player[] = [];
  
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
</script>

<div class="mb-4 text-center">
  {#if isMyTurn}
    <div class="bg-green-100 border-l-4 border-green-500 p-2">
      Your turn! Click a cell to make a move.
    </div>
  {:else if currentPlayer}
    <div class="bg-gray-100 border-l-4 border-gray-500 p-2">
      Waiting for {currentPlayer.name} to make a move...
    </div>
  {/if}
</div>

<div class="game-board" style="grid-template-columns: repeat({gridSizeX}, minmax(0, 1fr));">
  {#each Array(gridSizeY) as _, y}
    {#each Array(gridSizeX) as _, x}
      {@const cell = grid[x][y]}
      {@const maxAtoms = getMaxAtoms(x, y)}
      {@const playerColor = getPlayerColor(cell.player)}
      {@const isPlayable = isMyTurn && (!cell.player || cell.player === currentPlayer?.id)}
      
      <div 
        class="cell relative border border-gray-300 aspect-square rounded-sm flex items-center justify-center
              {isPlayable ? 'cursor-pointer hover:bg-blue-50' : 'cursor-not-allowed'}"
        on:click={() => isPlayable && onCellClick(x, y)}
      >
        {#if cell.count > 0}
          {#each getAtomPositions(cell.count, maxAtoms) as pos}
            <div 
              class="atom absolute rounded-full shadow-sm"
              style="
                background-color: {playerColor}; 
                width: 14px; 
                height: 14px;
                left: calc({pos.x} * 100%);
                top: calc({pos.y} * 100%);
                transform: translate(-50%, -50%);
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

<style>
  .game-board {
    display: grid;
    gap: 2px;
    background-color: #f9fafb;
    padding: 8px;
    border-radius: 8px;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
  }
  
  .cell {
    background-color: white;
    min-height: 50px;
  }
  
  .atom {
    transition: all 0.2s ease-in-out;
  }
</style>
