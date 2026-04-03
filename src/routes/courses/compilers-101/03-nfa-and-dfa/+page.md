---
layout: blog
title: "Finite Automata: NFA and DFA"
date: "2026-04-02"
author: "Aiko Schurmann"
description: "Model recognition with nondeterministic and deterministic automata, and compare their construction and runtime behavior."
tags:
  - "AUTOMATA"
  - "LEXING"
  - "Optional"
chapterTitle: "Finite Automata: NFA and DFA"
---

<script>
   import DFAEmbed from '$lib/components/DFAEmbed.svelte';
   import NFAEmbed from '$lib/components/NFAEmbed.svelte';
</script>

## 3.1 Learning Objectives

By the end of this chapter, you should be able to:

- Define deterministic finite automata (DFA) formally using the 5-tuple $M = (Q, \Sigma, \delta, q_0, F)$
- Trace DFA execution on an input string using the extended transition function $\hat{\delta}$
- Define nondeterministic finite automata (NFA) and compute $\epsilon$-closure
- Explain why DFAs and NFAs recognize exactly the same class of languages
- Understand at a high level the pipeline from regular expressions to efficient recognizers


## 3.2 From Specification to Machine

Chapter 2 gave us the *language* of regular languages: a precise vocabulary for describing which strings belong to a set. Regular expressions are a notation for those descriptions. But a notation alone doesn't tell us how to *run* anything.

In this chapter we build the operational counterpart: **finite automata**, which are simple machines that read strings symbol-by-symbol and decide whether to accept or reject them. We will define two variants — deterministic (DFA) and nondeterministic (NFA) — and prove that both recognize exactly the regular languages. Together with the regular-expression equivalence from Chapter 2, this closes the loop:

$$\text{Regular expression} \;\Leftrightarrow\; \text{NFA} \;\Leftrightarrow\; \text{DFA} \;\Leftrightarrow\; \text{Regular language}$$

This equivalence is not just theoretically satisfying. It drives the practical pipeline used by every lexer generator:

```
Regular expression  →  NFA  →  DFA  →  Minimized DFA  →  lexer code
```

Understanding each step — and why we bother with NFAs at all — is the goal of this chapter.


## 3.3 Deterministic Finite Automata (DFA)

### 3.3.1 Intuition

A DFA is the simplest possible recognition device. It has:

- A finite set of **states** representing everything it can "remember"
- A current **active state** that changes with each input symbol
- A rule — the **transition function** — mapping (state, symbol) to the next state
- A distinguished **start state**
- A set of **accepting states** that determine the outcome

When the DFA finishes reading its input, it either is or is not in an accepting state. That's the decision.

The critical property: **for every state and every symbol, there is exactly one next state**. The machine never has a choice. This is what *deterministic* means.

### 3.3.2 Formal Definition

**Definition (DFA)**: A deterministic finite automaton is a 5-tuple:

$$M = (Q,\ \Sigma,\ \delta,\ q_0,\ F)$$

where:
- $Q$ is a finite set of **states**
- $\Sigma$ is the input **alphabet**
- $\delta : Q \times \Sigma \to Q$ is the **transition function**
- $q_0 \in Q$ is the **start state**
- $F \subseteq Q$ is the set of **accepting states**

The transition function $\delta$ is total: it must be defined for every pair $(q, a) \in Q \times \Sigma$.

### 3.3.3 Extended Transition Function

To describe how a DFA processes an entire string (not just one symbol), we extend $\delta$ to strings.

**Definition**: Define $\hat{\delta} : Q \times \Sigma^* \to Q$ by:

- $\hat{\delta}(q, \epsilon) = q$
- $\hat{\delta}(q, wa) = \delta(\hat{\delta}(q, w),\ a)$

In words: to process string $wa$, first process $w$ from state $q$, then apply $\delta$ on symbol $a$.

**Acceptance**: DFA $M$ accepts string $w$ if and only if:

$$\hat{\delta}(q_0, w) \in F$$

Starting from $q_0$ and processing all of $w$ lands in an accepting state.

**Language of $M$**:

$$L(M) = \{w \in \Sigma^* \mid \hat{\delta}(q_0, w) \in F\}$$

### 3.3.4 Building a DFA: Worked Example

**Task**: Design a DFA over $\{a, b\}$ that accepts exactly the strings ending with `ab`.

**State design**: Think about what information the DFA needs to remember at any point. To know whether the last two characters were `ab`, the DFA only needs to track what the last character seen was (if anything). Three cases cover everything:

| State | Meaning |
|-------|---------|
| $q_0$ | Start; haven't seen `a` yet, or last character was `b` with no preceding `a` |
| $q_1$ | Last character seen was `a` |
| $q_2$ | Last two characters were `ab` — **accepting** |

**Transition function**:

| State | On `a` | On `b` |
|-------|--------|--------|
| $q_0$ | $q_1$ | $q_0$ |
| $q_1$ | $q_1$ | $q_2$ |
| $q_2$ | $q_1$ | $q_0$ |

**The 5-tuple**: $M = (\{q_0, q_1, q_2\},\ \{a,b\},\ \delta,\ q_0,\ \{q_2\})$ where $\delta$ is given by the table.

### 3.3.5 Tracing Execution

Always trace from the start state, applying the transition function one symbol at a time.

**Does $M$ accept `aab`?**

$$q_0 \xrightarrow{a} q_1 \xrightarrow{a} q_1 \xrightarrow{b} q_2$$

Final state $q_2 \in F$. **Accept** ✓

**Does $M$ accept `aba`?**

$$q_0 \xrightarrow{a} q_1 \xrightarrow{b} q_2 \xrightarrow{a} q_1$$

Final state $q_1 \notin F$. **Reject** ✗

**Does $M$ accept `ab`?**

$$q_0 \xrightarrow{a} q_1 \xrightarrow{b} q_2$$

Final state $q_2 \in F$. **Accept** ✓

**Does $M$ accept `b`?**

$$q_0 \xrightarrow{b} q_0$$

Final state $q_0 \notin F$. **Reject** ✗

### 3.3.6 State Diagrams

DFAs are usually drawn as directed graphs:
- Circles represent states
- Labeled directed edges represent transitions
- The start state has an unlabeled incoming arrow
- Accepting states are drawn with double circles

Try it interactively:

<DFAEmbed />

Read the visualization using the formal DFA tuple $M = (Q, \Sigma, \delta, q_0, F)$:

- $Q$ is the set of circles (states)
- $\Sigma$ is the alphabet (symbols labeling the edges)
- $q_0$ is the unique start state (the one with an incoming arrow from nowhere)
- $F$ is the set of accepting states (double circles)

View the DFA as a **transition graph** $G = (Q, E)$ where each directed edge $(q, a, p)$ means $\delta(q, a) = p$. In the diagram, an arrow from $q$ to $p$ labeled $a$ means exactly $\delta(q, a) = p$.

In a complete DFA, every state has exactly one outgoing edge for each symbol in $\Sigma$.

When you click **Step**, the simulator evaluates one transition $q_{i+1} = \delta(q_i, a_i)$ and highlights the corresponding edge. The input is accepted if and only if the final highlighted state is in $F$.

### 3.3.7 Another Example: Divisibility by 3

**Task**: Design a DFA over $\{0, 1\}$ that accepts binary strings whose value is divisible by 3.

**Key insight**: The remainder of a binary number modulo 3 is all the DFA needs to track. There are three possible remainders: 0, 1, 2.

**Transition rule**: If the current remainder is $r$ and we read bit $b$, the new number is $2r + b$. Its remainder mod 3 is $(2r + b) \bmod 3$.

| State (remainder) | On `0` | On `1` |
|-------------------|--------|--------|
| $q_0$ (rem 0) | $q_0$ | $q_1$ |
| $q_1$ (rem 1) | $q_2$ | $q_0$ |
| $q_2$ (rem 2) | $q_1$ | $q_2$ |

**Accepting**: $F = \{q_0\}$ (remainder 0 means divisible by 3).

**Trace**: Does `110` (= 6) get accepted?

$$q_0 \xrightarrow{1} q_1 \xrightarrow{1} q_0 \xrightarrow{0} q_0$$

Final state $q_0 \in F$. **Accept** ✓ (6 is divisible by 3)

**Trace**: Does `101` (= 5) get accepted?

$$q_0 \xrightarrow{1} q_1 \xrightarrow{0} q_2 \xrightarrow{1} q_2$$

Final state $q_2 \notin F$. **Reject** ✗ (5 is not divisible by 3)

**Observation**: The DFA computes remainder-mod-3 *implicitly* — each state encodes one remainder. This pattern generalizes: any language whose membership depends on a computable finite summary of the input can be recognized by a DFA with one state per summary value.


## 3.4 Nondeterministic Finite Automata (NFA)

### 3.4.1 Motivation

DFAs are efficient to execute but awkward to construct directly from regular expressions. The problem is that DFA design often requires anticipating future input: "is the next symbol the start of pattern $P$, or just part of the preamble?"

NFAs relax this by allowing:

1. **Multiple possible transitions** for the same state and input symbol
2. **Epsilon ($\epsilon$) transitions** that move between states without consuming input

An NFA can "guess" which branch to follow. It accepts an input if **any** sequence of choices leads to an accepting state.

This sounds computationally expensive, but it turns out that every NFA can be converted to an equivalent DFA (Section 3.5.2). NFAs are not more powerful — they are just more convenient to design with.

### 3.4.2 Formal Definition

**Definition (NFA)**: A nondeterministic finite automaton is a 5-tuple:

$$N = (Q,\ \Sigma,\ \Delta,\ q_0,\ F)$$

where:
- $Q$, $\Sigma$, $q_0$, $F$ are as in a DFA
- $\Delta : Q \times (\Sigma \cup \{\epsilon\}) \to \mathcal{P}(Q)$ is the **transition relation**

Here $\mathcal{P}(Q)$ is the power set of $Q$ — the set of all subsets of $Q$. So $\Delta(q, a)$ returns a **set** of states (possibly empty), not a single state.

**Key differences from a DFA**:
- $\Delta(q, a)$ may return $\emptyset$ (dead end), a single state, or multiple states
- $\Delta(q, \epsilon)$ may be nonempty — $\epsilon$-transitions move "for free"

### 3.4.3 Epsilon-Closure

Before we can define acceptance for NFAs, we need to handle $\epsilon$-transitions carefully.

**Definition ($\epsilon$-closure)**: For a set of states $S \subseteq Q$, the $\epsilon$-closure $E(S)$ is the set of all states reachable from any state in $S$ using zero or more $\epsilon$-transitions.

```
E(S):
  result ← S
  while result is still changing:
    for each q in result:
      result ← result ∪ Δ(q, ε)
  return result
```

**Example**: Suppose $\Delta(q_0, \epsilon) = \{q_1\}$ and $\Delta(q_1, \epsilon) = \{q_2\}$.

Then $E(\{q_0\}) = \{q_0, q_1, q_2\}$ — we follow all $\epsilon$-transitions transitively.

### 3.4.4 Extended Transition for NFAs

We extend $\Delta$ to process entire strings, tracking sets of states instead of individual states.

**Definition**: $\hat{\Delta} : \mathcal{P}(Q) \times \Sigma^* \to \mathcal{P}(Q)$

- $\hat{\Delta}(S, \epsilon) = E(S)$
- $\hat{\Delta}(S, wa) = E\!\left(\bigcup_{q \in \hat{\Delta}(S,\,w)} \Delta(q, a)\right)$

In words: to process $wa$ from state set $S$, first process $w$ to get some state set $T$, then apply $\Delta(\cdot, a)$ to every state in $T$ and collect all results, then take the $\epsilon$-closure of everything collected.

**Acceptance**: NFA $N$ accepts $w$ if:

$$\hat{\Delta}(E(\{q_0\}), w) \cap F \neq \emptyset$$

At least one reachable state after processing $w$ is accepting.

### 3.4.5 NFA Example: Contains `ab`

**Task**: Build an NFA over $\{a, b\}$ that accepts strings containing the substring `ab`.

**Formal Definition**: $N = (\{q_0, q_1, q_2\},\ \{a, b\},\ \Delta,\ q_0,\ \{q_2\})$

**Transition Relation**:
- $\Delta(q_0, a) = \{q_0, q_1\}$
- $\Delta(q_0, b) = \{q_0\}$
- $\Delta(q_1, b) = \{q_2\}$
- $\Delta(q_2, a) = \{q_2\}$
- $\Delta(q_2, b) = \{q_2\}$

All transitions not listed return $\emptyset$.

**Trace**: Does this NFA accept `aab`?

1. Start: $S_0 = E(\{q_0\}) = \{q_0\}$
2. Read `a`: $S_1 = E(\Delta(q_0, a)) = E(\{q_0, q_1\}) = \{q_0, q_1\}$
3. Read `a`: apply $\Delta(\cdot, a)$ to each state in $\{q_0, q_1\}$:
   - $\Delta(q_0, a) = \{q_0, q_1\}$
   - $\Delta(q_1, a) = \emptyset$
   - $S_2 = E(\{q_0, q_1\} \cup \emptyset) = \{q_0, q_1\}$
4. Read `b`: apply $\Delta(\cdot, b)$ to each state in $\{q_0, q_1\}$:
   - $\Delta(q_0, b) = \{q_0\}$
   - $\Delta(q_1, b) = \{q_2\}$
   - $S_3 = E(\{q_0, q_2\}) = \{q_0, q_2\}$

Since $q_2 \in F$ and $q_2 \in S_3$, the NFA **accepts**. ✓

### 3.4.6 Interactive NFA Visualization

<NFAEmbed />

Read the visualization using the NFA tuple $N = (Q, \Sigma, \Delta, q_0, F)$:

- Active circles show the **current reachable state set** $S_i \subseteq Q$
- An edge $q \xrightarrow{a} p$ means $p \in \Delta(q, a)$
- Edges labeled $\epsilon$ represent transitions that move without consuming input

Each **Step** computes one expansion:

$$S_{i+1} = E\!\left(\bigcup_{q \in S_i} \Delta(q, a_i)\right)$$

The simulator highlights the move-on-$a_i$ step followed by the $\epsilon$-closure. The input is accepted if and only if the final active-state set intersects $F$.

### 3.4.7 Why NFAs Are Easier to Build

To understand why compilers use NFAs as an intermediate step, consider the language of strings over $\{a, b\}$ that **end with** `ab`.

#### The NFA Approach: Mechanical Construction
NFAs allow **nondeterminism**, which means the machine can "guess" or follow multiple paths at once. This makes construction mechanical: you simply draw the pattern you want to match.

For the pattern `ab`, we create three states:
- $q_0$: The "preamble" state (we haven't matched the final `ab` yet).
- $q_1$: We just saw `a` (maybe it's the start of the final `ab`).
- $q_2$: We just saw `ab` (**Accepting**).

The transitions are straightforward:
$$\begin{aligned}
\Delta(q_0, a) &= \{q_0, q_1\} && \text{(stay in preamble OR start matching } ab\text{)} \\
\Delta(q_0, b) &= \{q_0\} && \text{(stay in preamble)} \\
\Delta(q_1, b) &= \{q_2\} && \text{(complete the match)}
\end{aligned}$$

#### The DFA Approach: Explicit State Tracking
In a DFA, we cannot "guess." We must explicitly track our progress. If we see an `a`, we move to a state representing "last seen was `a`." If we see another `a`, we stay there. If we see a `b`, we move to "last seen was `ab`." But from that state, if we see another `a`, we must know to go back to "last seen was `a`" (because that `a` could start a new `ab`).

| Feature | NFA construction | DFA construction |
| :--- | :--- | :--- |
| **Logic** | Mechanical: Follow the pattern. | Analytical: Track all possible prefixes. |
| **Complexity** | $O(n)$ states for pattern length $n$. | Can require complex "fallback" transitions. |
| **Guessing** | Enabled: Can be in $\{q_0, q_1\}$ simultaneously. | Disabled: Must be in exactly one state. |

**Takeaway**: Humans (and Thompson's algorithm) find it easy to build NFAs because they only require looking *forward* at the pattern. DFAs are harder because they require looking *backward* to handle every possible mismatch.


## 3.5 The Equivalence Theorem

### 3.5.1 Statement

The following four models are mathematically equivalent. If a language can be described by one, it can be described by all:

1. **Regular Languages**: Defined by set operations ($\cup$, concatenation, $^*$).
2. **Regular Expressions**: The notation humans use to specify patterns.
3. **Nondeterministic Finite Automata (NFA)**: The mechanical intermediate step.
4. **Deterministic Finite Automata (DFA)**: The high-performance implementation.

**Why this matters**: You can choose whichever representation is most convenient for a given task. Regex are best for specification. DFAs are best for execution. NFAs are best for construction.

### 3.5.2 Building the Pipeline (High Level)

To make this theorem practical for compilers, we use two fundamental constructions:

1. **Thompson's Construction (Regex → NFA)**: A systematic way to build an NFA by combining small fragments for each regex operator. It is fast and produces machines that are roughly the size of the original expression.
2. **Subset Construction (NFA → DFA)**: An algorithm that "simulates" the NFA by tracking all possible states it could be in simultaneously. This produces a DFA that can be executed in $O(1)$ time per character.

We will study these algorithms in full detail in **Chapter 4**.


## 3.6 DFA vs. NFA: A Precise Comparison

| Property | DFA | NFA |
| :--- | :--- | :--- |
| **Transition function** | $\delta: Q \times \Sigma \to Q$ | $\Delta: Q \times (\Sigma \cup \{\epsilon\}) \to \mathcal{P}(Q)$ |
| **Epsilon ($\epsilon$) moves** | Not allowed | Allowed (move without input) |
| **Execution** | Exactly one active state | A set of possible active states |
| **Construction** | Requires global analysis | Mechanical (Thompson's algorithm) |
| **Performance** | $O(1)$ per character | $O(|Q|)$ per character |
| **State Count** | Can be exponentially larger | Linear to the regex length |


## 3.7 Finite Automata in Lexical Analysis

### 3.7.1 The lexer Generation Pipeline

The journey from a programmer's intent to a running scanner follows a strict, automated pipeline:

1. **Specification**  
   The user defines token patterns using **Regular Expressions** (e.g., `[0-9]+`).
2. **NFA Generation**  
   The generator uses **Thompson's Construction** to turn those regexes into an NFA. This is a mechanical process that "glues" state machine fragments together.
3. **DFA Conversion**  
   The **Subset Construction** algorithm converts the NFA into a DFA. This eliminates nondeterminism and "guesses," producing a machine that is much faster to run.
4. **Minimization**  
   **DFA Minimization** merges redundant states, ensuring the final machine uses the minimum possible memory.
5. **Code Emission**  
   The generator outputs source code (Zig, C, etc.) that implements the minimized DFA as a fast transition table or `switch` statement.

Tools like **Lex**, **Flex**, and **ANTLR** automate these steps, allowing you to focus on the token patterns rather than the state machine logic.


## 3.8 Chapter Summary

This chapter introduced the two machines that bridge the gap between mathematical regular expressions and executable code.

- **DFA**: Fast to execute, harder to construct directly.
- **NFA**: Easy to construct from regex, slower to simulate directly.

The **Equivalence Theorem** guarantees that we can move between these representations without losing expressive power. **Chapter 4** will dive into the specific algorithms (Thompson and Subset Construction) that automate these transitions.


## 3.9 Exercises

### DFA Fundamentals

**1.** For each of the following languages over $\{a, b\}$, design a DFA. Give the formal 5-tuple and draw the state diagram.

a. Strings with an even number of $a$'s  
b. Strings containing the substring `aba`  
c. Strings where the number of $a$'s is divisible by 3  
d. Strings where every $a$ is immediately followed by a $b$

**2.** Given this DFA:

```
States: {q₀, q₁, q₂}    Start: q₀    Accepting: {q₂}

δ(q₀, a) = q₁    δ(q₀, b) = q₀
δ(q₁, a) = q₂    δ(q₁, b) = q₀
δ(q₂, a) = q₂    δ(q₂, b) = q₂
```

Trace execution on each input and state the outcome:

a. `aa`  
b. `aba`  
c. `baa`  
d. `bab`

**3.** Describe (in English) the language recognized by the DFA in Exercise 2. Then write a regular expression for the same language.

### NFA Construction

**4.** Build an NFA for each language. You may use $\epsilon$-transitions.

a. Strings over $\{a, b\}$ ending with `ba`  
b. Strings over $\{0, 1\}$ containing `101` as a substring  
c. Strings over $\{a, b\}$ where the third-to-last character is `a`

**5.** For the NFA in part (c) of Exercise 4, trace execution on `aabab`. Show the active state set after each input symbol.

**6.** Explain in your own words why NFAs are easier to construct directly from a regular expression than DFAs. Use the example of `(a|b)*abb` to illustrate.

### DFA vs. NFA

**7.** Fill in the comparison table and justify each entry:

| Property | DFA | NFA |
|----------|-----|-----|
| Transition function type | | |
| $\epsilon$-transitions | | |
| Execution speed | | |
| Ease of construction from regex | | |
| Expressive power | | |

**8.** Given that NFAs can be exponentially more compact than DFAs, argue both for and against using NFAs directly as lexer implementations (without converting to DFA first).

### lexer Pipeline

**9.** Describe what happens step-by-step when a lexer generator compiles the following token specification. What does each phase of the pipeline produce?

```
KEYWORD  : if | else | while
IDENT    : [A-Za-z][A-Za-z0-9]*
INT      : [0-9]+
SPACE    : [ \t\n]+
```

**10.** A programmer writes a lexer specification where the identifier pattern `[A-Za-z_][A-Za-z0-9_]*` appears before the keyword patterns `if`, `while`, `return`.

a. What will happen when the lexer encounters the input `if`?  
b. How should the specification be ordered to fix this?  
c. What general rule does this illustrate about lexer priority?

**11.** Explain the maximal munch rule. For each of the following inputs, determine what tokens a lexer produces using maximal munch (assume standard C-like token patterns):

a. `<=>`  
b. `count42`  
c. `===`  
d. `ifcount`

### Advanced

**12.** **Theoretical**: Prove that if $L$ is a regular language recognized by an $n$-state DFA, then either $L$ is finite or $L$ is infinite and contains a string of length between $n$ and $2n$. (Hint: consider what happens when you trace a path of length exactly $n$ through the DFA.)
