<script lang="ts">
  import { thoughts } from '$lib/data';
  
  let { id } = $props();

  const post = $derived(thoughts.find(t => t.title === id));
</script>

{#if post}
  <div class="embed-wrapper">
    <a href={post.url} class="absolute-link" aria-label={post.title}></a>
    
    <div class="card-header">
      <div class="card-header-left">
        <div class="post-thumb">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>
        <div class="embed-title">{post.title}</div>
      </div>
      <div class="arrow">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
        </svg>
      </div>
    </div>
    
    <p class="embed-desc">{post.description}</p>
    
    <div class="post-meta">
      <span>{post.date}</span>
      <span>{post.readTime}</span>
      <span class="post-tag" style={post.tag.style}>{post.tag.name}</span>
    </div>
  </div>
{:else}
  <div class="error">Post "{id}" not found in data.ts.</div>
{/if}

<style>
  .embed-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border); 
    color: var(--fg);
    transition: background-color 0.2s ease, border-color 0.2s ease;
    margin: 3rem 0; 
  }

  .embed-wrapper:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .absolute-link {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    border: none !important;
    text-decoration: none !important;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .card-header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .post-thumb {
    width: 42px;
    height: 42px;
    background: #222;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--fg-muted);
    border: 1px solid var(--border);
    margin: 0;
  }

  .embed-title {
    font-family: var(--font-sans) !important;
    font-size: 1.3rem !important;
    font-weight: 600 !important;
    margin: 0 !important;
    letter-spacing: -0.01em !important;
    color: var(--fg) !important;
    line-height: 1.2 !important;
  }

  p.embed-desc {
    font-family: var(--font-sans) !important;
    font-size: 1rem !important;
    color: var(--fg-muted) !important;
    line-height: 1.6 !important;
    margin: 0 0 1.25rem 0 !important;
    max-width: 500px !important;
  }

  .post-meta {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-top: auto;
  }

  .post-meta span:not(.post-tag) {
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

  .post-tag {
    margin-left: 0 !important;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
    text-transform: uppercase;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .arrow {
    color: var(--accent);
    opacity: 0.6;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .embed-wrapper:hover .arrow {
    transform: translateX(4px) translateY(-4px);
    opacity: 1;
  }

  .error {
    color: #f87171;
    padding: 1rem;
    border: 1px dashed #f87171;
    border-radius: 8px;
    margin: 2rem 0;
    font-family: var(--font-mono);
    font-size: 0.9rem;
  }

  @media (max-width: 1100px) {
    .embed-wrapper {
      padding: 1.25rem;
    }

    p.embed-desc {
      font-size: 0.95rem !important;
      margin: 0 0 1rem 0 !important;
    }

    .post-meta span:not(.post-tag),
    .post-tag {
      font-size: 0.6rem;
      padding: 0.3rem 0.5rem;
    }

    .arrow {
      display: none;
    }
  }
</style>