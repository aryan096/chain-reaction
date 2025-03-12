<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<div class="flex flex-col pt-12 md:pt-0 lg:pt-0 items-center justify-start md:justify-center lg:justify-center min-h-screen bg-gray-900">
  <h1 class="text-5xl font-bold text-white mb-10">Chain Rxn</h1>
  
  <div class="bg-gray-800 p-6 rounded-lg shadow-lg mb-10 w-11/12 md:w-2/3 lg:w-1/2">
    <h2 class="text-xl font-bold text-white mb-4">How to Play</h2>
    <ol class="list-decimal list-inside text-white text-sm space-y-2">
      <li><strong>Goal:</strong> Capture the entire board by eliminating all orbs of other players.</li>
      <li><strong>Turns:</strong> Players take turns placing orbs in cells of their color or empty cells.</li>
      <li><strong>Critical Mass:</strong> Each cell has a limit (2-4 orbs) based on its position. Corner cells have a limit of 2, edge cells have a limit of 3, and all others have a limit of 4.</li>
      <li><strong>Chain Reaction:</strong> When a cell exceeds its limit, it explodes, distributing orbs to adjacent cells. Explosions don't spread to diagonally adjacent cells. Oh also, explosions propagate!</li>
      <li><strong>Capture:</strong> When your orbs explode into an opponent's cell, you convert their orbs to your color.</li>
      <li><strong>Victory:</strong> The last player with orbs on the board wins!</li>
    </ol>
  </div>
  
  <div class="flex flex-col gap-6 w-64">
    <button 
      class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition hover:scale-105"
      on:click={() => goto('/create')}
    >
      Create Game
    </button>
    
    <button 
      class="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition hover:scale-105"
      on:click={() => goto('/join')}
    >
      Join Game
    </button>
  </div>
</div>
