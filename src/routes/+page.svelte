<script lang="ts">
  import { projects, thoughts } from '$lib/data';
  import GithubStatus from '$lib/components/GithubStatus.svelte';
  import SocialLinks from '$lib/components/SocialLinks.svelte';

  const homeProjects = projects.filter(p => p.showOnHome);
  const homeThoughts = thoughts.filter(t => t.showOnHome);
</script>

<svelte:head>
  <title>Aiko Schürmann | Software Engineer</title>
</svelte:head>

<div class="identity-grid">
  <aside class="profile-sidebar">
    <div class="profile-card">
      <img src="/picture.jpg" alt="Aiko Schürmann" class="profile-img" />
      <h2>Aiko Schürmann</h2>
      <p>Low-level software engineer in training. Building efficient software close to the hardware.</p>
      
      <GithubStatus />
      <SocialLinks />
    </div>
  </aside>

  <div class="hero-content">
    <h1 class="big-title">Software <br><span>Engineer</span></h1>
  
    <p class="hero-desc">
      Computer science student currently at <strong>VUB</strong>, soon continuing at <strong>KU Leuven</strong> for an MSc in Software Engineering.
      Focused on low-level systems, compilers, and writing efficient software.
    </p>

    <section id="projects">
      <h2 class="big-title">Recent <br><span>Projects</span></h2>
      
      <div class="project-grid">
        {#each homeProjects as project}
          <a href={project.url} target="_blank" rel="noopener" class="project-card-minimal">
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
      
      <div style="margin-top: 2rem; padding: 0;">
        <a href="/projects" style="font-family: var(--font-mono); font-size: 0.8rem; text-decoration: underline; color: var(--fg-muted);">View all projects →</a>
      </div>
    </section>

    <section id="thoughts" style="margin-top: 10rem;">
      <h2 class="big-title">Research <br><span>Thoughts</span></h2>
      <div class="project-list">
        {#each homeThoughts as thought}
          <a href={thought.url} class="project-row">
            <div class="project-main">
              <h3>{thought.title}</h3>
              <p class="thought-desc">{thought.description}</p>
              <div class="project-tags">
                <span>{thought.date}</span>
                <span>{thought.readTime}</span>
                <span style={thought.tag.style}>{thought.tag.name}</span>
              </div>
            </div>
            <div class="arrow">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
              </svg>
            </div>
          </a>
        {/each}
      </div>
    </section>
  </div>
</div>