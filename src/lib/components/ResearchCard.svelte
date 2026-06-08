<script lang="ts">
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
  };

  let { thought, href } = $props<{ thought: ThoughtCardData; href?: string }>();
</script>

<a href={href ?? thought.url} class="post-card research-item-card">
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

  <div class="post-meta">
    {#each thought.tags as tag}
      <span class="post-tag" style={tag.style}>{tag.name}</span>
    {/each}
  </div>
</a>

<style>
  /* Force neutral post-card look regardless of .prose parent */
  .research-item-card {
    text-align: left !important;
    margin: 0.5rem 0 !important;
    text-decoration: none !important;
    font-family: var(--font-sans) !important;
  }

  .card-title-override {
    font-family: var(--font-sans) !important;
    font-size: 1.3rem !important;
    font-weight: 600 !important;
    margin: 0 !important;
    letter-spacing: -0.01em !important;
    line-height: 1.2 !important;
    color: var(--fg) !important;
  }

  .post-desc-override {
    font-family: var(--font-sans) !important;
    font-size: 1rem !important;
    color: var(--fg-muted) !important;
    line-height: 1.6 !important;
    margin: 0 0 1.5rem 0 !important;
    max-width: 600px !important;
    text-align: left !important;
  }

  .post-thumb {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: var(--fg-muted) !important;
  }

  .post-tag {
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
    text-transform: uppercase;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
</style>


