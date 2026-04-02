<script lang="ts">
	import GithubStatus from '$lib/components/GithubStatus.svelte';
	import SocialLinks from '$lib/components/SocialLinks.svelte';

	let {
		bio = 'Low-level software engineer in training. Building efficient software close to the hardware.',
		eagerImage = false,
		cvHref = '/cv.pdf',
		cvLabel = 'CV (PDF)'
	} = $props<{
		bio?: string;
		eagerImage?: boolean;
		cvHref?: string;
		cvLabel?: string;
	}>();
</script>

<aside class="profile-sidebar">
	<div class="profile-card">
		<div
			class="profile-img profile-photo"
			role="img"
			aria-label="Aiko Schurmann"
		></div>
		<h2>Aiko Schurmann</h2>
		<p>{bio}</p>

		<GithubStatus />
		<SocialLinks {cvHref} {cvLabel} />
	</div>
</aside>
