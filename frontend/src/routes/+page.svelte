<script lang="ts">
  import Chess from "$lib/chess-engine/chess";
  import Board from "$lib/components/Board.svelte";
  const chess = new Chess();
</script>

<Board {chess} />
