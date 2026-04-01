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
    tags: ProjectTag[];
  };

  let { project, openInNewTab = false } = $props<{
    project: ProjectCardData;
    openInNewTab?: boolean;
  }>();

  const linkTarget = $derived(openInNewTab || project.url.startsWith('http') ? '_blank' : undefined);
  const relValue = $derived(linkTarget ? 'noopener' : undefined);
</script>

<a href={project.url} target={linkTarget} rel={relValue} class="project-card-minimal">
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
    {#each project.tags as tag}
      <span style={tag.style}>{tag.name}</span>
    {/each}
  </div>
</a>
