---
layout: blog
title: "Type-Safe Configs in C99: Why I Prefer Code-Gen over Parsing"
date: "APRIL 05, 2026"
author: "Aiko Schurmann"
description: "How shifting configuration validation to a build-step eliminates boilerplate and runtime errors in C."
tags:
  - "C"
  - "SECURITY"
showOnHome: true
---

<script>
  import BarChart from '$lib/components/BarChart.svelte';
  import ProjectEmbed from '$lib/components/ProjectEmbed.svelte';
</script>

In the world of C, configuration is often a "stringly-typed" nightmare. 

Most developers reach for a JSON or YAML parser. At runtime, you load a file, traverse a tree of generic `Value` nodes, and manually cast strings to integers while praying you didn't miss a null check. If a user provides a string where a port number should be, your application might crash, or worse, start up in a "half-broken" state that only fails hours later.

I built **cfgsafe** to treat configuration as a **compiled asset** rather than a runtime mystery. It uses a declarative schema to generate a strongly-typed C99 single-header library, shifting the burden of validation from your application's hot path to the build-step.

<ProjectEmbed id="cfgsafe" />

<BarChart 
  title="Manual LoC: Adding an Integer Field (with Range Validation)"
  ySuffix=" lines"
  data={[
    { label: "json-c", value: 16, color: "#6b7280" },
    { label: "libconfig", value: 10, color: "#94a3b8" },
    { label: "cfgsafe", value: 1, color: "#60a5fa" }
  ]}
  maxY={20}
/>

The delta here isn't just about brevity; it's about **defensive programming**. In a standard JSON library, adding a single validated integer requires:
1. Updating the C struct.
2. Fetching the object key.
3. Validating the existence of the key.
4. Validating the value type (is it actually an int?).
5. Validating the business logic (is it in range?).
6. Writing 3 separate error-handling branches.

With `cfgsafe`, you write one line in the schema. The other 15 lines of boilerplate are moved into the generated header, where they are guaranteed to be correct.

## 1. The Philosophy: Schema-First Design

Instead of writing code to *parse* data, you write a schema to *describe* data. `cfgsafe` uses a custom DSL that allows you to define constraints directly in the definition.

```rust
// app.schema
schema Database {
  host: string { default: "localhost" }
  port: int    { default: 5432, range: 1..65535, env: "DB_PORT" }
  password: string { secret: true, required: true }
}

schema Config {
  service_name: string { required: true, pattern: "^[a-z0-9-]+$" }
  db: Database {}
}
```

By defining properties like `range`, `pattern`, or `env` in the schema, you eliminate hundreds of lines of manual validation logic. The generator (`cfg-gen`) handles the heavy lifting of ensuring the environment variables are checked and the regex is matched before your application even sees the data.

## 2. AOT Strong Typing: No More String Lookups

When you run `cfg-gen app.schema`, it outputs a native C `struct`. This is the "magic" of the AOT approach. You no longer access your configuration through string lookups like `json_object_get_int(obj, "port")`. You access it as a native member:

```c
// Generated header snippet
typedef struct {
    const char* host;
    int64_t port;
    const char* password;
} Database_t;

typedef struct {
    const char* service_name;
    Database_t db;
} Config_t;
```

This provides three immediate benefits:
1.  **Compile-time Safety:** If you typo `cfg.db.prt`, the compiler refuses to build the app.
2.  **Zero Overhead:** Accessing a struct member is a single memory offset. There is no hash map lookup or string comparison at runtime.
3.  **IDE Autocomplete:** Your editor knows exactly what fields exist and what their types are.

## 3. The Memory Model: Solving "Death by a Thousand free()"

Managing string lifetimes in C is notoriously difficult. When you parse a JSON file, you often end up with dozens of tiny allocations scattered across the heap. Freeing them correctly—especially in nested structures—is a common source of memory leaks.

`cfgsafe` uses an **Internal Memory Pool**. During the `Config_load` phase, all strings, arrays, and nested objects are allocated into a single, contiguous block of memory.

```c
Config_t cfg;
cfg_error_t err;

// One call to load and validate everything
if (Config_load(&cfg, "config.ini", argc, argv, &err) != CFG_SUCCESS) {
    handle_error(err);
}

// ... use cfg ...

// One call to free every single allocation associated with the config
Config_free(&cfg);
```

By centralizing the memory management, we ensure that "half-allocated" configs are impossible. If validation fails halfway through, the library cleans up the pool automatically before returning an error.

## 4. Layered Resolution and Security

Modern applications rarely get their config from just one place. `cfgsafe` implements a strict, predictable precedence:

1.  **CLI Arguments** (e.g., `--db.port 8080`)
2.  **Environment Variables** (e.g., `DB_PORT=5432`)
3.  **INI File** (e.g., `port = 3000`)
4.  **Schema Defaults**

This layering is baked into the generated code. The library also treats the `secret` property with high priority. Fields marked as `secret` are automatically redacted from any auto-generated debug logs or error messages, preventing API keys or passwords from leaking into `stdout`.

## 5. Built-in Validation Primitives

The generator produces specialized validation routines for every field. For example, if you use the `exists` property on a string, `cfgsafe` will verify that the path exists on the filesystem during the load phase:

```rust
schema Logs {
  path: string { exists: true, default: "/var/log/myapp" }
}
```

The generated code will perform an `access()` check (on Unix) or `GetFileAttributes` (on Windows) before considering the configuration "valid." This "fail-fast" behavior ensures that your application doesn't start up only to crash the first time it tries to write to a non-existent log directory.

## 6. Comparison: Codegen vs. Runtime Parsing

| Feature | json-c / yaml-cpp | cfgsafe |
| :--- | :--- | :--- |
| **Type Safety** | Runtime Casts | Compile-time Structs |
| **Lookup Cost** | O(log N) or O(N) | O(1) Offset |
| **Memory Management** | Manual / Recursive | Atomic Pool |
| **Validation** | Manual | Schema-Driven |
| **Precedence** | Manual Merging | Automatic |

## Conclusion: Treating Config as Code

In systems programming, we value predictability and performance. We use compilers to catch our mistakes before they hit production. Why should our configuration be any different?

By moving to a code-generation workflow, we stop treating configuration as a "bag of strings" and start treating it as a first-class citizen of our type system. `cfgsafe` isn't just about parsing; it's about building more resilient systems by ensuring that once your `main()` function starts executing, your environment is guaranteed to be valid, typed, and secure.
