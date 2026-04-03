---
layout: blog
title: "Regular Languages and Regular Expressions"
date: "2026-04-02"
author: "Aiko Schurmann"
description: "A rigorous introduction to alphabets, strings, languages, and regular expressions—the mathematical foundation of lexical analysis."
tags:
  - "AUTOMATA"
  - "Optional"
chapterTitle: "Regular Languages and Regular Expressions"
---

> **Note to readers:** Chapters 2–4 cover the theoretical foundation behind lexer generators like lex/flex. You can skip ahead and return to this section later for deeper understanding.

## 2.1 Learning Objectives

By the end of this chapter, you should be able to:

- Define alphabets, strings, and languages using precise mathematical notation
- Apply the three fundamental regular operations: union ($\cup$), concatenation ($\cdot$), and Kleene star ($^*$)
- Read and write regular expressions for practical token patterns
- Prove that specific languages are not regular using the Pumping Lemma
- Apply closure properties to compose and reason about regular languages
- Articulate why regular languages are the natural model for lexical analysis


## 2.2 Motivation: Why Study Regular Languages?

### 2.2.1 The Lexical Analysis Problem

Recall from Section 1.1 that the lexer is the first phase of compilation. It receives raw source code as a stream of characters and must identify token boundaries. Given the input:

```c
int count = 42;
```

the lexer must recognize:

- `int` as a keyword token
- `count` as an identifier token
- `=` as an assignment operator token
- `42` as an integer literal token
- `;` as a delimiter token

Each of these token categories is defined by a **pattern**. For example:

- *Identifiers*: start with a letter or underscore, followed by any number of letters, digits, or underscores
- *Integer literals*: one or more decimal digits
- *Whitespace*: one or more spaces, tabs, or newlines

These patterns share a property that matters deeply: they can be recognized by scanning the input once, left to right, using only a **fixed amount of memory**. You never need to count arbitrarily high numbers or remember arbitrarily long prefixes.

**Regular languages** are precisely the class of patterns that share this property. Studying them gives us:

1. **A theoretical foundation** — a precise mathematical framework for defining token patterns
2. **Practical tools** — regular expressions for specification and finite automata for implementation
3. **Efficiency guarantees** — linear-time recognition with predictable performance
4. **Clear limits** — a rigorous account of what lexers can and cannot do

### 2.2.2 The Two-Level Architecture

Modern compilers maintain a clean separation between two phases. The following table summarizes this division:

| Phase | Input | Model | Handles |
|-------|-------|-------|---------|
| Lexer | Characters | Regular languages | Token boundaries, pattern matching |
| Parser | Tokens | Context-free grammars | Nested structure, abstract syntax trees |

This separation isn't arbitrary—it reflects a deep mathematical distinction between two classes of languages. Regular languages handle flat, bounded patterns. Context-free languages handle recursive, nested structures. Understanding regular languages precisely tells us exactly where to draw this line.

This theoretical boundary sets the stage for the formal mathematical definitions that follow.


## 2.3 Fundamental Definitions

To build a robust lexer, we first need a formal way to describe the characters it reads and the words it forms. This section defines the foundational mathematical objects—alphabets, strings, and languages—that allow us to specify token patterns unambiguously. Every concept in this section will be used throughout the rest of the course.

### 2.3.1 Alphabets

**Definition (Alphabet)**: An **alphabet** is a finite, nonempty set of symbols. We typically denote alphabets with the Greek letter $\Sigma$.

Examples:
- Binary: $\Sigma = \{0, 1\}$
- Lowercase Latin: $\Sigma = \{a, b, c, \ldots, z\}$
- ASCII: $\Sigma = \{\text{all 128 ASCII characters}\}$

### 2.3.2 Strings

**Definition (String)**: A **string** over alphabet $\Sigma$ is a finite sequence of symbols from $\Sigma$.

We write strings by juxtaposing their symbols: `abc`, `01101`, `count`.

**Notation**:
- $|w|$ denotes the length of string $w$
- The **empty string** $\epsilon$ satisfies $|\epsilon| = 0$
- $\Sigma^*$ denotes all strings over $\Sigma$ (including $\epsilon$)
- $\Sigma^+$ denotes all nonempty strings over $\Sigma$

> **Critical distinction**: $\epsilon$ is the empty string (zero symbols). The empty language $\emptyset$ contains no strings at all. These are completely different objects that are easy to conflate.

**Example**: Over $\Sigma = \{a, b\}$:

$$\Sigma^* = \{\epsilon,\ a,\ b,\ aa,\ ab,\ ba,\ bb,\ aaa,\ \ldots\}$$

This set is infinite, even though $\Sigma$ itself has only two elements.

### 2.3.3 String Operations

Before defining operations on collections of strings, we need operations on individual strings. These operations model how a lexer processes sequences of characters.

**Concatenation**: For strings $x$ and $y$, the concatenation $x \cdot y$ appends $y$ to $x$.

- If $x =$ `abc` and $y =$ `de`, then $x \cdot y =$ `abcde`
- $|x \cdot y| = |x| + |y|$
- $\epsilon \cdot x = x \cdot \epsilon = x$ for all $x$ (identity element)
- $(x \cdot y) \cdot z = x \cdot (y \cdot z)$ (associative), but $x \cdot y \neq y \cdot x$ in general (not commutative)

**Exponentiation**: For string $w$ and integer $n \ge 0$:
- $w^0 = \epsilon$
- $w^{n+1} = w \cdot w^n$

So `a`$^3 =$ `aaa` and `ab`$^2 =$ `abab`.

**Reversal**: For $w = a_1 a_2 \ldots a_n$, the reversal is $w^R = a_n \ldots a_2 a_1$.

So `abc`$^R =$ `cba` and $\epsilon^R = \epsilon$.

### 2.3.4 Languages

A lexer needs to recognize sets of valid tokens, not just single strings. We formalize these sets as languages.

**Definition (Language)**: A **language** over alphabet $\Sigma$ is any subset of $\Sigma^*$.

Since $\Sigma^*$ is infinite, languages can be finite, infinite, or empty. The following table provides examples:

| Language | Description |
|----------|-------------|
| $L_1 = \{a, ab, abb\}$ | Finite language |
| $L_2 = \{a^n \mid n \ge 0\}$ | Infinite language: $\{\epsilon, a, aa, aaa, \ldots\}$ |
| $L_3 = \emptyset$ | Empty language — contains no strings |
| $L_4 = \{\epsilon\}$ | Singleton containing only the empty string |

**Key insight**: A language is just a set of strings. We can apply all standard set operations — $\cup$, $\cap$, complement — to languages directly.

With alphabets, strings, and languages formally defined, we can now explore how to combine these sets to build the complex patterns required for lexical analysis.


## 2.4 Operations on Languages

To describe practical token patterns like identifiers or numbers, we need ways to combine simple languages into more complex ones. The three operations in this section—union, concatenation, and Kleene star—are the fundamental building blocks for all lexical specifications.

### 2.4.1 Union

**Definition (Union)**:
$$L_1 \cup L_2 = \{w \mid w \in L_1 \lor w \in L_2\}$$

**Example**:
- $L_1 = \{a, aa\}$, $\quad L_2 = \{b, bb\}$
- $L_1 \cup L_2 = \{a, aa, b, bb\}$

Union is commutative and associative. The identity is $L \cup \emptyset = L$.

### 2.4.2 Concatenation

**Definition (Concatenation)**:
$$L_1 \cdot L_2 = \{x \cdot y \mid x \in L_1 \land y \in L_2\}$$

**Example**:
- $L_1 = \{a, aa\}$, $\quad L_2 = \{b, bb\}$
- $L_1 \cdot L_2 = \{ab,\ abb,\ aab,\ aabb\}$

Two special cases are worth memorizing:

- $L \cdot \{\epsilon\} = \{\epsilon\} \cdot L = L$ (the language $\{\epsilon\}$, not the empty language, is the identity)
- $L \cdot \emptyset = \emptyset \cdot L = \emptyset$ (concatenating with the empty language destroys everything)

Concatenation is associative but not commutative.

### 2.4.3 Kleene Star

**Definition (Kleene Star)**: The Kleene star is the most powerful and distinctive operation on languages.

$$L^* = \bigcup_{i=0}^{\infty} L^i = L^0 \cup L^1 \cup L^2 \cup \cdots$$

where $L^0 = \{\epsilon\}$, $L^1 = L$, $L^2 = L \cdot L$, and so on.

In plain English: $L^*$ contains every string you can form by concatenating **zero or more** strings from $L$.

**Example — character class**:
- $L = \{a, b\}$
- $L^* = \{\epsilon,\ a,\ b,\ aa,\ ab,\ ba,\ bb,\ aaa,\ \ldots\}$ — all strings over $\{a, b\}$

**Example — single word**:
- $L = \{ab\}$
- $L^* = \{\epsilon,\ ab,\ abab,\ ababab,\ \ldots\} = \{(ab)^n \mid n \ge 0\}$

**Three facts to memorize**:

1. $\epsilon \in L^*$ for **any** language $L$, even if $\epsilon \notin L$
2. If $L = \emptyset$, then $L^* = \{\epsilon\}$ — not $\emptyset$
3. $\Sigma^*$ is exactly $\{\text{all symbols in }\Sigma\}^*$

**Positive closure** $L^+$ is the variant that requires at least one concatenation:

$$L^+ = \bigcup_{i=1}^{\infty} L^i \qquad \text{so that} \qquad L^* = L^+ \cup \{\epsilon\}$$

### 2.4.4 Worked Examples

Combining the three operations takes practice. Here are four examples that build intuition.

**Example A**: $\{a\}^* \cdot \{b\}^*$

The set $\{a\}^* = \{\epsilon, a, aa, \ldots\}$ and $\{b\}^* = \{\epsilon, b, bb, \ldots\}$. Their concatenation is all strings with zero or more $a$'s followed by zero or more $b$'s:

$$\{a\}^* \cdot \{b\}^* = \{a^n b^m \mid n, m \ge 0\}$$

This includes $\epsilon$, $a$, $bb$, $aab$, and $aabbb$ — but **not** $ba$ or $aba$.

**Example B**: $(\{a\} \cup \{b\})^*$

First, $\{a\} \cup \{b\} = \{a, b\}$. Then $\{a,b\}^*$ is all strings over $\{a, b\}$. This includes $ba$ and $aba$ — contrasting with Example A.

**Takeaway**: $\{a\}^* \cdot \{b\}^* \subsetneq (\{a\} \cup \{b\})^*$. The placement of $^*$ matters.

**Example C**: $\{a, aa\} \cdot \{b\}^*$

The second factor $\{b\}^* = \{\epsilon, b, bb, \ldots\}$. Concatenating with $\{a, aa\}$ gives strings starting with one or two $a$'s, followed by zero or more $b$'s.

$$\{a \cdot b^n \mid n \ge 0\} \cup \{aa \cdot b^n \mid n \ge 0\}$$

**Example D**: $\{ab, ba\}^2$

$L^2 = L \cdot L = \{ab, ba\} \cdot \{ab, ba\} = \{abab,\ abba,\ baab,\ baba\}$

These three operations form the mathematical core of regular languages, which we will now define formally.


## 2.5 Regular Languages and Regular Expressions

With our language operations defined, we can now identify the specific class of languages that a lexer can recognize. We call these regular languages, and we use regular expressions as a concise notation to write them down in our compiler's source code.

### 2.5.1 Defining Regular Languages

We can now state the central definition precisely.

**Definition (Regular Language)**: The class of **regular languages** over $\Sigma$ is defined inductively.

*Base cases*:
1. $\emptyset$ is a regular language
2. $\{\epsilon\}$ is a regular language
3. $\{a\}$ is a regular language for each symbol $a \in \Sigma$

*Inductive cases* — if $L_1$ and $L_2$ are regular, then so are:
4. $L_1 \cup L_2$
5. $L_1 \cdot L_2$
6. $L_1^*$

Nothing else is regular.

**Reading the definition**: Start with the smallest possible languages — empty, epsilon, a single character — and build up using exactly three operations. Every regular language can be traced back to this construction. If a language cannot be built this way, it is not regular.

**Example**: The language of strings over $\{a, b\}$ that start with $a$ is regular:

$$\{a\} \cdot \{a,b\}^* = \{a\} \cdot (\{a\} \cup \{b\})^*$$

Each step uses only base cases and the three inductive operations.

**Non-example**: The language $L = \{a^n b^n \mid n \ge 0\}$ is **not** regular. Membership requires matching two unbounded counts — the number of $a$'s and the number of $b$'s — and finite memory cannot enforce that equality for arbitrarily large $n$. We will prove this rigorously in Section 2.7.

### 2.5.2 Regular Expressions: Notation for Regular Languages

Writing out set-theoretic constructions like $\{a\} \cdot (\{a\} \cup \{b\})^*$ is cumbersome. Regular expressions are a compact notation for the same thing.

**Syntax**: Regular expressions over $\Sigma$ are defined inductively.

*Base cases*: `\emptyset`, `\epsilon`, and `a` for each $a \in \Sigma$.

*Inductive cases* — if `r` and `s` are regular expressions, then so are:
- `(r | s)` — alternation (union)
- `(rs)` — concatenation
- `(r*)` — Kleene star

**Semantics**: Each expression `r` denotes a language $L(r)$. The following table defines the formal semantics of regular expressions, mapping each syntactic form to the language it denotes:

| Expression | Language |
|-----------|----------|
| `\emptyset` | $\emptyset$ |
| `\epsilon` | $\{\epsilon\}$ |
| `a` | $\{a\}$ |
| `r | s` | $L(r) \cup L(s)$ |
| `rs` | $L(r) \cdot L(s)$ |
| `r*` | $(L(r))^*$ |

**Operator precedence** (highest to lowest):

1. `*` (Kleene star)
2. Concatenation
3. `|` (alternation)

This lets us omit most parentheses. The following table illustrates how operator precedence resolves ambiguity in regular expressions:

| Regex | Parsed as | Language | In English |
|-------|-----------|----------|------------|
| `ab*c` | `a(b*)c` | $\{ac, abc, abbc, \ldots\}$ | `a`, any number of `b`'s, then `c` |
| `a | b*` | `a | (b*)` | $\{a, \epsilon, b, bb, \ldots\}$ | Either exactly `a`, or any run of `b`'s |
| `(a | b)*` | — | $\{a,b\}^*$ | All strings over $\{a,b\}$ |
| `a*b*` | `(a*)(b*)` | $\{a^n b^m \mid n,m \ge 0\}$ | All `a`'s before all `b`'s |

### 2.5.3 Extended Notation

The pure definition of regular expressions is minimal by design. In practice, we use convenient shorthands. None of these add expressive power — they are all syntactic sugar. The following table lists common extended notations:

| Notation | Meaning | Example |
|----------|---------|---------|
| `r+` | `rr*` — one or more | `a+` = $\{a, aa, aaa, \ldots\}$ |
| `r?` | `(r | \epsilon)` — zero or one | `ab?c` = $\{ac, abc\}$ |
| `[abc]` | `(a | b | c)` — character class | `[aeiou]` = any vowel |
| `[a-z]` | Range shorthand | `[a-z]` = any lowercase letter |
| `[^abc]` | Any character except $a$, $b$, $c$ | `[^\n]` = any non-newline |
| `.` | Any single character | `.+` = any nonempty string |

### 2.5.4 Regular Expressions for Token Patterns

With this notation, we can write precise definitions for the token categories a lexer needs.

**Identifiers** — start with a letter or underscore, continue with letters, digits, or underscores:

```regex
[A-Za-z_][A-Za-z0-9_]*
```

Accepted: `x`, `count`, `_temp`, `value42`  
Rejected: `42value` (starts with digit), `my-var` (contains hyphen)

**Integer literals**:

```regex
[0-9]+
```

Or, if you want to forbid leading zeros: `0 | [1-9][0-9]*`

**Floating-point literals**:

```regex
[0-9]+\.[0-9]* | \.[0-9]+
```

**Whitespace**:

```regex
[ \t\n\r]+
```

**C/C++ single-line comments**:

```regex
//[^\n]*
```

Starts with `//`, followed by zero or more non-newline characters.

**A complete token specification** for a simple language:

```regex
KEYWORD    : if | while | return | int | void
IDENT      : [A-Za-z_][A-Za-z0-9_]*
INT_LIT    : [0-9]+
OPERATOR   : \+ | - | \* | / | == | != | <= | >= | < | > | =
DELIM      : ; | , | \( | \) | \{ | \}
WHITESPACE : [ \t\n\r]+
COMMENT    : //[^\n]*
```

Each of these patterns is regular. A lexer can scan the input once, in a single pass, matching these patterns to produce tokens — and we can prove this is possible in linear time.

**Important**: Regular expressions cannot handle:

- Nested comments like `/* /* inner */ outer */` — requires counting depth (unbounded memory)
- Matching parentheses in expressions — requires a stack
- Context-dependent patterns like "is `count` a keyword or a variable?" — requires scope information

These require more powerful models. This is why we have two separate phases.

While regular expressions are excellent for specifying individual tokens, we also need to understand how these patterns behave when combined, which leads us to their closure properties.


## 2.6 Closure Properties of Regular Languages

In a lexer, we often need to combine multiple token patterns or exclude specific strings (like keywords) from a general pattern (like identifiers). Closure properties guarantee that when we combine regular languages using certain operations, the result remains a regular language that our lexer can process.

A class of languages is **closed** under an operation if applying that operation to languages in the class always produces a result in the class. Regular languages are remarkably well-behaved in this respect.

**Theorem (Closure Properties)**: If $L_1$ and $L_2$ are regular, then so are:

1. $L_1 \cup L_2$ — union
2. $L_1 \cdot L_2$ — concatenation
3. $L_1^*$ — Kleene star
4. $L_1 \cap L_2$ — intersection
5. $\overline{L_1} = \Sigma^* \setminus L_1$ — complement
6. $L_1 \setminus L_2 = L_1 \cap \overline{L_2}$ — difference
7. $L_1^R = \{w^R \mid w \in L_1\}$ — reversal $\blacksquare$

**Proof:**

Properties 1–3 follow directly from the definition of regular languages. The others require construction arguments:

Intersection uses a product automaton: given two DFAs (with formal state sets $Q, \Sigma, \delta, q_0, F$) for $L_1$ and $L_2$, build a new DFA whose states are pairs $(q_1, q_2)$ with one component from each machine. Accept when both components are accepting. (We will formalize this in Chapter 3.)

Complement is simpler: given a DFA for $L$, swap its accepting and non-accepting states. Every accepted string becomes rejected and vice versa.

Difference follows from intersection and complement: $L_1 \setminus L_2 = L_1 \cap \overline{L_2}$.

Reversal follows from reversing all transitions in an NFA (Chapter 3).
$\blacksquare$

### 2.6.1 Using Closure Practically

Closure properties are a proof technique. To show a language is regular, it suffices to express it as a combination of known regular languages under closure operations.

**Example**: The language of C identifiers that do **not** contain the substring `goto`:

- $L_1 = \text{identifiers}$ — regular by definition
- $L_2 = \Sigma^* \cdot \text{goto} \cdot \Sigma^*$ — strings containing `goto` — regular (concatenation of a constant with $\Sigma^*$ on both sides)
- $L = L_1 \cap \overline{L_2}$ — regular by closure under intersection and complement

No explicit construction needed. The closure properties do the work.

While closure properties help us prove that certain languages are regular, we also need tools to prove when a language is definitively not regular.


## 2.7 Limits of Regular Languages: The Pumping Lemma

To understand the boundaries of our lexer, we must know what patterns it mathematically cannot recognize. The Pumping Lemma provides a rigorous way to prove that languages requiring unbounded memory fall outside the regular class.

### 2.7.1 Intuition

A DFA (which we will define formally in Chapter 3 as a 5-tuple $(Q, \Sigma, \delta, q_0, F)$) has a finite number of states in its set $Q$—say $p$. If you feed it a string of length $\ge p$, by the **pigeonhole principle** it must visit some state twice. That means a segment of the input was processed in a loop. Any language that cannot tolerate repeating that segment is not regular.

### 2.7.2 The Pumping Lemma

**Theorem (Pumping Lemma)**: If $L$ is a regular language, then there exists an integer $p \ge 1$ (the *pumping length*) such that every string $w \in L$ with $|w| \ge p$ can be written as $w = x \cdot y \cdot z$ where:

1. $|y| > 0$ — the pumped portion is nonempty
2. $|x \cdot y| \le p$ — the split happens near the start
3. For all $i \ge 0$: $x \cdot y^i \cdot z \in L$ — pumping $y$ any number of times stays in $L$ $\blacksquare$

The key phrase in condition 3 is *for all $i \ge 0$*. In particular, pumping zero times ($i = 0$) gives $x \cdot z$, which must also be in $L$.

### 2.7.3 Using the Lemma to Prove Non-Regularity

The pumping lemma is used as a **proof by contradiction**. The structure is always the same:

1. Assume $L$ is regular with pumping length $p$
2. Choose a specific string $w \in L$ with $|w| \ge p$ — your choice should make pumping impossible
3. Consider **all** valid splits $w = x \cdot y \cdot z$ satisfying conditions 1 and 2
4. Show that **for each** such split, some $i$ gives $x \cdot y^i \cdot z \notin L$
5. Conclude: contradiction — $L$ is not regular

The choice of $w$ in step 2 is the key creative step. Choose it so that any split must land in a predictable part of the string.

### 2.7.4 Example: $\{a^n b^n \mid n \ge 0\}$

**Claim**: $L = \{a^n b^n \mid n \ge 0\}$ is not regular. $\blacksquare$

**Proof:**

Assume $L$ is regular with pumping length $p$. Choose $w = a^p b^p$. Then $w \in L$ and $|w| = 2p \ge p$.

By the pumping lemma, $w = x \cdot y \cdot z$ with $|y| > 0$ and $|x \cdot y| \le p$.

Since $|x \cdot y| \le p$ and the first $p$ characters of $w$ are all $a$'s, both $x$ and $y$ consist entirely of $a$'s. So $y = a^k$ for some $k \ge 1$.

Now pump zero times: $x \cdot y^0 \cdot z = x \cdot z$. This string has $p - k$ copies of $a$ and $p$ copies of $b$. Since $k \ge 1$, we have $p - k < p$, so $x \cdot z \notin L$.

This contradicts condition 3. Therefore $L$ is not regular.
$\blacksquare$

### 2.7.5 Example: Balanced Parentheses

**Claim**: $L = \{ (^n )^n \mid n \ge 0 \}$ is not regular. $\blacksquare$

**Proof:**

Assume $L$ is regular with pumping length $p$. Choose $w = (^p )^p$. The argument is identical to the previous example: any valid split $w = x \cdot y \cdot z$ puts all of $y$ in the opening-parenthesis prefix. Pumping produces a mismatch, causing $x \cdot y^i \cdot z \notin L$ for $i \neq 1$, which is a contradiction. Thus, $L$ is not regular.
$\blacksquare$

### 2.7.6 Other Non-Regular Languages

The following table summarizes common non-regular languages and the intuitive reason why they fail to be regular:

| Language | Why not regular |
|----------|----------------|
| $\{a^n b^n \mid n \ge 0\}$ | Cannot count matching pairs |
| $\{ (^n )^n \mid n \ge 0 \}$ | Same — balanced nesting |
| $\{w \cdot w \mid w \in \{a,b\}^*\}$ | Cannot remember the first half |
| $\{a^p \mid p \text{ is prime}\}$ | Pumping breaks primality |
| $\{w \mid w \text{ has equal } a\text{'s and }b\text{'s}\}$ | Cannot track difference of two unbounded counts |

**The common thread**: regularity fails when a language requires tracking an unbounded quantity. A DFA with $p$ states has only $p$ possible "configurations" — it cannot distinguish between $p+1$ and $p+2$ open parentheses.

### 2.7.7 Implications for Compilers

Regular languages **can** handle:
- Identifiers: `[A-Za-z_][A-Za-z0-9_]*`
- Numbers: `[0-9]+`, `[0-9]+\.[0-9]+`
- Fixed operators: `+`, `==`, `!=`, `<=`
- Single-level comments: `//[^\n]*`

Regular languages **cannot** handle:
- Arbitrarily nested comments `/* /* */ */`
- Balanced parentheses in expressions
- Context-dependent token meaning (a keyword vs. a variable in scope)

This mathematical boundary is exactly why compilers have two distinct phases: the **lexer** (regular, flat patterns) and the **parser** (context-free, nested structure). The boundary is not a convention — it is a theorem.

Understanding these theoretical limits confirms why our compiler architecture requires a separate parser to handle nested constructs.


## 2.8 Chapter Summary

This chapter established the mathematical foundation for lexical analysis.

**The progression**:

$$\text{Alphabets} \to \text{Strings} \to \text{Languages} \to \text{Operations} \to \text{Regular Languages} \to \text{Regular Expressions}$$

**Core definitions**:

- An **alphabet** $\Sigma$ is a finite nonempty set of symbols
- A **string** is a finite sequence of symbols; $\Sigma^*$ is all strings over $\Sigma$
- A **language** is any subset of $\Sigma^*$
- The three fundamental operations are **union**, **concatenation**, and **Kleene star**

**Regular languages**: exactly those languages buildable from $\emptyset$, $\{\epsilon\}$, and single symbols using the three operations. They correspond exactly to patterns expressible as regular expressions.

**Closure**: Regular languages are closed under union, concatenation, star, intersection, complement, difference, and reversal. This lets us build complex patterns from simple ones and reason about them compositionally.

**Limits**: The Pumping Lemma proves that languages requiring unbounded counting or memory are not regular. This boundary explains the two-phase architecture of compilers.

**What comes next**: Regular expressions tell us *what* to recognize. We still need an *operational* model — a machine that reads characters and decides acceptance. This is the subject of Chapter 3, where we will meet deterministic and nondeterministic finite automata (formally defined with components like $Q, \Sigma, \delta, q_0, F$) and prove that they recognize exactly the regular languages.


## 2.9 Exercises

### Fundamental Concepts

**1.** Define the following in your own words:

a. The difference between $\epsilon$ and $\emptyset$  
b. The difference between $L^*$ and $L^+$  
c. Why $\Sigma^*$ is infinite even when $\Sigma$ is finite  

**2.** Let $L_1 = \{a, ab\}$ and $L_2 = \{b, bb\}$. Compute:

a. $L_1 \cup L_2$  
b. $L_1 \cdot L_2$  
c. $L_1^*$ (describe the pattern in English)  
d. $(L_1 \cup L_2)^*$

**3.** Evaluate these special cases and explain each answer:

a. $\emptyset^* = ?$  
b. $\{\epsilon\}^* = ?$  
c. $\emptyset \cdot \{a\} = ?$  
d. $\{\epsilon\} \cdot \{a\} = ?$

### Regular Expressions

**4.** Describe in English the language defined by each regex:

a. `(a|b)*a`  
b. `a*ba*ba*`  
c. `(aa)*`  
d. `(a|b)*abb(a|b)*`

**5.** Write regular expressions for:

a. Binary strings with an even number of 0's  
b. Strings over $\{a,b\}$ that start and end with the same symbol  
c. C-style identifiers  
d. Simplified email addresses: `alphanumeric@alphanumeric.alphanumeric`

**6.** Write token patterns for:

a. Floating-point literals: `3.14`, `0.5`, `.5`, `2.`  
b. Hexadecimal integers: `0x1A`, `0xFF`, `0x0`  
c. C++ single-line comments: `// comment text`  
d. Python string literals (single and double quoted, no escapes for simplicity)

### Closure Properties

**7.** Let $L_1$ = the language of C identifiers and $L_2$ = the language of C keywords. Express using closure operations:

a. Valid user-defined names (identifiers that are not keywords)  
b. Strings that are valid as either an identifier or a keyword

**8.** Prove that if $L$ is regular, then $L^R = \{w^R \mid w \in L\}$ is also regular. (Hint: use induction on the structure of the regular expression for $L$.)

### Non-Regular Languages

**9.** Use the Pumping Lemma to prove that $L = \{a^n b^n c^n \mid n \ge 0\}$ is not regular.

**10.** For each language, determine whether it is regular and justify your answer:

a. $\{w \mid w \text{ has equal numbers of } a\text{'s and } b\text{'s}\}$  
b. $\{a^n b^{2n} \mid n \ge 0\}$  
c. $\{w \mid w \text{ is a palindrome over } \{a,b\}\}$  
d. $\{a^n \mid n \text{ is a perfect square}\}$  
e. Strings over $\{a,b\}$ that contain more $a$'s than $b$'s

**11.** Which of the following should be handled by the lexer and which by the parser? Justify each answer.

a. Recognizing that `123` is an integer literal  
b. Flagging `123abc` as a lexical error  
c. Verifying that parentheses balance in `(a + (b * c))`  
d. Identifying that `if` is a keyword  
e. Checking that a variable is declared before use
