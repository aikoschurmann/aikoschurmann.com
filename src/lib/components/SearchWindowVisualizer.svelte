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
  
  .scanner {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 86px; height: 86px;
    border: 2px solid #eab308;
    background: rgba(234, 179, 8, 0.3);
    z-index: 10;
    pointer-events: none;
    will-change: transform;
  }
  
  .global-scan {
    animation: globalScanAnim 4s infinite;
  }
  
  .local-scan {
    animation: localScanAnim 2s infinite;
  }
  
  /* Grid total size is 12x12. Cells are 22px apart.
     Max x for 4x4 box is 12 - 4 = 8.
     8 * 22 = 176px. Offset +2px = 178px */
  @keyframes globalScanAnim {
    /* Row 1 */
    0%      { transform: translate(0, 0); opacity: 1; animation-timing-function: steps(8, end); }
    10%     { transform: translate(176px, 0); opacity: 1; animation-timing-function: linear; }
    16%     { transform: translate(176px, 0); opacity: 1; }
    18%     { transform: translate(176px, 0); opacity: 0; }
    19.9%   { transform: translate(0, 44px); opacity: 0; }
    
    /* Row 2 */
    20%     { transform: translate(0, 44px); opacity: 1; animation-timing-function: steps(8, end); }
    30%     { transform: translate(176px, 44px); opacity: 1; animation-timing-function: linear; }
    36%     { transform: translate(176px, 44px); opacity: 1; }
    38%     { transform: translate(176px, 44px); opacity: 0; }
    39.9%   { transform: translate(0, 88px); opacity: 0; }
    
    /* Row 3 */
    40%     { transform: translate(0, 88px); opacity: 1; animation-timing-function: steps(8, end); }
    50%     { transform: translate(176px, 88px); opacity: 1; animation-timing-function: linear; }
    56%     { transform: translate(176px, 88px); opacity: 1; }
    58%     { transform: translate(176px, 88px); opacity: 0; }
    59.9%   { transform: translate(0, 132px); opacity: 0; }
    
    /* Row 4 */
    60%     { transform: translate(0, 132px); opacity: 1; animation-timing-function: steps(8, end); }
    70%     { transform: translate(176px, 132px); opacity: 1; animation-timing-function: linear; }
    76%     { transform: translate(176px, 132px); opacity: 1; }
    78%     { transform: translate(176px, 132px); opacity: 0; }
    79.9%   { transform: translate(0, 176px); opacity: 0; }
    
    /* Row 5 */
    80%     { transform: translate(0, 176px); opacity: 1; animation-timing-function: steps(8, end); }
    90%     { transform: translate(176px, 176px); opacity: 1; animation-timing-function: linear; }
    96%     { transform: translate(176px, 176px); opacity: 1; }
    98%     { transform: translate(176px, 176px); opacity: 0; }
    99.9%   { transform: translate(0, 0); opacity: 0; }
    100%    { transform: translate(0, 0); opacity: 1; }
  }
  
  /* Local bound starts at x=3, ends at x=9.
     Scanner can go from x=3 to x=5 (width 4, 3+4=7 < 9).
     Max x = 5. Left offset: 2 + 5*22 = 112px.
     Start x = 3. Left offset: 2 + 3*22 = 68px. */
  @keyframes localScanAnim {
    /* Row 1 */
    0%      { transform: translate(66px, 66px); opacity: 1; animation-timing-function: steps(2, end); }
    15%     { transform: translate(110px, 66px); opacity: 1; animation-timing-function: linear; }
    25%     { transform: translate(110px, 66px); opacity: 1; }
    28%     { transform: translate(110px, 66px); opacity: 0; }
    33.2%   { transform: translate(66px, 88px); opacity: 0; }
    
    /* Row 2 */
    33.33%  { transform: translate(66px, 88px); opacity: 1; animation-timing-function: steps(2, end); }
    48.33%  { transform: translate(110px, 88px); opacity: 1; animation-timing-function: linear; }
    58.33%  { transform: translate(110px, 88px); opacity: 1; }
    61.33%  { transform: translate(110px, 88px); opacity: 0; }
    66.5%   { transform: translate(66px, 110px); opacity: 0; }
    
    /* Row 3 */
    66.66%  { transform: translate(66px, 110px); opacity: 1; animation-timing-function: steps(2, end); }
    81.66%  { transform: translate(110px, 110px); opacity: 1; animation-timing-function: linear; }
    91.66%  { transform: translate(110px, 110px); opacity: 1; }
    94.66%  { transform: translate(110px, 110px); opacity: 0; }
    99.9%   { transform: translate(66px, 66px); opacity: 0; }
    100%    { transform: translate(66px, 66px); opacity: 1; }
  }
</style>
