<script lang="ts">
  const stackItems = [
    { label: 'Argument b', note: 'Pushed by caller', type: 'caller' },
    { label: 'Argument a', note: '', type: 'caller' },
    { label: 'Return Address', note: 'Instruction to resume after call', type: 'control' },
    { label: 'Saved Registers', note: 'Old values that must be restored', type: 'control' },
    { label: 'Local: sum', note: '', type: 'local', isFp: true },
    { label: '(Free space)', note: '', type: 'empty', isSp: true }
  ];
</script>

<div class="stack-embed">
	<div class="memory-label top">Higher memory addresses</div>
	
	<div class="stack-wrapper">
		<div class="stack">
			{#each stackItems as item}
        {#if item.isFp}
          <div class="pointer-line">
            <span class="pointer-label">← Frame Pointer (Base of frame)</span>
          </div>
        {/if}
        {#if item.isSp}
          <div class="pointer-line">
            <span class="pointer-label">← Stack Pointer (Top of stack)</span>
          </div>
        {/if}
				<div class="stack-slot {item.type}">
					<span class="slot-label">{item.label}</span>
					{#if item.note}
						<span class="slot-note">({item.note})</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<div class="memory-label bottom">Lower memory addresses (stack grows down)</div>
</div>

<style>
	.stack-embed {
		margin: 2rem 0;
		padding: 1.5rem;
		border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.01);
		display: flex;
		flex-direction: column;
		align-items: center;
		font-family: var(--font-mono);
	}

	.memory-label {
		font-size: 0.75rem;
		color: var(--fg-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.5rem;
	}

	.memory-label.bottom {
		margin-top: 0.5rem;
	}
    
  .memory-label.top {
      margin-bottom: 0.5rem;
  }

	.stack-wrapper {
		display: flex;
		width: 100%;
		max-width: 500px;
    position: relative;
	}

	.stack {
		display: flex;
		flex-direction: column;
		width: 100%;
		border-left: 2px solid rgba(255, 255, 255, 0.2);
		border-right: 2px solid rgba(255, 255, 255, 0.2);
	}

	.stack-slot {
		height: 3.2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: -1px;
		font-size: 0.85rem;
	}

	.slot-label {
		color: var(--fg);
		font-weight: 600;
	}

	.slot-note {
		color: var(--fg-muted);
		font-size: 0.75rem;
	}

	.stack-slot.caller {
		background: rgba(255, 255, 255, 0.03);
	}

	.stack-slot.control {
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		border-color: color-mix(in srgb, var(--accent) 30%, transparent);
	}
  .stack-slot.control .slot-label {
      color: color-mix(in srgb, var(--accent) 80%, white);
  }

	.stack-slot.local {
		background: rgba(34, 197, 94, 0.1);
		border-color: rgba(34, 197, 94, 0.2);
	}
  .stack-slot.local .slot-label {
      color: rgba(74, 222, 128, 1);
  }

	.stack-slot.empty {
		background: transparent;
		border-style: dashed;
    border-bottom: none;
	}
  .stack-slot.empty .slot-label {
      color: var(--fg-muted);
      font-style: italic;
  }

	.pointer-line {
		height: 0;
		position: relative;
		width: 100%;
    z-index: 10;
	}

	.pointer-label {
		position: absolute;
		right: -250px;
		top: -0.5rem;
		font-size: 0.75rem;
		color: var(--accent);
		font-weight: 600;
		white-space: nowrap;
	}

  @media (max-width: 900px) {
    .pointer-label {
      right: -200px;
      font-size: 0.65rem;
    }
  }

  @media (max-width: 768px) {
      .stack-slot {
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          height: auto;
          padding: 0.75rem 1rem;
          gap: 0.25rem;
      }
      .pointer-label {
          right: auto;
          left: 100%;
          padding-left: 0.5rem;
      }
  }
  @media (max-width: 500px) {
      .pointer-label {
        display: none; /* Might be too cramped */
      }
  }
</style>
