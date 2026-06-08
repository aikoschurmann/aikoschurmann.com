<script lang="ts">
  let { 
    title, 
    description = '', 
    count = undefined,
    kicker = undefined,
    initiallyOpen = true, 
    children 
  } = $props<{
    title: string;
    description?: string;
    count?: number;
    kicker?: string;
    initiallyOpen?: boolean;
    children?: any;
  }>();

  let isCollapsed = $state(!initiallyOpen);

  function handleToggle() {
    isCollapsed = !isCollapsed;
  }
</script>

<section class="research-section">
  <div class="research-section-header">
    <h4 class="research-section-title" onclick={handleToggle} role="presentation">
      <span class="section-title-text">{title}</span>
    </h4>
    
    <div class="section-header-top">
      {#if kicker}
        <span class="section-kicker">{kicker}</span>
      {:else}
        <div></div>
      {/if}
      
      <div class="section-header-controls">
        {#if count !== undefined && count > 0}
          <span class="section-stats">{count} {count === 1 ? 'paper' : 'papers'}</span>
        {/if}
        <button
          type="button"
          class="section-toggle"
          class:collapsed={isCollapsed}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          onclick={handleToggle}
        >
          <svg class="section-toggle-arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <div class="research-section-content" class:collapsed={isCollapsed}>
    {#if description}
      <p class="research-section-desc">{description}</p>
    {/if}

    <div class="research-item-list">
      {@render children?.()}
    </div>
  </div>
</section>

<style>
  .research-section {
    scroll-margin-top: 8rem;
    margin: 4rem 0;
  }

  .research-section-header {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin-bottom: 1rem;
  }

  .section-header-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.45rem;
  }

  .section-kicker {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.52rem;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
    text-transform: uppercase;
    color: var(--fg-muted);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-right: 0;
    white-space: nowrap;
    width: max-content;
    justify-self: start;
  }

  .research-section-title {
    font-family: var(--font-sans);
    font-size: 2rem !important;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--fg) !important;
    margin: 0 !important;
    min-width: 0;
    line-height: 1.1;
    cursor: pointer;
  }

  .section-title-text {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .section-stats {
    color: var(--fg-muted);
    font-size: 0.68rem;
    text-transform: uppercase;
    font-family: var(--font-mono);
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .section-header-controls {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    white-space: nowrap;
    justify-self: end;
  }

  .section-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.1rem 0.2rem;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--fg-muted);
    transition: color 0.2s ease;
  }

  .section-toggle:hover {
    color: var(--fg);
  }

  .section-toggle-arrow {
    width: 0.95rem;
    height: 0.95rem;
    transition: transform 0.16s ease;
  }

  .section-toggle.collapsed .section-toggle-arrow {
    transform: rotate(-90deg);
  }

  .research-section-content.collapsed {
    display: none;
  }

  .research-section-desc {
    color: var(--fg-muted) !important;
    line-height: 1.6 !important;
    margin: 0 0 3rem 0 !important;
    font-size: 1.15rem !important;
    font-family: var(--font-sans) !important;
  }

  .research-item-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  @media (max-width: 1100px) {
    .research-section {
      text-align: left;
    }

    .research-section-header {
      margin-bottom: 0.5rem;
    }

    .research-section-title {
      min-width: 0;
      font-size: 1.6rem !important;
      line-height: 1.2;
      align-items: flex-start;
    }

    .section-header-controls {
      justify-self: end;
      width: auto;
      justify-content: flex-end;
      gap: 0.35rem;
      align-items: center;
    }

    .section-stats {
      font-size: 0.62rem;
    }

    .section-toggle-arrow {
      width: 0.85rem;
      height: 0.85rem;
    }
  }
</style>