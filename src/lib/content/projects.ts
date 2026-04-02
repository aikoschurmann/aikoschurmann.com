import type { RawProject } from './types';

// Edit this file to add or update portfolio projects.
export const projectEntries: RawProject[] = [
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
