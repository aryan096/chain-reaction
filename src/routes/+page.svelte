<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-purple-900">
  <h1 class="text-6xl font-bold text-white mb-10">Chain Reaction</h1>
  
  <div class="flex flex-col gap-6 w-64">
    <button 
      class="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition hover:scale-105"
      on:click={() => goto('/create')}
    >
      Create Game
    </button>
    
    <button 
      class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition hover:scale-105"
      on:click={() => goto('/join')}
    >
      Join Game
    </button>
  </div>
</div>
