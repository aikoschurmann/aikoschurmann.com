<script lang="ts">
  import { thoughts } from '$lib/data';
  import GithubStatus from '$lib/components/GithubStatus.svelte';
  import SocialLinks from '$lib/components/SocialLinks.svelte';

  const uniqueTags = ['All', ...new Set(thoughts.map(t => t.tag.name))];
  let activeFilter = $state('All');
  
  const filteredThoughts = $derived(
    activeFilter === 'All' 
      ? thoughts 
      : thoughts.filter(t => t.tag.name === activeFilter)
  );
</script>

<svelte:head>
  <title>Aiko Schürmann | Research Thoughts</title>
</svelte:head>

<div class="identity-grid reverse-mobile">
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
        
        {#if filteredThoughts.length === 0}
          <p style="color: var(--fg-muted); font-style: italic; margin-top: 2rem;">No posts found for this category.</p>
        {/if}
      </div>
    </section>
  </div>
</div>