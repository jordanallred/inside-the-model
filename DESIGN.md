---
name: Inside the Model
description: A precise, inspectable visual system for learning how language models work.
colors:
  deep-space: "#0B1020"
  indigo: "#6366F1"
  sky: "#3B82F6"
  teal: "#14B8A6"
  violet: "#A78BFA"
  peach: "#FB923C"
  sand: "#F8FAFC"
  slate: "#334155"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "clamp(2.4rem, 6vw, 4.75rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.sand}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  card:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.deep-space}"
    rounded: "{rounded.md}"
    padding: "20px"
---

# Design System: Inside the Model

## Overview

**Creative North Star: "The Computational Field Guide"**

Inside the Model should feel like a field guide to a living computational system: exact enough to trust, approachable enough to explore, and dense only where the reader has chosen depth. The interface is editorial first and instrument-like second. It uses real tensors, labels, traces, and diagrams as the visual material rather than generic technology decoration.

The visual identity is quietly technical, not futuristic. Dark Deep Space surfaces create focus for live model inspection; light Sand surfaces support sustained reading. Indigo anchors decisions while Sky, Teal, Violet, and Peach consistently encode stages of data flow.

**Key Characteristics:**

- Evidence-forward and explicitly inspectable
- Editorial hierarchy with instrument-grade detail
- Restrained color with semantic meaning
- Calm reading surfaces and focused dark demonstrations
- Real diagrams and data in place of ornamental AI imagery

## Colors

The palette moves from deep observatory surfaces to clear signal colors, with every accent carrying a stable computational role.

### Primary

- **Inspection Indigo** (#6366F1): primary actions, selected states, and identity emphasis.
- **Deep Space** (#0B1020): dark demonstration surfaces, navigation, and high-authority headings.

### Secondary

- **Input Sky** (#3B82F6): inputs and direct manipulation.
- **Flow Teal** (#14B8A6): data flow, completion, and validated states.
- **Activation Violet** (#A78BFA): attention and intermediate activations.
- **Output Peach** (#FB923C): generated outputs and warnings that are not destructive.

### Neutral

- **Reading Sand** (#F8FAFC): long-form reading background and high-contrast text on dark surfaces.
- **Explanatory Slate** (#334155): supporting text and quiet structural detail.

**The Signal Color Rule.** Accent color must encode input, flow, activation, output, or action; it is never sprayed across a surface as decoration.

## Typography

**Display Font:** Plus Jakarta Sans (with Inter fallback)
**Body Font:** Inter (with system sans-serif fallback)
**Label/Mono Font:** JetBrains Mono

The homepage uses Parkinsans 700 as a deliberate editorial exception for its hero and major section openings. Its softer geometry distinguishes the public entry point from the denser chapter system without changing body or measurement typography.

**Character:** Headings are sturdy and plainspoken, prose is quiet and highly legible, and monospaced type is reserved for code, tensor shapes, measurements, and values.

### Hierarchy

- **Display** (800, fluid to 4.75rem, 0.98): concise hero statements and major page openings.
- **Headline** (700–800, 1.75–2.5rem, 1.12): section-level ideas.
- **Title** (700, 1–1.25rem, 1.3): lesson and instrument titles.
- **Body** (400–600, 1rem, 1.65): explanatory prose with a 65–75ch measure.
- **Label** (600, 0.75rem, 0.04em): actual state, shape, step, or measurement labels; sentence case unless data notation requires otherwise.

**The Measurement Rule.** JetBrains Mono appears only when alignment, code, or exact values matter.

## Layout

The reading column tops out near 760px while demonstration and explorer regions can expand to roughly 1200px. The system uses an 8px spacing base, generous section separation, and compact internal spacing for related controls. Wide layouts align prose, math, and code into deliberate columns; narrow layouts preserve reading order and stack the interaction immediately after its explanation.

## Elevation & Depth

Depth is mostly structural: tonal separation, precise borders, and overlapping data layers. Wide soft shadows are reserved for a primary demonstration or a clearly lifted hover state; ordinary reading containers remain flat.

**The Flat-by-Default Rule.** Resting content is separated by rhythm and rules. Elevation appears only when focus or interaction makes it meaningful.

## Shapes

Surfaces use restrained 8px, 12px, and 20px radii. Pills belong only to small state controls and token-like data. Layered planes, matrices, nodes, and directed paths are the recurring geometry; they must describe a real relationship rather than act as wallpaper.

## Components

### Buttons

- **Shape:** compact 8px corners with a minimum 44px touch height.
- **Primary:** Inspection Indigo with white text and a decisive weight.
- **Hover / Focus:** small luminance shift and a clearly separated Sky focus outline.
- **Secondary / Ghost:** transparent or neutral, with visible borders and no decorative glow.

### Chips

- **Style:** small and content-sized; used for tokens, heads, or state choices rather than marketing labels.
- **State:** selection changes fill, outline, and weight so color is never the only cue.

### Cards / Containers

- **Corner Style:** 12px for ordinary modules, 20px only for a major demonstration.
- **Background:** tonal separation from the page, never nested layers of arbitrary cards.
- **Shadow Strategy:** flat at rest; soft lift only for interactive hover or the primary hero instrument.
- **Border:** one precise hairline when needed.
- **Internal Padding:** 16–24px depending on density.

### Navigation

Navigation is simple and editorial. The brand mark leads, utility controls recede, and active location is expressed with type weight or a single rule rather than a filled pill.

### Inspectable Figure

The signature component combines an explanatory sentence, real values, a manipulable control, and a visible consequence. It remains meaningful before interaction, supports keyboard input, and exposes the numeric state behind the graphic.

## Do's and Don'ts

### Do:

- **Do** put real values, equations, code, and sourced diagrams at the center of the composition.
- **Do** state simplifying assumptions close to the affected interaction.
- **Do** let the primary action begin an actual learning or inspection flow.
- **Do** keep long-form reading quiet enough for sustained use.

### Don't:

- **Don't** use robots, brains, glowing heads, ornamental circuits, or stock-like AI imagery.
- **Don't** turn every item into a rounded card or every label into a pill.
- **Don't** animate numbers or traces merely for atmosphere.
- **Don't** imply that a conceptual diagram is an exact transformer schematic.
- **Don't** hide uncertainty, model scale differences, or provenance behind confident visual polish.
