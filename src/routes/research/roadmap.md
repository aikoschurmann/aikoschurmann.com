---
title: "Academic Roadmap"
description: "Tracking my academic progression and formal research, from undergraduate foundations to advanced theses and papers."
---

<script>
  import ResearchEmbed from '$lib/components/ResearchEmbed.svelte';
  import ResearchSection from '$lib/components/ResearchSection.svelte';
  import MilestonePlaceholder from '$lib/components/MilestonePlaceholder.svelte';
</script>

<ResearchSection 
  title="Degree Theses" 
  count={1}
  kicker="Academic Path"
  description="Formal research contributions conducted during my undergraduate and graduate studies."
>
  <ResearchEmbed slug="bachelor-thesis" />
  
  <MilestonePlaceholder 
    title="Master's Thesis"
    details="Coming 2027 - 2028 @ KU Leuven"
  />
</ResearchSection>

