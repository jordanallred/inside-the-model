---
title: "Prompting, retrieval, tools, agents and MCP"
description: "How models become applications, and where trust breaks"
sidebar:
  label: "19. Prompting, retrieval, tools, agents and MCP"
---

_How models become applications, and where trust breaks_

Chapter 19 of 21 · VI. Systems · about 40 minutes. Builds on: [17. Post-training: instruction tuning, preferences and reinforcement learning](/guide/post-training/).

:::tip[Skip this chapter if]
you can explain in-context learning and chain of thought, how retrieval-augmented generation works end to end, how tool calling and agent loops are built, what MCP is, and where untrusted text enters each of these.
:::

## A trained model is a component, not a product

Applications wrap the model in a program that builds the prompt, calls the model, and acts on the output. Everything in this chapter happens at inference time with fixed weights.

## In-context learning and prompting

Given a few examples of a task in the prompt, a large model performs the task on a new input without any weight update. GPT-3 <cite data-p="brown2020" data-s></cite> made this "few-shot learning" visible. A mechanistic partial explanation: **induction heads** <cite data-p="olsson2022" data-s></cite> ([Chapter 6](/guide/attention/)) copy patterns seen earlier in the context, and they emerge at the same point in training where in-context learning improves. Practical consequences:

-   **The prompt is a program.** Instructions, examples and formatting all steer the model, and the model cannot distinguish "your" instructions from instructions embedded in data it reads.
-   **Chain of thought:** asking for or demonstrating intermediate steps improves multi-step reasoning in large models <cite data-p="wei2022" data-s></cite>. Reasoning models now generate such steps by default ([Chapter 17](/guide/post-training/)).
-   **Context budget:** the window is finite, and models use it unevenly; information in the middle of a very long prompt is used less reliably <cite data-p="liu2023lost" data-s></cite>.

## Retrieval-augmented generation (RAG)

Models do not know your private documents and their knowledge has a cutoff. RAG <cite data-p="lewis2020" data-s></cite> fetches relevant text at query time and places it in the prompt.

1.  **Index:** split documents into chunks; convert each chunk to a vector with an **embedding model** (a network trained so that texts with similar meaning get nearby vectors); store them in a vector index.
2.  **Retrieve:** embed the question; find the $k$ chunks with the highest **cosine similarity**, $\cos(u,v)=\dfrac{u\cdot v}{\lVert u\rVert\,\lVert v\rVert}$ (approximate nearest-neighbor search makes this fast at scale).
3.  **Generate:** build a prompt containing the question and the retrieved chunks; the model answers from them.

The demo uses an older, simpler vector (TF-IDF word weights) but the pipeline is the same. The corpus contains one poisoned document; see what happens when it is retrieved.

<div class="widget not-content" data-w="rag" data-title="Retrieval, prompt assembly and a poisoned document"></div>

Failure modes: irrelevant or missing retrieval, chunk boundaries that cut context, conflicting sources, stale data, access-control mismatches (retrieval returns a document the asking user is not cleared to see), and instruction text hiding in retrieved documents.

## Tool use

A model can be trained to emit a structured request, such as a JSON object naming a function and its arguments, instead of prose. The application code, not the model, executes the call and appends the result to the conversation. Research showed that models can learn when and how to call tools from examples <cite data-p="schick2023" data-s></cite>, and that interleaving reasoning steps with actions improves problem solving <cite data-p="yao2022" data-s></cite> (the ReAct pattern). gpt-oss's harmony format has a dedicated channel and role for tool calls and tool outputs <cite data-p="openai2025oss" data-s></cite>.

## Agents

An **agent** is a loop around a model with tools:

```python
messages = [system_prompt, user_request]
while True:
    reply = model(messages)            # may contain tool calls
    if no tool calls: return reply
    for call in reply.tool_calls:
        result = execute(call)         # YOUR code runs it, with YOUR credentials
        messages.append(result)        # model reads the result next turn
```

Capabilities (browse, run code, edit files, send mail) come entirely from the tools wired into the loop; so do the risks. The model decides which tools to call based on all the text in the context, including tool outputs.

## The Model Context Protocol (MCP)

MCP is an open protocol for connecting AI applications to tools and data without custom integrations for each. An application (the _client_) connects to _servers_ that expose **tools** (actions), **resources** (data) and **prompts** (templates), exchanging JSON-RPC messages over a local process pipe or HTTP. Two properties matter for security: tool names and descriptions are fed to the model as text (so a description is itself a prompt), and the protocol leaves authentication, identity binding and manifest signing largely to implementers. NSA's May 2026 information sheet on MCP, as summarized by secondary sources, addresses exactly these gaps with per-action least-privilege tokens, signed or pinned tools, gateway-style hardening and network segmentation (see the [security guidance reference](/reference/security-guidance/)).

## Where untrusted text enters

| Component | Untrusted inputs |
| --- | --- |
| Prompting | user message, pasted documents, uploaded files |
| RAG | every indexed document; web pages; emails; wiki pages anyone can edit |
| Tools | tool results (search snippets, file contents, API responses, error messages) |
| Agents | everything above, plus other agents' messages and memory from earlier sessions |
| MCP | tool descriptions and manifests, server responses, resource contents |

All of these arrive in the same token stream. <cite data-p="greshake2023" data-s></cite> named the resulting attack **indirect prompt injection**: an attacker who cannot talk to the model plants instructions where the model will later read them. The most useful heuristic for reviewing an agent is the "lethal trifecta" (Simon Willison): private data access + exposure to untrusted content + a way to communicate externally. If all three are present, data theft is possible; remove one.

## Check yourself

<details>
<summary>Explain why a RAG system can leak documents across users even with a perfect model.</summary>

Retrieval is by similarity, not permission. If the index mixes documents of different clearances and the retriever does not filter by the asking user's rights, restricted text enters the prompt and the model will use it. Access control must be enforced at retrieval time.

</details>

<details>
<summary>In the agent loop, who holds the credentials used by execute(call)?</summary>

The application. The model only produces text; if a hijacked model requests an action, the application's credentials perform it, so tools should be scoped to the minimum privilege per action.

</details>

<details>
<summary>Why is a tool description a prompt-injection surface?</summary>

Descriptions are inserted into the model's context as text. A malicious or compromised server can write instructions into its descriptions, and the model may follow them.

</details>

:::caution[Security link]
This chapter is where prompt injection lives. [Chapter 20](/guide/security/) covers the defenses, including privilege-separated architectures.
:::

## Papers

-   <cite data-p="brown2020"></cite> Few-shot learning at scale.
-   <cite data-p="olsson2022"></cite> A mechanism behind in-context learning.
-   <cite data-p="wei2022"></cite> Chain of thought.
-   <cite data-p="lewis2020"></cite> RAG.
-   <cite data-p="yao2022"></cite>, <cite data-p="schick2023"></cite> Reasoning with tools.
-   <cite data-p="liu2023lost"></cite> Using long contexts.
-   <cite data-p="greshake2023"></cite> Indirect prompt injection in real applications.
