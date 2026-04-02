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

Regular expressions are a human-friendly notation, but machines need a graph-based representation to "run" a pattern. **Thompson's Construction** is the standard algorithm for bridging this gap. It is a compositional recipe: it defines how to build an NFA for the simplest possible patterns, and then defines how to "glue" those fragments together to match complex expressions.

### 4.2.1 The Thompson Fragment

Every NFA fragment produced by this construction follows three strict rules:
1. It has exactly one **start state**.
2. It has exactly one **accepting state**.
3. No transitions enter the start state, and no transitions leave the accepting state.

This uniformity is what makes the algorithm simple to implement: we can treat every sub-expression as a "black box" with one input and one output.

### 4.2.2 Base Cases: Literals and Epsilon

The base cases are the building blocks.

**Epsilon** — $\epsilon$:
To match the empty string, we move from start to accept without consuming any input.
<ThompsonEmbed mode="epsilon" />

**Symbol literal** — $a$:
To match a single symbol, we create two states and a transition between them labeled with that symbol.
<ThompsonEmbed mode="literal" />


### 4.2.3 Inductive Steps: Gluing Fragments Together

Complex regexes are built using three main operators: Union, Concatenation, and Kleene Star.

#### Union ($r \mid s$)
To match *either* pattern $r$ or pattern $s$, we create a new start state that branches into both fragments using $\epsilon$-transitions. When either fragment finished, they both move to a shared accepting state.
**Why it works**: The machine "guesses" which path to take. If either path leads to an acceptance, the whole union accepts.
<ThompsonEmbed mode="union" />

#### Concatenation ($rs$)
To match $r$ followed by $s$, we simply point the accepting state of $r$ to the start state of $s$ using an $\epsilon$-transition (or by merging the two states).
**Why it works**: You cannot start matching $s$ until you have successfully finished matching $r$.
<ThompsonEmbed mode="concat" />

#### Kleene Star ($r^*$)
The star is the most complex. We need to support matching $r$ zero times, one time, or many times.
1. **Zero times**: An $\epsilon$-transition goes directly from the new start to the new accept.
2. **Repeat**: An $\epsilon$-transition goes from the end of $r$ back to the start of $r$.

<ThompsonEmbed mode="star" />


## 4.3 From NFA to DFA: The Subset Construction

While Thompson's algorithm is fast, the resulting NFA is slow to run because it can be in many states at once. We need to convert it into a DFA, where we are always in exactly **one** state.

The **Subset Construction** (also called Powerset Construction) does this by creating a DFA where each "state" actually represents a *set* of NFA states.

### 4.3.1 The Core Operations

To understand the algorithm, we need two primitive operations:

1. **$\epsilon$-closure($S$)**: The set of all NFA states reachable from set $S$ using *only* $\epsilon$-transitions. You can think of this as "where can I go for free?"
2. **move($S, a$)**: The set of all NFA states reachable from set $S$ by consuming exactly one symbol $a$.

### 4.3.2 The Algorithm Walkthrough

The Subset Construction converts an NFA $N$ into an equivalent DFA $D$. Since a DFA state is defined by a *set* of NFA states, we build the transition table by exploring all reachable subsets.

**The Procedure**:
1. **Compute the Start State**: The DFA start state $S_0$ is the $\epsilon$-closure of the NFA start state.
2. **Initialize Worklist**: Add $S_0$ to a queue of "unvisited" DFA states.
3. **Explore Transitions**: While the worklist isn't empty:
   - Pop a DFA state $S$.
   - For every symbol $a$ in the alphabet:
     - Apply **move($S, a$)** to see where the NFA can go.
     - Compute the **$\epsilon$-closure** of that result to get a target set $T$.
     - If $T$ is a set we haven't seen before, add it to our worklist as a **new DFA state**.
     - Record the transition in the DFA: from state $S$, symbol $a$ lands in state $T$.


### 4.3.3 Worked Example: `(a|b)*ab`

Let's trace the construction for an NFA that accepts strings ending in `ab`. 
NFA States: $\{q_0, q_1, q_2\}$. Start: $q_0$. Accept: $q_2$.

#### Step 1: Initialize
The DFA start state $A$ is the $\epsilon$-closure of $\{q_0\}$. Since there are no $\epsilon$-transitions, $A = \{q_0\}$.

#### Step 2: Expand State A ($ \{q_0\} $)
- **On symbol `a`**: 
  - $move(\{q_0\}, a) = \{q_0, q_1\}$
  - $E(\{q_0, q_1\}) = \{q_0, q_1\}$. This is new! Let's call it **State B**.
- **On symbol `b`**: 
  - $move(\{q_0\}, b) = \{q_0\}$
  - $E(\{q_0\}) = \{q_0\}$. This is just **State A** again.

#### Step 3: Expand State B ($ \{q_0, q_1\} $)
- **On symbol `a`**:
  - $move(\{q_0, q_1\}, a) = \{q_0, q_1\}$ (from $q_0 \to \{q_0, q_1\}$ and $q_1 \to \emptyset$)
  - $E(\{q_0, q_1\}) = \{q_0, q_1\}$. Still **State B**.
- **On symbol `b`**:
  - $move(\{q_0, q_1\}, b) = \{q_0, q_2\}$ (from $q_0 \to \{q_0\}$ and $q_1 \to \{q_2\}$)
  - $E(\{q_0, q_2\}) = \{q_0, q_2\}$. New state! Let's call it **State C**.

#### Step 4: Expand State C ($ \{q_0, q_2\} $)
- **On symbol `a`**: $move \to \{q_0, q_1\} \xrightarrow{E} \{q_0, q_1\}$ (**State B**).
- **On symbol `b`**: $move \to \{q_0, q_2\} \xrightarrow{E} \{q_0, q_2\}$ (**State C**).

**Resulting DFA**:
The table is now complete. States B and C are accepting because they both contain the NFA's accepting state $q_2$.

<SubsetConstructionEmbed mode="graph" />


## 4.4 DFA Minimization

The Subset Construction often produces more states than necessary. For example, it might create two different states that behave exactly the same way for every possible future input. **Minimization** merges these redundant states.

### 4.4.1 The Partitioning Method

The most common algorithm works by "splitting" states into groups:

1. **Initial Split**: Separate all states into two groups: **Accepting** and **Non-Accepting**.
2. **Refine**: For each group, check if all states in that group go to the *same target groups* for every symbol.
   - If State 1 goes to Group A on 'x', but State 2 goes to Group B on 'x', then State 1 and 2 are different. **Split them**.
3. **Finalize**: Repeat until no more splits are possible. Each remaining group becomes a single state in the final DFA.

### 4.4.2 Why it Matters
A minimized DFA is the "gold standard" for lexical analysis. It is:
- **Fast**: Exactly one array lookup per character.
- **Small**: Uses the minimum possible memory.
- **Predictable**: No matter how complex the regex, the execution time is strictly linear to the input length.


## 4.5 Chapter Summary

This chapter explored the transition from theory to implementation:
- **Thompson's Construction** turns Regex into NFA using a simple "Lego-brick" approach.
- **Subset Construction** eliminates the "guessing" of NFAs by tracking all possibilities simultaneously, creating a DFA.
- **Minimization** cleans up the result, producing the most efficient possible recognizer.

In the next chapter, we will see how these minimized DFAs are transformed into actual source code (like Zig or C) to build a high-performance lexer.


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
