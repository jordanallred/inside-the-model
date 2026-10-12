---
title: Public security guidance for AI systems
description: What NSA, CISA and allied cyber agencies have published about securing AI, with how each document connects to the chapters.
---

Government cyber agencies now publish practical guidance on deploying and securing AI systems. These documents are short, unclassified, and written for practitioners, which makes them a useful bridge from the research in the guide to what organizations are actually told to do.

:::caution[How reliable is this page?]
nsa.gov rejects scripted requests, so most of this page was first assembled from news and law-firm summaries. Two documents, the MCP guidance and the distillation advisory, were later read in full from the NSA's own PDFs and are marked **confirmed (primary)**. Items marked **confirmed** appeared in at least one secondary summary. Items marked **unconfirmed** come from background knowledge and were not verified. Read the primary documents before quoting anything.
:::

## Who publishes it

The NSA's **Artificial Intelligence Security Center (AISC)** was announced in September 2023 as part of the agency's Cybersecurity Collaboration Center. Its stated purpose is to promote the secure development, integration and adoption of AI capabilities within National Security Systems and the Defense Industrial Base, built on three aims: detect and counter AI vulnerabilities, advance partnerships with industry and experts, and develop, evaluate and promote AI security best practices. Most of its publications are co-sealed with CISA, the FBI, and partner agencies in Australia, Canada, New Zealand and the United Kingdom.

## Timeline

| Date | Document | Main points | Status |
| --- | --- | --- | --- |
| Nov 2023 | Guidelines for Secure AI System Development (led by the UK NCSC and CISA) | Secure design, development, deployment and operation of AI systems | unconfirmed |
| Apr 15, 2024 | Deploying AI Systems Securely | Best practices for deploying and operating externally developed AI: protect confidentiality, integrity and availability; mitigate known vulnerabilities; detect and respond to malicious activity; harden the deployment environment | confirmed |
| Jan 2025 | Content Credentials: Strengthening Multimedia Integrity in the Generative AI Era | Provenance metadata for media | unconfirmed |
| May 22, 2025 | AI Data Security: Best Practices for Securing Data Used to Train and Operate AI Systems | Three risks (data supply chain, maliciously modified data, data drift) and lifecycle controls; see below | confirmed |
| Dec 2025 | Principles for the Secure Integration of AI in Operational Technology | Guidance on AI in industrial control settings | unconfirmed |
| May 1, 2026 | Careful Adoption of Agentic AI Services | First Five Eyes guidance on agentic AI; see below | confirmed |
| May 20, 2026 | Model Context Protocol (MCP): Security Design Considerations for AI-Driven Automation (NSA Cybersecurity Information sheet) | Risks and controls for tool-connected agents; see below | confirmed (primary) |
| Aug–Sep 2026 | Joint advisory on AI-generated exploit scripts against industrial controllers; Best Practices for Cyber Hygiene | Adversaries use AI to speed up intrusions that exploit weak basics; recommends inventory, MFA, patching, segmentation, monitoring | confirmed |
| Sep 8, 2026 | China-Based AI Companies Conducting Industrial-Scale Distillation Campaigns Against U.S. AI Companies (joint advisory by NSA, CISA and FBI) | Attributes large-scale model distillation to named companies; lists tactics and defenses; see below | confirmed (primary) |

## What the key documents say

### AI Data Security (May 2025)

Treats data as part of the AI supply chain and names three risks: **data supply chain vulnerabilities** (third-party data, web-scale datasets compiled without source verification), **maliciously modified ("poisoned") data**, including split-view and frontrunning poisoning (see [chapter 20](/guide/security/) and Carlini et al. 2023), and **data drift**, which degrades accuracy silently. Controls are organized by lifecycle stage:

- **Plan and design:** threat-model the data, minimize what you collect, document intended uses.
- **Collect and process:** validate at collection, use secure channels, verify integrity (hashes) and keep raw and processed data apart.
- **Build and use the model:** limit manipulation of inputs and outputs, have multiple reviewers validate labels, mask sensitive attributes, and use differential privacy or federated learning where appropriate.
- **Operate and monitor:** log data access and inference, use role-based access control and tamper-evident logging, watch for shifts in output distributions, audit regularly.

Technical controls named include encryption with FIPS 140-3-compliant algorithms, digital signatures, provenance tracking and trusted infrastructure. It also recommends updating incident response plans to cover poisoning, adversarial inputs and drift.

### Careful Adoption of Agentic AI Services (May 2026)

Jointly published by CISA, NSA and the cyber agencies of Australia, the UK, Canada and New Zealand. It describes four risk categories: an **expanded attack surface** (tools, APIs, memory stores, third-party integrations), **privilege compromise and scope creep**, **behavior misalignment** (actions that are technically permitted but not what the organization intended), and **obscure event records** that hamper auditing and incident response. Its advice is to adopt incrementally, starting with low-risk tasks, and to prioritize resilience, reversibility and risk containment over efficiency until standards mature, and then lifecycle-specific controls:

- **Design:** least privilege, human approval for high-risk actions, a trusted registry of authorized agents, defense in depth.
- **Develop:** train in simulated environments, run continuous capability evaluations and red-teaming, verify third-party components.
- **Deploy:** phased rollout, restricted APIs, sandboxes, layered guardrails, segmentation of high-risk agents.
- **Operate:** monitoring, human-in-the-loop review where errors are costly, regular checks on whether agents bypass safeguards, minimal privileges.

It points to the OWASP Top 10 for Agentic Applications and MITRE ATLAS for threat modeling. This is the organizational counterpart of [chapter 19](/guide/applications/).

### MCP security design considerations (May 2026)

An NSA Cybersecurity Information sheet, written with the Carnegie Mellon Software Engineering Institute. Its thesis is that MCP's adoption has outpaced its security model: the protocol is flexible and underspecified, and security depends on implementation discipline rather than protocol guarantees. It also notes that MCP inverts the usual pattern, because servers often query and sometimes act on behalf of connected clients. It names eight concerns:

- **Access control.** Tying a session to an identity is optional. Many implementations skip authentication, and those that include it often lack role-based permissions (for example, separate create, read, update and delete rights).
- **Insecure serialization.** Structured context and payloads are often not validated against a schema, so comments or prompts can carry injected instructions.
- **Poor approval workflows.** Protocol-level enforcement of user consent is absent, and a server that is already trusted can change its capabilities without a new approval.
- **Token and session security.** Authorization is optional, bearer tokens have no mandated lifecycle (refresh, revocation, rotation), and replay and session hijacking are possible.
- **Misconfiguration.** A trivial server, such as one for weather, can later be repurposed for sensitive data, and servers often lack task or data isolation.
- **Inconsistent behavior.** Different agents interpret the same context differently, which an attacker can exploit by preconditioning an agent.
- **Missing audit logs.** Many implementations log nothing, or very little.
- **Denial of service.** Prompt storms, recursive task requests and "lethargy" attacks that exhaust resources with legitimate but expensive tasks.

Its real-world examples are tool-parameter injection in open-source agents, tool-name collisions that load attacker-controlled code, over-broad GitHub MCP access (private repositories read and published to public ones), a malicious server that coerced a WhatsApp MCP client into exposing message history, outputs from one agent injected into the next, and CVE-2025-49596, a remote code execution flaw in the MCP Inspector tool (fixed in 0.14.1).

Its recommendations are to prefer supported, audited MCP projects and run them locally for private data; draw trust boundaries and align tools with data-classification zones; use a filtering outbound proxy or data loss prevention; validate every tool parameter against a schema and its context; sandbox tool execution with OS controls such as seccomp, AppArmor, SELinux or AppContainers and least privilege; sign MCP messages with expiry timestamps and replay protection; treat every tool output as untrusted input to the next stage; log every invocation with parameters, identities and hashes of results, feeding a SIEM; track MCP vulnerabilities and keep an inventory of deployed servers; and scan the network for unauthenticated or unauthorized MCP servers.

An earlier version of this page, written from a secondary summary, listed "signed tool manifests", per-action tokens and agent network segmentation as the document's themes. Those do not appear in the NSA text, which is why the section was rewritten from the PDF.

### Distillation campaigns against US AI companies (September 2026)

A joint advisory from the NSA, CISA and the FBI (marked TLP:CLEAR). It is a government attribution, so the claims below are the agencies' and are reported as such. It says that DeepSeek, Moonshot AI, Alibaba, MiniMax, StepFun and Z.AI extracted billions of tokens across millions of requests from US frontier models since at least late 2024, and that this was probably known to the Chinese government. It treats distillation as a legitimate technique that these campaigns use maliciously, and says it is central to those companies' development rather than a supplement. It also argues that DeepSeek's publicly quoted $5.6M training cost omits the cost of the data acquired this way.

How it is done, by the advisory's account:

- **Access.** Fraudulent accounts with similar registration and payment details, bulk-purchased premium subscriptions shared across developers, and a gray market of API proxies called "transfer stations" that bypass regional restrictions and erase traceability.
- **Routing.** Central tooling spreads requests across native APIs, cloud providers, aggregators and account pools, with automated failover when blocked and automated removal of organizational metadata. One example is a company retargeting a new model within 24 hours of release.
- **Extraction.** Prompts crafted to make models write out their hidden chain-of-thought reasoning, millions of exchanges aimed at agentic tool use, coding and computer-use skills, and rubric-grading queries that reveal how a model judges response quality.
- **Verification.** Automated quality checks that tell a service fault from a deliberately degraded answer.

It maps these to MITRE ATLAS techniques (for example AML.T0040 inference API access, AML.T0051 prompt injection, AML.T0024.002 extraction via inference API) and describes four techniques that ATLAS does not cover: regional-restriction and subscription evasion, centralized request routing, automated metadata sanitization, and quota and cost optimization. Detection indicators include shared accounts across many IPs, round-the-clock usage with no human idle periods, new subscriptions that start at maximum usage, and correlated timing across pathways.

Recommended defenses: behavioral detection and stronger identity verification; **subtly altering responses** to high-confidence distillers, for example with differential privacy, reduced reasoning depth, or a downgraded model, varied across requests so the change is hard to notice and without telling the suspected distiller, while safety researchers and third-party evaluators are told of any change; and cross-organization sharing of infrastructure and behavioral indicators among model providers, cloud platforms and aggregators. It also lists ATLAS mitigations such as per-key rate limits, telemetry logging, output obfuscation (withholding logits, shortening responses), red-teaming for extraction, and limiting public release of architecture and prompt templates. The differential-privacy discussion stresses a finite privacy budget and the noise-versus-utility tradeoff.

This is the policy side of the extraction attacks in [chapter 20](/guide/security/) and of distillation as a training technique ([post-training](/guide/post-training/)).

## Frameworks you will see cited

These are from background knowledge, not from the sources above:

- **NIST AI Risk Management Framework** (January 2023): four functions, Govern, Map, Measure, Manage; a companion Generative AI Profile; and a separate NIST taxonomy of adversarial machine learning attacks (evasion, poisoning, privacy, abuse).
- **MITRE ATLAS:** an ATT&CK-style knowledge base of tactics, techniques and case studies specific to AI systems.
- **OWASP Top 10 for LLM Applications (2025):** prompt injection; sensitive information disclosure; supply chain; data and model poisoning; improper output handling; excessive agency; system prompt leakage; vector and embedding weaknesses; misinformation; unbounded consumption.

## Common themes

- **AI systems are software first.** Apply threat modeling, least privilege, logging and patching before anything AI-specific.
- **Data is part of the supply chain.** Provenance, integrity and signing apply to datasets and model files, not only code ([chapter 16](/guide/pretraining/)).
- **Assume the model can be manipulated.** Limit blast radius with scoped credentials, approval gates, sandboxes and egress control ([chapters 19–20](/guide/security/)).
- **Measure, don't assume.** Evaluate with statistics and adaptive attackers ([chapter 21](/guide/evaluation/)).
- **Adopt incrementally.** Start with reversible, low-impact tasks.

## Sources

- [NSA: Model Context Protocol (MCP): Security Design Considerations for AI-Driven Automation](https://media.defense.gov/2026/Jun/02/2003943289/-1/-1/0/CSI_MCP_SECURITY.PDF) (primary; read in full)
- [NSA, CISA, FBI: China-Based AI Companies Conducting Industrial-Scale Distillation Campaigns Against U.S. AI Companies](https://media.defense.gov/2026/Sep/08/2003992823/-1/-1/0/CSA_CHINA_BASED_AI_COMPANIES_MALICIOUS_DISTILLATION_AGAINST_US.PDF) (primary; read in full)
- [CISA: Joint Guidance on Deploying AI Systems Securely](https://cisa.gov/news-events/alerts/2024/04/15/joint-guidance-deploying-ai-systems-securely)
- [Alston & Bird: AI Data Security joint guidance summary](https://alston.com/en/insights/publications/2025/06/joint-guidance-ai-data-security)
- [HSToday: NSA's AISC releases joint guidance on AI data security](https://www.hstoday.us/federal-pages/dhs/nsas-aisc-releases-joint-guidance-on-the-risks-and-best-practices-in-ai-data-security/)
- [Crowell: first joint guidance on securing agentic AI](https://www.crowell.com/en/insights/client-alerts/american-and-allied-cyber-agencies-issue-first-joint-guidance-on-securing-agentic-ai)
- [ExecutiveGov: NSA cyber hygiene guidance for AI-enhanced threats](https://www.executivegov.com/articles/nsa-cyber-hygiene-guidance-ai-threats)
- [SecurityWeek: NSA is starting an Artificial Intelligence Security Center](https://www.securityweek.com/national-security-agency-is-starting-an-artificial-intelligence-security-center/)
- [NSA AISC page](https://www.nsa.gov/AISC/) (the index of NSA advisories and guidance is linked from here; older AI documents on it have not yet been checked against the primary PDFs)
