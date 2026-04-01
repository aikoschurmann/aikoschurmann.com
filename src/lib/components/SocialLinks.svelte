<script lang="ts">
  let {
    cvHref = '/cv.pdf',
    cvLabel = 'CV (PDF)'
  } = $props<{
    cvHref?: string;
    cvLabel?: string;
  }>();

  const cvTarget = $derived(cvHref.startsWith('http') ? '_blank' : undefined);
  const cvRel = $derived(cvTarget ? 'noopener' : undefined);
</script>

<div class="social-links" aria-label="Social links">
  <a href="https://github.com/aikoschurmann" target="_blank" rel="noopener" class="social-chip" aria-label="GitHub">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
    </svg>
    <span>GitHub</span>
  </a>

  <a href="https://linkedin.com/in/aiko-schurmann" target="_blank" rel="noopener" class="social-chip" aria-label="LinkedIn">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
    </svg>
    <span>LinkedIn</span>
  </a>

</div>

<style>
  .social-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    justify-content: center;
    width: 100%;
    margin-top: 1rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(0, 0, 0, 0.05); 
  }

  .social-chip {
    min-height: 28px;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    text-decoration: none;
    border: 1px solid rgba(15, 23, 42, 0.12);
    background: rgba(15, 23, 42, 0.04);
    color: #475569;
    transition: border-color 0.15s ease, background-color 0.15s ease;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .social-chip svg {
    width: 12px;
    height: 12px;
    color: currentColor;
  }

  .social-chip:hover {
    border-color: rgba(15, 23, 42, 0.2);
    background: rgba(15, 23, 42, 0.07);
  }
</style>