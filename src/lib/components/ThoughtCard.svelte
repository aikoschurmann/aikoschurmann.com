<script lang="ts">
  type ThoughtTag = {
    name: string;
    style: string;
  };

  type ThoughtCardData = {
    title: string;
    url: string;
    description: string;
    date: string;
    readTime: string;
    tag: ThoughtTag;
  };

  let { thought } = $props<{ thought: ThoughtCardData }>();
</script>

<a href={thought.url} class="post-card">
  <div class="card-header">
    <div class="card-header-left">
      <div class="post-thumb">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </div>
      <h3>{thought.title}</h3>
    </div>
    <div class="arrow">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
      </svg>
    </div>
  </div>

  <p class="post-desc">{thought.description}</p>

  <div class="post-meta">
    <span>{thought.date}</span>
    <span>{thought.readTime}</span>
    <span class="post-tag" style={thought.tag.style}>{thought.tag.name}</span>
  </div>
</a>
