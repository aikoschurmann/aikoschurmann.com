<script lang="ts">
  import { courses } from '$lib/data';
  import ProfileSidebar from '$lib/components/ProfileSidebar.svelte';
</script>

<svelte:head>
  <title>Aiko Schurmann | Courses</title>
</svelte:head>

<div class="identity-grid reverse-mobile">
  <ProfileSidebar />

  <div class="hero-content">
    <section id="courses">
      <h2 class="big-title">Learning <br><span>Courses</span></h2>
      <p class="hero-desc">Structured tracks that bundle related posts into a guided path.</p>

      <div class="project-list">
        {#each courses as course}
          <a href={`/courses/${course.slug}`} class="post-card course-card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="post-thumb">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <h3>{course.title}</h3>
              </div>
              <div class="arrow">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                </svg>
              </div>
            </div>

            <p class="post-desc">{course.description}</p>

            <div class="post-meta">
              <span>{course.level}</span>
              <span>{course.postCount} POSTS</span>
              <span>{course.totalReadMinutes} MIN READ</span>
            </div>
          </a>
        {/each}
      </div>
    </section>
  </div>
</div>

<style>
  .course-card .post-desc {
    max-width: none;
  }
</style>
