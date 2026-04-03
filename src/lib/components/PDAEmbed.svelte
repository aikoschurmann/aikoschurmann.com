<script lang="ts">
	import { untrack } from 'svelte';

	type PDATransitions = Record<string, Array<{
		input: string;
		pop: string;
		to: string;
		push: string[];
	}>>;

	type PDAConfig = {
		states: string[];
		alphabet: string[];
		stackAlphabet: string[];
		start: string;
		accepting: string[];
		transitions: PDATransitions;
	};

	type Edge = {
		from: string;
		to: string;
		label: string;
		self: boolean;
		bidirectional: boolean;
	};

	const DEFAULT_PDA: PDAConfig = {
		states: ['q0', 'q1', 'q2'],
		alphabet: ['a', 'b'],
		stackAlphabet: ['A', 'Z'],
		start: 'q0',
		accepting: ['q2'],
		transitions: {
			q0: [
				{ input: 'a', pop: 'Z', to: 'q0', push: ['A', 'Z'] },
				{ input: 'a', pop: 'A', to: 'q0', push: ['A', 'A'] },
				{ input: 'b', pop: 'A', to: 'q1', push: [] }
			],
			q1: [
				{ input: 'b', pop: 'A', to: 'q1', push: [] },
				{ input: 'epsilon', pop: 'Z', to: 'q2', push: ['Z'] }
			],
			q2: []
		}
	};

	let {
		config = DEFAULT_PDA,
		presetInputs = ['ab', 'aabb', 'aaabbb', 'b', 'aba', '']
	} = $props<{
		config?: PDAConfig;
		presetInputs?: string[];
	}>();

	let pdaConfig = $state<PDAConfig>(DEFAULT_PDA);
	const nodeRadius = 27;
	
	const svgWidth = $derived.by(() => Math.max(760, pdaConfig.states.length * 160));
	const svgHeight = $derived.by(() => (pdaConfig.states.length > 7 ? 480 : 400));

	let sourceInput = $state('aabb');
	let consumedInput = $state<string[]>([]);
	let remainingInput = $state<string[]>([]);
	let currentState = $state('');
	let stack = $state<string[]>(['Z']);
	let runResult: 'idle' | 'accepted' | 'rejected' = $state('idle');
	
  let history = $state<Array<{
    state: string;
    stack: string[];
    consumed: string[];
    remaining: string[];
    lastTrans: { from: string; idx: number } | null;
  }>>([]);

	let lastTransitionIdx = $state<number | null>(null);
	let lastTransitionFrom = $state<string | null>(null);

	$effect(() => {
		pdaConfig = config;
		if (currentState === '') {
			reset(sourceInput);
		}
	});

	const positions = $derived.by(() => {
		const count = pdaConfig.states.length;
		const centerX = svgWidth / 2;
		const centerY = svgHeight / 2 + 20;

		if (count === 3) {
			const spread = 200;
			return {
				[pdaConfig.states[0]]: { x: centerX, y: centerY - 100 },
				[pdaConfig.states[1]]: { x: centerX - spread, y: centerY + 80 },
				[pdaConfig.states[2]]: { x: centerX + spread, y: centerY + 80 }
			};
		}

		const maxRadiusX = svgWidth / 2 - (nodeRadius + 80);
		const maxRadiusY = svgHeight / 2 - (nodeRadius + 100);
		const idealRadius = 92 + count * 10;
		const ringRadius = Math.max(72, Math.min(idealRadius, maxRadiusX, maxRadiusY));
		const result: Record<string, { x: number; y: number }> = {};

		pdaConfig.states.forEach((state, index) => {
			const angle = -Math.PI / 2 + (index / count) * 2 * Math.PI;
			result[state] = {
				x: centerX + ringRadius * Math.cos(angle),
				y: centerY + ringRadius * Math.sin(angle)
			};
		});
		return result;
	});

	const edges = $derived.by(() => {
		const result: Edge[] = [];
		for (const from of pdaConfig.states) {
			const transList = pdaConfig.transitions[from] || [];
			const grouped = new Map<string, string[]>();
			
			for (const t of transList) {
				const label = `${t.input},${t.pop}→${t.push.length === 0 ? 'ε' : t.push.join('')}`;
				const existing = grouped.get(t.to) ?? [];
				existing.push(label);
				grouped.set(t.to, existing);
			}

			for (const [to, labels] of grouped.entries()) {
				result.push({
					from,
					to,
					label: labels.join(' | '),
					self: from === to,
					bidirectional: from !== to && (pdaConfig.transitions[to]?.some(t => t.to === from) ?? false)
				});
			}
		}
		return result;
	});

	function reset(input: string = sourceInput): void {
		sourceInput = input;
		consumedInput = [];
		remainingInput = input.split('').filter(Boolean);
		currentState = pdaConfig.start;
		stack = ['Z'];
		runResult = 'idle';
		lastTransitionIdx = null;
		lastTransitionFrom = null;
    history = [];
	}

  function applyTransition(trans: any, idx: number): void {
		if (runResult === 'accepted' || runResult === 'rejected') return;

    history = [...history, {
      state: currentState,
      stack: [...stack],
      consumed: [...consumedInput],
      remaining: [...remainingInput],
      lastTrans: lastTransitionFrom !== null && lastTransitionIdx !== null ? { from: lastTransitionFrom, idx: lastTransitionIdx } : null
    }];

		lastTransitionFrom = currentState;
		lastTransitionIdx = idx;

		if (trans.input !== 'epsilon') {
			consumedInput = [...consumedInput, remainingInput[0]];
			remainingInput = remainingInput.slice(1);
		}

		if (trans.pop !== 'epsilon') {
			stack = stack.slice(1);
		}
		stack = [...trans.push, ...stack];
		currentState = trans.to;

    updateStatus();
	}

  function updateStatus() {
		if (remainingInput.length === 0 && pdaConfig.accepting.includes(currentState)) {
			runResult = 'accepted';
      return;
		}

    const currentInput = remainingInput.length > 0 ? remainingInput[0] : 'epsilon';
		const topOfStack = stack.length > 0 ? stack[0] : 'epsilon';
    
    const possible = (pdaConfig.transitions[currentState] || []).some(t => 
			(t.input === currentInput || t.input === 'epsilon') &&
			(t.pop === topOfStack || t.pop === 'epsilon')
		);

    if (!possible && runResult === 'idle') {
      runResult = 'rejected';
    }
  }

  function undo(): void {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    currentState = last.state;
    stack = last.stack;
    consumedInput = last.consumed;
    remainingInput = last.remaining;
    if (last.lastTrans) {
      lastTransitionFrom = last.lastTrans.from;
      lastTransitionIdx = last.lastTrans.idx;
    } else {
      lastTransitionFrom = null;
      lastTransitionIdx = null;
    }
    runResult = 'idle';
    history = history.slice(0, -1);
  }

	function runAll(): void {
		if (runResult !== 'idle') return;
		let limit = 100;
		while (runResult === 'idle' && limit-- > 0) {
      const currentInput = remainingInput.length > 0 ? remainingInput[0] : 'epsilon';
      const topOfStack = stack.length > 0 ? stack[0] : 'epsilon';
      const transList = pdaConfig.transitions[currentState] || [];
      
      const idx = transList.findIndex(t => 
        (t.input === currentInput || t.input === 'epsilon') &&
        (t.pop === topOfStack || t.pop === 'epsilon')
      );

      if (idx === -1) break;
      applyTransition(transList[idx], idx);
		}
	}

	function edgeIsActive(edge: Edge): boolean {
		if (lastTransitionFrom === null || lastTransitionIdx === null) return false;
		if (edge.from !== lastTransitionFrom) return false;
		const trans = pdaConfig.transitions[lastTransitionFrom][lastTransitionIdx];
		return edge.to === trans.to;
	}

	function edgePath(edge: Edge): string {
		const from = positions[edge.from];
		const to = positions[edge.to];
		if (!from || !to) return '';

		if (edge.self) {
			return `M ${from.x - 18} ${from.y - nodeRadius + 1} C ${from.x - 34} ${from.y - nodeRadius - 40}, ${from.x + 34} ${from.y - nodeRadius - 40}, ${from.x + 18} ${from.y - nodeRadius + 1}`;
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

		const curve = edge.bidirectional ? 26 : 0;
		const direction = edge.from < edge.to ? 1 : -1;
		const mx = (startX + endX) / 2;
		const my = (startY + endY) / 2;
		const cx = mx + (-uy) * curve * direction;
		const cy = my + ux * curve * direction;

		return `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`;
	}

	function edgeLabelPosition(edge: Edge): { x: number; y: number } {
		const from = positions[edge.from];
		const to = positions[edge.to];
		if (!from || !to) return { x: 0, y: 0 };
		if (edge.self) return { x: from.x, y: from.y - (nodeRadius + 42) };

		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const distance = Math.hypot(dx, dy) || 1;
		const ux = dx / distance;
		const uy = dy / distance;

		const mx = (from.x + ux * nodeRadius + to.x - ux * nodeRadius) / 2;
		const my = (from.y + uy * nodeRadius + to.y - uy * nodeRadius) / 2;
		const curve = edge.bidirectional ? 26 : 0;
		const direction = edge.from < edge.to ? 1 : -1;

		return {
			x: mx + (-uy) * curve * direction,
			y: my + ux * curve * direction - 10
		};
	}
</script>

<div class="pda-embed">
	<div class="graph-wrap">
		<svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} aria-label="PDA state graph">
			<defs>
				<marker id="pda-arrow" markerWidth="8" markerHeight="7" refX="7.4" refY="3.5" orient="auto" markerUnits="strokeWidth">
					<path d="M0,0 L8,3.5 L0,7 L2.3,3.5 z" fill="rgba(255,255,255,0.72)" stroke="rgba(255,255,255,0.28)" stroke-width="0.55" />
				</marker>
			</defs>

			{#each edges as edge}
				{@const labelPos = edgeLabelPosition(edge)}
				<path d={edgePath(edge)} class:active-edge={edgeIsActive(edge)} class="edge" marker-end="url(#pda-arrow)" />
				<text x={labelPos.x} y={labelPos.y} class="edge-label" text-anchor="middle">{edge.label}</text>
			{/each}

			{#each pdaConfig.states as state}
				{@const pos = positions[state]}
				{#if state === pdaConfig.start}
					<line x1={pos.x - 64} y1={pos.y} x2={pos.x - nodeRadius - 6} y2={pos.y} class="start-arrow" marker-end="url(#pda-arrow)" />
				{/if}
				<circle cx={pos.x} cy={pos.y} r={nodeRadius} class:current={state === currentState} class="state" />
				{#if pdaConfig.accepting.includes(state)}
					<circle cx={pos.x} cy={pos.y} r={nodeRadius - 6} class="accept" />
				{/if}
				<text x={pos.x} y={pos.y + 5} class="state-label" text-anchor="middle">{state}</text>
			{/each}
		</svg>
	</div>

  <div class="rules-panel">
    <div class="panel-header">Apply Transition Rule {#if currentState}(from {currentState}){/if}</div>
    <div class="rules-list">
      {#each pdaConfig.transitions[currentState] || [] as trans, i}
        {@const isInputMatch = trans.input === 'epsilon' || (remainingInput.length > 0 && trans.input === remainingInput[0])}
        {@const isStackMatch = trans.pop === 'epsilon' || (stack.length > 0 && trans.pop === stack[0])}
        {@const canStep = isInputMatch && isStackMatch && runResult === 'idle'}
        <button 
          type="button" 
          class="rule-btn" 
          disabled={!canStep}
          onclick={() => applyTransition(trans, i)}
        >
          <span class="p-input">{trans.input === 'epsilon' ? 'ε' : trans.input}</span>, 
          <span class="p-pop">{trans.pop === 'epsilon' ? 'ε' : trans.pop}</span> 
          <span class="p-arrow">→</span>
          <span class="p-push">{trans.push.length === 0 ? 'ε' : trans.push.join('')}</span>
          <span class="p-target">({trans.to})</span>
        </button>
      {/each}
      {#if (pdaConfig.transitions[currentState] || []).length === 0}
        <div class="no-rules">No transitions from this state.</div>
      {/if}
    </div>
  </div>

	<div class="controls">
		<div class="input-row">
			<label for="pda-input">Input string</label>
			<input id="pda-input" type="text" bind:value={sourceInput} oninput={() => reset(sourceInput)} spellcheck="false" autocomplete="off" />
		</div>

		<div class="button-row">
      <button type="button" onclick={runAll} disabled={runResult !== 'idle'}>Run All</button>
			<button type="button" class="ghost" onclick={undo} disabled={history.length === 0}>Undo</button>
			<button type="button" class="ghost" onclick={() => reset(sourceInput)}>Reset</button>
      <button type="button" class="ghost" onclick={() => reset('')}>Clear</button>
		</div>

		<div class="extras">
			<div class="quick-input">
				{#each presetInputs as sample}
					<button type="button" class="sample" onclick={() => reset(sample)}>
						{sample === '' ? 'epsilon' : sample}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="trace">
		<p><strong>Status:</strong> <span class="status-text {runResult}">{runResult.toUpperCase()}</span></p>
		<p><strong>Consumed:</strong> {consumedInput.length === 0 ? 'epsilon' : consumedInput.join('')}</p>
		<p><strong>Remaining:</strong> {remainingInput.length === 0 ? 'epsilon' : remainingInput.join('')}</p>
		<p><strong>Active State:</strong> {currentState} {pdaConfig.accepting.includes(currentState) ? '(accepting)' : ''}</p>
		<p><strong>Stack:</strong> [{stack.length === 0 ? 'empty' : stack.join(', ')}]</p>
    <p><strong>Step:</strong> {history.length}</p>
	</div>
</div>

<style>
	.pda-embed {
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 1rem;
		margin: 1.25rem 0 1.5rem;
		background: rgba(255, 255, 255, 0.02);
    font-family: var(--font-sans);
	}

	.graph-wrap {
		margin-top: 0.7rem;
		padding: 0.35rem;
		border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.015);
	}

	svg { display: block; width: 100%; height: auto; overflow: visible; }

	.edge { fill: none; stroke: rgba(255, 255, 255, 0.28); stroke-width: 1.6; transition: stroke 0.15s ease; }
	.active-edge { stroke: color-mix(in srgb, var(--accent) 62%, #fff 38%); stroke-width: 2.2; }
	.edge-label { font-size: 15px; fill: var(--fg-muted); font-family: var(--font-mono); font-weight: 600; }

	.state { fill: transparent; stroke: rgba(255, 255, 255, 0.36); stroke-width: 1.7; transition: all 0.15s ease; }
	.state.current { fill: color-mix(in srgb, var(--accent) 10%, transparent); stroke: color-mix(in srgb, var(--accent) 68%, #fff 32%); }
	.accept { fill: none; stroke: rgba(255, 255, 255, 0.35); stroke-width: 1.5; }
	.state-label { fill: var(--fg); font-size: 16px; font-family: var(--font-mono); font-weight: 700; }
	.start-arrow { stroke: rgba(255, 255, 255, 0.3); stroke-width: 1.6; }

  .rules-panel {
    margin-top: 1.25rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .panel-header {
    font-size: 0.8rem;
    color: var(--fg-muted);
    margin-bottom: 0.85rem;
    font-weight: 600;
  }

  .rules-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .rule-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    padding: 0.6rem 0.9rem;
    border-radius: 8px;
    color: var(--fg);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }

  .rule-btn:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.1);
    border-color: var(--accent);
    transform: translateY(-1px);
  }

  .rule-btn:disabled {
    opacity: 0.15;
    cursor: not-allowed;
    filter: grayscale(1);
  }

  .p-input { color: #fbbf24; font-weight: 700; }
  .p-pop { color: #f87171; font-weight: 700; }
  .p-push { color: #10b981; font-weight: 700; }
  .p-arrow { opacity: 0.4; margin: 0 2px; }
  .p-target { color: var(--fg-muted); font-size: 0.75rem; margin-left: 2px; }

  .no-rules { font-size: 0.8rem; color: var(--fg-muted); font-style: italic; }

	.controls { margin-top: 1.25rem; display: grid; gap: 0.5rem; }
	.input-row { display: grid; grid-template-columns: auto 1fr; gap: 0.6rem; align-items: center; }
	.input-row label { font-size: 0.86rem; color: var(--fg-muted); }
	.input-row input {
		width: 100%; border-radius: 6px; border: 1px solid var(--border);
		background: rgba(255, 255, 255, 0.02); color: var(--fg);
		padding: 0.42rem 0.58rem; font-family: var(--font-mono); font-size: 0.9rem;
	}

	.button-row { display: flex; flex-wrap: wrap; gap: 0.35rem; }
	button {
		border-radius: 6px; border: 1px solid var(--border);
		background: rgba(255, 255, 255, 0.02); color: var(--fg);
		padding: 0.34rem 0.56rem; font-size: 0.8rem; font-family: var(--font-mono);
		cursor: pointer; transition: all 0.15s ease;
	}
	button:hover:not(:disabled) { border-color: color-mix(in srgb, var(--accent) 40%, var(--border) 60%); color: color-mix(in srgb, var(--accent) 50%, var(--fg) 50%); }
	button:disabled { opacity: 0.2; cursor: not-allowed; }
	button.ghost { color: var(--fg-muted); }

	.quick-input { display: flex; flex-wrap: wrap; gap: 0.35rem; padding-top: 0.15rem; }
	button.sample { font-size: 0.75rem; padding: 0.2rem 0.4rem; }

	.trace {
		margin-top: 1rem;
		border-top: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
		padding-top: 0.75rem;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem 1rem;
	}
	.trace p { margin: 0; font-size: 0.8rem; color: var(--fg-muted); }
	.trace strong { color: var(--fg); }
  .status-text.accepted { color: #10b981; font-weight: 800; }
  .status-text.rejected { color: #ef4444; font-weight: 800; }

	@media (max-width: 900px) {
		.input-row { grid-template-columns: 1fr; }
		.trace { grid-template-columns: 1fr; }
	}
</style>
