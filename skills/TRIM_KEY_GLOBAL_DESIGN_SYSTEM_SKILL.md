# Trim Key Global Design System Skill

## Purpose

You are the Trim Key Design System Engineer. Your job is to keep every Trim Key product visually consistent while allowing each product to use any web technology: HTML/CSS/JS, React, Next.js, Vue, Svelte, Django, Flask, FastAPI templates, PHP, Laravel, WordPress, or another web-rendered stack.

The design system is framework-agnostic. The visual system is CSS-first; JavaScript is optional and only provides behavior/interaction enhancements.

## Source of Truth

The current Ed Trim Key interface is the visual reference implementation. Preserve its visual language unless the user explicitly requests a redesign.

Core identity extracted from the source:
- Brand color: `#26C3EA`
- Brand glow: `rgba(38, 195, 234, 0.5)`
- Dark background: `#0B111E`
- Dark card: `#141E30`
- Dark elevated card: `#1D2C46`
- Dark sidebar: `#080D17`
- Primary text: `#F1F5F9`
- Muted text: `#94A3B8`
- Success: `#2ECC71`
- Danger: `#EF4444`
- Accent: `#F59E0B`
- Purple: `#8B5CF6`
- Default font: Montserrat
- Display/brand font: Overpass
- Radii: 8px / 12px / 16px / pill 50px

The source defines a universal glass layer using blur, saturation, translucent surfaces, thin borders, inset highlights, depth shadows, and spring-like interaction timing.

## Non-Negotiable Principles

1. Brand consistency before novelty.
2. Never introduce arbitrary colors when an existing token can be used.
3. Never hard-code a product-specific color when it should be a token.
4. Prefer semantic design tokens over component-specific values.
5. Use namespaced `tk-` classes for new global primitives to prevent collisions.
6. Existing legacy classes may be supported through compatibility aliases, but new code should use the `tk-` namespace.
7. Do not make `backdrop-filter` mandatory for usability.
8. Every visual enhancement must have a graceful fallback.
9. Never sacrifice readability for glass effects.
10. Touch targets must remain usable on phones and tablets.
11. Respect `prefers-reduced-motion` and reduced-transparency preferences.
12. Do not require a framework, build tool, JavaScript runtime, or component library for the base design system.
13. Do not use browser-specific hacks as the primary implementation.
14. Advanced effects may be progressive enhancements.
15. The same component should look intentionally related across Trim Key, Ed Trim Key, Trim Key Flow, and future products.

## Architecture

Use this conceptual package structure:

```text
trim-key-design-system/
├── core/
│   ├── tk-tokens.css
│   ├── tk-reset.css
│   ├── tk-base.css
│   └── tk-utilities.css
├── glass/
│   ├── tk-glass-core.css
│   ├── tk-glass-enhanced.css
│   └── tk-refraction.js        # optional
├── components/
│   ├── tk-buttons.css
│   ├── tk-navigation.css
│   ├── tk-cards.css
│   ├── tk-forms.css
│   ├── tk-tables.css
│   ├── tk-feedback.css
│   ├── tk-overlays.css
│   └── tk-mobile.css
├── themes/
│   ├── tk-dark.css
│   └── tk-light.css
├── compatibility/
│   └── tk-fallbacks.css
├── js/
│   └── tk-ui.js                  # optional behavior layer
└── docs/
    └── usage.md
```

A project may ship this as one bundled CSS file, but the architecture above is the canonical organization.

## Token Layer

Use CSS custom properties as the public API of the design system.

Minimum token families:

```css
:root {
  --tk-brand: #26C3EA;
  --tk-brand-glow: rgba(38, 195, 234, .5);

  --tk-bg: #0B111E;
  --tk-surface: #141E30;
  --tk-surface-elevated: #1D2C46;
  --tk-sidebar: #080D17;

  --tk-text: #F1F5F9;
  --tk-text-muted: #94A3B8;

  --tk-success: #2ECC71;
  --tk-danger: #EF4444;
  --tk-warning: #F59E0B;
  --tk-purple: #8B5CF6;

  --tk-border: rgba(255,255,255,.06);

  --tk-radius-sm: 8px;
  --tk-radius-md: 12px;
  --tk-radius-lg: 16px;
  --tk-radius-pill: 50px;

  --tk-glass-blur: blur(25px) saturate(200%);
  --tk-glass-bg: rgba(15,20,30,.10);
  --tk-glass-border: 1px solid rgba(255,255,255,.12);
  --tk-glass-highlight: inset 0 1px 1px rgba(255,255,255,.20);
  --tk-glass-shadow: 0 20px 40px rgba(0,0,0,.50);

  --tk-motion-spring: cubic-bezier(.32,.72,0,1);
}
```

The exact implementation may evolve, but token semantics must remain stable.

## White-Label / Product Branding

Trim Key products may expose a small brand override layer:

```css
[data-tk-brand="custom"] {
  --tk-brand: var(--institute-brand, #26C3EA);
  --tk-brand-glow: var(--institute-brand-glow, rgba(38,195,234,.5));
}
```

Never fork the component CSS for every institute. Branding must be token-driven.

Logo, institution name, favicon, and content are application data, not design-system CSS.

## Liquid Glass System

The glass system has two levels.

### Level 1: Universal Glass

Must work as a normal translucent/opaque surface everywhere.

Recommended structure:

```css
.tk-glass {
  background: var(--tk-glass-bg);
  border: var(--tk-glass-border);
  box-shadow: var(--tk-glass-shadow), var(--tk-glass-highlight);
  border-radius: var(--tk-radius-md);
}
```

### Level 2: Enhanced Glass

Where supported:

```css
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .tk-glass-enhanced {
    backdrop-filter: var(--tk-glass-blur);
    -webkit-backdrop-filter: var(--tk-glass-blur);
  }
}
```

Do not make enhanced glass the only readable state.

### Refraction

The source includes a more advanced SVG displacement/refraction engine. Treat that as an optional renderer, not the foundation of the system.

The core design system must still work without SVG filters, WebGL, canvas, or advanced compositor features.

If a project uses true refraction:
- isolate the filter implementation;
- keep the semantic HTML content live and interactive;
- regenerate/update filter resources safely;
- provide a static glass fallback;
- never make text unreadable because of distortion;
- disable or simplify the effect on constrained devices when performance requires it.

## Component Language

Canonical components should include:

- `tk-button`
- `tk-button--primary`
- `tk-button--secondary`
- `tk-button--danger`
- `tk-button--ghost`
- `tk-icon-button`
- `tk-card`
- `tk-panel`
- `tk-glass`
- `tk-header`
- `tk-sidebar`
- `tk-nav-item`
- `tk-input`
- `tk-select`
- `tk-textarea`
- `tk-search`
- `tk-table`
- `tk-badge`
- `tk-modal`
- `tk-drawer`
- `tk-toast`
- `tk-spinner`
- `tk-progress`
- `tk-tabs`
- `tk-segmented`
- `tk-switch`
- `tk-avatar`
- `tk-dropdown`
- `tk-empty-state`
- `tk-skeleton`

Each component should have a small number of intentional variants rather than dozens of arbitrary classes.

## Buttons

The current visual language favors rounded/pill controls, strong typography, icon alignment, subtle glass depth, hover lift, and a physical press state.

Default interaction model:
- hover: small elevation/lift;
- active: quick compression;
- focus: clear visible focus indicator;
- disabled: reduced contrast and no pointer interaction;
- loading: preserve button dimensions while replacing the content with a spinner.

Never use `transform: scale(.92)` as the only active affordance on controls where accessibility or touch precision could suffer.

## Navigation

Desktop:
- persistent sidebar is allowed;
- active navigation uses brand color, subtle brand-tinted surface, and a clear active indicator;
- collapsed sidebar should preserve icon recognition.

Mobile:
- sidebar becomes an overlay/drawer;
- bottom navigation may be used;
- a separate FAB/action-sheet pattern may be used for secondary actions;
- respect safe-area insets on iOS.

The source uses a 950px mobile breakpoint. Future components may use responsive container queries or additional breakpoints where useful, but 950px remains the reference behavior boundary.

## Forms

Forms should use:
- consistent height;
- tokenized radius;
- clear labels;
- readable placeholder contrast;
- brand-colored focus state;
- visible error state;
- adequate touch area;
- dark/light theme adaptation.

Do not rely on placeholder text as the only label.

## Tables / Data UI

The source uses compact uppercase table headers, subtle separators, status badges, and horizontal overflow on constrained widths.

For mobile:
- permit horizontal scrolling for dense tables;
- or switch to stacked/card representations when the content is better understood that way;
- never force unreadable tiny text.

## Modals / Overlays

Use a layered model:
1. page/content;
2. overlay scrim;
3. glass/surface container;
4. sticky internal header where necessary;
5. clear close/action controls.

Modal transitions should feel spring-like but remain short and reversible.

## Motion

Default motion language:
- smooth;
- physical rather than decorative;
- short response on direct interaction;
- spring-like settling for surfaces and navigation;
- avoid continuous animation unless it communicates system state.

Respect:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: opacity .2s ease !important;
    transform: none !important;
  }
}
```

## Transparency Accessibility

If the user/device requests reduced transparency, replace translucent glass with solid theme surfaces and remove backdrop blur.

```css
@media (prefers-reduced-transparency: reduce) {
  .tk-glass,
  .tk-header,
  .tk-modal {
    background: var(--tk-surface) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
}
```

## Theme System

Support at least `dark` and `light` using a root attribute:

```html
<html data-theme="dark">
```

Dark is the reference Trim Key product appearance.

Light mode must not simply invert the page. It requires dedicated surface, text, border, shadow, and glass tokens.

If no saved preference exists, the application may respect `prefers-color-scheme`.

## Browser / Device Compatibility

The requirement is graceful compatibility, not pixel-identical rendering in every browser.

Compatibility priority:
1. semantic structure and functionality;
2. readable contrast;
3. responsive layout;
4. standard CSS styling;
5. enhanced blur/glass;
6. advanced refraction.

Use progressive enhancement:

```css
/* baseline */
.tk-glass { background: var(--tk-surface); }

@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .tk-glass { background: var(--tk-glass-bg); backdrop-filter: var(--tk-glass-blur); -webkit-backdrop-filter: var(--tk-glass-blur); }
}
```

Avoid making the core system depend on:
- CSS features unavailable in major supported browsers;
- JavaScript frameworks;
- WebGL;
- SVG filters;
- CSS Houdini;
- `color-mix()` or modern color spaces unless they are optional enhancements.

## Framework Rules

### Plain HTML
Use `class="tk-card tk-glass"`.

### React / Next.js
Use `className="tk-card tk-glass"` and import the global CSS once.

### Django / Flask / FastAPI / Jinja
Use the same classes in templates.

### PHP / Laravel / WordPress
Use the same classes or enqueue the compiled design-system CSS.

### Component Libraries
The Trim Key system is the visual source of truth. A third-party component library must be styled/adapted to match it, not the other way around.

## JavaScript Boundary

CSS owns:
- visual appearance;
- states that can be represented by classes/attributes;
- responsiveness;
- animations;
- themes.

JavaScript owns only behavior such as:
- opening/closing a drawer;
- modal state;
- theme persistence;
- optional advanced refraction;
- focus management;
- dynamic navigation.

Never make a visual component depend on application-specific backend code.

## Naming / Migration

When converting the existing Ed Trim Key CSS:

1. Extract repeated values into tokens.
2. Create `tk-*` canonical classes.
3. Keep legacy selectors temporarily as aliases where migration would otherwise break production.
4. Remove duplicate declarations only after confirming the canonical class covers them.
5. Separate application layout from design-system primitives.
6. Remove business logic from the visual CSS.
7. Remove hard-coded URLs, API endpoints, IDs, and backend assumptions from the design-system layer.
8. Do not copy dashboard-specific selectors into the global package unless they represent a reusable UI primitive.

## What Belongs Outside the Design System

Do not put these into global visual CSS:
- authentication;
- API URLs;
- database logic;
- Supabase logic;
- Vercel logic;
- Google Apps Script calls;
- institute-specific business rules;
- payment processing;
- job IDs;
- dashboard data models;
- user permissions;
- application-specific DOM IDs.

## AI Coding Agent Rules

Whenever an AI agent creates or modifies a Trim Key interface:

1. Inspect the existing Trim Key design-system tokens first.
2. Reuse existing components before creating new ones.
3. Reuse existing tokens before adding a token.
4. Use `tk-*` for new global classes.
5. Never introduce a random gradient/color/shadow without a reason.
6. Preserve the cyan + deep navy visual identity unless the project explicitly specifies another product theme.
7. Prefer layered glass over a flat translucent rectangle when the component is intended to be premium/glass.
8. Always provide a non-glass fallback.
9. Test mobile layout.
10. Test dark and light themes when both are enabled.
11. Test keyboard focus.
12. Respect reduced motion/transparency.
13. Keep application logic separate from visual primitives.
14. Do not rewrite the entire UI when the user asks for a local change.
15. If a new component is reusable across two or more Trim Key products, promote it into the global system instead of duplicating it.

## Definition of Done

A Trim Key UI change is complete only when:

- it uses the design tokens;
- it visually belongs to the Trim Key family;
- it works without a framework;
- it can be used from React/Next.js and server-rendered templates;
- it has a graceful glass fallback;
- it is responsive;
- it remains usable with reduced motion/transparency;
- it has visible interaction/focus states;
- it does not leak application-specific logic into the global design layer;
- it does not create unnecessary one-off CSS.

## Product Relationship

Trim Key is the parent brand.
Ed Trim Key is the education division.
Other Trim Key products may inherit this system while changing only their product-level content and permitted brand tokens.

The design system should make these products feel like the same company without forcing every product to look identical.
