---
version: alpha
name: InfoQ Scaffold AI Cohere Foundation
description: Cohere-inspired enterprise editorial design system adapted for InfoQ Scaffold AI across admin dashboards, docs surfaces, and weapp/mobile views, with shared light and dark semantic tokens.
colors:
  light:
    bg-canvas: "#f6f6f2"
    bg-page: "#ffffff"
    bg-muted: "#eeece7"
    band-green: "#003c33"
    band-navy: "#071829"
    band-ink: "#17171c"
    surface-base: "#ffffff"
    surface-subtle: "#f7f5f0"
    text-primary: "#212121"
    text-secondary: "#5f6470"
    text-tertiary: "#93939f"
    border-default: "#d9d9dd"
    action-primary: "#17171c"
    action-link: "#1863dc"
    action-focus: "#4c6ee6"
    accent-editorial: "#ff7759"
    accent-editorial-soft: "#ffad9b"
    success: "#1e7f5a"
    warning: "#b96322"
    error: "#b30000"
  dark:
    bg-canvas: "#0f1318"
    bg-page: "#131922"
    bg-muted: "#1b2230"
    band-green: "#003c33"
    band-navy: "#071829"
    band-ink: "#17171c"
    surface-base: "#171d26"
    surface-subtle: "#1d2430"
    text-primary: "#f4f6fa"
    text-secondary: "#c1c8d3"
    text-tertiary: "#95a1b3"
    border-default: "#303948"
    action-primary: "#ffffff"
    action-link: "#7db1ff"
    action-focus: "#8eb6ff"
    accent-editorial: "#ff8a71"
    accent-editorial-soft: "#ffc0b1"
    success: "#75c195"
    warning: "#f0ad5f"
    error: "#ff8b8b"
typography:
  display:
    fontFamily: "\"Space Grotesk\", \"Noto Sans SC\", \"PingFang SC\", sans-serif"
  body:
    fontFamily: "\"IBM Plex Sans\", \"Noto Sans SC\", \"PingFang SC\", sans-serif"
  mono:
    fontFamily: "\"IBM Plex Mono\", \"JetBrains Mono\", monospace"
rounded:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 22px
  xl: 30px
  pill: 32px
spacing:
  xxs: 2px
  xs: 6px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 80px
---

## Overview

This design system keeps the parts of Cohere that fit this repository: white editorial canvases, dark enterprise product bands, soft stone cards, restrained borders, coral editorial tags, blue research links, and large but controlled display typography. It does not copy Cohere's marketing pages. It adapts the visual language for three real product surfaces in this repo:

- admin dashboards
- docs and collaboration landing pages
- weapp/mobile home and profile pages

The system must work in both light and dark mode. Light is the default reading and data-entry surface. Dark is a supported shell mode that keeps white or soft information islands when clarity matters.

## Visual Theme & Atmosphere

- Build a trustworthy enterprise AI mood, not a startup landing-page mood.
- Use whitespace and section bands as hierarchy, not heavy shadows.
- Keep most UI surfaces flat. Save gradients and saturated color for hero media, capability bands, or curated illustration slots.
- Make cards rounded and confident, but never cute or bubbly.
- Let docs feel editorial, admin feel operational, and weapp feel tactile, while sharing the same semantic token family.

## Color Palette & Roles

### Shared Rules

- `action-primary` is the single strongest action color.
- `accent-editorial` is reserved for taxonomy, labels, chips, and small warm highlights.
- `action-link` is for inline links, research-like metadata, and docs navigation emphasis.
- `band-green`, `band-navy`, and `band-ink` are large sectional backgrounds, not generic widget colors.

### Light Mode

- `bg-canvas` / `bg-page`: off-white and white page structure
- `bg-muted` / `surface-subtle`: soft stone neutral surfaces for summary cards, secondary panels, and docs cards
- `text-primary`: near-black readable body text
- `border-default`: thin rule system for tables, forms, and section separators
- `action-primary`: near-black pill CTA
- `accent-editorial`: coral chips and editorial markers

### Dark Mode

- `bg-canvas` / `bg-page`: deep charcoal-blue shell
- `surface-base` / `surface-subtle`: dark layered cards with visible borders
- `text-primary`: soft white, not harsh pure white everywhere
- `action-primary`: white pill CTA on dark shells
- `action-link`: lighter blue for readable link emphasis
- `accent-editorial`: softened coral for filters and topical labels

## Typography Rules

### Font Families

- Display: `"Space Grotesk", "Noto Sans SC", "PingFang SC", sans-serif`
- Body/UI: `"IBM Plex Sans", "Noto Sans SC", "PingFang SC", sans-serif`
- Mono: `"IBM Plex Mono", "JetBrains Mono", monospace`

### Type Scale

- `display-xl`: 64px / 1.02 / 400 / `-0.04em`
- `display-lg`: 48px / 1.08 / 400 / `-0.03em`
- `heading-xl`: 36px / 1.16 / 400 / `-0.02em`
- `heading-lg`: 28px / 1.22 / 400 / `-0.01em`
- `heading-md`: 22px / 1.3 / 500
- `body-lg`: 18px / 1.55 / 400
- `body`: 16px / 1.6 / 400
- `body-sm`: 14px / 1.55 / 400
- `label`: 12px / 1.4 / 500 / `0.04em`
- `mono-label`: 12px / 1.45 / 400 / `0.08em`

### Usage Rules

- Only docs hero sections may use `display-xl`.
- Admin pages should usually top out at `display-lg` or `heading-xl`.
- Weapp should top out at `heading-lg`.
- Avoid heavy bold weights. Use scale, spacing, and contrast first.

## Component Stylings

### Buttons

- `button-primary`: pill, strong fill, minimal chrome, 32px radius
- `button-secondary`: text-first or light outline, never competing with the primary button
- `button-chip`: used for filters, taxonomy, and compact segmented controls

### Cards

- `card-data`: 8px-16px radius, thin borders, low shadow, used for admin summaries and list containers
- `card-media`: 22px radius, used for docs hero media, login visuals, and featured mobile cards
- `card-stone`: soft neutral surface used for secondary highlights and docs/workbench cards

### Forms

- Inputs stay rectangular or softly rounded with clear borders.
- In dark shells, forms may sit on lighter islands for clarity.
- Focus states must use `action-focus`, not ad hoc glows.

### Navigation

- Admin: left nav + top utility bar + content shell
- Docs: broad top nav with focused CTA and editorial entry cards
- Weapp: stable bottom nav with large touch targets and short labels

## Layout Principles

- Default from a white page or a deep enterprise band, not a mid-tone wash.
- Separate sections with space and rule lines before adding more boxes.
- Use 3-column grids on desktop only when the content actually benefits from side-by-side scanning.
- Tables and lists should feel editorial and precise, not boxed-in dashboards.
- Mobile surfaces collapse to one column cleanly. No hidden complexity.

## Scene Adaptation

### Admin

- Default to light for data-heavy pages.
- Use dark bands for dashboard headers, login surfaces, capability summaries, or empty states.
- Preserve Ant Design and Element Plus interaction semantics; style through tokens and containers, not imitation widgets.

### Docs

- Light-first reading experience.
- Use dark or green hero/capability bands to create atmosphere, then return to a white editorial canvas.
- Coral belongs to tags, category chips, and collaboration highlights, not broad backgrounds.

### Weapp

- Mobile-first card stack with dark hero band + light content cards.
- Preserve strong touch targets and predictable bottom navigation.
- Dark mode should still keep information islands distinct from the shell.

## Depth & Elevation

- Use borders, surface shifts, and corner radii as the main depth system.
- Shadows stay subtle and reserved for overlays, hero media, and device-frame previews.
- Avoid turning every section into a floating card cluster.

## Do's and Don'ts

### Do

- Use white or near-white as the default reading surface.
- Use deep green and dark navy as sectional bands.
- Keep CTAs pill-shaped and singular.
- Keep docs more editorial than dashboard-like.
- Keep weapp compact, tactile, and easy to scan.

### Don't

- Do not use coral as a generic CTA color.
- Do not fill normal UI surfaces with gradients.
- Do not make admin pages look like a marketing landing page.
- Do not flatten dark mode into one undifferentiated black slab.
- Do not bypass the existing component libraries with parallel fake design-system components.

## Responsive Behavior

- `<425px`: one-column layout, compact nav, full-width CTA behavior
- `425-768px`: primary mobile and weapp range
- `768-1024px`: two-column transitional layouts where useful
- `1024-1440px`: primary desktop admin and docs layout range
- `1440px+`: more whitespace, not necessarily more columns

## Agent Prompt Guide

- Start with a white canvas or a deep green/navy band.
- Use one primary pill CTA and one secondary text action.
- For admin, show operational hierarchy: nav, summary, table, action.
- For docs, show editorial hierarchy: hero, reading path, entry cards, governance.
- For weapp, show tactile hierarchy: hero band, notice, quick grid, profile, bottom nav.
- Keep rounded media confident, borders thin, and color accents disciplined.
