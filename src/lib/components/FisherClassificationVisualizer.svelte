<script>
  let step = $state(0);
  function next() { if(step < 3) step++; }
  function prev() { if(step > 0) step--; }
  
  const rawMatrix = [
    [200, 180, 50,  40],
    [190, 170, 60,  50],
    [100, 90,  150, 160],
    [80,  100, 140, 150]
  ];
</script>

<div class="fisher-visualizer">
  <div class="header">
    <h3>Fisher Classification Hash</h3>
    <div class="controls">
      <button onclick={prev} disabled={step === 0}>&larr; Prev</button>
      <span class="step-indicator">Step {step + 1} of 4</span>
      <button onclick={next} disabled={step === 3}>Next &rarr;</button>
    </div>
  </div>

  <p class="desc">
    {#if step === 0}
      <strong>Step 1: The Candidate Block.</strong> To avoid running heavy math on thousands of blocks, we need a way to instantly reject blocks that are obviously wrong.
    {:else if step === 1}
      <strong>Step 2: Split into Quadrants.</strong> We divide the 4x4 Domain block into four 2x2 quadrants.
    {:else if step === 2}
      <strong>Step 3: Sum Brightness.</strong> We sum the pixel values in each quadrant to get a rough measure of its overall brightness.
    {:else}
      <strong>Step 4: Rank & Hash.</strong> We rank the quadrants from brightest (1st) to darkest (4th). This generates a unique class hash (e.g., <code>1-4-3-2</code>). If the Target Range block doesn't have the exact same hash, we instantly reject this Domain block without doing any math!
    {/if}
  </p>

  <div class="workbench">
    <div class="block-container" class:split="{step >= 1}">
      
      <!-- Top Left Quadrant -->
      <div class="quadrant" class:summed="{step >= 2}">
        {#if step >= 2}
          <div class="sum-val">740</div>
          {#if step >= 3}<div class="rank badge-1">1st</div>{/if}
        {:else}
          <div class="row"><div class="c">{rawMatrix[0][0]}</div><div class="c">{rawMatrix[0][1]}</div></div>
          <div class="row"><div class="c">{rawMatrix[1][0]}</div><div class="c">{rawMatrix[1][1]}</div></div>
        {/if}
      </div>
      
      <!-- Top Right Quadrant -->
      <div class="quadrant" class:summed="{step >= 2}">
        {#if step >= 2}
          <div class="sum-val">200</div>
          {#if step >= 3}<div class="rank badge-4">4th</div>{/if}
        {:else}
          <div class="row"><div class="c">{rawMatrix[0][2]}</div><div class="c">{rawMatrix[0][3]}</div></div>
          <div class="row"><div class="c">{rawMatrix[1][2]}</div><div class="c">{rawMatrix[1][3]}</div></div>
        {/if}
      </div>
      
      <!-- Bottom Left Quadrant -->
      <div class="quadrant" class:summed="{step >= 2}">
        {#if step >= 2}
          <div class="sum-val">370</div>
          {#if step >= 3}<div class="rank badge-3">3rd</div>{/if}
        {:else}
          <div class="row"><div class="c">{rawMatrix[2][0]}</div><div class="c">{rawMatrix[2][1]}</div></div>
          <div class="row"><div class="c">{rawMatrix[3][0]}</div><div class="c">{rawMatrix[3][1]}</div></div>
        {/if}
      </div>
      
      <!-- Bottom Right Quadrant -->
      <div class="quadrant" class:summed="{step >= 2}">
        {#if step >= 2}
          <div class="sum-val">600</div>
          {#if step >= 3}<div class="rank badge-2">2nd</div>{/if}
        {:else}
          <div class="row"><div class="c">{rawMatrix[2][2]}</div><div class="c">{rawMatrix[2][3]}</div></div>
          <div class="row"><div class="c">{rawMatrix[3][2]}</div><div class="c">{rawMatrix[3][3]}</div></div>
        {/if}
      </div>
      
    </div>
    
    <div class="hash-wrapper" class:open="{step === 3}">
      <div class="hash-result">
        Class Hash: <span>1-4-3-2</span>
      </div>
    </div>
  </div>
</div>

<style>
  .fisher-visualizer { background: #111; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem 2rem; margin: 3rem 0; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
  .header h3 { margin: 0; font-size: 1.2rem; }
  
  .controls { display: flex; align-items: center; gap: 1rem; }
  button { background: #333; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.8rem; transition: background 0.2s; }
  button:disabled { opacity: 0.3; cursor: not-allowed; }
  button:not(:disabled):hover { background: #444; }
  .step-indicator { font-family: var(--font-mono); font-size: 0.8rem; color: var(--fg-muted); }
  
  .desc { font-size: 0.95rem; color: var(--fg-muted); line-height: 1.5; margin-bottom: 2rem; min-height: 70px; }
  .desc strong { color: var(--fg); }
  code { background: #222; padding: 0.2rem 0.4rem; border-radius: 4px; color: #3b82f6; }
  
  .workbench { display: flex; flex-direction: column; align-items: center; justify-content: center; background: #1a1a1a; padding: 2rem; border-radius: 8px; min-height: 320px; }
  
  .block-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 2px;
    background: #333;
    padding: 2px;
    border: 2px solid #444;
    border-radius: 4px;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .block-container.split { gap: 1rem; background: transparent; border-color: transparent; padding: 0; }
  
  .quadrant {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: #333;
    padding: 2px;
    position: relative;
    width: 80px; height: 80px;
    justify-content: center; align-items: center;
    border-radius: 4px;
  }
  
  .quadrant.summed { background: #252525; border: 1px solid #444; }
  
  .row { display: flex; gap: 2px; width: 100%; height: 100%; }
  .c { flex: 1; display: flex; align-items: center; justify-content: center; background: #222; color: #ccc; font-family: var(--font-mono); font-size: 0.8rem; border-radius: 2px; }
  
  .sum-val { font-size: 1.5rem; font-weight: bold; color: #fff; font-family: var(--font-mono); animation: fadeIn 0.3s; }
  @keyframes fadeIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
  
  .rank { position: absolute; top: -10px; right: -10px; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: bold; color: white; animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; z-index: 10; }
  @keyframes popIn { 0% { transform: scale(0); } 100% { transform: scale(1); } }
  
  .badge-1 { background: #3b82f6; }
  .badge-2 { background: #10b981; }
  .badge-3 { background: #f59e0b; }
  .badge-4 { background: #ef4444; }
  
  .hash-wrapper {
    max-height: 0;
    margin-top: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .hash-wrapper.open {
    max-height: 60px;
    margin-top: 2.5rem;
    opacity: 1;
  }
  
  .hash-result { font-size: 1.5rem; color: var(--fg-muted); font-weight: bold; }
  .hash-result span { color: #3b82f6; font-family: var(--font-mono); background: rgba(59,130,246,0.1); padding: 0.2rem 0.8rem; border-radius: 6px; }
</style>
