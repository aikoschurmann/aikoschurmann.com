---
layout: blog
title: "Foundations of Compiler Design"
date: "2026-04-01"
author: "Aiko Schurmann"
description: "A comprehensive introduction to compiler structure, function, and the fundamental phases of translation from high-level source code to executable programs."
tag: "COMPILERS"
chapterTitle: "Foundations of Compiler Design"
---

## 1.1 Learning Objectives
By the end of this chapter, you should be able to:

- Define what a compiler is and explain its role in the software development process
- Identify and describe the major phases of compilation
- Explain why compilers are organized into distinct phases rather than implemented as monolithic programs
- Distinguish between lexical analysis and syntactic analysis
- Trace the transformation of a simple program through the front-end compilation phases
- Recognize the relationship between compiler phases and natural language processing

## 1.2 What Is a Compiler?
### 1.2.1 Definition and Purpose

A **compiler** is a program that translates source code written in one programming language (the source language) into another language (the target language). Most commonly, compilers translate high-level programming languages that humans can read and write into low-level machine code that computers can execute directly.

For example, a C compiler translates C source code into machine instructions for a specific processor architecture (x86, ARM, RISC-V, etc.). A Java compiler translates Java source code into bytecode for the Java Virtual Machine. A TypeScript compiler translates TypeScript into JavaScript.

**Fundamental requirement**: The compiler must preserve the semantics (meaning) of the original program. If the source program computes the factorial of 5, the compiled program must compute exactly the same result. The representation changes, but the computational behavior must remain identical for all valid inputs.

### 1.2.2 Why Compilers Matter

Compilers are foundational to modern computing for several reasons:

**Abstraction and Productivity**: High-level languages allow programmers to express algorithms using abstractions (variables, functions, objects, types) rather than manipulating registers and memory addresses directly. A single line of Python code might translate to dozens of machine instructions. This abstraction dramatically increases programmer productivity.

**Portability**: A single source program can be compiled for different target architectures. The same C program can run on x86 processors, ARM chips, and embedded microcontrollers after recompilation. The compiler handles architecture-specific details.

**Optimization**: Modern compilers perform sophisticated analyses and transformations that make programs run faster and use less memory. These optimizations would be impractical for humans to implement by hand in assembly language.

**Error Detection**: Compilers catch many categories of errors before the program runs—type mismatches, undefined variables, syntax violations. This early detection prevents bugs that would otherwise appear during execution.

### 1.2.3 Compilers vs. Interpreters
It's important to distinguish compilers from interpreters:

- A **compiler** translates an entire program into a target language, producing an output file (executable, bytecode, etc.) that can be run separately.
- An **interpreter** reads the source program and executes it directly, without producing a separate compiled artifact.

Example: GCC is a compiler that translates C code to executable binaries. Python's standard implementation uses an interpreter that executes Python code line-by-line (though it does compile to bytecode internally as an optimization).

Many modern language implementations use hybrid approaches. Java compiles to bytecode (compilation step), then the JVM interprets or JIT-compiles that bytecode to machine code (interpretation/runtime compilation).

This course focuses on compilation as a translation process, though many concepts apply to interpreters as well.

## 1.3 The Structure of a Compiler: Why Phases?

### 1.3.1 The Modularity Principle

Early compilers were monolithic programs that performed translation in a single, complex pass. Modern compilers are organized into phases—distinct stages that each solve a specific sub-problem of the overall translation task.

This phase-based organization provides several critical advantages:

**Separation of Concerns**: Each phase addresses one well-defined question. Lexical analysis asks "what are the words?" Parsing asks "how are they structured?" Semantic analysis asks "what do they mean?" This separation makes each phase simpler to design, implement, and understand.

**Modular Testing**: Phases can be tested independently. You can verify that the lexer correctly tokenizes input without implementing the parser. You can test the parser with hand-crafted token sequences. This modularity makes bugs easier to isolate and fix.

**Reusability**: The front-end of a C compiler (lexer, parser, semantic analyzer) can be shared between compilers targeting different architectures. Only the back-end (code generator) needs to change. Similarly, different source languages can share optimization passes and code generators.

**Clear Diagnostics**: When compilation fails, phase boundaries help identify where the problem occurred. A lexical error produces different diagnostics than a parse error or a type error. Users get better error messages when the compiler knows which phase detected the problem.

**Incremental Complexity**: Building a compiler phase-by-phase allows developers to tackle complexity incrementally. Get lexing working first, then add parsing, then semantic analysis, then optimization, then code generation. Each phase builds on a solid foundation.

### 1.3.2 The Classical Compilation Pipeline

The compilation process is typically divided into several major phases:

| Phase | Typical Output | Core Question |
|---|---|---|
| Lexical analysis (lexer) | Token stream | Which meaningful symbols exist in the input text? |
| Syntax analysis (parser) | Abstract syntax tree (AST) | How do those symbols combine according to grammar rules? |
| Semantic analysis | Annotated AST / symbol information | Are names, scopes, and types used consistently? |
| Intermediate code generation | Intermediate representation (IR) | How do we express the program in a compiler-friendly internal form? |
| Optimization | Optimized IR | Which transformations preserve meaning but reduce cost? |
| Code generation | Assembly / machine code / bytecode | How do we emit executable target-specific output? |

Compact view:

`Source text -> Tokens -> AST -> Annotated AST -> IR -> Optimized IR -> Target code`


The first three phases (lexical analysis, syntax analysis, semantic analysis) are usually called the front-end. They are mostly independent of target architecture.

The later phases (intermediate code generation, optimization, code generation) are the back-end. They depend on target architecture and runtime constraints.

This course focuses primarily on front-end construction, with emphasis on lexical and syntax analysis. Later chapters introduce semantic analysis and intermediate representations.

## 1.4 Lexical Analysis: From Characters to Tokens

### 1.4.1 The Role of the Lexer

Lexical analysis (also called scanning or tokenization) is the first phase of compilation. The lexer reads the source program as a stream of individual characters and groups those characters into meaningful units called tokens.

Definition: A token is the smallest unit of meaning in a programming language. Tokens are the words of the programming language.

In practice, lexer rules are typically specified with regular expressions and implemented using finite-state automata (often deterministic finite automata after construction/minimization).



### 1.4.2 Token Categories

Most programming languages have similar categories of tokens:

- Keywords (reserved words): language-defined identifiers with special meaning.
	- Examples: `if`, `while`, `for`, `class`, `def`, `return`, `let`, `var`
	- These cannot be used as variable names.
- Identifiers: programmer-defined names for variables, functions, classes, etc.
	- Examples: `count`, `userName`, `calculateTotal`, `MAX_SIZE`
	- Must follow language-specific naming rules (often alphanumeric plus underscore, and cannot start with a digit).
- Literals: constant values written directly in source code.
	- Numeric literals: `42`, `3.14159`, `0xFF`, `1e-10`
	- String literals: `"hello"`, `'world'`, `"""multiline"""`
	- Boolean literals: `true`, `false`
	- Character literals: `'a'`, `'\\n'`
- Operators: symbols that represent operations.
	- Arithmetic: `+`, `-`, `*`, `/`, `%`
	- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
	- Logical: `&&`, `||`, `!`
	- Assignment: `=`, `+=`, `-=`
	- Bitwise: `&`, `|`, `^`, `<<`, `>>`
- Delimiters (separators): symbols that structure the program.
	- Parentheses: `(`, `)`
	- Braces: `{`, `}`
	- Brackets: `[`, `]`
	- Punctuation: `,`, `;`, `:`, `.`
- Comments: human-readable annotations (often discarded by the lexer).
	- Single-line: `// comment`
	- Multi-line: `/* comment */`
- Whitespace: spaces, tabs, newlines (usually discarded, but significant in some languages like Python).

### 1.4.3 Example: Tokenizing a Simple Statement

Consider this line of C code:

```c
int sum = 0;
```

The lexer processes this character stream and produces the following token sequence:

- `Keyword(int)`
- `Identifier(sum)`
- `Operator(=)`
- `Number(0)`
- `Delimiter(;)`

Each token carries two pieces of information:

- Token type (category): keyword, identifier, number, etc.
- Lexeme (actual text): `"int"`, `"sum"`, `"0"`

Some tokens carry additional information. For example, a number token might include the parsed numeric value, not just the text representation.

## 1.5 Syntax Analysis: From Tokens to Structure

### 1.5.1 The Role of the Parser

Syntax analysis (or parsing) is the second phase of compilation. The parser reads the token stream produced by the lexer and constructs a hierarchical representation.

Two related tree forms are important:

- Parse tree (Concrete Syntax Tree, CST): preserves full grammatical structure, including syntactic tokens such as delimiters and grouping symbols.
- Abstract Syntax Tree (AST): removes syntactic noise and keeps only semantically relevant structure.

Production compilers usually use ASTs for later phases, while parse trees are mainly useful for debugging, pedagogy, or grammar tooling.

The parser answers a crucial question: how do these tokens relate to each other structurally?

While the lexer identifies individual words, the parser determines how those words combine to form valid sentences in the programming language.

### 1.5.2 From Linear to Hierarchical

The token stream is linear: a sequence of tokens in the order they appear in the source code. But program structure is inherently hierarchical:

- Expressions contain sub-expressions
- Statements contain expressions
- Blocks contain statements
- Functions contain blocks
- Programs contain functions

The parser transforms the linear token stream into a tree structure that makes this hierarchy explicit.

### 1.5.3 Operator Precedence and Associativity

One of the parser's most important jobs is enforcing operator precedence and associativity rules.

Consider this expression:

```text
2 + 3 * 4
```

A human mathematician knows this equals `14`, not `20`, because multiplication has higher precedence than addition. We mentally group it as `2 + (3 * 4)`.

The token stream is simply:

- `Number(2)`
- `Operator(+)`
- `Number(3)`
- `Operator(*)`
- `Number(4)`

This linear sequence does not capture precedence. The parser must build a tree that makes the precedence explicit:

```text
BinaryExpression(+)
|- left: Literal(2)
`- right: BinaryExpression(*)
	|- left: Literal(3)
	`- right: Literal(4)
```

Now the tree structure shows that multiplication happens first: the `*` node is deeper (and will be evaluated earlier), and its result becomes the right child of the `+` node.

If we had written `(2 + 3) * 4` instead, the token stream would include parentheses, and the parser would build a different tree:

```text
BinaryExpression(*)
|- left: BinaryExpression(+)
|  |- left: Literal(2)
|  `- right: Literal(3)
`- right: Literal(4)
```

The parentheses change the structure, even though they do not appear in the final tree; they guide the parser during construction.

### 1.5.4 Example: Parsing a Variable Declaration

Let us trace the complete transformation of this statement:

```c
int x = 2 + 3 * 4;
```

#### Step 1: Character Stream (raw input)

```text
i n t   x   =   2   +   3   *   4 ;
```

At this stage, the compiler sees only individual characters. No interpretation has occurred.

#### Step 2: Token Stream (after lexical analysis)

The lexer produces:

- `Keyword(int)`
- `Identifier(x)`
- `Operator(=)`
- `Number(2)`
- `Operator(+)`
- `Number(3)`
- `Operator(*)`
- `Number(4)`
- `Delimiter(;)`

Now we have categorized lexical units, but no structural information. We know `int` is a keyword and `x` is an identifier, but we do not yet know how they relate.

#### Step 3: Abstract Syntax Tree (after parsing)

The parser builds this tree structure:

```text
VariableDeclaration
|- name: "x"
|- type: "int"
`- initializer:
   BinaryExpression(+)
   |- left: Literal(2)
   `- right:
	BinaryExpression(*)
	|- left: Literal(3)
	`- right: Literal(4)
```

Key observations:

- The root node (`VariableDeclaration`) identifies the statement kind and its fixed fields (`name`, `type`, `initializer`).
- Precedence is encoded structurally: `BinaryExpression(*)` is nested inside `BinaryExpression(+)`, so no extra precedence rules are needed after parsing.
- Execution order follows tree shape: evaluate the deepest expression first (`3 * 4`), then combine with `2`.
- The parser has transformed syntax into a machine-friendly representation where each node has a clear semantic role.

From this point onward, compiler passes operate on the tree, not on raw tokens. Semantic analysis resolves names and checks types per node, optimization rewrites subtrees while preserving meaning, and code generation lowers the final tree into target instructions.

## 1.6 Why Structure Matters: The Ambiguity Problem

### 1.6.1 Ambiguity in Natural Language

Natural language is full of structural ambiguity. Consider this sentence:

```text
I saw the man with the telescope.
```

This sentence has two distinct interpretations.

Interpretation 1: I used a telescope to see the man.

```text
saw
|- subject: I
`- object: man (with telescope)
```

Interpretation 2: I saw a man who was carrying a telescope.

```text
saw
|- subject: I
`- object: man
	`- attribute: has telescope
```

Without additional context, we cannot determine which structure the speaker intended. This is structural ambiguity.

Another example:

```text
Old men and women sat down.
```

Are the women old, or only the men? Structure determines meaning:

- `[Old [men and women]]`: both groups are old.
- `[[Old men] and women]`: only the men are old.

### 1.6.2 Programming Languages Eliminate Ambiguity

Programming languages are designed to be unambiguous. Every valid program must have exactly one correct interpretation.

This is achieved through formal grammars: precise, mathematical rules that specify exactly what structures are valid and how tokens can combine.

When you write:

```c
if (a && b || c) { ... }
```

There is no ambiguity about grouping. The language specification defines operator precedence, so `&&` binds tighter than `||`:

```c
if ((a && b) || c) { ... }
```

The parser enforces these rules mechanically. It builds exactly one tree for any valid program.

In practice, these structure rules are written using BNF-style grammar productions. BNF lets a language designer specify exactly which token sequences form expressions, statements, and declarations, and in what hierarchy.

For example, precedence is typically encoded by splitting expressions into multiple nonterminals (such as additive vs. multiplicative forms), so ambiguous groupings are ruled out by grammar construction itself.

We will cover BNF formally in the next chapter. For now, the key idea is: ambiguity is not resolved by guesswork at parse time; it is prevented up front by the grammar definition.

## 1.7 Semantic Analysis: From Structure to Meaning

### 1.7.1 The Role of Semantic Analysis

After parsing, the compiler has a structurally correct tree. But syntactic correctness is not enough. A program can be grammatically valid and still be meaningless or invalid according to language rules.

Semantic analysis is the phase that answers questions such as:

- Is every identifier declared before use?
- Does each name resolve to the correct declaration in the correct scope?
- Are operations applied to compatible types?
- Are function calls given the correct number and types of arguments?

In short: parsing verifies form, semantic analysis verifies meaning.

### 1.7.2 Symbol Tables and Scope Resolution

To reason about names, compilers maintain symbol tables. A symbol table maps identifiers to information such as type, storage class, mutability, and declaration location.

Because languages have nested scopes, semantic analysis usually manages a stack of symbol tables:

- Enter scope: create/push a new table.
- Declare name: insert symbol in the current table.
- Resolve name: search from innermost scope outward.
- Exit scope: pop the table.

This is how the compiler distinguishes shadowed names correctly.

```c
int x = 1;
{
	int x = 2;  // shadows outer x
	x = x + 1;  // refers to inner x
}
```

### 1.7.3 Type Checking

Type checking enforces constraints on operations and assignments. For example:

```c
int n = 5;
int *p = &n;
int r = p + p;   // invalid: C does not allow addition of two pointers
```

Even though this parses lexically and syntactically, semantic analysis rejects it because `+` is not defined for two pointer operands in C.

Many compilers annotate AST nodes with inferred or declared types during this phase. These annotations are then used by later phases for optimization and code generation.

### 1.7.4 Example: Semantic Checks on a Parsed Tree

Suppose parsing produced a valid tree for this code:

```c
int total = price + tax;
```

Semantic analysis might perform the following checks:

1. Resolve `price` and `tax` in visible scopes.
2. Verify both identifiers are declared.
3. Verify both have numeric types compatible with `+`.
4. Infer the expression type of `price + tax`.
5. Check assignability to `total` (type `int`).

If any step fails, compilation stops with a semantic error, even though lexical and syntax analysis succeeded.

By the end of semantic analysis, the compiler has an AST that is both structurally valid and semantically consistent. That typed, resolved tree is the true input to intermediate representation generation.

## 1.8 Intermediate Representation: A Compiler's Working Language

### 1.8.1 Why Compilers Need an IR

After semantic analysis, the compiler has a correct and typed AST. But ASTs are not always ideal for optimization or target-code emission. They preserve source-level structure, while back-end passes need a form that is explicit, uniform, and easy to transform.

An intermediate representation (IR) is that form.

IR acts as a contract between front-end and back-end:

- The front-end produces semantically valid IR.
- The optimizer rewrites IR to improve performance.
- The code generator lowers IR to machine-specific instructions.

This separation is what makes modern compiler architecture modular and scalable.

### 1.8.2 What Makes a Good IR

A practical IR usually has the following properties:

- Explicit operations: hidden language behavior is lowered into clear steps.
- Simpler control flow: conditionals and loops are represented with basic blocks and jumps.
- Stable typing information: values and operations carry enough type detail for correctness checks.
- Local semantics per instruction: each operation has a narrow, explicit meaning, so optimization passes can prove a rewrite preserves program behavior.

Different compilers use different IRs (three-address code, SSA-based IRs, LLVM IR, etc.), but they all serve the same purpose: make analysis and transformation tractable.

### 1.8.3 Example: Lowering an Expression to IR

Consider this C statement:

```c
int x = (a + b) * (c - d);
```

A tree representation captures hierarchy, but an IR might linearize it into explicit temporaries:

```text
t1 = a + b
t2 = c - d
t3 = t1 * t2
x = t3
```

This form is easier to optimize. For example, if `c - d` is computed repeatedly, common-subexpression elimination can reuse `t2` instead of recomputing it.

### 1.8.4 Control Flow in IR

IR also makes control flow explicit. For example, this C snippet:

```c
if (n > 0) {
  sign = 1;
} else {
  sign = -1;
}
```

may become (in a simple three-address style):

```text
t_cmp = n > 0
if t_cmp goto L_then
goto L_else

L_then:
t_val = 1
goto L_end

L_else:
t_val = -1

L_end:
sign = t_val
```

Now analyses such as liveness, dead code elimination, and register allocation can be implemented on a uniform graph of blocks and edges.

IR sits at the boundary between validated program meaning and target-specific machine details. At this stage, semantics are fixed but representation is still flexible, which is why most machine-independent optimizations are performed here.

## 1.9 Code Generation: From IR to Machine Instructions

### 1.9.1 The Goal of Code Generation

Code generation converts IR into executable target code (assembly, machine code, or bytecode). At this stage, the compiler commits to a concrete architecture.

The core requirement is correctness: emitted code must preserve the semantics of the IR exactly. Performance is then improved within that constraint.

### 1.9.2 What the Code Generator Decides

Given IR, the back-end must solve several concrete problems:

- Instruction selection: choose machine instructions that implement each IR operation.
- Register allocation: map temporary values to a limited set of hardware registers.
- Spill strategy: move values to stack memory when registers are exhausted.
- Calling convention compliance: place arguments/returns in the right registers or stack slots.
- Control-flow emission: translate labels and branches into concrete jumps and block layout.

These decisions are target-specific. The same IR may produce very different output on x86-64 vs ARM64.

### 1.9.3 Example: Lowering Arithmetic IR

Suppose the IR is:

```text
t1 = a + b
t2 = t1 * 4
x = t2
```

On a register machine, a possible assembly-like lowering is:

```text
mov r0, [a]
add r0, [b]
imul r0, 4
mov [x], r0
```

Even in this small example, code generation chooses:

- which register carries intermediate values (`r0`),
- whether to use an immediate multiply (`imul r0, 4`),
- and when to write the final value back to memory.

### 1.9.4 Control Flow and Function Boundaries

For branches and function calls, code generation must also emit prologue/epilogue logic and preserve required registers.

For example, a C function:

```c
int add(int a, int b) {
	return a + b;
}
```

is not just an `add` instruction. Depending on target and optimization level, the generated code must still respect calling-convention rules for argument passing, return registers, and stack alignment.

This is why code generation is often split into multiple passes: instruction selection, register allocation, and final emission/assembly. By the end of this phase, compiler output is directly executable by the target runtime environment.

## 1.10 Historical Context: How Compiler Design Evolved

### 1.10.1 1950s Origins

The first compiler is generally credited to Grace Hopper's A-0 system (1952).[1] Early systems were primitive by modern standards, often closer to assemblers with macro expansion than to fully optimizing compilers.

Even so, this was a conceptual breakthrough: programmers could begin writing symbolic, machine-independent instructions and rely on translation software to produce executable programs.

### 1.10.2 FORTRAN and the Performance Proof

FORTRAN (1957) was the first widely adopted high-level language with a serious optimizing compiler.[2]

Its team demonstrated something critical for the entire industry: compiled code could match, and in many cases outperform, hand-written assembly in practical workloads.

That result changed adoption dynamics. High-level languages were no longer just easier to write; they were also viable for performance-critical scientific and engineering computing.

### 1.10.3 From Academic Topic to Core Infrastructure

By the 1970s and 1980s, compiler construction became both a research discipline and an industrial foundation. Work on parsing theory, optimization algorithms, and data-flow analysis moved from papers into production toolchains.

At the same time, open compiler ecosystems (such as GCC in the late 1980s) made high-quality compilation widely accessible and accelerated cross-platform software development.[3]

### 1.10.4 Contemporary Compiler Development

Modern compiler development now spans static compilers, runtime compilers, and editor-integrated analysis systems:

- LLVM: a modular infrastructure that separates language front-ends from architecture back-ends. Rust, Swift, and Clang-based C/C++ toolchains all build on LLVM.[4]
- JIT compilation: runtime translation and optimization based on observed execution behavior. JavaScript engines such as V8 and SpiderMonkey rely heavily on JIT strategies.[5][6]
- Language servers: compiler-backed tooling exposed through protocols like LSP, enabling autocomplete, inline diagnostics, go-to-definition, and safe refactoring in editors.[7]

This means "the compiler" is no longer just a batch executable. It is also a persistent service in IDEs and a runtime optimization engine inside virtual machines and language runtimes.

## 1.11 Chapter Conclusion

This chapter established the full conceptual path from source text to executable behavior.

You saw how compilation progresses from lexical units to structure, then to semantic correctness, then to machine-oriented forms (IR and code generation). Each stage solves a different class of problems, but all stages must preserve program meaning.

At this point, you should be able to read a small code sample and reason about:

- how it tokenizes,
- how it parses into a tree,
- where semantic errors can arise,
- how IR can expose optimization opportunities,
- and what code generation must still decide for a target machine.

## 1.12 Exercises

### 1.12.1 Concept Checks

1. Explain the difference between the lexical, syntactic, and semantic stages.
2. Why can two programs with identical token streams still have different meanings?
3. In your own words, why does a compiler need an IR even after semantic analysis has succeeded?

### 1.12.2 Parsing and Structure

For each expression below, write the grouped form (add parentheses) implied by C precedence and associativity, then sketch a tree.

1. `a + b * c - d`
2. `a * (b + c) / d`
3. `x < y && y < z || done`

### 1.12.3 Semantic Analysis Practice

For each snippet, identify whether semantic analysis should accept or reject it, and justify why.

```c
int x = 10;
int y = x + z;
```

```c
int flag = 1;
if (flag) {
	int flag = 2;
}
```

```c
int n = 3;
int *p = &n;
int r = p + p;
```

### 1.12.4 IR and Codegen Exercise

Take this C snippet:

```c
if (a > b) {
  max = a;
} else {
  max = b;
}
```

Do the following:

1. Write a three-address style IR with explicit temporaries and labels.
2. Propose one optimization that could apply to your IR.
3. Write a small assembly-like lowering that respects branch structure.
