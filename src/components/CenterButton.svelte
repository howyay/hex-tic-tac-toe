<script lang="ts">
  let { onclick }: { onclick: () => void } = $props();
</script>

<button class="center-button" {onclick} title="Center on stones">
  ⊕
</button>

<style>
  .center-button {
    position: absolute;
    bottom: 16px;
    right: 16px;
    z-index: 10;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: var(--color-overlay-bg);
    color: var(--color-text);
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .center-button:hover {
    background: var(--color-button-bg);
    color: var(--color-button-text);
  }
</style>
