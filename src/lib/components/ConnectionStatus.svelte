<script lang="ts">
  import { connectionStatus } from '$lib/socketService';
  import { onMount } from 'svelte';
  
  // Debug mode to show more details
  export let debug = false;
  
  // Track recent WebSocket events for debugging
  let recentEvents: {type: string, time: Date}[] = [];
  const maxEvents = 5;
  
  onMount(() => {
    if (debug) {
      // Add event listener for WebSocket events
      const originalAddEventListener = WebSocket.prototype.addEventListener;
      WebSocket.prototype.addEventListener = function(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        const wrappedListener = function(this: WebSocket, event: Event) {
          if (type === 'message') {
            try {
              const messageEvent = event as MessageEvent;
              const data = JSON.parse(messageEvent.data as string);
              addEvent(data.type);
            } catch (e) {
              console.error('Error parsing WebSocket message:', e);
            }
          }
          if (typeof listener === 'function') {
            return listener.apply(this, [event]);
          }
          return undefined;
        };
        return originalAddEventListener.call(this, type, wrappedListener as EventListener, options);
      };
    }
  });
  
  function addEvent(type: string) {
    recentEvents = [{type, time: new Date()}, ...recentEvents.slice(0, maxEvents - 1)];
  }
  
  // Format timestamp for display
  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
</script>

{#if $connectionStatus !== 'connected' || debug}
  <div class="fixed bottom-4 right-4 px-3 py-1 rounded-full text-sm font-medium shadow-md z-50
    {$connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 
     $connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' : 
     'bg-red-100 text-red-800'}">
    
    {$connectionStatus === 'connected' ? 'Connected' : 
     $connectionStatus === 'connecting' ? 'Connecting...' : 
     'Disconnected'}
  </div>
  
  {#if debug && recentEvents.length > 0}
    <div class="fixed bottom-16 right-4 bg-white p-2 rounded shadow-md z-50 max-w-xs text-xs">
      <h4 class="font-bold mb-1">Recent WebSocket Events:</h4>
      <ul>
        {#each recentEvents as event}
          <li>{formatTime(event.time)} - {event.type}</li>
        {/each}
      </ul>
    </div>
  {/if}
{/if}
