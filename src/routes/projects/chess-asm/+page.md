---
layout: project
title: "chess-asm"
thumb: "CH"
description: "A high-performance chess game utilizing bitboards and heavily optimized x86-64 assembly routines."
github: "https://github.com/aikoschurmann/chess-asm"
---

<script>
  import ProjectLayout from '$lib/components/ProjectLayout.svelte';
</script>

<ProjectLayout>

`chess-asm` is a low-level implementation of a chess game, written entirely in x86-64 assembly. It explores the extreme performance benefits of using bitboards and direct hardware manipulation for move generation.

### Engineering Highlights

*   **Bitboard Representation:** Uses 64-bit integers to represent the board state, where each bit corresponds to a square. This allows for move generation and state updates using single-instruction bitwise operations.
*   **Highly Optimized Routines:** Implemented core move generation logic directly in assembly to eliminate compiler abstraction overhead and maximize register usage.
*   **32-bit Compatibility Layer:** Designed a split "high/low" bitboard system to support 32-bit architectures while maintaining 64-bit logical correctness.
*   **Graphical Output:** Utilizes Mode 13h for direct video buffer manipulation, providing a custom graphical interface for the board and pieces.
*   **Lock-Free Board Logic:** Designed the move generation functions to be stateless and branch-minimized, ensuring high throughput during engine search phases.


</ProjectLayout>
