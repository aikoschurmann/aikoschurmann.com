---
layout: project
title: "software-renderer"
thumb: "SR"
description: "A multi-threaded 3D graphics pipeline built from scratch in C, achieving high-performance rasterization without GPU acceleration."
github: "https://github.com/aikoschurmann/software-renderer"
---

<script>
  import ProjectLayout from '$lib/components/ProjectLayout.svelte';
</script>

<ProjectLayout>

This project is a high-performance 3D rendering engine that implements the entire graphics pipeline on the CPU. It avoids all hardware acceleration APIs (OpenGL/Vulkan) to explore close-to-metal optimizations and data-oriented architectural patterns.

### Engineering Highlights

*   **Multi-Threaded Rasterization:** Utilizes dynamic thread pools with lock-free atomic counters for load-balanced spatial binning and rasterization.
*   **Data-Oriented Design:** Implemented Structure of Arrays (SoA) for vertex and primitive data to maximize CPU cache efficiency and SIMD utilization.
*   **Aggressive Culling:** Features object-level frustum culling and per-object light culling, reducing memory bandwidth from dozens of MBs down to a few KBs per frame.
*   **Custom Fragment Shading:** Supports Blinn-Phong illumination with sequential-squaring power approximations to avoid expensive math library calls.

### Performance Benchmarks

The engine demonstrates that software rendering is viable for complex scenes through optimized memory access and threading, achieving **120K+ triangles at 120 FPS** while being illuminated with blinn-phong shading and multiple dynamic lights.

</ProjectLayout>
