<script lang="ts">
  type ProjectTag = {
    name: string;
    style: string;
  };

  type ProjectCardData = {
    title: string;
    url: string;
    thumb: string;
    description: string;
    github?: string;
    tags: ProjectTag[];
  };

  let { project, openInNewTab = false } = $props<{
    project: ProjectCardData;
    openInNewTab?: boolean;
  }>();

  const linkTarget = $derived(openInNewTab || project.url.startsWith('http') ? '_blank' : undefined);
  const relValue = $derived(linkTarget ? 'noopener' : undefined);

  function handleCardClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('.github-action')) return;

    if (linkTarget === '_blank') {
      window.open(project.url, '_blank', relValue);
    } else {
      window.location.href = project.url;
    }
  }

  function handleCardKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target as HTMLElement;
      if (target.closest('.github-action')) return;

      e.preventDefault();
      if (linkTarget === '_blank') {
        window.open(project.url, '_blank', relValue);
      } else {
        window.location.href = project.url;
      }
    }
  }
</script>

<div 
  class="project-card-minimal" 
  role="link" 
  tabindex="0" 
  onclick={handleCardClick} 
  onkeydown={handleCardKeydown}
>
  <div class="card-header">
    <div class="card-header-left">
      <div class="project-thumb">{project.thumb}</div>
      <h3>{project.title}</h3>
    </div>
    <div class="arrow">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
      </svg>
    </div>
  </div>
  <p>{project.description}</p>
  
  <div class="project-tags">
    {#if project.github}
      <div class="github-action-wrapper">
        <a 
          href={project.github} 
          target="_blank"
          rel="noopener"
          class="github-action" 
          aria-label="Source code for {project.title}"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
          </svg>
          Source
        </a>
      </div>
    {/if}
    {#each project.tags as tag}
      <span style={tag.style}>{tag.name}</span>
    {/each}
  </div>
</div>

<style>
  .github-action-wrapper {
    display: contents;
  }

  /* Only force its own row when the main layout uses the 2-column grid (PC sizes) */
  @media (min-width: 1101px) {
    .github-action-wrapper {
      display: block;
      width: 100%;
      margin-bottom: 0.15rem;
    }
  }

  .github-action {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--fg-muted);
    text-decoration: none;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .github-action:hover,
  .github-action:focus-visible {
    background: var(--fg);
    color: var(--bg);
    border-color: var(--fg);
  }
</style>

