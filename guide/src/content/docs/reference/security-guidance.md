---
title: Public security guidance for AI systems
description: What NSA, CISA and allied cyber agencies have published about securing AI, with how each document connects to the chapters.
---

Government cyber agencies now publish practical guidance on deploying and securing AI systems. These documents are short, unclassified, and written for practitioners, which makes them a useful bridge from the research in the guide to what organizations are actually told to do.

:::caution[How reliable is this page?]
The nsa.gov site blocked direct fetching while this page was researched, so most items below come from news and law-firm summaries of the documents, listed at the bottom. Items marked **confirmed** appeared in at least one such summary. Items marked **unconfirmed** come from background knowledge and were not verified in this session. Read the primary documents before quoting anything.
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
| May 20, 2026 | Model Context Protocol (MCP): Security Design Considerations for AI-Driven Automation | Risks and controls for tool-connected agents; see below | confirmed (secondary summary) |
| Aug–Sep 2026 | Joint advisory on AI-generated exploit scripts against industrial controllers; Best Practices for Cyber Hygiene | Adversaries use AI to speed up intrusions that exploit weak basics; recommends inventory, MFA, patching, segmentation, monitoring | confirmed |

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

As summarized by a secondary source: MCP does not require authentication, does not define identity binding or role-based access control, and lets agents discover tools dynamically without signed manifests. The listed threats are optional authentication, unsigned tool manifests, **tool poisoning** (through a compromised registry, a man-in-the-middle on unencrypted connections, or an impersonating server), broad or session-wide credentials, and lateral movement from a compromised agent runtime. Recommendations: per-action least-privilege tokens, signed provenance for discovered tools (pinning approved sources as a minimum), hardening MCP infrastructure like an API gateway (rate limits, anomaly detection, schema validation, audit logs for every tool call), and segmenting agent networks so sensitive stores are reachable only through mediating tools.

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

- [CISA: Joint Guidance on Deploying AI Systems Securely](https://cisa.gov/news-events/alerts/2024/04/15/joint-guidance-deploying-ai-systems-securely)
- [Alston & Bird: AI Data Security joint guidance summary](https://alston.com/en/insights/publications/2025/06/joint-guidance-ai-data-security)
- [HSToday: NSA's AISC releases joint guidance on AI data security](https://www.hstoday.us/federal-pages/dhs/nsas-aisc-releases-joint-guidance-on-the-risks-and-best-practices-in-ai-data-security/)
- [Crowell: first joint guidance on securing agentic AI](https://www.crowell.com/en/insights/client-alerts/american-and-allied-cyber-agencies-issue-first-joint-guidance-on-securing-agentic-ai)
- [AI Security Wire: NSA MCP security guidance](https://aisecuritywire.com/defensive-techniques/nsa-mcp-security-guidance-agentic-ai-2026/)
- [ExecutiveGov: NSA cyber hygiene guidance for AI-enhanced threats](https://www.executivegov.com/articles/nsa-cyber-hygiene-guidance-ai-threats)
- [SecurityWeek: NSA is starting an Artificial Intelligence Security Center](https://www.securityweek.com/national-security-agency-is-starting-an-artificial-intelligence-security-center/)
- [NSA AISC page](https://www.nsa.gov/AISC/) (the primary source; not fetchable during research)
