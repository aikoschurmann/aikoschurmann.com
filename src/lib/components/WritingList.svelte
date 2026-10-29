<script lang="ts">
  import type { Thought } from '$lib/data';

  let { thoughts } = $props<{ thoughts: Thought[] }>();

  function shortDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
</script>

<ul class="row-list">
  {#each thoughts as thought}
    <li>
      <a href={thought.url} class="row">
        <span class="row-label">{shortDate(thought.date)}</span>
        <span class="row-main">
          <span class="row-title">{thought.title}</span>
          {#if thought.description}
            <span class="row-desc">{thought.description}</span>
          {/if}
          <span class="project-tags row-pills">
            <span>{thought.readTime}</span>
            {#each thought.tags as tag}
              <span style={tag.style}>{tag.name}</span>
            {/each}
          </span>
        </span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    </li>
  {/each}
</ul>
