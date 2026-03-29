<script lang="ts">
  let {
    attempt,
    maxAttempts,
    onCancel,
    failed = false,
    onBack,
  }: {
    attempt: number;
    maxAttempts: number;
    onCancel: () => void;
    failed?: boolean;
    onBack: () => void;
  } = $props();

  let showConfirm = $state(false);

  function handleCancel() {
    showConfirm = true;
  }

  function confirmLeave() {
    showConfirm = false;
    onCancel();
    onBack();
  }

  function confirmStay() {
    showConfirm = false;
  }
</script>

<div class="reconnect-overlay">
  {#if showConfirm}
    <div class="confirm-text">Leave game? Your progress will be lost.</div>
    <div class="confirm-buttons">
      <button class="leave-button" onclick={confirmLeave}>Leave</button>
      <button class="stay-button" onclick={confirmStay}>Stay</button>
    </div>
  {:else if failed}
    <div class="heading">Could not reconnect</div>
    <div class="subtext">The host may have left the game.</div>
    <button class="back-button" onclick={onBack}>Back to menu</button>
  {:else}
    <div class="heading">Connection lost</div>
    <div class="subtext">Reconnecting... Attempt {attempt} of {maxAttempts}</div>
    <div class="pulse-dot"></div>
    <button class="cancel-button" onclick={handleCancel}>Cancel</button>
  {/if}
</div>

<style>
  .reconnect-overlay {
    position: absolute;
    inset: 0;
    z-index: 25;
    background: var(--color-gameover-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .heading {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-text);
    font-family: system-ui, -apple-system, sans-serif;
  }

  .subtext {
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-text-muted);
    font-family: system-ui, -apple-system, sans-serif;
  }

  .confirm-text {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--color-text);
    font-family: system-ui, -apple-system, sans-serif;
    text-align: center;
    max-width: 280px;
  }

  .confirm-buttons {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .leave-button {
    font-size: 16px;
    font-weight: 600;
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--color-status-disconnected);
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 8px 24px;
    min-height: 44px;
    cursor: pointer;
  }

  .stay-button {
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

  .cancel-button {
    font-size: 16px;
    font-weight: 400;
    font-family: system-ui, -apple-system, sans-serif;
    color: var(--color-text-muted);
    text-decoration: underline;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    margin-top: 8px;
  }

  .back-button {
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

  .back-button:hover, .stay-button:hover {
    background: var(--color-button-hover);
  }

  .pulse-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-status-connecting);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
</style>
