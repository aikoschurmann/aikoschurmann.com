<script lang="ts">
  import { blogThoughts } from '$lib/data';
  import WritingList from '$lib/components/WritingList.svelte';

  const featuredTags = ['All', 'C', 'SECURITY', 'INTERNING', 'ZIG'];
  let activeFilter = $state('All');
  
  const filteredThoughts = $derived(
    activeFilter === 'All' 
      ? blogThoughts
      : blogThoughts.filter(t => t.tags.some(tag => tag.name === activeFilter))
  );
</script>

<svelte:head>
  <title>Engineering Thoughts</title>
</svelte:head>

<div class="page-single">
  <div class="hero-content">
    <section id="thoughts">
      <h2 class="big-title">Engineering <br><span>Thoughts</span></h2>
      <p class="hero-desc">An archival log of research, technical insights, and observations.</p>
      
      <div class="filter-row">
        {#each featuredTags as tag}
          <button 
            class="filter-btn" 
            class:active={activeFilter === tag}
            onclick={() => activeFilter = tag}
          >
            {tag}
          </button>
        {/each}
      </div>
      
      <WritingList thoughts={filteredThoughts} />

      {#if filteredThoughts.length === 0}
        <p class="empty">No posts found for this category.</p>
      {/if}
    </section>
  </div>
</div>

<style>
  .empty {
    color: var(--fg-muted);
    font-style: italic;
    margin-top: 2rem;
  }
</style>
