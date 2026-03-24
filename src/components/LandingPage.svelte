<script lang="ts">
  let { onLocalGame, onOnlineGame }: { onLocalGame: () => void; onOnlineGame: () => void } = $props();
</script>

<div class="landing-overlay">
  <div class="content">
    <h1 class="title">Hex Connect6</h1>
    <p class="tagline">Connect 6 on a hex grid</p>
    <p class="rules">X places 1 stone first, then players alternate placing 2. First to 6 in a row along any axis wins.</p>
    <div class="buttons">
      <button class="cta-button" onclick={onLocalGame}>Local Game</button>
      <button class="cta-button" onclick={onOnlineGame}>Online Game</button>
    </div>
  </div>
</div>

<style>
  .landing-overlay {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: var(--color-gameover-bg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content {
    max-width: 400px;
    width: 100%;
    padding: 0 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .title {
    font-size: 36px;
    font-weight: 600;
    line-height: 1.1;
    color: var(--color-text);
    font-family: system-ui, -apple-system, sans-serif;
    margin: 0 0 8px 0;
  }

  .tagline {
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-text-muted);
    font-family: system-ui, -apple-system, sans-serif;
    margin: 0 0 24px 0;
  }

  .rules {
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-text-muted);
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 320px;
    margin: 0 0 32px 0;
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  .cta-button {
    width: 100%;
    min-height: 44px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--color-button-bg);
    color: var(--color-button-text);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .cta-button:hover {
    background: var(--color-button-hover);
  }
</style>
