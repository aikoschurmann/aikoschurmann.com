<script lang="ts">
  interface StackItem {
    label: string;
    note?: string;
    type: 'caller' | 'control' | 'local' | 'empty';
    isFp?: boolean;
    isSp?: boolean;
  }

  let { items = [] } = $props<{ items?: StackItem[] }>();

  const defaultItems: StackItem[] = [
    { label: 'Argument b', note: 'Pushed by caller', type: 'caller' },
    { label: 'Argument a', note: '', type: 'caller' },
    { label: 'Return Address', note: 'Instruction to resume after call', type: 'control' },
    { label: 'Saved Registers', note: 'Old values that must be restored', type: 'control' },
    { label: 'Local: sum', note: '', type: 'local', isFp: true },
    { label: '(Free space)', note: '', type: 'empty', isSp: true }
  ];

  const stackItems = $derived(items.length > 0 ? items : defaultItems);
</script>

<div class="stack-embed">
	<div class="memory-label top">Higher memory addresses</div>
	
	<div class="stack-container">
		<div class="stack">
			{#each stackItems as item}
				<div class="stack-row">
          <div class="stack-slot {item.type}">
            <span class="slot-label">{item.label}</span>
            {#if item.note}
              <span class="slot-note">({item.note})</span>
            {/if}
          </div>
          
          <div class="pointers-container">
            {#if item.isFp}
              <div class="pointer-badge fp" title="Frame Pointer">FP</div>
            {/if}
            {#if item.isSp}
              <div class="pointer-badge sp" title="Stack Pointer">SP</div>
            {/if}
          </div>
        </div>
			{/each}
		</div>
	</div>

	<div class="memory-label bottom">Lower memory addresses (stack grows down)</div>
</div>

<style>
	.stack-embed {
		margin: 3.5rem 0;
		padding: 2.5rem 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.01);
		display: flex;
		flex-direction: column;
		align-items: center;
		font-family: var(--font-mono);
	}

	.memory-label {
		font-size: 0.65rem;
		color: #fff;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		padding: 0.5rem;
    opacity: 0.9;
	}

	.memory-label.bottom {
		margin-top: 1.5rem;
	}
    
  .memory-label.top {
      margin-bottom: 1.5rem;
  }

	.stack-container {
		width: 100%;
		max-width: 440px;
    margin: 0 auto;
    position: relative;
	}

	.stack {
		display: flex;
		flex-direction: column;
		width: 100%;
    align-items: center;
	}

  .stack-row {
    position: relative;
    width: 100%;
    margin-bottom: 6px;
    display: flex;
    justify-content: center;
  }

	.stack-slot {
		min-height: 3.8rem;
    width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
		font-size: 0.9rem;
    transition: all 0.2s ease;
	}

	.slot-label {
		color: var(--fg);
		font-weight: 600;
	}

	.slot-note {
		color: var(--fg-muted);
		font-size: 0.75rem;
    opacity: 0.7;
	}

	.stack-slot.caller {
		background: rgba(255, 255, 255, 0.05);
	}

	.stack-slot.control {
		background: rgba(59, 130, 246, 0.05);
		border-color: rgba(59, 130, 246, 0.15);
	}
  .stack-slot.control .slot-label {
      color: #bfdbfe;
  }

	.stack-slot.local {
		background: rgba(34, 197, 94, 0.04);
		border-color: rgba(34, 197, 94, 0.15);
	}
  .stack-slot.local .slot-label {
      color: #bbf7d0;
  }

	.stack-slot.empty {
		background: transparent;
		border-style: dashed;
    border-color: rgba(255, 255, 255, 0.1);
    opacity: 0.4;
	}
  .stack-slot.empty .slot-label {
      color: var(--fg-muted);
      font-style: italic;
  }

  .pointers-container {
    position: absolute;
    top: 0;
    bottom: 0;
    right: -45px;
    width: 35px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }

  .pointer-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 20px;
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 900;
    color: #000;
  }

  .pointer-badge.fp { background: #fbbf24; }
  .pointer-badge.sp { background: #f87171; }

  @media (max-width: 600px) {
    .stack-container {
      padding: 0 40px;
    }
    .stack-slot {
      padding: 1rem;
      flex-direction: column;
      align-items: center;
      text-align: center;
      justify-content: center;
      gap: 0.2rem;
      min-height: 4.5rem;
    }
    .pointers-container {
      right: 6px;
    }
  }
</style>
