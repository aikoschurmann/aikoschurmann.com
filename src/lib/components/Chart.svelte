<script lang="ts">
  let { title = "Metabolic Efficiency", data = [30, 45, 62, 85, 70, 90, 55] } = $props();
</script>

<div class="chart-container">
  {#if title}
    <div class="chart-title">{title}</div>
  {/if}
  <div class="bars">
    {#each data as value}
      <div class="bar-wrapper">
        <div class="bar" style="height: {value}%"></div>
      </div>
    {/each}
  </div>
</div>

<style>
  .chart-container {
    background: #111;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 2rem;
    margin: 3rem 0;
  }
  .chart-title {
    font-family: ui-monospace, monospace;
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 2rem;
    text-align: center;
  }
  .bars {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: 150px;
    gap: 8px;
  }
  .bar-wrapper {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: flex-end;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 4px;
  }
  .bar {
    width: 100%;
    background: var(--accent);
    border-radius: 4px;
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }
  .bar:hover {
    opacity: 1;
  }
</style>
