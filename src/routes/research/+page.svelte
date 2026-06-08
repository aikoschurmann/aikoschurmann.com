<script lang="ts">
  import { researchRoadmap } from '$lib/data';
  import ProfileSidebar from '$lib/components/ProfileSidebar.svelte';

  const roadmap = researchRoadmap;
</script>

<svelte:head>
  <title>{roadmap.title}</title>
</svelte:head>

<div class="identity-grid reverse-mobile">
  <ProfileSidebar />

  <div class="hero-content">
    <section id="thoughts">
      <h2 class="big-title">Academic <br><span>Roadmap</span></h2>
      
      {#if roadmap.component}
        {@const Content = roadmap.component}
        <div class="roadmap-md-content prose">
          <Content />
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .roadmap-md-content {
    text-align: left;
    margin-top: 4rem;
  }
</style>