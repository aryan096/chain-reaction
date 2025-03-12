<script lang="ts">
  import type { Player } from '$lib/types';
  
  export let players: Player[] = [];
  export let currentPlayer: Player | null = null;
  
  $: sortedPlayers = [...players].sort((a, b) => a.order - b.order);
</script>

<div class="bg-gray-50 rounded-lg p-4">
  <h3 class="font-bold mb-3 text-lg">Players</h3>
  
  <div class="space-y-2">
    {#each sortedPlayers as player}
      <div class="flex items-center justify-between p-2 rounded {player.id === currentPlayer?.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white'} {player.isEliminated ? 'opacity-50' : ''}">
        <div class="flex items-center">
          <div class="w-4 h-4 rounded-full mr-2" style="background-color: {player.color}"></div>
          <span class="font-medium">{player.name} {player.isEliminated ? '(Eliminated)' : ''}</span>
        </div>
        <div class="text-sm text-gray-500">
          {player.cellCount || 0} cells
        </div>
      </div>
    {/each}
  </div>
</div>
