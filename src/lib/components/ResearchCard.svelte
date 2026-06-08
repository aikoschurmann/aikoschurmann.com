<script lang="ts">
  import { goto } from '$app/navigation';

  type ThoughtTag = {
    name: string;
    style: string;
  };

  type ThoughtCardData = {
    title: string;
    url: string;
    description: string;
    date: string;
    readTime: string;
    tags: ThoughtTag[];
    academicType?: string;
    period?: string;
    institution?: string;
    download?: string;
  };

  let { thought, href } = $props<{ thought: ThoughtCardData; href?: string }>();

  function handleCardClick() {
    goto(href ?? thought.url);
  }

  function handleDownload(e: MouseEvent) {
    e.stopPropagation();
  }
</script>

<div 
  role="link"
  tabindex="0"
  onclick={handleCardClick}
  onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
  class="post-card research-item-card"
>
  {#if thought.academicType}
    <span class="academic-kicker">{thought.academicType}</span>
  {/if}

  <div class="card-header">
    <div class="card-header-left">
      <div class="post-thumb">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      </div>
      <h3 class="card-title-override">{thought.title}</h3>
    </div>
    <div class="arrow">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
      </svg>
    </div>
  </div>

  <p class="post-desc-override">{thought.description}</p>

  <div class="card-footer">
    <div class="post-meta">
      {#each thought.tags as tag}
        <span class="post-tag" style={tag.style}>{tag.name}</span>
      {/each}
    </div>

    {#if thought.download}
      <a 
        href={thought.download} 
        class="download-btn" 
        download 
        onclick={handleDownload}
        title="Download PDF"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>PDF</span>
      </a>
    {/if}
  </div>
</div>

<style>
  /* Force neutral post-card look regardless of .prose parent */
  .research-item-card {
    text-align: left !important;
    margin: 0.5rem 0 !important;
    text-decoration: none !important;
    font-family: var(--font-sans) !important;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 1.5rem !important;
    cursor: pointer;
    outline: none;
  }

  .academic-kicker {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--fg-muted);
    margin-bottom: 0.75rem;
    display: block;
    opacity: 0.8;
  }

  .card-title-override {
    font-family: var(--font-sans) !important;
    font-size: 1.4rem !important;
    font-weight: 700 !important;
    margin: 0 !important;
    letter-spacing: -0.02em !important;
    line-height: 1.2 !important;
    color: var(--fg) !important;
  }

  .post-desc-override {
    font-family: var(--font-sans) !important;
    font-size: 1rem !important;
    color: var(--fg-muted) !important;
    line-height: 1.6 !important;
    margin: 0.75rem 0 1.5rem 0 !important;
    max-width: 600px !important;
    text-align: left !important;
  }

  .post-thumb {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: var(--fg-muted) !important;
    width: 38px !important;
    height: 38px !important;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }

  /* Rely on global .post-meta and .post-tag styles for consistency */

  .download-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 6px !important;
    color: var(--fg-muted) !important;
    font-family: var(--font-mono) !important;
    font-size: 0.65rem !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    text-decoration: none !important;
    transition: all 0.2s ease !important;
    z-index: 2;
    line-height: 1 !important;
  }

  .download-btn:hover {
    background: var(--fg) !important;
    color: var(--bg) !important;
    border-color: var(--fg) !important;
  }

  .download-btn svg {
    margin: 0 !important;
    flex-shrink: 0;
  }

  /* Suppress parent hover effect when hovering the download button */
  .research-item-card:has(.download-btn:hover) {
    background: rgba(255, 255, 255, 0.02) !important;
    border-color: var(--border) !important;
  }

  .research-item-card:has(.download-btn:hover) .arrow {
    transform: none !important;
    opacity: 0.6 !important;
  }
</style>



