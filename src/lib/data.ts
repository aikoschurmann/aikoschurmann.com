// Central dictionary for semantic tag colors
// Categorized Tag Colors
// src/lib/data.ts

const TAG_COLORS: Record<string, { color: string; bg: string }> = {
  // --- Languages (The Core Tools) ---
  'C': { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
  'C99': { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
  'ZIG': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' }, // Logo-matched Orange

  // --- Hardware & Architecture (Close to the Metal) ---
  'x86-64': { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
  'ASM': { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
  'SIMD': { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
  'BITBOARDS': { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },

  // --- Compiler & Software Logic (Intermediate Layer) ---
  'INTERNING': { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },
  'TYPECHECKING': { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },
  'JSON PARSER': { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },
  'AOT': { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },
  'LLVM IR': { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },

  // --- Benchmarks (Performance Claims) ---
  '120K TRIS @ 120 FPS': { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
  '4.0 GB/S': { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },

  // --- Analysis & Research (Systems Focus) ---
  'SECURITY': { color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)' },
};

// Helper function to resolve a tag string into an object with inline styles
function getTagData(name: string) {
  const style = TAG_COLORS[name];
  if (style) {
    return { name, style: `color: ${style.color}; background: ${style.bg};` };
  }
  // Default fallback style for unknown tags
  return { name, style: `color: var(--fg-muted); background: rgba(255, 255, 255, 0.05);` };
}

const rawProjects = [
  {
    title: 'software-renderer',
    url: '/projects/software-renderer',
    github: 'https://github.com/aikoschurmann/software-renderer',
    thumb: 'SR',
    description: 'A multi-threaded 3D graphics pipeline built from scratch in C, achieving high-performance rasterization without GPU acceleration.',
    tags: ['C', 'SIMD', '120K TRIS @ 120 FPS'],
    showOnHome: true,
    research: []
  },
  {
    title: 'compiler-v3',
    url: '/projects/compiler-v3',
    github: 'https://github.com/aikoschurmann/compiler-v3',
    thumb: 'C3',
    description: 'A high-performance compiler for a strongly-typed procedural language, featuring recursive type checking and dense-ID symbol resolution.',
    tags: ['C', 'INTERNING', 'TYPECHECKING'],
    showOnHome: true,
    research: [
      { title: 'O(1) Symbol Resolution: The Power of String Interning', url: '/blog/string-interning-compilers' }
    ]
  },
  {
    title: 'zog',
    url: '/projects/zog',
    github: 'https://github.com/aikoschurmann/zog',
    thumb: 'ZG',
    description: 'A blisteringly fast, zero-allocation JSONL scanner written in Zig, saturating NVMe bandwidth via SIMD vectorization.',
    tags: ['ZIG', 'JSON PARSER', '4.0 GB/S'],
    showOnHome: true,
    research: [
      { title: 'The Nitty Gritty of zog: Pushing JSONL to 4.0 GB per second', url: '/blog/simd-parsing-zig' }
    ]
  },
  {
    title: 'cfgsafe',
    url: '/projects/cfgsafe',
    github: 'https://github.com/aikoschurmann/cfgsafe',
    thumb: 'CS',
    description: 'A declarative schema-driven configuration engine for C99, generating strongly-typed and memory-safe code.',
    tags: ['C', 'SECURITY', 'AOT'],
    showOnHome: true,
    research: []
  },
  {
    title: 'chess-asm',
    url: '/projects/chess-asm',
    github: 'https://github.com/aikoschurmann/chess-asm',
    thumb: 'CH',
    description: 'A high-performance chess engine utilizing bitboards and heavily optimized x86-64 assembly routines.',
    tags: ['x86-64', 'ASM', 'BITBOARDS'],
    showOnHome: false,
    research: []
  }
];

// Map the raw projects to automatically inject the color styles
export const projects = rawProjects.map(p => ({
  ...p,
  tags: p.tags.map(getTagData)
}));

// 1. Import the parsed markdown files (to get frontmatter metadata)
const modules = import.meta.glob('/src/routes/blog/*/+page.md', { eager: true });

// 2. Import the raw markdown text (to count the words)
const rawModules = import.meta.glob('/src/routes/blog/*/+page.md', { query: '?raw', import: 'default', eager: true });

// 3. Map over them to generate the dynamic list
export const thoughts = Object.entries(modules).map(([path, module]) => {
  const url = path.replace('/src/routes', '').replace('/+page.md', '');
  const meta = (module as any).metadata || {};
  
  const rawContent = rawModules[path] as string;
  const cleanText = rawContent.replace(/<[^>]*>?/gm, '').replace(/[#*_>\[\]]/g, '');
  const wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 225));

  // Extract the tag name, and pass it through our color resolver
  const tagName = meta.tag || 'RESEARCH';

  return {
    title: meta.title || 'Untitled Thought',
    url,
    description: meta.description || '',
    date: meta.date || '',
    readTime: `${readTimeMinutes} MIN READ`,
    tag: getTagData(tagName),
    showOnHome: meta.showOnHome !== false 
  };
}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());