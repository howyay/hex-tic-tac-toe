<script lang="ts">
  let { totalMoves }: { totalMoves: number } = $props();
</script>

<div class="move-counter">Move {totalMoves}</div>

<style>
  .move-counter {
    position: absolute;
    bottom: 16px;
    right: 16px;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.6);
    z-index: 10;
    font-family: system-ui, -apple-system, sans-serif;
    pointer-events: none;
    user-select: none;
  }
</style>
