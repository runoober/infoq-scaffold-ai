---
name: ui-ux-three-phase-protocol
description: >-
  Enforce a four-phase UI workflow to prevent visual drift: PHASE 1 ASCII layout proposal, PHASE 2 static HTML/Tailwind demo, PHASE 3 formal React/Tailwind/Capacitor implementation, and PHASE 4 Playwright probing verification. Use this skill whenever users request major UI/UX redesign, layout-heavy features, approval-gate phrases like LAYOUT APPROVED or DEMO APPROVED, or ask to lock visual consistency before wiring business logic.
---

# UI UX Three Phase Protocol

Use this skill for major UI work that needs explicit approval gates and stable visual baselines.

## Core Principles

- Reduce cognitive load with fixed phase boundaries.
- Do not skip approval gates.
- Prevent visual drift by freezing structure before framework logic.
- Keep MVP scope tight; avoid style-only scope creep.

## Required Workflow

### PHASE 1: ASCII Layout Proposal

Before writing any CSS, React/Vue component code, or business logic:

1. Provide a **Layout Specification** with:
   - Structure: DOM hierarchy and panel/container relationships.
   - Styling Tech: planned CSS Grid/Flexbox and Tailwind strategy.
   - Responsive Strategy: desktop and mobile behavior, touch-target policy.
2. Provide **ASCII Wireframes** for:
   - Desktop
   - Mobile (Capacitor-oriented viewport)
3. Include explicit touch target rule (default minimum `44x44px`).
4. Stop and wait for exact approval phrase:
   - `LAYOUT APPROVED`

If this phrase is not provided, do not proceed to PHASE 2.

### PHASE 2: Static Visual Demo

After `LAYOUT APPROVED`:

1. Create a standalone demo file in `apps/web/demo/`, e.g.:
   - `apps/web/demo/reader-prototype.html`
2. Constraints:
   - Use plain HTML.
   - Use Tailwind via CDN.
   - Do not introduce React, Hono, RPC, or backend integration.
3. Visual focus:
   - Reading-first typography (serif preference when applicable).
   - Comfortable line height and eye-friendly color contrast.
   - Clear spatial rhythm and intentional visual hierarchy.
4. Simulate key interactions using minimal JavaScript only.
5. Stop and wait for exact approval phrase:
   - `DEMO APPROVED`

If this phrase is not provided, do not proceed to PHASE 3.

### PHASE 3: Formal PWA Implementation

After `DEMO APPROVED`:

1. Implement approved structure and style in React + Tailwind + Capacitor.
2. Keep shell parity with approved demo:
   - Do not change layout or visual tokens silently.
3. Integrate Hono RPC only after UI shell is stable.
4. If reviewer requests layout changes (for example sidebar width), update the relevant proposal/demo artifact first, then apply to production code.

### PHASE 4: Iterative Verification

After implementation:

1. Run Playwright probing against the actual page.
2. Verify:
   - DOM structure aligns with approved layout.
   - Major blocks and hierarchy are intact.
   - Mobile touch targets satisfy policy.
3. Report mismatches and fix before marking ready.

## MVP Guardrails

- Read MVP constraint documents provided in task context (for example `../../docs/MVP_SPEC.md`).
- Focus on core flow only (for example reader + vocabulary list).
- If a proposal conflicts with minimalist product direction, raise it as a discussion item before coding.

## Delivery Notes

- Keep outputs deterministic: proposal -> demo -> implementation -> probing evidence.
- Do not blend unrelated refactors into this flow.
- If a phase artifact is missing, treat the delivery as not ready.
