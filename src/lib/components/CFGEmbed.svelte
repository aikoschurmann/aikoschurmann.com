<script lang="ts">
  import { untrack } from 'svelte';

  type Production = {
    left: string;
    right: string[];
  };

  type CFGConfig = {
    start: string;
    productions: Production[];
  };

  const ARITHMETIC_CFG: CFGConfig = {
    start: 'E',
    productions: [
      { left: 'E', right: ['E', '+', 'T'] },
      { left: 'E', right: ['T'] },
      { left: 'T', right: ['T', '*', 'F'] },
      { left: 'T', right: ['F'] },
      { left: 'F', right: ['(', 'E', ')'] },
      { left: 'F', right: ['int'] }
    ]
  };

  let { cfg = ARITHMETIC_CFG } = $props<{ cfg?: CFGConfig }>();

  let derivation = $state<{ symbol: string; isTerminal: boolean; id: number }[]>([]);
  let history = $state<{ symbol: string; isTerminal: boolean; id: number }[][]>([]);
  let currentStep = $state(0);
  let derivationComplete = $state(false);
  let selectedIndex = $state<number | null>(0);
  let idCounter = 0;

  function reset() {
    idCounter = 0;
    derivation = [{ symbol: cfg.start, isTerminal: false, id: idCounter++ }];
    history = [[...derivation]];
    currentStep = 0;
    derivationComplete = false;
    selectedIndex = 0;
  }

  function isTerminal(symbol: string) {
    return !cfg.productions.some(p => p.left === symbol);
  }

  function applyProduction(prod: Production) {
    if (derivationComplete || selectedIndex === null) return;

    const newDerivation = [
      ...derivation.slice(0, selectedIndex),
      ...prod.right.map(s => ({ 
        symbol: s === 'epsilon' ? '' : s, 
        isTerminal: s === 'epsilon' ? true : isTerminal(s),
        id: idCounter++
      })).filter(item => item.symbol !== ''),
      ...derivation.slice(selectedIndex + 1)
    ];

    derivation = newDerivation;
    history = [...history, [...derivation]];
    currentStep++;
    derivationComplete = derivation.every(item => item.isTerminal);
    
    // Auto-select next leftmost non-terminal if available
    const nextIdx = derivation.findIndex(item => !item.isTerminal);
    selectedIndex = nextIdx === -1 ? null : nextIdx;
  }

  function stepBack() {
    if (currentStep > 0) {
      currentStep--;
      history = history.slice(0, -1);
      derivation = [...history[currentStep]];
      derivationComplete = false;
      
      // Reset selection to leftmost non-terminal in the previous state
      const nextIdx = derivation.findIndex(item => !item.isTerminal);
      selectedIndex = nextIdx === -1 ? null : nextIdx;
    }
  }

  function handleSymbolClick(idx: number) {
    if (!derivation[idx].isTerminal) {
      selectedIndex = idx;
    }
  }

  // FIXED: Added optional chaining (?.) so intermediate state updates don't crash the derivation
  const activeNonTerminal = $derived(selectedIndex !== null ? derivation[selectedIndex]?.symbol : null);

  $effect(() => {
    cfg; 
    untrack(() => {
      reset();
    });
  });
</script>

<div class="cfg-embed">
  <div class="grammar-panel">
    <div class="panel-header">Apply Production {#if activeNonTerminal}(to {activeNonTerminal}){/if}</div>
    <div class="productions-list">
      {#each cfg.productions as prod}
        <button 
          type="button" 
          class="prod-btn" 
          disabled={derivationComplete || prod.left !== activeNonTerminal}
          onclick={() => applyProduction(prod)}
        >
          <span class="non-terminal">{prod.left}</span>
          <span class="arrow">→</span>
          <span class="expansion">
            {#each prod.right as sym}
              <span class={isTerminal(sym) ? 'terminal' : 'non-terminal'}>{sym}</span>
            {/each}
          </span>
        </button>
      {/each}
    </div>
    
    <div class="panel-footer">
      <button type="button" onclick={reset} class="control-btn" disabled={currentStep === 0}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        Reset
      </button>
      <button type="button" onclick={stepBack} disabled={currentStep === 0} class="control-btn">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 14 4 9l5-5"/>
          <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>
        </svg>
        Undo
      </button>
    </div>
  </div>

  <div class="derivation-panel">
    <div class="panel-header">Derivation Trace</div>
    
    <div class="current-derivation">
      {#if derivation.length === 0}
        <span class="epsilon">ε</span>
      {:else}
        {#each derivation as item, i}
          <button 
            type="button"
            class="symbol-btn {item.isTerminal ? 'terminal' : 'non-terminal'}" 
            class:active={i === selectedIndex}
            disabled={item.isTerminal || derivationComplete}
            onclick={() => handleSymbolClick(i)}
          >
            {item.symbol || 'ε'}
          </button>
        {/each}
      {/if}
    </div>

    {#if derivationComplete}
      <div class="status-badge success">Derivation Complete</div>
    {/if}

    <div class="history-container">
      <div class="panel-header sub">History</div>
      <div class="history-list">
        {#each history as step, i}
          <div class="history-row" class:final={i === currentStep && derivationComplete}>
            <span class="step-num">{i}.</span>
            <div class="step-symbols">
              {#if step.length === 0}
                <span class="epsilon">ε</span>
              {:else}
                {#each step as item}
                  <span class={item.isTerminal ? 'terminal' : 'non-terminal'}>{item.symbol || 'ε'}</span>
                {/each}
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .cfg-embed {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 1.5rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin: 2.5rem 0;
    background: rgba(255, 255, 255, 0.01);
    font-family: var(--font-mono);
  }

  .panel-header {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg-muted);
    margin-bottom: 1rem;
    font-weight: 700;
  }

  .panel-header.sub {
    margin-top: 1rem;
    border-top: 1px solid var(--border);
    padding-top: 1rem;
  }

  .grammar-panel {
    border-right: 1px solid var(--border);
    padding-right: 1.5rem;
    display: flex;
    flex-direction: column;
  }

  .productions-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .prod-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    padding: 0.6rem 0.8rem;
    border-radius: 8px;
    color: var(--fg);
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
    font-family: var(--font-mono);
  }

  .prod-btn:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.1);
    border-color: var(--accent);
    transform: translateX(4px);
  }

  .prod-btn:disabled {
    opacity: 0.15;
    cursor: not-allowed;
    filter: grayscale(1);
  }

  .non-terminal { color: #fbbf24; font-weight: 600; }
  .terminal { color: #10b981; font-weight: 600; }
  .epsilon { color: var(--fg-muted); font-style: italic; }
  .arrow { color: var(--fg-muted); opacity: 0.5; }

  .derivation-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
  }

  .current-derivation {
    font-size: 1.75rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    min-height: 4rem;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
    border: 1px solid var(--border);
  }

  .symbol-btn {
    background: transparent;
    border: none;
    padding: 0 4px;
    border-radius: 4px;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .symbol-btn.non-terminal {
    color: #fbbf24;
    font-weight: 600;
  }

  .symbol-btn.non-terminal:hover:not(:disabled) {
    background: rgba(251, 191, 36, 0.1);
  }

  .symbol-btn.active {
    background: rgba(251, 191, 36, 0.2) !important;
    box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.4);
  }

  .symbol-btn.terminal {
    color: #10b981;
    cursor: default;
  }

  .panel-footer {
    display: flex;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }

  .control-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    color: var(--fg-muted);
    padding: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: var(--fg);
    border-color: var(--fg-dark);
  }

  .control-btn:disabled {
    opacity: 0.2;
    cursor: not-allowed;
  }

  .status-badge {
    font-size: 0.65rem;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 700;
    width: fit-content;
  }

  .status-badge.success { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981; }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .history-row {
    display: flex;
    gap: 0.75rem;
    font-size: 0.9rem;
    opacity: 0.5;
    transition: opacity 0.2s ease;
  }

  .history-row.final {
    opacity: 1;
    font-weight: 700;
  }

  .step-num {
    color: var(--fg-muted);
    width: 1.5rem;
    text-align: right;
  }

  .step-symbols {
    display: flex;
    gap: 0.25rem;
  }

  @media (max-width: 850px) {
    .cfg-embed {
      grid-template-columns: 1fr;
    }
    .grammar-panel {
      border-right: none;
      border-bottom: 1px solid var(--border);
      padding-right: 0;
      padding-bottom: 1.5rem;
    }
  }
</style>