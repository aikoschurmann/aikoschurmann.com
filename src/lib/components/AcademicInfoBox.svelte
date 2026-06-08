<script lang="ts">
  let {
    type = "Thesis",
    period = "",
    institution = "",
    promotor = "",
    advisors = "",
    pdfLink = "",
    pdfLabel = "Download Full Thesis PDF"
  } = $props<{
    type?: string;
    period?: string;
    institution?: string;
    promotor?: string;
    advisors?: string;
    pdfLink?: string;
    pdfLabel?: string;
  }>();
</script>

<div class="academic-box">
  <div class="academic-header">
    <div class="academic-label">{type}</div>
    {#if period}
      <div class="academic-period">{period}</div>
    {/if}
  </div>
  
  <div class="academic-details">
    {#if institution}
      <div class="detail-item">
        <span class="detail-label">Institution</span>
        <span class="detail-value">{institution}</span>
      </div>
    {/if}
    {#if promotor}
      <div class="detail-item">
        <span class="detail-label">Promotor</span>
        <span class="detail-value">{promotor}</span>
      </div>
    {/if}
    {#if advisors}
      <div class="detail-item">
        <span class="detail-label">Advisors</span>
        <span class="detail-value">{advisors}</span>
      </div>
    {/if}
  </div>

  {#if pdfLink}
    <a href={pdfLink} target="_blank" class="download-btn">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {pdfLabel}
    </a>
  {/if}
</div>

<style>
  .academic-box {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin: 2.5rem 0;
    font-family: var(--font-sans);
  }

  .academic-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .academic-label {
    font-weight: 800;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg);
  }

  .academic-period {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--fg-muted);
  }

  .academic-details {
    display: grid;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg-muted);
  }

  .detail-value {
    font-size: 0.95rem;
    color: var(--fg);
    font-weight: 500;
  }

  .download-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--fg-muted);
    padding: 0.8rem 1.25rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-decoration: none !important;
    transition: all 0.2s ease;
    width: 100%;
    justify-content: center;
    cursor: pointer;
  }

  .download-btn:hover {
    background: var(--fg);
    color: var(--bg);
    border-color: var(--fg);
  }

  .download-btn svg {
    stroke: currentColor;
    flex-shrink: 0;
  }
</style>