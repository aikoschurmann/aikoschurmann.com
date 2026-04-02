<script lang="ts">
  import { projects } from '$lib/data';
  import ProfileSidebar from '$lib/components/ProfileSidebar.svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
</script>

<svelte:head>
  <title>Projects Archive</title>
</svelte:head>

<div class="identity-grid reverse-mobile">
  <ProfileSidebar />

  <div class="hero-content">
    <section id="projects">
      <h2 class="big-title">All <br><span>Projects</span></h2>
      <div class="project-grid">
        {#each projects as project}
          <ProjectCard {project} />
        {/each}
      </div>
    </section>
  </div>
</div>