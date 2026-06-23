---
layout: project
title: "fractal-compression"
thumb: "FC"
description: "A high-performance Partitioned Iterated Function System (PIFS) image compressor built from scratch."
github: "https://github.com/aikoschurmann/fractal_compression"
---

<script>
  import ProjectLayout from '$lib/components/ProjectLayout.svelte';
  import DomainRangeVisualizer from '$lib/components/DomainRangeVisualizer.svelte';
  import IsometryVisualizer from '$lib/components/IsometryVisualizer.svelte';
  import SearchWindowVisualizer from '$lib/components/SearchWindowVisualizer.svelte';
  import FisherClassificationVisualizer from '$lib/components/FisherClassificationVisualizer.svelte';
  import QuadtreeVisualizer from '$lib/components/QuadtreeVisualizer.svelte';
  import YCbCrVisualizer from '$lib/components/YCbCrVisualizer.svelte';
  import BitpackVisualizer from '$lib/components/BitpackVisualizer.svelte';
</script>

<ProjectLayout>

> **The Result:** We successfully compressed a massive **4791x3529** raw image from **48.38MB** down to **207.35KB** using pure mathematical self-similarity. resulting in 0.1004 bits per pixel. (A high quality JPG sits around 1.5 to 2 bpp) That is a 239:1 compression ratio. PSNR = 39.39 dB & MSE = 4.37. Higher quality images can be achieved by tweaking compression parameters, jpg would have significantly worse quality at this file size.

<figure>
  <img src="/fractal_out.webp" alt="Fractal Image Compression Process" />
  <figcaption>The decoding process: The image literally solves itself out of pure equations over multiple iterations.</figcaption>
</figure>

This document breaks down how I built a high-performance **Partitioned Iterated Function System (PIFS)** image compressor from scratch.

Fractal compression is notorious for being computationally heavy $O(N^4)$. A naive implementation can literally take days to compress a single 1080p image. Below, I document the fundamental math of the algorithm, along with the aggressive heuristics and structural optimizations I implemented to get the compression time down to seconds.

---

## Phase 1: Understanding the Math

Fractal compression doesn't store pixels. It stores mathematical equations that exploit **local self-similarity** (the fact that a small piece of an image often looks like a shrunken-down version of a larger piece of the same image).

For every target block in the image (the **Range Block**, $R$), your goal is to find a larger block somewhere else in the image (the **Domain Block**, $D$) that looks similar when shrunk down. 

<DomainRangeVisualizer />

The relationship is formally defined by an affine transformation:

$$
R \approx s \cdot D_{\text{downsampled}} + o
$$

Where:
* **$s$ (Contrast):** A scaling factor that must be strictly between $[-1.0, 1.0]$. This constraint is non-negotiable; it ensures the equations form a *contraction mapping*, which guarantees the image will successfully decode later.
* **$o$ (Brightness):** A flat DC offset.
* **Isometry:** One of 8 geometric orientations (0, 90, 180, 270 degree rotations, plus their mirrored reflections) applied to the Domain block.

<IsometryVisualizer />

### The Least Squares Solver
When comparing a candidate $D$ to your target $R$, you don't guess $s$ and $o$. You solve for the optimal values analytically using Least Squares:

```c
float denom = n * sum_D_D - sum_D * sum_D;
float s = (n * sum_R_D - sum_R * sum_D) / denom;
// Clamp s to [-1.0, 1.0] for convergence!
float o = (sum_R - s * sum_D) / n;
```

### The Full Encoding Algorithm Loop
The interactive examples above show how we match a single Range block. To compress an entire image, the algorithm executes the following massive nested loop:

1. **Partition the Image:** Divide the entire image into non-overlapping Range blocks (e.g., thousands of 8x8 squares).
2. **For Each Range Block ($R$):**
   1. Initialize `min_error = infinity`.
   2. **Search the Pool:** Iterate over every larger Domain block&nbsp;($D$) in the image.
   3. **For Each Domain Block:**
      - Downsample it to the size of $R$.
      - **For Each of the 8 Isometries:**
         - Apply the geometric transformation.
         - Analytically solve for $s$ and $o$ using Least Squares.
         - Calculate the resulting Mean Squared Error (MSE).
         - If the MSE < `min_error`:
           - Save this block's parameters: `[X, Y, isometry, s, o]`.
           - `min_error = MSE`.

When finished, you throw away the original pixels and save just the list of these winning parameters. That list of equations *is* the compressed file! Because of all these nested loops, the complexity is $O(N^4)$, which leads directly into Phase 2.

---

## Phase 2: Escaping the $O(N^4)$ Death Trap

A naive implementation will extract a domain block, downsample it, rotate it, and calculate the Least Squares fit for *every possible coordinate* in the image. Do not do this. You must implement the following optimizations to make the compressor usable.

### 1. Pre-Downsampling the Domain Pool
**The Problem:** Downsampling the domain block on-the-fly inside your deepest nested loops destroys performance.
**The Fix:** Before compression begins, allocate a buffer exactly 50% the width and height of the original image and run a simple 2x2 box-filter average over it. Read 1:1 pixels from this pre-downsampled buffer.

### 2. Localized Search Windows
**The Problem:** Searching the entire image for a match is $O(N^2)$ per block.
**The Fix:** Images are highly locally correlated (grass looks like grass next to it). Restrict your search radius to a specific window (e.g., `[-127, 127]`) around the target Range block. This caps search time to $O(K)$.

<SearchWindowVisualizer />

### 3. Fisher Classification
**The Problem:** Calculating Least Squares error for hundreds of blocks is too slow.
**The Fix:** Implement a fast-rejection hash. Split the block into 4 quadrants, sum the pixels, and sort by brightness. If the candidate's Class Hash doesn't match the Range block, instantly reject it! This skips ~80% of the heavy math.

<FisherClassificationVisualizer />

---

## Phase 3: Adaptive Quadtrees

If you use fixed 8x8 block sizes, flat areas (like skies) will waste hundreds of equations, and sharp areas (like text) will look blurry.

You must implement an **Adaptive Quadtree** to dynamically scale detail where it's needed most.

1. Start with a large block (e.g., `32x32`).
2. Run your search to find the best Domain block. Calculate the Mean Squared Error (MSE).
3. If the MSE > `error_threshold` (e.g., `20.0`), the equation isn't accurate enough. **Split the block into four 16x16 blocks** and recursively compress each one.
4. Stop splitting if you hit a hardcoded `min_size` (e.g., `4x4`) to prevent the file size from exploding.

<QuadtreeVisualizer />

---

## Phase 4: Full Color (The YCbCr Trick)

Compressing RGB images naively takes 3x longer. The professional trick is to process color in the **YCbCr** color space (Luma, Blue-Difference, Red-Difference).

> **Luma Drives Structure**
> The human eye is far more sensitive to brightness than color. Therefore, you only need to run the heavy Quadtree search **exclusively on the Y (Luma) channel**. Once you find the perfect $X, Y$, and Isometry for a block, lock it in. Blindly apply that exact same geometric transform to the Cb and Cr channels.

<YCbCrVisualizer />

You now have full color support with almost zero extra processing time!

---

## Phase 5: The Bit-Packed Binary Format

Fractal equations take up a lot of space if stored as raw C structs (e.g., 20+ bytes per block). You must pack the data at the bit-level to achieve a small `.frc` file.

Because you used a Quadtree, the geometric splitting is deterministic. You do **not** need to store the $X$, $Y$, or $Size$ of the target range blocks. You simply write a tree traversal to the file.

<BitpackVisualizer />

### The Packed `FRC3` Format Definition:

**Header (16 bytes):** `MagicBytes("FRC3")`, `Width`, `Height`, `Min_Size`, `Max_Size` (all 32-bit ints).

**The Stream (Recursive Depth-First):**

* **Split Node (1 byte):** `0x80` (MSB set to 1). Decoder recursively splits block.
* **Leaf Node (14 bytes):**
  * **Byte 1:** `0x00` (MSB = 0) OR'd with the 3-bit Isometry index.
  * **Bytes 2-3:** `dx`, `dy` as signed `int8_t`.
  * **Byte 4:** Luma Contrast ($s$) mapped to `int8_t`.
  * **Bytes 5-6:** Luma Brightness ($o$) mapped to `int16_t`.
  * **Bytes 7-14:** Repeat $s$ and $o$ for Cb and Cr channels.

---

## Summary
By following this guide, you transform an impossibly slow mathematical curiosity into a multi-threaded, Luma-driven, heuristically-optimized C engine capable of compressing high-resolution images in seconds. To decode the image, simply allocate a black buffer and apply the packed equations in a loop until the image magically appears!

</ProjectLayout>
