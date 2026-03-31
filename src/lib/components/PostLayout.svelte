<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  
  let { title, date, children } = $props();

  let headings = $state<{ id: string; text: string; depth: number }[]>([]);
  let activeId = $state("");

  const canonicalUrl = $derived(`https://aikoschurmann.com${page.url.pathname}`);

  onMount(() => {
    // 1. Find the main title and all h2/h3 elements
    const elements = Array.from(document.querySelectorAll('.post-title, .prose h2, .prose h3'));

    headings = elements.map((el) => {
      // Create an ID for the heading if markdown didn't automatically generate one
      if (!el.id) {
        el.id = el.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'section';
      }
      
      let depth = 2;
      if (el.classList.contains('post-title')) depth = 1;
      else if (el.tagName === 'H3') depth = 3;

      return {
        id: el.id,
        text: el.textContent || '',
        depth: depth
      };
    });

    // 2. Set up IntersectionObserver to detect which heading is currently on screen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
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
  <title>{title} | Aiko Schurmann</title>
  <meta name="description" content="Research and technical thoughts on {title} by Aiko Schurmann." />
  <link rel="canonical" href={canonicalUrl} />
  
  <!-- Open Graph -->
  <meta property="og:title" content={title} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:type" content="article" />
  <meta property="article:published_time" content={date} />
  <meta property="article:author" content="Aiko Schurmann" />
  
  <!-- Twitter -->
  <meta name="twitter:title" content={title} />
</svelte:head>

<div class="post-layout">
  
  <!-- Main Content -->
  <article class="post-container">
    <header class="post-header">
      <div class="meta">{date}</div>
      <h1 class="post-title" id="introduction">{title}</h1>
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
    /* Widened the 3rd column and increased gap for a more spacious feel */
    grid-template-columns: 1fr 680px 1.6fr;
    gap: 4rem;
    align-items: start; 
    max-width: 100%;
  }

  .post-container {
    grid-column: 2;
    min-width: 0;
    padding-bottom: 2rem;
  }

  /* --- Sidebar Styles --- */
  .toc-sidebar {
    grid-column: 3;
    position: sticky;
    top: 6rem;
    max-height: calc(100vh - 8rem);
    overflow-y: auto;
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
    scroll-margin-top: 10rem;
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
    gap: 0.25rem;
    border-left: 1px solid var(--border);
  }

  .toc-link {
    display: block;
    font-family: var(--font-sans);
    font-size: 0.8rem;
    color: var(--fg-muted);
    text-decoration: none;
    line-height: 1.5;
    transition: all 0.2s ease;
    padding: 0.4rem 1rem;
    border-left: 2px solid transparent;
    margin-left: -1px;
  }

  /* Title (depth-1) now looks exactly like a normal section (depth-2) */
  .toc-link.depth-1,
  .toc-link.depth-2 {
    font-weight: 600;
  }

  /* Indents H3 tags to show hierarchy */
  .toc-link.depth-3 {
    padding-left: 2rem;
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .toc-link:hover {
    color: var(--fg);
    background: rgba(255, 255, 255, 0.03);
  }

  .toc-link.active {
    color: var(--accent);
    border-left-color: var(--accent);
    background: rgba(59, 130, 246, 0.05);
  }

  .toc-link.depth-1.active,
  .toc-link.depth-2.active {
    font-weight: 700;
  }

  .toc-link.depth-3.active {
    color: var(--fg);
    border-left-color: var(--accent);
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