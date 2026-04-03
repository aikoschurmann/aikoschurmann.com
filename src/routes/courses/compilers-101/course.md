---
title: "Compilers 101"
description: "A practical compiler front-end course covering pipeline fundamentals, BNF grammar design, lexing, arena-backed interning, and recursive-descent parsing."
tags:
  - "COMPILERS"
  - "AUTOMATA"
---

<script>
  import ChapterEmbed from '$lib/components/ChapterEmbed.svelte';
  import CourseSection from '$lib/components/CourseSection.svelte';
</script>

Building a compiler from scratch is one of the most rewarding software engineering challenges. It forces you to bridge the gap between abstract human-readable text and concrete machine-executable logic. 

In this course, we will walk through the entire front-end of a modern compiler. We'll start with the fundamentals of lexing and syntax, traverse the mathematical theory behind pattern recognition, and ultimately implement a robust, error-recovering parser and semantic analyzer.

Whether you're a seasoned engineer looking to demystify how your tools work, or a student trying to grasp the magic of translating code, this track is designed for you. Let's dive in.


<CourseSection 
  title="Compiler Foundations" 
  index={1} 
  slugs={["01-foundations-of-compiler-design"]}
  description="Establish the core mental model: what compilation is, how phases compose, and the contracts between front-end and back-end stages."
>
  <ChapterEmbed slug="01-foundations-of-compiler-design" />
</CourseSection>

<CourseSection 
  title="Automata Theory — optional deep dive" 
  index={2} 
  slugs={["02-regular-languages-and-regex", "03-nfa-and-dfa", "04-subset-construction-and-dfa-minimization", "05-context-free-grammars-bnf-and-pushdown"]}
  description="From regular languages to practical recognizers: regex, NFA/DFA construction, and pushdown automata as the bridge to nested syntax."
>

**Note:** The chapters in this section cover the formal mathematical foundations behind automatic lexer and parser generation. If your goal is to learn how to build a practical, hand-written compiler from scratch without the heavy math, you can safely skip this entire section and jump straight to *Lexer Engineering*. You can always return here later for the theoretical deep dive!

  <ChapterEmbed slug="02-regular-languages-and-regex" />
  <ChapterEmbed slug="03-nfa-and-dfa" />
  <ChapterEmbed slug="04-subset-construction-and-dfa-minimization" />
  <ChapterEmbed slug="05-context-free-grammars-bnf-and-pushdown" />
</CourseSection>


<CourseSection 
  title="Lexer Engineering" 
  index={3} 
  slugs={["06-token-specification-and-priority", "07-lexer-implementation-and-errors"]}
  description="Turn automata into production lexers: token specs, matching policy, scanner modes, diagnostics, and performance concerns."
>
  <ChapterEmbed slug="06-token-specification-and-priority" />
  <ChapterEmbed slug="07-lexer-implementation-and-errors" />
</CourseSection>

<CourseSection 
  title="Parsing and Syntax" 
  index={4} 
  slugs={["08-ll-and-lr-parsing", "09-parse-trees-asts-and-error-recovery"]}
  description="Implement parsing mechanics over token streams: LL/LR strategy trade-offs, parse-to-AST transformation, and syntax-error recovery."
>
  <ChapterEmbed slug="08-ll-and-lr-parsing" />
  <ChapterEmbed slug="09-parse-trees-asts-and-error-recovery" />
</CourseSection>

<CourseSection 
  title="Semantic Analysis and Validation" 
  index={5} 
  slugs={["10-symbol-tables-and-scope-resolution", "11-type-checking", "12-semantics-to-ir"]}
  description="Resolve names and scopes, enforce type rules, emit actionable diagnostics, and prepare semantically valid inputs for IR lowering."
>
  <ChapterEmbed slug="10-symbol-tables-and-scope-resolution" />
  <ChapterEmbed slug="11-type-checking" />
  <ChapterEmbed slug="12-semantics-to-ir" />
</CourseSection>

The rest of this course is still under development, any and all feedback is very welcome! If you have suggestions for topics you'd like to see covered, or if you want to contribute a chapter, please reach out to me!