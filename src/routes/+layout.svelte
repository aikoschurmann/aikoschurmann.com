<script lang="ts">
  import { page } from '$app/state';
  import SiteFooter from '$lib/components/SiteFooter.svelte';
  import '../app.css';

  let { children } = $props();

  const seoData = $derived.by(() => {
    const path = page.url.pathname;

    if (path === '/projects') {
      return {
        title: 'Aiko Schurmann | Projects Archive',
        description: 'Systems and performance-focused projects in C, Zig, and x86-64, including compilers, rendering, and data tooling.'
      };
    }

    if (path.startsWith('/projects/')) {
      return {
        title: 'Aiko Schurmann | Project Details',
        description: 'Project deep dives covering architecture, trade-offs, and benchmark-driven systems engineering decisions.'
      };
    }

    if (path === '/blog') {
      return {
        title: 'Aiko Schurmann | Research Thoughts',
        description: 'Technical writing on compilers, systems programming, and high-performance software engineering.'
      };
    }

    if (path.startsWith('/blog/')) {
      return {
        title: 'Aiko Schurmann | Technical Writing',
        description: 'Engineering notes on low-level implementation details, performance experiments, and systems design.'
      };
    }

    return {
      title: 'Aiko Schurmann | Software Engineer',
      description: 'Low-level software engineer focused on systems, compilers, and efficient software in C and Zig.'
    };
  });

  const canonicalUrl = $derived(`${page.url.origin}${page.url.pathname}`);
  const ogImageUrl = $derived(`${page.url.origin}/picture.jpg`);
  const isDetailPage = $derived(page.url.pathname.startsWith('/blog/') || page.url.pathname.startsWith('/projects/'));
  const isBlogDetailPage = $derived(page.url.pathname.startsWith('/blog/'));
  const isProjectDetailPage = $derived(page.url.pathname.startsWith('/projects/'));

  const personJsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Aiko Schurmann',
      url: page.url.origin,
      image: ogImageUrl,
      jobTitle: 'Software Engineer',
      homeLocation: {
        '@type': 'Country',
        name: 'Belgium'
      },
      sameAs: [
        'https://github.com/aikoschurmann',
        'https://linkedin.com/in/aiko-schurmann'
      ],
      knowsAbout: ['Systems Programming', 'Compilers', 'Performance Engineering', 'C', 'Zig', 'x86-64']
    })
  );
</script>

<svelte:head>
  <meta name="robots" content="index, follow" />

  {#if !isDetailPage}
    <meta name="description" content={seoData.description} />
    <link rel="canonical" href={canonicalUrl} />

    <meta property="og:title" content={seoData.title} />
    <meta property="og:description" content={seoData.description} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={ogImageUrl} />
    <meta property="og:site_name" content="Aiko Schurmann" />
    <meta property="og:type" content="website" />

    <!-- X/Twitter cards work without a Twitter account -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={seoData.title} />
    <meta name="twitter:description" content={seoData.description} />
    <meta name="twitter:image" content={ogImageUrl} />
  {/if}

  <script type="application/ld+json">{personJsonLd}</script>
</svelte:head>

<div class="container" class:container-blog-detail={isBlogDetailPage} class:container-project-detail={isProjectDetailPage}>
  <header class="site-header">
    <nav class="dock">
      <a href="/" class="nav-item" data-tooltip="Home" aria-label="Home" title="Home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </a>
      <a href="/projects" class="nav-item" data-tooltip="Projects" aria-label="Projects" title="Projects">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"/>
        </svg>
      </a>
      <a href="/blog" class="nav-item" data-tooltip="Research Thoughts" aria-label="Research Thoughts" title="Research Thoughts">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </a>
    </nav>
  </header>

  <main>
    {@render children()}
  </main>

  <SiteFooter />
</div>