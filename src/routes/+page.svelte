<script lang="ts">
  import { blogThoughts, projects } from '$lib/data';
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
      Focused on low-level systems, compilers, and writing efficient software.
    </p>

    <section id="projects">
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

    <section id="thoughts" style="margin-top: 10rem;">
      <h2 class="big-title">Research <br><span>Thoughts</span></h2>
      <div class="project-list">
        {#each homeThoughts as thought}
          <ThoughtCard {thought} />
        {/each}
      </div>
    </section>
  </div>
</div>