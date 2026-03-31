<script lang="ts">
  import { onMount } from 'svelte';
  import { projects } from '$lib/data';

  let lastCommit = $state({ message: 'Initializing...', repo: '', date: '' });
  const featuredRepoNames = projects.map(p => p.title);

  async function fetchLatestFeaturedActivity() {
    const username = 'aikoschurmann';
    try {
      const repoRes = await fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=30`);
      const allRepos = await repoRes.json();
      
      const latestFeaturedRepo = allRepos.find((r: any) => featuredRepoNames.includes(r.name));

      if (latestFeaturedRepo) {
        const commitRes = await fetch(`https://api.github.com/repos/${username}/${latestFeaturedRepo.name}/commits?per_page=1`);
        const commits = await commitRes.json();
        const message = (commits && commits[0]) ? commits[0].commit.message.split('\n')[0] : 'Active development';

        return {
          message,
          repo: latestFeaturedRepo.name,
          date: new Date(latestFeaturedRepo.pushed_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          }).toUpperCase()
        };
      }
      return null;
    } catch (e) { return null; }
  }

  onMount(async () => {
    const data = await fetchLatestFeaturedActivity();
    if (data) lastCommit = data;
    else lastCommit.message = 'Systems Online';
  });
</script>

<div class="github-status">
  <div class="status-header">
    <div class="header-left">
        <span class="pulse-dot"></span>
        <span class="status-label">LATEST ACTIVITY</span>
    </div>
    {#if lastCommit.date}
        <span class="commit-date">{lastCommit.date}</span>
    {/if}
  </div>
  <div class="commit-info">
    {#if lastCommit.repo}
        <span class="repo">aikoschurmann/{lastCommit.repo}:</span>
    {/if}
    <span class="message">"{lastCommit.message}"</span>
  </div>
</div>

<style>
  .github-status {
    padding-top: 1.25rem;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    text-align: center; /* Centered */
    width: 100%;
  }
  .status-header {
    display: flex;
    align-items: center;
    justify-content: center; /* Centered */
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .status-label {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.05em;
  }
  .commit-date {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 600;
    color: #475569;
  }
  .pulse-dot {
    width: 6px;
    height: 6px;
    background: #2563eb; 
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(37, 99, 235, 0.4);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.9); }
    100% { opacity: 1; transform: scale(1); }
  }
  .commit-info {
    font-size: 0.8rem;
    line-height: 1.4;
  }
  .repo {
    color: #000;
    font-weight: 700;
  }
  .message {
    color: #334155;
    font-style: italic;
  }
</style>