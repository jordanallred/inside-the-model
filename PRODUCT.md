# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Repository evidence indicates four primary audiences: technically curious beginners with calculus and linear-algebra basics, software engineers connecting tensor operations to code, ML practitioners checking the mathematics against real models, and instructors or students who need reproducible examples.

## Product Purpose

Inside the Model is a public, interactive guide to the calculations, code, training, inference, security, and evaluation behind large language models. Success means a reader can move from an intuitive explanation to the actual numbers, equations, and reference implementation without leaving the learning flow.

## Positioning

The product's distinctive mechanism is inspectability: a deliberately small transformer runs in the browser, exposes every intermediate value across a 26-operation forward pass, and lets readers compare trained and random weights. Repository checks validate the JavaScript engine against an independent NumPy implementation to within 1e-9 and validate hand-written backpropagation with finite differences.

## Operating Context

Readers move among 21 sequenced chapters, a browser-based Model Explorer, 10 hands-on labs, two layer-by-layer model teardowns, and a linked paper index. Progress remains in the visitor's browser. The site is static Astro/Starlight and is intended for public deployment.

## Capabilities and Constraints

- The guide must work as readable long-form content and as an interactive learning environment.
- Mathematical claims should be tied to visible calculations, runnable code, or cited primary sources.
- The tiny model must be identified as a teaching model wherever it differs from production systems.
- Keyboard access, reduced-motion behavior, mobile stacking, accessible diagrams, and copyable examples are established requirements.
- Product facts and counts are generated from repository content where possible; fabricated testimonials, customers, benchmarks, or adoption claims are not permitted.

## Brand Commitments

The name is “Inside the Model.” The promise is “Make the invisible inspectable,” the tagline is “From text to tensors to understanding,” and the homepage hero is “See exactly how LLMs work.” The voice is clear, exact, explanatory, curious, and explicit about simplifications. Avoid mystical or hype-driven AI language.

## Evidence on Hand

The repository contains the full guide, runnable browser tools, independent verification scripts and fixtures, cited papers, model teardowns, public security guidance, brand assets, and a formal brand guide. It contains no testimonials, customer logos, press coverage, or usage metrics; future work must not invent them.

## Product Principles

- Make the invisible inspectable.
- Let readers manipulate the real mechanism, not a decorative simulation.
- Move from concrete numbers to general rules.
- Make claims checkable through equations, code, fixtures, or primary sources.
- Keep learning progress private and the public site static, fast, and durable.

## Accessibility & Inclusion

Support keyboard navigation, visible focus, reduced motion, high-contrast values, non-color distinctions in diagrams, touch targets, mobile layouts, and numeric access to visualized values.
