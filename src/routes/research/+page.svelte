<script lang="ts">
  import AcademicTimeline from '$lib/components/AcademicTimeline.svelte';
</script>

<svelte:head>
  <title>Academic Roadmap</title>
</svelte:head>

<div class="page-single">
  <div class="hero-content">
    <section id="research">
      <h2 class="big-title">Academic <br><span>Roadmap</span></h2>
      <p class="hero-desc">Degrees, theses and the formal research that came out of them.</p>

      <AcademicTimeline />
    </section>
  </div>
</div>
