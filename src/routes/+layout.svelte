<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <meta name="description" content="Aiko Schurmann - Low-level software engineer focused on systems, compilers, and efficient software." />
  <meta property="og:site_name" content="Aiko Schurmann" />
  <meta property="og:type" content="website" />
</svelte:head>

<div class="container">
  <header class="site-header">
    <nav class="dock">
      <a href="/" class="nav-item" data-tooltip="Home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </a>
      <a href="/projects" class="nav-item" data-tooltip="Projects">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"/>
        </svg>
      </a>
      <a href="/blog" class="nav-item" data-tooltip="Research Thoughts">
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

  <footer>
    <div class="footer-content">
      <div class="footer-left">
        <span class="footer-name">Aiko Schurmann</span>
        <span class="footer-status"><span class="status-dot"></span> Available for new opportunities</span>
      </div>
      <div class="footer-right">
        <a href="https://github.com/aikoschurmann" target="_blank" rel="noopener">GitHub</a>
        <a href="https://linkedin.com/in/aikoschurmann" target="_blank" rel="noopener">LinkedIn</a>
        <button class="back-to-top" onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Top 
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
      </div>
    </div>
  </footer>
</div>