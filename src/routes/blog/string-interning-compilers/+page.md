---
layout: blog
title: "O(1) Symbol Resolution: The Power of String Interning"
date: "MARCH 31, 2026"
author: "Aiko Schürmann"
description: "A deep dive into the Dense Arena Interner: moving from O(N*L) string matching to O(1) integer comparisons."
tag: "INTERNING"
showOnHome: true
---

<script>
  import ProjectEmbed from '$lib/components/ProjectEmbed.svelte';
  import PostEmbed from '$lib/components/PostEmbed.svelte';
</script>

Compilers spend a massive amount of time looking at names. Every variable, function, and keyword in your source code is a string that needs to be identified, categorized, and resolved.

If you aren't careful, the system will spend more time doing string math than actually generating code. I implemented a **Dense Arena Interner** to make symbol resolution effectively free.

Here is the technical journey from slow text matching to instant integer comparisons.

<ProjectEmbed id="compiler-v3" />

## The Linear Bottleneck: O(N * L)

Imagine a Lexer scanning your code. It finds the characters `f-u-n-c`. It needs to know: "Is this a keyword like `func` or `return`, or is it a variable name?"

The naive approach is a linear scan using `strcmp` against a list of known keywords:

```c
// Naive Lexer logic
const char* keywords[] = { "fn", "if", "else", "while", "return", ... };

for (int i = 0; i < num_keywords; i++) {
    if (strcmp(token_string, keywords[i]) == 0) {
        return keyword_tokens[i];
    }
}
```

- **strcmp(s1, s2)** is **O(L)**, where L is the string length. It must check every character until it finds a mismatch.
- **Linear Scan** is **O(N)**, where N is the number of keywords.
- **Total Cost:** **O(N * L)** per token.

If your language has 50 keywords and the average identifier is 8 characters, you're doing roughly 400 character comparisons just to identify a single word. In a large project, this overhead becomes a massive anchor on performance.

## The Hashing Improvement: O(L)

To improve this, we move to a Hash Map. Instead of checking every keyword, we compute a hash of the token and jump directly to the potential match. I use separate chaining with dynamic arrays for buckets. This ensures that even with collisions, performance remains stable.

```c
// hash_map.c - Simplified insertion
bool hashmap_put(HashMap* map, void* key, void* value) {
    // 1. Automatic Resizing (Load Factor > 0.75)
    if (map->size >= (map->bucket_count * 3) / 4) {
        hashmap_rehash(map, map->bucket_count * 2);
    }

    // 2. O(L) Hashing: We must visit every byte to compute the hash.
    size_t index = hash_func(key) % map->bucket_count;
    DynArray *bucket = &map->buckets[index];

    // 3. O(1) average lookup in bucket chain
    for (size_t i = 0; i < bucket->count; i++) {
        KeyValue *kv = dynarray_get(bucket, i);
        if (cmp_func(kv->key, key) == 0) {
            kv->value = value; // Update existing
            return true;
        }
    }
    
    // 4. Push new entry
    return dynarray_push(bucket, (KeyValue){key, value});
}
```

While O(L) is much better than O(N * L), we are still paying the hashing price **every time** we encounter that string in the Parser, Typechecker, or Optimizer. We need a way to pay that O(L) cost **exactly once** and then use **O(1)** for the rest of the execution.

## The Foundation: Stable Memory (The Arena)

To eliminate string comparisons entirely, we need to ensure that identical strings point to the **exact same memory address**. Standard `malloc` or `realloc` can move things around or scatter them, making pointer comparisons risky.

I use an **Arena Allocator** which manages memory in large contiguous blocks, providing two critical guarantees: **O(1) allocation** and **Pointer Stability**.

```c
typedef struct ArenaBlock {
    struct ArenaBlock *next; // Pointer to the next block in the chain
    size_t capacity;         // Total size of this block's data
    size_t used;             // Number of bytes currently allocated
    uint8_t data[];          // The actual memory
} ArenaBlock;

typedef struct {
    ArenaBlock *blocks;      // Head of the block list
    size_t block_size;       // Default size for new blocks
} Arena;
```

Allocation in an Arena is just "bumping" a pointer forward. Once a string is stored in an Arena block, its address **never changes**. This stability allows us to use the pointer itself as a unique ID.

However, there is a catch: the **"Un-freeable" Nature of Arenas**. Arena allocators are perfect for batch compilers because you usually just drop the entire memory block at the end of compilation. But if this compiler is ever adapted to run as a long-lived **Language Server Protocol (LSP)** daemon, memory could balloon since arenas cannot free individual interned strings as files change.

## Core Abstractions: Slice and InternResult

Before looking at the interner itself, we need to define the two core data structures used to pass data around.

**Slice:** A lightweight reference to a string. It doesn't own its memory; it just points to a start and a length. This allows the Lexer to point directly into the source file buffer without copying.

```c
typedef struct {
    const char *ptr;
    size_t len;
} Slice;
```

**InternResult:** When the interner processes a string, it returns this "canonical" handle. It contains the pointer to the unique string in the Arena and an `Entry` which holds a unique integer ID (the Dense ID) and metadata like the token type.

```c
typedef struct {
    void *key;      // Canonical string in the Arena
    Entry *entry;   // Metadata (Dense ID and metadata)
} InternResult;
```

## The Dense Arena Interner: O(1)

String interning deduplicates strings so that only one "canonical" copy exists. The **Dense** part of this implementation refers to how we identify these strings. Instead of just using pointers, we assign every unique string a contiguous, zero-indexed integer (0, 1, 2...). 

The `DenseArenaInterner` uses the Hash Map to find existing strings and the Arena to store new ones.

```c
typedef struct {
    Arena *arena;           // Where canonical strings live
    HashMap *hashmap;       // Maps Slice -> InternResult*
    int dense_index_count;  // Counter for the Dense ID (0, 1, 2...)
} DenseArenaInterner;
```

When we intern a string, we check the Hash Map. If it's already there, we return the existing `InternResult`. If not, we copy it into the Arena exactly once and increment our `dense_index_count`. This ensures that if we've seen 500 unique strings, they are mapped to the integers 0 through 499.

```c
// dense_arena_interner.c - Simplified interning loop
InternResult* intern(DenseArenaInterner *table, Slice *key) {
    // 1. O(L) Hash + O(1) Map Lookup
    InternResult *existing = hashmap_get(table->hashmap, key);
    if (existing) return existing;

    // 2. Not found: Create canonical copy in the Arena
    char *canonical = arena_alloc(table->arena, key->len + 1);
    memcpy(canonical, key->ptr, key->len);
    canonical[key->len] = '\0';

    // 3. Assign the next Dense ID
    InternResult *res = arena_alloc(table->arena, sizeof(InternResult));
    res->key = canonical;
    res->entry = arena_alloc(table->arena, sizeof(Entry));
    res->entry->dense_index = table->dense_index_count++; // Sequential ID

    // 4. Update the map for future O(1) lookups
    hashmap_put(table->hashmap, key, res);
    return res;
}
```

## Lexer Integration

The real performance gain happens during the Lexer's initialization and scanning. The Lexer maintains separate interners for keywords and identifiers.

**Startup: Bootstrapping Keywords.** When the compiler starts, we pre-populate the keyword table. This ensures every keyword is already "canonical" before we scan a single line of code.

```c
// lexer.c - Initialization logic
static const struct { const char *word; TokenType type; } KEYWORDS[] = {
    {"fn", TOK_FN}, {"if", TOK_IF}, {"return", TOK_RETURN}, ...
};

for (size_t i = 0; KEYWORDS[i].word; i++) {
    Slice s = { .ptr = KEYWORDS[i].word, .len = strlen(KEYWORDS[i].word) };
    // Store the TokenType as metadata directly in the Entry
    intern(lexer->keywords, &s, (void*)(uintptr_t)KEYWORDS[i].type);
}
```

**Runtime: The Instant Check.** Now, when the Lexer scans a word, it uses `intern_peek`—a function that checks the keyword map without allocating new memory.

```c
// lexer.c - Identifier scanning
static void *lexer_lex_identifier(Lexer *lexer, ...) {
    Slice slice = lexer_make_slice(start, end);

    // 1. Keyword check (O(L) hashing + O(1) pointer lookup)
    InternResult *kw = intern_peek(lexer->keywords, &slice);
    if (kw) {
        // It's a keyword! Pull the TokenType from the metadata.
        *out_type = (TokenType)(uintptr_t)kw->entry->meta;
        return kw; 
    }

    // 2. Not a keyword? Intern it into the general identifier table.
    *out_type = TOK_IDENTIFIER;
    return intern(lexer->identifiers, &slice, NULL);
}
```

## Beyond Hashing: The Power of Dense IDs

While O(1) speed is the primary goal, the **Dense ID** system provides several architectural "superpowers" that simplify the rest of the compiler.

**1. Flat Array Symbol Tables.** This is the most significant benefit. In a traditional compiler, the Symbol Table is often another complex Hash Map. With Dense IDs, the Symbol Table becomes a **flat array**. 

Since every variable name is guaranteed to have an ID between 0 and `N`, we can use that ID as a direct index into an array. This turns symbol resolution into a single memory offset calculation—the fastest possible way to access data.

**Handling Variable Shadowing.** One complexity is lexical scoping. If a variable `index` is declared in a global scope, and then shadowed by an `index` parameter in a nested function, both strings resolve to the exact same Dense ID. We solve this by maintaining a hierarchy of Scopes, each with its own sparse array.

```c
// Each scope has its own symbols array, indexed by the global Dense ID
Symbol *scope_lookup_symbol(Scope *scope, InternResult *rec) {
    Scope *current = scope;
    while (current) {
        // Direct O(1) index check per scope level
        if (rec->entry->dense_index < current->capacity) {
            Symbol *symbol = current->symbols[rec->entry->dense_index];
            if (symbol) return symbol; // Found the most local version
        }
        current = current->parent;
    }
    return NULL;
}
```

While this hierarchy works perfectly, other high-performance compilers sometimes use an **Array of Stacks** (where each Dense ID maps to a stack of symbols) or an **Undo Log** (pushing to a global array and rolling back on scope exit). I haven't implemented these yet, but they offer an interesting alternative to tree-walking by keeping the most local symbol at the top of a global structure.

**2. Memory Efficiency and Cache Locality.** Because the IDs are contiguous, we can store metadata in compact, cache-friendly structures. When the compiler iterates over all symbols, it's performing a linear scan over a contiguous block of memory. This maximizes CPU cache hits and minimizes the memory overhead associated with sparse data structures like Hash Maps.

**3. Instant Type and Symbol Comparisons.** Interning isn't just for strings; it's a strategy for **structural canonicalization**. When we intern complex types (like "pointer to i32" or "function returning bool"), we ensure that every identical type in the entire program points to the exact same memory address.

This creates a **recursive shortcut**. Even the process of interning a new complex type is fast because its constituents (return types, parameters, base types) are already interned. Instead of a deep, recursive structural check, we only need to perform a "shallow" comparison of the component pointers.

```c
// Interning a complex function type is just a shallow pointer check
// because 'ret' and 'params' are already canonical pointers.
bool type_compare(Type *a, Type *b) {
    if (a->kind != b->kind) return false;
    if (a->ret != b->ret) return false; // Simple pointer comparison
    if (a->param_count != b->param_count) return false;
    
    // Check if the parameter pointer arrays match
    return memcmp(a->params, b->params, a->param_count * sizeof(Type*)) == 0;
}
```

By ensuring that every "child" type is already canonical, the interner can determine if a "parent" type exists without ever walking more than one level deep. Once the type is interned, the rest of the compiler can compare complex signatures as if they were simple integers.

```c
// The ultimate win: O(1) equality everywhere else
if (type_a == type_b) {
    // Verified identical signatures in a single CPU instruction
}
```

## The Result: Free Resolution

Work done in the lexer results in every string being converted into a unique pointer. From that point on, the Parser, Typechecker, and Optimizer never use `strcmp` again. String interning transforms the compiler from a slow text processor into a lean, integer-crunching machine. This optimization ensures the entire front-end pipeline feels practically instantaneous.

