<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { getTagData } from '$lib/data';
  
  let { title, date, description = '', tag, children } = $props<{
    title: string;
    date: string;
    description?: string;
    tag?: string;
    children: any;
  }>();

  let headings = $state<{ id: string; text: string; depth: number }[]>([]);
  let activeId = $state("");
  let tocLockUntil = 0;
  let lockedHeadingId: string | null = null;

  const canonicalUrl = $derived(`${page.url.origin}${page.url.pathname}`);
  const ogImageUrl = $derived(`${page.url.origin}/picture.jpg`);
  const fullTitle = $derived(`${title} | Aiko Schurmann`);
  const metaDescription = $derived(description || `Research and technical thoughts on ${title} by Aiko Schurmann.`);
  const tagData = $derived(tag ? getTagData(tag) : undefined);
  const publishedTime = $derived.by(() => {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return undefined;
    return parsedDate.toISOString();
  });

  const articleJsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description: metaDescription,
      author: {
        '@type': 'Person',
        name: 'Aiko Schurmann'
      },
      datePublished: publishedTime,
      dateModified: publishedTime,
      url: canonicalUrl,
      image: ogImageUrl,
      inLanguage: 'en'
    })
  );

  function handleTocNavigation(event: MouseEvent, headingId: string) {
    event.preventDefault();

    const heading = document.getElementById(headingId);
    if (!heading) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headingTopInViewport = heading.getBoundingClientRect().top;
    const distance = Math.abs(headingTopInViewport);
    const lockDurationMs = prefersReducedMotion ? 0 : Math.min(1500, Math.max(450, distance * 0.8));
    const topOffset = 120;
    const targetY = Math.max(0, window.scrollY + headingTopInViewport - topOffset);

    lockedHeadingId = headingId;
    tocLockUntil = performance.now() + lockDurationMs;

    window.scrollTo({
      top: targetY,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });

    history.replaceState(null, '', `#${headingId}`);
    activeId = headingId;
  }

  function isTocLocked() {
    if (!lockedHeadingId) return false;
    if (performance.now() >= tocLockUntil) {
      lockedHeadingId = null;
      return false;
    }
    return true;
  }

  onMount(() => {
    // 1. Find the main title and all h2/h3 elements
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.post-title, .prose h2, .prose h3'));

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

    // 2. Track section by scroll position. This is stable in both scroll directions.
    const activationOffset = 180;
    const updateActiveHeading = () => {
      if (elements.length === 0) return;

      if (isTocLocked()) {
        activeId = lockedHeadingId || activeId;
        return;
      }

      let currentId = elements[0].id;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= activationOffset) {
          currentId = el.id;
        } else {
          break;
        }
      }

      activeId = currentId;
    };

    let ticking = false;
    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        updateActiveHeading();
      });
    };

    updateActiveHeading();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  });

  $effect(() => {
    if (activeId) {
      const activeLink = document.querySelector(`.toc-link[href="#${activeId}"]`);
      if (activeLink) {
        activeLink.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  });
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={metaDescription} />
  <link rel="canonical" href={canonicalUrl} />
  
  <!-- Open Graph -->
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={metaDescription} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={ogImageUrl} />
  <meta property="og:type" content="article" />
  {#if publishedTime}
    <meta property="article:published_time" content={publishedTime} />
  {/if}
  <meta property="article:author" content="Aiko Schurmann" />
  
  <!-- X/Twitter cards work without a Twitter account -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={metaDescription} />
  <meta name="twitter:image" content={ogImageUrl} />

  <script type="application/ld+json">{articleJsonLd}</script>
</svelte:head>

<div class="post-layout">
  
  <!-- Main Content -->
  <article class="post-container">
    <header class="post-header">
      <div class="meta">{date}</div>
      <h1 class="post-title" id="introduction">{title}</h1>
      {#if tagData}
        <div class="meta-row">
          <div class="tags-list">
            <span class="tag" style={tagData.style}>{tagData.name}</span>
          </div>
        </div>
      {/if}
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
              onclick={(event) => handleTocNavigation(event, heading.id)}
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
    grid-template-columns: minmax(0, 1fr) minmax(0, 680px) minmax(0, 1fr);
    gap: 2rem;
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
    width: min(100%, 400px);
    justify-self: start;
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

  .meta-row {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
    margin-top: 1.5rem;
  }

  .tags-list {
    display: flex;
    gap: 0.6rem;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.35rem 0.8rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--fg);
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
  }

  .toc-link.active {
    color: var(--accent);
    border-left-color: transparent;
    background: rgba(59, 130, 246, 0.08);
  }

  /* Automatically hide the sidebar and revert to a single column on smaller screens */
  @media (max-width: 1200px) {
    .post-layout {
      grid-template-columns: 1fr;
      padding: 0;
    }
    
    .post-container {
      grid-column: 1;
    }

    .toc-sidebar {
      display: none;
    }
  }
</style>