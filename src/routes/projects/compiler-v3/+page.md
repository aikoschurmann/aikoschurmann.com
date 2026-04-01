---
layout: project
title: "compiler-v3"
thumb: "C3"
description: "A high-performance compiler for a strongly-typed procedural language, featuring recursive type checking and dense-ID symbol resolution."
github: "https://github.com/aikoschurmann/compiler-v3"
---

<script>
  import ProjectLayout from '$lib/components/ProjectLayout.svelte';
  import PostEmbed from '$lib/components/PostEmbed.svelte';
</script>

<ProjectLayout>

`compiler-v3` is a custom-built compiler implemented in C, designed for a custom procedural language with syntax inspired by Rust and C. It features a hand-written recursive descent parser and a sophisticated semantic analyzer.

### Engineering Highlights

*   **Dense Arena Interning:** Implemented a canonicalization system that assigns unique integer IDs to all identifiers and types, transforming symbol lookups from $O(L)$ string matching into $O(1)$ flat-array indexing.
*   **Recursive Type System:** Built a robust type checker capable of resolving complex function pointers, multi-dimensional arrays, and numeric promotions.
*   **Compile-Time Evaluation:** Integrated constant folding and expression evaluation directly into the semantic analysis phase.
*   **Custom Test Harness:** Developed a regression suite to validate parser and analyzer correctness across hundreds of edge cases.

### Architectural Performance

By utilizing a data-oriented design and Arena-based memory management, the compiler achieves near-instantaneous symbol resolution and semantic analysis, eliminating the overhead of standard heap allocations and string comparisons.

<PostEmbed id="Dense Arena Interning: The Engine of Compiler Performance" />

</ProjectLayout>
