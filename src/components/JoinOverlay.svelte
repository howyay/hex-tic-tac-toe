<script lang="ts">
  let {
    onJoin,
    status,
    error,
    onBack,
  }: {
    onJoin: () => void;
    status: 'ready' | 'connecting' | 'error';
    error?: string;
    onBack?: () => void;
  } = $props();
</script>

<div class="join-overlay">
  <div class="heading">Join Game</div>

  {#if status === 'ready'}
    <button class="join-button" onclick={onJoin}>Join Game</button>
  {:else if status === 'connecting'}
    <button class="join-button disabled">Connecting...</button>
  {:else if status === 'error'}
    <div class="error-text">{error ?? 'Game not found. The host may have left.'}</div>
    {#if onBack}
      <button class="back-button" onclick={onBack}>Back</button>
    {/if}
  {/if}
</div>

<style>
  .join-overlay {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: var(--color-gameover-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .heading {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-text);
    font-family: system-ui, -apple-system, sans-serif;
  }

  .join-button {
    margin-top: 16px;
    font-size: 16px;
    font-weight: 600;
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--color-button-bg);
    color: var(--color-button-text);
    border: none;
    border-radius: 4px;
    padding: 8px 24px;
    min-height: 44px;
    cursor: pointer;
  }

  .join-button:hover {
    background: var(--color-button-hover);
  }

  .join-button.disabled {
    pointer-events: none;
    opacity: 0.6;
  }

  .error-text {
    margin-top: 16px;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-status-disconnected);
    font-family: system-ui, -apple-system, sans-serif;
    text-align: center;
    max-width: 300px;
  }

  .back-button {
    margin-top: 8px;
    font-size: 16px;
    font-weight: 400;
    font-family: system-ui, -apple-system, sans-serif;
    color: var(--color-text-muted);
    text-decoration: underline;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
  }
</style>
