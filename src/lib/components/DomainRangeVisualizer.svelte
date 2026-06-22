<script>
  let step = $state(0);
  
  function next() { if (step < 6) step++; }
  function prev() { if (step > 0) step--; }
  
  // 6x6 Image Grid
  // Shifted so correct domain is at x=2, y=0.
  const imageGrid = [
    [140, 140,  100, 100, 180, 180],
    [140, 140,  100, 100, 180, 180],
    [140, 140,  60,  60,  100, 100],
    [140, 140,  60,  60,  100, 100],
    [140, 140,  140, 140, 120, 160],
    [140, 140,  140, 140, 100, 120]
  ];
  
  // Target Range Block (2x2)
  const R = [
    [120, 160],
    [100, 120]
  ];
  
  // Downsampled Domains at x=0, x=1, x=2
  const D_0 = [
    [140, 100],
    [140, 60]
  ];
  const D_1 = [
    [120, 140],
    [100, 80]
  ];
  const D_2 = [
    [100, 180],
    [60,  100]
  ];
  
  function getDomainGrid(s) {
    if (s === 1) return D_0;
    if (s === 2) return D_1;
    return D_2;
  }
</script>

<div class="dr-visualizer">
  <div class="header">
    <h3>Domain & Range Encoding</h3>
    <div class="controls">
      <button onclick={prev} disabled={step === 0}>&larr; Prev</button>
      <span class="step-indicator">Step {step + 1} of 7</span>
      <button onclick={next} disabled={step === 6}>Next &rarr;</button>
    </div>
  </div>

  <p class="desc">
    {#if step === 0}
      <strong>Step 1: The Target.</strong> We select a 2x2 <strong>Range Block (R)</strong> (highlighted in <span style="color:#3b82f6;font-weight:bold;">blue</span>). We want to encode these pixels without storing them directly.
    {:else if step === 1}
      <strong>Step 2: Searching (x=0).</strong> We start at the top-left, extract a 4x4 Domain Block (<span style="color:#ef4444;font-weight:bold;">red</span>), and downsample it to 2x2. The solver analytically finds the best contrast and brightness to make it match R, but the <strong>Mean Squared Error (MSE) is too high</strong>. The contrast shape is fundamentally wrong, so it is rejected.
    {:else if step === 2}
      <strong>Step 3: Iterating (x=1).</strong> The search window slides over by exactly 1 pixel and tests the next 4x4 Domain Block. It downsamples, solves the math, and calculates the MSE. The error is still above our strict limit. Rejected.
    {:else if step === 3}
      <strong>Step 4: Structural Match (x=2).</strong> The window slides again. This time, the downsampled Domain Block (<span style="color:#eab308;font-weight:bold;">yellow</span>) has the exact same structural contrast pattern (dark bottom-left, bright top-right) as our Target! The MSE drops to 0.
    {:else if step === 4}
      <strong>Step 5: Contrast (s).</strong> The solver calculated a contrast scaling factor of <strong>s = 0.5</strong>. We multiply all downsampled Domain pixels by 0.5, cutting the contrast in half.
    {:else if step === 5}
      <strong>Step 6: Brightness (o).</strong> The solver calculated a brightness offset of <strong>o = +70</strong>. We add 70 to every pixel in the Domain Block.
    {:else}
      <strong>Step 7: Encoding Success!</strong> The mathematically transformed Domain Block now perfectly matches the Range Block. We discard the raw pixels and store only the resulting equation: <code>[X=2, Y=0, s=0.5, o=70]</code>.
    {/if}
  </p>
  
  <div class="layout">
    <!-- Top: The Image Grid -->
    <div class="image-section">
      <h4>Image Grid (6x6)</h4>
      <div class="grid-6x6">
        {#each imageGrid as row}
          {#each row as val}
            <div class="cell" style="background: rgb({val},{val},{val}); color: {val < 128 ? '#fff' : '#000'}">
              {val}
            </div>
          {/each}
        {/each}
        
        <!-- Blue Range Highlight -->
        <div class="highlight blue-box"></div>
        
        <!-- Domain Highlight -->
        {#if step >= 1}
          <div class="highlight domain-box" class:db-x0="{step === 1}" class:db-x1="{step === 2}" class:db-x2="{step >= 3}"></div>
        {/if}
      </div>
    </div>
    
    <!-- Bottom: The Workbench -->
    <div class="workbench">
      
      <!-- Domain Workbench Panel Wrapper (Expands in Step 1) -->
      <div class="domain-wrapper" class:visible="{step >= 1}">
        <div class="panel domain-panel">
          <h4>
            {#if step === 1} Rejected<br>(Downsampled)
            {:else if step === 2} Rejected<br>(Downsampled)
            {:else if step === 3} Match<br>(Downsampled)
            {:else if step === 4} Domain &times; 0.5<br>&nbsp;
            {:else} Domain &times; 0.5<br>+ 70
            {/if}
          </h4>
          
          <div class="grid sg-2" class:red-border="{step <= 2}" class:yellow-border="{step >= 3}">
            {#each getDomainGrid(step) as row}
              {#each row as origVal}
                {@const val = step <= 3 ? origVal : (step === 4 ? origVal * 0.5 : origVal * 0.5 + 70)}
                <div class="cell sm" style="background: rgb({val},{val},{val}); color: {val < 128 ? '#fff' : '#000'}">{val}</div>
              {/each}
            {/each}
          </div>
        </div>
        
        <div class="math-operator-container">
          <div class="spacer"></div>
          <div class="math-operator">
            {#if step < 6}&ne;{:else}={/if}
          </div>
        </div>
      </div>
      
      <!-- Range Workbench Panel -->
      <div class="panel range-panel">
        <h4>Target Range<br>(2x2)</h4>
        <div class="grid sg-2 blue-border">
          {#each R as row}
            {#each row as val}
              <div class="cell sm" style="background: rgb({val},{val},{val}); color: {val < 128 ? '#fff' : '#000'}">{val}</div>
            {/each}
          {/each}
        </div>
      </div>
      
    </div>
  </div>
</div>

<style>
  .dr-visualizer {
    background: #111; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem 2rem; margin: 3rem 0;
  }
  
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
  .header h3 { margin: 0; font-size: 1.2rem; }
  
  .controls { display: flex; align-items: center; gap: 1rem; }
  button { background: #333; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.8rem; }
  button:disabled { opacity: 0.3; cursor: not-allowed; }
  button:not(:disabled):hover { background: #444; }
  
  .step-indicator { font-family: var(--font-mono); font-size: 0.8rem; color: var(--fg-muted); }
  
  .desc { font-size: 0.95rem; color: var(--fg-muted); line-height: 1.5; margin-bottom: 2rem; min-height: 80px; }
  .desc strong { color: var(--fg); }
  code { background: #222; padding: 0.2rem 0.4rem; border-radius: 4px; color: #3b82f6; }
  
  .layout { display: flex; flex-direction: column; align-items: center; gap: 3rem; }
  
  .image-section { display: flex; flex-direction: column; align-items: center; }
  .image-section h4 { margin: 0 0 1rem 0; color: var(--fg-muted); font-family: var(--font-mono); }
  
  .grid-6x6 {
    position: relative;
    display: grid;
    grid-template-columns: repeat(6, 40px);
    grid-template-rows: repeat(6, 40px);
    gap: 2px;
    background: #333;
    padding: 2px;
    border: 2px solid #444;
    border-radius: 4px;
  }
  
  .highlight {
    position: absolute;
    pointer-events: none;
    z-index: 10;
    box-sizing: border-box;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .blue-box {
    border: 3px solid #3b82f6;
    background: rgba(59, 130, 246, 0.2);
    /* Target at x=4, y=4. offset = 2px + 4*(42px) = 170px */
    top: 170px; left: 170px; width: 82px; height: 82px;
  }
  
  .domain-box {
    border: 3px solid;
    top: 2px; width: 166px; height: 166px;
  }
  
  .db-x0 { left: 2px; border-color: #ef4444; background: rgba(239, 68, 68, 0.2); }
  .db-x1 { left: 44px; border-color: #ef4444; background: rgba(239, 68, 68, 0.2); }
  .db-x2 { left: 86px; border-color: #eab308; background: rgba(234, 179, 8, 0.2); }
  
  .workbench {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 180px;
    background: #1a1a1a;
    padding: 2rem;
    border-radius: 8px;
    width: 100%;
    overflow-x: auto;
  }
  
  /* The sliding wrapper that pushes the Target Range to the right */
  .domain-wrapper {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 2rem;
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.5s ease;
    flex-shrink: 0;
  }
  
  .domain-wrapper.visible {
    max-width: 400px;
    opacity: 1;
    margin-right: 2rem; 
  }
  
  .panel { display: flex; flex-direction: column; align-items: center; width: 180px; flex-shrink: 0; min-width: 0; }
  .panel h4 { margin: 0 0 1rem 0; color: var(--fg-muted); font-family: var(--font-mono); font-size: 0.85rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; text-align: center; }
  
  .grid { display: grid; gap: 2px; background: #333; padding: 2px; border-radius: 4px; }
  .sg-2 { grid-template-columns: repeat(2, 60px); grid-template-rows: repeat(2, 60px); }
  
  .red-border { border: 3px solid #ef4444; transition: border-color 0.5s; }
  .yellow-border { border: 3px solid #eab308; transition: border-color 0.5s; }
  .blue-border { border: 3px solid #3b82f6; }
  
  .cell { display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.8rem; font-weight: bold; transition: all 0.5s ease; }
  .cell.sm { font-size: 0.85rem; }
  
  .math-operator-container { display: flex; flex-direction: column; height: 100%; }
  .spacer { height: 4rem; /* 3rem h4 + 1rem margin */ }
  .math-operator { display: flex; align-items: center; justify-content: center; height: 132px; font-size: 3rem; font-weight: bold; color: var(--fg-muted); width: 60px; flex-shrink: 0; }
  
  @media (max-width: 600px) {
    .dr-visualizer { padding: 1rem; margin: 1.5rem 0; }
    .layout { gap: 1.5rem; }
    .desc { min-height: auto; margin-bottom: 1rem; font-size: 0.85rem; }
    
    /* Scale down the 6x6 image grid to 30px cells */
    .grid-6x6 { grid-template-columns: repeat(6, 30px); grid-template-rows: repeat(6, 30px); }
    .blue-box { top: 130px; left: 130px; width: 62px; height: 62px; }
    .domain-box { top: 2px; width: 126px; height: 126px; }
    .db-x0 { left: 2px; }
    .db-x1 { left: 34px; }
    .db-x2 { left: 66px; }
    
    /* Keep Workbench Horizontal but scale down */
    .workbench { padding: 1rem; gap: 0.5rem; min-height: 120px; }
    .domain-wrapper { gap: 0.5rem; }
    /* Let the max-width safely expand to the natural size */
    .domain-wrapper.visible { max-width: 200px; margin-right: 0.5rem; }
    
    .panel { width: 100px; }
    .panel h4 { font-size: 0.75rem; height: 2rem; margin-bottom: 0.5rem; }
    .sg-2 { grid-template-columns: repeat(2, 40px); grid-template-rows: repeat(2, 40px); }
    
    .spacer { height: 2.5rem; }
    .math-operator { width: 40px; height: 92px; font-size: 1.5rem; }
    .cell.sm { font-size: 0.75rem; }
    .header h3 { font-size: 1rem; }
  }
</style>
