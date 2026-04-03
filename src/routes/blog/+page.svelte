<script lang="ts">
  import { blogThoughts } from '$lib/data';
  import ProfileSidebar from '$lib/components/ProfileSidebar.svelte';
  import ThoughtCard from '$lib/components/ThoughtCard.svelte';

  const uniqueTags = ['All', ...new Set(blogThoughts.flatMap(t => t.tags.map(tag => tag.name)))];
  let activeFilter = $state('All');
  
  const filteredThoughts = $derived(
    activeFilter === 'All' 
      ? blogThoughts
      : blogThoughts.filter(t => t.tags.some(tag => tag.name === activeFilter))
  );
</script>

<svelte:head>
  <title>Research Thoughts</title>
</svelte:head>

<div class="identity-grid reverse-mobile">
  <ProfileSidebar />

  <div class="hero-content">
    <section id="thoughts">
      <h2 class="big-title">Research <br><span>Thoughts</span></h2>
      <p class="hero-desc">An archival log of research, technical insights, and observations.</p>
      
      <div class="filter-row">
        {#each uniqueTags as tag}
          <button 
            class="filter-btn" 
            class:active={activeFilter === tag}
            onclick={() => activeFilter = tag}
          >
            {tag}
          </button>
        {/each}
      </div>
      
      <div class="project-list">
        {#each filteredThoughts as thought}
          <ThoughtCard {thought} />
        {/each}
        
        {#if filteredThoughts.length === 0}
          <p style="color: var(--fg-muted); font-style: italic; margin-top: 2rem;">No posts found for this category.</p>
        {/if}
      </div>
    </section>
  </div>
</div>