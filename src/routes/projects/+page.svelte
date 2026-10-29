<script lang="ts">
  import { projects } from '$lib/data';
  import ProjectList from '$lib/components/ProjectList.svelte';
</script>

<svelte:head>
  <title>Projects Archive</title>
</svelte:head>

<div class="page-single">
  <div class="hero-content">
    <section id="projects">
      <h2 class="big-title">All <br><span>Projects</span></h2>
      <ProjectList {projects} />
    </section>
  </div>
</div>