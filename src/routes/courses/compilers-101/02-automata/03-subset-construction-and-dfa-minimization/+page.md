---
layout: blog
title: "Thompson's Construction and Subset Algorithm"
date: "2026-04-02"
author: "Aiko Schurmann"
description: "Master the algorithmic core of lexer generation: converting regex to NFA and NFA to efficient DFA."
tag: "AUTOMATA"
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


## 4.2 From Regex to NFA: Thompson's Construction

As we saw in Chapter 3, regular expressions are convenient for humans, but machines need finite automata for execution. Thompson's construction is the bridge. It provides a systematic, compositional recipe for building an NFA from any regular expression.

### 4.2.1 The Compositional Property

The key property of Thompson's construction is that each regular expression operator corresponds to a simple way of combining NFA fragments. Each fragment has exactly one start state and one accepting state.

### 4.2.2 Base Cases

**epsilon** — $\epsilon$:

Create a fragment with two states, $q_S$ and $q_A$, and one transition $q_S \xrightarrow{\epsilon} q_A$. That transition consumes no input, so the machine can accept immediately.

<ThompsonEmbed mode="epsilon" />


### 4.2.3 Inductive Steps

**Union** — $r \mid s$:

Create fresh wrapper states $q_S$ and $q_A$. Add $\epsilon$ transitions $q_S \to r_S$ and $q_S \to s_S$ so execution can branch into either fragment. Then add $\epsilon$ transitions $r_A \to q_A$ and $s_A \to q_A$ so both branches merge into one accepting state.

<ThompsonEmbed mode="union" />

**Concatenation** — $rs$:

Connect the two fragments in sequence by merging $r_A$ with $s_S$, or by adding an $\epsilon$ transition $r_A \to s_S$. The combined fragment starts at $r_S$ and accepts at $s_A$.

<ThompsonEmbed mode="concat" />

**Kleene star** — $r^*$:

Create fresh wrapper states $q_S$ and $q_A$. Add $\epsilon$ transitions $q_S \to q_A$ (zero copies) and $q_S \to r_S$ (start one copy). From $r_A$, add $\epsilon$ transitions $r_A \to r_S$ (repeat) and $r_A \to q_A$ (stop).

<ThompsonEmbed mode="star" />


## 4.3 From NFA to DFA: The Subset Construction

While Thompson's construction is efficient (producing an NFA with $O(|r|)$ states), NFAs are slower to simulate because they can be in multiple states at once. The **subset construction** (or powerset construction) converts an NFA into an equivalent DFA.

### 4.3.1 The Core Idea

The DFA tracks the *set* of all states the NFA could possibly be in after reading a given prefix. Since an NFA with $n$ states has $2^n$ possible subsets of states, the resulting DFA has a finite (though potentially large) number of states.

### 4.3.2 The Algorithm

**Input**: NFA $N = (Q_N, \Sigma, \Delta, q_0, F_N)$  
**Output**: DFA $D = (Q_D, \Sigma, \delta, S_0, F_D)$

1. **Start state**: $S_0 = E(\{q_0\})$, where $E(S)$ is the $\epsilon$-closure.
2. **Worklist**: $Q_D = \{S_0\}$, and keep a list of "unmarked" states.
3. **Loop**: While there is an unmarked state $S \in Q_D$:
   - Mark $S$.
   - For each symbol $a \in \Sigma$:
     - Compute $T = E(\bigcup_{q \in S} \Delta(q, a))$.
     - If $T \notin Q_D$, add $T$ to $Q_D$ as an unmarked state.
     - Set $\delta(S, a) = T$.
4. **Accepting states**: $F_D = \{S \in Q_D \mid S \cap F_N \neq \emptyset\}$.

### 4.3.3 Worked Example

Convert the NFA for `(a|b)*ab` to a DFA.

NFA states: $\{q_0, q_1, q_2\}$ where $q_0$ is start and $q_2$ is accepting.

| DFA state | On `a` | On `b` |
|-----------|--------|--------|
| $A: \{q_0\}$ | $\{q_0, q_1\} (B)$ | $\{q_0\} (A)$ |
| $B: \{q_0, q_1\}$ | $\{q_0, q_1\} (B)$ | $\{q_0, q_2\} (C)$ |
| $C: \{q_0, q_2\}$ | $\{q_0, q_1\} (B)$ | $\{q_0\} (A)$ |

Accepting states: Any set containing $q_2$, which is just $C$.

<SubsetConstructionEmbed mode="graph" />


## 4.4 DFA Minimization

A DFA produced by subset construction often contains redundant states. Two states are **indistinguishable** if for every possible future string $w$, both states lead to either an accepting state or both lead to a rejecting state.

### 4.4.1 Partitioning Algorithm

1. Start with two partitions: $P_1 = F$ (accepting) and $P_2 = Q \setminus F$ (rejecting).
2. For each partition $P_i$:
   - Split $P_i$ into smaller groups such that states in the same group move to the same partitions for every symbol $a \in \Sigma$.
3. Repeat step 2 until no more splits occur.
4. Each final group becomes a single state in the minimized DFA.

### 4.4.2 Why Minimization Matters

In a production compiler, the lexer DFA can have hundreds of states. Minimization reduces the memory footprint of the transition table, which is critical for cache performance during scanning.


## 4.5 Chapter Summary

This chapter detailed the two primary algorithms that power lexer generators:

- **Thompson's Construction**: A compositional approach to turn regex into NFAs.
- **Subset Construction**: A way to turn nondeterministic machines into deterministic ones, enabling $O(1)$ transitions per character.
- **Minimization**: Ensuring the resulting DFA is as small as possible.

In Chapter 5, we will take these minimized DFAs and look at how they are actually implemented in code—moving from mathematical tuples to high-performance C or Zig scanners.


## 4.6 Exercises

### Thompson's Construction

**1.** Apply Thompson's construction to the regular expression `(ab|c)*`. Draw each intermediate NFA fragment and show how they combine.

**2.** Apply Thompson's construction to the regular expression `(a|b)*abb` step by step. Label all states and transitions, including $\epsilon$-transitions.

### Subset Construction

**3.** Apply subset construction to convert the following NFA to a DFA.

- $Q = \{p, q, r\}$
- $\Sigma = \{0, 1\}$
- $q_0 = p$
- $F = \{r\}$

**Transition Relation $\Delta$**:
- $\Delta(p, 0) = \{p, q\}$
- $\Delta(p, 1) = \{p\}$
- $\Delta(q, 1) = \{r\}$
- All others are $\emptyset$.

Give the full transition table for the resulting DFA and identify the accepting states.

**4.** The subset construction can produce a DFA with up to $2^n$ states from an $n$-state NFA. Construct an example NFA with 4 states for which the subset construction produces a DFA with exactly 8 reachable states.

**5.** Is it possible for an $n$-state NFA to result in a 1-state DFA? If so, give an example.

### DFA Minimization

**6.** Trace the state-equivalence partitioning algorithm on a DFA that recognizes `(a|b)*a`.

**7.** **DFA Minimization**: The language `a*` can be recognized by a DFA with just 2 states (one accepting, one error). Suppose you have a 100-state DFA that also recognizes `a*`. Explain intuitively why all 98 extra states can be merged, and what the Myhill–Nerode theorem says about the minimal DFA.
