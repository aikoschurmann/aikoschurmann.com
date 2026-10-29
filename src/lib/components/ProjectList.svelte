<script lang="ts">
  import type { projects as allProjects } from '$lib/data';

  let { projects } = $props<{ projects: typeof allProjects }>();
</script>

<ul class="row-list">
  {#each projects as project}
    {@const [language, ...rest] = project.tags}
    <li>
      <a href={project.url} class="row">
        <span class="row-label">{language?.name}</span>
        <span class="row-main">
          <span class="row-title">{project.title}</span>
          <span class="row-desc">{project.description}</span>
          {#if rest.length}
            <span class="project-tags row-pills">
              {#each rest as tag}
                <span style={tag.style}>{tag.name}</span>
              {/each}
            </span>
          {/if}
        </span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    </li>
  {/each}
</ul>
