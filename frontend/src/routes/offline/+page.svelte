<script>
  import Chess from "$lib/chess-engine/chess";
  import Board from "$lib/components/Board.svelte";
  let chess = new Chess({});
</script>

<div class="board-full">
  <Board {chess} flip={false} />
</div>
