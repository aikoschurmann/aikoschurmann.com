---
layout: project
title: "compiler-v3"
thumb: "C3"
description: "A compiler for a statically-typed, procedural language featuring explicit memory control and an LLVM backend."
github: "https://github.com/aikoschurmann/compiler-v3"
---

<script>
  import ProjectLayout from '$lib/components/ProjectLayout.svelte';
  import PostEmbed from '$lib/components/PostEmbed.svelte';
</script>

<ProjectLayout>

`compiler-v3` is a compiler for a statically-typed, procedural systems programming language designed for zero hidden allocations and explicit memory control. Featuring an **LLVM backend**, it compiles source files directly into highly-optimized native machine code.

---

## Language at a Glance

The language combines a clean, Rust-like syntax with absolute control over machine resources. Below is an example demonstrating explicit arena allocation, type-bound methods, pointers, `defer`, and the `print` intrinsic.

```rust
import std;

struct Point {
    x: f32;
    y: f32;
}

// Type-bound method with an explicit self pointer
fn Point.translate(self: *Point, dx: f32, dy: f32) -> void {
    self.x = self.x + dx;
    self.y = self.y + dy;
}

fn main() -> i32 {
    // Create an arena allocator
    arena: std.arena.Arena = std.arena.Arena.new(std.heap.allocator, 1024);
    defer { arena.destroy(); } // Entire arena is freed upon exiting main

    allocator: std.mem.Allocator = arena.get_allocator();

    // Zero hidden allocations: allocate a Point on the heap explicitly
    p: *Point = @alloc(Point, allocator, 1);
    p.x = 10.0;
    p.y = 20.0;

    // Call the type-bound method (auto-dereference syntax)
    p.translate(5.5, -3.2);

    // Print the dereferenced struct using the print intrinsic
    print(*p); // Point { x: 15.5, y: 16.8 }

    return 0;
}
```

---

## Compiler Highlights

*   **LLVM Backend Integration:** Translates the parsed AST into LLVM Intermediate Representation (LLVM IR), passing it to LLVM's industrial-grade optimization suite (dead-code elimination, loop vectorization, register allocation) to emit native binaries.
*   **Dense Arena Interning:** Identifiers and types are canonicalized into unique dense integer IDs during parsing. This simplifies semantic checks and symbol lookups from expensive recursive matches to fast $O(1)$ flat-array indexing.
*   **Getting Started:** Build the compiler with `make` and run the executable using `./out/compiler path/to/program.tn --run` (requires Clang, LLVM, and Make).

<PostEmbed id="Dense Arena Interning: The Engine of Compiler Performance" />

</ProjectLayout>
