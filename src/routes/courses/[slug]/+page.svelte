<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { page } from '$app/state';
  import type { PageData } from './$types';
  import { setContext } from 'svelte';

  let { data } = $props<{ data: PageData }>();
  const course = $derived(data.course);
  const canonicalUrl = $derived(`${page.url.origin}${page.url.pathname}`);

  let headings = $state<{ id: string; text: string; depth: number }[]>([]);
  let activeId = $state("");
  let tocLockUntil = 0;
  let lockedHeadingId: string | null = null;
  let tocListEl = $state<HTMLElement | null>(null);

  // Track which sections are expanded. Key is the section index or a slug.
  let expandedSections = $state<Record<string, boolean>>({
    "1": true, // Default expand first section
  });

  function toggleSection(id: string, force?: boolean) {
    expandedSections[id] = force !== undefined ? force : !expandedSections[id];
  }

  // Svelte 5 reactive context
  setContext('course', () => course);
  setContext('courseUI', {
    expandedSections: () => expandedSections,
    toggleSection
  });

  async function navigateToHeading(headingId: string) {
    // 1. If it's a chapter, we need to ensure its parent section is open
    const chapterEl = document.getElementById(headingId);
    if (chapterEl?.classList.contains('course-chapter-link')) {
      const parentSection = chapterEl.closest('.course-section');
      if (parentSection?.id) {
        const sectionId = parentSection.id.replace('section-', '');
        if (!expandedSections[sectionId]) {
          toggleSection(sectionId, true);
          await tick(); // Wait for DOM to expand
        }
      }
    }

    const heading = document.getElementById(headingId);
    if (!heading) return;

    const prefers_reduced_motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headingTopInViewport = heading.getBoundingClientRect().top;
    const distance = Math.abs(headingTopInViewport);
    const lockDurationMs = prefers_reduced_motion ? 0 : Math.min(1500, Math.max(450, distance * 0.8));
    const topOffset = 120;
    const targetY = Math.max(0, window.scrollY + headingTopInViewport - topOffset);

    lockedHeadingId = headingId;
    tocLockUntil = performance.now() + lockDurationMs;

    window.scrollTo({
      top: targetY,
      behavior: prefers_reduced_motion ? 'auto' : 'smooth',
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

    const prefers_reduced_motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const centeredTop = activeLink.offsetTop - (tocListEl.clientHeight - activeLink.offsetHeight) / 2;
    const clampedTop = Math.max(0, Math.min(centeredTop, tocListEl.scrollHeight - tocListEl.clientHeight));

    tocListEl.scrollTo({
      top: clampedTop,
      behavior: prefers_reduced_motion ? 'auto' : behavior
    });
  }

  function updateTOCHeadings() {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('#introduction, .course-section, .course-chapter-link'));

    headings = elements.map((el) => {
      let id = el.id;
      let text = "";
      let depth = 2;

      if (el.id === 'introduction') {
        text = "Overview";
        depth = 1;
      } else if (el.classList.contains('course-section')) {
        text = el.querySelector('.course-section-title')?.textContent?.trim() || "Section";
        depth = 2;
      } else if (el.classList.contains('course-chapter-link')) {
        text = el.querySelector('.chapter-title')?.textContent?.trim() || "Chapter";
        depth = 3;
      }

      return { id, text, depth };
    });
  }

  onMount(() => {
    updateTOCHeadings();

    // 2. Track section by scroll position
    const activationOffset = 180;
    const updateActiveHeading = () => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>('#introduction, .course-section, .course-chapter-link'));
      if (elements.length === 0) return;

      if (isTocLocked()) {
        activeId = lockedHeadingId || activeId;
        return;
      }

      let currentId = elements[0].id || 'introduction';
      for (const el of elements) {
        // Skip hidden chapters (those in closed sections)
        if (el.offsetParent === null) continue;

        if (el.getBoundingClientRect().top <= activationOffset) {
          currentId = el.id || 'introduction';
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

    // Watch for DOM changes (like sections expanding) to update TOC list
    const observer = new MutationObserver(() => {
      updateTOCHeadings();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('keydown', onGlobalKeydown);
      observer.disconnect();
    };
  });

  $effect(() => {
    if (activeId) {
      keepActiveTocLinkInView('smooth');
    }
  });
</script>

<svelte:head>
  <title>{course.title} | Course</title>
  <meta name="description" content={course.description} />
  <link rel="canonical" href={canonicalUrl} />

  <meta property="og:title" content={`${course.title} | Course`} />
  <meta property="og:description" content={course.description} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:type" content="article" />

  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={`${course.title} | Course`} />
  <meta name="twitter:description" content={course.description} />
</svelte:head>

<div class="post-layout">
  <div class="post-container">
    <header class="post-header">
      <h1 class="post-title" id="introduction">{course.title}</h1>
      <div class="course-meta-row">
        {#each course.tags as tag}
          <span class="tag" style={tag.style}>{tag.name}</span>
        {/each}
        <span class="progress-chip">{course.postCount} {course.postCount === 1 ? 'chapter' : 'chapters'}</span>
      </div>
      {#if course.description}
        <p class="hero-desc">{course.description}</p>
      {/if}
    </header>

    <!-- The markdown file completely dictates the rest of the course page layout -->
    {#if course.component}
      {@const Content = course.component}
      <div class="course-md-content prose">
        <Content />
      </div>
    {/if}
  </div>

  <!-- Table of Contents Sidebar -->
  {#if headings.length > 0}
    <aside class="toc-sidebar">
      <span class="toc-title">Course Content</span>
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
  /* --- Grid Layout matching PostLayout exactly --- */
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

  /* --- Sidebar TOC Styles --- */
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
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg);
  }

  .toc-list {
    overflow-y: auto;
    min-height: 0;
    scrollbar-width: none;
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    border-left: 1px solid var(--border);
  }
  
  .toc-list::-webkit-scrollbar {
    display: none;
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

  .toc-link.depth-1,
  .toc-link.depth-2 {
    font-weight: 600;
  }

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
    background: rgba(59, 130, 246, 0.08);
  }

  /* --- Course Overview Specific Header --- */
  .post-header {
    text-align: center;
    margin-bottom: 5rem;
  }

  .post-title {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 800;
    letter-spacing: -0.05em;
    line-height: 1;
    margin-bottom: 0;
    scroll-margin-top: 10rem;
  }

  .course-meta-row {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
    margin-top: 1.5rem;
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

  .progress-chip {
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

  .hero-desc {
    text-align: center;
    max-width: 600px;
    margin: 2rem auto 0;
    color: var(--fg-muted);
    font-size: 1.15rem;
    line-height: 1.6;
  }

  .course-md-content {
    text-align: left;
  }

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
