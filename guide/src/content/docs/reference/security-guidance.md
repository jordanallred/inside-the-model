---
title: Public security guidance for AI systems
description: What NSA, CISA and allied cyber agencies have published about securing AI, with how each document connects to the chapters.
---

Government cyber agencies now publish practical guidance on deploying and securing AI systems. These documents are short, unclassified, and written for practitioners, which makes them a useful bridge from the research in the guide to what organizations are actually told to do.

:::note[How this page was checked]
Each document below was read from the published PDF of an agency's own publication: NSA, CISA, or a co-authoring agency's site. The Content Credentials sheet was read for its scope, definitions and framing rather than every use case; the others were read through. Dates are the publisher's. Last checked October 12, 2026.
:::

:::note[Why some agency pages say "Super Intelligence"]
On September 29, 2026 the President signed an executive order, "Inaugurating the Era of Super Intelligence," directing executive-branch agencies to use "Super Intelligence" and "SI" in place of "artificial intelligence" and "AI" in correspondence, public communications and other non-statutory documents ([White House fact sheet](https://www.whitehouse.gov/fact-sheets/2026/09/fact-sheet-president-donald-j-trump-inaugurates-the-era-of-super-intelligence/)). Agency web pages updated since then, such as NSA's AISC page and CISA's agentic AI page, use the new term. The documents listed below were published earlier and say "AI". This page keeps "AI" throughout, which is also what the NIST, MITRE and OWASP materials use.
:::

## Who publishes it

The NSA's **Artificial Intelligence Security Center (AISC)** was announced on September 28, 2023 by then-director Gen. Paul Nakasone, as part of the agency's Cybersecurity Collaboration Center. Its stated purpose is to promote the secure development, integration and adoption of AI capabilities within National Security Systems and the Defense Industrial Base. It lists three aims: detect and counter AI vulnerabilities, advance partnerships with industry and experts, and develop, evaluate and promote AI security best practices. Its main publications are written with CISA, the FBI and partner agencies in Australia, Canada, New Zealand and the United Kingdom. Some, such as the MCP sheet, are NSA-only.

## Timeline

| Date | Document | Published by | What it covers |
| --- | --- | --- | --- |
| Nov 27, 2023 | Guidelines for Secure AI System Development | UK NCSC and CISA, with more than 20 other agencies | 17 guidelines across four stages: secure design, development, deployment, operation and maintenance; see below |
| Apr 15, 2024 | Deploying AI Systems Securely | NSA AISC, CISA, FBI, and agencies from Australia, Canada, New Zealand and the UK | Hardening the environment an externally built AI system runs in, with specific controls for model weights; see below |
| Jan 29, 2025 | Content Credentials: Strengthening Multimedia Integrity in the Generative AI Era | NSA with agencies from Australia, Canada and the UK | Cryptographically signed provenance metadata for media (C2PA), and why it matters against AI-generated media; see below |
| May 22, 2025 | AI Data Security: Best Practices for Securing Data Used to Train & Operate AI Systems | NSA AISC, CISA, FBI, and agencies from Australia, New Zealand and the UK | Ten data-security practices and three risk areas; see below |
| Dec 3, 2025 | Principles for the Secure Integration of Artificial Intelligence in Operational Technology | CISA, NSA AISC, FBI, and agencies from Australia, Canada, Germany, the Netherlands, New Zealand and the UK | Four principles: understand AI; consider AI use in the OT domain; establish governance and assurance; embed oversight and failsafe practices; see below |
| Mar 2026 | Artificial intelligence and machine learning: Supply chain risks and mitigations | Australia's ACSC, co-sealed by NSA and agencies from Canada, Singapore, South Korea, Japan, New Zealand and the UK | Risks and mitigations for AI data, models, software, hardware and third-party services; see below |
| Apr 30 – May 1, 2026 | Careful Adoption of Agentic AI Services | CISA, NSA, and agencies from Australia, Canada, New Zealand and the UK | Risks and lifecycle controls for LLM-based agents; see below. NSA's index lists April 30, CISA's release May 1 |
| May 20, 2026 | Model Context Protocol (MCP): Security Design Considerations for AI-Driven Automation | NSA | Eight protocol and deployment concerns and a set of controls; see below |
| Aug 19, 2026 | Defending Against an Active Threat to Siemens S7 Series PLCs | NSA, CISA, FBI, Department of Energy, EPA | Attackers using AI-generated exploit scripts against industrial controllers; see below |
| Sep 3, 2026 | Best Practices Guide for Cyber Hygiene | NSA | Tiered basic controls against AI-assisted intrusions; see below |
| Sep 8, 2026 | China-Based AI Companies Conducting Industrial-Scale Distillation Campaigns Against U.S. AI Companies | NSA, CISA, FBI | Attribution of large-scale model distillation, with tactics and defenses; see below |

## What the key documents say

### AI Data Security (May 2025)

Treats data as part of the AI supply chain, on the premise that models learn their decision logic from data, so an attacker who can manipulate the data can manipulate the system. It maps data-security concerns onto the six lifecycle stages of the NIST AI Risk Management Framework (Plan & Design through Operate & Monitor) and gives **ten best practices**:

1. Source reliable data and track provenance, ideally in a cryptographically signed, append-only provenance database.
2. Verify integrity in storage and transport with checksums and cryptographic hashes.
3. Sign datasets, including those used for fine-tuning, alignment and RLHF, with quantum-resistant digital signature standards, and have each person who revises the data sign their change.
4. Use trusted infrastructure: zero-trust architecture and secure enclaves for data processing.
5. Classify data and apply access controls. AI output should be classified at the same level as the input data.
6. Encrypt data at rest, in transit and in processing. AES-256 is named as the de facto standard.
7. Store data in certified devices that enforce FIPS 140-3.
8. Use privacy-preserving techniques: data masking, differential privacy (with its privacy-budget and accuracy tradeoff), and federated learning.
9. Delete data securely before repurposing drives.
10. Run ongoing data-security risk assessments, using frameworks such as the NIST RMF and AI RMF.

It then examines three risk areas in depth:

- **Data supply chain.** Third-party and web-scale data cannot be assumed clean. The sheet describes **split-view poisoning**, which works because curated datasets such as LAION-2B and COYO-700M point to content on domains whose registrations can lapse; an attacker who buys an expired domain controls what the dataset downloads. It cites roughly $1,000 to gain enough control to poison a dataset, and as little as $60 for COYO-700M. It also describes **frontrunning poisoning**, where edits are timed just before a crowd-sourced site snapshots its data. Wikipedia snapshots twice a month, and the cited analysis found as much as 6.5% could be poisoned. Both come from Carlini et al., *Poisoning Web-Scale Training Datasets is Practical* (2023), covered in [chapter 20](/guide/security/). Mitigations are hashes attached by dataset curators and checked by consumers, periodic re-scraping, randomized or delayed snapshots, requiring certification from dataset and foundation-model providers, and, for web-crawled data, trusting only content that appears on many independent sites. For crawled data without that kind of curation, the sheet advises against use until some trust infrastructure exists.
- **Maliciously modified data.** Five risks: adversarial ML threats (poisoning, adversarial examples, model inversion), missing or tampered metadata, statistical bias, deliberately inaccurate information, and duplicates. Mitigations include anomaly detection and sanitization before every training or fine-tuning run, secured training pipelines, ensembles of distinct models, metadata validation, representative train/dev/eval splits without overlap, adding more clean data, and deduplication.
- **Data drift.** Input data shifts away from the training distribution and degrades accuracy silently. The sheet gives a way to tell drift from an attack: slow, gradual change points to drift, and abrupt, dramatic change suggests someone is trying to compromise the model. Mitigations are monitoring inputs and outputs, data-quality testing, retraining on current data, and ensembles.

### Guidelines for Secure AI System Development (November 2023)

The founding document of this body of guidance, published by the UK NCSC and CISA together with more than 20 other agencies. Its acknowledgements credit AI developers including Anthropic, Google DeepMind, Microsoft and OpenAI. "AI" here means machine learning. It is written for providers of any system that uses ML, whether built from scratch or on someone else's models and APIs, and rests on "secure by design": a provider of an AI component should take responsibility for the security outcomes of users further down the supply chain, and where a risk cannot be mitigated, tell those users what they are accepting and how to use the component safely. It defines adversarial machine learning as exploitation of ML components that can degrade a model's performance, permit unauthorized actions or extract sensitive model information, through routes such as prompt injection and data poisoning. It has 17 guidelines in four stages:

- **Secure design:** raise staff awareness of AI threats; model the threats to the system; design for security as well as functionality and performance; weigh security trade-offs when selecting a model.
- **Secure development:** secure the supply chain; identify, track and protect assets (models, data, prompts, logs); document data, models and prompts (model cards, data cards, SBOMs); manage technical debt.
- **Secure deployment:** secure the infrastructure; protect the model continuously; develop incident management procedures; release AI responsibly; make it easy for users to do the right thing.
- **Secure operation and maintenance:** monitor the system's behavior; monitor its inputs; use a secure-by-design approach to updates; collect and share lessons learned.

Specific points that recur in later documents: third-party models and serialized weights should be scanned and sandboxed and treated as untrusted code that could enable remote code execution; compute and share cryptographic hashes or signatures of model files and datasets as soon as a model is trained; put controls on the query interface, because attackers can reconstruct a model's functionality or training data through queries; treat logs as sensitive data; release only after security evaluation such as benchmarking and red teaming; give customers audit logs at no extra charge; and treat major data, model or prompt changes like new versions.

### Deploying AI Systems Securely (April 2024)

Written for organizations that deploy and operate AI systems built by someone else, especially on premises or in a private cloud in high-threat settings. It says it does not apply to organizations that only use AI systems deployed by others. It expands the secure deployment and secure operation stages of the guidelines above and aligns with the CISA and NIST Cybersecurity Performance Goals. Its stated goals are to improve the confidentiality, integrity and availability of AI systems, make sure known vulnerabilities are mitigated, and provide controls to protect, detect and respond to malicious activity. The practices fall in three groups:

- **Secure the deployment environment.** The person accountable for AI security should be the one accountable for the organization's security in general, and the developer should supply a threat model. Protect model weights with an access control system limited to privileged users under two-person control and two-person integrity. Keep a catalog of trusted data sources to guard against poisoning and backdoors. Run models in hardened containers or virtual machines behind allow-listed firewalls. Encrypt weights, outputs and logs at rest, with keys in a hardware security module, and require phishing-resistant MFA. Assume breach, and be able to block a suspected malicious user or disconnect all inbound connections to the models in a major incident.
- **Continuously protect the AI system.** The sheet's starting point is that models are software and may carry vulnerabilities or malicious code. Verify each artifact with signatures and checksums, archive a hash and encrypted copy of every release in a tamper-proof location, and keep code and artifacts in version control. Inspect imported pre-trained models in a secure development zone and use AI-specific scanners before any tuning, training or deployment. Test for robustness after modification, including adversarial testing, and prepare automated rollbacks with a human in the loop. Secure exposed APIs and validate and sanitize inputs, for example against prompt injection. Log inputs, outputs, intermediate states and errors, and monitor for attempts to extract data or aggregate inference responses. For the weights themselves, return only the minimal data an API needs, to inhibit model inversion, and isolate storage in a vault, a highly restricted zone or an HSM.
- **Secure operation and maintenance.** Role-based access control, or preferably attribute-based, with MFA and privileged access workstations for administrators; user training; external audits and penetration testing; watching for data drift and for high-frequency or repetitive inputs, which can signal model compromise or automated attempts; alerts for oracle-style compromise attempts; a full evaluation of accuracy, performance and security before redeploying an updated model; immutable backups; and secure, irretrievable deletion.

Its conclusion singles out model weights as a particularly critical asset, because they embody the compute, data and algorithmic optimization that went into training.

### AI/ML supply chain risks and mitigations (March 2026)

Published by Australia's ACSC, whose Commonwealth copyright the document carries, and co-sealed by NSA and agencies from Canada, Singapore, South Korea, Japan, New Zealand and the UK. Its premise is that the AI and ML supply chain is complex, and each component can carry vulnerabilities that expose training data, degrade a system, or execute malicious code. It covers five components and maps its risks to the NIST adversarial ML taxonomy and to the ATLAS "AI Supply Chain Compromise" technique. At the organizational level it recommends requiring and maintaining an AI bill of materials (AIBOM) and a software bill of materials, doing initial and ongoing risk assessments, and keeping an incident response plan for the AI supply chain.

- **AI data.** Risks: low-quality or biased data, data poisoning (which can also deliver indirect prompt injection), and exposure of training data through model inversion, membership inference and training-data extraction. It argues that prevention beats detection for data, and recommends a documented collection method, quarantining and testing external data on isolated systems, review and preprocessing, sanitization, trusted sources, and verification and provenance. It notes that a checksum only proves the data matches its source, not that the source was clean. It also recommends ensemble methods and obfuscation (anonymization, differential privacy or synthetic data).
- **Machine learning models.** Risks: **model serialization attacks**, where malicious code is added to the packaged model and runs when it is loaded; **model poisoning** in three forms (availability poisoning that degrades performance, targeted poisoning that adds bias, and backdoor poisoning that embeds a hidden trigger); **stegomalware**, where malware hides in a model's weights or metadata, which antivirus does not normally check; and evasion attacks. A case study reports 2025 research finding malicious serialized models still being uploaded to popular sharing platforms without being flagged. Mitigations: validate models at retrieval, prefer non-executable and weight-only formats with safe-loading flags, use trusted and transparent sources whose AIBOMs list training data, test performance initially and periodically against reference data whose integrity is itself protected, keep a registry of verified model versions, use reproducible builds, monitor inputs and outputs, and apply adversarial training. It adds that pruning, compression and fine-tuning can disrupt embedded malware, often at some cost to performance.
- **AI software.** Libraries and frameworks add attack surface, including deserialization flaws that can lead to token theft or remote code execution, and typosquatting. It cites a 2024 compromise of a published AI library that installed cryptocurrency-mining malware. Validate integrity, scan, keep an SBOM, and run with least privilege.
- **AI infrastructure and hardware.** Accelerators add attack surface through drivers and firmware. Enforce signed drivers and firmware, enable verified boot, and use separate management networks.
- **Third-party services.** Vendors can bring their own supply chain risk, incidents and shared-tenant exposure. Assess vendors and write security terms into contracts, such as limits on using your data for training, cloud residency, audit rights, continuity requirements and shared-responsibility models.

### Principles for the Secure Integration of AI in Operational Technology (December 2025)

Voluntary guidance for critical infrastructure owners and operators from nine agencies: CISA, ASD's ACSC, NSA's AISC, the FBI, the Canadian Cyber Centre, Germany's BSI, the Netherlands' NCSC, NCSC-NZ and NCSC-UK. It covers ML- and LLM-based AI and AI agents in operational technology (OT), and uses "safety" to mean functional safety, the prevention of physical harm. It notes that predictive ML typically sits in the operational layers of the Purdue model (levels 0 to 3) and LLMs in business networks (levels 4 and 5). It tabulates risks including manipulation of data and models, poor data quality, model drift, lack of explainability, alarm errors that raise operator workload, regulatory compliance, overreliance and skill erosion, interoperability, added complexity, and reliability: it says LLMs almost certainly should not be used to make safety decisions in OT because they can hallucinate. The four principles:

1. **Understand AI.** Know its risks and the secure AI lifecycle, be clear about roles with the vendor and integrator, and train staff to avoid overreliance, for example by teaching them to check AI output against independent sensors.
2. **Consider AI use in the OT domain.** Ask whether AI is the right tool at all, and compare it with established capabilities. Protect OT data, in particular engineering configuration data such as network diagrams and logic diagrams, and ephemeral process data that can persist statistically inside a trained model. Hold vendors to disclosure: contracts, SBOMs, data-use policies, the ability to run without a continuous internet connection, and the ability to disable AI features. Prefer push-based architectures that move data out of the OT network without persistent inbound access.
3. **Establish AI governance and assurance.** Involve leadership, OT, IT and security experts, fold AI into existing security frameworks (using ATLAS alongside ATT&CK), and test on non-production infrastructure, including hardware in the loop, before production. Define thresholds at which the system falls back to non-AI operation. It notes that existing AI standards are aimed at IT, not OT.
4. **Embed oversight and failsafe practices.** Its starting point is that humans are responsible for functional safety. Inventory AI components and what depends on them, log inputs and outputs, and define a known-good state. Keep a human in the loop, and use caution with AI that directly influences control, since problems can escalate before operators notice. Know the false positive and false negative rates against the base rate. Log AI decisions under an identity distinct from other machine or user identifiers. Add AI failure states, including how to bypass or replace the AI, to functional safety and incident response plans.

### Careful Adoption of Agentic AI Services (May 2026)

Published by CISA, NSA and the cyber agencies of Australia, Canada, New Zealand and the UK. CISA's release names four risks: an **expanded attack surface**, **privilege creep**, **behavioral misalignment** and **obscure event records**. The guidance itself groups agentic risks as privilege, design and configuration, behavioral, structural and accountability risks, on top of the risks inherited from the underlying LLM. Its overall advice is to adopt incrementally, starting with low-risk, non-sensitive tasks, and to put resilience, reversibility and risk containment ahead of efficiency while standards mature. The lifecycle controls are:

- **Design:** a clear instruction hierarchy, human control points and approval for decision-making steps, each agent as a distinct identity (mutual TLS, a trusted registry, minimum permissions), and defense in depth with strict boundaries on handoffs between agents.
- **Develop:** adversarial testing and simulated environments, red-teaming in sandboxes, input validation and prompt-injection filters, fail-safe defaults, versioning and rollback, logging of agent interactions by default, and a trusted registry and allow list for third-party components.
- **Deploy:** threat modeling with the OWASP GenAI Security Project and MITRE ATLAS, governance and legal accountability, phased rollout with graduated autonomy, and agents that stop and escalate when uncertain.
- **Operate:** monitoring and auditing all agent operations, human approval for high-impact actions, classification of actions by impact, likelihood and reversibility, just-in-time credentials, and regular tests of whether agents bypass safeguards.

This is the organizational counterpart of [chapter 19](/guide/applications/).

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

### AI-generated exploit scripts against industrial controllers (August 2026)

A joint advisory from the NSA, CISA, FBI, Department of Energy and EPA about an active threat to Siemens S7 Series PLCs (S7-200 through S7-1500, including F-series safety controllers), with a note that PLC targeting is broader than Siemens. The actors use AI-generated exploitation scripts, built on the open-source snap7 library, that are disguised as legitimate monitoring tools and give read/write access to PLC memory and ladder logic over the S7comm protocol. They find exposed devices with Internet scanning services such as Censys and ZoomEye. The advisory frames the AI element as lowering the expertise and time needed to build working ICS exploitation tools, not as a new vulnerability: the PLCs it describes are compromised through known vulnerabilities and weak or default credentials. The top mitigations are inventorying PLCs, applying patches, keeping PLCs off the Internet, strengthening access controls, monitoring for unauthorized activity, hardening services and protocols, and hunting for anomalies.

### Best Practices Guide for Cyber Hygiene (September 2026)

An NSA-only sheet on the same theme as the Siemens advisory: advanced persistent threats and cybercriminals use AI to accelerate and scale their exploitation techniques, so poorly configured and unpatched networks are targeted more often. NSA says the mitigations were validated against AI-generated exploitation plans and AI-identified vulnerabilities, and that the guide is informed by its own red-team, blue-team and hunt work. The principles are defense in depth, assume breach, least privilege, continuous validation and human oversight of AI tools. The mitigations are ordered into maturity tiers:

- **Tier 0, immediate:** a full network inventory (hardware, software, accounts, data flows), identity and access management with time-limited privileged access, network segmentation, automated patching and configuration, universal phishing-resistant MFA, SIEM log ingestion, removing unneeded network paths, user-activity baselines, tuned endpoint detection, strict application allowlisting with signed execution, and tested incident response.
- **Tier 1:** begin security orchestration and automation (SOAR), refine detection and logging, and validate segmentation.
- **Tier 2:** build and test automated responses, with a human in the loop where AI is part of the process.
- **Tier 3:** adversarial emulation and red-team assessment, recovery exercises and continuous hunting.

Its appendices give an inventory checklist, a table of ten common misconfigurations with fixes (default credentials, excess privileges, missing segmentation, weak MFA and others), and a mapping to NSA's Top Ten Cybersecurity Mitigation Strategies. It also suggests feeding inventories and logs to AI for anomaly detection, with human validation. The sheet says plainly that it does not cover every attack vector and should not be the only hardening measure.

### Content Credentials (January 2025)

Written by the NSA with the Australian, Canadian and UK agencies, as a follow-up to the earlier *Contextualizing Deepfake Threats to Organizations* sheet. It concerns AI-generated media: convincing manipulated or synthetic images, video and audio are now cheap to make, and traditional verification may not catch them. It points to **Content Credentials**, the C2PA specification, as a response: cryptographically signed metadata that records a media file's origin and editing history, added when software exports a file or when hardware creates it. **Durable Content Credentials** add a digital watermark and a media-fingerprint matching system so the metadata can be recovered if it is stripped. It stresses that this metadata does not prove content is true; it supplies context for judging authenticity. It notes the standard is nascent, that support is most mature for images and least tested for text, and that C2PA was being fast-tracked as an ISO standard. It connects to the NIST generative AI profile, which recommends policies that maintain provenance information. This is the media-side counterpart to the data provenance controls in the AI Data Security sheet.

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

The agency documents above lean on these, and each was checked against its publisher:

- **NIST AI Risk Management Framework** (AI 100-1, released January 26, 2023): four functions, Govern, Map, Measure and Manage. NIST published a **Generative AI Profile** (AI 600-1) on July 26, 2024, and a separate taxonomy of adversarial machine learning attacks, **AI 100-2 E2025** (March 2025), which organizes attacks including data poisoning, evasion, privacy breaches and abuse.
- **MITRE ATLAS:** a living knowledge base of adversary tactics and techniques involving AI, based on observed attacks and red-team demonstrations. Its site currently lists 16 tactics, 208 techniques, 40 mitigations and 73 case studies.
- **OWASP Top 10 for LLM Applications (2025):** prompt injection; sensitive information disclosure; supply chain; data and model poisoning; improper output handling; excessive agency; system prompt leakage; vector and embedding weaknesses; misinformation; unbounded consumption.

## Common themes

- **AI systems are software first.** Apply threat modeling, least privilege, logging and patching before anything AI-specific.
- **Data is part of the supply chain.** Provenance, integrity and signing apply to datasets and model files, not only code ([chapter 16](/guide/pretraining/)).
- **Assume the model can be manipulated.** Limit blast radius with scoped credentials, approval gates, sandboxes and egress control ([chapters 19–20](/guide/security/)).
- **Measure, don't assume.** Evaluate with statistics and adaptive attackers ([chapter 21](/guide/evaluation/)).
- **Adopt incrementally.** Start with reversible, low-impact tasks.
- **The basics still decide outcomes.** The Siemens and cyber-hygiene documents both say AI speeds up attackers who exploit unpatched, exposed and poorly configured systems.

## Sources

Primary documents (the NSA PDFs are served as downloads and may not open in some browsers or automated tools):

- [NSA: Best Practices Guide for Cyber Hygiene](https://media.defense.gov/2026/Sep/03/2003991426/-1/-1/0/CSI_CYBER_HYGIENE.PDF) · [NSA press release, Sept. 3, 2026](https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/Article/4590054/nsa-highlights-cyber-hygiene-best-practices-effective-against-ai-enhanced-targe/)
- [Careful Adoption of Agentic AI Services (NSA copy)](https://media.defense.gov/2026/Apr/30/2003922823/-1/-1/0/CAREFUL%20ADOPTION%20OF%20AGENTIC%20AI%20SERVICES_FINAL.PDF)
- [NSA: Content Credentials: Strengthening Multimedia Integrity in the Generative AI Era](https://media.defense.gov/2025/Jan/29/2003634788/-1/-1/0/CSI-CONTENT-CREDENTIALS.PDF)
- [NSA: Model Context Protocol (MCP): Security Design Considerations for AI-Driven Automation](https://media.defense.gov/2026/Jun/02/2003943289/-1/-1/0/CSI_MCP_SECURITY.PDF)
- [NSA, CISA, FBI: China-Based AI Companies Conducting Industrial-Scale Distillation Campaigns Against U.S. AI Companies](https://media.defense.gov/2026/Sep/08/2003992823/-1/-1/0/CSA_CHINA_BASED_AI_COMPANIES_MALICIOUS_DISTILLATION_AGAINST_US.PDF)
- [NSA, CISA, FBI, DOE, EPA: Defending Against an Active Threat to Siemens S7 Series PLCs](https://www.ic3.gov/CSA/2026/260819.pdf)
- [AI Data Security (mirror at ic3.gov)](https://www.ic3.gov/CSA/2025/250522.pdf) · [NSA copy](https://media.defense.gov/2025/May/22/2003720601/-1/-1/0/CSI_AI_DATA_SECURITY.PDF)
- [Deploying AI Systems Securely (NSA)](https://media.defense.gov/2024/Apr/15/2003439257/-1/-1/0/CSI-DEPLOYING-AI-SYSTEMS-SECURELY.PDF) · [CISA announcement](https://www.cisa.gov/news-events/alerts/2024/04/15/joint-guidance-deploying-ai-systems-securely)
- [Guidelines for secure AI system development (UK NCSC)](https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development)
- [Principles for the Secure Integration of AI in Operational Technology (mirror at ic3.gov)](https://www.ic3.gov/CSA/2025/251215.pdf)
- [AI and ML supply chain risks and mitigations (NCSC-NZ)](https://www.ncsc.govt.nz/protect-your-organisation/artificial-intelligence-and-machine-learning-supply-chain-risks-and-mitigations/)
- [CISA: release on the secure adoption of agentic AI](https://www.cisa.gov/news-events/news/cisa-us-and-international-partners-release-guide-secure-adoption-agentic-ai) · [Canadian Centre for Cyber Security: Careful adoption of agentic AI](https://www.cyber.gc.ca/en/guidance/careful-adoption-agentic-ai)
- [NSA Cybersecurity Advisories & Guidance index](https://www.nsa.gov/Cybersecurity/Cybersecurity-Advisories-Guidance/) · [NSA AISC page](https://www.nsa.gov/AISC/)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) · [NIST AI 100-2 E2025](https://csrc.nist.gov/pubs/ai/100/2/e2025/final) · [MITRE ATLAS](https://atlas.mitre.org/) · [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)

News coverage, used only for the AISC announcement date and speaker:

- [SecurityWeek: NSA is starting an Artificial Intelligence Security Center](https://www.securityweek.com/national-security-agency-is-starting-an-artificial-intelligence-security-center/)
