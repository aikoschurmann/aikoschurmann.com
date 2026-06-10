<script lang="ts">
  type CellData = {
    val: string;
    type?: 'run' | 'interval' | 'cycle' | 'sprint' | 'rest' | 'header' | 'load';
    detail?: string;
  };
  
  let { 
    headers = [] as string[],
    rows = [] as CellData[][],
    showLegend = false,
    type = 'weekly'
  } = $props<{
    headers?: string[];
    rows?: CellData[][];
    showLegend?: boolean;
    type?: 'weekly' | 'interval' | 'volume';
  }>();

  function parseMinutes(val: string): number {
    const match = val.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  function getBaseType(cellType?: string): string {
    const map: Record<string, string> = {
      'run': 'Running',
      'interval': 'Intervals',
      'cycle': 'Cycling',
      'sprint': 'Sprints',
      'rest': 'Rest'
    };
    return map[cellType || ''] || 'Activity';
  }

  function extractSets(val: string): number {
    const match = val.match(/(\d+)\s*sets?/i);
    return match ? parseInt(match[1], 10) : 0;
  }

  function buildTimeline(row: CellData[]) {
    if (!row || row.length < 5) return [];
    const segments = [];
    
    const warmupMins = parseMinutes(row[2].val);
    if (warmupMins > 0) segments.push({ type: 'warmup', val: `${warmupMins}m`, flex: warmupMins });
    
    const setsStr = row[3].val;
    const numSets = extractSets(setsStr);
    if (numSets > 0) {
      for (let i = 0; i < numSets; i++) {
        segments.push({ type: 'work', val: '4m', flex: 4 });
        if (i < numSets - 1) {
          segments.push({ type: 'rest', val: '3m', flex: 3 });
        }
      }
    }

    const coolMins = parseMinutes(row[4].val);
    if (coolMins > 0) segments.push({ type: 'cooldown', val: `${coolMins}m`, flex: coolMins });

    return segments;
  }

  const processedRows = $derived.by(() => {
    return rows.map((row, i) => {
      // Simply grab the immediately preceding row
      const prevRow = i > 0 ? rows[i - 1] : null;
      
      return row.map((cell, colIndex) => {
        let enhanced = { ...cell, delta: null as any };
        
        // Exclude the separate Interval Table entirely, Ratio columns, Headers, and Rest days
        const isExcluded = type === 'interval' || cell.val.includes('/') || cell.type === 'header' || cell.val === 'Rest';
        
        if (!isExcluded && prevRow) {
          const currentMins = parseMinutes(cell.val);
          const prevMins = parseMinutes(prevRow[colIndex].val);
          
          // Compare strictly on numbers, completely ignoring activity type matching
          if (currentMins > 0 && prevMins > 0) {
            const diff = currentMins - prevMins;
            if (diff !== 0) {
              const arrow = diff > 0 ? '▲' : '▼';
              enhanced.delta = { 
                text: '', 
                val: `${arrow} ${Math.abs(diff)}m`, 
                state: diff > 0 ? 'pos' : 'neg' 
              };
            }
          }
        }
        return enhanced;
      });
    });
  });
</script>

<div class="training-container">
  
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          {#if type === 'interval'}
            <th>{headers[0]}</th>
            <th>{headers[1]}</th>
            <th style="width: 100%;">Session Timeline</th>
          {:else}
            {#each headers as header}
              <th>{header}</th>
            {/each}
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each processedRows as row, i}
          <tr 
            class:is-deload={row[0].val.includes('(Del)')}
            class:new-block={i > 0 && i % 4 === 0}
          >
            
            {#if type === 'interval'}
              
              <td>
                <div class="val-wrapper">
                  <span class="main-val cell-header">{row[0].val.replace('(Del)', '').trim()}</span>
                  {#if row[0].val.includes('(Del)')}<span class="im-tag">Del</span>{/if}
                </div>
              </td>
              
              <td>
                 <span class="main-val">{row[1].val}</span>
              </td>
              
              <td style="width: 100%;">
                <div class="unified-bar">
                  {#each buildTimeline(row) as seg}
                    <div class="ub-seg {seg.type}" style="--base-flex: {seg.flex}">
                      
                      <div class="ub-lbl">
                        {#if seg.type === 'warmup'}
                          <svg class="seg-icon" viewBox="0 0 24 24" width="14" height="14"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        {:else if seg.type === 'work'}
                          <svg class="seg-icon" viewBox="0 0 24 24" width="14" height="14"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        {:else if seg.type === 'rest'}
                          <svg class="seg-icon" viewBox="0 0 24 24" width="14" height="14"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                        {:else if seg.type === 'cooldown'}
                          <svg class="seg-icon" viewBox="0 0 24 24" width="14" height="14"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
                        {/if}
                      </div>

                      <span class="ub-val">{seg.val}</span>
                    </div>
                  {/each}
                </div>
              </td>

            {:else}
              {#each row as cell, colIndex}
                <td class="cell-{cell.type || 'default'}">
                  <div class="cell-content">
                    
                    <div class="val-wrapper">
                      {#if colIndex === 0 && cell.val.includes('(Del)')}
                        <span class="main-val">{cell.val.replace('(Del)', '').trim()}</span>
                        <span class="im-tag">Del</span>
                      {:else}
                        <span class="main-val">{cell.val}</span>
                      {/if}
                      
                      {#if type === 'weekly' && cell.type !== 'header' && cell.type !== 'rest'}
                        <div class="css-tooltip">
                          {getBaseType(cell.type)}
                          <div class="tooltip-arrow"></div>
                        </div>
                      {/if}
                    </div>

                    {#if cell.delta}
                      <div class="delta-wrap {cell.delta.state}">
                        {#if cell.delta.val}<span class="d-val">{cell.delta.val}</span>{/if}
                      </div>
                    {/if}

                  </div>
                </td>
              {/each}
            {/if}

          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if showLegend}
    <div class="legend">
      <div class="legend-item li-interval"><span class="dot"></span> Intervals</div>
      <div class="legend-item li-cycle"><span class="dot"></span> Cycling</div>
      <div class="legend-item li-run"><span class="dot"></span> Running</div>
      <div class="legend-item li-sprint"><span class="dot"></span> Sprints</div>
      <div class="legend-item li-rest"><span class="dot"></span> Rest</div>
    </div>
  {/if}
</div>

<style>
  :root {
    --tr-run: #4ade80;
    --tr-cycle: #60a5fa;
    --tr-interval: #f87171;
    --tr-sprint: #fbbf24;
    --tr-rest: #9ca3af;
    --tr-text: #e5e5e5;
  }

  .training-container {
    width: 100%;
    margin: 2rem 0; 
  }

  .table-wrap {
    overflow-x: auto;
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.02);
  }

  table { 
    width: 100%; 
    border-collapse: separate;
    border-spacing: 0;
    margin: 0; 
    text-align: left;
  }

  th {
    color: #888;
    font-weight: 600;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1); 
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.75rem;
    white-space: nowrap;
    background: rgba(255, 255, 255, 0.02);
  }

  td {
    padding: 0.8rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04); 
    color: var(--tr-text);
    vertical-align: top;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }

  tr:last-child td { border-bottom: none;
  }
  
  /* Block Separation */
  .new-block td {
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 1.2rem;
  }

  .is-deload { background: rgba(59, 130, 246, 0.015);
  }
  
  tr:hover td { background: rgba(255, 255, 255, 0.02);
  }

  .cell-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }

  .val-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    cursor: default;
  }
  
  td:has(.css-tooltip) .val-wrapper { cursor: help; }

  /* Identical Outlined Deload Tags (For both Main Col and Delta Col) */
  .im-tag, .delta-wrap.recovery { 
    font-size: 0.65rem;
    text-transform: uppercase; 
    font-weight: 700;
    color: var(--tr-cycle); 
    border: 1px solid rgba(96, 165, 250, 0.3);
    padding: 0.1rem 0.35rem; 
    border-radius: 3px;
    letter-spacing: 0.05em;
    width: max-content;
  }


  /* --- INTERACTIVE ACCORDION TIMELINE BAR --- */
  .unified-bar {
    display: flex;
    width: 100%;
    min-width: 300px; 
    height: 24px;
    gap: 4px;
    background: transparent;
  }

  .ub-seg {
    flex: var(--base-flex);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px; 
    cursor: pointer;
    overflow: hidden;
    transition: flex 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
                transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), 
                filter 0.3s ease, 
                box-shadow 0.3s ease;
  }

  .ub-seg.warmup { background: rgba(235, 167, 21, 0.95); } 
  .ub-seg.work { background: rgba(248, 113, 113, 0.95);
  } 
  .ub-seg.rest { background: rgba(255, 255, 255, 0.2); } 
  .ub-seg.cooldown { background: rgba(56, 189, 248, 0.8);
  } 

  .ub-val {
    font-weight: 700;
    font-size: 0.75rem;
    color: #fff;
    z-index: 2;
    text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  }

  .ub-lbl {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    transform: translateX(-5px);
    transition: max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
                opacity 0.3s ease, 
                margin 0.3s ease,
                transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .seg-icon {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
  }

  .ub-seg:hover {
    flex: 20 !important; 
    transform: scaleY(1.2);
    filter: brightness(1.15);
    z-index: 10;
  }

  .ub-seg:hover .ub-lbl {
    max-width: 24px; 
    opacity: 1;
    transform: translateX(0);
    margin-right: 0.3rem;
  }

  /* --- CSS TOOLTIPS (Weekly Table) --- */
  .css-tooltip {
    --tip-bg: #111;
    --tip-border: transparent;
    position: absolute;
    top: calc(100% + 8px); 
    left: 50%;
    transform: translate(-50%, -8px) scale(0.95);
    opacity: 0;
    visibility: hidden;
    background: var(--tip-bg);
    border: 1px solid var(--tip-border);
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    font-size: 0.6rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
    pointer-events: none;
    z-index: 20;
    transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.2s;
    box-shadow: 0 8px 24px rgba(0,0,0,0.8);
  }

  .tooltip-arrow {
    position: absolute;
    top: -4.5px; 
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: var(--tip-bg);
    border-top: 1px solid var(--tip-border);
    border-left: 1px solid var(--tip-border);
  }

  .val-wrapper:hover .css-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, 0) scale(1);
  }

  .cell-interval .css-tooltip { --tip-bg: #111; --tip-border: rgba(248, 113, 113, 0.4); color: var(--tr-interval);
  }
  .cell-cycle .css-tooltip { --tip-bg: #111; --tip-border: rgba(96, 165, 250, 0.4); color: var(--tr-cycle);
  }
  .cell-run .css-tooltip { --tip-bg: #111; --tip-border: rgba(74, 222, 128, 0.4); color: var(--tr-run);
  }
  .cell-sprint .css-tooltip { --tip-bg: #111; --tip-border: rgba(251, 191, 36, 0.4); color: var(--tr-sprint);
  }

  /* --- DELTAS --- */
  .delta-wrap {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: 0.1rem;
  }
  .delta-wrap.pos { color: var(--tr-run); opacity: 0.9; }
  .delta-wrap.neg { color: var(--tr-interval);
    opacity: 0.9; }
  
  /* --- TEXT COLORS & HIERARCHY --- */
  .cell-header { color: #fff;
    font-weight: 600; }
  .cell-rest { color: var(--tr-rest); font-style: italic;}
  .cell-cycle .main-val { color: var(--tr-cycle);
    font-weight: 600; }
  .cell-run .main-val { color: var(--tr-run); font-weight: 600; }
  .cell-sprint .main-val { color: var(--tr-sprint); font-weight: 700;
  }
  .cell-interval .main-val { color: var(--tr-interval); font-weight: 700; }
  .cell-load { font-weight: 700; color: #fff;
  }

  /* --- LEGEND --- */
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1.2rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #e5e5e5;
  }

  .dot { width: 8px; height: 8px; border-radius: 50%;
  }
  
  .li-interval .dot { background: var(--tr-interval); }
  .li-cycle .dot { background: var(--tr-cycle);
  }
  .li-run .dot { background: var(--tr-run); }
  .li-sprint .dot { background: var(--tr-sprint);
  }
  .li-rest .dot { background: var(--tr-rest); }

  /* Remove row hover highlights */
tr:hover td { 
  background: transparent; 
}


</style>