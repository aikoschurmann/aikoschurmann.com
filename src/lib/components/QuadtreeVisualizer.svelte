<script>
  let step = $state(0);
  function next() { if(step < 5) step++; }
  function prev() { if(step > 0) step--; }
  
  // 8x8 Original Image: Flat white (255) with a sharp black diagonal (0) in the bottom right 4x4
  const imageGrid = Array(8).fill(0).map((_, y) => 
    Array(8).fill(0).map((_, x) => {
      if (x >= 4 && y >= 4 && x === y) return 0;
      return 255;
    })
  );
</script>

<div class="quadtree-visualizer">
  <div class="header">
    <h3>Adaptive Quadtree Splitting</h3>
    <div class="controls">
      <button onclick={prev} disabled={step === 0}>&larr; Prev</button>
      <span class="step-indicator">Step {step + 1} of 6</span>
      <button onclick={next} disabled={step === 5}>Next &rarr;</button>
    </div>
  </div>

  <p class="desc">
    {#if step === 0}
      <strong>Step 1: The Maximum Block Size.</strong> The compressor starts by evaluating a large 8x8 Range block (<span style="color:#3b82f6;font-weight:bold;">blue</span>). Because this large area contains both perfectly flat white pixels and a sharp black line, the contrast is too complex. No Domain block in the image can match it, so the Error is too high!
    {:else if step === 1}
      <strong>Step 2: Split to 4x4.</strong> The Quadtree algorithm dynamically splits the failing 8x8 block into four smaller 4x4 Target blocks.
    {:else if step === 2}
      <strong>Step 3: Flat Areas Succeed.</strong> The algorithm searches for matches for the first three 4x4 blocks. Because they contain purely flat white pixels, they easily find perfect matches! They lock in (<span style="color:#22c55e;font-weight:bold;">green</span>).
    {:else if step === 3}
      <strong>Step 4: Edge Area Fails.</strong> The algorithm tests the bottom-right 4x4 block. It contains the sharp black diagonal line. Even at 4x4, it's too complex to find a match. The Error is still too high (<span style="color:#ef4444;font-weight:bold;">red</span>).
    {:else if step === 4}
      <strong>Step 5: Split to 2x2.</strong> The Quadtree dynamically splits ONLY the failing 4x4 block into four tiny 2x2 Target blocks. The flat areas remain locked at 4x4.
    {:else}
      <strong>Step 6: Detail Preserved!</strong> These tiny 2x2 blocks successfully find matches. The compressor has adaptively spent huge, cheap equations on the flat areas, and tiny, expensive equations on the sharp details, keeping file size microscopic!
    {/if}
  </p>

  <div class="workbench">
    <div class="image-section">
      <h4>Image Grid (8x8)</h4>
      <div class="grid-8x8">
        <!-- Render the Pixels -->
        {#each imageGrid as row, y}
          {#each row as val, x}
            <div class="cell" style="grid-column: {x + 1}; grid-row: {y + 1}; background: rgb({val},{val},{val}); color: {val < 128 ? '#fff' : '#000'}">
              {val}
            </div>
          {/each}
        {/each}
        
        <!-- Quadtree Overlays via CSS Grid Positioning -->
        
        {#if step === 0}
          <div class="highlight blue-box" style="grid-column: 1 / 9; grid-row: 1 / 9;"></div>
        {/if}
        
        {#if step >= 1}
          <!-- Top Left 4x4 -->
          <div class="highlight {step >= 2 ? 'green-box' : 'blue-box'}" style="grid-column: 1 / 5; grid-row: 1 / 5;"></div>
          <!-- Top Right 4x4 -->
          <div class="highlight {step >= 2 ? 'green-box' : 'blue-box'}" style="grid-column: 5 / 9; grid-row: 1 / 5;"></div>
          <!-- Bottom Left 4x4 -->
          <div class="highlight {step >= 2 ? 'green-box' : 'blue-box'}" style="grid-column: 1 / 5; grid-row: 5 / 9;"></div>
          
          <!-- Bottom Right 4x4 -->
          {#if step <= 3}
            <div class="highlight {step === 3 ? 'red-box pulse' : 'blue-box'}" style="grid-column: 5 / 9; grid-row: 5 / 9;"></div>
          {:else}
            <!-- Split into four 2x2 -->
            <!-- BR-TL -->
            <div class="highlight {step === 5 ? 'green-box' : 'blue-box'}" style="grid-column: 5 / 7; grid-row: 5 / 7;"></div>
            <!-- BR-TR -->
            <div class="highlight {step === 5 ? 'green-box' : 'blue-box'}" style="grid-column: 7 / 9; grid-row: 5 / 7;"></div>
            <!-- BR-BL -->
            <div class="highlight {step === 5 ? 'green-box' : 'blue-box'}" style="grid-column: 5 / 7; grid-row: 7 / 9;"></div>
            <!-- BR-BR -->
            <div class="highlight {step === 5 ? 'green-box' : 'blue-box'}" style="grid-column: 7 / 9; grid-row: 7 / 9;"></div>
          {/if}
        {/if}
        
      </div>
    </div>
  </div>
</div>

<style>
  .quadtree-visualizer { background: #111; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem 2rem; margin: 3rem 0; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
  .header h3 { margin: 0; font-size: 1.2rem; }
  
  .controls { display: flex; align-items: center; gap: 1rem; }
  button { background: #333; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.8rem; transition: background 0.2s; }
  button:disabled { opacity: 0.3; cursor: not-allowed; }
  button:not(:disabled):hover { background: #444; }
  .step-indicator { font-family: var(--font-mono); font-size: 0.8rem; color: var(--fg-muted); }
  
  .desc { font-size: 0.95rem; color: var(--fg-muted); line-height: 1.5; margin-bottom: 2rem; min-height: 80px; }
  .desc strong { color: var(--fg); }
  
  .workbench { display: flex; justify-content: center; align-items: center; background: #1a1a1a; padding: 2rem; border-radius: 8px; overflow-x: auto; }
  
  .image-section { display: flex; flex-direction: column; align-items: center; }
  h4 { margin: 0 0 1rem 0; font-family: var(--font-mono); font-size: 0.9rem; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 1px; }
  
  .grid-8x8 {
    position: relative;
    display: grid;
    grid-template-columns: repeat(8, 40px);
    grid-template-rows: repeat(8, 40px);
    gap: 2px;
    background: #333;
    padding: 2px;
    border: 2px solid #555;
    border-radius: 6px;
  }
  
  .cell {
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-size: 0.75rem; font-weight: bold;
    border-radius: 2px;
    transition: all 0.3s ease;
  }
  
  .highlight {
    box-sizing: border-box;
    border: 3px solid transparent;
    z-index: 10;
    pointer-events: none;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .blue-box { border-color: #3b82f6; background: rgba(59, 130, 246, 0.2); }
  .green-box { border-color: #22c55e; background: rgba(34, 197, 94, 0.2); }
  .red-box { border-color: #ef4444; background: rgba(239, 68, 68, 0.2); }
  
  .pulse { animation: pulseRed 1s infinite alternate; }
  @keyframes pulseRed {
    from { box-shadow: inset 0 0 0 2px rgba(239,68,68,0); }
    to { box-shadow: inset 0 0 0 4px rgba(239,68,68,0.5); }
  }
  
  @media (max-width: 600px) {
    .grid-8x8 { grid-template-columns: repeat(8, 30px); grid-template-rows: repeat(8, 30px); }
    .cell { font-size: 0.6rem; }
  }
</style>
