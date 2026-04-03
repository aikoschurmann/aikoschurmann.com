<script lang="ts">
  import { getContext } from 'svelte';
  import type { Course } from '$lib/data';

  let { 
    title, 
    description = '', 
    index = undefined,
    count = undefined,
    slugs = undefined,
    initiallyOpen = true, 
    children 
  } = $props<{
    title: string;
    description?: string;
    index?: number | string;
    count?: number;
    slugs?: string[];
    initiallyOpen?: boolean;
    children?: any;
  }>();

  const getCourse = getContext<() => Course>('course');
  const course = $derived(getCourse ? getCourse() : undefined);
  
  const ui = getContext<{ 
    expandedSections: () => Record<string, boolean>, 
    toggleSection: (id: string, force?: boolean) => void 
  }>('courseUI');

  let visibleSlugs = $derived.by(() => {
    if (!slugs || !course) return [];
    return slugs.filter((slug: string) => course.posts.some(p => p.url.endsWith(`/${slug}`)));
  });

  let displayCount = $derived(count !== undefined ? count : (slugs ? visibleSlugs.length : undefined));
  let shouldRender = $derived(slugs ? visibleSlugs.length > 0 : true);

  const sectionId = $derived(String(index ?? title));
  // Safely access ui context with optional chaining
  const isCollapsed = $derived(ui ? !ui.expandedSections()[sectionId] : !initiallyOpen);

  function handleToggle() {
    if (ui) {
      ui.toggleSection(sectionId);
    }
  }
</script>

{#if shouldRender}
<section class="course-section" id={index ? `section-${index}` : undefined}>
  <div class="course-section-header">
  
    <h4 class="course-section-title">
      <span class="section-title-text">{title}</span>
    </h4>
    <div class="section-header-top">
      {#if index !== undefined}
        <span class="section-kicker">Section {index}</span>
      {:else}
        <div></div>
      {/if}
      <div class="section-header-controls">
        {#if displayCount !== undefined && displayCount > 0}
          <span class="section-stats">{displayCount} {displayCount === 1 ? 'chapter' : 'chapters'}</span>
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

  {#if !isCollapsed}
    {#if description}
      <p class="course-section-desc">{description}</p>
    {/if}

    <div class="course-post-list">
      {@render children?.()}
    </div>
  {/if}
</section>
{/if}

<style>
  .course-section {
    scroll-margin-top: 8rem;
    margin: 4rem 0;
  }

  .course-section-header {
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

  .course-section-title {
    font-family: var(--font-sans);
    font-size: 2rem !important;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--fg) !important;
    margin: 0 !important;
    min-width: 0;
    line-height: 1.1;
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

  .section-toggle:focus-visible {
    outline: 1px solid var(--accent);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .section-toggle-arrow {
    width: 0.95rem;
    height: 0.95rem;
    transition: transform 0.16s ease;
  }

  .section-toggle.collapsed .section-toggle-arrow {
    transform: rotate(-90deg);
  }

  .course-section-desc {
    color: var(--fg-muted) !important;
    line-height: 1.6 !important;
    margin: 0 0 3rem 0 !important;
    font-size: 1.15rem !important;
    font-family: var(--font-sans) !important;
  }

  .course-post-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  @media (max-width: 1100px) {
    .course-section {
      text-align: left;
    }

    .course-section-header {
      margin-bottom: 0.5rem;
    }

    .course-section-title {
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
