<script lang="ts">
  type Point = { x: number; y: number; label?: string };

  let { 
    title = "Data Analysis", 
    data = [] as Point[], 
    xLabel = "X Axis", 
    yLabel = "Y Axis",
    color = "#6366f1",
    minX = 0, maxX = 100,
    minY = 0, maxY = 100
  } = $props();

  const width = 600;
  const height = 350;
  const padding = { top: 40, right: 40, bottom: 60, left: 70 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = $derived(data.map(p => ({
    x: padding.left + ((p.x - minX) / (maxX - minX)) * chartWidth,
    y: padding.top + chartHeight - ((p.y - minY) / (maxY - minY)) * chartHeight,
    original: p
  })));

  let hoveredPoint = $state<any>(null);
</script>

<div class="chart-wrapper">
  {#if title}
    <div class="chart-title">{title}</div>
  {/if}
  
  <svg {width} {height} viewBox="0 0 {width} {height}">
    <!-- Grid -->
    {#each [0, 25, 50, 75, 100] as grid}
      {@const y = padding.top + chartHeight - (grid / 100) * chartHeight}
      {@const x = padding.left + (grid / 100) * chartWidth}
      <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} class="grid-line" />
      <line x1={x} y1={padding.top} x2={x} y2={padding.top + chartHeight} class="grid-line" />
      
      <!-- Axis Numbers -->
      <text x={padding.left - 15} y={y} class="axis-number" text-anchor="end" dominant-baseline="middle">
        {(minY + (grid/100) * (maxY - minY)).toFixed(1)}
      </text>
      <text x={x} y={height - 35} class="axis-number" text-anchor="middle">
        {(minX + (grid/100) * (maxX - minX)).toFixed(0)}
      </text>
    {/each}

    <!-- Points -->
    {#each points as p}
      <circle 
        cx={p.x} cy={p.y} r={hoveredPoint === p ? 7 : 5} 
        fill={hoveredPoint === p ? color : "#0f0f0f"}
        stroke={color}
        stroke-width={hoveredPoint === p ? 3 : 2}
        onmouseenter={() => hoveredPoint = p}
        onmouseleave={() => hoveredPoint = null}
        class="point"
      />
    {/each}

    <!-- Tooltip -->
    {#if hoveredPoint}
      {@const tooltipPadding = 16}
      {@const tooltipWidth = 160}
      {@const tooltipHeight = 50}
      {@const tooltipX = hoveredPoint.x + (hoveredPoint.x > width / 2 ? -(tooltipWidth + 15) : 15)}
      {@const tooltipY = hoveredPoint.y - tooltipHeight - 10}
      
      <g transform="translate({tooltipX}, {tooltipY})">
        <rect 
          width={tooltipWidth} 
          height={tooltipHeight} 
          rx="8" 
          fill="#1a1a1a" 
          stroke="rgba(255,255,255,0.1)" 
          stroke-width="1"
          filter="url(#shadow)" 
        />
        {#if hoveredPoint.original.label}
          <text x={tooltipPadding} y="22" class="tooltip-label">Point</text>
          <text x={tooltipPadding} y="38" class="tooltip-value">{hoveredPoint.original.label}</text>
        {:else}
          <text x={tooltipPadding} y="22" class="tooltip-label">Coordinates</text>
          <text x={tooltipPadding} y="38" class="tooltip-value">
            ({hoveredPoint.original.x.toFixed(1)}, {hoveredPoint.original.y.toFixed(1)})
          </text>
        {/if}
        
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

    <!-- Axes Labels -->
    <text x={padding.left + chartWidth/2} y={height - 10} class="axis-label" text-anchor="middle">{xLabel}</text>
    <text x={20} y={padding.top + chartHeight/2} class="axis-label" transform="rotate(-90, 20, {padding.top + chartHeight/2})" text-anchor="middle">{yLabel}</text>
  </svg>
</div>

<style>
  .chart-wrapper {
    background: #0f0f0f;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 2rem;
    margin: 2rem 0;
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

  .axis-number { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11px; 
    fill: #6b7280; 
    font-weight: 400;
  }

  .axis-label { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11px; 
    fill: #9ca3af;
    font-weight: 500;
    letter-spacing: 0.02em;
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

  .point { 
    transition: all 0.15s ease;
    cursor: pointer; 
  }
</style>