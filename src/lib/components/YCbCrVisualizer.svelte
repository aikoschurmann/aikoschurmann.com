<script>
  let step = $state(0);
  function next() { if(step < 3) step++; }
  function prev() { if(step > 0) step--; }
  
  // Y channel: high structure (sharp edge)
  const Y = [
    [200, 200,  50,  50],
    [200, 200,  50,  50],
    [50,   50, 200, 200],
    [50,   50, 200, 200]
  ];
  
  // Cb channel: blurry/flat (blue-yellow difference)
  const Cb = [
    [160, 155, 150, 145],
    [155, 150, 145, 140],
    [150, 145, 140, 135],
    [145, 140, 135, 130]
  ];
  
  // Cr channel: blurry/flat (red-green difference)
  const Cr = [
    [100, 105, 110, 115],
    [105, 110, 115, 120],
    [110, 115, 120, 125],
    [115, 120, 125, 130]
  ];

  function clamp(val) { return Math.max(0, Math.min(255, val)); }

  // True RGB conversion for the composite step
  function getRGB(x, y) {
    const yVal = Y[y][x];
    const cbVal = Cb[y][x] - 128;
    const crVal = Cr[y][x] - 128;
    
    const r = clamp(yVal + 1.402 * crVal);
    const g = clamp(yVal - 0.344136 * cbVal - 0.714136 * crVal);
    const b = clamp(yVal + 1.772 * cbVal);
    return `rgb(${r}, ${g}, ${b})`;
  }
</script>

<div class="ycbcr-visualizer">
  <div class="header">
    <h3>The YCbCr Color Trick</h3>
    <div class="controls">
      <button onclick={prev} disabled={step === 0}>&larr; Prev</button>
      <span class="step-indicator">Step {step + 1} of 4</span>
      <button onclick={next} disabled={step === 3}>Next &rarr;</button>
    </div>
  </div>

  <p class="desc">
    {#if step === 0}
      <strong>Step 1: RGB is Slow.</strong> This is our raw RGB image block. Compressing it naively means running the insanely heavy $O(N^4)$ Quadtree search three separate times (once for Red, Green, and Blue). This is a massive waste of time.
    {:else if step === 1}
      <strong>Step 2: Color Space Conversion.</strong> We mathematically convert the RGB block into the <strong>YCbCr</strong> space. This separates it into <strong>Y (Luma/Brightness)</strong>, and <strong>Cb/Cr (Chroma/Color)</strong>. Notice how almost all the sharp structural detail is isolated in the Y channel!
    {:else if step === 2}
      <strong>Step 3: Process Luma.</strong> The human eye is far more sensitive to structural brightness than to color. Therefore, we run the extremely expensive Quadtree search <em>exclusively</em> on the Y channel.
    {:else}
      <strong>Step 4: Free Color!</strong> Once we find the perfect structural equations for the Y channel, we lock them in. We blindly copy those exact same equations to the Cb and Cr channels. We get full color compression with absolutely zero extra mathematical searching!
    {/if}
  </p>

  <div class="workbench">
    <div class="stage">
      
      <!-- Cb Channel -->
      <div class="layer cb-layer" class:spread="{step >= 1}">
        <h4>Cb (Blue Diff)</h4>
        <div class="pixel-grid">
          {#each Cb as row, y}
            {#each row as val, x}
              <!-- Visualize Cb by keeping Y=128 and Cr=128 -->
              <div class="cell" style="background: rgb({clamp(128)}, {clamp(128 - 0.344136*(val-128))}, {clamp(128 + 1.772*(val-128))})"></div>
            {/each}
          {/each}
        </div>
      </div>

      <!-- Cr Channel -->
      <div class="layer cr-layer" class:spread="{step >= 1}">
        <h4>Cr (Red Diff)</h4>
        <div class="pixel-grid">
          {#each Cr as row, y}
            {#each row as val, x}
              <!-- Visualize Cr by keeping Y=128 and Cb=128 -->
              <div class="cell" style="background: rgb({clamp(128 + 1.402*(val-128))}, {clamp(128 - 0.714136*(val-128))}, {clamp(128)})"></div>
            {/each}
          {/each}
        </div>
      </div>

      <!-- Y Channel / RGB Composite -->
      <div class="layer y-layer" class:spread="{step >= 1}">
        <h4>{#if step === 0}RGB Image{:else}Y (Luma){/if}</h4>
        <div class="pixel-grid" class:scanning="{step === 2}">
          {#each Y as row, y}
            {#each row as val, x}
              <div class="cell" style="background: {step === 0 ? getRGB(x, y) : `rgb(${val},${val},${val})`}"></div>
            {/each}
          {/each}
          
          {#if step >= 2}
            <!-- The Master Y Grid -->
            <div class="qt-overlay" class:locked="{step === 3}">
              <div class="qc"></div><div class="qc"></div><div class="qc"></div><div class="qc"></div>
            </div>
          {/if}
          
          {#if step === 3}
            <!-- The Cloned Grids that physically fly to the other channels -->
            <div class="qt-overlay flying-left">
              <div class="qc color-shift"></div><div class="qc color-shift"></div><div class="qc color-shift"></div><div class="qc color-shift"></div>
            </div>
            <div class="qt-overlay flying-right">
              <div class="qc color-shift"></div><div class="qc color-shift"></div><div class="qc color-shift"></div><div class="qc color-shift"></div>
            </div>
          {/if}
        </div>
      </div>
      
    </div>
  </div>
</div>

<style>
  .ycbcr-visualizer { background: #111; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem 2rem; margin: 3rem 0; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
  .header h3 { margin: 0; font-size: 1.2rem; }
  
  .controls { display: flex; align-items: center; gap: 1rem; }
  button { background: #333; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.8rem; transition: background 0.2s; }
  button:disabled { opacity: 0.3; cursor: not-allowed; }
  button:not(:disabled):hover { background: #444; }
  .step-indicator { font-family: var(--font-mono); font-size: 0.8rem; color: var(--fg-muted); }
  
  .desc { font-size: 0.95rem; color: var(--fg-muted); line-height: 1.5; margin-bottom: 2rem; min-height: 80px; }
  .desc strong { color: var(--fg); }
  
  .workbench { display: flex; justify-content: center; align-items: center; background: #1a1a1a; padding: 3rem 1rem; border-radius: 8px; min-height: 300px; overflow: hidden; }
  
  .stage { position: relative; width: 120px; height: 160px; display: flex; justify-content: center; }
  
  .layer {
    position: absolute;
    top: 0;
    display: flex; flex-direction: column; align-items: center;
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 10;
  }
  
  .layer h4 { margin: 0 0 1rem 0; font-family: var(--font-mono); font-size: 0.85rem; color: var(--fg-muted); transition: opacity 0.3s; }
  
  .cb-layer { z-index: 5; opacity: 0; }
  .cr-layer { z-index: 5; opacity: 0; }
  
  /* The Spread Animation */
  .cb-layer.spread { transform: translateX(-160px); opacity: 1; }
  .cr-layer.spread { transform: translateX(160px); opacity: 1; }
  .y-layer.spread { transform: translateX(0); z-index: 20; }
  
  .pixel-grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, 30px);
    grid-template-rows: repeat(4, 30px);
    gap: 1px;
    background: #444;
    padding: 2px;
    border: 2px solid #555;
    border-radius: 4px;
    transition: all 0.3s ease;
  }
  
  .cell { width: 30px; height: 30px; transition: background 0.5s; }
  
  .scanning { border-color: #eab308; }
  
  .qt-overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;
    pointer-events: none;
  }
  
  .qc { border: 2px dashed rgba(234, 179, 8, 0.8); }
  .qt-overlay.locked .qc { border: 2px solid #22c55e; }
  
  /* Flying Animations */
  .flying-left { animation: flyLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; z-index: 30; }
  .flying-right { animation: flyRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; z-index: 30; }
  
  .color-shift { border: 2px solid #22c55e; animation: shiftColor 0.5s forwards; }
  
  @keyframes flyLeft {
    0% { transform: translateX(0); }
    100% { transform: translateX(-160px); }
  }
  
  @keyframes flyRight {
    0% { transform: translateX(0); }
    100% { transform: translateX(160px); }
  }
  
  @keyframes shiftColor {
    100% { border-color: #3b82f6; }
  }
  
  @media (max-width: 600px) {
    .cb-layer.spread { transform: translateX(-100px); }
    .cr-layer.spread { transform: translateX(100px); }
    .pixel-grid { grid-template-columns: repeat(4, 20px); grid-template-rows: repeat(4, 20px); }
    .cell { width: 20px; height: 20px; }
    
    @keyframes flyLeft { 100% { transform: translateX(-100px); } }
    @keyframes flyRight { 100% { transform: translateX(100px); } }
  }
</style>
