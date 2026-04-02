<script lang="ts">
  import { page } from '$app/state';
  import ProfileSidebar from '$lib/components/ProfileSidebar.svelte';
  import { getTagData } from '$lib/data';
  import type { PageData } from './$types';

  let { data } = $props<{ data: PageData }>();
  const course = $derived(data.course);
  const levelTag = $derived(getTagData(course.level));
  const canonicalUrl = $derived(`${page.url.origin}${page.url.pathname}`);
  const collapsedSections = $state<Record<number, boolean>>({});

  function toggleSection(sectionIndex: number) {
    collapsedSections[sectionIndex] = !collapsedSections[sectionIndex];
  }
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

<div class="identity-grid reverse-mobile">
  <ProfileSidebar />

  <div class="hero-content">
    <section id="course-overview">
      <h2 class="big-title">{course.title.split(' ')[0]} <br><span>{course.title.split(' ').slice(1).join(' ')}</span></h2>
      <div class="course-meta-row">
        <span class="course-meta-item course-meta-level" style={levelTag.style}>{levelTag.name}</span>
        <span class="course-meta-item course-meta-count">{course.postCount} {course.postCount === 1 ? 'chapter' : 'chapters'}</span>
      </div>
      <p class="hero-desc">{course.description}</p>
    </section>

    <section id="course-posts" class="course-posts-section">
      <h3 class="section-title">Chapters</h3>

      <div class="course-section-list">
        {#each course.sections as section}
          {@const isCollapsed = !!collapsedSections[section.index]}
          <section class="course-section" id={`section-${section.index}`}>
            <div class="course-section-header">
              <h4 class="course-section-title">
                <span class="section-title-text">{section.title}</span>
              </h4>
              <div class="section-header-top">
                <span class="section-kicker">Section {section.index}</span>
                <div class="section-header-controls">
                  <span class="section-stats">{section.postCount} {section.postCount === 1 ? 'chapter' : 'chapters'}</span>
                  <button
                    type="button"
                    class="section-toggle"
                    class:collapsed={isCollapsed}
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed ? `Expand ${section.title}` : `Collapse ${section.title}`}
                    onclick={() => toggleSection(section.index)}
                  >
                    <svg class="section-toggle-arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {#if !isCollapsed}
              {#if section.description}
                <p class="course-section-desc">{section.description}</p>
              {/if}

              <div class="course-post-list">
                {#each section.posts as post}
                  <a class="course-chapter-link" id={`chapter-${post.part}`} href={`${post.url}?course=${course.slug}&part=${post.part}`}>
                    <div class="chapter-top">
                      <span class="chapter-index">CH {post.part}</span>
                      <span class="chapter-title">{post.chapterTitle ?? post.title}</span>
                    </div>
                    <p class="chapter-desc">{post.description}</p>
                    <div class="chapter-meta">
                      <span class="chapter-tag" style={post.tag.style}>{post.tag.name}</span>
                      <span>{post.readTime}</span>
                    </div>
                  </a>
                {/each}
              </div>
            {/if}
          </section>
        {/each}
      </div>
    </section>
  </div>
</div>

<style>
  .course-meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    margin: 1rem 0 1.15rem;
  }

  .course-meta-item {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--fg-muted);
  }

  .course-meta-level {
    padding: 0.3rem 0.52rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    white-space: nowrap;
  }

  .course-meta-count {
    padding: 0.3rem 0.52rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    white-space: nowrap;
  }

  .course-posts-section {
    margin-top: 2rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    margin-bottom: 0.95rem;
    color: var(--fg-muted);
  }

  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
    opacity: 0.65;
  }

  .course-section-list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .course-section {
    scroll-margin-top: 8rem;
  }

  .course-section-header {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin-bottom: 0.6rem;
  }

  .section-header-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.45rem;
  }

  .section-kicker {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.52rem;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
    text-transform: uppercase;
    color: var(--fg-muted);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-right: 0;
    white-space: nowrap;
    width: max-content;
    justify-self: start;
  }

  .course-section-title {
    font-family: var(--font-sans);
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--fg);
    margin: 0;
    min-width: 0;
  }

  .section-title-text {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .section-stats {
    color: var(--fg-muted);
    font-size: 0.68rem;
    text-transform: uppercase;
    font-family: var(--font-mono);
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .section-header-controls {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    white-space: nowrap;
    justify-self: end;
  }

  .section-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.1rem 0.2rem;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--fg-muted);
    transition: color 0.2s ease;
  }

  .section-toggle:hover {
    color: var(--fg);
  }

  .section-toggle:focus-visible {
    outline: 1px solid var(--accent);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .section-toggle-arrow {
    width: 0.95rem;
    height: 0.95rem;
    transition: transform 0.16s ease;
  }

  .section-toggle.collapsed .section-toggle-arrow {
    transform: rotate(-90deg);
  }

  .course-section-desc {
    color: var(--fg-muted);
    line-height: 1.5;
    margin: 0 0 0.95rem 0;
  }

  .course-post-list {
    display: grid;
    gap: 0.8rem;
  }

  .course-chapter-link {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    text-decoration: none;
    color: var(--fg);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.02);
    padding: 0.85rem 0.9rem;
    transition: border-color 0.2s ease, background 0.2s ease;
    scroll-margin-top: 8rem;
  }

  .course-chapter-link:hover {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
  }

  .chapter-top {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .chapter-index {
    align-self: flex-start;
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

  .chapter-title {
    font-size: 0.97rem;
    line-height: 1.35;
    font-weight: 600;
    color: var(--fg);
  }

  .chapter-desc {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .chapter-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    align-items: center;
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

  .chapter-meta .chapter-tag {
    margin-left: 0 !important;
  }

  @media (max-width: 1100px) {
    .course-posts-section,
    .course-section,
    .course-section-title,
    .course-section-desc,
    .course-chapter-link,
    .chapter-title,
    .chapter-desc,
    .chapter-meta {
      text-align: left;
    }

    .course-section-header {
      margin-bottom: 0.5rem;
    }

    .course-section-title {
      min-width: 0;
      font-size: 1.05rem;
      line-height: 1.28;
      align-items: flex-start;
    }

    .section-header-controls {
      justify-self: end;
      width: auto;
      justify-content: flex-end;
      gap: 0.35rem;
      align-items: center;
    }

    .section-stats {
      font-size: 0.62rem;
    }

    .section-toggle-arrow {
      width: 0.85rem;
      height: 0.85rem;
    }

    .chapter-top {
      align-items: flex-start;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    .course-meta-row {
      margin: 0.85rem 0 1rem;
      gap: 0.4rem;
      justify-content: center;
    }
  }

</style>
