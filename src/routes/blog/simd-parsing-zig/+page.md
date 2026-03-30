---
layout: blog
title: "The Nitty Gritty of zog: Pushing JSONL to 4.0 GB per second"
date: "MARCH 30, 2026"
author: "Aiko Schurmann"
description: "A deep dive into the SIMD bitmasking and async IO tricks that make zog saturate NVMe drives."
tag: "ZIG"
showOnHome: true
---

<script>
  import BarChart from '$lib/components/BarChart.svelte';
  import ProjectEmbed from '$lib/components/ProjectEmbed.svelte';
</script>

If you want to parse JSON fast, you have to stop parsing JSON.

Traditional tools read a byte, check if it is a quote, enter a string state, read until the next quote, allocate memory, and copy the string. This scalar loop destroys CPU branch predictors. The processor constantly guesses wrong about when a string ends, causing pipeline flushes that waste 15 to 20 cycles every single time.

This is why traditional tools bottleneck at 70 MB per second. I wanted to hit the physical limit of the storage drive. So I built zog in Zig.

<ProjectEmbed id="zog" />

<BarChart 
  title="Throughput: Simple Key Match (1 GB Dataset)"
  ySuffix=" GB/s"
  data={[
    { label: "jq / jaq", value: 0.07, color: "#6b7280" },
    { label: "ripgrep", value: 2.30, color: "#f87171" },
    { label: "zog (file)", value: 4.03, color: "#f97316" }
  ]}
  maxY={4.5}
/>

Here is the exact low level architecture that makes 4.03 GB per second possible.

## 1. Escaping the Scalar Loop with AVX2

Instead of checking one byte at a time, the engine loads 32 bytes of the log file directly into a 256 bit SIMD register. We then execute a parallel comparison against the character we want to find. The hardware returns a 32 bit mask where every 1 represents a match.

```zig
// Loading 32 bytes into an AVX2 vector
const chunk = @as(@Vector(32, u8), buffer[i .. i + 32].*);
const quotes = @as(@Vector(32, u8), @splat('"'));

// Parallel compare yields a boolean vector, cast to integer
const mask = @bitCast(u32, chunk == quotes);
```

Once we have this integer mask, we use the `tzcnt` hardware instruction to count the trailing zeros. This instantly gives us the exact index of the next quote character. We skip the string contents completely without a single branch instruction. Control flow becomes pure data flow.

## 2. Double Buffered Asynchronous IO

Even the fastest CPU loop will starve if it waits for the kernel to read from the disk. The standard sequential read process is a massive bottleneck.

To solve this, the engine spawns a dedicated background thread solely for filling 8 megabyte memory buffers. While the main thread slices through the current buffer using vector instructions, the operating system is busy DMA copying the next chunk of the file into the second buffer. The memory bus is saturated 100 percent of the time.

## 3. Zero Allocation Slicing

Memory allocation is the absolute death of speed. The engine performs zero heap allocations during the hot scan. 

When it finds a matching key, it does not allocate memory to extract the value. It validates the primitive boundaries and returns a direct slice of the existing memory mapped buffer. 

For math aggregations like computing an average or a sum, it uses a custom ASCII to integer conversion routine that runs completely in place. Standard library parsing functions carry too much overhead. By assuming the buffer contains valid digits, the scanner multiplies and accumulates the bytes directly in CPU registers.

<BarChart 
  title="Throughput by Query Complexity"
  ySuffix=" GB/s"
  data={[
    { label: "Simple Match", value: 4.03, color: "#3b82f6" },
    { label: "Numeric Compare", value: 3.39, color: "#60a5fa" },
    { label: "Field Extraction", value: 2.83, color: "#93c5fd" },
    { label: "Math Aggregations", value: 2.41, color: "#bfdbfe" }
  ]}
  maxY={4.5}
/>

## 4. Ahead of Time Query Planning

Before a single byte of JSON is read, the engine compiles your CLI query into an optimized execution plan. Keys are quoted in advance, numeric limits are parsed early, and the exact SIMD vectors are built before the scan begins. 

By the time the hot loop starts, there is zero configuration logic left to evaluate. Just pure vector math.

## The Compromise

To hit these speeds, you have to break some rules. The engine deliberately operates with structural ignorance. It does not balance braces or track object nesting. For validating strict JSON schemas, this approach is terrible. 

But for analyzing 100 GBs of flat access logs in the middle of a production incident? This ignorance is a massive advantage. The sheer speed of querying raw memory is a compromise I will gladly take every time.