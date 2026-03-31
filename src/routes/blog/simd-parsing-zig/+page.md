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
  import PostEmbed from '$lib/components/PostEmbed.svelte';
</script>

If you want to parse JSON fast, you have to stop parsing JSON.

Traditional tools like `jq` or `jaq` are designed for correctness and flexibility. They build a complete Abstract Syntax Tree (AST), which involves recursively traversing the structure, balancing braces, and allocating memory for every node. While correct, this approach is a disaster for modern CPU pipelines. 

Modern CPUs use **Speculative Execution** and **Branch Prediction** to stay busy. When you have a scalar loop checking every byte for special characters, the branch predictor constantly fails. Every time it guesses wrong about whether a byte is a quote or a colon, the CPU has to flush its pipeline, wasting 15-20 cycles. At 4 GB/s, you simply cannot afford to guess.

I built **zog** in Zig to see if I could hit the theoretical throughput limit of my NVMe drive. It reaches **4.03 GB/s** by treating JSONL not as a hierarchy, but as a flat stream of bytes optimized for vector hardware.

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

## 1. The "Blind Scanner" Philosophy

The secret to zog's speed is **Structural Ignorance**. Most JSONL (JSON Lines) files used in logging are either flat or have a very shallow, predictable depth. By assuming the input is valid JSONL, we can ignore the hierarchy entirely.

Zog doesn't track if a key is inside a nested object or an array. It looks for the literal byte sequence of the key (e.g., `"id":`) and validates that it is a proper key by checking for preceding quotes. This "blindness" turns a complex tree-parsing problem into a linear pattern-matching problem, which is exactly what SIMD hardware is built for.

## 2. SIMD Vectorization: Thinking in 256-bit Chunks

Instead of reading a single `u8`, zog loads **32 bytes** into a 256-bit AVX2 register. We then perform parallel comparisons across all 32 bytes simultaneously.

Here is the implementation of the core scanning primitive in `scanner.zig`. Notice how we use Zig's `@Vector` type to generate the appropriate assembly:

```zig
const VECTOR_LEN = 32;
const Vec = @Vector(VECTOR_LEN, u8);

// QUOTE_VEC is a 256-bit register filled with '"' (0x22)
const QUOTE_VEC: Vec = @splat('"');

fn checkSimdChunk(chunk: Vec, fcv: Vec) u32 {
    // chunk: 32 bytes of raw data from the file
    // fcv: 32 bytes filled with the FIRST character of our search key
    
    // 1. Parallel Compare: Returns a boolean vector where 
    //    each byte is 0xFF if it matches, or 0x00 if it doesn't.
    const quote_mask = chunk == QUOTE_VEC;
    const first_char_mask = chunk == fcv;
    
    // 2. Bitwise OR: Combine the masks. We want to stop at 
    //    EITHER a quote OR the start of a potential key.
    const combined = quote_mask | first_char_mask;
    
    // 3. BitCast: Convert the 32-byte boolean vector into a single u32.
    //    Each bit in the u32 now represents one of the 32 bytes.
    return @bitCast(u32, combined);
}
```

Once we have our `u32` mask, we need to know *where* the matches are. A standard loop would be too slow. Instead, we use the `tzcnt` (Trailing Zero Count) instruction via Zig's `@ctz` intrinsic.

```zig
var mask = checkSimdChunk(chunk, fcv);

// While there are still set bits in our mask...
while (mask != 0) {
    // Find the index of the first set bit (the first match)
    // This is a single CPU instruction! No branching.
    const bit_idx = @ctz(mask);
    const byte_idx = i + bit_idx;

    // Focused Check: Now that we found a potential start, 
    // check the rest of the key bytes normally.
    if (matchFullKey(buffer[byte_idx..], search_key)) {
        handleMatch();
    }

    // "Clear" the bit we just processed so we can find the next one
    mask &= mask - 1; 
}
```

## 3. Saturating the Bus: Async Double-Buffering

At 4 GB/s, the CPU is so fast that it will finish processing a buffer before the disk can provide the next one. A standard `file.read()` call blocks the thread, causing the CPU to sit idle.

Zog uses a **Double-Buffered Producer-Consumer** model. We spawn a background thread that does nothing but read from the disk into two 8 MB buffers.

```zig
// Reader Thread Logic
fn readerThread(file: File, queue: *Queue) void {
    while (true) {
        var buf = queue.getEmptyBuffer();
        const bytes_read = file.readAll(buf); // Direct I/O to avoid kernel caching
        queue.pushFullBuffer(buf[0..bytes_read]);
        if (bytes_read == 0) break;
    }
}
```

While the **Worker Thread** is chewing through Buffer A using SIMD instructions, the **Reader Thread** is asking the OS to DMA (Direct Memory Access) the next chunk into Buffer B. This ensures the memory bus is never empty.

## 4. Zero Allocation and Fast Primitives

If you `alloc` even once per line, your performance will drop to MB/s. Zog is **Zero-Alloc**. We treat the entire file as a single immutable buffer (often using `mmap` for large files). 

When we find a numeric value we need to compare (e.g., `status eq 200`), we don't call `std.fmt.parseInt`. That function handles signs, bases, and errors that we don't need. We use a stripped-down integer parser:

```zig
fn parseFastInt(slice: []const u8) i64 {
    var val: i64 = 0;
    // We already know these are digits because we validated 
    // the primitive boundaries in the scanning phase.
    for (slice) |byte| {
        // Basic ASCII to Int: '0' is 48, so '5' - '0' is 5.
        // Multiply by 10 to shift the previous digits left.
        val = val * 10 + (byte - '0');
    }
    return val;
}
```

By keeping everything in CPU registers and stack memory, we avoid the overhead of the heap and the garbage collector (which Zig doesn't have anyway).

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

## 5. Ahead-of-Time Query Planning

The final optimization happens before the search even starts. Zog compiles your query into a hierarchical **Execution Plan**. This moves all the decision-making logic (the "thinking") out of the hot loop.

### The Plan Hierarchy

Zog represents your query through a set of nested structs that minimize runtime dispatch:

```zig
pub const CompiledPlan = struct {
    groups: []CompiledGroup,    // OR logic: if any group matches, line matches
    pluck_keys: []CompiledPluck, // Fields to extract if matched
    has_aggregations: bool,
    limit: usize,
    // ...
};

pub const CompiledGroup = struct {
    conditions: []CompiledCondition, // AND logic: all conditions must match
};

pub const CompiledCondition = struct {
    key_quoted: []const u8, // Pre-computed e.g. "\"status\":"
    val_unquoted: []const u8,
    op: Op,                 // eq, gt, contains, etc.
    fcv: @Vector(32, u8),   // Pre-splatted first character of key
    // ...
};
```

### Pre-Computing SIMD Vectors

The most significant optimization in the planning phase is the **First Character Vector (FCV)**. 

When searching for a key like `status`, zog knows it will always be preceded by a double quote in JSON. During compilation, we pre-calculate a SIMD vector containing the *first character* of the key (the byte immediately following the quote).

```zig
// Inside compilePlan...
const quoted = try std.fmt.allocPrint(allocator, "\"{s}\":", .{user_key});
condition.key_quoted = quoted;

// We splat the character at index 1 (the 's' in "status":)
// so we can stop only when we see a " followed by an 's'.
condition.fcv = @splat(quoted[1]);
```

### The "Double-Tap" Check

At runtime, zog doesn't just look for the key. It uses a "double-tap" SIMD check that ANDs two masks together: one for the quote and one for the first character of the key shifted by one.

```zig
const chunk: V = buffer[i..][0..32].*;
const next_chunk: V = buffer[i+1..][0..32].*;

// Find all quotes and all 's' characters in parallel
const quote_mask = @bitCast(u32, chunk == QUOTE_VEC);
const char_mask = @bitCast(u32, next_chunk == condition.fcv);

// Intersection: Only bits where a quote is immediately followed by 's'
const final_mask = quote_mask & char_mask;
```

This reduces the number of "false positive" stops significantly. Instead of stopping for every single quote in the file, zog only stops when it sees the start of a key it actually cares about. 

## 6. The Trade-off

This level of performance requires a compromise. Because zog is a "Blind Scanner," it cannot tell the difference between:
`{"id": 1, "meta": {"id": 2}}`

Searching for `id eq 2` will match this line, even if you only wanted root-level IDs. For flat logs, this is irrelevant. For deeply nested, complex schemas, you should use `jq`. But when you have 500GB of logs and 5 minutes to find a bug, **zog** is the only tool that will get you there in time.