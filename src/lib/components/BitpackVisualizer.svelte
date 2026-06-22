<script>
  let step = $state(0);
  function next() { if (step < 3) step++; }
  function prev() { if (step > 0) step--; }
  
  const bytes = [
    // 0-11: Target
    { t: 'target', l: 'Tx' }, { t: 'target', l: 'Tx' }, { t: 'target', l: 'Tx' }, { t: 'target', l: 'Tx' },
    { t: 'target', l: 'Ty' }, { t: 'target', l: 'Ty' }, { t: 'target', l: 'Ty' }, { t: 'target', l: 'Ty' },
    { t: 'target', l: 'Sz' }, { t: 'target', l: 'Sz' }, { t: 'target', l: 'Sz' }, { t: 'target', l: 'Sz' },
    // 12-19: Source
    { t: 'source', l: 'Sx' }, { t: 'source', l: 'Sx' }, { t: 'source', l: 'Sx' }, { t: 'source', l: 'Sx' },
    { t: 'source', l: 'Sy' }, { t: 'source', l: 'Sy' }, { t: 'source', l: 'Sy' }, { t: 'source', l: 'Sy' },
    // 20-23: Iso
    { t: 'iso', l: 'Iso' }, { t: 'iso', l: 'Iso' }, { t: 'iso', l: 'Iso' }, { t: 'iso', l: 'Iso' },
    // 24-35: Math
    { t: 'math', l: 'M' }, { t: 'math', l: 'M' }, { t: 'math', l: 'M' }, { t: 'math', l: 'M' },
    { t: 'math', l: 'M' }, { t: 'math', l: 'M' }, { t: 'math', l: 'M' }, { t: 'math', l: 'M' },
    { t: 'math', l: 'M' }, { t: 'math', l: 'M' }, { t: 'math', l: 'M' }, { t: 'math', l: 'M' }
  ];

  function getState(i, currentStep) {
    let b = { ...bytes[i] };
    
    // Step 1: Target -> Flag
    if (currentStep >= 1) {
      if (i === 0) { b.t = 'flag'; b.l = 'F'; }
      else if (i >= 1 && i <= 11) return null;
    }
    
    // Step 2: Source -> dx/dy
    if (currentStep >= 2) {
      if (i === 12) { b.t = 'source'; b.l = 'dx'; }
      else if (i === 16) { b.t = 'source'; b.l = 'dy'; }
      else if (i > 12 && i < 20) return null;
    }
    
    // Step 3: Packing Iso and Math
    if (currentStep >= 3) {
      if (i === 0) { b.t = 'packed'; b.l = 'F+I'; }
      else if (i >= 20 && i <= 23) return null; // Iso deleted
      else if (i === 35) return null; // 1 math byte deleted to fit 14 bytes exactly
    }
    
    return b;
  }
  
  function getCount(currentStep) {
    return currentStep === 0 ? 36 : currentStep === 1 ? 25 : currentStep === 2 ? 19 : 14;
  }
</script>

<div class="bitpack-visualizer">
  <div class="header">
    <h3>The Bit-Packed FRC3 Format</h3>
    <div class="controls">
      <button onclick={prev} disabled={step === 0}>&larr; Prev</button>
      <span class="step-indicator">Step {step + 1} of 4</span>
      <button onclick={next} disabled={step === 3}>Next &rarr;</button>
    </div>
  </div>

  <p class="desc">
    {#if step === 0}
      <strong>Step 1: The Naive C-Struct.</strong> If we store all the variables as standard 32-bit integers, a single block takes 36 bytes of memory. Multiplied by tens of thousands of blocks, our file size will be massive!
    {:else if step === 1}
      <strong>Step 2: The Quadtree Traversal.</strong> A Quadtree splits exactly in half every time, making the grid perfectly predictable. We completely delete the 12 bytes storing Target X, Y, and Size. We replace them with a 1-byte "Flag". If the flag says "Split", the decoder subdivides the image. If it says "Leaf", the decoder already knows the exact X/Y/Size based purely on its current recursion depth!
    {:else if step === 2}
      <strong>Step 3: Relative Search Windows.</strong> Instead of storing absolute Source X/Y coordinates (4 bytes each), we only store the relative distance (<code>dx</code>, <code>dy</code>) from the target. Because our localized search window is small, they fit perfectly into 1-byte integers!
    {:else}
      <strong>Step 4: Final Bit-Packing.</strong> There are only 8 possible Isometry rotations, which requires exactly 3 bits. We delete the massive 4-byte Isometry integer and pack those 3 bits directly into the unused space of our 1-byte Tree Flag! The math variables are also clamped, resulting in exactly 14 bytes per block.
    {/if}
  </p>

  <div class="workbench">
    <div class="byte-grid">
      {#each bytes as _, i}
        {@const state = getState(i, step)}
        <div class="byte-wrapper {state ? 'visible' : 'hidden'}">
          <div class="byte-slot {state ? state.t : ''}">{state ? state.l : ''}</div>
        </div>
      {/each}
    </div>

    <div class="footer">
      <div class="total-badge" class:success="{step === 3}">
        Payload Size: {getCount(step)} Bytes
      </div>
    </div>
  </div>
</div>

<style>
  .bitpack-visualizer { background: #111; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem 2rem; margin: 3rem 0; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
  .header h3 { margin: 0; font-size: 1.2rem; }
  
  .controls { display: flex; align-items: center; gap: 1rem; }
  button { background: #333; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.8rem; transition: background 0.2s; }
  button:disabled { opacity: 0.3; cursor: not-allowed; }
  button:not(:disabled):hover { background: #444; }
  .step-indicator { font-family: var(--font-mono); font-size: 0.8rem; color: var(--fg-muted); }
  
  .desc { font-size: 0.95rem; color: var(--fg-muted); line-height: 1.5; margin-bottom: 2rem; min-height: 80px; }
  .desc strong { color: var(--fg); }
  code { background: #222; padding: 0.2rem 0.4rem; border-radius: 4px; color: #3b82f6; }
  
  .workbench { display: flex; flex-direction: column; align-items: center; background: #1a1a1a; padding: 3rem 2rem; border-radius: 8px; min-height: 200px; }
  
  .byte-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    background: #222;
    padding: 1rem;
    padding-right: calc(1rem - 4px); /* offset margins */
    padding-bottom: calc(1rem - 4px);
    border-radius: 8px;
    border: 2px solid #444;
    min-height: 120px;
    width: 100%;
    max-width: 488px;
    align-content: flex-start;
    margin: 0 auto 2rem auto;
  }
  
  .byte-wrapper {
    transition: all 1.2s cubic-bezier(0.25, 1, 0.5, 1);
    overflow: hidden;
  }
  
  .byte-wrapper.visible { width: 34px; margin-right: 4px; margin-bottom: 4px; opacity: 1; }
  .byte-wrapper.hidden { width: 0; margin-right: 0; margin-bottom: 0; opacity: 0; }
  
  .byte-slot {
    width: 34px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: bold;
    color: white;
    border-radius: 4px;
    transition: background 0.5s;
    box-sizing: border-box;
  }
  
  .target { background: #ef4444; } /* Red */
  .source { background: #f59e0b; } /* Yellow */
  .iso    { background: #8b5cf6; } /* Purple */
  .math   { background: #3b82f6; } /* Blue */
  .flag   { background: #10b981; } /* Green */
  .packed { background: #10b981; box-shadow: inset 0 0 0 2px #fff; } /* Packed Green */
  
  .footer { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  
  .total-badge {
    font-family: var(--font-mono);
    font-size: 1.2rem;
    font-weight: bold;
    color: #fff;
    background: #333;
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    transition: all 0.5s ease;
  }
  
  .total-badge.success { background: #10b981; animation: pop 0.4s ease; }
  
  @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
  
  @media (max-width: 600px) {
    .byte-wrapper.visible { width: 28px; }
    .byte-slot { width: 28px; height: 32px; font-size: 0.6rem; }
    .byte-grid { padding: 0.5rem; }
  }
</style>
