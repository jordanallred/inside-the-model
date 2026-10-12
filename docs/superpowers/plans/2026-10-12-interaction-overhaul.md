# Interaction Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every teaching interaction a clear goal, intentional experiment, and structured learning feedback.

**Architecture:** A declarative registry decorates every initialized widget with a shared mission shell. The site initializer mounts the shell and a static checker prevents missing coverage. Existing widgets retain their calculation engines and event handlers.

**Tech Stack:** Astro, vanilla browser JavaScript, CSS, Node.js checks.

**Spec:** `docs/superpowers/specs/2026-10-12-interaction-overhaul-design.md`

## Global Constraints

- Preserve existing widget calculations and accessible native controls.
- Cover every `data-w` widget used by the documentation.
- Do not modify pre-existing dirty files outside this feature.

## Review Focus

- Every documented widget has an interaction registry entry.
- Suggested experiments use existing state transitions or fail safely.
- The shared frame remains usable at narrow widths.
- Widget initialization still succeeds when the decorator is unavailable.
- Existing output remains visible after decoration.

### Task 1: Audit guardrail and shared interaction registry

**Files:**
- Create: `guide/public/js/interaction.js`
- Create: `guide/tools/check-interactions.mjs`
- Modify: `guide/public/js/site.js`
- Modify: `guide/astro.config.mjs`
- Modify: `guide/package.json`
- Modify: `guide/src/styles/custom.css`

- [ ] Write a failing coverage check for missing registry entries.
- [ ] Run it and confirm it fails against the missing registry.
- [ ] Implement the declarative registry, mounting hook, mission shell, and coverage checker.
- [ ] Run the coverage check and JavaScript parser successfully.
- [ ] Commit the shared interaction framework.

### Task 2: Connect meaningful scenarios and verify rendered behavior

**Files:**
- Modify: `guide/public/js/widgets.js`
- Modify: `guide/public/js/widgets2.js`
- Modify: `guide/public/js/trainer.js`
- Modify: `guide/public/js/compare.js`

- [ ] Write a failing check that scenario actions dispatch to existing widget controls.
- [ ] Run it and confirm it fails.
- [ ] Add named scenario actions for representative calculator, simulator, editor, security, and comparison widgets.
- [ ] Run build, checks, trace verification, and rendered interaction smoke tests.
- [ ] Commit and push the completed overhaul.
