<script lang="ts">
  import { projects } from '$lib/data';
  
  let { id } = $props();

  const project = $derived(projects.find(p => p.title === id));
</script>

{#if project}
  <div class="embed-wrapper">
    <!-- Invisible absolute link stretches over the whole card to make it clickable -->
    <a href={project.url} target="_blank" rel="noopener" class="absolute-link" aria-label={project.title}></a>
    
    <div class="card-header">
      <div class="card-header-left">
        <div class="project-thumb">{project.thumb}</div>
        <!-- Changed from h3 to div so the Table of Contents ignores it -->
        <div class="embed-title">{project.title}</div>
      </div>
      <div class="arrow">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
        </svg>
      </div>
    </div>
    
    <p class="embed-desc">{project.description}</p>
    
    <div class="project-tags">
      {#each project.tags as tag}
        <span style={tag.style}>{tag.name}</span>
      {/each}
    </div>
  </div>
{:else}
  <div class="error">Project "{id}" not found in data.ts.</div>
{/if}

<style>
  .embed-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    border-radius: 12px;
    background: transparent;
    border: 1px solid var(--border); 
    color: var(--fg);
    transition: background-color 0.2s ease, border-color 0.2s ease;
    margin: 3rem 0; 
  }

  .embed-wrapper:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .absolute-link {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    border: none !important;
    text-decoration: none !important;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .card-header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .project-thumb {
    width: 42px;
    height: 42px;
    background: #222;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--fg-muted);
    border: 1px solid var(--border);
    margin: 0;
  }

  /* Swapped to target the .embed-title class instead of h3 */
  .embed-title {
    font-family: var(--font-sans) !important;
    font-size: 1.15rem !important;
    font-weight: 600 !important;
    margin: 0 !important;
    letter-spacing: -0.01em !important;
    color: var(--fg) !important;
    line-height: 1 !important;
  }

  p.embed-desc {
    font-family: var(--font-sans) !important;
    font-size: 0.9rem !important;
    color: var(--fg-muted) !important;
    line-height: 1.5 !important;
    margin: 0 0 1.5rem 0 !important;
  }

  .project-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .project-tags span {
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .arrow {
    color: var(--accent);
    opacity: 0.6;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .embed-wrapper:hover .arrow {
    transform: translateX(4px) translateY(-4px);
    opacity: 1;
  }

  .error {
    color: #f87171;
    padding: 1rem;
    border: 1px dashed #f87171;
    border-radius: 8px;
    margin: 2rem 0;
    font-family: var(--font-mono);
    font-size: 0.9rem;
  }

  @media (max-width: 1100px) {
    .embed-wrapper {
      padding: 1.25rem;
    }

    .project-tags span {
      font-size: 0.6rem;
      padding: 0.3rem 0.5rem;
    }

    .arrow {
      display: none;
    }
  }
</style>