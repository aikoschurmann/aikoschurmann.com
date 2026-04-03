<script lang="ts">
  import { getContext } from 'svelte';
  import type { Course } from '$lib/data';

  const { slug } = $props<{ slug: string }>();
  const getCourse = getContext<() => Course>('course');
  const course = $derived(getCourse ? getCourse() : undefined);

  // Find the specific chapter by seeing if its URL ends with the provided slug
  const chapter = $derived(course?.posts?.find(p => p.url.endsWith(`/${slug}`)));
</script>

{#if chapter}
  <a id={slug} class="course-chapter-link" href={`${chapter.url}?course=${course?.slug}&part=${chapter.part}`}>
    <div class="chapter-top">
      <span class="chapter-index">CH {chapter.part}</span>
      <h3 class="chapter-title">{chapter.chapterTitle ?? chapter.title}</h3>
    </div>
    {#if chapter.description}
      <p class="chapter-desc">{chapter.description}</p>
    {/if}
    <div class="chapter-meta">
      {#each chapter.tags as tag}
        <span class="chapter-tag" style={tag.style}>{tag.name}</span>
      {/each}
      <span class="chapter-read-time">{chapter.readTime}</span>
    </div>
  </a>
{/if}

<style>
  .course-chapter-link {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    text-decoration: none !important;
    color: var(--fg) !important;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.02);
    padding: 1.25rem 1.5rem;
    margin: 0.5rem 0;
    transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
    scroll-margin-top: 8rem;
  }

  .course-chapter-link:hover {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
  }

  .chapter-top {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    min-height: 1.6rem;
  }

  .chapter-index {
    flex-shrink: 0;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
    text-transform: uppercase;
    color: var(--fg-muted);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .chapter-title {
    font-family: var(--font-sans) !important;
    font-size: 1.25rem !important;
    font-weight: 700 !important;
    margin: 0 !important;
    letter-spacing: -0.01em !important;
    color: var(--fg) !important;
    line-height: 1.2 !important;
    display: inline-block;
  }

  .chapter-desc {
    font-family: var(--font-sans) !important;
    font-size: 1.05rem !important;
    color: var(--fg-muted) !important;
    line-height: 1.55 !important;
    margin: 0 !important;
    max-width: 640px !important;
  }

  .chapter-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin-top: 0.2rem;
  }

  .chapter-meta span {
    padding: 0.3rem 0.52rem;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
    text-transform: uppercase;
    color: var(--fg-muted);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 1100px) {
    .course-chapter-link {
      text-align: left;
      padding: 1rem 1.25rem;
    }
    .chapter-top {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.5rem;
    }
    .chapter-title {
      font-size: 1.15rem !important;
    }
  }

  @media (max-width: 640px) {
    .chapter-read-time {
      display: none;
    }
  }
</style>
