import { mdsvex, escapeSvelte } from 'mdsvex';
import adapter from '@sveltejs/adapter-cloudflare';
import { relative, sep, resolve } from 'node:path';
import { createHighlighter } from 'shiki';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

let highlighter;

function rehypeEscapeSvelteSensitiveText() {
	return (tree) => {
		const walk = (node) => {
			if (!node || typeof node !== 'object') return;

			if (node.type === 'text' && typeof node.value === 'string') {
				node.value = node.value
					.replace(/\{/g, '&#123;')
					.replace(/\}/g, '&#125;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');
			}

			if (Array.isArray(node.children)) {
				for (const child of node.children) walk(child);
			}
		};

		walk(tree);
	};
}

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
	extensions: ['.svx', '.md'],
	remarkPlugins: [remarkMath],
	rehypePlugins: [[rehypeKatex, { output: 'html' }], rehypeEscapeSvelteSensitiveText],
	layout: {
		blog: resolve(import.meta.dirname, './src/lib/components/PostLayout.svelte')
	},
	highlight: {
		highlighter: async (code, lang = 'text') => {
			if (!highlighter) {
				highlighter = await createHighlighter({
					themes: ['nord'],
					langs: ['javascript', 'typescript', 'zig', 'c', 'cpp', 'bash', 'json', 'rust', 'asm']
				});
			}
			
			// Load language if not already loaded, handle potential unknown languages
			try {
				if (lang !== 'text' && !highlighter.getLoadedLanguages().includes(lang)) {
					await highlighter.loadLanguage(lang);
				}
			} catch (e) {
				lang = 'text';
			}

			const html = escapeSvelte(highlighter.codeToHtml(code, { lang, theme: 'nord' }));
			return `{@html \`${html}\` }`;
		}
	}
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// defaults to rune mode for the project, execept for `node_modules`. Can be removed in svelte 6.
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');
			const isMarkdown = filename.endsWith('.md') || filename.endsWith('.svx');

			return isExternalLibrary || isMarkdown ? undefined : true;
		}
	},
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter()
	},
	preprocess: [
		mdsvex(mdsvexOptions)
	],
	extensions: ['.svelte', '.svx', '.md']
};

export default config;
