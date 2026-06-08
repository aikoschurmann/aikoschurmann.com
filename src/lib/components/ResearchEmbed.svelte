<script lang="ts">
  import { researchThoughts } from '$lib/data';
  import ResearchCard from './ResearchCard.svelte';

  const { slug } = $props<{ slug: string }>();

  // Find the specific research item by slug
  const thought = $derived(researchThoughts.find(p => p.url.endsWith(`/${slug}`)));
</script>

{#if thought}
  <ResearchCard {thought} />
{/if}
