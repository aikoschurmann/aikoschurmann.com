---
layout: blog
title: "Token Specification and Priority Design"
date: "2026-04-02"
author: "Aiko Schurmann"
description: "Design token sets, precedence rules, and keyword-versus-identifier policies for reliable scanner behavior."
tags:
  - "COMPILERS"
  - "Core"
chapterTitle: "Token Specification and Priority Design"
showInCourse: false

---

## Learning Objectives

By the end of this chapter, you should be able to:

- Design a precise and exhaustive set of tokens for a simple C-like programming language
- Implement `Span` and `StringView` data structures in C to track token position without unnecessary string allocations
- Define a `Token` structure that efficiently stores lexical information
- Resolve ambiguities using maximal munch and rule priority
- Explain why we store slices of the source code rather than copying string data

## A Simple Language Example

Before we build our lexer, we need a concrete target. We will design a small, C-like language that contains just enough features to be interesting but remains simple enough to parse easily. Let's call it **MiniC**.

Here is what a simple program in MiniC looks like:

```c
i32 fibonacci(i32 n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

void main() {
    i32 count = 0;
    while (count < 10) {
        print(fibonacci(count));
        count = count + 1;
    }
}
```

To tokenize this language, we must define every possible valid piece of syntax. We can group our tokens into a few broad categories:

1. **Keywords**: `i32`, `void`, `if`, `else`, `while`, `return`, `print`
2. **Identifiers**: User-defined names like `fibonacci`, `n`, or `count`
3. **Literals**: Integer numbers like `0`, `1`, `2`, or `10`
4. **Operators**: `+`, `-`, `*`, `/`, `=`, `<`, `>`, `<=`, `>=`
5. **Punctuation**: `(`, `)`, `{`, `}`, `,`, `;`
6. **Whitespace/Comments**: Spaces, tabs, newlines, and `//` comments (which the lexer will discard)

Our goal is to write a lexer that takes the raw source string and produces a linear sequence of these tokens.

## The Anatomy of a Token

A token is the fundamental unit of data passed from the lexer to the parser. But what exactly should a token contain?

A naive approach in C might simply allocate a new string for the value and pair it with a type tag:

```c
typedef enum {
    TOKEN_IDENTIFIER,
    TOKEN_KEYWORD,
    TOKEN_NUMBER,
    TOKEN_OPERATOR
} TokenType;

typedef struct {
    TokenType type;
    char* value; // Requires malloc!
} Token;
```

While this works, it is highly inefficient and lacks crucial context. If the parser encounters a syntax error later on, it needs to tell the user *where* the error occurred. The naive token object has forgotten its original location in the source code. Moreover, allocating a new string with `malloc` for every single identifier and number generates significant memory overhead.

### The Span and StringView

Instead of copying strings, modern compilers use **spans** and **string views** (or slices) to reference the original source code. 

A **span** simply records the start and end offsets of a token within the source buffer. We'll use fixed-width integers like `u32` for compactness.

```c
#include <stdint.h>

typedef uint32_t u32;

typedef struct {
    u32 start;
    u32 end;
} Span;
```

A **string view** couples a pointer to the source text with a length. It represents a "view" into the original code without taking ownership or null-terminating it.

Why is this better?

1. **Zero-Copy**: We never allocate new strings for every token. The entire source code is loaded into memory once, and tokens merely hold mathematical boundaries (the span) indicating where they live in that source.
2. **O(1) Construction**: Creating a span is just recording two integers. It is incredibly fast.
3. **Error Reporting**: When an error occurs, the span allows us to instantly map back to the exact line and column in the original file, producing rich error messages like `Error at line 10, column 5`.

### The Token Structure

With our `Span` defined, we can construct a robust `Token` type.

```c
typedef enum {
    TOKEN_I32,
    TOKEN_VOID,
    TOKEN_IF,
    TOKEN_ELSE,
    TOKEN_WHILE,
    TOKEN_RETURN,
    TOKEN_PRINT,
    TOKEN_IDENTIFIER,
    TOKEN_NUMBER,
    TOKEN_PLUS,
    TOKEN_MINUS,
    TOKEN_STAR,
    TOKEN_SLASH,
    TOKEN_ASSIGN,
    TOKEN_LESS,
    TOKEN_GREATER,
    TOKEN_LESS_EQUAL,
    TOKEN_GREATER_EQUAL,
    TOKEN_LEFT_PAREN,
    TOKEN_RIGHT_PAREN,
    TOKEN_LEFT_BRACE,
    TOKEN_RIGHT_BRACE,
    TOKEN_COMMA,
    TOKEN_SEMICOLON,
    TOKEN_EOF
} TokenType;

typedef struct {
    TokenType type;
    Span span;
} Token;
```

Notice that the token no longer contains the actual string value. If the parser needs to know the name of an identifier or the value of a number, it can look it up using the `span` against the original source string to create a string view on demand:

```c
typedef struct {
    const char* data;
    u32 length;
} StringView;

StringView get_token_text(const char* source, Token token) {
    StringView view;
    view.data = source + token.span.start;
    view.length = token.span.end - token.span.start;
    return view;
}
```

## Resolving Ambiguities

When scanning source code, the lexer will inevitably encounter situations where multiple token rules could apply. For example, consider the input `i32_count`.

Is this:
1. The keyword `i32` followed by the identifier `_count`?
2. A single identifier named `i32_count`?

Or consider the input `<=`:
1. The less-than operator `<` followed by the assignment operator `=`?
2. The less-than-or-equal-to operator `<=`?

To resolve these ambiguities, lexical analyzers rely on two universal rules: **Maximal Munch** and **Rule Priority**.

### Maximal Munch

The **Maximal Munch** (or longest match) rule states that the lexer must always consume as many characters as possible to form a valid token.

When the lexer sees `<=`, both `<` and `<=` are valid prefixes. Because `<=` is longer (2 characters vs 1 character), the lexer munches the longer sequence and emits a single `TOKEN_LESS_EQUAL` token.

When the lexer sees `i32_count`, it keeps reading characters until it hits whitespace or punctuation. It reads the entire string `i32_count`, which forms a valid identifier. It does not stop at `i32`.

### Rule Priority (Keywords vs. Identifiers)

Maximal munch solves many problems, but it introduces another. Suppose the input is simply `i32`.

The lexer reads `i32`. This string perfectly matches two rules:
1. The exact keyword `i32`
2. The general pattern for an identifier: `[a-zA-Z_][a-zA-Z0-9_]*`

Maximal munch doesn't help here because both matches are exactly 3 characters long.

To resolve this, lexers use **Rule Priority**. When multiple rules match the exact same string length, the rule defined *first* (or given explicit higher priority) wins.

In practice, this means we check for keywords *before* falling back to identifiers. The standard implementation pattern looks like this:

1. Scan an alphanumeric sequence using the identifier rule.
2. Once the string is extracted, check if it exactly matches a pre-defined set of keywords.
3. If it is found, emit the corresponding keyword token.
4. If it is not found, emit an identifier token.

```c
#include <string.h>
#include <stdbool.h>

bool string_view_equals(StringView a, const char* b) {
    u32 b_len = strlen(b);
    if (a.length != b_len) return false;
    return strncmp(a.data, b, a.length) == 0;
}

TokenType determine_keyword_or_identifier(StringView text) {
    if (string_view_equals(text, "i32")) return TOKEN_I32;
    if (string_view_equals(text, "void")) return TOKEN_VOID;
    if (string_view_equals(text, "if")) return TOKEN_IF;
    if (string_view_equals(text, "else")) return TOKEN_ELSE;
    if (string_view_equals(text, "while")) return TOKEN_WHILE;
    if (string_view_equals(text, "return")) return TOKEN_RETURN;
    if (string_view_equals(text, "print")) return TOKEN_PRINT;
    
    return TOKEN_IDENTIFIER;
}
```

This approach is highly efficient and perfectly resolves the keyword/identifier overlap.

## Chapter Summary

In this chapter, we defined the blueprint for our lexical analyzer. We established:
- A concrete target language (MiniC) with a specific set of required tokens including functions and types.
- A zero-copy `Token` architecture relying on `Span` and `StringView` semantics in C to reference the original source, minimizing allocations and enabling precise error reporting.
- The **Maximal Munch** principle for resolving length ambiguities.
- **Rule Priority** and string comparisons for distinguishing keywords from generic identifiers.

With these structural decisions made, we are ready to write the actual scanning loop. In Chapter 7, we will implement the lexer in C and explore how to gracefully handle lexical errors.