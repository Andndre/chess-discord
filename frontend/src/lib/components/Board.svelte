<script lang="ts">
  import { PieceType } from "$lib/chess-engine/piece";
  import type Chess from "$lib/chess-engine/chess";
  import * as Rendering from "$lib/chess-engine/renderingHelpers";

  // external
  export let chess: Chess;
  export let flip: boolean;

  $: boardOffsets = flip
    ? Rendering.twoDimensionalOffsetFlipped
    : Rendering.twoDimensionalOffset;

  // internal
  let promoteOffset = -1;
  const promoteTypes = [
    [PieceType.QUEEN, PieceType.BISHOP],
    [PieceType.KNIGHT, PieceType.ROOK],
  ];
</script>

<div class="container">
  <div class="board">
    {#each boardOffsets as row}
      <div class="row">
        {#each row as offset}
          {#if offset === promoteOffset}
            <div class="cell">
              {#each promoteTypes as pRow}
                <div class="promote">
                  {#each pRow as type}
                    <button
                      style="background: {Rendering.getTileBackgroundColor(
                        offset
                      )};"
                      on:click={() => {
                        chess.promoteLastMoveTo(type);
                        chess.next();
                        promoteOffset = -1;
                        chess = chess;
                      }}
                    >
                      <img src="/{type}{chess.current}.png" alt="piece" />
                    </button>
                  {/each}
                </div>
              {/each}
            </div>
          {:else}
            <button
              on:click={() => {
                console.log("clicked");
                if (chess.clickTile(offset) === "move") {
                  if (chess.isPromote()) {
                    promoteOffset = offset;
                  } else {
                    chess.next();
                  }
                }
                chess = chess;
              }}
              class="cell"
              style="background: {Rendering.getTileBackgroundColor(offset)};"
            >
              <div
                class="overlay"
                style="background: {Rendering.getOverlayColor(offset, chess)};"
              >
                {#if chess.board[offset].type !== PieceType.NONE}
                  <img
                    src="/{chess.board[offset].type}{chess.board[offset]
                      .color}.png"
                    alt="piece"
                  />
                {/if}
              </div>
            </button>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }

  .board {
    max-width: 600px;
    width: calc(min(95vw, 95vh));
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
  }

  .row {
    display: flex;
    width: 100%;
    flex: 1;
  }

  .cell .promote {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    height: 100%;
  }

  .cell .promote button {
    aspect-ratio: 1 / 1;
    padding: 0;
    border: 0;
    height: 50%;
    flex: 1;
  }

  .cell {
    border: 0;
    flex: 1;
    width: 100%;
    aspect-ratio: 1 / 1;
    display: flex;
    padding: 0;
  }

  .cell img {
    width: 100%;
    aspect-ratio: 1 / 1;
  }

  .cell .overlay {
    width: 100%;
    height: 100%;
  }
</style>
