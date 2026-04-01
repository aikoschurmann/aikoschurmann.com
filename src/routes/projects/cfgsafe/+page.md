---
layout: project
title: "cfgsafe"
thumb: "CS"
description: "A declarative schema-driven configuration engine for C99, generating strongly-typed and memory-safe code."
github: "https://github.com/aikoschurmann/cfgsafe"
---

<script>
  import ProjectLayout from '$lib/components/ProjectLayout.svelte';
</script>

<ProjectLayout>

`cfgsafe` is a specialized configuration engine for C99 that transforms a declarative schema into a strongly-typed, memory-safe single-header library. It eliminates the boilerplate and safety risks associated with manual configuration parsing in C.

### Engineering Highlights

*   **AOT Strong Typing:** The generator (`cfg-gen`) compiles your schema into a native C `struct`, providing compile-time type safety for all configuration fields.
*   **Safe Memory Model:** Deeply nested strings and arrays are managed by an internal pool, allowing all allocated memory to be cleaned up with a single call.
*   **Layered Resolution:** Automatically merges CLI arguments, environment variables, and INI files with strict, predictable precedence.
*   **Built-in Validation:** Supports deep validation rules including numeric ranges, regex patterns, and file system checks.
*   **Security First:** Automatically redacts fields marked as `secret` from debug logs and error messages.

### Project Impact

By shifting configuration validation to the generator and semantic analysis phases, `cfgsafe` allows developers to focus on core logic while ensuring their system's entry points are robust and secure against malformed input.

</ProjectLayout>
