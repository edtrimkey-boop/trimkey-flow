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
- **Client Router Caching:** To prevent loading.tsx spinners from ruining the SPA feel when switching tabs, we use experimental.staleTimes: { dynamic: 300 } in next.config.ts. This caches server payloads in the browser for 5 minutes.
- **Data Architecture:** Multi-tenant setup. Only merchant entities are global. All other data, rules, and configurations belong to specific merchants.

## 5. Custom Alerts, Modals & Toast Messages (STRICT ZERO BROWSER NATIVE DIALOGS)
- **Zero Native Browser Dialogs:** NEVER use `window.alert()`, `window.confirm()`, or `window.prompt()`. They break the native app feel and look unprofessional.
- **Confirmations:** All destructive or critical user action confirmations must strictly use `const { confirm } = useConfirm()` from `@/components/ui/ConfirmProvider`.
  - Usage: `const ok = await confirm('Your confirmation message here'); if (!ok) return;`
  - It renders our custom Apple Glass floating confirmation modal with audio feedback.
- **Notifications & Alerts:** All system feedback, success messages, warnings, and errors must strictly use `const { showToast } = useToast()` from `@/components/ui/ToastProvider`.
  - Usage: `showToast('Message text', 'success' | 'error' | 'warning' | 'info')`
- **Forms & Data Modals:** Management and creation dialogs must use our custom `.glass-box` and `.glass-overlay active` components with dark glass backgrounds (`rgba(10, 15, 25, 0.92)`), glossy borders, and `.liquid-glass` buttons.

## 6. Real Money Movement & Payment Security (MANDATORY)
1. **Timing-Safe Webhook Engine:** All webhook HMAC signatures must strictly be verified in constant time via `crypto.timingSafeEqual`. Never compare signatures with `===` or `!==`. No fallback default secrets (e.g. `'hello12345'`) are permitted.
2. **Zero-Trust Client Checkout:** Never trust client-side callbacks (`handler(response)`) to mark payments as successful. The frontend must pass `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` to a server-side verification endpoint (`verifyCheckoutPaymentAction`) which verifies the cryptographic proof before fulfilling orders.
3. **Amount & Currency Tamper Protection:** Incoming webhooks and checkout proofs must compare gateway charged amounts and currencies against the database order. Any mismatch must immediately trigger `FRAUD_AMOUNT_MISMATCH` and reject fulfillment.
4. **Anti-Replay Idempotency:** Duplicate webhooks must be handled idempotently. If a payment is already in `SUCCESS`, duplicate gateway retries must safely acknowledge without re-firing merchant delivery webhooks.
5. **Memory-Safe Security & Headers:** Keep rate limit storage pruned against memory leaks on serverless cold starts. Enforce `X-Content-Type-Options: nosniff` and `Strict-Transport-Security` headers across public endpoints.


