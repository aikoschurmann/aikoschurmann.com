---
layout: blog
title: "Lexer Implementation and Stateful Scanning"
date: "2026-04-02"
author: "Aiko Schurmann"
description: "Implement scanner loops, lexical modes, source-position tracking, and robust token emission mechanics."
tags:
  - "COMPILERS"
chapterTitle: "Lexer Implementation and Stateful Scanning"
showInCourse: false
---

# Lexer Implementation and Stateful Scanning

Lexing is the first phase of a compiler, responsible for converting a stream of characters into a stream of tokens. While regular expressions and DFAs provide the theoretical foundation, a production-grade lexer requires careful implementation of scanner loops, state management, and error handling.

## The Scanner Loop

At the heart of every lexer is a loop that consumes characters and matches them against token patterns. 

```zig
while (self.pos < self.source.len) {
    const start = self.pos;
    const char = self.advance();
    
    switch (char) {
        ' ', '\t', '\n', '\r' => continue,
        '(' => return self.emit(.l_paren, start),
        ')' => return self.emit(.r_paren, start),
        // ... more cases
        else => {
            if (isDigit(char)) return self.readNumber(start);
            if (isAlpha(char)) return self.readIdentifier(start);
            return self.error("Unexpected character", start);
        }
    }
}
```

## Stateful Scanning and Lexical Modes

Sometimes, the way tokens are scanned depends on the current context. For example, in many languages, string interpolation or template literals require the lexer to switch modes.

### Lexical Modes

Lexical modes allow the scanner to change its behavior based on its internal state. This is often implemented using a state stack.

1. **Default Mode**: Standard language tokens.
2. **String Mode**: Scanning characters within a string literal.
3. **Interpolation Mode**: Temporarily switching back to default mode inside a string.

## Source Position Tracking

For meaningful error messages, the lexer must track the line and column number of every token.

- **Offset**: Byte position from the start of the file.
- **Line**: 1-based line number.
- **Column**: 1-based character position within the current line.

## Robust Token Emission

A token should encapsulate more than just its type; it should also contain its lexeme and its position in the source.

```typescript
export interface Token {
  type: TokenType;
  lexeme: string;
  line: number;
  col: number;
  offset: number;
}
```

By maintaining a clean separation between the scanner state and the token stream, you ensure that the parser can focus on grammar rather than character-level details.
