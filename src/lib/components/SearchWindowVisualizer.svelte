<script>
  let mode = $state('global');
</script>

<div class="search-visualizer">
  <div class="header">
    <h3>Search Radius Optimization</h3>
    <div class="controls">
      <button class:active="{mode === 'global'}" onclick={() => mode = 'global'}>Global O(N²)</button>
      <button class:active="{mode === 'local'}" onclick={() => mode = 'local'}>Local O(K)</button>
    </div>
  </div>

  <p class="desc">
    {#if mode === 'global'}
      <strong>Global Search:</strong> The algorithm must test every possible Domain block across the entire image. As resolution grows, the number of combinations explodes, resulting in incredibly slow compression.
    {:else}
      <strong>Localized Search:</strong> We restrict the search to a small radius (e.g., <code>[-127, +127]</code>) around the Range block. Because images are highly locally correlated (grass is usually near other grass), this finds a great match almost instantly while hard-capping the search time.
    {/if}
  </p>
  
  <div class="grid-container">
    <div class="image-plane">
      <!-- 12x12 grid visualization -->
      <div class="grid">
        {#each Array(144) as _, i}
          <div class="cell"></div>
        {/each}
        
        <!-- Target Range (Blue) at center x=5, y=5 -->
        <div class="target-box"></div>
        
        <!-- Local Boundary (Green) -->
        <div class="local-boundary" class:visible="{mode === 'local'}"></div>
        
        <!-- Scanner (Yellow) -->
        <div class="scanner" class:global-scan="{mode === 'global'}" class:local-scan="{mode === 'local'}"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .search-visualizer {
    background: #111; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem 2rem; margin: 3rem 0;
  }
  
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
  .header h3 { margin: 0; font-size: 1.2rem; }
  
  .controls { display: flex; align-items: center; gap: 0.5rem; }
  button { background: #333; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.8rem; transition: 0.2s; }
  button.active { background: #3b82f6; }
  
  .desc { font-size: 0.95rem; color: var(--fg-muted); line-height: 1.5; margin-bottom: 2rem; min-height: 60px; }
  .desc strong { color: var(--fg); }
  code { background: #222; padding: 0.2rem 0.4rem; border-radius: 4px; color: #3b82f6; }
  
  .grid-container { display: flex; justify-content: center; }
  
  .image-plane {
    background: #1a1a1a;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #333;
  }
  
  .grid {
    position: relative;
    display: grid;
    /* 12x12 grid, cells are 20px */
    grid-template-columns: repeat(12, 20px);
    grid-template-rows: repeat(12, 20px);
    gap: 2px;
    background: #333;
    padding: 2px;
    border: 2px solid #444;
  }
  
  .cell { background: #222; }
  
  /* Target Range is 2x2. Placed at x=5, y=5. 
     Offset: 2px + 5*(22px) = 112px */
  .target-box {
    position: absolute;
    top: 112px; left: 112px;
    width: 42px; height: 42px;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.4);
    z-index: 5;
  }
  
  /* Local Boundary is 6x6. Centered around Target. 
     x=3, y=3. Offset: 2px + 3*(22px) = 68px */
  .local-boundary {
    position: absolute;
    top: 68px; left: 68px;
    width: 130px; height: 130px;
    border: 2px dashed #22c55e;
    background: rgba(34, 197, 94, 0.05);
    z-index: 2;
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .local-boundary.visible { opacity: 1; }
  
  /* Domain Scanner is 4x4. width: 4*20 + 3*2 = 86px */
  .scanner {
    position: absolute;
    width: 86px; height: 86px;
    border: 2px solid #eab308;
    background: rgba(234, 179, 8, 0.3);
    z-index: 10;
    pointer-events: none;
  }
  
  .global-scan {
    animation: globalScanAnim 4s linear infinite;
  }
  
  .local-scan {
    animation: localScanAnim 2s linear infinite;
  }
  
  /* Grid total size is 12x12. Cells are 22px apart.
     Max x for 4x4 box is 12 - 4 = 8.
     8 * 22 = 176px. Offset +2px = 178px */
  @keyframes globalScanAnim {
    0%    { top: 2px; left: 2px; opacity: 1; }
    18%   { top: 2px; left: 178px; opacity: 1; }
    19%   { top: 2px; left: 178px; opacity: 0; }
    20%   { top: 46px; left: 2px; opacity: 0; }
    21%   { top: 46px; left: 2px; opacity: 1; }
    
    38%   { top: 46px; left: 178px; opacity: 1; }
    39%   { top: 46px; left: 178px; opacity: 0; }
    40%   { top: 90px; left: 2px; opacity: 0; }
    41%   { top: 90px; left: 2px; opacity: 1; }
    
    58%   { top: 90px; left: 178px; opacity: 1; }
    59%   { top: 90px; left: 178px; opacity: 0; }
    60%   { top: 134px; left: 2px; opacity: 0; }
    61%   { top: 134px; left: 2px; opacity: 1; }
    
    78%   { top: 134px; left: 178px; opacity: 1; }
    79%   { top: 134px; left: 178px; opacity: 0; }
    80%   { top: 178px; left: 2px; opacity: 0; }
    81%   { top: 178px; left: 2px; opacity: 1; }
    
    98%   { top: 178px; left: 178px; opacity: 1; }
    99%   { top: 178px; left: 178px; opacity: 0; }
    100%  { top: 2px; left: 2px; opacity: 0; }
  }
  
  /* Local bound starts at x=3, ends at x=9.
     Scanner can go from x=3 to x=5 (width 4, 3+4=7 < 9).
     Max x = 5. Left offset: 2 + 5*22 = 112px.
     Start x = 3. Left offset: 2 + 3*22 = 68px. */
  @keyframes localScanAnim {
    0%    { top: 68px; left: 68px; opacity: 1; }
    31%   { top: 68px; left: 112px; opacity: 1; }
    32%   { top: 68px; left: 112px; opacity: 0; }
    33%   { top: 90px; left: 68px; opacity: 0; }
    34%   { top: 90px; left: 68px; opacity: 1; }
    
    64%   { top: 90px; left: 112px; opacity: 1; }
    65%   { top: 90px; left: 112px; opacity: 0; }
    66%   { top: 112px; left: 68px; opacity: 0; }
    67%   { top: 112px; left: 68px; opacity: 1; }
    
    97%   { top: 112px; left: 112px; opacity: 1; }
    98%   { top: 112px; left: 112px; opacity: 0; }
    100%  { top: 68px; left: 68px; opacity: 0; }
  }
</style>
