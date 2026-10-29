<script lang="ts">
  import { researchThoughts } from '$lib/data';

  const bachelorThesis = researchThoughts.find((t) => t.url === '/research/bachelor-thesis');

  const timeline = [
    {
      years: '2026 – now',
      degree: 'MSc Software Engineering',
      school: 'KU Leuven',
      current: true,
      note: "Master's thesis · 2027 – 2028"
    },
    {
      years: '2023 – 2026',
      degree: 'BSc Computer Science',
      school: 'VUB',
      thesis: bachelorThesis
    }
  ];
</script>

<ol class="row-list">
  {#each timeline as step}
    <li class="row">
      <span class="row-label">
        {#if step.current}<span class="row-dot" aria-hidden="true"></span>{/if}
        {step.years}
      </span>
      <span class="row-main">
        <span class="row-title">{step.degree}</span>
        <span class="row-desc">{step.school}</span>

        {#if step.thesis}
          <span class="timeline-links">
            <a href={step.thesis.url} class="row-meta">Bachelor's thesis →</a>
            {#if step.thesis.download}
              <a href={step.thesis.download} class="row-meta" target="_blank" rel="noopener">PDF ↓</a>
            {/if}
          </span>
        {:else if step.note}
          <span class="row-meta timeline-note">{step.note}</span>
        {/if}
      </span>
    </li>
  {/each}
</ol>

<style>
  .row { grid-template-columns: 7.5rem 1fr; }

  .timeline-links {
    display: flex;
    gap: 1.25rem;
    margin-top: 0.4rem;
  }

  .timeline-links a {
    color: var(--fg-muted);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .timeline-links a:hover { color: var(--fg); }

  .timeline-note { margin-top: 0.4rem; }

  @media (max-width: 600px) {
    .row { grid-template-columns: 1fr; }
  }
</style>
