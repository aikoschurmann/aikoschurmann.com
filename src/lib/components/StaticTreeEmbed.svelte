<script module lang="ts">
  export type TreeNode = {
    label: string;
    children?: TreeNode[];
    isTerminal?: boolean;
  };
</script>

<script lang="ts">
  let { tree } = $props<{ tree: TreeNode }>();

  /**
   * Recursive layout engine that enforces symmetry.
   * For any node, its children are placed such that the left and right
   * branches occupy equal horizontal space (the max of the two).
   */
  function getLayout(node: TreeNode, depth = 0) {
    // Base case: Leaf node
    if (!node.children || node.children.length === 0) {
      return { 
        width: 1, 
        nodes: [{ label: node.label, x: 0.5, y: depth, isTerminal: node.isTerminal }], 
        edges: [] 
      };
    }

    // 1. Get raw layouts of all children
    let rawLayouts = node.children.map(child => getLayout(child, depth + 1));
    let widths = rawLayouts.map(l => l.width);
    
    // 2. Enforce symmetry: Match widths of sibling pairs from outside-in
    // e.g., if child 0 is width 1 and child 2 is width 3, make both "effective" width 3
    for (let i = 0; i < Math.floor(widths.length / 2); i++) {
      let sideW = Math.max(widths[i], widths[widths.length - 1 - i]);
      widths[i] = sideW;
      widths[widths.length - 1 - i] = sideW;
    }

    // 3. Place children side-by-side using balanced widths
    let currentX = 0;
    let totalNodes: any[] = [];
    let totalEdges: any[] = [];
    let childCenters: number[] = [];

    for (let i = 0; i < rawLayouts.length; i++) {
      let layout = rawLayouts[i];
      let allocatedW = widths[i];
      // Center the child subtree within its allocated balanced width
      let offset = (allocatedW - layout.width) / 2;
      
      const shift = currentX + offset;
      
      layout.nodes.forEach(n => {
        totalNodes.push({ ...n, x: n.x + shift });
      });
      layout.edges.forEach(e => {
        totalEdges.push({ x1: e.x1 + shift, y1: e.y1, x2: e.x2 + shift, y2: e.y2 });
      });
      
      childCenters.push(currentX + allocatedW / 2);
      currentX += allocatedW;
    }

    // 4. Position parent at the exact center of its children
    const parentX = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
    totalNodes.push({ label: node.label, x: parentX, y: depth, isTerminal: node.isTerminal });

    // 5. Connect parent to children
    for (const cx of childCenters) {
      totalEdges.push({ x1: parentX, y1: depth, x2: cx, y2: depth + 1 });
    }

    return { width: currentX, nodes: totalNodes, edges: totalEdges };
  }

  // Visual constants (Increased scale)
  const unitX = 100;
  const unitY = 110;
  const margin = 60;
  const nodeRadius = 24;

  // FIXED: Post-process the layout to crop empty logical space and center the visual mass perfectly
  const layout = $derived.by(() => {
    const raw = getLayout(tree);
    if (!raw.nodes.length) return raw;

    // Find the exact visual boundaries of the tree
    const xs = raw.nodes.map(n => n.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    
    // Shift everything left so the leftmost node is exactly at x = 0
    const shift = -minX;

    return {
      width: maxX - minX, // New width is tightly bounded
      nodes: raw.nodes.map(n => ({ ...n, x: n.x + shift })),
      edges: raw.edges.map(e => ({ ...e, x1: e.x1 + shift, x2: e.x2 + shift }))
    };
  });

  const svgWidth = $derived(layout.width * unitX + margin * 2);
  const svgHeight = $derived((Math.max(...layout.nodes.map(n => n.y)) + 1) * unitY + margin);
</script>

<div class="static-tree-embed">
  <div class="viewport">
    <svg 
      viewBox="0 0 {svgWidth} {svgHeight}" 
      width={svgWidth}
      height={svgHeight}
      preserveAspectRatio="xMidYMid meet"
    >
      {#each layout.edges as edge}
        <line 
          x1={edge.x1 * unitX + margin} 
          y1={edge.y1 * unitY + margin} 
          x2={edge.x2 * unitX + margin} 
          y2={edge.y2 * unitY + margin} 
          class="edge"
        />
      {/each}

      {#each layout.nodes as node}
        <g transform="translate({node.x * unitX + margin}, {node.y * unitY + margin})">
          <circle r={nodeRadius} class="node-solid-base" />
          <circle r={nodeRadius} class="node-bg" class:terminal={node.isTerminal} />
          
          <text text-anchor="middle" dy="0.35em" class="node-label" class:terminal={node.isTerminal}>
            {node.label}
          </text>
        </g>
      {/each}
    </svg>
  </div>
</div>

<style>
  .static-tree-embed {
    display: flex;
    justify-content: center;
    margin: 4rem 0;
    width: 100%;
  }

  .viewport {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    background: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    padding: 3rem;
    display: flex;
    justify-content: center;
  }
  
  .viewport::-webkit-scrollbar { display: none; }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .edge {
    stroke: rgba(255, 255, 255, 0.15);
    stroke-width: 2.5;
  }

  .node-solid-base {
    fill: #151312; /* App background color to hide the lines */
  }

  .node-bg {
    fill: #1e1c1b;
    stroke: var(--border);
    stroke-width: 2.5;
  }

  .node-bg.terminal {
    stroke: #10b981;
    fill: rgba(16, 185, 129, 0.08); /* This is transparent, so we need the solid base behind it! */
  }

  .node-label {
    font-size: 16px;
    font-weight: 700;
    fill: #fbbf24;
    font-family: var(--font-mono);
  }

  .node-label.terminal {
    fill: #10b981;
  }
</style>