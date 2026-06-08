<script lang="ts">
  let { title, details } = $props<{ title: string; details: string }>();
</script>

<div class="milestone-ghost-card">
  <div class="ghost-content">
    <h3 class="ghost-title">{title}</h3>
    <p class="ghost-details">{details}</p>
  </div>
</div>

<style>
  .milestone-ghost-card {
    padding: 2rem;
    border: 1px dashed var(--border);
    border-radius: 12px;
    background: transparent;
    transition: border-color 0.3s ease;
  }

  .milestone-ghost-card:hover {
    border-color: var(--fg-dark);
  }

  .ghost-title {
    font-family: var(--font-sans) !important;
    font-size: 1.4rem !important;
    font-weight: 700 !important;
    color: var(--fg-muted) !important;
    margin: 0 0 0.5rem 0 !important;
    letter-spacing: -0.02em;
    opacity: 0.8;
  }

  .ghost-details {
    font-family: var(--font-mono) !important;
    font-size: 0.8rem !important;
    text-transform: uppercase;
    color: var(--fg-dark) !important;
    margin: 0 !important;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
</style>