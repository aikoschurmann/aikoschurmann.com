<script lang="ts">
  type Dataset = {
    label: string;
    data: number[];
    color: string;
  };

  let { 
    title = "Analysis", 
    datasets = [{ label: "Value", data: [10, 25, 45, 30, 60, 85, 95], color: "#6366f1" }] as Dataset[], 
    labels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"], 
    ySuffix = "%",
    minY = undefined as number | undefined,
    maxY = undefined as number | undefined
  } = $props();

  const width = 600;
  const height = 300;
  const padding = { top: 40, right: 30, bottom: 50, left: 65 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate dynamic min/max if not provided
  const allDataPoints = datasets.flatMap(ds => ds.data);
  const dataMin = Math.min(...allDataPoints);
  const dataMax = Math.max(...allDataPoints);
  
  // Create comfortable ranges
  const calculatedMinY = minY ?? (dataMin > 0 ? 0 : dataMin * 1.1);
  const calculatedMaxY = maxY ?? (dataMax * 1.1);
  const yRange = calculatedMaxY - calculatedMinY;

  // Derived points for each dataset
  const processedDatasets = $derived(datasets.map(ds => ({
    ...ds,
    points: ds.data.map((d, i) => ({
      x: padding.left + (i / (labels.length - 1)) * chartWidth,
      y: padding.top + chartHeight - ((d - calculatedMinY) / yRange) * chartHeight,
      value: d
    }))
  })));

  // Paths
  const getPaths = (points: any[]) => {
    const d = points.map(p => `${p.x},${p.y}`).join(' L ');
    return {
      path: `M ${d}`,
      area: `M ${d} L ${points[points.length - 1].x},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`
    };
  };

  // Hover logic
  let activeIndex = $state(-1);
  let mouseX = $state(0);

  function handleMouseMove(e: MouseEvent) {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    
    const relativeX = x - padding.left;
    const index = Math.round((relativeX / chartWidth) * (labels.length - 1));
    
    if (index >= 0 && index < labels.length) {
      activeIndex = index;
      mouseX = padding.left + (activeIndex / (labels.length - 1)) * chartWidth;
    } else {
      activeIndex = -1;
    }
  }

  function handleMouseLeave() {
    activeIndex = -1;
  }
</script>

<div class="chart-wrapper">
  {#if title}
    <div class="chart-header">
      <div class="chart-title">{title}</div>
      <div class="legend">
        {#each datasets as ds}
          <div class="legend-item">
            <span class="dot" style="background: {ds.color}"></span>
            {ds.label}
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <svg {width} {height} viewBox="0 0 {width} {height}" onmousemove={handleMouseMove} onmouseleave={handleMouseLeave}>
    <!-- Background Grid -->
    {#each [0, 0.25, 0.5, 0.75, 1] as step}
      {@const val = calculatedMinY + step * yRange}
      {@const y = padding.top + chartHeight - step * chartHeight}
      <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} class="grid-line" />
      <text x={padding.left - 15} y={y} class="axis-text y-axis" dominant-baseline="middle">
        {val >= 10 ? val.toFixed(0) : val.toFixed(1)}{ySuffix}
      </text>
    {/each}

    <!-- Draw each dataset path -->
    {#each processedDatasets as ds, i}
      {@const paths = getPaths(ds.points)}
      <defs>
        <linearGradient id="grad-{i}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color={ds.color} stop-opacity="0.08" />
          <stop offset="100%" stop-color={ds.color} stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d={paths.area} fill="url(#grad-{i})" />
      <path d={paths.path} fill="none" stroke={ds.color} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    {/each}

    <!-- Vertical Indicator Line on Hover -->
    {#if activeIndex !== -1}
      <line x1={mouseX} y1={padding.top} x2={mouseX} y2={padding.top + chartHeight} stroke="rgba(255,255,255,0.15)" stroke-dasharray="3 3" stroke-width="1" />
    {/if}

    <!-- Data Points -->
    {#each processedDatasets as ds}
      {#each ds.points as p, i}
        <circle 
          cx={p.x} cy={p.y} r="3.5" 
          fill="#0f0f0f" 
          stroke={ds.color} 
          stroke-width="2"
          class:active-point={activeIndex === i}
        />
      {/each}
    {/each}

    <!-- X-Axis Labels -->
    {#each labels as label, i}
      {@const x = padding.left + (i / (labels.length - 1)) * chartWidth}
      <text x={x} y={height - 15} class="axis-text x-axis" text-anchor="middle">{label}</text>
    {/each}

    <!-- Tooltip -->
    {#if activeIndex !== -1}
      {@const tooltipPadding = 16}
      {@const rowHeight = 26}
      {@const headerHeight = 32}
      {@const tooltipHeight = datasets.length * rowHeight + headerHeight}
      {@const tooltipWidth = 180}
      {@const tooltipX = mouseX + (activeIndex > labels.length / 2 ? -(tooltipWidth + 15) : 15)}
      <g transform="translate({tooltipX}, {padding.top + 10})">
        <rect width={tooltipWidth} height={tooltipHeight} rx="8" fill="#1a1a1a" stroke="rgba(255,255,255,0.1)" stroke-width="1" filter="url(#shadow)" />
        <text x={tooltipPadding} y="22" class="tooltip-label">{labels[activeIndex]}</text>
        {#each datasets as ds, i}
          <g transform="translate({tooltipPadding}, {headerHeight + 10 + i * rowHeight})">
            <circle cx="0" cy="-3" r="3" fill={ds.color} />
            <text x="12" y="0" class="tooltip-dataset">{ds.label}</text>
          </g>
          <text x={tooltipWidth - tooltipPadding} y={headerHeight + 10 + i * rowHeight} class="tooltip-value" text-anchor="end">
            {ds.data[activeIndex]}{ySuffix}
          </text>
        {/each}
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

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 1rem;
  }

  .chart-title {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
    letter-spacing: -0.01em;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 1.25rem;
  }

  .legend-item {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 0.8125rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  svg {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
    cursor: crosshair;
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

  .y-axis {
    text-anchor: end;
  }

  .tooltip-label {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11px;
    fill: #9ca3af;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .tooltip-dataset {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    fill: #d1d5db;
    font-weight: 400;
  }

  .tooltip-value {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    fill: #f3f4f6;
    font-weight: 600;
  }

  .active-point {
    r: 5;
    stroke-width: 2.5;
  }

  circle {
    transition: all 0.15s ease;
  }
</style>