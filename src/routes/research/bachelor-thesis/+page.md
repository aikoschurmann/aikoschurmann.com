---
layout: blog
title: "Using Machine Learning to Optimize the Worklist Algorithm of Static Analyses"
date: "JUNE 08, 2026"
author: "Aïko Schürmann"
description: "How framing worklist component selection as a Learning-to-Rank problem reduced algorithmic iterations by 35.8%."
tag: "RESEARCH"
showOnHome: true
academicType: "Bachelor’s Thesis"
period: "2025 - 2026"
institution: "VUB"
---

<script>
  import BarChart from '$lib/components/BarChart.svelte';
  import AcademicInfoBox from '$lib/components/AcademicInfoBox.svelte';
</script>

<AcademicInfoBox 
  type="Bachelor’s Thesis "
  period="2025 - 2026"
  institution="VUB"
  promotor="prof. dr. Coen De Roover"
  advisors="Bram Vandenbogaerde, Noah Van Es, Sarah Verbelen"
  pdfLink="/bachelor_thesis.pdf"
/>

## Abstract

Static program analysis of higher-order functional languages relies on effect-driven worklist algorithms to compute the least fixed point. Traditional deterministic heuristics suffer from rigid trade-offs: dependency-driven sorting triggers catastrophic interleaving cycles in recursive structures, while naive queues (FIFO) bypass these cycles but ignore semantic dependencies. This research proposes a dynamic Learning-to-Rank (LTR) scheduler driven by Gradient Boosted Machines (XGBoost). By framing the optimization target as simulated "Lattice Progression" with a multi-step lookahead, the model learns to adaptively balance structural momentum with strategic workload batching. Empirical evaluation across 32 Scheme benchmarks demonstrates a 35.8% reduction in total algorithmic iterations compared to a robust FIFO baseline.

---

## 1. Context and Problem Statement

Modular static analysis frameworks, such as ModF, incrementally discover call graphs in higher-order languages by analyzing isolated components that communicate via a global abstract store. The engine coordinating this is the worklist algorithm, making the scheduling heuristic the primary performance bottleneck. 

The scheduling landscape presents a fundamental dichotomy:
* **Structural Heuristics:** Topologically sort dependencies to process callees before callers. In recursive data structures, this rigid prioritization triggers "interleaving"—the analyzer rapidly context-switches for every single generated input, preventing efficient data aggregation.
* **Naive Heuristics (FIFO):** Standard queues process components breadth-first. This naturally mitigates interleaving by allowing arguments to batch in the global store, but completely ignores the semantic structure of the program.

Statistical exploration confirms that the state-space computational cost follows a highly right-skewed log-normal distribution, meaning highly optimized execution trajectories exist but cannot be captured by a single static heuristic.

## 2. Pre-Training: Target Formulation

Before training the LTR model, a robust supervised signal had to be established. We evaluated two distinct target formulations:

1.  **Empirical Oracle (Global):** Utilized Monte Carlo Tree Search (MCTS) to find the shortest sampled path to convergence, assigning Reciprocal Rank Decay targets based on temporal mimicry.
2.  **Lattice Progression (Local):** A novel semantic target calculating a component's immediate and future impact on the global store. It quantifies progression as the saturation of abstract elements toward the generalized top element $\top$ within the mathematical lattice. 

To mitigate local optima, the Lattice Progression target was paired with simulated execution rollouts. Evaluated with a greedy 25-step lookahead ($H=25$, $K=1$), the Lattice Progression target decisively outperformed the Empirical Oracle, reducing algorithmic iterations by over 60% on complex benchmarks like the SICP-compiler. Consequently, this semantic lookahead formulation was selected as the sole target for the ML pipeline.

## 3. The Learning-to-Rank (LTR) Pipeline

Worklist component selection is formally framed as an Information Retrieval ranking task, optimizing for Normalized Discounted Cumulative Gain (NDCG). At each evaluation step, an XGBoost ensemble scores pending components against a 19-dimensional feature vector. 

Features are rigorously extracted to capture the analyzer's symbolic state:
* **Static Graph Topology:** PageRank, In/Out-Degree, Betweenness Centrality, and DAG Depth.
* **Dynamic Runtime State:** Queue Wait Time, Component Age, Visit Count, Pending Updates, and Delta Change.

SHAP (SHapley Additive exPlanations) analysis confirmed that dynamic features fundamentally govern the model's policy. Features such as *Delta Change* and *Visit Count* dominate the top-ranking factors, proving the model actively breaks recursive cycles and exploits runtime momentum rather than merely memorizing static program syntax.

## 4. Empirical Evaluation & Discussion

The predictive scheduler was benchmarked against a robust FIFO baseline across an independent evaluation suite of 32 higher-order Scheme programs. The evaluation sought to measure algorithmic efficiency, generalizability, and real-world execution trade-offs.

**Algorithmic Performance & Generalization**
The highest-performing model configuration—utilizing a 25-step lookahead horizon (L25 B1)—successfully reduced total worklist iterations by a weighted mean of **35.8%** across the entire benchmark suite. Crucially, the model successfully generalized without merely memorizing training topologies; it maintained a geometric mean iteration ratio of 0.915 across 29 strictly "less training-similar" evaluation programs.

**The Wall-Clock Trade-off**
While the algorithmic iteration reductions are substantial, the practical reality of dynamic scheduling introduces a strict computational trade-off. In a standard FIFO queue, selecting the next component is an $O(1)$ operation. In contrast, the ML framework must iteratively extract a 19-dimensional feature vector for every pending candidate and pass it through an XGBoost ensemble. 

| Benchmark Scope | Weighted Iteration Reduction | Weighted Wall-Clock Reduction |
| :--- | :--- | :--- |
| **All Programs (N=32)** | 35.81% | -5.14% (Slowdown) |
| **Large Programs (>1000 steps)** | 43.35% | +0.58% (Speedup) |

*Table 1: Performance of the L25 B1 model against the FIFO baseline.*

As Table 1 illustrates, the time required for live feature extraction caused a 5.14% weighted execution slowdown globally. However, on the largest and most complex programs—where static analysis costs are most prohibitive—the extreme reduction in required iterations successfully amortized the feature-extraction overhead, yielding a net 0.58% wall-clock speedup. 

---

## 5. Conclusion and Future Directions

This research provides empirical evidence that context-aware machine learning can significantly optimize static analysis worklist scheduling. By framing component selection as a Learning-to-Rank task targeting simulated mathematical Lattice Progression, the predictive model successfully navigated the state space, balancing structural momentum with intentional argument batching. 

While the algorithmic iteration reductions strongly validate data-driven scheduling, transitioning this theoretical success into a production-ready system requires bridging the wall-clock performance gap. Future research should focus on:
* **Systems-Level Optimization:** Implementing incremental graph feature updates (e.g., dynamic PageRank recalculation) to lower the Time-Per-Iteration (TPI) overhead.
* **Hybrid Scheduling:** Developing a scheduler that defaults to an $O(1)$ heuristic like FIFO during low worklist contention, invoking the ML model exclusively when the worklist expands beyond a specific bottleneck threshold. 
* **Lightweight Architectures:** Distilling the high-dimensional feature space from gradient boosted trees into shallower, lower-latency neural networks.