---
layout: project
title: "cfgsafe"
thumb: "CS"
description: "A declarative schema-driven configuration engine for C99, generating strongly-typed and memory-safe code."
github: "https://github.com/aikoschurmann/cfgsafe"
---

<script>
  import ProjectLayout from '$lib/components/ProjectLayout.svelte';
  import PostEmbed from '$lib/components/PostEmbed.svelte';
</script>

<ProjectLayout>

`cfgsafe` is a mini-compiler that transforms declarative schemas into zero-dependency, memory-safe C99 headers. It eliminates the CVE risks traditionally associated with manual string parsing and manual memory management in systems programming.

### cfgsafe in use:

**1. Define your constraints (`config.schema`)**
```scala
import "validators.h"

schema Config {
  host: string { 
    env: "DB_HOST"
    hook: "dns_verify" 
  }
  port: int { 
    range: 1..65535
    default: 5432 
  }
  pass: string { secret: true }
}

schema Server {
  port: int { range: 80..9000; default: 8080 }
  db: Config {} // Composition
  
  enable_tls: bool { default: false }
  cert: path { 
    required_if: enable_tls == true
    exists: true 
  }
}
```

**2. Use the generated, type-safe API**
```c
#define CONFIG_IMPLEMENTATION
#include "config.h"

int main(int argc, char** argv) {
  Server_t cfg;
  cfg_error_t err;

  // AOT validation: parses CLI > Env > INI and halts on bounds errors
  if (Server_load(&cfg, "config.ini", argc, (const char**)argv, &err) != CFG_SUCCESS) {
    fprintf(stderr, "Config Error: %s at %s\n", err.message, err.field);
    return 1;
  }
  
  // Natively typed, nested, and guaranteed valid
  if (cfg.enable_tls) {
    setup_ssl(cfg.cert); 
  }

  // secret fields are redacted in dump and zeroed on free
  Server_print(&cfg, stdout); 

  // O(1) cleanup of all nested strings/arrays via Arena allocation
  Server_free(&cfg); 
}
```

### Engineering Highlights

*   **Arena-Backed Memory Model:** To guarantee zero leaks, all nested configuration data is stored in a single contiguous memory block. Cleanup is a single pointer reset, eliminating fragmentation and $O(N)$ `free()` calls.
*   **AOT Validation Boundary:** `cfg_load` acts as a strict security boundary. Range bounds, regex patterns, and enum variants are enforced *before* your business logic ever touches the data.
*   **Automatic Secret Redaction:** Fields marked as `secret` are cryptographically zeroed on free and automatically redacted from all auto-generated logging/debug functions.
*   **Zero Dependencies:** The generator emits standard C99 code with no external runtime requirements, making it ideal for embedded or high-performance systems.

Read more about cfgsafe's design and implementation in the accompanying blog post:

<PostEmbed id="Type-Safe Configs in C99: Why I Prefer Code-Gen over Parsing" />

</ProjectLayout>
