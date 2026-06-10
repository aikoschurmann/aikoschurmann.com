<script lang="ts">
  import { blogThoughts, researchThoughts, researchRoadmap, projects } from '$lib/data';
  import ProfileSidebar from '$lib/components/ProfileSidebar.svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import ThoughtCard from '$lib/components/ThoughtCard.svelte';

  const homeProjects = projects.filter(p => p.showOnHome);
  const homeThoughts = blogThoughts.filter(t => t.showOnHome);
</script>

<svelte:head>
  <title>Aiko Schurmann | Software Engineer</title>
</svelte:head>

<div class="identity-grid">
  <ProfileSidebar eagerImage={true} />

  <div class="hero-content">
    <h1 class="big-title">Software <br><span>Engineer</span></h1>
  
    <p class="hero-desc">
      Computer science student currently at <strong>VUB</strong>, soon continuing at <strong>KU Leuven</strong> for an MSc in Software Engineering.
      Focused on low-level systems, compilers, and writing efficient software. Outside of tech, I run a photography business called <a href="https://tarchief.studio" target="_blank" rel="noopener" style="text-decoration: underline; color: inherit;">Studio 't archief</a>.
    </p>

    {#if researchRoadmap}
      <section id="research" style="margin-top: 6rem;">
        <h2 class="big-title">Academic <br><span>Roadmap</span></h2>
        
        {#if researchRoadmap.component}
          {@const Roadmap = researchRoadmap.component}
          <div class="roadmap-homepage-content">
            <Roadmap />
          </div>
        {/if}
      </section>
    {/if}

    <section id="projects" style="margin-top: 10rem;">
      <h2 class="big-title">Recent <br><span>Projects</span></h2>
      
      <div class="project-grid">
        {#each homeProjects as project}
          <ProjectCard {project} openInNewTab={true} />
        {/each}
      </div>
      
      <div style="margin-top: 2rem; padding: 0;">
        <a href="/projects" style="font-family: var(--font-mono); font-size: 0.8rem; text-decoration: underline; color: var(--fg-muted);">View all projects →</a>
      </div>
    </section>

    {#if homeThoughts.length > 0}
      <section id="thoughts" style="margin-top: 10rem;">
        <h2 class="big-title">Engineering <br><span>Thoughts</span></h2>
        <div class="project-list">
          {#each homeThoughts as thought}
            <ThoughtCard {thought} />
          {/each}
        </div>
      </section>
    {/if}
  </div>
</div>

<style>
  .roadmap-homepage-content {
    text-align: left;
    margin-top: 4rem;
  }

  /* Ensure roadmap intro text matches the site aesthetic */
  .roadmap-homepage-content :global(p) {
    font-size: 1.25rem;
    color: var(--fg-muted);
    max-width: 500px;
    line-height: 1.5;
    margin-bottom: 2rem;
  }
</style>