<script lang="ts">
	type NFATransitions = Record<string, Record<string, string[]>>;

	type NFAConfig = {
		states: string[];
		alphabet: string[];
		start: string;
		accepting: string[];
		transitions: NFATransitions;
	};

	type Edge = {
		from: string;
		to: string;
		label: string;
		self: boolean;
		bidirectional: boolean;
	};

	type TransitionStep = {
		from: string;
		to: string;
		symbol: string;
	};

	const EPSILON = 'e';

	const DEFAULT_NFA: NFAConfig = {
		states: ['q0', 'q1', 'q2'],
		alphabet: ['a', 'b'],
		start: 'q0',
		accepting: ['q2'],
		transitions: {
			q0: { a: ['q0', 'q1'], b: ['q0'] },
			q1: { b: ['q2'] },
			q2: { a: ['q2'], b: ['q2'] }
		}
	};

	let {
		nfa = DEFAULT_NFA,
		presetInputs = ['ab', 'aab', 'bbb', 'aba', '']
	} = $props<{
		nfa?: NFAConfig;
		presetInputs?: string[];
	}>();

	function normalizeNFA(raw: NFAConfig): NFAConfig | null {
		const states = Array.from(new Set((raw.states ?? []).map((s) => s.trim()).filter(Boolean)));
		const alphabet = Array.from(new Set((raw.alphabet ?? []).map((s) => s.trim()).filter(Boolean)));
		const start = raw.start?.trim();
		const accepting = Array.from(new Set((raw.accepting ?? []).map((s) => s.trim()).filter(Boolean)));

		if (states.length === 0 || !start || !states.includes(start)) return null;
		if (accepting.some((s) => !states.includes(s))) return null;

		const transitions: NFATransitions = {};
		for (const state of states) {
			transitions[state] = {};
			const row = raw.transitions?.[state] ?? {};
			for (const [symbolRaw, targetsRaw] of Object.entries(row)) {
				const symbol = symbolRaw.trim();
				if (!symbol) continue;
				if (symbol !== EPSILON && !alphabet.includes(symbol)) continue;
				if (!Array.isArray(targetsRaw)) return null;
				const targets = Array.from(new Set(targetsRaw.map((s) => s.trim()).filter(Boolean)));
				if (targets.some((t) => !states.includes(t))) return null;
				if (targets.length > 0) {
					transitions[state][symbol] = targets;
				}
			}
		}

		return { states, alphabet, start, accepting, transitions };
	}

	function sortedStateArray(states: Set<string>): string[] {
		return [...states].sort((a, b) => a.localeCompare(b));
	}

	function formatStateSet(states: string[]): string {
		return `{${states.join(', ')}}`;
	}

	let nfaConfig = $state<NFAConfig>(DEFAULT_NFA);

	const svgWidth = $derived.by(() => Math.max(760, nfaConfig.states.length * 160));
	const svgHeight = $derived.by(() => (nfaConfig.states.length > 7 ? 420 : 340));
	const nodeRadius = 27;

	let sourceInput = $state('aab');
	let consumedInput = $state<string[]>([]);
	let remainingInput = $state<string[]>([]);
	let currentStates = $state<string[]>([]);
	let runResult = $state<'idle' | 'accepted' | 'rejected'>('idle');
	let history = $state<string[]>([]);
	let lastTransitions = $state<TransitionStep[]>([]);
	let nfaText = $state(JSON.stringify(DEFAULT_NFA, null, 2));
	let nfaError = $state('');
	let showNFAEditor = $state(false);

	$effect(() => {
		const normalized = normalizeNFA(nfa);
		if (!normalized) return;

		nfaConfig = normalized;
		if (!showNFAEditor) {
			nfaText = JSON.stringify(normalized, null, 2);
		}

		if (currentStates.length === 0) {
			reset(sourceInput);
		}
	});

	const singleCharAlphabet = $derived.by(() => nfaConfig.alphabet.every((s) => s.length === 1));

	const positions = $derived.by(() => {
		const count = nfaConfig.states.length;
		const centerX = svgWidth / 2;
		const centerY = svgHeight / 2 + 4;

		if (count === 3) {
			const spread = 200;
			const topY = centerY - 88;
			const bottomY = centerY + 86;
			return {
				[nfaConfig.states[0]]: { x: centerX, y: topY },
				[nfaConfig.states[1]]: { x: centerX - spread, y: bottomY },
				[nfaConfig.states[2]]: { x: centerX + spread, y: bottomY }
			} as Record<string, { x: number; y: number }>;
		}

		const maxRadiusX = svgWidth / 2 - (nodeRadius + 78);
		const maxRadiusY = svgHeight / 2 - (nodeRadius + 70);
		const idealRadius = 92 + count * 10;
		const ringRadius = Math.max(72, Math.min(idealRadius, maxRadiusX, maxRadiusY));
		const result: Record<string, { x: number; y: number }> = {};

		nfaConfig.states.forEach((state, index) => {
			const angle = -Math.PI / 2 + (index / count) * 2 * Math.PI;
			result[state] = {
				x: centerX + ringRadius * Math.cos(angle),
				y: centerY + ringRadius * Math.sin(angle)
			};
		});

		return result;
	});

	const edges = $derived.by(() => {
		const grouped = new Map<string, Set<string>>();

		for (const from of nfaConfig.states) {
			const row = nfaConfig.transitions[from] ?? {};
			for (const [symbol, targets] of Object.entries(row)) {
				for (const to of targets) {
					const key = `${from}-->${to}`;
					const labels = grouped.get(key) ?? new Set<string>();
					labels.add(symbol);
					grouped.set(key, labels);
				}
			}
		}

		return Array.from(grouped.entries()).map(([key, labels]) => {
			const [from, to] = key.split('-->');
			return {
				from,
				to,
				label: [...labels].sort().join(','),
				self: from === to,
				bidirectional: from !== to && grouped.has(`${to}-->${from}`)
			} satisfies Edge;
		});
	});

	function tokenizeInput(input: string): string[] {
		const trimmed = input.trim();
		if (trimmed === '') return [];

		if (singleCharAlphabet && !/[\s,]/.test(trimmed)) {
			return trimmed.split('');
		}

		return trimmed.split(/[\s,]+/).filter(Boolean);
	}

	function epsilonClosure(seed: Set<string>): { states: Set<string>; edges: TransitionStep[] } {
		const closure = new Set(seed);
		const queue = [...seed];
		const traversed: TransitionStep[] = [];

		while (queue.length > 0) {
			const from = queue.shift() as string;
			const epsTargets = nfaConfig.transitions[from]?.[EPSILON] ?? [];
			for (const to of epsTargets) {
				traversed.push({ from, to, symbol: EPSILON });
				if (!closure.has(to)) {
					closure.add(to);
					queue.push(to);
				}
			}
		}

		return { states: closure, edges: traversed };
	}

	function isAcceptingStateSet(states: string[]): boolean {
		return states.some((s) => nfaConfig.accepting.includes(s));
	}

	function reset(input: string = sourceInput): void {
		sourceInput = input;
		consumedInput = [];
		remainingInput = tokenizeInput(input);
		const startClosure = epsilonClosure(new Set([nfaConfig.start]));
		currentStates = sortedStateArray(startClosure.states);
		history = [formatStateSet(currentStates)];
		runResult = 'idle';
		lastTransitions = [];
	}

	function finalizeIfDone(): void {
		if (remainingInput.length > 0) return;
		runResult = isAcceptingStateSet(currentStates) ? 'accepted' : 'rejected';
	}

	function step(): void {
		if (runResult === 'accepted' || runResult === 'rejected') return;

		if (remainingInput.length === 0) {
			finalizeIfDone();
			return;
		}

		const symbol = remainingInput[0];
		consumedInput = [...consumedInput, symbol];
		remainingInput = remainingInput.slice(1);

		if (!nfaConfig.alphabet.includes(symbol)) {
			currentStates = [];
			lastTransitions = [];
			runResult = 'rejected';
			history = [...history, '{}'];
			return;
		}

		const move = new Set<string>();
		const directEdges: TransitionStep[] = [];

		for (const from of currentStates) {
			const targets = nfaConfig.transitions[from]?.[symbol] ?? [];
			for (const to of targets) {
				move.add(to);
				directEdges.push({ from, to, symbol });
			}
		}

		const closure = epsilonClosure(move);
		currentStates = sortedStateArray(closure.states);
		lastTransitions = [...directEdges, ...closure.edges];
		history = [...history, formatStateSet(currentStates)];

		if (currentStates.length === 0) {
			runResult = 'rejected';
			return;
		}

		if (remainingInput.length === 0) {
			finalizeIfDone();
		}
	}

	function runAll(): void {
		if (runResult === 'accepted' || runResult === 'rejected') return;

		while (remainingInput.length > 0 && runResult === 'idle') {
			step();
		}

		if (runResult === 'idle') {
			finalizeIfDone();
		}
	}

	function appendSymbol(symbol: string): void {
		if (sourceInput.trim() === '') {
			sourceInput = symbol;
		} else if (singleCharAlphabet) {
			sourceInput += symbol;
		} else {
			sourceInput = `${sourceInput.trim()} ${symbol}`;
		}
		reset(sourceInput);
	}

	function clearInput(): void {
		reset('');
	}

	function edgePath(edge: Edge): string {
		const from = positions[edge.from];
		const to = positions[edge.to];

		if (!from || !to) return '';

		if (edge.self) {
			const loopSpan = 18;
			const loopRise = 40;
			return [
				`M ${from.x - loopSpan} ${from.y - nodeRadius + 1}`,
				`C ${from.x - 34} ${from.y - nodeRadius - loopRise}, ${from.x + 34} ${from.y - nodeRadius - loopRise}, ${from.x + loopSpan} ${from.y - nodeRadius + 1}`
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

		const mx = (startX + endX) / 2;
		const my = (startY + endY) / 2;
		const perpX = -uy;
		const perpY = ux;
		const curve = edge.bidirectional ? 26 : 0;
		const direction = edge.from < edge.to ? 1 : -1;
		const cx = mx + perpX * curve * direction;
		const cy = my + perpY * curve * direction;

		return `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`;
	}

	function edgeLabelPosition(edge: Edge): { x: number; y: number } {
		const from = positions[edge.from];
		const to = positions[edge.to];

		if (!from || !to) return { x: 0, y: 0 };

		if (edge.self) {
			return { x: from.x, y: from.y - (nodeRadius + 42) };
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
		const perpX = -uy;
		const perpY = ux;
		const curve = edge.bidirectional ? 26 : 0;
		const direction = edge.from < edge.to ? 1 : -1;

		return {
			x: mx + perpX * curve * direction,
			y: my + perpY * curve * direction - 10
		};
	}

	function stateIsActive(state: string): boolean {
		return currentStates.includes(state);
	}

	function edgeIsActive(edge: Edge): boolean {
		if (lastTransitions.length === 0) return false;
		const labels = edge.label.split(',');
		return lastTransitions.some((t) => t.from === edge.from && t.to === edge.to && labels.includes(t.symbol));
	}

	function applyNFAFromText(): void {
		nfaError = '';
		try {
			const parsed = JSON.parse(nfaText) as NFAConfig;
			const normalized = normalizeNFA(parsed);
			if (!normalized) {
				nfaError = 'Invalid NFA: verify states, alphabet, accepting set, and transition targets.';
				return;
			}

			nfaConfig = normalized;
			const example = normalized.alphabet.length <= 2 && normalized.alphabet.every((s) => s.length === 1)
				? normalized.alphabet.join('').repeat(2)
				: normalized.alphabet.join(' ');
			reset(example);
		} catch {
			nfaError = 'Could not parse JSON. Check commas, quotes, and braces.';
		}
	}

	reset('aab');
</script>

<div class="nfa-embed">
	<div class="graph-wrap">
		<svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} aria-label="NFA state graph" role="img">
			<defs>
				<marker id="nfa-arrow" markerWidth="8" markerHeight="7" refX="7.4" refY="3.5" orient="auto" markerUnits="strokeWidth">
					<path d="M0,0 L8,3.5 L0,7 L2.3,3.5 z" fill="rgba(255,255,255,0.72)" stroke="rgba(255,255,255,0.28)" stroke-width="0.55" />
				</marker>
			</defs>

			{#each edges as edge}
				{@const labelPos = edgeLabelPosition(edge)}
				<path
					d={edgePath(edge)}
					class:active-edge={edgeIsActive(edge)}
					class="edge"
					marker-end="url(#nfa-arrow)"
				/>
				<text x={labelPos.x} y={labelPos.y} class="edge-label" text-anchor="middle">{edge.label}</text>
			{/each}

			{#each nfaConfig.states as state}
				{@const pos = positions[state]}
				{#if state === nfaConfig.start}
					<line
						x1={pos.x - 64}
						y1={pos.y}
						x2={pos.x - nodeRadius - 6}
						y2={pos.y}
						class="start-arrow"
						marker-end="url(#nfa-arrow)"
					/>
				{/if}
				<circle cx={pos.x} cy={pos.y} r={nodeRadius} class:current={stateIsActive(state)} class="state" />
				{#if nfaConfig.accepting.includes(state)}
					<circle cx={pos.x} cy={pos.y} r={nodeRadius - 6} class="accept" />
				{/if}
				<text x={pos.x} y={pos.y + 5} class="state-label" text-anchor="middle">{state}</text>
			{/each}
		</svg>
	</div>

	<div class="controls">
		<div class="input-row">
			<label for="nfa-input">Input string</label>
			<input
				id="nfa-input"
				type="text"
				bind:value={sourceInput}
				spellcheck="false"
				autocomplete="off"
				oninput={() => reset(sourceInput)}
			/>
		</div>

		<div class="button-row">
			<button type="button" onclick={step}>Step</button>
			<button type="button" onclick={runAll}>Run All</button>
			<button type="button" class="ghost" onclick={() => reset(sourceInput)}>Reset</button>
			<button type="button" class="ghost" onclick={clearInput}>Clear</button>
		</div>

		<details class="extras">
			<summary>Shortcuts</summary>
			<div class="quick-input">
				{#each nfaConfig.alphabet as symbol}
					<button type="button" class="symbol" onclick={() => appendSymbol(symbol)}>{symbol}</button>
				{/each}
				{#each presetInputs as sample}
					<button type="button" class="sample" onclick={() => reset(sample)}>
						{sample === '' ? 'epsilon' : sample}
					</button>
				{/each}
			</div>
		</details>

		<details class="extras" bind:open={showNFAEditor}>
			<summary>NFA JSON</summary>
			<div class="nfa-editor">
				<textarea bind:value={nfaText} spellcheck="false"></textarea>
				<div class="editor-actions">
					<button type="button" onclick={applyNFAFromText}>Apply NFA</button>
					<button type="button" class="ghost" onclick={() => (nfaText = JSON.stringify(nfaConfig, null, 2))}>Reset JSON</button>
				</div>
				{#if nfaError}
					<p class="nfa-error">{nfaError}</p>
				{/if}
			</div>
		</details>
	</div>

	<div class="trace">
		<p><strong>Status:</strong> {runResult}</p>
		<p><strong>Consumed:</strong> {consumedInput.length === 0 ? 'epsilon' : consumedInput.join(singleCharAlphabet ? '' : ' ')}</p>
		<p><strong>Remaining:</strong> {remainingInput.length === 0 ? 'epsilon' : remainingInput.join(singleCharAlphabet ? '' : ' ')}</p>
		<p><strong>Active states:</strong> {currentStates.length === 0 ? '{}' : formatStateSet(currentStates)}</p>
		<p><strong>Path:</strong> {history.join(' -> ')}</p>
	</div>
</div>

<style>
	.nfa-embed {
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 1rem;
		margin: 1.25rem 0 1.5rem;
		background: rgba(255, 255, 255, 0.02);
	}

	.graph-wrap {
		margin-top: 0.2rem;
		padding: 0.35rem;
		border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.015);
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.edge {
		fill: none;
		stroke: rgba(255, 255, 255, 0.28);
		stroke-width: 1.6;
		transition: stroke 0.15s ease;
	}

	.active-edge {
		stroke: color-mix(in srgb, var(--accent) 62%, #fff 38%);
		stroke-width: 2;
	}

	.edge-label {
		font-size: 14px;
		fill: var(--fg-muted);
		font-family: var(--font-mono);
		font-weight: 500;
	}

	.start-arrow {
		stroke: rgba(255, 255, 255, 0.3);
		stroke-width: 1.6;
	}

	.state {
		fill: transparent;
		stroke: rgba(255, 255, 255, 0.36);
		stroke-width: 1.7;
		transition: fill 0.15s ease, stroke 0.15s ease;
	}

	.state.current {
		fill: color-mix(in srgb, var(--accent) 10%, transparent);
		stroke: color-mix(in srgb, var(--accent) 68%, #fff 32%);
	}

	.accept {
		fill: none;
		stroke: rgba(255, 255, 255, 0.35);
		stroke-width: 1.5;
	}

	.state-label {
		fill: var(--fg);
		font-size: 15px;
		font-family: var(--font-mono);
		font-weight: 600;
	}

	.controls {
		margin-top: 0.75rem;
		display: grid;
		gap: 0.5rem;
	}

	.input-row {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.6rem;
		align-items: center;
	}

	.input-row label {
		font-size: 0.86rem;
		color: var(--fg-muted);
		font-family: var(--font-sans);
	}

	.input-row input {
		width: 100%;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: rgba(255, 255, 255, 0.02);
		color: var(--fg);
		padding: 0.42rem 0.58rem;
		font-family: var(--font-mono);
		font-size: 0.9rem;
	}

	.button-row,
	.quick-input {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.quick-input {
		padding-top: 0.15rem;
	}

	button {
		border-radius: 6px;
		border: 1px solid var(--border);
		background: rgba(255, 255, 255, 0.02);
		color: var(--fg);
		padding: 0.34rem 0.56rem;
		font-size: 0.8rem;
		font-family: var(--font-mono);
		cursor: pointer;
		transition: border-color 0.15s ease, color 0.15s ease;
	}

	button:hover {
		border-color: color-mix(in srgb, var(--accent) 40%, var(--border) 60%);
		color: color-mix(in srgb, var(--accent) 50%, var(--fg) 50%);
	}

	button.ghost {
		color: var(--fg-muted);
	}

	button.symbol {
		font-weight: 700;
		min-width: 2rem;
	}

	.nfa-editor {
		display: grid;
		gap: 0.4rem;
		margin-top: 0.35rem;
	}

	.nfa-editor textarea {
		width: 100%;
		min-height: 180px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: rgba(255, 255, 255, 0.02);
		color: var(--fg);
		padding: 0.5rem;
		font-size: 0.8rem;
		line-height: 1.35;
		font-family: var(--font-mono);
		resize: vertical;
	}

	.editor-actions {
		display: flex;
		gap: 0.45rem;
		flex-wrap: wrap;
	}

	.nfa-error {
		margin: 0;
		font-size: 0.8rem;
		color: #fca5a5;
	}

	.extras {
		border-top: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
		padding-top: 0.35rem;
	}

	.extras summary {
		cursor: pointer;
		font-size: 0.8rem;
		font-family: var(--font-mono);
		color: var(--fg-muted);
		list-style: none;
	}

	.extras summary::-webkit-details-marker {
		display: none;
	}

	.extras summary::before {
		content: '+ ';
	}

	.extras[open] summary::before {
		content: '- ';
	}

	.trace {
		margin-top: 0.65rem;
		border-top: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
		padding-top: 0.55rem;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.35rem 0.75rem;
	}

	.trace p {
		margin: 0;
		font-size: 0.8rem;
		color: var(--fg-muted);
		font-family: var(--font-sans);
	}

	.trace strong {
		color: var(--fg);
	}

	@media (max-width: 900px) {
		.input-row {
			grid-template-columns: 1fr;
		}

		.trace {
			grid-template-columns: 1fr;
		}
	}
</style>
