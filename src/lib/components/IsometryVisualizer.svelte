<script>
  const matrix = [
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 1, 0, 0],
    [1, 0, 0, 0]
  ];

  const isometries = [
    { name: "0: Identity", transform: "none" },
    { name: "1: Rotate 90°", transform: "rotate(90deg)" },
    { name: "2: Rotate 180°", transform: "rotate(180deg)" },
    { name: "3: Rotate 270°", transform: "rotate(270deg)" },
    { name: "4: Flip Horizontal", transform: "scaleX(-1)" },
    { name: "5: Flip Vertical", transform: "scaleY(-1)" },
    { name: "6: Reflect Main Diag", transform: "scaleX(-1) rotate(-90deg)" },
    { name: "7: Reflect Anti-Diag", transform: "scaleX(-1) rotate(90deg)" }
  ];
</script>

<div class="isometry-visualizer">
  <div class="desc">
    <strong>The 8 Isometries.</strong> To maximize our chances of finding a mathematical match, we don't just test the Domain Block as-is. We test it in all 8 geometric orientations.
  </div>
  
  <div class="grid-container">
    {#each isometries as iso}
      <div class="iso-card">
        <!-- The visual grid -->
        <div class="matrix-wrapper" style="transform: {iso.transform}">
          <div class="grid-4x4">
            {#each matrix as row}
              {#each row as val}
                <div class="cell" class:filled="{val === 1}"></div>
              {/each}
            {/each}
          </div>
        </div>
        <!-- Label stays upright -->
        <div class="name">{iso.name}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .isometry-visualizer {
    background: #111;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem 2rem;
    margin: 2rem 0;
  }
  
  .desc {
    font-size: 0.95rem;
    color: var(--fg-muted);
    line-height: 1.5;
    margin-bottom: 2rem;
  }
  
  .desc strong {
    color: var(--fg);
  }
  
  .grid-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }
  
  .iso-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #1a1a1a;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #333;
  }
  
  .matrix-wrapper {
    /* We apply the CSS transform here so the grid rotates/flips */
    transition: transform 0.3s ease;
    margin-bottom: 1rem;
  }
  
  .grid-4x4 {
    display: grid;
    grid-template-columns: repeat(4, 20px);
    grid-template-rows: repeat(4, 20px);
    gap: 2px;
    background: #444;
    padding: 2px;
    border: 1px solid #555;
    border-radius: 4px;
  }
  
  .cell {
    width: 20px;
    height: 20px;
    background: #222;
    border-radius: 2px;
  }
  
  .cell.filled {
    background: #3b82f6; /* Blue */
    box-shadow: 0 0 4px rgba(59, 130, 246, 0.5);
  }
  
  .name {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--fg-muted);
    text-align: center;
  }
  
  @media (max-width: 800px) {
    .grid-container {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 400px) {
    .isometry-visualizer {
      padding: 1rem;
    }
    .grid-container {
      gap: 1rem;
    }
  }
</style>
