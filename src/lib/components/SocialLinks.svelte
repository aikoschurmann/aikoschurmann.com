<div class="social-links">
  <a href="https://github.com/aikoschurmann" target="_blank" rel="noopener" aria-label="GitHub">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
    </svg>
  </a>
  <a href="https://linkedin.com/in/aiko-schurmann" target="_blank" rel="noopener" aria-label="LinkedIn">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
    </svg>
  </a>
</div>

<style>
  .social-links {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    width: 100%;
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(0, 0, 0, 0.05); 
  }

  .social-links a {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .social-links svg {
    width: 18px;
    height: 18px;
    color: #2563eb;
    transition: all 0.2s ease;
  }

  .social-links a:hover {
    background: #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }

  .social-links a:hover svg {
    color: #ffffff;
  }
</style>