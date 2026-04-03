---
layout: blog
title: "Context-Free Grammars and Pushdown Automata"
date: "2026-04-02"
author: "Aiko Schurmann"
description: "Move beyond regular languages with context-free grammars and pushdown automata—the formal backbone of every parser."
tags:
  - "AUTOMATA"
  - "PARSING"
  - "Optional"
chapterTitle: "Context-Free Grammars and Pushdown Automata"
---

<script>
  import CFGEmbed from '$lib/components/CFGEmbed.svelte';
  import PDAEmbed from '$lib/components/PDAEmbed.svelte';
  import StaticTreeEmbed from '$lib/components/StaticTreeEmbed.svelte';
</script>

## 5.1 Learning Objectives

By the end of this chapter, you should be able to:

- Define a context-free grammar (CFG) formally using the 4-tuple $G = (V, \Sigma, R, S)$
- Derive strings from a grammar using leftmost and rightmost derivations
- Construct parse trees and explain their relationship to derivations
- Define pushdown automata (PDA) formally and trace their execution on an input string
- Explain why CFGs are strictly more expressive than regular languages
- Identify the role of CFGs in the parser stage of a compiler pipeline
- Recognize when a grammar is ambiguous and understand why ambiguity matters


## 5.2 Beyond Regular Languages

Chapter 3 established that finite automata recognize exactly the regular languages, and Chapter 4 showed how to compile regular expressions into efficient DFAs for lexical analysis. But the lexer is only the first stage of a compiler. After tokenization, the compiler must determine whether a sequence of tokens has valid *syntactic structure* — whether it forms a grammatically well-formed program.

This is a harder problem, and regular languages are provably insufficient for it. Consider the language of balanced parentheses:

$$L = \{ \underbrace{(^n)^n}_{n \text{ open, } n \text{ close}} \mid n \geq 0 \} = \{\epsilon,\ (),\ (()),\ ((())),\ \ldots\}$$

No DFA can recognize this language. The reason is intuitive: a DFA has a finite, fixed number of states, so it cannot count to an arbitrary depth. Checking that 47 open parens are eventually matched by exactly 47 close parens would require at least 48 states for counting alone — and since the requirement holds for every $n$, the count is unbounded.

**The Pumping Lemma for regular languages** makes this precise. It guarantees that for any regular language $L$, there is a constant $p$ such that every sufficiently long string $w \in L$ can be "pumped" — a middle section repeated any number of times — and the result stays in $L$. The language of balanced parentheses fails this test immediately: pumping always creates a mismatch between opening and closing counts.

To handle the recursive, nested structure of real programming languages, we need a more expressive formalism. **Context-free grammars** (CFGs) are the standard answer, and they are the mathematical foundation of every parser.

### 5.2.1 Where We Are in the Pipeline

The full compiler front-end looks like this:

```
Source text  →  [Lexer]  →  Token stream  →  [Parser]  →  Parse tree / AST
                (Regex/DFA)                   (CFG/PDA)
```

The lexer — built from regular expressions and DFAs in Chapters 3–4 — handles the *local* structure of the language: what a valid identifier looks like, what the literal `42` means. The parser handles the *global* structure: how expressions nest, how statements compose, how a function body is delimited. This chapter establishes the theory behind the parser.


## 5.3 Context-Free Grammars

### 5.3.1 Intuition

A **grammar** is a system of rewriting rules. Each rule says: this symbol can be replaced by that sequence of symbols. Starting from a designated start symbol and applying rules repeatedly, we generate strings. The set of all strings we can generate this way is the language of the grammar.

The word **context-free** refers to the shape of the rules: every rule's left-hand side is a single nonterminal, and the replacement does not depend on the surrounding context. This constraint keeps the theory tractable — efficient parsing algorithms exist precisely because the rules are context-free.

### 5.3.2 Formal Definition

**Definition (CFG)**: A context-free grammar is a 4-tuple:

$$G = (V,\ \Sigma,\ R,\ S)$$

where:
- $V$ is a finite set of **nonterminal symbols** (also called *variables*)
- $\Sigma$ is a finite set of **terminal symbols** (the alphabet of the strings we generate), with $V \cap \Sigma = \emptyset$
- $R \subseteq V \times (V \cup \Sigma)^*$ is a finite set of **production rules**
- $S \in V$ is the **start symbol**

A production rule $(A, \alpha) \in R$ is written $A \to \alpha$, meaning "the nonterminal $A$ may be replaced by the string $\alpha$."

### 5.3.3 Conventions and Notation

By convention:
- **Uppercase letters** ($A, B, S, \ldots$) denote nonterminals
- **Lowercase letters** and quoted strings ($a, b, \texttt{if}, \ldots$) denote terminals
- **Greek letters** ($\alpha, \beta, \gamma, \ldots$) denote strings over $V \cup \Sigma$
- Multiple rules sharing a left-hand side are collapsed with `|`: writing $A \to \alpha \mid \beta$ is shorthand for the two rules $A \to \alpha$ and $A \to \beta$

### 5.3.4 Derivations

Starting from $S$, we generate a string by applying production rules one at a time.

**Definition (Single-step derivation)**: If $A \to \alpha$ is a production rule and $\beta, \gamma \in (V \cup \Sigma)^*$, then:

$$\beta A \gamma \Rightarrow \beta \alpha \gamma$$

We say $\beta A \gamma$ **derives** $\beta \alpha \gamma$ in one step: we replaced the nonterminal $A$ with the string $\alpha$, leaving everything else unchanged.

**Definition (Multi-step derivation)**: $\alpha \xRightarrow{*} \beta$ means $\alpha$ derives $\beta$ in zero or more steps.

**Language of $G$**:

$$L(G) = \{w \in \Sigma^* \mid S \xRightarrow{*} w\}$$

The language is the set of all terminal strings reachable from the start symbol by some sequence of rule applications.

### 5.3.5 Leftmost and Rightmost Derivations

When a sentential form contains multiple nonterminals, we must choose which one to expand. Two canonical orderings are:

- **Leftmost derivation**: always expand the *leftmost* nonterminal. Written $\Rightarrow_{lm}$.
- **Rightmost derivation**: always expand the *rightmost* nonterminal. Written $\Rightarrow_{rm}$.

Both orderings generate the same set of strings; the choice is about discipline, not power. The distinction matters for parsing: top-down parsers (like LL parsers) construct leftmost derivations, while bottom-up parsers (like LR parsers) construct the reverse of rightmost derivations. We will return to this in the section about parsers later in the course.

### 5.3.6 Worked Example: Arithmetic Expressions

**Task**: Write a CFG for arithmetic expressions over integer literals, using `+`, `*`, and parentheses.

$$G = (\{E\},\ \{\texttt{int}, +, *, (, )\},\ R,\ E)$$

**Productions**:

$$E \to E + E \mid E * E \mid ( E ) \mid \texttt{int}$$

**Deriving** `int + int * int`:

$$E \Rightarrow E + E \Rightarrow \texttt{int} + E \Rightarrow \texttt{int} + E * E \Rightarrow \texttt{int} + \texttt{int} * E \Rightarrow \texttt{int} + \texttt{int} * \texttt{int}$$

At each step we expanded the leftmost $E$, so this is a leftmost derivation.

### 5.3.7 Parse Trees

A derivation records *what* rules were applied. A **parse tree** records *how* they fit together structurally.

**Definition**: A parse tree for a string $w \in L(G)$ is a rooted, ordered tree where:
- The **root** is labeled with the start symbol $S$
- Each **interior node** is labeled with a nonterminal $A$; its children spell out the right-hand side of whichever production $A \to \alpha$ was applied
- Each **leaf** is labeled with a terminal or $\epsilon$

Reading the leaves from left to right recovers the derived string $w$.

**Example**: The parse tree for `int + int * int` under the grammar above. Addition sits at the root, meaning `int` is added to the subexpression `int * int`:

<StaticTreeEmbed tree={{
  label: 'E',
  children: [
    { label: 'E', children: [{ label: 'int', isTerminal: true }] },
    { label: '+', isTerminal: true },
    { 
      label: 'E', 
      children: [
        { label: 'E', children: [{ label: 'int', isTerminal: true }] },
        { label: '*', isTerminal: true },
        { label: 'E', children: [{ label: 'int', isTerminal: true }] }
      ] 
    }
  ]
}} />

This corresponds to the evaluation $(1 + (2 \times 3))$. The tree makes the implicit grouping explicit in a way that a flat derivation sequence does not.

### 5.3.8 Ambiguity

A grammar is **ambiguous** if some string $w \in L(G)$ has more than one distinct parse tree — equivalently, more than one leftmost derivation.

The arithmetic expression grammar above is ambiguous. The string `int + int * int` admits two parse trees, depending on which operator is treated as the root of the expression:

**Tree 1** — multiplication at the root, computing `(int + int) * int`:

<StaticTreeEmbed tree={{
  label: 'E',
  children: [
    { 
      label: 'E', 
      children: [
        { label: 'E', children: [{ label: 'int', isTerminal: true }] },
        { label: '+', isTerminal: true },
        { label: 'E', children: [{ label: 'int', isTerminal: true }] }
      ] 
    },
    { label: '*', isTerminal: true },
    { label: 'E', children: [{ label: 'int', isTerminal: true }] }
  ]
}} />

**Tree 2** — addition at the root, computing `int + (int * int)`:

<StaticTreeEmbed tree={{
  label: 'E',
  children: [
    { label: 'E', children: [{ label: 'int', isTerminal: true }] },
    { label: '+', isTerminal: true },
    { 
      label: 'E', 
      children: [
        { label: 'E', children: [{ label: 'int', isTerminal: true }] },
        { label: '*', isTerminal: true },
        { label: 'E', children: [{ label: 'int', isTerminal: true }] }
      ] 
    }
  ]
}} />

For a programming language, ambiguity is a serious problem: if the grammar allows two interpretations of the same expression, the compiler has no principled basis for choosing between them. The usual remedies are:

1. **Rewriting the grammar** to be structurally unambiguous, using precedence levels (Section 5.3.9)
2. **Imposing external disambiguation rules** — declaring that `*` binds more tightly than `+` — without changing the grammar itself

Real parser generators like Yacc and Bison support the second approach and will warn when they detect ambiguity. For correctness, the first approach is cleaner.

### 5.3.9 Eliminating Ambiguity: Precedence and Associativity

The standard technique is to **stratify the grammar by precedence level**: introduce one nonterminal per level, with higher-precedence operators appearing deeper in the grammar (closer to the leaves, where they bind more tightly).

**Unambiguous arithmetic grammar**:

$$\begin{aligned}
E &\to E + T \mid T \\
T &\to T * F \mid F \\
F &\to ( E ) \mid \texttt{int}
\end{aligned}$$

Here $E$ governs `+` (lowest precedence), $T$ governs `*` (higher), and $F$ handles atoms and parenthesized subexpressions. Because `*` can only appear inside $T$, which is itself a subgoal of $E$, multiplication binds tighter by construction. Left-recursion ($E \to E + T$) encodes left-associativity: `1 + 2 + 3` parses as `(1 + 2) + 3`, never as `1 + (2 + 3)`.

**Deriving** `int + int * int` now produces exactly one parse tree:

$$E \Rightarrow_{lm} E + T \Rightarrow_{lm} T + T \Rightarrow_{lm} F + T \Rightarrow_{lm} \texttt{int} + T \Rightarrow_{lm} \texttt{int} + T * F \Rightarrow_{lm} \cdots \Rightarrow_{lm} \texttt{int} + \texttt{int} * \texttt{int}$$

You can use the visualizer below to experiment with grammars of your own, step through derivations symbol by symbol:

<CFGEmbed />


## 5.4 Context-Free Languages

### 5.4.1 Definition

A language $L$ is **context-free** if there exists a CFG $G$ such that, $L = L(G)$. The class of context-free languages (CFLs) strictly contains the regular languages: every regular language is context-free, but not every CFL is regular. The balanced-parentheses language $\{(^n)^n \mid n \geq 0\}$ is the canonical separating example.

### 5.4.2 Closure Properties

Context-free languages are closed under:
- **Union**: If $L_1$ and $L_2$ are CFLs, so is $L_1 \cup L_2$
- **Concatenation**: If $L_1$ and $L_2$ are CFLs, so is $L_1 \cdot L_2$
- **Kleene star**: If $L$ is a CFL, so is $L^*$

They are **not** closed in general under:
- Intersection: $L_1 \cap L_2$ may not be context-free
- Complement: $\overline{L}$ may not be context-free

The closure under union, concatenation, and Kleene star means that programming language constructs — which compose freely (loops inside conditionals inside functions) — remain context-free even after combination. The failure of closure under intersection is the reason that some cross-cutting constraints (like type consistency) fall outside the parser's reach and must be handled separately in semantic analysis.

### 5.4.3 Examples of Context-Free Languages

| Language | Grammar sketch | Regular? |
|---|---|---|
| $\{(^n)^n \mid n \geq 0\}$ | $S \to (S) \mid \epsilon$ | No |
| $\{a^n b^n \mid n \geq 0\}$ | $S \to aSb \mid \epsilon$ | No |
| $\{ww^R \mid w \in \{a,b\}^*\}$ | $S \to aSa \mid bSb \mid \epsilon$ | No |
| $\{a^n \mid n \geq 0\}$ | $S \to aS \mid \epsilon$ | Yes |
| Any finite language | Enumerate all strings | Yes |

The palindrome language $\{ww^R\}$ is worth pausing on: it requires matching symbols across a center point, a symmetry that a finite automaton can never track because the center arrives at an unpredictable position.

### 5.4.4 The Pumping Lemma for CFLs

Context-free languages have their own pumping lemma, used to prove that a given language is *not* context-free. If $L$ is a CFL, there exists a constant $p$ such that any $w \in L$ with $|w| \geq p$ can be written as $w = uvxyz$ satisfying:

1. $|vxy| \leq p$
2. $|vy| \geq 1$ (at least one of $v, y$ is nonempty)
3. $uv^i xy^i z \in L$ for all $i \geq 0$

As an example: the language $\{a^n b^n c^n \mid n \geq 0\}$ is not context-free. Any split $uvxyz$ of a long string $a^n b^n c^n$ confines $vxy$ to a small window, so pumping $v$ and $y$ simultaneously can affect at most two of the three symbol groups — making it impossible to maintain equal counts of all three.


## 5.5 Pushdown Automata (PDA)

### 5.5.1 Motivation

We have established that DFAs are too weak for context-free languages. What additional capability is needed? The answer is simple: **memory that grows with the input**. To verify that $n$ open parens are matched by $n$ close parens, a machine needs to remember $n$ — a quantity with no fixed upper bound.

A **pushdown automaton** (PDA) is a finite automaton equipped with a **stack**: an unbounded, last-in, first-out memory structure. A stack is exactly the right amount of extra power — PDAs recognize precisely the context-free languages, no more and no less.

### 5.5.2 Formal Definition

**Definition (PDA)**: A pushdown automaton is a 6-tuple:

$$P = (Q,\ \Sigma,\ \Gamma,\ \delta,\ q_0,\ F)$$

where:
- $Q$ is a finite set of **states**
- $\Sigma$ is the **input alphabet**
- $\Gamma$ is the **stack alphabet**, which may differ from $\Sigma$
- $\delta : Q \times (\Sigma \cup \{\epsilon\}) \times \Gamma_\epsilon \to \mathcal{P}(Q \times \Gamma_\epsilon^*)$ is the **transition relation**, where $\Gamma_\epsilon = \Gamma \cup \{\epsilon\}$
- $q_0 \in Q$ is the **start state**
- $F \subseteq Q$ is the set of **accepting states**

A transition $\delta(q, a, X) \ni (r, \gamma)$ means: in state $q$, reading input symbol $a$ (or taking a free $\epsilon$-move), with $X$ on top of the stack, the PDA may move to state $r$ and replace $X$ with the string $\gamma$. Setting $\gamma = \epsilon$ pops $X$ without pushing anything; setting $\gamma = YX$ pushes $Y$ on top of $X$.

**A note on nondeterminism**: Like NFAs, PDAs are nondeterministic by default — the machine accepts if *any* sequence of choices leads to an accepting configuration. Unlike with NFAs, nondeterministic and deterministic PDAs are **not** equivalent in power. Deterministic PDAs (DPDAs) recognize a strict subset of the CFLs: languages like $\{ww^R\}$ genuinely require nondeterminism. DPDAs correspond to the class of grammars that practical parsers can handle efficiently.

### 5.5.3 Configurations and Acceptance

A **configuration** of a PDA is a triple $(q, w, \gamma)$: the current state $q$, the remaining input $w$, and the current stack contents $\gamma$ (top at the left). The PDA starts in $(q_0, w, \epsilon)$ — initial state, full input, empty stack.

**Acceptance by final state**: the PDA accepts $w$ if some sequence of transitions leads from $(q_0, w, \epsilon)$ to $(q_f, \epsilon, \gamma)$ for some $q_f \in F$, regardless of stack contents.

**Acceptance by empty stack**: alternatively, the PDA accepts $w$ if it can reach $(q, \epsilon, \epsilon)$ for any state $q$ — input consumed and stack empty. The two modes are equivalent in expressive power, and either can be used depending on which is more convenient for a given construction.

### 5.5.4 Worked Example: $\{(^n)^n \mid n \geq 0\}$

**Task**: Build a PDA that accepts exactly the strings of balanced parentheses.

**States**: $Q = \{q_0, q_1, q_2\}$

**Alphabets**: $\Sigma = \{(,\ )\}$, $\Gamma = \{\$,\ \texttt{P}\}$, where `$` marks the bottom of the stack and `P` records each unmatched open paren.

**Strategy**: The key insight is that the stack can serve as a counter. Every time we see `(`, we push `P`; every time we see `)`, we pop one. If the pops and pushes balance perfectly — meaning the stack returns to only `$` exactly when the input ends — the string is accepted. Any early underflow (a `)` with nothing to pop) or leftover pushes (open parens that were never matched) cause rejection.

Concretely: $q_0$ exists only to push the bottom-of-stack marker `$` and hand off to $q_1$ immediately. From $q_1$ we process symbols as described above. The transition to the accepting state $q_2$ is only available as an $\epsilon$-move when the stack top is `$` — that is, when the stack is exactly as empty as it started, and all parens have been matched.

**Transition relation**:

| State | Input | Stack top | Next state | Stack action |
|-------|-------|-----------|------------|--------------|
| $q_0$ | $\epsilon$ | $\epsilon$ | $q_1$ | push `$` |
| $q_1$ | `(` | any | $q_1$ | push `P` |
| $q_1$ | `)` | `P` | $q_1$ | pop |
| $q_1$ | $\epsilon$ | `$` | $q_2$ | pop |

Notice what is deliberately *absent*: there is no transition for `)` when the stack top is `$`. Trying to close a paren that was never opened leaves the PDA stuck, with no move available — the string is rejected.

**Trace on `(())`** — accepted:

| Step | State | Remaining input | Stack |
|------|-------|----------------|-------|
| Start | $q_0$ | `(())` | — |
| Push `$` | $q_1$ | `(())` | `$` |
| Read `(` | $q_1$ | `())` | `P$` |
| Read `(` | $q_1$ | `))` | `PP$` |
| Read `)` | $q_1$ | `)` | `P$` |
| Read `)` | $q_1$ | — | `$` |
| $\epsilon$-move | $q_2$ | — | — |

Input exhausted, stack reduced to `$`, $\epsilon$-move to $q_2$ is available. Final state $q_2 \in F$. **Accept** ✓

**Trace on `())(`** — rejected:

| Step | State | Remaining input | Stack |
|------|-------|----------------|-------|
| Start | $q_0$ | `()(` | — |
| Push `$` | $q_1$ | `()(` | `$` |
| Read `(` | $q_1$ | `)(` | `P$` |
| Read `)` | $q_1$ | `(` | `$` |
| Read `(` | $q_1$ | — | `P$` |

Input is exhausted with `P` still on the stack — there is an unmatched open paren. The $\epsilon$-move to $q_2$ requires `$` on top, so no accepting configuration is reachable. **Reject** ✗

The stack is the visual heart of this computation: it grows with each `(` and shrinks with each `)`, and acceptance comes down to whether those changes cancel out perfectly. The simulator below uses `a` and `b` in place of `(` and `)` to make the stack changes easier to follow visually — step through it on inputs of your choice before moving on:

<PDAEmbed />


## 5.6 The Equivalence Theorem

### 5.6.1 Statement

The grammar and machine formalisms define exactly the same class of languages:

**Theorem**: A language $L$ is context-free if and only if there exists a PDA that recognizes $L$.

This mirrors the DFA/NFA/regex equivalence from Chapters 3–4, and closes the same kind of loop one level up in expressiveness:

$$\text{CFG} \;\Leftrightarrow\; \text{PDA} \;\Leftrightarrow\; \text{Context-free language}$$

### 5.6.2 From CFG to PDA

Given $G = (V, \Sigma, R, S)$, we construct an equivalent PDA using a three-state skeleton: a start state, a central loop state, and an accepting state. The machine works by maintaining a **sentential form** on the stack and consuming the input one terminal at a time, simulating a leftmost derivation step by step.

1. **Initialize**: push a bottom marker `$` followed by the start symbol $S$.
2. **Main loop**: look at the top of the stack.
   - If it is a **nonterminal** $A$: for each rule $A \to X_1 X_2 \cdots X_k$ in $R$, nondeterministically pop $A$ and push $X_1 X_2 \cdots X_k$ (with $X_1$ on top), consuming no input. This is an $\epsilon$-transition that "expands" one step of the derivation.
   - If it is a **terminal** $a$: read the next input symbol. If it matches $a$, pop it and continue; if it does not match, this branch of the nondeterministic computation dies — the current choice of productions was wrong.
3. **Accept**: when the stack holds only `$` and all input has been consumed, pop `$` and move to the accepting state.

The nondeterminism is load-bearing here. At every expansion step, the PDA simultaneously explores all possible productions for the current nonterminal, in parallel. A string is accepted if *any* sequence of choices produces a complete match. This is precisely nondeterministic top-down parsing — the machine is "predicting" the derivation from the start symbol downward. The problem with doing this deterministically is that you cannot know which production to choose without looking ahead at the input, and sometimes a significant amount of lookahead is needed. Making these guesses efficiently and deterministically, via lookahead tables, is what LL and LR parsing algorithms are about — the subject of Chapter 6.

### 5.6.3 From PDA to CFG

The reverse direction — constructing a grammar from a PDA — is more involved, but follows a clear pattern. The idea is to characterize each PDA computation segment as a grammar rule.

First, simplify the PDA so that it has a single accepting state $q_f$ reached only when the stack is empty. (Any PDA can be put in this form.) Then, for each ordered pair of states $(p, q)$, introduce a nonterminal $A_{pq}$ with the intended meaning: **$A_{pq}$ generates exactly the strings that take the PDA from state $p$ with an empty stack to state $q$ with an empty stack**.

Productions are generated from the PDA's transitions as follows:

- If the PDA can move from $p$ to $r$ by reading $a$ and pushing symbol $Z$, and later from $r$ to $q$ by reading $b$ and popping $Z$, with any intervening computation captured by nonterminals $A_{rs}$ for intermediate states $s$, then this yields a production for $A_{pq}$.
- The base case is $A_{pp} \to \epsilon$ for every state $p$: staying in place on an empty stack generates the empty string.

The resulting grammar can be large — it has $O(|Q|^2)$ nonterminals and $O(|Q|^3 \cdot |\delta|)$ productions in the worst case — but it is correct. The key insight is the correspondence between grammatical recursion and the push-pop discipline of the stack: every time the PDA pushes a symbol, it opens a "recursive call" that must eventually be resolved by popping that same symbol, mirroring the recursive structure of a CFG production.

### 5.6.4 The Chomsky Hierarchy

Finite automata and pushdown automata sit at adjacent levels in a four-tier hierarchy of language classes and machine models:

| Level | Language class | Machine |
|-------|---------------|---------|
| 3 | Regular | Finite automaton |
| 2 | Context-free | Pushdown automaton |
| 1 | Context-sensitive | Linear-bounded automaton |
| 0 | Recursively enumerable | Turing machine |

Each class is strictly contained in the one above it. For compiler design, levels 3 and 2 cover almost everything: regular languages for the lexer, context-free languages for the parser.


## 5.7 Normal Forms

Parsing algorithms often require grammars in a standardized shape. Two normal forms arise frequently in theory and practice.

### 5.7.1 Chomsky Normal Form (CNF)

**Definition**: A CFG is in **Chomsky Normal Form** if every production has one of the forms:

$$A \to BC \qquad A \to a \qquad S \to \epsilon$$

where $B, C \neq S$, $a \in \Sigma$, and the last form is only permitted when $\epsilon \in L(G)$.

**Theorem**: Every CFG has an equivalent grammar in CNF.

CNF matters because it is the prerequisite for the **CYK algorithm** (Cocke-Younger-Kasami), a $O(n^3)$ dynamic programming procedure that decides whether $w \in L(G)$ for *any* CFG $G$ in CNF and any input $w$. CYK is used in natural language processing and serves as the standard theoretical baseline for general parsing.

**Converting to CNF** proceeds in four steps:
1. **Eliminate $\epsilon$-productions** — remove rules of the form $A \to \epsilon$ (except possibly $S \to \epsilon$) by propagating their effect into other rules.
2. **Eliminate unit productions** — remove rules of the form $A \to B$ by substituting the productions of $B$ directly.
3. **Remove useless symbols** — any nonterminal that cannot derive a terminal string, or that is unreachable from $S$, can be discarded.
4. **Binarize** — replace any right-hand side with three or more symbols by a chain of binary productions using fresh nonterminals.

### 5.7.2 Greibach Normal Form (GNF)

**Definition**: A CFG is in **Greibach Normal Form** if every production has the form:

$$A \to a\alpha$$

where $a \in \Sigma$ and $\alpha \in V^*$.

In GNF, every rule begins with exactly one terminal, so every derivation step consumes exactly one input symbol. This gives a direct correspondence with PDA transitions and is used in theoretical arguments about parsing complexity and PDA construction.


## 5.8 CFGs and Programming Languages

### 5.8.1 The Role of CFGs in a Compiler

The parser takes the token stream from the lexer and determines whether it constitutes a syntactically valid program. This determination is driven by a CFG called the **language grammar** or **syntax specification**. A simplified grammar for Python-like statement syntax illustrates the structure:

$$\begin{aligned}
\textit{stmt} &\to \textbf{if}\ \textit{expr}\ \textbf{:}\ \textit{block} \\
              &\mid \textbf{while}\ \textit{expr}\ \textbf{:}\ \textit{block} \\
              &\mid \textbf{return}\ \textit{expr} \\
              &\mid \textit{expr} \\
\textit{block} &\to \textbf{indent}\ \textit{stmt}^+\ \textbf{dedent} \\
\textit{expr}  &\to \textit{expr} + \textit{term} \mid \textit{term} \\
\textit{term}  &\to \textit{term} * \textit{factor} \mid \textit{factor} \\
\textit{factor} &\to \textbf{id} \mid \textbf{int} \mid ( \textit{expr} )
\end{aligned}$$

Bold tokens (`if`, `while`, `return`, `id`, `int`) are terminals supplied by the lexer; the nonterminals ($\textit{stmt}$, $\textit{expr}$, etc.) are syntactic categories the parser reasons about.

### 5.8.2 From Parse Tree to AST

The parse tree produced by the parser captures every syntactic detail: all parentheses, commas, and keywords appear as nodes. Most of this detail is structurally useful during parsing but semantically irrelevant afterwards. The compiler therefore derives a more compact **Abstract Syntax Tree** (AST) by:

- Dropping punctuation and grouping tokens that carry no meaning beyond their role in parsing
- Collapsing chains of unit productions that add no branching structure
- Annotating nodes with semantic information, such as resolved types and scope bindings

The AST is the data structure that flows into subsequent compilation phases: semantic analysis, type checking, and code generation.

### 5.8.3 What CFGs Cannot Express

Not every constraint in a real programming language can be captured by a CFG. Two important examples:

1. **Declaration before use**: "Every variable must be declared before it is referenced." Enforcing this requires tracking which names are currently in scope — a context-sensitive property that depends on the global structure of the program, not just local syntactic shape.
2. **Type consistency**: "The left and right sides of an assignment must have compatible types." This depends on type information accumulated from earlier declarations, which is again beyond what a context-free rule can see.

These constraints are checked in the **semantic analysis** phase, after parsing. The parser verifies structural well-formedness only; deeper consistency is verified separately. This is a deliberate division of labor: CFG-based parsers are fast, well-understood, and backed by efficient algorithms — use them for what they do well, and defer the rest.


## 5.9 Chapter Summary

This chapter introduced the formal machinery that underlies every parser.

- **Context-free grammars** generate languages through recursive rewriting rules. Every context-free language is recognized by a pushdown automaton, and every PDA-recognizable language is context-free.
- **Parse trees** record the derivation structure of a string and are the primary output of a parser. **Ambiguity** — multiple parse trees for the same string — is a correctness hazard that must be resolved before a grammar can safely drive a compiler.
- **Pushdown automata** extend finite automata with a stack, giving them the unbounded counting ability that regular machines lack. Nondeterministic PDAs are strictly more expressive than deterministic ones.
- **Normal forms** (CNF and GNF) standardize grammars for use in algorithms. CNF enables the general CYK parsing algorithm; GNF aligns grammar rules with PDA transitions.
- In the compiler pipeline, the parser consumes the token stream and produces an AST, which propagates forward through semantic analysis and code generation.


## 5.10 Exercises

### CFG Fundamentals

**1.** For each of the following languages, write a CFG. Give the full 4-tuple and at least one sample derivation.

a. $\{a^n b^m \mid n \geq 1,\ m \geq 1\}$  
b. $\{a^n b^n c^m \mid n \geq 0,\ m \geq 0\}$  
c. $\{w \in \{a,b\}^* \mid w \text{ is a palindrome}\}$  
d. The set of all properly nested strings of parentheses and square brackets, e.g. `([])`, `([()[]])`.

**2.** Consider the grammar:

```
S → aSb | SS | ε
```

a. What language does this grammar generate? Give an English description and a set-builder definition.  
b. Show two distinct parse trees for the string `aabb`. What does this tell you about the grammar?  
c. Is there an unambiguous grammar for the same language? If so, give one.

**3.** Write a grammar for arithmetic expressions that supports `+`, `-`, `*`, `/`, is unambiguous, treats `*` and `/` as higher-precedence than `+` and `-`, makes all operators left-associative, and supports parentheses and integer literals. Give a leftmost derivation of `int - int * int + int` under your grammar.

### Parse Trees and Derivations

**4.** Given the grammar:

```
S → AB
A → aA | ε
B → bB | ε
```

a. Give a leftmost derivation of `aabb`.  
b. Give a rightmost derivation of `aabb`.  
c. Draw the parse tree. Is it the same for both derivations?

**5.** Show that $E \to E + E \mid E * E \mid \texttt{int}$ is ambiguous by exhibiting two distinct leftmost derivations for `int * int + int`.

### Pushdown Automata

**6.** For each of the following languages, construct a PDA. Give the stack alphabet and the transition relation.

a. $\{a^n b^n \mid n \geq 0\}$  
b. $\{ww^R \mid w \in \{a,b\}^*\}$  
c. $\{a^i b^j c^k \mid i = j \text{ or } j = k\}$

**7.** Trace the PDA from Exercise 6a on the input `aaabbb`. Show the full configuration sequence $(q, w, \gamma)$ at each step.

**8.** Explain why $\{a^n b^n c^n \mid n \geq 0\}$ cannot be recognized by any PDA. Use the pumping lemma for context-free languages.

### Normal Forms and Closure

**9.** Convert the following grammar to Chomsky Normal Form, showing each step.

```
S → ASB | ε
A → aAS | a
B → SbS | A | bb
```

**10.** Prove that the class of context-free languages is closed under union: given CFGs $G_1$ for $L_1$ and $G_2$ for $L_2$, construct a CFG for $L_1 \cup L_2$. (Hint: introduce a new start symbol.)

**11.** Show that context-free languages are not closed under intersection by exhibiting two CFLs whose intersection is not context-free.

### Programming Language Grammars

**12.** Consider this grammar for if-else statements:

```
stmt → if ( expr ) stmt
     | if ( expr ) stmt else stmt
     | other
```

a. Show that this grammar is ambiguous by drawing two parse trees for `if (e1) if (e2) s1 else s2`.  
b. This is the classic **dangling else** problem. Describe the disambiguation convention used by C and Java, then rewrite the grammar to enforce it structurally.  
c. Why does this ambiguity matter for a compiler?

### Advanced

**13.** **Theoretical**: Prove that every regular language is context-free. Given a DFA with states $Q = \{q_0, \ldots, q_n\}$, construct an equivalent CFG with one nonterminal per state and one production per transition.

**14.** **Theoretical**: Let $L_1 = \{a^n b^n \mid n \geq 0\}$ and $L_2 = \{b^n c^n \mid n \geq 0\}$. Prove that $L_1 \cap L_2 = \{a^n b^n c^n \mid n \geq 0\}$ is not context-free, and conclude that the intersection of two CFLs need not be a CFL.