<script lang="ts">
  let { status }: { status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting' } = $props();

  const statusConfig = {
    connected:    { cssVar: 'var(--color-status-connected)', text: 'Connected', pulse: false },
    connecting:   { cssVar: 'var(--color-status-connecting)', text: 'Connecting...', pulse: true },
    disconnected: { cssVar: 'var(--color-status-disconnected)', text: 'Disconnected', pulse: false },
    reconnecting: { cssVar: 'var(--color-status-connecting)', text: 'Reconnecting...', pulse: true },
  };

  const config = $derived(statusConfig[status]);
</script>

<div class="connection-status">
  <span
    class="dot"
    class:pulse={config.pulse}
    style:background-color={config.cssVar}
  ></span>
  <span class="label">{config.text}</span>
</div>

<style>
  .connection-status {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 10;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    pointer-events: none;
    user-select: none;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dot.pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }

  .label {
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-text-muted);
    font-family: system-ui, -apple-system, sans-serif;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
