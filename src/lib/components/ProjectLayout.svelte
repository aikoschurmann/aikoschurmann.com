<script lang="ts">
  import { page } from '$app/state';
  import { projects, thoughts } from '$lib/data';
  
  let { children } = $props();

  const project = $derived(projects.find(p => p.url === page.url.pathname));
  const title = $derived(project?.title || "");
  const description = $derived(project?.description || 'Systems project overview and implementation notes.');
  const github = $derived(project?.github || "");
  const tags = $derived(project?.tags || []);
  const research = $derived(project?.research || []);
  const relatedPosts = $derived(
    research.map((item) => {
      const match = thoughts.find((t) => t.url === item.url);
      return {
        ...item,
        title: match?.title ?? item.title,
        tag: match?.tag ?? {
          name: 'RESEARCH',
          style: 'color: var(--fg-muted); background: rgba(255, 255, 255, 0.05);'
        }
      };
    })
  );
  const canonicalUrl = $derived(`${page.url.origin}${page.url.pathname}`);
  const ogImageUrl = $derived(`${page.url.origin}/picture.jpg`);
  const fullTitle = $derived(`${title} | Project`);

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
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            Source Code
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

  {#if relatedPosts.length > 0}
    <aside class="research-sidebar">
      <span class="research-title">Related Posts</span>
      <ul class="research-list">
        {#each relatedPosts as item}
          <li>
            <a href={item.url} class="research-link">
              <div class="research-header-row">
                <span class="research-link-title">{item.title}</span>
              </div>
              <div class="research-meta-row">
                <div class="research-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                </div>
                <span class="research-tag" style={item.tag.style}>{item.tag.name}</span>
              </div>
            </a>
          </li>
        {/each}
      </ul>
    </aside>
  {/if}
</div>

<style>
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
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 0.35rem 0.8rem;
    border-radius: 6px;
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

  .research-sidebar {
    grid-column: 3;
    position: sticky;
    top: 6rem;
    align-self: start;
    width: min(100%, 400px);
    justify-self: start;
  }

  .post-container :global(.prose) {
    max-width: 680px;
  }

  .research-title {
    display: block;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg);
    margin-bottom: 0.8rem;
  }

  .research-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.8rem;
  }

  .research-link {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    text-decoration: none;
    color: var(--fg);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.02);
    padding: 0.95rem;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .research-link:hover {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
  }

  .research-header-row {
    display: block;
  }

  .research-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: #222;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--fg-muted);
    flex-shrink: 0;
  }

  .research-link-title {
    display: block;
    font-size: 0.96rem;
    line-height: 1.4;
    color: var(--fg);
    min-width: 0;
  }

  .research-meta-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.5rem;
  }

  .research-tag {
    margin-left: 0 !important;
    padding: 0.33rem 0.58rem;
    border-radius: 6px;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
    text-transform: uppercase;
    border: 1px solid rgba(255, 255, 255, 0.1);
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

  @media (max-width: 1200px) {
    .post-layout { grid-template-columns: 1fr; padding: 0; }
    .post-container { grid-column: 1; }
    .research-sidebar { display: none; }
  }
</style>