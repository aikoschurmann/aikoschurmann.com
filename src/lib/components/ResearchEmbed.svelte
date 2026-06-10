<script lang="ts">
  import { researchThoughts } from '$lib/data';
  import ResearchCard from './ResearchCard.svelte';

  const { slug } = $props<{ slug: string }>();

  // Find the specific research item by slug
  const thought = $derived(researchThoughts.find(p => p.url.endsWith(`/${slug}`)));
</script>

{#if thought}
  <div class="research-embed-container">
    <span class="embed-slug">{slug.toUpperCase()}</span>
    <ResearchCard {thought} />
  </div>
{/if}

<style>


  .embed-slug {
    display: block;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--fg-muted);
    margin-bottom: 0.5rem;
    opacity: 0.6;
  }
</style>
