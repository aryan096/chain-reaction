<script lang="ts">
	import '../app.css';
	import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
	
	let { children } = $props();
</script>

{@render children()}
<ConnectionStatus />
