<script lang="ts">
  import { goto } from '$app/navigation';
  import { createGame } from '$lib/gameService';
  import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
  
  let gridSizeX = 6;
  let gridSizeY = 6;
  let playerCount = 2;
  let isCreating = false;
  let errorMessage = '';
  
  async function handleCreateGame(): Promise<void> {
    try {
      isCreating = true;
      errorMessage = '';
      const gameCode = await createGame(gridSizeX, gridSizeY, playerCount);
      goto(`/lobby/${gameCode}`);
    } catch (error) {
      console.error('Failed to create game:', error);
      errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      isCreating = false;
    }
  }
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-purple-900">
  <h1 class="text-4xl font-bold text-white mb-8">Create Game</h1>
  
  <div class="bg-white p-8 rounded-lg shadow-lg w-96">
    <div class="mb-6">
      <label class="block text-gray-700 font-bold mb-2" for="grid-size">
        Grid Size
      </label>
      <div class="flex space-x-4">
        <div class="w-1/2">
          <input 
            id="grid-size-x" 
            type="range" 
            min="3" 
            max="12" 
            bind:value={gridSizeX}
            class="w-full"
          />
          <div class="text-center mt-1">{gridSizeX} columns</div>
        </div>
        <div class="w-1/2">
          <input 
            id="grid-size-y" 
            type="range" 
            min="3" 
            max="12" 
            bind:value={gridSizeY}
            class="w-full"
          />
          <div class="text-center mt-1">{gridSizeY} rows</div>
        </div>
      </div>
    </div>
    
    <div class="mb-8">
      <label class="block text-gray-700 font-bold mb-2" for="player-count">
        Number of Players
      </label>
      <input 
        id="player-count" 
        type="range" 
        min="2" 
        max="8" 
        bind:value={playerCount}
        class="w-full"
      />
      <div class="text-center mt-1">{playerCount} players</div>
    </div>
    
    {#if errorMessage}
      <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
        <p>{errorMessage}</p>
      </div>
    {/if}
    
    <div class="flex justify-between">
      <button 
        class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
        on:click={() => goto('/')}
        disabled={isCreating}
      >
        Back
      </button>
      
      <button 
        class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
        on:click={handleCreateGame}
        disabled={isCreating}
      >
        {#if isCreating}
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creating...
        {:else}
          Create Game
        {/if}
      </button>
    </div>
  </div>
  
  <ConnectionStatus debug={true} />
</div>
