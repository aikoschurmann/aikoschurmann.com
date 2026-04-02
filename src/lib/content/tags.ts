import type { TagStyle } from './types';

// Semantic tag colors used across projects and posts.
export const tagColors: Record<string, TagStyle> = {
  C: { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
  C99: { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
  ZIG: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
  'x86-64': { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
  ASM: { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
  SIMD: { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
  BITBOARDS: { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
  INTERNING: { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },
  TYPECHECKING: { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },
  COMPILERS: { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },
  AUTOMATA: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  LEXING: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  PARSING: { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' },
  SEMANTICS: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  'JSON PARSER': { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },
  AOT: { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },
  'LLVM IR': { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },
  '120K TRIS @ 120 FPS': { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
  '4.0 GB/S': { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
  SECURITY: { color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)' },
  BEGINNER: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)' },
};
