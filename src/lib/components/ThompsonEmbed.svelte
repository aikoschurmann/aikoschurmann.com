<script lang="ts">
	type Mode = 'union' | 'concat' | 'star' | 'epsilon' | 'literal';

	type Node = {
		id: string;
		label: string;
		x: number;
		y: number;
		start?: boolean;
		accept?: boolean;
	};

	type Edge = {
		from: string;
		to: string;
		label: string;
		highlight?: boolean;
		curve?: number;
		labelDy?: number;
	};

	type Fragment = {
		x: number;
		y: number;
		width: number;
		height: number;
		label: string;
	};

	type Diagram = {
		nodes: Node[];
		edges: Edge[];
		fragments: Fragment[];
	};

	const DIAGRAMS: Record<Mode, Diagram> = {
		literal: {
			nodes: [
				{ id: 'qStart', label: 'qS', x: 250, y: 112, start: true },
				{ id: 'qAccept', label: 'qA', x: 410, y: 112, accept: true }
			],
			edges: [{ from: 'qStart', to: 'qAccept', label: 'a', highlight: true }],
			fragments: []
		},
		epsilon: {
			nodes: [
				{ id: 'qStart', label: 'qS', x: 250, y: 112, start: true },
				{ id: 'qAccept', label: 'qA', x: 410, y: 112, accept: true }
			],
			edges: [{ from: 'qStart', to: 'qAccept', label: 'e', highlight: true }],
			fragments: []
		},
		union: {
			nodes: [
				{ id: 'qStart', label: 'qS', x: 90, y: 112, start: true },
				{ id: 'rStart', label: 'rS', x: 252, y: 74 },
				{ id: 'rAccept', label: 'rA', x: 392, y: 74 },
				{ id: 'sStart', label: 'sS', x: 252, y: 152 },
				{ id: 'sAccept', label: 'sA', x: 392, y: 152 },
				{ id: 'qAccept', label: 'qA', x: 560, y: 112, accept: true }
			],
			edges: [
				{ from: 'qStart', to: 'rStart', label: 'e', highlight: true, curve: -16 },
				{ from: 'qStart', to: 'sStart', label: 'e', highlight: true, curve: 16 },
				{ from: 'rAccept', to: 'qAccept', label: 'e', highlight: true, curve: -16 },
				{ from: 'sAccept', to: 'qAccept', label: 'e', highlight: true, curve: 16 }
			],
			fragments: [
				{ x: 206, y: 44, width: 232, height: 60, label: 'NFA(r)' },
				{ x: 206, y: 122, width: 232, height: 60, label: 'NFA(s)' }
			]
		},
		concat: {
			nodes: [
				{ id: 'rStart', label: 'rS', x: 120, y: 112, start: true },
				{ id: 'rAccept', label: 'rA', x: 280, y: 112 },
				{ id: 'sStart', label: 'sS', x: 390, y: 112 },
				{ id: 'sAccept', label: 'sA', x: 550, y: 112, accept: true }
			],
			edges: [{ from: 'rAccept', to: 'sStart', label: 'e', highlight: true }],
			fragments: [
				{ x: 72, y: 76, width: 256, height: 72, label: 'NFA(r)' },
				{ x: 342, y: 76, width: 256, height: 72, label: 'NFA(s)' }
			]
		},
		star: {
			nodes: [
				{ id: 'qStart', label: 'qS', x: 100, y: 112, start: true },
				{ id: 'rStart', label: 'rS', x: 260, y: 112 },
				{ id: 'rAccept', label: 'rA', x: 400, y: 112 },
				{ id: 'qAccept', label: 'qA', x: 560, y: 112, accept: true }
			],
			edges: [
				{ from: 'qStart', to: 'rStart', label: 'e', highlight: true, curve: 0 },
				{ from: 'qStart', to: 'qAccept', label: 'e', highlight: true, curve: -120, labelDy: 42 },
				{ from: 'rAccept', to: 'rStart', label: 'e', highlight: true, curve: -64, labelDy: 10 },
				{ from: 'rAccept', to: 'qAccept', label: 'e', highlight: true, curve: 0 }
			],
			fragments: [{ x: 214, y: 74, width: 232, height: 76, label: 'NFA(r)' }]
		}
	};

	const props = $props<{ mode?: Mode }>();

	const mode = $derived.by<Mode>(() => {
		const candidate = props.mode;
		if (candidate === 'union' || candidate === 'concat' || candidate === 'star' || candidate === 'epsilon' || candidate === 'literal') {
			return candidate;
		}
		return 'union';
	});

	const current = $derived.by<Diagram>(() => DIAGRAMS[mode]);
	const markerId = $derived.by(() => `th-${mode}`);
	const nodeRadius = 22;
	const viewWidth = 660;
	const viewHeight = 220;

	function getNode(id: string): Node {
		return current.nodes.find((n: Node) => n.id === id) as Node;
	}

	function edgePath(edge: Edge): string {
		const from = getNode(edge.from);
		const to = getNode(edge.to);

		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const distance = Math.hypot(dx, dy) || 1;
		const curve = edge.curve ?? 0;

		if (curve === 0) {
			const ux = dx / distance;
			const uy = dy / distance;
			const startX = from.x + ux * nodeRadius;
			const startY = from.y + uy * nodeRadius;
			const endX = to.x - ux * nodeRadius;
			const endY = to.y - uy * nodeRadius;
			return `M ${startX} ${startY} L ${endX} ${endY}`;
		}

		const ux = dx / distance;
		const uy = dy / distance;
		const mx = (from.x + to.x) / 2;
		const my = (from.y + to.y) / 2;
		const cx = mx - uy * curve;
		const cy = my + ux * curve;

		const startTx = cx - from.x;
		const startTy = cy - from.y;
		const startTLen = Math.hypot(startTx, startTy) || 1;
		const endTx = to.x - cx;
		const endTy = to.y - cy;
		const endTLen = Math.hypot(endTx, endTy) || 1;

		const startX = from.x + (startTx / startTLen) * nodeRadius;
		const startY = from.y + (startTy / startTLen) * nodeRadius;
		const endX = to.x - (endTx / endTLen) * nodeRadius;
		const endY = to.y - (endTy / endTLen) * nodeRadius;

		return `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`;
	}

	function edgeLabelPos(edge: Edge): { x: number; y: number } {
		const from = getNode(edge.from);
		const to = getNode(edge.to);

		const mx = (from.x + to.x) / 2;
		const my = (from.y + to.y) / 2;
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const distance = Math.hypot(dx, dy) || 1;
		const curve = edge.curve ?? 0;

		return {
			x: mx - (dy / distance) * curve,
			y: my + (dx / distance) * curve - 10 + (edge.labelDy ?? 0)
		};
	}
</script>

<div class="thompson-embed">
	<svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} aria-label="Thompson construction diagram" role="img">
		<defs>
			<marker id={`${markerId}-arrow`} markerWidth="8" markerHeight="7" refX="7.2" refY="3.5" orient="auto" markerUnits="strokeWidth">
				<path d="M0,0 L8,3.5 L0,7 L2.2,3.5 z" fill="rgba(255,255,255,0.72)" stroke="rgba(255,255,255,0.28)" stroke-width="0.5" />
			</marker>
			<marker id={`${markerId}-arrow-active`} markerWidth="8" markerHeight="7" refX="7.2" refY="3.5" orient="auto" markerUnits="strokeWidth">
				<path d="M0,0 L8,3.5 L0,7 L2.2,3.5 z" fill="color-mix(in srgb, var(--accent) 62%, #fff 38%)" stroke="color-mix(in srgb, var(--accent) 50%, #fff 50%)" stroke-width="0.5" />
			</marker>
		</defs>

		{#each current.fragments as fragment}
			<rect
				x={fragment.x}
				y={fragment.y}
				width={fragment.width}
				height={fragment.height}
				rx="12"
				class="fragment"
			/>
			<text
				x={fragment.x + fragment.width / 2}
				y={fragment.y + fragment.height / 2 + 5}
				text-anchor="middle"
				class="fragment-label"
			>
				{fragment.label}
			</text>
		{/each}

		{#each current.edges as edge}
			{@const labelPos = edgeLabelPos(edge)}
			<path
				d={edgePath(edge)}
				class="edge"
				class:edge-active={edge.highlight}
				marker-end={edge.highlight ? `url(#${markerId}-arrow-active)` : `url(#${markerId}-arrow)`}
			/>
			<text x={labelPos.x} y={labelPos.y} class:edge-label-e={edge.label === 'e'} class="edge-label" text-anchor="middle">{edge.label === 'e' ? 'ε' : edge.label}</text>
		{/each}

		{#each current.nodes as node}
			{#if node.start}
				<line
					x1={node.x - 66}
					y1={node.y}
					x2={node.x - nodeRadius - 1}
					y2={node.y}
					class="start-arrow"
					marker-end={`url(#${markerId}-arrow)`}
				/>
			{/if}
			<circle cx={node.x} cy={node.y} r={nodeRadius} class="state" />
			{#if node.accept}
				<circle cx={node.x} cy={node.y} r={nodeRadius - 5} class="accept-ring" />
			{/if}
			<text x={node.x} y={node.y + 5} text-anchor="middle" class="state-label">{node.label}</text>
		{/each}
	</svg>
</div>

<style>
	.thompson-embed {
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

	.fragment {
		fill: rgba(255, 255, 255, 0.01);
		stroke: rgba(255, 255, 255, 0.24);
		stroke-width: 1.2;
		stroke-dasharray: 5 4;
	}

	.fragment-label {
		fill: var(--fg-muted);
		font-size: 12.5px;
		font-family: var(--font-mono);
	}

	.edge {
		fill: none;
		stroke: rgba(255, 255, 255, 0.32);
		stroke-width: 1.6;
	}

	.edge-active {
		stroke: color-mix(in srgb, var(--accent) 62%, #fff 38%);
		stroke-width: 2;
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

	.edge-label-e {
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 15px;
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

	.accept-ring {
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
</style>
