<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { getCourseBySlug, getTagData } from '$lib/data';
  
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
  let tocListEl = $state<HTMLElement | null>(null);

  const canonicalUrl = $derived(`${page.url.origin}${page.url.pathname}`);
  const ogImageUrl = $derived(`${page.url.origin}/picture.jpg`);
  const fullTitle = $derived(`${title} | Systems Notes`);
  const metaDescription = $derived(description || `Research and technical notes on ${title}.`);
  const tagData = $derived(tag ? getTagData(tag) : undefined);
  const displayDate = $derived.by(() => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(parsed).toUpperCase();
  });
  const courseContext = $derived.by(() => {
    const courseSlug = page.url.searchParams.get('course');
    if (!courseSlug) return null;
    const requestedPart = Number.parseInt(page.url.searchParams.get('part') || '', 10);

    const course = getCourseBySlug(courseSlug);
    if (!course) return null;

    const currentIndex = Number.isNaN(requestedPart)
      ? course.posts.findIndex((post) => post.url === page.url.pathname)
      : course.posts.findIndex((post) => post.url === page.url.pathname && post.part === requestedPart);
    if (currentIndex === -1) return null;

    const currentPost = course.posts[currentIndex];

    return {
      slug: course.slug,
      title: course.title,
      currentPart: currentPost.part,
      totalParts: course.posts.length,
      prev: currentIndex > 0 ? course.posts[currentIndex - 1] : null,
      next: currentIndex < course.posts.length - 1 ? course.posts[currentIndex + 1] : null
    };
  });
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

  function navigateToHeading(headingId: string) {
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

    const url = new URL(window.location.href);
    url.hash = headingId;
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    activeId = headingId;
  }

  function handleTocNavigation(event: MouseEvent, headingId: string) {
    event.preventDefault();
    const currentLink = event.currentTarget;
    if (currentLink instanceof HTMLAnchorElement) {
      currentLink.focus({ preventScroll: true });
    }
    navigateToHeading(headingId);
  }

  function isTocNavigationKey(key: string) {
    return key === 'ArrowDown' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowLeft' || key === 'Home' || key === 'End';
  }

  function handleTocKeyNavigation(event: KeyboardEvent, headingId?: string) {
    if (!isTocNavigationKey(event.key)) return;
    if (!tocListEl) return;

    const links = Array.from(tocListEl.querySelectorAll<HTMLAnchorElement>('.toc-link'));
    if (links.length === 0) return;

    const focusedElement = document.activeElement;
    const focusedLink = focusedElement instanceof HTMLAnchorElement && tocListEl.contains(focusedElement)
      ? focusedElement
      : null;
    const focusedHeadingId = focusedLink?.dataset.headingId;

    const currentHeadingId = headingId || focusedHeadingId || activeId || links[0].dataset.headingId;
    if (!currentHeadingId) return;

    const currentIndex = links.findIndex((link) => link.dataset.headingId === currentHeadingId);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      targetIndex = Math.min(links.length - 1, currentIndex + 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      targetIndex = Math.max(0, currentIndex - 1);
    } else if (event.key === 'Home') {
      targetIndex = 0;
    } else if (event.key === 'End') {
      targetIndex = links.length - 1;
    } else {
      return;
    }

    event.preventDefault();

    const targetLink = links[targetIndex];
    const targetHeadingId = targetLink.dataset.headingId;
    if (!targetHeadingId) return;

    targetLink.focus({ preventScroll: true });
    navigateToHeading(targetHeadingId);
  }

  function isTocLocked() {
    if (!lockedHeadingId) return false;
    if (performance.now() >= tocLockUntil) {
      lockedHeadingId = null;
      return false;
    }
    return true;
  }

  function keepActiveTocLinkInView(behavior: ScrollBehavior = 'auto') {
    if (!activeId || !tocListEl) return;

    const safeId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(activeId) : activeId;
    const activeLink = tocListEl.querySelector<HTMLElement>(`.toc-link[data-heading-id="${safeId}"]`);
    if (!activeLink) return;

    const containerRect = tocListEl.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const linkCenter = (linkRect.top + linkRect.bottom) / 2;
    const upperBound = containerRect.top + containerRect.height * 0.32;
    const lowerBound = containerRect.top + containerRect.height * 0.68;

    const shouldRecenter = linkCenter < upperBound || linkCenter > lowerBound;
    if (!shouldRecenter) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const centeredTop = activeLink.offsetTop - (tocListEl.clientHeight - activeLink.offsetHeight) / 2;
    const clampedTop = Math.max(0, Math.min(centeredTop, tocListEl.scrollHeight - tocListEl.clientHeight));

    tocListEl.scrollTo({
      top: clampedTop,
      behavior: prefersReducedMotion ? 'auto' : behavior
    });
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

    const onGlobalKeydown = (event: KeyboardEvent) => {
      if (!tocListEl || !isTocNavigationKey(event.key)) return;

      const focusedElement = document.activeElement as HTMLElement | null;
      const focusWithinToc = !!focusedElement && tocListEl.contains(focusedElement);
      const tocSidebar = tocListEl.closest('.toc-sidebar');
      const tocHovered = tocListEl.matches(':hover') || (!!tocSidebar && tocSidebar.matches(':hover'));

      if (!focusWithinToc && !tocHovered) return;

      handleTocKeyNavigation(event);
    };

    updateActiveHeading();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('keydown', onGlobalKeydown);

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('keydown', onGlobalKeydown);
    };
  });

  $effect(() => {
    if (activeId) {
      keepActiveTocLinkInView('smooth');
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
      <div class="meta">{displayDate}</div>
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
      {#if courseContext}
        <div class="course-reading-nav">
          <a href={`/courses/${courseContext.slug}`} class="back-link">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to course
          </a>

          <div class="course-progress-chip">Part {courseContext.currentPart} / {courseContext.totalParts}</div>

          <div class="course-step-links">
            {#if courseContext.prev}
              <a class="course-step-link" href={`${courseContext.prev.url}?course=${courseContext.slug}&part=${courseContext.prev.part}`}>
                Previous chapter
              </a>
            {/if}
            {#if courseContext.next}
              <a class="course-step-link" href={`${courseContext.next.url}?course=${courseContext.slug}&part=${courseContext.next.part}`}>
                Next chapter
              </a>
            {/if}
          </div>
        </div>
      {:else}
        <a href="/blog" class="back-link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to thoughts
        </a>
      {/if}
    </div>
  </article>

  <!-- Table of Contents Sidebar -->
  {#if headings.length > 0}
    <aside class="toc-sidebar">
      <span class="toc-title">On this page</span>
      <ul class="toc-list" bind:this={tocListEl}>
        {#each headings as heading}
          <li>
            <a
              href="#{heading.id}"
              data-heading-id={heading.id}
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
    max-height: min(70vh, 36rem);
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .toc-title {
    flex: 0 0 auto;
    background: var(--bg);
    padding-bottom: 0.5rem;
    margin-bottom: 0.75rem;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .toc-list {
    overflow-y: auto;
    min-height: 0;
    scrollbar-width: none;
  }
  
  .toc-list::-webkit-scrollbar {
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

  .course-reading-nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 0.65rem;
  }

  .course-progress-chip {
    padding: 0.35rem 0.6rem;
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

  .course-step-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .course-step-link {
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
    text-transform: uppercase;
    color: var(--fg);
    text-decoration: none;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .course-step-link:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
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
    margin-bottom: 0.75rem;
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
    border-radius: 4px;
    outline: none;
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

  .toc-link:focus {
    outline: none;
  }

  .toc-link:focus-visible {
    outline: none;
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