---
layout: blog
title: "Thompson's Construction and Subset Algorithm"
date: "2026-04-02"
author: "Aiko Schurmann"
description: "Master the algorithmic core of lexer generation: converting regex to NFA and NFA to efficient DFA."
tags:
  - "AUTOMATA"
  - "Optional"
chapterTitle: "Thompson's Construction and Subset Algorithm"
---

<script>
  import ThompsonEmbed from '$lib/components/ThompsonEmbed.svelte';
  import SubsetConstructionEmbed from '$lib/components/SubsetConstructionEmbed.svelte';
</script>

## 4.1 Learning Objectives

By the end of this chapter, you should be able to:

- Apply Thompson's construction to convert any regular expression into an equivalent NFA
- Execute the subset construction algorithm to transform an NFA into a DFA
- Compute $\epsilon$-closures and transition sets manually for small automata
- Explain the state-space blowup potential of the subset algorithm
- Minimize a DFA using the state-equivalence partitioning method
- Describe the McNaughton-Yamada approach for direct regex-to-DFA conversion


## 4.2 From Regex to NFA: Thompson's Construction

In a compiler, lexers must quickly recognize tokens from raw source code. Regular expressions are a human-friendly notation, but machines need a graph-based representation to execute a pattern efficiently. **Thompson's Construction** is the standard algorithm for bridging this gap. It is a compositional recipe: it defines how to build an NFA for the simplest possible patterns, and then defines how to "glue" those fragments together to match complex expressions.

### 4.2.1 The Thompson Fragment

Every NFA fragment produced by this construction follows three strict rules:
1. It has exactly one **start state**.
2. It has exactly one **accepting state**.
3. No transitions enter the start state, and no transitions leave the accepting state.

This uniformity makes the algorithm simple to implement: we can treat every sub-expression as a "black box" with one input and one output.

### 4.2.2 Base Cases: Literals and Empty String

The base cases are the building blocks.

**Empty string** — $\epsilon$:
To match the empty string, we move from start to accept without consuming any input.

<ThompsonEmbed mode="\epsilon" />

**Symbol literal** — $a \in \Sigma$:
To match a single symbol $a$ from the alphabet $\Sigma$, we create two states and a transition between them labeled with that symbol.

<ThompsonEmbed mode="literal" />


### 4.2.3 Inductive Steps: Gluing Fragments Together

Complex regexes are built using three main operators: Union, Concatenation, and Kleene Star.

#### Union ($r | s$)
To match *either* pattern $r$ or pattern $s$, we create a new start state that branches into both fragments using $\epsilon$-transitions. When either fragment finishes, they both move to a shared accepting state.
**Why it works**: The machine "guesses" which path to take. If either path leads to an acceptance, the whole union accepts.
For example, the regex `a|b` constructs branches for `a` and `b`.

<ThompsonEmbed mode="union" />

#### Concatenation ($r \cdot s$)
To match $r$ followed by $s$, we point the accepting state of $r$ to the start state of $s$ using an $\epsilon$-transition (or by merging the two states).
**Why it works**: You cannot start matching $s$ until you have successfully finished matching $r$.
For example, the regex `ab` concatenates the fragments for `a` and `b`.

<ThompsonEmbed mode="concat" />

#### Kleene Star ($r^*$)
The star is the most complex. We need to support matching $r$ zero times, one time, or many times.
1. **Zero times**: An $\epsilon$-transition goes directly from the new start to the new accept.
2. **Repeat**: An $\epsilon$-transition goes from the end of $r$ back to the start of $r$.
For example, the regex `a*` allows looping over `a` or skipping it entirely.

<ThompsonEmbed mode="star" />

This construction algorithm yields an NFA for any valid regular expression. Section 4.3 details how to execute this machine deterministically.


## 4.3 From NFA to DFA: The Subset Construction

While Thompson's algorithm is fast, the resulting NFA is slow to simulate directly in a lexer because it can be in many states at once, requiring backtracking or parallel state tracking. We need to convert it into a deterministic finite automaton (DFA), where we are always in exactly **one** state, ensuring $O(|w|)$ execution time for a string $w$.

The **Subset Construction** (also called Powerset Construction) achieves this by creating a DFA where each "state" actually represents a *set* of NFA states. If the NFA has a set of states $Q$, the DFA will have states representing elements of the powerset $2^Q$.

### 4.3.1 The Core Operations

To formally define the algorithm, let an NFA be defined by $(Q, \Sigma, \delta, q_0, F)$. We need two primitive operations over subsets of $Q$:

1. **$\epsilon$-closure($S$)**: The set of all NFA states reachable from a set of states $S$ using *only* $\epsilon$-transitions. This represents "where can I go for free?"
2. **$move(S, a)$**: The set of all NFA states reachable from a set of states $S$ by consuming exactly one symbol $a \in \Sigma$.

### 4.3.2 The Algorithm Walkthrough

The Subset Construction converts an NFA into an equivalent DFA. Since a DFA state is defined by a *set* of NFA states, we build the transition table by exploring all reachable subsets.

**The Procedure**:
1. **Compute the Start State**: The DFA start state $S_0$ is the $\epsilon$-closure($\{q_0\}$).
2. **Initialize Worklist**: Add $S_0$ to a queue of unvisited DFA states.
3. **Explore Transitions**: While the worklist is not empty:
   - Pop a DFA state $S$.
   - For every symbol $a \in \Sigma$:
     - Apply $move(S, a)$ to see where the NFA can go.
     - Compute the $\epsilon$-closure($move(S, a)$) to get a target set $T$.
     - If $T \notin \text{seen\_states}$, add it to our worklist as a **new DFA state**.
     - Record the transition in the DFA: from state $S$, symbol $a$ transitions to state $T$.
4. **Accepting States**: A DFA state $S$ is accepting if $S \cap F \neq \emptyset$.

### 4.3.3 Worked Example: `(a|b)*ab`

Let's trace the construction for an NFA that accepts strings ending in `ab`. 
Assume the NFA alphabet is $\Sigma = \{\text{a}, \text{b}\}$. Let the subset of relevant NFA states be $Q = \{q_0, q_1, q_2\}$, with start state $q_0$ and accepting state $F = \{q_2\}$.

#### Step 1: Initialize
The DFA start state A is the $\epsilon$-closure($\{q_0\}$). Assuming there are no $\epsilon$-transitions from $q_0$ in this simplified view, A $= \{q_0\}$.

#### Step 2: Expand State A ($ \{q_0\} $)
- **On symbol `a`**: 
  - $move(\{q_0\}, \text{a}) = \{q_0, q_1\}$
  - $\epsilon$-closure($\{q_0, q_1\}$) $= \{q_0, q_1\}$. This is new! Let's call it **State B**.
- **On symbol `b`**: 
  - $move(\{q_0\}, \text{b}) = \{q_0\}$
  - $\epsilon$-closure($\{q_0\}$) $= \{q_0\}$. This is just **State A** again.

#### Step 3: Expand State B ($ \{q_0, q_1\} $)
- **On symbol `a`**:
  - $move(\{q_0, q_1\}, \text{a}) = \{q_0, q_1\}$ (from $q_0 \to \{q_0, q_1\}$ and $q_1 \to \emptyset$)
  - $\epsilon$-closure($\{q_0, q_1\}$) $= \{q_0, q_1\}$. Still **State B**.
- **On symbol `b`**:
  - $move(\{q_0, q_1\}, \text{b}) = \{q_0, q_2\}$ (from $q_0 \to \{q_0\}$ and $q_1 \to \{q_2\}$)
  - $\epsilon$-closure($\{q_0, q_2\}$) $= \{q_0, q_2\}$. New state! Let's call it **State C**.

#### Step 4: Expand State C ($ \{q_0, q_2\} $)
- **On symbol `a`**: $move(\{q_0, q_2\}, \text{a}) \to \{q_0, q_1\} \xrightarrow{\epsilon\text{-closure}} \{q_0, q_1\}$ (**State B**).
- **On symbol `b`**: $move(\{q_0, q_2\}, \text{b}) \to \{q_0\} \xrightarrow{\epsilon\text{-closure}} \{q_0\}$ (**State A**).

**Resulting DFA**:
The table is now complete. State C is accepting because it contains the NFA's accepting state $q_2$. 

The following table summarizes the subset construction transitions.

| State | Set | On `a` | On `b` |
| --- | --- | --- | --- |
| A | $\{q_0\}$ | B | A |
| B | $\{q_0, q_1\}$ | B | C |
| C | $\{q_0, q_2\}$ | B | A |

<SubsetConstructionEmbed mode="graph" />

This gives us a working DFA. However, this generated machine might contain redundant states. Section 4.4 details how to optimize it.


## 4.4 DFA Minimization

A generated DFA often contains more states than strictly necessary to recognize its language. Redundant states bloat the memory footprint of a lexer. **Minimization** algorithms merge these equivalent states to produce the smallest possible DFA.

### 4.4.1 The Partitioning Method

Two states are equivalent if, for every possible input string, they both lead to an accepting state or both lead to a non-accepting state. The state-equivalence partitioning method works by "splitting" states into groups:

1. **Initial Split**: Separate all states of $Q$ into two groups: accepting states $F$ and non-accepting states $Q \setminus F$.
2. **Refine**: For each group, check if all states in that group transition to the *same target groups* for every symbol $a \in \Sigma$.
   - If State 1 transitions to Group A on $a$, but State 2 transitions to Group B on $a$, then State 1 and 2 are distinguishable. **Split them**.
3. **Finalize**: Repeat until no more splits are possible. Each remaining group becomes a single state in the final minimal DFA.

As a quick example, if states $q_1$ and $q_2$ both transition to state $q_3$ on all inputs, and both are accepting, they can be merged.

**Theorem**: For any regular language, there exists a unique minimal DFA up to isomorphism. $\blacksquare$

**Proof:**
By the Myhill-Nerode theorem, the states of the minimal DFA correspond one-to-one with the equivalence classes of the language's indistinguishability relation. Since this relation is uniquely determined by the language itself, the minimal DFA is uniquely determined.
$\blacksquare$

### 4.4.2 Why it Matters
A minimized DFA is the "gold standard" for lexical analysis. It is:
- **Fast**: Exactly one array lookup per character.
- **Small**: Uses the minimum possible memory.
- **Predictable**: No matter how complex the regex, the execution time is strictly $O(|w|)$.

While the NFA-to-DFA pipeline is standard, there are direct construction methods, as we will see in Section 4.5.


## 4.5 Direct Regex to DFA (McNaughton-Yamada)

While the classic pipeline (Regex $\to$ NFA $\to$ DFA) is highly modular, it is not the only approach. In some cases, building an intermediate NFA introduces unnecessary overhead.

The **McNaughton-Yamada algorithm** constructs a DFA directly from a regular expression. It works by converting the regex into an abstract syntax tree (AST) and computing `followpos` sets—which specify the positions in the AST that can validly immediately follow another position.

### 4.5.1 The Syntax Tree Approach

1. **Augment the Regex**: We append a unique end marker, often `#`, so the regex becomes $(r) \cdot \#$.
2. **Build the AST**: Leaf nodes are symbols from $\Sigma \cup \{\#\}$; inner nodes are operations ($\cdot, \cup, ^*$).
3. **Compute Attributes**: For each node, we compute:
   - `nullable`: Can this sub-expression match the empty string $\epsilon$?
   - `firstpos`: The set of positions that can match the first symbol of a string generated by this node.
   - `lastpos`: The set of positions that can match the last symbol.
   - `followpos`: Computed from the tree, determining which positions can follow a given position.
4. **Construct DFA States**: The subsets of positions become the DFA states, starting with the `firstpos` of the root. For example, in the augmented regex $(a \cdot b) \cdot \#$, the position for $b$ is in the `followpos` set of the position for $a$.

### 4.5.2 Pipeline Comparison

The following table contrasts the two approaches.

| Feature | Regex $\to$ NFA $\to$ DFA | Direct Regex $\to$ DFA |
| --- | --- | --- |
| **Intermediate State Count** | High (creates many NFA states and $\epsilon$-transitions) | None (skips NFA generation entirely) |
| **Implementation Complexity**| Modular, easy to build step-by-step | Requires building and traversing an abstract syntax tree |
| **Typical Use Cases** | Teaching, standard compiler lexer generators | Highly optimized pattern matchers, historic tools |

Historically, the direct approach was used in foundational Unix tools like `awk` and `egrep` because it avoids the memory overhead of NFA generation and tends to produce more compact automata. 

*References: Aho, Sethi, Ullman & Lam, "Compilers: Principles, Techniques, and Tools", 2nd ed., §3.9.5; McNaughton R.F. & Yamada H., "Regular expressions and state graphs for automata", IRE Trans. on Electronic Computers EC-9 (March 1960), pp. 38–47.*

Having covered both NFA-based and direct DFA constructions, we can now summarize our findings in Section 4.6.


## 4.6 Chapter Summary

This chapter explored the transition from theory to implementation:
- **Thompson's Construction** turns a regex into an NFA using a simple "Lego-brick" approach.
- **Subset Construction** eliminates the "guessing" of NFAs by tracking all possibilities simultaneously, creating a DFA.
- **Minimization** cleans up the result, producing the most efficient possible recognizer.
- **McNaughton-Yamada Algorithm** provides an alternative by computing the DFA directly from the regex's abstract syntax tree.

In Chapter 5, we will encounter context-free grammars and a more powerful machine class, pushdown automata, which are essential for parser design. Before moving on, you can test your understanding of automata constructions in Section 4.7.


## 4.7 Exercises

### Thompson's Construction

**1.** Apply Thompson's construction to the regular expression `(ab|c)*`. Draw each intermediate NFA fragment and show how they combine.

**2.** Apply Thompson's construction to the regular expression `(a|b)*abb` step by step. Label all states and transitions, including $\epsilon$-transitions.

### Subset Construction

**3.** Apply subset construction to convert the following NFA to a DFA.

- $(Q, \Sigma, \delta, q_0, F)$ definition:
- $Q = \{p, q, r\}$
- $\Sigma = \{0, 1\}$
- $\delta$ transitions are defined below
- $q_0 = p$
- $F = \{r\}$

**Transition Relation $\delta$**:
- $\delta(p, 0) = \{p, q\}$
- $\delta(p, 1) = \{p\}$
- $\delta(q, 1) = \{r\}$
- All others are $\emptyset$.

Give the full transition table for the resulting DFA and identify the accepting states.

**4.** The subset construction can produce a DFA with up to $2^{|Q|}$ states from an NFA with state set $Q$. Construct an example NFA with 4 states for which the subset construction produces a DFA with exactly 8 reachable states.

**5.** Is it possible for an NFA with state set $Q$ (where $|Q| = n$) to result in a 1-state DFA? If so, give an example.

### DFA Minimization

**6.** Trace the state-equivalence partitioning algorithm on a DFA that recognizes `(a|b)*a`.

**7.** **DFA Minimization**: The language $L = \{a\}^*$ can be recognized by a DFA with just 2 states (one accepting, one error). Suppose you have a 100-state DFA that also recognizes $L$. Explain intuitively why all 98 extra states can be merged, and what the Myhill–Nerode theorem says about the minimal DFA.
