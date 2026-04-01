---
layout: project
title: "zog"
thumb: "ZG"
description: "A blisteringly fast, zero-allocation JSONL scanner written in Zig, saturating NVMe bandwidth via SIMD vectorization."
github: "https://github.com/aikoschurmann/zog"
---

<script>
  import ProjectLayout from '$lib/components/ProjectLayout.svelte';
  import PostEmbed from '$lib/components/PostEmbed.svelte';
</script>

<ProjectLayout>

`zog` is a high-performance command-line utility for querying massive JSONL datasets. Designed as a "Blind Scanner," it skips full JSON tree construction to extract data at the physical speed limit of the underlying hardware.

### Engineering Highlights

*   **SIMD Fast Path:** Leverages AVX2 and NEON instructions to scan delimiters and keys, skipping dozens of CPU branches per cycle. Zig's first-class SIMD support automatically targets platform-specific vector units.
*   **Zero-Allocation Model:** Operates entirely on input buffers with zero heap allocations during the hot path, maximizing cache locality.
*   **Async I/O:** Implemented double-buffered asynchronous file I/O to saturate NVMe SSD bandwidth.
*   **Pre-Compiled Query Plans:** Compiles user queries into an optimized execution plan at startup to eliminate runtime interpretation overhead.

### Performance Benchmarks

In head-to-head comparisons on a 1 GB JSONL dataset (6.7 million lines), `zog` demonstrates significant performance leads over industry-standard tools:

*   **Key Matching:** **4.03 GB/s**, outperforming `ripgrep` (2.30 GB/s) and `jq` (0.07 GB/s).
*   **Complex Logic:** **2.24 GB/s**, roughly 4.1x faster than `ripgrep`.
*   **Aggregations:** Runs at **~2 GB/s**, providing a 40x speedup over `jq` for large-scale data analysis.

<PostEmbed id="The Nitty Gritty of zog: Pushing JSONL to 4.0 GB per second" />

</ProjectLayout>
