<script lang="ts">
  import { goto } from '$app/navigation';
  import { joinGame } from '$lib/gameService';
  
  let gameCode = '';
  let errorMessage = '';
  
  async function handleJoinGame(): Promise<void> {
    try {
      await joinGame(gameCode);
      goto(`/lobby/${gameCode}`);
    } catch (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'An unknown error occurred';
      }
    }
  }
</script>

<div class="flex flex-col pt-12 md:pt-0 lg:pt-0 items-center justify-start md:justify-center lg:justify-center min-h-screen bg-gray-900">
  <h1 class="text-4xl font-bold text-white mb-8">Join Game</h1>
  
  <div class="bg-white p-8 rounded-lg shadow-lg w-96">
    <div class="mb-6">
      <label class="block text-gray-700 font-bold mb-2" for="game-code">
        Game Code
      </label>
      <input 
        id="game-code" 
        type="text" 
        bind:value={gameCode}
        placeholder="Enter game code"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {#if errorMessage}
        <p class="text-red-500 text-sm mt-1">{errorMessage}</p>
      {/if}
    </div>
    
    <div class="flex justify-between">
      <button 
        class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
        on:click={() => goto('/')}
      >
        Back
      </button>
      
      <button 
        class="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded"
        on:click={handleJoinGame}
        disabled={!gameCode}
      >
        Join Game
      </button>
    </div>
  </div>
</div>
