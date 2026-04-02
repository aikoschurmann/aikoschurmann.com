<script lang="ts">
	type Mode = 'step' | 'graph';

	type GraphNode = {
		id: string;
		label: string;
		subset: string;
		x: number;
		y: number;
		accept?: boolean;
		start?: boolean;
	};

	type GraphEdge = {
		from: string;
		to: string;
		label: string;
		curve?: number;
		loop?: 'up' | 'down';
		labelX?: number;
		labelY?: number;
	};

	let { mode = 'step' } = $props<{ mode?: Mode }>();

	const graphNodes: GraphNode[] = [
		{ id: 'D0', label: 'D0', subset: '{q0}', x: 140, y: 132, start: true },
		{ id: 'D1', label: 'D1', subset: '{q0,q1}', x: 320, y: 132 },
		{ id: 'D2', label: 'D2', subset: '{q0,q2}', x: 500, y: 132, accept: true },
		{ id: 'D3', label: 'D3', subset: '{q0,q1,q2}', x: 680, y: 132, accept: true }
	];

	const graphEdges: GraphEdge[] = [
		{ from: 'D0', to: 'D1', label: 'a', curve: 0 },
		{ from: 'D0', to: 'D0', label: 'b', loop: 'up' },
		{ from: 'D1', to: 'D1', label: 'a', loop: 'down' },
		{ from: 'D1', to: 'D2', label: 'b', curve: 0 },
		{ from: 'D2', to: 'D3', label: 'a', curve: -22, labelX: 590, labelY: 108 },
		{ from: 'D2', to: 'D2', label: 'b', loop: 'up' },
		{ from: 'D3', to: 'D3', label: 'a', loop: 'down' },
		{ from: 'D3', to: 'D2', label: 'b', curve: -28, labelX: 590, labelY: 168 }
	];

	const nodeRadius = 35;

	function getNode(id: string): GraphNode {
		return graphNodes.find((n) => n.id === id) as GraphNode;
	}

	function edgePath(edge: GraphEdge): string {
		const from = getNode(edge.from);
		const to = getNode(edge.to);

		if (edge.loop) {
			const loopSpan = 22;
			const loopRise = 46;
			const sign = edge.loop === 'down' ? 1 : -1;
			const baseY = from.y - nodeRadius + 1;
			const controlY = baseY + sign * loopRise;
			const endY = baseY;

			if (edge.loop === 'down') {
				const downBaseY = from.y + nodeRadius - 1;
				const downControlY = downBaseY + loopRise;
				return [
					`M ${from.x - loopSpan} ${downBaseY}`,
					`C ${from.x - 38} ${downControlY}, ${from.x + 38} ${downControlY}, ${from.x + loopSpan} ${downBaseY}`
				].join(' ');
			}

			return [
				`M ${from.x - loopSpan} ${baseY}`,
				`C ${from.x - 38} ${controlY}, ${from.x + 38} ${controlY}, ${from.x + loopSpan} ${endY}`
			].join(' ');
		}

		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const distance = Math.hypot(dx, dy) || 1;
		const ux = dx / distance;
		const uy = dy / distance;
		const startX = from.x + ux * nodeRadius;
		const startY = from.y + uy * nodeRadius;
		const endX = to.x - ux * nodeRadius;
		const endY = to.y - uy * nodeRadius;

		const curve = edge.curve ?? 0;
		if (curve === 0) {
			return `M ${startX} ${startY} L ${endX} ${endY}`;
		}

		const mx = (startX + endX) / 2;
		const my = (startY + endY) / 2;
		const cx = mx - uy * curve;
		const cy = my + ux * curve;
		return `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`;
	}

	function edgeLabelPos(edge: GraphEdge): { x: number; y: number } {
		if (typeof edge.labelX === 'number' && typeof edge.labelY === 'number') {
			return { x: edge.labelX, y: edge.labelY };
		}

		const from = getNode(edge.from);
		const to = getNode(edge.to);

		if (edge.loop) {
			if (edge.loop === 'down') {
				return { x: from.x, y: from.y + (nodeRadius + 56) };
			}
			return { x: from.x, y: from.y - (nodeRadius + 44) };
		}

		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const distance = Math.hypot(dx, dy) || 1;
		const ux = dx / distance;
		const uy = dy / distance;
		const startX = from.x + ux * nodeRadius;
		const startY = from.y + uy * nodeRadius;
		const endX = to.x - ux * nodeRadius;
		const endY = to.y - uy * nodeRadius;

		const mx = (startX + endX) / 2;
		const my = (startY + endY) / 2;
		const curve = edge.curve ?? 0;
		return {
			x: mx - uy * curve,
			y: my + ux * curve - 9
		};
	}
</script>

{#if mode === 'step'}
	<div class="subset-embed">
		<svg viewBox="0 0 760 210" aria-label="Subset construction step" role="img">
			<defs>
				<marker id="subset-step-arrow" markerWidth="8" markerHeight="7" refX="7.2" refY="3.5" orient="auto" markerUnits="strokeWidth">
					<path d="M0,0 L8,3.5 L0,7 L2.2,3.5 z" fill="rgba(255,255,255,0.72)" stroke="rgba(255,255,255,0.28)" stroke-width="0.5" />
				</marker>
			</defs>

			<rect x="32" y="55" width="194" height="100" rx="10" class="step-box" />
			<text x="129" y="84" text-anchor="middle" class="step-title">Current DFA state</text>
			<text x="129" y="118" text-anchor="middle" class="step-main">S = &#123;q0,q1&#125;</text>

			<rect x="282" y="55" width="194" height="100" rx="10" class="step-box" />
			<text x="379" y="84" text-anchor="middle" class="step-title">Move on symbol b</text>
			<text x="379" y="118" text-anchor="middle" class="step-main">U = &#123;q0,q2&#125;</text>

			<rect x="532" y="55" width="194" height="100" rx="10" class="step-box" />
			<text x="629" y="84" text-anchor="middle" class="step-title">E-closure</text>
			<text x="629" y="118" text-anchor="middle" class="step-main">S' = E(U) = &#123;q0,q2&#125;</text>

			<path d="M226 104 L282 104" class="step-arrow" marker-end="url(#subset-step-arrow)" />
			<path d="M476 104 L532 104" class="step-arrow" marker-end="url(#subset-step-arrow)" />
			<text x="254" y="94" text-anchor="middle" class="step-label">b</text>
			<text x="504" y="94" text-anchor="middle" class="step-label">E</text>
		</svg>
		<p class="step-inline">Example: S = &#123;q0,q1&#125; --b--> U = &#123;q0,q2&#125; --E--> S' = &#123;q0,q2&#125;</p>
	</div>
{:else}
	<div class="subset-embed">
		<svg viewBox="0 0 820 300" aria-label="Subset-construction DFA graph" role="img">
			<defs>
				<marker id="subset-graph-arrow" markerWidth="8" markerHeight="7" refX="7.2" refY="3.5" orient="auto" markerUnits="strokeWidth">
					<path d="M0,0 L8,3.5 L0,7 L2.2,3.5 z" fill="rgba(255,255,255,0.72)" stroke="rgba(255,255,255,0.28)" stroke-width="0.5" />
				</marker>
			</defs>

			{#each graphEdges as edge}
				{@const labelPos = edgeLabelPos(edge)}
				<path d={edgePath(edge)} class="edge" marker-end="url(#subset-graph-arrow)" />
				<text x={labelPos.x} y={labelPos.y} class="edge-label" text-anchor="middle">{edge.label}</text>
			{/each}

			{#each graphNodes as node}
				{#if node.start}
					<line
						x1={node.x - 72}
						y1={node.y}
						x2={node.x - nodeRadius - 2}
						y2={node.y}
						class="start-arrow"
						marker-end="url(#subset-graph-arrow)"
					/>
				{/if}
				<circle cx={node.x} cy={node.y} r={nodeRadius} class="state" />
				{#if node.accept}
					<circle cx={node.x} cy={node.y} r={nodeRadius - 6} class="accept" />
				{/if}
				<text x={node.x} y={node.y + 5} class="state-label" text-anchor="middle">{node.label}</text>
			{/each}
		</svg>
		<p class="graph-key">
			{#each graphNodes as node}
				<span>{node.label} = {node.subset}</span>
			{/each}
		</p>
	</div>
{/if}

<style>
	.subset-embed {
		border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
		border-radius: 8px;
		padding: 0.32rem;
		margin: 0.55rem 0 0.9rem;
		background: rgba(255, 255, 255, 0.01);
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.step-box {
		fill: rgba(255, 255, 255, 0.01);
		stroke: rgba(255, 255, 255, 0.24);
		stroke-width: 1.2;
	}

	.step-title {
		fill: var(--fg-muted);
		font-size: 12.5px;
		font-family: var(--font-sans);
	}

	.step-main {
		fill: var(--fg);
		font-size: 15px;
		font-family: var(--font-mono);
		font-weight: 600;
	}

	.step-arrow {
		fill: none;
		stroke: rgba(255, 255, 255, 0.32);
		stroke-width: 1.7;
	}

	.step-label {
		fill: var(--fg-muted);
		font-size: 12.5px;
		font-family: var(--font-mono);
		font-weight: 600;
	}

	.step-inline {
		margin: 0.2rem 0 0.12rem;
		text-align: center;
		font-size: 12px;
		font-family: var(--font-mono);
		color: var(--fg-muted);
		white-space: nowrap;
		overflow-x: auto;
	}

	.edge {
		fill: none;
		stroke: rgba(255, 255, 255, 0.32);
		stroke-width: 1.6;
	}

	.edge-label {
		fill: var(--fg-muted);
		font-size: 13px;
		font-family: var(--font-mono);
		font-weight: 600;
		paint-order: stroke;
		stroke: rgba(8, 8, 8, 0.75);
		stroke-width: 2.5;
		stroke-linejoin: round;
	}

	.start-arrow {
		stroke: rgba(255, 255, 255, 0.3);
		stroke-width: 1.6;
	}

	.state {
		fill: transparent;
		stroke: rgba(255, 255, 255, 0.36);
		stroke-width: 1.7;
	}

	.accept {
		fill: none;
		stroke: rgba(255, 255, 255, 0.35);
		stroke-width: 1.4;
	}

	.state-label {
		fill: var(--fg);
		font-size: 12px;
		font-family: var(--font-mono);
		font-weight: 600;
	}

	.graph-key {
		margin: 0.12rem 0 0.2rem;
		display: flex;
		justify-content: center;
		gap: 0.9rem;
		flex-wrap: wrap;
		font-size: 11.5px;
		font-family: var(--font-mono);
		color: var(--fg-muted);
	}

	.graph-key span {
		white-space: nowrap;
	}
</style>
