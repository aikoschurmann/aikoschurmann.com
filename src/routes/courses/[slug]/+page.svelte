<script lang="ts">
  import ProfileSidebar from '$lib/components/ProfileSidebar.svelte';
  import type { PageData } from './$types';

  let { data } = $props<{ data: PageData }>();
  const course = $derived(data.course);
</script>

<svelte:head>
  <title>{course.title} | Aiko Schurmann</title>
  <meta name="description" content={course.description} />
</svelte:head>

<div class="identity-grid reverse-mobile">
  <ProfileSidebar />

  <div class="hero-content">
    <section id="course-overview">
      <h2 class="big-title">{course.title.split(' ')[0]} <br><span>{course.title.split(' ').slice(1).join(' ')}</span></h2>
      <p class="hero-desc">{course.description}</p>

      <div class="course-meta-row">
        <span>{course.level}</span>
        <span>{course.postCount} POSTS</span>
        <span>{course.totalReadMinutes} MIN READ</span>
      </div>
    </section>

    <section id="course-posts" class="course-posts-section">
      <h3 class="section-title">Course Outline</h3>

      <div class="course-section-list">
        {#each course.sections as section}
          <section class="course-section" id={`section-${section.index}`}>
            <div class="course-section-header">
              <h4 class="course-section-title">
                <span class="section-kicker">Section {section.index}</span>
                {section.title}
              </h4>
              <span class="section-stats">{section.postCount} chapters · {section.totalReadMinutes} min</span>
            </div>

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
    gap: 0.5rem;
    margin-bottom: 4rem;
  }

  .course-meta-row span {
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--fg-muted);
  }

  .course-posts-section {
    margin-top: 2rem;
  }

  .section-title {
    font-family: var(--font-sans);
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin-bottom: 1.25rem;
    color: var(--fg);
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
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-bottom: 0.6rem;
  }

  .section-kicker {
    padding: 0.2rem 0.45rem;
    border-radius: 5px;
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
    text-transform: uppercase;
    color: var(--fg-muted);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-right: 0.5rem;
  }

  .course-section-title {
    font-family: var(--font-sans);
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--fg);
    margin: 0;
    display: flex;
    align-items: center;
  }

  .section-stats {
    color: var(--fg-muted);
    font-size: 0.68rem;
    text-transform: uppercase;
    font-family: var(--font-mono);
    letter-spacing: 0.04em;
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
    gap: 0.75rem;
  }

  .chapter-index {
    align-self: flex-start;
    padding: 0.2rem 0.45rem;
    border-radius: 6px;
    font-size: 0.58rem;
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
    font-size: 0.6rem;
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
      justify-content: flex-start;
    }
  }
</style>
