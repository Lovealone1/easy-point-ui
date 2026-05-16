---
version: alpha
name: Apple-design-analysis
description: A clarity-focused interface where structure and typography guide the user experience. The design relies on a system of dynamic layers and surfaces that adapt to the configured brand identity. Decorative shadows and gradients are eliminated in favor of a clean, functional aesthetic that lets the content lead.

typography:
  hero-display:
    fontFamily: "SF Pro Display, system-ui, -apple-system, sans-serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.07
    letterSpacing: -0.28px
  display-lg:
    fontFamily: "SF Pro Display, system-ui, -apple-system, sans-serif"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: 0
  display-md:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 34px
    fontWeight: 600
    lineHeight: 1.47
    letterSpacing: -0.374px
  lead:
    fontFamily: "SF Pro Display, system-ui, -apple-system, sans-serif"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.14
    letterSpacing: 0.196px
  lead-airy:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 24px
    fontWeight: 300
    lineHeight: 1.5
    letterSpacing: 0
  tagline:
    fontFamily: "SF Pro Display, system-ui, -apple-system, sans-serif"
    fontSize: 21px
    fontWeight: 600
    lineHeight: 1.19
    letterSpacing: 0.231px
  body-strong:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.24
    letterSpacing: -0.374px
  body:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: -0.374px
  dense-link:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 2.41
    letterSpacing: 0
  caption:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: -0.224px
  caption-strong:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.29
    letterSpacing: -0.224px
  button-large:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 300
    lineHeight: 1.0
    letterSpacing: 0
  button-utility:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.29
    letterSpacing: -0.224px
  fine-print:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: -0.12px
  micro-legal:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 10px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: -0.08px
  nav-link:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: -0.12px

rounded:
  none: 0px
  xs: 5px
  sm: 8px
  md: 11px
  lg: 18px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 17px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 80px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 11px 22px
  button-primary-focus:
    backgroundColor: "{colors.primary-focus}"
    textColor: "{colors.text-on-primary}"
    rounded: "{rounded.pill}"
  button-primary-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-primary}"
    rounded: "{rounded.pill}"
  button-secondary-pill:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 11px 22px
  button-dark-utility:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-on-inverse}"
    typography: "{typography.button-utility}"
    rounded: "{rounded.sm}"
    padding: 8px 15px
  button-pearl-capsule:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  button-store-hero:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-primary}"
    typography: "{typography.button-large}"
    rounded: "{rounded.pill}"
    padding: 14px 28px
  button-icon-circular:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    size: 44px
  text-link:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body}"
  text-link-on-dark:
    backgroundColor: transparent
    textColor: "{colors.primary-on-dark}"
    typography: "{typography.body}"
  global-nav:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-on-inverse}"
    typography: "{typography.nav-link}"
    height: 44px
  sub-nav-frosted:
    backgroundColor: "{colors.canvas-subtle}"
    textColor: "{colors.text-primary}"
    typography: "{typography.tagline}"
    height: 52px
  product-tile-light:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-primary}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.none}"
    padding: 80px
  product-tile-parchment:
    backgroundColor: "{colors.canvas-subtle}"
    textColor: "{colors.text-primary}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.none}"
    padding: 80px
  product-tile-dark:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-on-inverse}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.none}"
    padding: 80px
  product-tile-dark-2:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-on-inverse}"
    rounded: "{rounded.none}"
  product-tile-dark-3:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-on-inverse}"
    rounded: "{rounded.none}"
  store-utility-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.lg}"
    padding: 24px
  configurator-option-chip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 12px 16px
  configurator-option-chip-selected:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
  search-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 12px 20px
    height: 44px
  floating-sticky-bar:
    backgroundColor: "{colors.canvas-subtle}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    height: 64px
    padding: 12px 32px
  environment-quote-card:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-on-inverse}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.none}"
    padding: 80px
  footer:
    backgroundColor: "{colors.canvas-subtle}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.fine-print}"
    padding: 64px
---

## Overview

The application's visual presence is built on a **minimalist and structured design system**, where hierarchy is established through the intelligent use of space and typography. The interface is organized into blocks and surfaces that adapt dynamically based on theme configuration. Content is the center of attention, with confident but quiet typography and a color system that is fully configurable from the server.

Density is deliberately low to improve legibility and focus. No unnecessary decorative elements such as heavy borders or complex gradients are used. Elevation is applied minimally and semantically to provide visual weight to specific elements. The result is an application that feels premium, lightweight, and adaptable to different brand contexts.

The system maintains rigorous consistency in its typographic system, spacing rhythm, and component grammar, regardless of the theme applied. This is a design architecture intended to be expressed in different visual identities through dynamic parameters.

**Key Characteristics:**
- Content-first presentation; the UI recedes to let information speak.
- Sections based on alternating surfaces that act as visual dividers without the need for rigid lines.
- Colorimetry system based on semantic tokens, injected dynamically from the backend.
- Clear button grammar: primary capsule-shaped actions and compact utility actions.
- Use of typography with tight spacing for a modern, compact look in headlines.
- Soft elevation used only when necessary for visual hierarchy.
- Multi-level navigation with background blur effects to maintain context.
- Predictable section rhythm that guides the user through the information flow.

## Color Strategy & Configurable Theming

The application's color system is **fully dynamic and decoupled**. No static color values (hex/rgba) exist within the design definition. Instead, the system uses **semantic tokens** that map to CSS variables, which are injected dynamically at runtime.

### Dynamic Configuration
The color base is generated from parameters sent from the server. This allows for:
- **Multi-tenancy**: Each organization can have its own visual identity.
- **Contextual Theming**: Dynamic switching between light, dark, or custom themes.
- **Brand Injection**: Primary and accent colors are automatically derived from the brand identity.

### Semantic Tokens
Components must exclusively use these tokens to ensure theme consistency:

- **Brand & Action**
  - `{colors.primary}`: The main interaction and brand color.
  - `{colors.primary-focus}`: Variant for focus and highlight states.
  - `{colors.primary-on-dark}`: Variant optimized for readability on dark surfaces.

- **Surface & Canvas**
  - `{colors.canvas}`: The main base background of the application.
  - `{colors.canvas-subtle}`: Secondary background to create visual rhythm.
  - `{colors.surface}`: Color for cards, containers, and elevated elements.
  - `{colors.surface-inverse}`: High-contrast surface (dark mode in light theme, or vice versa).

- **Text & Typography**
  - `{colors.text-primary}`: Main color for headlines and body text.
  - `{colors.text-secondary}`: Color for supporting text or metadata.
  - `{colors.text-on-primary}`: Text color guaranteed to be readable over `{colors.primary}`.
  - `{colors.text-on-inverse}`: Text color for high-contrast surfaces.

- **Feedback & Utilities**
  - `{colors.divider}`: Color for subtle lines and separators.
  - `{colors.interactive}`: Color for non-primary actionable elements.

### Visual Principles
- **No Gradients**: The design avoids decorative gradients in CSS code. Depth is achieved through surface alternation and image usage.
- **Contrast Guarantee**: The theme engine automatically calculates text variants to ensure WCAG accessibility standards are met over any injected brand color.

## Typography

### Font Family
- **Display**: `SF Pro Display, system-ui, -apple-system, sans-serif` — Apple's proprietary display face, optimized for sizes ≥ 19px. Defines the voice of every headline.
- **Body / UI**: `SF Pro Text, system-ui, -apple-system, sans-serif` — the text-optimized variant used for body copy, captions, buttons, and links below 20px.
- **OpenType features**: `font-variant-numeric: numerator` is enabled on numeric links (pricing tables, spec sheets). Display sizes rely on tight tracking rather than contextual ligatures.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.hero-display}` | 56px | 600 | 1.07 | -0.28px | Hero headline; signature tight tracking |
| `{typography.display-lg}` | 40px | 600 | 1.10 | 0 | Tile headlines atop every product tile |
| `{typography.display-md}` | 34px | 600 | 1.47 | -0.374px | Section heads (SF Pro Text at display proportions) |
| `{typography.lead}` | 28px | 400 | 1.14 | 0.196px | Product tile subcopy |
| `{typography.lead-airy}` | 24px | 300 | 1.5 | 0 | Environment-page lead paragraphs (the rare weight 300) |
| `{typography.tagline}` | 21px | 600 | 1.19 | 0.231px | Sub-tile tagline; sub-nav category name |
| `{typography.body-strong}` | 17px | 600 | 1.24 | -0.374px | Inline strong emphasis |
| `{typography.body}` | 17px | 400 | 1.47 | -0.374px | Default paragraph |
| `{typography.dense-link}` | 17px | 400 | 2.41 | 0 | Footer / store utility link lists (relaxed leading) |
| `{typography.caption}` | 14px | 400 | 1.43 | -0.224px | Secondary captions, button text |
| `{typography.caption-strong}` | 14px | 600 | 1.29 | -0.224px | Emphasized captions |
| `{typography.button-large}` | 18px | 300 | 1.0 | 0 | Store hero CTAs (the rare weight 300) |
| `{typography.button-utility}` | 14px | 400 | 1.29 | -0.224px | Utility/nav button labels |
| `{typography.fine-print}` | 12px | 400 | 1.0 | -0.12px | Fine-print, footer body |
| `{typography.micro-legal}` | 10px | 400 | 1.3 | -0.08px | Micro legal disclaimers |
| `{typography.nav-link}` | 12px | 400 | 1.0 | -0.12px | Global nav menu items |

### Principles

- **Negative letter-spacing at display sizes.** Every headline at 17px and up carries a slight tracking tighten (`-0.12 → -0.374px`). This produces a modern, compact headline cadence. Never used at 12px or below.
- **Body copy at 17px, not 16px.** The system breaks the standard SaaS convention and runs paragraph text at 17px. The extra pixel gives the page an unmistakable "reading, not scanning" pace.
- **Weight 300 is real and rare.** Used deliberately for large-size reads. It's a light-atmosphere cue reserved for moments where the content should feel airy.
- **Weight 600, not 700, for headlines.** Headlines sit at weight 600. Weight 700 is used sparingly when a touch more assertion is needed.
- **Line-height is context-specific.** Display sizes use 1.07–1.19 (tight). Body uses 1.47. Link columns in the footer/store use an unusually relaxed 2.41 for better scannability.
- **Weight 500 is deliberately absent.** The ladder is 300 / 400 / 600 / 700. Mid-weight readings always use 600.

### Note on Font Substitutes

SF Pro is the default system font. When building off-system:

- Use `system-ui, -apple-system, BlinkMacSystemFont` as the first stack entry — on macOS/iOS this resolves to the native font.
- For non-system platforms, **Inter** (Google Fonts) is the closest open-source equivalent. Inter at weight 600 with `font-feature-settings: "ss03"` approximates the system character.
- Nudge `letter-spacing` down by `-0.01em` on display sizes to re-create the compact design feel.
- For body text, tighten line-height by `0.03` (from 1.47 → 1.44) when substituting Inter.

## Layout

### Spacing System
- **Base unit:** 8px. Sub-base values (2, 4, 5, 6, 7) are used for tight typographic adjustments; structural layout snaps to 8/12/16/20/24.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 17px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 80px.
- **Section vertical padding:** `{spacing.section}` (80px) inside a product tile; tiles stack edge-to-edge with 0 gap (the color change provides the break).
- **Card padding:** `{spacing.lg}` (24px) inside utility grid cards.
- **Button padding:** 8–11px vertical, 15–22px horizontal.
- **Universal rhythm constants:** the 17px body line-height multiplier (~25px line) and 21px tagline size show up on every analyzed page.

### Grid & Container
- **Max content width:** ~980px on text-heavy sections (environment), ~1440px on product grids (store, accessories), full-bleed for product tiles (homepage).
- **Column patterns:** 3 to 5 column utility card grid on store/accessories; 2-column side-by-side tiles on homepage occasional sections; single-column centered stack on product tile heroes.
- **Gutters:** 20–24px between cards in a utility grid.

### Whitespace Philosophy
Apple's whitespace is the product's pedestal. Every tile begins with at least 64px of air above its headline and 48–64px below. Product renders are never crowded; the nearest content to a product image is at least 40px away. The footer is the only area that breaks this — there, Apple goes deliberately dense to make the full information architecture visible at a glance.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Full-bleed tiles, global navigation, footer |
| Soft hairline | 1px `{colors.divider}` border | Utility cards, navigation separators |
| Backdrop blur | `backdrop-filter: blur(N)` on `{colors.canvas-subtle}` | Global navigation and floating sticky bars |
| Product shadow | Soft depth shadows | Elements requiring visual depth over a surface |

**Shadow philosophy.** The system uses shadows extremely selectively. Elevation in the interface is primarily achieved through surface color changes and background blur effects. Shadows are reserved for providing weight to key visual elements, not for basic structural hierarchy.

### Decorative Depth
- **Atmospheric imagery** on the environment page (photographic vista) supplies mood; no CSS gradient involved.
- **Edge-to-edge tile alternation** creates rhythm without borders or shadows — the color change itself is the divider.
- **Backdrop-filter blur** on `{component.sub-nav-frosted}` and `{component.floating-sticky-bar}` creates a "floating over content" effect that's functional, not decorative.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Full-bleed product tiles (no corner rounding) |
| `{rounded.xs}` | 5px | Inline links when styled as subtle chips (rare) |
| `{rounded.sm}` | 8px | Dark utility buttons (Sign In, Bag), inline card imagery |
| `{rounded.md}` | 11px | White Pearl Button capsules |
| `{rounded.lg}` | 18px | Store utility cards, accessories grid cards |
| `{rounded.pill}` | 9999px | Primary pill CTAs, sub-navigation actions, configurator option chips, search input — the signature pill shape |
| `{rounded.full}` | 9999px / 50% | Circular control chips floating over photography |

### Photography Geometry
- **Hero imagery**: full-bleed, 21:9 or taller on the homepage; 16:9 on environment and shop pages. Product renders are photographic-realistic, often shot on a tinted surface that becomes the tile background.
- **Product renders**: PNG/WebP with transparency; rest on a surface tile and pick up the system shadow.
- **Accessory grid**: square 1:1 crops at `{rounded.lg}` (18px) radius, light neutral backgrounds, product centered with 20–40px internal padding.
- **No rounded imagery in hero tiles** — images are full-bleed rectangular. Rounding (`{rounded.sm}`, `{rounded.lg}`) appears only on inline card imagery.
- Lazy-loading via responsive `srcset` and `sizes` across all breakpoints; CDN-optimized WebP.

## Components

### Top Navigation

**`global-nav`** — Persistent navigation bar at the top. Uses `{colors.surface-inverse}` with text in `{colors.text-on-inverse}`. Ultra-thin design with 44px height.

**`sub-nav-frosted`** — Surface-specific navigation that sticks below the global navigation. Uses `{colors.canvas-subtle}` with background blur effect. 52px height.

### Buttons

**`button-primary`** — The main action. Uses `{colors.primary}`, text `{colors.text-on-primary}`, shape `{rounded.pill}`. The full pill radius is the brand's action signal.
- Active state: `transform: scale(0.95)`.
- Focus state: 2px solid `{colors.primary-focus}` outline.

**`button-secondary-pill`** — Used as a second CTA. Transparent background, text `{colors.primary}`, 1px solid `{colors.primary}` border, shape `{rounded.pill}`.

**`button-dark-utility`** — Utility actions. Uses `{colors.surface-inverse}`, text `{colors.text-on-inverse}`, shape `{rounded.sm}`.

**`button-pearl-capsule`** — Secondary card button. Uses `{colors.surface}`, text `{colors.text-secondary}`, subtle `{colors.divider}` border, shape `{rounded.md}`.

**`button-store-hero`** — Larger primary CTA for featured surfaces. Uses `{colors.primary}`, text `{colors.text-on-primary}`, light weight typography.

**`button-icon-circular`** — Circular button for floating controls. Uses `{colors.surface}`, text/icon in `{colors.text-primary}`, shape `{rounded.full}`.

**`text-link`** — Inline text links using `{colors.primary}`.

**`text-link-on-dark`** — Text links on dark surfaces using `{colors.primary-on-dark}`.

### Cards & Containers

**`product-tile-light`** — Main content block. Background `{colors.canvas}`, text `{colors.text-primary}`.

**`product-tile-parchment`** — Subtle variant block. Background `{colors.canvas-subtle}`, text `{colors.text-primary}`.

**`product-tile-dark`** — High-contrast content block. Background `{colors.surface-inverse}` with text in `{colors.text-on-inverse}`.

**`store-utility-card`** — Card for utility grids. Background `{colors.canvas}`, border `{colors.divider}`, shape `{rounded.lg}`.

**`configurator-option-chip`** — Pill-shaped selectable cell. Background `{colors.canvas}`, text `{colors.text-primary}`, shape `{rounded.pill}`.

**`configurator-option-chip-selected`** — Selected state. Border upgrades to 2px solid `{colors.primary-focus}`.

**`floating-sticky-bar`** — Sticky bar that floats at the bottom during scroll. Background `{colors.canvas-subtle}` with background blur, 64px height.

### Inputs & Forms

**`search-input`** — Search input field. Background `{colors.canvas}`, text `{colors.text-primary}`, subtle `{colors.divider}` border, shape `{rounded.pill}`.

### Footer

**`footer`** — Page footer. Background `{colors.canvas-subtle}`, text `{colors.text-secondary}`. Link columns with relaxed line-height for better scannability.

## Do's and Don'ts

### Do
- Set headlines in `{typography.hero-display}` or `{typography.display-lg}` with negative letter-spacing (`-0.28 → -0.374px`) to get a modern, compact cadence.
- Run body copy at `{typography.body}` (17px). The extra pixel defines the brand's reading pace.
- Alternate `{colors.canvas}` and `{colors.surface-inverse}` for full-bleed section rhythm. The surface change IS the divider.
- Reserve `{rounded.pill}` for the primary action and any other element that should read as an "action".
- Apply elevation selectively to give weight to visual elements, never as a general decorative style.
- Use `transform: scale(0.95)` as the active/press state on every button as the system-wide micro-interaction.
- Keep the global navigation on a high-contrast surface (`{colors.surface-inverse}`).

### Don't
- Don't introduce a second accent color; every "click me" signal is `{colors.primary}`.
- Don't add heavy shadows to cards or buttons; elevation should be subtle and semantic.
- Don't use gradients as decorative backgrounds; atmosphere comes from content.
- Don't set body copy at weight 500 — the ladder is 300 / 400 / 600 / 700. Body is always 400; strong inline is 600; display is 600.
- Don't round full-bleed blocks — they should be rectangular and touch the edges.
- Don't tighten line-height below what is defined; editorial leading is part of the identity.
- Don't mix radii grammars — follow the defined scale strictly.
- Don't use high-contrast color variants on light surfaces where not necessary for readability.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Small phone | ≤ 419px | Single-column tiles; sub-nav collapses to category name + primary CTA only; hero typography drops to 28px |
| Phone | 420–640px | Single-column stack; product renders scale to 80% of tile width; hero h1 drops to 34px |
| Large phone | 641–735px | Tiles transition to tighter padding (48px vertical vs 80px); fine-print wraps |
| Tablet portrait | 736–833px | Global nav collapses to hamburger; sub-nav hides category chips, keeps primary CTA |
| Tablet landscape | 834–1023px | Global nav returns fully expanded; 3-column utility grids become 2-column |
| Small desktop | 1024–1068px | Product tiles use 2/3 width with margin gutters; hero h1 stays at 40px |
| Desktop | 1069–1440px | Full layout; 4–5 column store grids; 1440px content max |
| Wide desktop | ≥ 1441px | Content locks at 1440px, margins absorb extra width |

The structural breakpoints that matter for agents: 1440px (content lock), 1068px (small-desktop), 833px (tablet landscape switch), 734px (tablet portrait), 640px (phone), 480px (small phone).

### Touch Targets
- Minimum 44 × 44px. `{component.button-primary}` lands at ~44 × 100px (with the full-pill radius making the visible hit area more generous than the label suggests).
- `{component.button-icon-circular}` is exactly 44 × 44px.
- Global nav utility links are smaller (~32 × 80px) — they deliberately sit at a tighter target because they're precision desktop actions, and the mobile hamburger replaces them at ≤ 833px.

### Collapsing Strategy
- **Global nav**: full horizontal link row on desktop → collapses to Apple logo + hamburger + bag icon at 834px and below.
- **Sub-nav**: category name + inline links + primary CTA → category name + primary CTA only at mobile; inline links move into a hamburger tray.
- **Product tiles**: stack from 2-column to 1-column at 834px; vertical padding tightens from 80px → 48px at small-phone.
- **Utility grids** (store, accessories): 5-col → 4-col (1440px) → 3-col (1068px) → 2-col (834px) → 1-col (640px).
- **Hero typography**: `{typography.hero-display}` (56px) → `{typography.display-lg}` (40px) at 1068px → 34px at 640px → 28px at 419px.

### Image Behavior
- All product imagery uses responsive `srcset` with breakpoint-matched crops.
- Hero photography may switch art direction at mobile (e.g., the environment page's vista crops to a taller aspect ratio on mobile, framing the subject differently).
- Product renders maintain their 1:1 or 4:3 aspect ratios across breakpoints; only scale changes.
- Lazy-loading is default; the above-fold hero loads eagerly.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key directly (`{component.product-tile-dark}`, `{component.search-input}`).
2. Variants of an existing component (`-active`, `-focus`, `-2`, `-3`) live as separate entries in `components:`.
3. Use `{token.refs}` everywhere — never inline hex.
4. Never document hover. Default and Active/Pressed states only.
5. Display headlines stay SF Pro Display 600 with negative letter-spacing. Body stays SF Pro Text 400 at 17px. The boundary is unbreakable.
6. The single drop-shadow (`rgba(0, 0, 0, 0.22) 3px 5px 30px`) is reserved for product photography only.
7. When in doubt about emphasis: alternate surface (light → dark tile) before adding chrome.

- Form validation and error states are handled via the dynamic feedback color system.
- Global navigation uses `{colors.surface-inverse}` for high contrast.
- The theme system supports automatic dark mode variants based on server configuration.
- The background blur effect in navigation uses a standard `blur(20px)` on translucent surfaces.
