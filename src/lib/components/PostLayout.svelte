<script lang="ts">
  import { onMount } from 'svelte';
  
  let { title, date, children } = $props();

  let headings = $state<{ id: string; text: string; depth: number }[]>([]);
  let activeId = $state("");

  onMount(() => {
    // 1. Find all h2 and h3 elements inside the article prose
    const elements = Array.from(document.querySelectorAll('.prose h2, .prose h3'));

    headings = elements.map((el) => {
      // Create an ID for the heading if markdown didn't automatically generate one
      if (!el.id) {
        el.id = el.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'section';
      }
      return {
        id: el.id,
        text: el.textContent || '',
        depth: el.tagName === 'H3' ? 3 : 2
      };
    });

    // 2. Set up IntersectionObserver to detect which heading is currently on screen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Trigger when the heading crosses the top 20% of the viewport
          if (entry.isIntersecting) {
            activeId = entry.target.id;
          }
        });
      },
      { rootMargin: '0px 0px -80% 0px' } 
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  });
</script>

<svelte:head>
  <title>{title} | Aiko Schürmann</title>
</svelte:head>

<div class="post-layout">
  
  <!-- Main Content -->
  <article class="post-container">
    <header class="post-header">
      <div class="meta">{date}</div>
      <h1 class="post-title">{title}</h1>
    </header>

    <div class="prose">
      {@render children()}
    </div>

    <div class="post-footer">
      <a href="/blog" class="back-link">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to thoughts
      </a>
    </div>
  </article>

  <!-- Table of Contents Sidebar -->
  {#if headings.length > 0}
    <aside class="toc-sidebar">
      <span class="toc-title">On this page</span>
      <ul class="toc-list">
        {#each headings as heading}
          <li>
            <a
              href="#{heading.id}"
              class="toc-link depth-{heading.depth}"
              class:active={activeId === heading.id}
            >
              {heading.text}
            </a>
          </li>
        {/each}
      </ul>
    </aside>
  {/if}
</div>

<style>
  /* --- CSS Grid Layout --- */
  .post-layout {
    display: grid;
    /* Creates 3 columns: 1 flexible left, 1 centered 680px for text, 1 flexible right */
    grid-template-columns: 1fr minmax(auto, 680px) 1fr;
    gap: 2rem;
    align-items: start; /* CRITICAL: Prevents columns from stretching, allowing sticky to work */
    max-width: 100%;
  }

  .post-container {
    grid-column: 2;
    min-width: 0; /* Prevents long text/code blocks from blowing out the grid */
    padding-bottom: 2rem;
  }

  /* --- Sidebar Styles --- */
  .toc-sidebar {
    grid-column: 3;
    position: sticky;
    top: 6rem; /* Stays fixed near the top of the screen */
    padding-left: 1.5rem;
    border-left: 1px solid var(--border);
    max-height: calc(100vh - 8rem);
    overflow-y: auto;
    
    /* Hide scrollbar for cleaner look */
    scrollbar-width: none;
  }
  
  .toc-sidebar::-webkit-scrollbar {
    display: none;
  }

  .post-header {
    text-align: center;
    margin-bottom: 5rem;
  }

  .meta {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 1.5rem;
  }

  .post-title {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 800;
    letter-spacing: -0.05em;
    line-height: 1;
    margin-bottom: 0;
  }

  .post-footer {
    margin-top: 6rem;
    display: flex;
    justify-content: center;
  }

  .back-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: var(--fg-muted);
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .back-link svg {
    color: var(--accent);
  }

  .back-link:hover {
    color: var(--fg);
  }

  .back-link:hover svg {
    transform: translateX(-4px);
  }

  /* --- TOC Typography --- */
  .toc-title {
    display: block;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg);
    margin-bottom: 1.25rem;
  }

  .toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .toc-link {
    display: block;
    font-family: var(--font-sans);
    font-size: 0.85rem;
    color: var(--fg-muted);
    text-decoration: none;
    line-height: 1.4;
    transition: color 0.2s ease;
  }

  /* Indents H3 tags to show hierarchy */
  .toc-link.depth-3 {
    padding-left: 1rem;
    font-size: 0.8rem;
  }

  .toc-link:hover {
    color: #ffffff;
  }

  .toc-link.active {
    color: var(--accent);
    font-weight: 600;
  }

  /* Automatically hide the sidebar and revert to a single column on smaller screens */
  @media (max-width: 1024px) {
    .post-layout {
      grid-template-columns: 1fr;
      padding: 0 1rem;
    }
    
    .post-container {
      grid-column: 1;
    }

    .toc-sidebar {
      display: none;
    }
  }
</style>