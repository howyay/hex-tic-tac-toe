<script lang="ts">
  let { link, status }: { link: string; status: 'registering' | 'waiting' } = $props();

  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      onCopySuccess();
    } catch {
      // Fallback: textarea method
      const textarea = document.createElement('textarea');
      textarea.value = link;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      onCopySuccess();
    }
  }

  function onCopySuccess() {
    if (copyTimer) clearTimeout(copyTimer);
    copied = true;
    copyTimer = setTimeout(() => {
      copied = false;
      copyTimer = null;
    }, 2000);
  }
</script>

<div class="waiting-overlay">
  {#if status === 'registering'}
    <div class="heading">Connecting...</div>
  {:else}
    <div class="heading">Waiting for opponent...</div>
    <div class="link-display">{link}</div>
    <button
      class="copy-button"
      class:copied
      onclick={copyLink}
    >
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  {/if}
</div>

<style>
  .waiting-overlay {
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

  .link-display {
    margin-top: 16px;
    background: var(--color-overlay-bg);
    border-radius: 8px;
    padding: 12px 16px;
    font-family: monospace;
    font-size: 16px;
    color: var(--color-link-text);
    user-select: all;
    word-break: break-all;
  }

  .copy-button {
    margin-top: 8px;
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

  .copy-button:hover {
    background: var(--color-button-hover);
  }

  .copy-button.copied {
    color: var(--color-copy-success);
  }
</style>
