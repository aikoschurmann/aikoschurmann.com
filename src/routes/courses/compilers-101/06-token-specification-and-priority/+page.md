---
layout: blog
title: "Token Specification and Priority Design"
date: "2026-04-02"
author: "Aiko Schurmann"
description: "Design high-performance token sets using Dense Arena Interning and O(1) identity resolution."
tags:
  - "COMPILERS"
  - "Core"
chapterTitle: "Token Specification and Priority Design"
showInCourse: true
---

## Learning Objectives

By the end of this chapter, you should be able to:

- Explain the role of the lexer within the compiler pipeline and what it produces
- Design a precise and exhaustive token set for a strongly-typed procedural language
- Implement `Slice` and `Span` data structures to track source provenance with zero allocations
- Trace the full three-stage evolution from naive linear scanning to O(1) Dense Arena Interning
- Explain the architecture of an Arena Allocator and why pointer stability is the critical guarantee
- Describe how the `DenseArenaInterner` assigns canonical Dense IDs to every unique string
- Distinguish between keywords and identifiers using pre-interned pointer comparisons rather than string comparisons
- Resolve lexical ambiguities using Maximal Munch and Rule Priority

---

## 6.1 Where We Are in the Pipeline

In Chapter 1 we established the compilation pipeline:

```
Source text  →  Tokens  →  AST  →  Annotated AST  →  IR  →  Target code
              ^^^^^^^^
              We are here
```

**Lexical analysis** is the first transformation. The lexer reads source code as a raw stream of characters and groups those characters into **tokens**—the smallest units of meaning in the language. Everything that follows in the compiler operates on tokens, not characters.

The lexer's job sounds simple, but producing tokens that are efficient for the rest of the compiler to consume is a non-trivial design problem. The decisions made here—how to represent a token, how to identify keywords, how to store symbol names—have direct performance consequences in the parser, the typechecker, and the optimizer.

This chapter is about making those decisions well.

---

## 6.2 A Concrete Target

To keep things grounded, we'll build a lexer for a real, strongly-typed procedural language with a syntax inspired by Rust and Zig. Here is a representative program:

```rust
fn fibonacci(n: i32) -> i32 {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

fn main() {
    let count: i32 = 0;
    while (count < 10) {
        print(fibonacci(count));
        count += 1;
    }
}
```

From this source, the lexer must produce a token stream like:

```
TOK_FN  TOK_IDENTIFIER("fibonacci")  TOK_LPAREN  TOK_IDENTIFIER("n")
TOK_COLON  TOK_I32  TOK_RPAREN  TOK_ARROW  TOK_I32  TOK_LBRACE
TOK_IF  TOK_LPAREN  TOK_IDENTIFIER("n")  TOK_LESS_EQ  TOK_INT_LIT(1)
...
```

This forces us to handle the four categories that any serious language requires:

- **Keywords**: `fn`, `let`, `if`, `else`, `while`, `return`, and type names like `i32`
- **Compound operators**: `->`, `+=`, `<=`, `==`—multi-character symbols that look like two tokens but are one
- **Identifiers**: `fibonacci`, `n`, `count`—programmer-defined names
- **Literals**: integer constants like `0` and `10`

The trickiest of these is the distinction between keywords and identifiers. Both are alphanumeric sequences. The lexer must scan `while`, produce `TOK_WHILE`. It must scan `count`, produce `TOK_IDENTIFIER`. How it does that—and how fast—is what most of this chapter is about.

---

## 6.3 Designing the Token Set

Before writing any scanning logic, we need to enumerate every token type the language requires. This is the token specification.

```c
typedef enum {
    // keywords
    TOK_FN,
    TOK_IF,
    TOK_ELSE,
    TOK_WHILE,
    TOK_FOR,
    TOK_RETURN,
    TOK_BREAK,
    TOK_CONTINUE,
    TOK_CONST,

    // types
    TOK_I32,
    TOK_I64,
    TOK_BOOL,
    TOK_F32,
    TOK_F64,
    TOK_STRING,
    TOK_CHAR,

    // operators
    TOK_PLUSPLUS,
    TOK_MINUSMINUS,
    TOK_PLUS_EQ,
    TOK_MINUS_EQ,
    TOK_STAR_EQ,
    TOK_SLASH_EQ,
    TOK_PERCENT_EQ,
    TOK_EQ_EQ,
    TOK_BANG_EQ,
    TOK_LT_EQ,
    TOK_GT_EQ,
    TOK_AND_AND,
    TOK_OR_OR,
    TOK_ARROW,
    TOK_ASSIGN,
    TOK_PLUS,
    TOK_MINUS,
    TOK_STAR,
    TOK_SLASH,
    TOK_PERCENT,
    TOK_BANG,
    TOK_AMP,
    TOK_LT,
    TOK_GT,

    // punctuation
    TOK_DOT,
    TOK_LPAREN,
    TOK_RPAREN,
    TOK_LBRACE,
    TOK_RBRACE,
    TOK_LBRACKET,
    TOK_RBRACKET,
    TOK_COMMA,
    TOK_SEMICOLON,
    TOK_COLON,
    TOK_PIPE,

    // literals
    TOK_FLOAT_LIT,
    TOK_INT_LIT,
    TOK_STRING_LIT,
    TOK_CHAR_LIT,     // 'a'
    TOK_TRUE,
    TOK_FALSE,

    // other
    TOK_IDENTIFIER,
    TOK_COMMENT,
    TOK_EOF,
    TOK_UNKNOWN
} TokenType;
```

The spec is exhaustive and intentional. Every ambiguity the lexer will encounter—is `-` a minus or the start of `->`?—is resolved by having both tokens in the enum and establishing a clear rule for choosing between them. We'll cover that rule (Maximal Munch) in Section 6.9.

---

## 6.4 What Information Does a Token Need?

A `TokenType` alone is not enough. The parser needs to know what text the token came from. The error reporter needs to know what line and column to point at. And for identifiers, later phases need a fast way to ask "is this the same name I saw before?"

A naive approach stores a copied string per token:

```c
// Don't do this.
typedef struct {
    TokenType type;
    char*     text;   // heap-allocated copy
    int       line;
    int       col;
} Token;
```

This copies every token's text onto the heap. For a file with 50,000 tokens, that's 50,000 small allocations—each with its own header, each scattered across memory, each requiring an individual `free`. This is exactly the kind of approach that makes compilers slow.

Instead, we attach three distinct pieces of information to each token, each serving a different consumer.

### 6.4.1 The Slice: Zero-Copy Source Reference

A `Slice` is a non-owning view directly into the original source buffer. The lexer reads the source into a single contiguous buffer at startup. Every token's text is already in that buffer—we just need to record where it starts and how long it is.

```c
typedef struct {
    const char* ptr;  // Points into the source buffer (not heap-allocated)
    uint32_t    len;  // Length in bytes
} Slice;
```

When the lexer scans the word `fibonacci`, it doesn't copy those 9 bytes anywhere. It creates a `Slice` with `ptr` pointing at the `f` in the source buffer and `len` set to `9`. Zero allocations. The original text is always recoverable.

### 6.4.2 The Span: Diagnostic Location

The `Span` records the human-readable position of a token. This is used by the diagnostic engine when reporting errors—nothing else.

```c
typedef struct {
    size_t start_line;
    size_t start_col;
    size_t end_line;
    size_t end_col;
} Span;
```

When the type checker reports "type mismatch on line 7, column 12", the `Span` is where that information lives. It is never involved in identity or comparison logic.

### 6.4.3 The Token Structure So Far

Combining `TokenType`, `Slice`, and `Span` gives us a token that knows what it is, what text it refers to, and where it lives in the source:

```c
typedef struct {
    TokenType type;   // What kind of token is this?
    Slice     slice;  // What text does it span in the source buffer?
    Span      span;   // What line and column is it at?
} Token;
```

This is sufficient for simple tokens like operators and delimiters. But for identifiers and keywords, there's a fourth problem we haven't solved yet: **identity**.

---

## 6.5 The Identity Problem

Consider this small function:

```rust
fn add(x: i32, y: i32) -> i32 {
    return x + y;
}
```

The lexer produces tokens for `x` three times. Each time, it creates a `Slice` pointing at a different character position in the source buffer. Those three slices have identical bytes—all three read as the string `"x"`—but they are three different `ptr` values.

Now the typechecker encounters the `x` in `return x + y`. It needs to answer: "Is this `x` the same symbol declared in the parameter list?" Using the `Slice` directly, it must call `strcmp`—comparing the bytes at one pointer to the bytes at another. That is O(L) per check, where L is the string length.

And it happens everywhere. The parser does it. The typechecker does it repeatedly for every use of every variable. The optimizer does it. In a large program where `count` appears 500 times, this accumulates into millions of character comparisons.

The root cause: **we are letting the string itself be the identity of a symbol**. A string is a slow thing to compare. We need something faster.

The solution is to establish a symbol's identity once—by assigning it a unique integer—and use that integer everywhere else. This is the job of the **Dense Arena Interner**.

---

## 6.6 The Evolutionary Journey to O(1) Identity

To understand why **Dense Arena Interning** is the right design, we need to trace the evolution from the first obvious approach through its failure modes, arriving at the architecture that finally solves the problem. We will in this case look at a problem in the lexer, determining if a identifier is a keyword or not, but the same pattern of evolution applies to many other problems in compiler design.

### Stage 1: Linear Scanning — O(N × L)

The most direct approach to keyword detection is a linear search through a list of known words:

```c
const char* keywords[] = { "fn", "if", "else", "while", "return", ... };

for (int i = 0; i < num_keywords; i++) {
    if (strcmp(token_string, keywords[i]) == 0) {
        return keyword_tokens[i];
    }
}
```

Two costs compound here. `strcmp` is O(L): to confirm a match, it must visit every character of both strings. And the loop is O(N): in the worst case (no match, or a match at the end), it checks every keyword. Combined cost: **O(N × L)** per token.

With 15 keywords averaging 4 characters, you're doing up to 60 character-level operations to classify a single word. Multiply that by every identifier in every source file, and the cost balloons quickly.

### Stage 2: Hash Maps — O(L), but with Hidden Repetition

The standard fix is to replace the linear search with a hash map. Compute a hash of the incoming string, jump directly to a bucket, do at most one or two comparisons.

```c
TokenType kw_type = hashmap_get(keyword_table, token_string);
```

The cost per lookup drops to **O(L)**—dominated by the hash computation, which must still read every character once. That's a significant improvement.

But there's a subtlety worth examining carefully. Consider what happens to the identifier `count` as it flows through the compiler:

1. **Lexer**: hashes `count` → confirms it's not a keyword, tags as `TOK_IDENTIFIER`.
2. **Typechecker**: hashes `count` again → looks up its type in a hash-based symbol table.
3. **Optimizer**: hashes `count` repeatedly → checks uses during constant folding, dead code elimination, or register allocation.

If `count` appears 200 times in the source, the compiler hashes those 5 characters **hundreds to thousands of times** across all phases. The O(L) cost is not paid once per unique string—it's paid every time any phase encounters any occurrence of it.

The deeper problem is structural. A hash map lookup does not produce a stable, reusable identity. It produces an answer, which is immediately discarded. The next lookup starts from scratch. Every phase pays the full hashing toll independently.

What we actually want is to pay the O(L) cost **exactly once**—the first time we see a string—and then spend O(1) everywhere else, forever. That requires a different kind of infrastructure.

### Stage 3: Dense Arena Interning — O(L) once, O(1) everywhere else

The Dense Arena Interner solves this by doing two things that a plain hash map cannot:

First, it ensures that every unique string has exactly one canonical, permanent copy in memory. If the lexer sees `count` ten times, all ten lookups return the **same pointer**—the address of the one Arena-owned copy.

Second, it assigns every unique string a **Dense ID**: a small integer from a contiguous sequence starting at zero. Once a string has a Dense ID, any data structure that would otherwise be keyed by string can be keyed by integer instead—which means array indexing instead of hashing.

The rest of the compiler—parser, typechecker, optimizer—never hashes again. Identity checks become pointer comparisons. Symbol table lookups become array dereferences. The O(L) toll is paid once, at the lexer's first encounter with each unique string, and retired.

The next section builds the interner from first principles.

---

## 6.7 Building the Dense Arena Interner

The interner is composed of three interdependent components: an Arena Allocator that provides stable memory, an `Entry`/`InternResult` pair that packages each string's canonical identity, and the `DenseArenaInterner` itself that coordinates lookups and assignments. We build them in that order.

### 6.7.1 Component 1: The Arena Allocator

To make pointer comparison meaningful as a proxy for string equality, we need a guarantee: **if two strings are equal, they must live at the same memory address**. With `malloc`, the heap can place equal strings anywhere—there is no structural relationship between content and address.

We need memory that, once written, **never moves**. An Arena Allocator provides exactly this.

An Arena manages memory as a chain of large contiguous blocks. Allocation is a pointer bump: advance an offset within the current block by the requested size. When a block fills up, chain a new one. No searching, no splitting, no coalescing.

```c
typedef struct ArenaBlock {
    struct ArenaBlock* next;  // Next block in the chain
    size_t capacity;          // Total bytes in this block
    size_t used;              // Bytes currently in use
    uint8_t data[];           // The memory itself (flexible array member)
} ArenaBlock;

typedef struct {
    ArenaBlock* blocks;   // Head of the chain
    size_t block_size;    // Default size when allocating new blocks
} Arena;
```

The allocation function aligns the offset, checks whether the current block can satisfy the request, and if not, prepends a new block:

```c
void* arena_alloc(Arena* arena, size_t size) {
    if (!arena || size == 0) return NULL;

    const size_t align = alignof(max_align_t);
    ArenaBlock*  block = arena->blocks;

    size_t offset = align_up(block->used, align);

    if (offset + size > block->capacity) {
        size_t new_cap = arena->block_size;
        while (new_cap < size) new_cap *= 2;

        ArenaBlock* new_block = malloc(sizeof(ArenaBlock) + new_cap);
        if (!new_block) return NULL;

        new_block->next     = arena->blocks;
        new_block->capacity = new_cap;
        new_block->used     = 0;
        arena->blocks       = new_block;

        block  = new_block;
        offset = 0;
    }

    void* ptr   = (void*)(block->data + offset);
    block->used = offset + align_up(size, align);
    return ptr;
}
```

Two properties follow directly from this design:

**O(1) allocation.** There is no free list to search, no fragmentation to manage. One addition, one comparison, one pointer return.

**Pointer stability.** This is the property that everything else depends on. Once data is written into an Arena block, that block is never reallocated, compacted, or moved. A pointer into an Arena is valid for as long as the Arena exists. Unlike `malloc`, which reserves the right to move memory during defragmentation or when the heap grows, the Arena makes an unconditional promise: what is written at address `p` stays at `p`.

This stability is what allows pointer equality to substitute for string equality. Two calls to `intern` that produce the same `ptr` value must, by construction, refer to the same string—because the interner places each unique string in the Arena exactly once.

> **Lifetime strategies.** An Arena does not support freeing individual allocations—you advance the bump pointer forward and never backward. This might sound restrictive, but it maps naturally onto the compiler's actual access pattern: strings are interned at startup or during lexing, and remain valid until compilation is complete. At that point, the entire Arena is freed in a single `free` per block, which is far cheaper than thousands of individual `free` calls.
>
> For longer-lived processes like a Language Server Protocol daemon—where files are edited, re-lexed, and re-typechecked continuously—the same Arena abstraction applies, but lifetime management requires more care. A common approach is to maintain separate Arenas with different scopes: a long-lived Arena for identifiers that persist across sessions, and a short-lived scratch Arena that is reset between requests. Scratch Arenas are particularly efficient because resetting them requires only zeroing a `used` counter rather than issuing any `free` calls at all. The key is that Arenas give you *explicit* lifetime control, which is a feature rather than a limitation—you decide exactly when memory is reclaimed, rather than relying on a garbage collector or tracking individual allocations.

### 6.7.2 Component 2: The Entry and InternResult

When a string is interned for the first time, two records are created and stored permanently in the Arena.

An `Entry` holds the string's Dense ID and any caller-supplied metadata. For keywords, the metadata will be the corresponding `TokenType`:

```c
typedef struct {
    void* meta;        // Caller-supplied metadata (e.g., TokenType for keywords)
    int   dense_index; // The Dense ID: 0, 1, 2, ... assigned in encounter order
} Entry;
```

An `InternResult` is the public handle returned to every caller. It packages the canonical Arena-owned `Slice` (the permanent copy of the string's bytes) with the `Entry`:

```c
typedef struct {
    void*  key;    // Arena-owned Slice* — stable pointer to canonical bytes
    Entry* entry;  // Arena-owned Entry — Dense ID and metadata
} InternResult;
```

The `key` pointer is what makes equality comparisons work. Because there is exactly one `InternResult` per unique string, and because its address never changes, two `InternResult*` values can be compared with `==` to test whether they refer to the same string. No `strcmp`. No hashing. One instruction.

### 6.7.3 Component 3: The DenseArenaInterner

The interner wraps an Arena, a hash map, and a counter:

```c
typedef struct {
    Arena*    arena;             // All canonical data lives here
    HashMap*  hashmap;           // Maps raw Slices → InternResult*
    DynArray* dense_array;       // InternResult* indexed by Dense ID
    int       dense_index_count; // Monotonically increasing: 0, 1, 2...

    void*  (*copy_func) (Arena*, const void*, size_t);
    size_t (*hash_func) (void*);
    int    (*cmp_func)  (void*, void*);
} DenseArenaInterner;
```

The `dense_array` is the interner's second index. `hashmap` lets you go from a string to its `InternResult*` in O(L). `dense_array` lets you go from a Dense ID back to its `InternResult*` in O(1): `dense_array[id]` is a direct array dereference. The interner is **bidirectional**: string → ID and ID → string are both constant-time after the first encounter.

### 6.7.4 The Interning Operation

Here is how `intern` works, step by step:

```c
InternResult* intern(DenseArenaInterner* interner, Slice* slice, void* meta) {

    // ── Fast path: already seen this string ─────────────────────────────
    InternResult* found = hashmap_get(
        interner->hashmap, slice,
        interner->hash_func, interner->cmp_func
    );
    if (found) return found;  // O(L) hash + O(1) lookup. Done.

    // ── Slow path: first time we've seen this string ─────────────────────

    // Step 1. Copy the bytes into the Arena permanently.
    //         The incoming slice points into a temporary buffer (e.g. the
    //         source file). The Arena copy will outlive it.
    void* canonical_data = interner->copy_func(
        interner->arena, slice->ptr, slice->len
    );

    // Step 2. Build an Arena-owned Slice pointing to those permanent bytes.
    Slice* key_slice = arena_alloc(interner->arena, sizeof(Slice));
    key_slice->ptr   = canonical_data;
    key_slice->len   = slice->len;

    // Step 3. Assign the next Dense ID and build the Entry.
    Entry* ent       = arena_alloc(interner->arena, sizeof(Entry));
    ent->meta        = meta;
    ent->dense_index = interner->dense_index_count;

    // Step 4. Build the InternResult.
    InternResult* res = arena_alloc(interner->arena, sizeof(InternResult));
    res->key          = key_slice;
    res->entry        = ent;

    // Step 5. Register in the hash map using the Arena-owned key_slice,
    //         so future lookups hit the fast path immediately.
    hashmap_put(
        interner->hashmap, key_slice, res,
        interner->hash_func, interner->cmp_func
    );

    // Step 6. Append to the dense array for O(1) ID → InternResult lookup.
    dynarray_push(interner->dense_array, res);
    interner->dense_index_count++;

    return res;
}
```

Follow a string through this function. `slice` arrives as a temporary view into the source buffer. Step 1 copies its bytes into the Arena, making them permanent. Step 2 builds a stable `Slice` anchored to that permanent copy. Step 3 assigns the next integer—if 47 strings have been interned before this one, it gets Dense ID `47`. Steps 5 and 6 register the result so the next call for this string returns immediately via the fast path.

Call `intern("count")` 500 times. The first call runs all six steps. The other 499 return the same `InternResult*` after one hash and one dereference—no Arena allocation, no ID assignment, no string copy.

### 6.7.5 Non-Allocating Lookup: intern_peek

The lexer needs one additional operation: checking whether a scanned word is a keyword, without allocating anything if it isn't. `intern_peek` is a pure read-only hash map query:

```c
InternResult* intern_peek(DenseArenaInterner* interner, Slice* slice) {
    return hashmap_get(
        interner->hashmap, slice,
        interner->hash_func, interner->cmp_func
    );
    // Returns NULL if not found. Never allocates. Never modifies the interner.
}
```

This is the function the lexer's inner loop calls millions of times. O(L) to hash, O(1) to look up, zero side effects.

### 6.7.6 What "Dense" Actually Buys

The name "Dense Arena Interner" has two parts. The Arena provides stable memory and pointer equality. The Dense part is what transforms the rest of the compiler.

By assigning IDs as a contiguous sequence—0, 1, 2, 3...—every unique symbol maps to an integer in the range `[0, N)`. Any data structure that would otherwise be keyed by string can now be a flat array indexed by integer.

**Flat Array Symbol Tables.** In a naive compiler the symbol table is a hash map: `HashMap<string, Symbol>`. With Dense IDs it becomes a plain array: `Symbol* symbols[N]`. A variable lookup is `symbols[token.entry->dense_index]`—a single memory offset calculation, resolved by the CPU in one instruction.

```c
// Without Dense IDs: hash the string on every lookup
Symbol* resolve_naive(HashMap* table, const char* name) {
    return hashmap_get(table, name, ...);  // O(L) every time
}

// With Dense IDs: direct array access
Symbol* resolve_fast(SymbolTable* table, InternResult* record) {
    return table->symbols[record->entry->dense_index];  // O(1) always
}
```

**Scoping and Shadowing.** When `count` is declared in an outer scope and shadowed in an inner scope, both declarations share the same Dense ID—they are the same name. Scope resolution walks inward-to-outward through per-scope arrays:

```c
Symbol* scope_lookup(Scope* scope, InternResult* record) {
    Scope* current = scope;
    while (current) {
        if (record->entry->dense_index < current->capacity) {
            Symbol* sym = current->symbols[record->entry->dense_index];
            if (sym) return sym;  // Most local binding wins
        }
        current = current->parent;
    }
    return NULL;
}
```

The walk is O(h) where h is nesting depth—typically 3–5 in real code.

**Pointer Equality as Identity.** Because every unique string has exactly one canonical `InternResult*`, identity comparison is a single CPU instruction:

```c
// Are these two tokens the same symbol?
if (tok_a.record == tok_b.record) { ... }  // No strcmp. No hash. One instruction.
```

In [compiler-v3](https://github.com/aikoschurmann/compiler-v3), this extends to compound types. Complex types like "function `(i32, i32) -> bool`" are also interned. Once both sides of a type comparison are canonical pointers, equality is `==`—no recursive structural walk:

```c
bool type_eq_shallow(Type* a, Type* b) {
    if (a->kind        != b->kind)        return false;
    if (a->ret         != b->ret)         return false;  // pointer comparison
    if (a->param_count != b->param_count) return false;
    return memcmp(a->params, b->params, a->param_count * sizeof(Type*)) == 0;
}

// After interning:
if (type_a == type_b) { /* definitively the same type — O(1) */ }
```

Each component type is already canonical, so checking whether a new compound type already exists requires only a shallow comparison of its immediate fields rather than a recursive structural walk.

**Cache Locality.** All interned strings live in the Arena, which is a small number of large contiguous blocks. When the optimizer iterates over all symbols in a pass, it is scanning dense memory that the CPU's prefetcher handles well. A scattered heap of `malloc`'d strings is the opposite—each dereference is a potential cache miss.

---

## 6.8 Completing the Token: The Fourth Field

We now have enough context to introduce the fourth field of the `Token` struct:

```c
typedef struct {
    TokenType     type;    // What kind of token? (TOK_FN, TOK_IDENTIFIER, ...)
    Slice         slice;   // Where in the source buffer?
    Span          span;    // Where on screen (for diagnostics)?
    InternResult* record;  // What is its canonical identity? (NULL for non-names)
} Token;
```

`type` answers *what category*. `slice` answers *what text*. `span` answers *what location*. `record` answers *which specific symbol*—a question `type` alone cannot answer. Two `TOK_IDENTIFIER` tokens may have different `record` values (different symbols) or the same one (the same symbol used twice).

For operators, literals, and delimiters, `record` is `NULL`—those tokens do not need canonical identity.

---

## 6.9 Lexer Integration: Bootstrapping Keywords

The lexer maintains two separate interners: a **keyword interner** pre-populated at startup, and an **identifier interner** built incrementally as new names are encountered.

### Startup: Pre-Interning Keywords

Before scanning a single byte of source code, every keyword is registered in the keyword interner. Each keyword's `TokenType` is stored as its metadata:

```c
static const struct {
    const char* word;
    TokenType   type;
} KEYWORDS[] = {
    {"fn",       TOK_FN},
    {"if",       TOK_IF},
    {"else",     TOK_ELSE},
    {"while",    TOK_WHILE},
    {"for",      TOK_FOR},
    {"return",   TOK_RETURN},
    {"break",    TOK_BREAK},
    {"continue", TOK_CONTINUE},
    {"const",    TOK_CONST},
    {"i32",      TOK_I32},
    {"i64",      TOK_I64},
    {"bool",     TOK_BOOL},
    {"f32",      TOK_F32},
    {"f64",      TOK_F64},
    {"str",      TOK_STRING},
    {"char",     TOK_CHAR},
    {"true",     TOK_TRUE},
    {"false",    TOK_FALSE},
    {NULL,       TOK_UNKNOWN}
};

void lexer_init_keywords(Lexer* lexer) {
    for (size_t i = 0; KEYWORDS[i].word; i++) {
        Slice s = { .ptr = KEYWORDS[i].word, .len = strlen(KEYWORDS[i].word) };
        intern(lexer->keyword_interner, &s, (void*)(uintptr_t)KEYWORDS[i].type);
    }
}
```

After `lexer_init_keywords` runs, every keyword has a Dense ID and a stable Arena-owned address. The keyword interner becomes a read-only lookup table for the rest of compilation.

### Runtime: The Identifier Scanning Loop

When the lexer encounters an alphanumeric sequence, it doesn't know whether it's a keyword or an identifier until it has read the whole word. It reads first, then checks:

```c
// In the main lexer loop:
if (is_alpha(c)) {
    const char *start_ptr = lexer->cur - 1;
    const char *p = lexer->cur;
    
    // Read the whole word first
    while (p < lexer->end && (is_alpha(*p) || is_digit(*p))) {
        p++;
    }
    
    // ... advance internal lexer state to p ...
    while (lexer->cur < p) lexer_advance(lexer);
    
    // Then check if it's a keyword or an identifier
    rec = lexer_lex_identifier(lexer, start_ptr, p, &token_type);
}

// ...

static void *lexer_lex_identifier(Lexer *lexer, const char *start_ptr, const char *end_ptr, TokenType *out_type) {
    // Temporary slice pointing directly into the source buffer.
    // No allocation — used for lookup only.
    Slice slice = lexer_make_slice_from_ptrs(start_ptr, end_ptr);

    // ── Step 1: Is this a keyword? ───────────────────────────────────────
    // intern_peek performs a read-only hash map lookup. No allocation occurs
    // regardless of whether the word is found.
    InternResult *kwres = intern_peek(lexer->keywords, &slice);
    if (kwres) {
        // It's a keyword. The TokenType is stored in the entry's metadata.
        *out_type = (TokenType)(uintptr_t)kwres->entry->meta;
        return kwres;
    }

    // ── Step 2: It's an identifier. ──────────────────────────────────────
    // intern returns an existing record if this name has appeared before,
    // or copies the bytes into the Arena and assigns a new Dense ID if not.
    InternResult *idres = intern(lexer->identifiers, &slice, NULL);
    if (!idres) {
        *out_type = TOK_UNKNOWN;
        return NULL;
    }
    
    *out_type = TOK_IDENTIFIER;
    return idres;
}
```

The `slice` used for both lookups is a temporary, stack-allocated view into the source buffer. No bytes are copied unless we reach step 2's slow path—meaning we've found a genuinely new identifier that needs a permanent Arena record.

The performance gain from all this infrastructure does not materialize primarily in the lexer itself. The lexer pays O(L) for each unique string once, which is roughly the same cost as a plain hash map lookup. The gain accumulates downstream: every subsequent phase—parser, typechecker, optimizer—operates entirely with integers and pointers, paying zero per-character cost for any symbol operation.

---

## 6.10 Resolving Ambiguity: Maximal Munch

With identity resolved, one final rule handles compound operators. When the lexer sees `-` followed by `>`, there are two valid tokenizations:

- Emit `TOK_MINUS`, then let the next call emit `TOK_GT`
- Emit a single `TOK_ARROW`

**Maximal Munch** resolves this: always consume the longest possible valid token. If the current character begins a valid multi-character sequence, extend the match as far as valid characters continue.

```c
char next = lexer_peek(lexer);
switch (c) {
    case '-':
        if (next == '-') { lexer_advance(lexer); token_type = TOK_MINUSMINUS; }
        else if (next == '=') { lexer_advance(lexer); token_type = TOK_MINUS_EQ; }
        else if (next == '>') { lexer_advance(lexer); token_type = TOK_ARROW; }
        else token_type = TOK_MINUS;
        break;

    case '+':
        if (next == '+') { lexer_advance(lexer); token_type = TOK_PLUSPLUS; }
        else if (next == '=') { lexer_advance(lexer); token_type = TOK_PLUS_EQ; }
        else token_type = TOK_PLUS;
        break;

    case '<':
        if (next == '=') { lexer_advance(lexer); token_type = TOK_LT_EQ; }
        else token_type = TOK_LT;
        break;
    
    // ...
}
```

Maximal Munch is universal in lexer design—it's how C-family, Rust-family, and Zig-family lexers all handle compound operators. It's also why `count++` tokenizes as `TOK_IDENTIFIER`, `TOK_PLUS_PLUS` rather than `TOK_IDENTIFIER`, `TOK_PLUS`, `TOK_PLUS`.

---

## 6.11 The Performance Story in Full

Putting the whole picture together, here is what happens to a symbol like `count` at each stage:

| Event | Operation | Cost |
|---|---|---|
| Lexer: first encounter | Hash + Arena copy + Dense ID assignment | O(L) |
| Lexer: every subsequent occurrence | Hash + hash map hit, return existing pointer | O(L) hash, O(1) result |
| Parser: symbol check | Pointer comparison | O(1) |
| Typechecker: symbol lookup | Array index: `symbols[id]` | O(1) |
| Typechecker: type equality | Pointer comparison | O(1) |
| Optimizer: any pass | Integer comparison or array index | O(1) |

The O(L) toll is paid once per unique string, amortized across all occurrences. Comparing this against the two inferior approaches:

| Phase | Linear scan — O(N × L) | Hash map — O(L) | Dense Interning |
|---|---|---|---|
| Lexer | O(N × L) per token | O(L) per token | O(L) once per unique string |
| Parser | O(N × L) per check | O(L) per check | O(1) |
| Typechecker | O(N × L) per check | O(L) per check | O(1) |
| Symbol table lookup | O(N × L) | O(L) | O(1) array index |
| Type equality | O(depth) recursive walk | O(depth) recursive walk | O(1) pointer compare |

The hash map is clearly better than linear scan, but it still pays O(L) in every phase for every occurrence. Dense interning eliminates the per-phase, per-occurrence cost entirely: each phase spends O(1) per symbol operation, regardless of how long the symbol's name is or how many times it appears.

---

## 6.12 Chapter Summary

We started with a question: what does the lexer need to produce, and how should it represent what it produces? The answer required more than a token type and a string.

**The Lexer's Role.** The lexer transforms a character stream into a token stream. The token is the unit of currency for everything downstream. Getting the token representation right determines the performance characteristics of the entire compiler.

**Zero-Copy Provenance.** `Slice` references source text without allocation. `Span` records screen location for diagnostics. Neither involves copying.

**The Identity Problem.** Using strings for symbol identity means O(L) comparisons in every phase, for every occurrence. The answer is to replace strings with integers—specifically, dense contiguous integers starting from zero.

**The Arena Foundation.** The Arena Allocator provides O(1) bump allocation and, critically, unconditional pointer stability. Once a string is written to an Arena block, its address never changes. This is what makes pointer equality a valid proxy for string equality.

**The Interner's Contract.** `intern` pays O(L) exactly once per unique string—on first encounter—to hash, copy into the Arena, assign a Dense ID, and register in the hash map. Every subsequent call for that string hits the fast path: one hash, one lookup, one pointer return. `intern_peek` queries without allocating or modifying state, used for keyword detection.

**Dense IDs as the Payoff.** Contiguous IDs turn symbol tables into flat arrays. Pointer equality replaces `strcmp`. Cache locality improves because all interned strings live in a small number of large Arena blocks.

**Pre-Interned Keywords.** By populating the keyword interner before scanning begins, keyword detection becomes a read-only hash map lookup with no allocation on miss and a pointer return on hit.

**Maximal Munch.** Compound operators are resolved by always consuming the longest valid token sequence.

With the token representation fully specified and the identity infrastructure in place, we are ready to implement the full scanning loop in Chapter 7—including nested comment handling, escape sequences in string literals, and the edge cases of integer and float literal parsing.

---

## 6.13 Exercises

**6.13.1 Token Classification.** For each of the following source snippets, list the token stream the lexer should produce (token type and lexeme):

1. `count += 1;`
2. `fn apply(f: fn(i32) -> bool) -> bool`
3. `x <= y && y != z`

**6.13.2 Maximal Munch Edge Cases.** What tokens does the lexer emit for `-->` given Maximal Munch? What about `<<=`? Justify each answer with the rule.

**6.13.3 The Arena Invariant.** Explain in your own words why an Arena Allocator is necessary for the pointer-equality property to hold. What would break if we used `malloc` for each interned string? Under what conditions would `malloc` accidentally produce correct results?

**6.13.4 Dense ID Tracing.** Given a source file that mentions identifiers in this order: `main`, `count`, `fibonacci`, `count`, `n`, `fibonacci`, `main`. Trace the state of the identifier interner after each call to `intern` or `intern_peek`. How many Arena allocations occur? What is the Dense ID of each unique name?

**6.13.5 Two Interners.** The lexer uses separate interners for keywords and identifiers. What would happen if they shared a single interner? What Dense IDs would keywords receive? Would this cause any correctness problem, or only a structural one?

**6.13.6 Scope Lookup.** Given this program:

```rust
let x: i32 = 1;
fn foo() {
    let x: i32 = 2;
    fn bar() {
        let y: i32 = x + 1;
    }
}
```

Trace `scope_lookup` for the `x` in `y = x + 1`. How many scope levels are visited? Which binding is returned?

**6.13.7 Hash Map vs. Dense Interning.** A colleague argues: "The hash map approach is already O(L) per lookup—why go further?" Write a concrete argument, with example code or a cost table, showing that O(L) in every phase is still materially worse than O(L) once for a program with 300 unique identifiers averaging 6 characters, each appearing 50 times, flowing through a 4-phase pipeline.

**6.13.8 Scratch Arenas.** You are adapting the compiler into an LSP daemon that re-lexes changed files on every keystroke. Propose a two-Arena design—one for long-lived interned identifiers and one for per-request scratch data. What is the cost of resetting the scratch Arena between requests? What must you be careful about when a file is modified and previously interned identifiers may no longer be valid?