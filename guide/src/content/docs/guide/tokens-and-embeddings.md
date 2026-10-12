---
title: "Tokens and embeddings"
description: "From strings to integers to vectors"
sidebar:
  label: "5. Tokens and embeddings"
---

_From strings to integers to vectors_

Chapter 5 of 21 · I. Foundations · about 30 minutes. Builds on: [4. Probability, softmax and next-token prediction](/guide/softmax-and-loss/).

:::tip[Skip this chapter if]
you can describe how byte-pair encoding builds a vocabulary, say why the embedding table is equivalent to a one-hot matrix product, and explain why a tokenizer is a security-relevant component.
:::

:::note[Inspect the embedding lookup]
The first two operations of a real model, run live: words become IDs, IDs become vectors. [Open in the Model Explorer](/explorer/#step=1&t=3&v=visual).
:::

## Neural networks need numbers, not text

The network of Chapters [2](/guide/neural-networks/)–[3](/guide/backpropagation/) maps vectors to vectors. To use it on text you must first turn a string into a sequence of integers (**tokenization**) and then each integer into a vector (**embedding**).

## Why not characters or words?

-   **Characters or bytes** give a tiny vocabulary and no unknown inputs, but sequences become very long, and attention cost grows with the square of length.
-   **Whole words** give short sequences, but the vocabulary is huge and open: names, typos, code, new words, other languages. Anything outside the list is "unknown".
-   **Subwords** sit between: frequent words are single tokens, rare words are split into familiar pieces, and any string can be represented. All current language models use some form of subword tokens.

## Byte-pair encoding

**BPE** was adapted to neural translation by <cite data-p="sennrich2015" data-s></cite>. The training algorithm is short:

1.  Start with every word split into characters, with an end-of-word marker.
2.  Count how often each adjacent pair of symbols occurs across the corpus.
3.  Merge the most frequent pair into a new symbol, in every place it occurs.
4.  Repeat until the vocabulary reaches the desired size. The ordered list of merges is the tokenizer.

To encode new text, split it into characters and apply the merges in the order they were learned. Run it yourself, and watch frequent substrings such as "est" become single tokens:

<div class="widget not-content" data-w="bpe" data-title="Learn a BPE vocabulary"></div>

**Byte-level BPE** starts from the 256 possible bytes instead of characters, so any text in any language, including emoji and binary data, can be encoded with no unknown tokens. SentencePiece <cite data-p="kudo2018" data-s></cite> is a widely used toolkit that treats text as a raw stream (spaces included) so no language-specific pre-splitting is needed.

### Vocabulary size is a design choice

Larger vocabularies shorten sequences (fewer tokens per document) but increase the embedding and output matrices and give each rare token fewer training examples. Recent open models use between about 100K and 250K tokens: for example, Llama 3 has a 128K-token vocabulary (128,000 in the paper's hyperparameter table, 128,256 entries in the released checkpoints) <cite data-p="grattafiori2024" data-s></cite>, gpt-oss uses a 201,088-token byte-pair tokenizer (o200k\_harmony) <cite data-p="openai2025oss" data-s></cite>, and DeepSeek-V3 has 129,280. The same sentence costs different numbers of tokens in different languages, which affects cost and context budget.

## Special tokens and chat formats

Besides ordinary text pieces, the vocabulary contains reserved tokens for structure: start and end of text, and for chat models, markers for who is speaking. A conversation is flattened to one token sequence such as `[system] … [user] … [assistant]`. gpt-oss uses the "harmony" format, with roles system, developer, user, assistant and tool in a priority order, and separate channels for the model's reasoning, tool calls and final answer <cite data-p="openai2025oss" data-s></cite>. The model is trained to follow that format, but the format is only a convention in the token stream.

## From token id to vector: embeddings

An **embedding table** $E$ is a matrix with one row per vocabulary entry and $d$ columns. The vector for token $i$ is row $i$. Equivalently, writing the token as a one-hot vector $e_{i}$, the embedding is $e_{i}^{\top}E$, a matrix product. $E$ is learned by gradient descent like any other weight; its size is $V \times d$ (for example $128,256 \times 4096 \approx 525$ million parameters in Llama 3 8B).

Early work showed that such learned vectors place related words near each other and encode regularities as directions <cite data-p="mikolov2013" data-s></cite>. In a transformer the embedding is only the starting point: layers will rewrite it using context, so the same token ends up with different vectors in different sentences.

At the output, the final vector is multiplied by another $V \times d$ matrix to produce logits (the **unembedding**). Some models tie it to $E$ to save parameters; Llama 3, gpt-oss and DeepSeek-V3 keep them separate, so the vocabulary costs $2\cdot V\cdot d$ parameters.

## Check yourself

<details>
<summary>Run three merges by hand on "low low lower": which pair is merged first?</summary>

With end markers, the corpus is l o w _, l o w _, l o w e r _. The pair (l, o) occurs 3 times, (o, w) 3 times, (w, _) 2 times. Ties are broken by implementation; merging (l, o) → "lo", then (lo, w) → "low", then (low, _) → "low_" gives a single token for the frequent word.

</details>

<details>
<summary>Why can byte-level BPE never produce an unknown token?</summary>

Every string is a sequence of bytes, and all 256 byte values are in the base vocabulary.

</details>

<details>
<summary>How many parameters are in a 201,088 × 2,880 embedding matrix?</summary>

$201,088 \times 2,880 \approx 579.1$ million. gpt-oss has an input table and a separate output matrix, so about 1.16 billion in total.

</details>

:::caution[Security link]
The tokenizer is part of the model and part of the attack surface.

-   **Special-token injection:** if untrusted text containing the literal string of a control token (such as a role marker) is tokenized as the real control token, an attacker can forge a system or assistant turn. Applications should treat control tokens as unparseable in user text.
-   **Filter bypass:** input filters that work on strings can be evaded by encodings, unusual Unicode and splitting words across tokens; the model still understands them.
-   **Glitch tokens:** tokens that appear in the vocabulary but almost never in training produce erratic behavior.
-   **Cost and denial of service:** some strings expand to many tokens; billing and context limits are in tokens.
-   **Templates are code-like:** chat templates ship with the model and have been a source of real vulnerabilities in serving software.
:::

## Papers

-   <cite data-p="sennrich2015"></cite> BPE for neural models.
-   <cite data-p="kudo2018"></cite> SentencePiece.
-   <cite data-p="mikolov2013"></cite> Learned word vectors and their geometry.
-   <cite data-p="openai2025oss"></cite> Sections 2.3 and 2.5: tokenizer and harmony chat format.
