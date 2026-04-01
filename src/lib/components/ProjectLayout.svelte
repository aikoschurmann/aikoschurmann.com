<script lang="ts">
  import { page } from '$app/state';
  import { projects } from '$lib/data';
  
  let { children } = $props();

  const project = $derived(projects.find(p => p.url === page.url.pathname));
  const title = $derived(project?.title || "");
  const description = $derived(project?.description || 'Systems project by Aiko Schurmann.');
  const github = $derived(project?.github || "");
  const tags = $derived(project?.tags || []);
  const canonicalUrl = $derived(`${page.url.origin}${page.url.pathname}`);
  const ogImageUrl = $derived(`${page.url.origin}/picture.jpg`);
  const fullTitle = $derived(`${title} | Aiko Schurmann`);

  const projectJsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: title,
      description,
      codeRepository: github || undefined,
      url: canonicalUrl,
      author: {
        '@type': 'Person',
        name: 'Aiko Schurmann'
      }
    })
  );
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />

  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={ogImageUrl} />
  <meta property="og:type" content="article" />

  <!-- X/Twitter cards work without a Twitter account -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImageUrl} />

  <script type="application/ld+json">{projectJsonLd}</script>
</svelte:head>

<div class="post-layout">
  <article class="post-container">
    <header class="post-header">
      <h1 class="post-title">{title}</h1>
      
      <div class="meta-row">
        {#if tags.length > 0}
          <div class="tags-list">
            {#each tags as tag}
              <span class="tag" style={tag.style}>{tag.name}</span>
            {/each}
          </div>
        {/if}

        {#if github}
          <a href={github} target="_blank" rel="noopener" class="tag github-tag">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            Source
          </a>
        {/if}
      </div>
    </header>

    <div class="prose">
      {@render children()}
    </div>

    <div class="post-footer">
      <a href="/projects" class="back-link">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="back-arrow">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to projects
      </a>
    </div>
  </article>
</div>

<style>
  .post-layout {
    display: grid;
    grid-template-columns: 1fr 680px 1fr;
    gap: 4rem;
    align-items: start; 
    max-width: 100%;
  }

  .post-container {
    grid-column: 2;
    min-width: 0;
    padding-bottom: 2rem;
  }

  .post-header {
    text-align: center;
    margin-bottom: 5rem;
  }

  .post-title {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 800;
    letter-spacing: -0.05em;
    line-height: 1;
    margin-bottom: 1.5rem;
    color: var(--fg);
  }

  .meta-row {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
  }

  .tags-list {
    display: flex;
    gap: 0.6rem;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
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
    text-decoration: none;
  }

  .github-tag {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transition: background 0.2s ease;
  }

  .github-tag:hover {
    background: rgba(255, 255, 255, 0.15);
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
    transition: color 0.2s ease;
    cursor: pointer;
  }

  .back-link:hover { color: var(--fg); }

  .back-arrow {
    color: var(--accent);
    transition: transform 0.2s ease;
  }

  .back-link:hover .back-arrow { transform: translateX(-4px); }

  @media (max-width: 1024px) {
    .post-layout { grid-template-columns: 1fr; padding: 0; }
    .post-container { grid-column: 1; }
  }
</style>