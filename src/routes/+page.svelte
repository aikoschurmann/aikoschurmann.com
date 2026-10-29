<script lang="ts">
  import { blogThoughts, projects } from '$lib/data';
  import ProjectList from '$lib/components/ProjectList.svelte';
  import WritingList from '$lib/components/WritingList.svelte';
  import AcademicTimeline from '$lib/components/AcademicTimeline.svelte';

  const homeProjects = projects.filter(p => p.showOnHome);
  const homeThoughts = blogThoughts.filter(t => t.showOnHome);

  const links = [
    {
      label: 'Email',
      href: 'mailto:aiko.schurmann@gmail.com',
      icon: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'
    },
    {
      label: 'GitHub',
      href: 'https://github.com/aikoschurmann',
      icon: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>'
    },
    {
      label: 'LinkedIn',
      href: 'https://linkedin.com/in/aiko-schurmann',
      icon: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>'
    }
  ];
</script>

<svelte:head>
  <title>Aiko Schurmann | Software Engineer</title>
</svelte:head>

<div class="home-intro">
  <h1 class="big-title">Software <br><span>Engineer</span></h1>

  <p class="hero-desc">
    <span class="hero-lead">Hi, I'm Aiko. This is where I document what I'm working on: uni projects, side projects, and whatever rabbit hole I'm in at the moment.</span>
    Lately that's mostly <strong>compilers</strong> and <strong>superoptimisation</strong>.
    Outside of tech, I run a photography business called <a href="https://tarchief.studio" target="_blank" rel="noopener" class="hero-link">Studio 't archief</a>.
  </p>

  <nav class="intro-links" aria-label="Contact">
    {#each links as link}
      <a href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noopener">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          {@html link.icon}
        </svg>
        <span>{link.label}</span>
        {#if link.href.startsWith('http')}<span class="ext" aria-hidden="true">↗</span>{/if}
      </a>
    {/each}
  </nav>
</div>

<div class="home-sections">
  <section id="projects" class="home-section">
    <h2 class="big-title">Recent <br><span>Projects</span></h2>

    <ProjectList projects={homeProjects} />

    <a href="/projects" class="view-all">View all projects →</a>
  </section>

  {#if homeThoughts.length > 0}
    <section id="thoughts" class="home-section">
      <h2 class="big-title">Engineering <br><span>Thoughts</span></h2>
      <WritingList thoughts={homeThoughts} />

      <a href="/blog" class="view-all">All writing →</a>
    </section>
  {/if}

  <section id="research" class="home-section">
    <h2 class="big-title">Academic <br><span>Roadmap</span></h2>

    <AcademicTimeline />

    <a href="/research" class="view-all">Full roadmap →</a>
  </section>
</div>

<style>
  .home-intro,
  .home-sections {
    max-width: var(--column-width);
    margin: 0 auto;
  }

  .home-intro .hero-desc {
    max-width: 720px;
    margin: 0 0 2.5rem;
    font-size: 1.15rem;
  }

  /* A large lead sentence over muted detail */
  .hero-lead {
    display: block;
    margin-bottom: 1rem;
    font-size: 1.65rem;
    font-weight: 500;
    line-height: 1.35;
    letter-spacing: -0.015em;
    color: var(--fg);
  }
  .hero-desc strong { color: var(--fg); }

  .hero-link {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .intro-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .intro-links a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    height: 40px;
    padding: 0 1.1rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--fg);
    text-decoration: none;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }

  .intro-links a svg { color: var(--fg-muted); transition: color 0.2s ease; }

  .intro-links a:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.22);
  }
  .intro-links a:hover svg { color: var(--fg); }

  /* Email is the main call to action */
  .intro-links a:first-child {
    background: var(--fg);
    border-color: var(--fg);
    color: var(--bg);
  }
  .intro-links a:first-child svg { color: var(--bg); }
  .intro-links a:first-child:hover {
    background: #e6e3e0;
    border-color: #e6e3e0;
  }

  .intro-links .ext {
    color: var(--fg-dark);
    font-size: 0.8rem;
    transition: color 0.2s ease, transform 0.2s ease;
  }
  .intro-links a:hover .ext {
    color: var(--fg-muted);
    transform: translate(1px, -1px);
  }

  .home-section { margin-top: 10rem; }


  .view-all {
    display: inline-block;
    margin-top: 2rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    text-decoration: underline;
    color: var(--fg-muted);
  }

  @media (max-width: 1100px) {
    .home-section { margin-top: 6rem; }
    .hero-lead { font-size: 1.3rem; }
  }

</style>