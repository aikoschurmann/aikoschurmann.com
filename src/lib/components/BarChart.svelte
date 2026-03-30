<script lang="ts">
  type Bar = { label: string; value: number; color?: string };

  let { 
    title = "Comparisons", 
    data = [] as Bar[], 
    maxY = 100,
    ySuffix = ""
  } = $props();

  const width = 600;
  const height = 300;
  const padding = { top: 40, right: 30, bottom: 60, left: 60 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  let hoveredBar = $state<any>(null);
</script>

<div class="chart-wrapper">
  {#if title}
    <div class="chart-title">{title}</div>
  {/if}
  
  <svg {width} {height} viewBox="0 0 {width} {height}">
    <!-- Grid -->
    {#each [0, 25, 50, 75, 100] as grid}
      {@const y = padding.top + chartHeight - (grid / 100) * chartHeight}
      <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} class="grid-line" />
      <text x={padding.left - 15} y={y} class="axis-text" dominant-baseline="middle" text-anchor="end">
        {((grid / 100) * maxY).toFixed(0)}{ySuffix}
      </text>
    {/each}

    <!-- Bars -->
    {#each data as bar, i}
      {@const barWidth = (chartWidth / data.length) * 0.65}
      {@const x = padding.left + (i / data.length) * chartWidth + (chartWidth / data.length - barWidth) / 2}
      {@const h = (bar.value / maxY) * chartHeight}
      {@const y = padding.top + chartHeight - h}
      
      <rect 
        {x} {y} width={barWidth} height={h}
        fill={bar.color || "#6366f1"}
        fill-opacity={hoveredBar === bar ? "0.9" : "0.7"}
        stroke={hoveredBar === bar ? (bar.color || "#6366f1") : "none"}
        stroke-width={hoveredBar === bar ? "2" : "0"}
        rx="6"
        onmouseenter={() => hoveredBar = bar}
        onmouseleave={() => hoveredBar = null}
        class="bar"
      />
      
      <text x={x + barWidth/2} y={height - 20} class="axis-text label-text" text-anchor="middle">
        {bar.label}
      </text>
    {/each}

    <!-- Tooltip -->
    {#if hoveredBar}
      {@const barWidth = (chartWidth / data.length) * 0.65}
      {@const i = data.indexOf(hoveredBar)}
      {@const x = padding.left + (i / data.length) * chartWidth + (chartWidth / data.length) / 2}
      {@const y = padding.top + chartHeight - (hoveredBar.value / maxY) * chartHeight}
      {@const tooltipPadding = 16}
      {@const tooltipWidth = 100}
      {@const tooltipHeight = 50}
      
      <g transform="translate({x - tooltipWidth/2}, {y - tooltipHeight - 10})">
        <rect 
          width={tooltipWidth} 
          height={tooltipHeight} 
          rx="8" 
          fill="#1a1a1a" 
          stroke="rgba(255,255,255,0.1)" 
          stroke-width="1"
          filter="url(#shadow)" 
        />
        <text x={tooltipWidth/2} y="22" class="tooltip-label" text-anchor="middle">Value</text>
        <text x={tooltipWidth/2} y="38" class="tooltip-value" text-anchor="middle">
          {hoveredBar.value}{ySuffix}
        </text>
        
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dx="0" dy="3" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
      </g>
    {/if}
  </svg>
</div>

<style>
  .chart-wrapper {
    background: #0f0f0f;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 2rem;
    margin: 2rem 0;
    width: 100%;
  }

  .chart-title {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 2rem;
    text-align: center;
    font-weight: 500;
    letter-spacing: -0.01em;
  }

  svg { 
    width: 100%; 
    height: auto; 
    display: block; 
    overflow: visible; 
  }

  .grid-line { 
    stroke: rgba(255, 255, 255, 0.06);
    stroke-width: 1;
  }

  .axis-text { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11px; 
    fill: #6b7280; 
    font-weight: 400;
  }

  .label-text { 
    fill: #9ca3af;
    font-weight: 500;
    letter-spacing: 0.01em;
  }

  .tooltip-label {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11px;
    fill: #9ca3af;
    font-weight: 500;
  }

  .tooltip-value {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    fill: #f3f4f6;
    font-weight: 600;
  }

  .bar { 
    transition: all 0.15s ease;
    cursor: pointer; 
  }
</style>