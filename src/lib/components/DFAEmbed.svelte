<script lang="ts">
	type DFATransitions = Record<string, Record<string, string>>;

	type DFAConfig = {
		states: string[];
		alphabet: string[];
		start: string;
		accepting: string[];
		transitions: DFATransitions;
	};

	type Edge = {
		from: string;
		to: string;
		label: string;
		self: boolean;
		bidirectional: boolean;
	};

	const DEFAULT_DFA: DFAConfig = {
		states: ['q0', 'q1', 'qd'],
		alphabet: ['a', 'b'],
		start: 'q0',
		accepting: ['q1'],
		transitions: {
			q0: { a: 'q1', b: 'qd' },
			q1: { a: 'qd', b: 'q1' },
			qd: { a: 'qd', b: 'qd' }
		}
	};

	let {
		dfa = DEFAULT_DFA,
		presetInputs = ['a', 'ab', 'abbb', 'b', 'aba', '']
	} = $props<{
		dfa?: DFAConfig;
		presetInputs?: string[];
	}>();

	function normalizeDFA(raw: DFAConfig): DFAConfig | null {
		const states = Array.from(new Set((raw.states ?? []).map((s) => s.trim()).filter(Boolean)));
		const alphabet = Array.from(new Set((raw.alphabet ?? []).map((s) => s.trim()).filter(Boolean)));
		const start = raw.start?.trim();
		const accepting = Array.from(new Set((raw.accepting ?? []).map((s) => s.trim()).filter(Boolean)));

		if (states.length === 0 || !start || !states.includes(start)) return null;
		if (accepting.some((s) => !states.includes(s))) return null;

		const transitions: DFATransitions = {};
		for (const state of states) {
			transitions[state] = {};
			for (const symbol of alphabet) {
				const target = raw.transitions?.[state]?.[symbol]?.trim();
				if (!target) continue;
				if (!states.includes(target)) return null;
				transitions[state][symbol] = target;
			}
		}

		return { states, alphabet, start, accepting, transitions };
	}

	let dfaConfig = $state<DFAConfig>(DEFAULT_DFA);

	const svgWidth = $derived.by(() => Math.max(760, dfaConfig.states.length * 160));
	const svgHeight = $derived.by(() => (dfaConfig.states.length > 7 ? 420 : 340));
	const nodeRadius = 27;

	let sourceInput = $state('abbb');
	let consumedInput = $state<string[]>([]);
	let remainingInput = $state<string[]>([]);
	let currentState = $state('');
	let runResult = $state<'idle' | 'accepted' | 'rejected'>('idle');
	let history = $state<string[]>([]);
	let lastTransition = $state<{ from: string; to: string; symbol: string } | null>(null);
	let dfaText = $state(JSON.stringify(DEFAULT_DFA, null, 2));
	let dfaError = $state('');
	let showDFAEditor = $state(false);

	$effect(() => {
		const normalized = normalizeDFA(dfa);
		if (!normalized) return;

		dfaConfig = normalized;
		if (!showDFAEditor) {
			dfaText = JSON.stringify(normalized, null, 2);
		}

		if (currentState === '') {
			reset(sourceInput);
		}
	});

	const singleCharAlphabet = $derived.by(() => dfaConfig.alphabet.every((s) => s.length === 1));

	const positions = $derived.by(() => {
		const count = dfaConfig.states.length;
		const centerX = svgWidth / 2;
		const centerY = svgHeight / 2 + 4;

		if (count === 3) {
			const spread = 200;
			const topY = centerY - 88;
			const bottomY = centerY + 86;
			return {
				[dfaConfig.states[0]]: { x: centerX, y: topY },
				[dfaConfig.states[1]]: { x: centerX - spread, y: bottomY },
				[dfaConfig.states[2]]: { x: centerX + spread, y: bottomY }
			} as Record<string, { x: number; y: number }>;
		}

		const maxRadiusX = svgWidth / 2 - (nodeRadius + 78);
		const maxRadiusY = svgHeight / 2 - (nodeRadius + 70);
		const idealRadius = 92 + count * 10;
		const ringRadius = Math.max(72, Math.min(idealRadius, maxRadiusX, maxRadiusY));
		const result: Record<string, { x: number; y: number }> = {};

		dfaConfig.states.forEach((state, index) => {
			const angle = -Math.PI / 2 + (index / count) * 2 * Math.PI;
			result[state] = {
				x: centerX + ringRadius * Math.cos(angle),
				y: centerY + ringRadius * Math.sin(angle)
			};
		});

		return result;
	});

	const edges = $derived.by(() => {
		const grouped = new Map<string, string[]>();

		for (const from of dfaConfig.states) {
			for (const symbol of dfaConfig.alphabet) {
				const to = dfaConfig.transitions[from]?.[symbol];
				if (!to) continue;

				const key = `${from}-->${to}`;
				const existing = grouped.get(key) ?? [];
				existing.push(symbol);
				grouped.set(key, existing);
			}
		}

		return Array.from(grouped.entries()).map(([key, labels]) => {
			const [from, to] = key.split('-->');
			return {
				from,
				to,
				label: labels.join(','),
				self: from === to,
				bidirectional: from !== to && grouped.has(`${to}-->${from}`)
			} satisfies Edge;
		});
	});

	function isAccepting(state: string): boolean {
		return dfaConfig.accepting.includes(state);
	}

	function tokenizeInput(input: string): string[] {
		const trimmed = input.trim();
		if (trimmed === '') return [];

		if (singleCharAlphabet && !/[\s,]/.test(trimmed)) {
			return trimmed.split('');
		}

		return trimmed.split(/[\s,]+/).filter(Boolean);
	}

	function reset(input: string = sourceInput): void {
		sourceInput = input;
		consumedInput = [];
		remainingInput = tokenizeInput(input);
		currentState = dfaConfig.start;
		history = [dfaConfig.start];
		runResult = 'idle';
		lastTransition = null;
	}

	function consume(symbol: string): void {
		const from = currentState;
		const next = dfaConfig.transitions[from]?.[symbol];

		consumedInput = [...consumedInput, symbol];
		remainingInput = remainingInput.slice(1);

		if (!next) {
			runResult = 'rejected';
			lastTransition = { from, to: from, symbol };
			return;
		}

		currentState = next;
		history = [...history, next];
		lastTransition = { from, to: next, symbol };

		if (remainingInput.length === 0) {
			runResult = isAccepting(currentState) ? 'accepted' : 'rejected';
		} else {
			runResult = 'idle';
		}
	}

	function step(): void {
		if (runResult === 'accepted' || runResult === 'rejected') return;

		if (remainingInput.length === 0) {
			runResult = isAccepting(currentState) ? 'accepted' : 'rejected';
			return;
		}

		const symbol = remainingInput[0];
		if (!dfaConfig.alphabet.includes(symbol)) {
			consumedInput = [...consumedInput, symbol];
			remainingInput = remainingInput.slice(1);
			runResult = 'rejected';
			return;
		}

		consume(symbol);
	}

	function runAll(): void {
		if (runResult === 'accepted' || runResult === 'rejected') return;

		while (remainingInput.length > 0 && runResult !== 'rejected') {
			step();
			if (runResult === 'accepted' || runResult === 'rejected') break;
		}

		if (remainingInput.length === 0 && runResult === 'idle') {
			runResult = isAccepting(currentState) ? 'accepted' : 'rejected';
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

	function edgeIsActive(edge: Edge): boolean {
		if (!lastTransition) return false;
		if (edge.from !== lastTransition.from || edge.to !== lastTransition.to) return false;
		return edge.label.split(',').includes(lastTransition.symbol);
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

	function applyDFAFromText(): void {
		dfaError = '';
		try {
			const parsed = JSON.parse(dfaText) as DFAConfig;
			const normalized = normalizeDFA(parsed);
			if (!normalized) {
				dfaError = 'Invalid DFA: check states, start state, accepting states, and transition targets.';
				return;
			}

			dfaConfig = normalized;
			const example = normalized.alphabet.length <= 2 && normalized.alphabet.every((s) => s.length === 1)
				? normalized.alphabet.join('').repeat(2)
				: normalized.alphabet.join(' ');
			reset(example);
		} catch {
			dfaError = 'Could not parse JSON. Check commas, quotes, and braces.';
		}
	}

	reset('abbb');
</script>

<div class="dfa-embed">
	<div class="graph-wrap">
		<svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} aria-label="DFA state graph" role="img">
			<defs>
				<marker id="dfa-arrow" markerWidth="8" markerHeight="7" refX="7.4" refY="3.5" orient="auto" markerUnits="strokeWidth">
					<path d="M0,0 L8,3.5 L0,7 L2.3,3.5 z" fill="rgba(255,255,255,0.72)" stroke="rgba(255,255,255,0.28)" stroke-width="0.55" />
				</marker>
			</defs>

			{#each edges as edge}
				{@const labelPos = edgeLabelPosition(edge)}
				<path
					d={edgePath(edge)}
					class:active-edge={edgeIsActive(edge)}
					class="edge"
					marker-end="url(#dfa-arrow)"
				/>
				<text x={labelPos.x} y={labelPos.y} class="edge-label" text-anchor="middle">{edge.label}</text>
			{/each}

			{#each dfaConfig.states as state}
				{@const pos = positions[state]}
				{#if state === dfaConfig.start}
					<line
						x1={pos.x - 64}
						y1={pos.y}
						x2={pos.x - nodeRadius - 6}
						y2={pos.y}
						class="start-arrow"
						marker-end="url(#dfa-arrow)"
					/>
				{/if}
				<circle cx={pos.x} cy={pos.y} r={nodeRadius} class:current={state === currentState} class="state" />
				{#if isAccepting(state)}
					<circle cx={pos.x} cy={pos.y} r={nodeRadius - 6} class="accept" />
				{/if}
				<text x={pos.x} y={pos.y + 5} class="state-label" text-anchor="middle">{state}</text>
			{/each}
		</svg>
	</div>

	<div class="controls">
		<div class="input-row">
			<label for="dfa-input">Input string</label>
			<input
				id="dfa-input"
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
				{#each dfaConfig.alphabet as symbol}
					<button type="button" class="symbol" onclick={() => appendSymbol(symbol)}>{symbol}</button>
				{/each}
				{#each presetInputs as sample}
					<button type="button" class="sample" onclick={() => reset(sample)}>
						{sample === '' ? 'epsilon' : sample}
					</button>
				{/each}
			</div>
		</details>

		<details class="extras" bind:open={showDFAEditor}>
			<summary>DFA JSON</summary>
			<div class="dfa-editor">
				<textarea bind:value={dfaText} spellcheck="false"></textarea>
				<div class="editor-actions">
					<button type="button" onclick={applyDFAFromText}>Apply DFA</button>
					<button type="button" class="ghost" onclick={() => (dfaText = JSON.stringify(dfaConfig, null, 2))}>Reset JSON</button>
				</div>
				{#if dfaError}
					<p class="dfa-error">{dfaError}</p>
				{/if}
			</div>
		</details>
	</div>

	<div class="trace">
		<p><strong>Status:</strong> {runResult}</p>
		<p><strong>Consumed:</strong> {consumedInput.length === 0 ? 'epsilon' : consumedInput.join(singleCharAlphabet ? '' : ' ')}</p>
		<p><strong>Remaining:</strong> {remainingInput.length === 0 ? 'epsilon' : remainingInput.join(singleCharAlphabet ? '' : ' ')}</p>
		<p><strong>Active states:</strong> {currentState === '' ? '{}' : `{${currentState}}`}{isAccepting(currentState) ? ' (accepting)' : ''}</p>
		<p><strong>Path:</strong> {history.length === 0 ? '{}' : history.map((s) => `{${s}}`).join(' -> ')}</p>
	</div>
</div>

<style>
	.dfa-embed {
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 1rem;
		margin: 1.25rem 0 1.5rem;
		background: rgba(255, 255, 255, 0.02);
	}

	.graph-wrap {
		margin-top: 0.7rem;
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
		grid-template-columns: auto 1fr auto;
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

	.dfa-editor {
		display: grid;
		gap: 0.4rem;
		margin-top: 0.35rem;
	}

	.dfa-editor textarea {
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

	.dfa-error {
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
