<script lang="ts">
  import { projects } from '$lib/data';
  import GithubStatus from '$lib/components/GithubStatus.svelte';
  import SocialLinks from '$lib/components/SocialLinks.svelte';
</script>

<svelte:head>
  <title>Aiko Schurmann | Projects Archive</title>
</svelte:head>

<div class="identity-grid reverse-mobile">
  <aside class="profile-sidebar">
    <div class="profile-card">
      <img src="/picture.jpg" alt="Aiko Schurmann" class="profile-img" />
      <h2>Aiko Schurmann</h2>
      <p>Low-level software engineer in training. Building efficient software close to the hardware.</p>
      
      <GithubStatus />
      <SocialLinks />
    </div>
  </aside>

  <div class="hero-content">
    <section id="projects">
      <h2 class="big-title">All <br><span>Projects</span></h2>
      <div class="project-grid">
        {#each projects as project}
          <a href={project.url} target={project.url.startsWith('http') ? '_blank' : ''} rel="noopener" class="project-card-minimal">
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
        {/each}
      </div>
    </section>
  </div>
</div>