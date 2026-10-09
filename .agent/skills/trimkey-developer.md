---
name: trimkey-developer
description: Strict design system, CSS rules, Apple Liquid Glass physics, and Next.js architecture guidelines for Trim Key Flow.
---

# Trim Key Flow: Developer & Design System Rules

You are acting as the Lead Frontend Engineer for Trim Key Flow. Always adhere to these absolute rules when writing or modifying code in this workspace.

## 1. Apple Liquid Glass Physics (CRITICAL)
The core aesthetic of this application is "Apple Liquid Glass".
- **The Rule of Blur:** Target elements must use ackdrop-filter: blur(40px) saturate(200%) !important; and its -webkit- prefixed counterpart.
- **Vercel Minifier Bypass:** Next.js/SWC minification breaks CSS variables in ackdrop-filter. The universal glass rules are strictly maintained in a raw <style dangerouslySetInnerHTML> block injected into pp/layout.tsx. Do NOT move these rules to globals.css.
- **CSS Stacking Contexts:** **NEVER** nest a glass element (like a dropdown) inside another glass element (like a button). Chromium will trap the child's blur inside the parent's boundary. 
  - *Fix:* Make them DOM siblings wrapped in a <div style={{ position: "relative" }}>.
- **Modals & Dropdowns:** Must use ackground: rgba(10, 15, 25, 0.75) (dark shade), order: 1px solid rgba(255, 255, 255, 0.15), and ox-shadow: 0 10px 40px rgba(0,0,0,0.5).

## 2. Component Standards
- **Buttons:** All standard action buttons must use the .liquid-glass class. 
  - Structure: <button className="liquid-glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 800 }}><svg ...>Text</button>
  - Click Effect: Buttons must scale down (	ransform: scale(0.96)) on :active.
- **Theme Colors:** 
  - Brand/Primary: Emerald Green (#10B981 / ar(--brand)). 
  - Backgrounds: Dark slate/blue (#050B14, #0B111E).
- **UI Consistency:** All menus, modals, and sticky headers must use identical padding, SVG styling, and glass logic.

## 3. Responsive Layout (950px Breakpoint)
- **Desktop (> 950px):** Uses the left sidebar navigation (.sidebar). The mobile bottom nav is strictly hidden via @media (min-width: 951px) { #mobile-nav-bar { display: none !important; } }.
- **Mobile (<= 950px):** 100% Native App Feel.
  - The left sidebar and top hamburger menu are strictly hidden (display: none !important).
  - Navigation relies entirely on the floating Apple-style pill (#mobile-nav-bar) anchored to the bottom of the screen.

## 4. Next.js Architecture & Performance
- **Client Router Caching:** To prevent loading.tsx spinners from ruining the SPA feel when switching tabs, we use experimental.staleTimes: { dynamic: 300 } in 
ext.config.ts. This caches server payloads in the browser for 5 minutes.
- **Data Architecture:** Multi-tenant setup. Only merchant entities are global. All other data, rules, and configurations belong to specific merchants.
