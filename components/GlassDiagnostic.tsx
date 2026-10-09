'use client';
import { useEffect } from 'react';

export default function GlassDiagnostic() {
  useEffect(() => {
    // We wait a brief moment to ensure CSS is fully applied
    setTimeout(() => {
      console.group("🔍 GLASS DIAGNOSTIC SCRIPT");
      console.error("Testing Glass Effect Variables and Stacking Contexts...");
      
      // 1. Check global CSS variables
      const root = document.documentElement;
      const computedRoot = getComputedStyle(root);
      const glassBlur = computedRoot.getPropertyValue('--glass-blur');
      const glassBg = computedRoot.getPropertyValue('--glass-bg');
      console.error("[1] CSS Variable --glass-blur resolving to:", glassBlur || "NOT FOUND");
      console.error("[2] CSS Variable --glass-bg resolving to:", glassBg || "NOT FOUND");

      if (!CSS.supports('backdrop-filter', 'blur(10px)') && !CSS.supports('-webkit-backdrop-filter', 'blur(10px)')) {
          console.error("❌ CRITICAL: This browser does NOT support backdrop-filter at all!");
      }

      // 2. Check the specific Dropdown elements
      const dropdowns = document.querySelectorAll('.profile-dropdown, .notif-dropdown, .glass-title-pill');
      if (dropdowns.length === 0) {
        console.error("No glass elements found on page right now.");
      }

      dropdowns.forEach((dropdown) => {
        const computed = getComputedStyle(dropdown);
        console.error(`\n[Checking Element]:`, dropdown.className);
        console.error(" - Computed backdrop-filter:", computed.backdropFilter);
        console.error(" - Computed -webkit-backdrop-filter:", computed.getPropertyValue('-webkit-backdrop-filter'));
        console.error(" - Computed background color:", computed.backgroundColor);
        
        // 3. Check for Stacking Context / Backdrop-Filter blockers in Parents
        let parent = dropdown.parentElement;
        let conflictFound = false;
        while (parent && parent !== document.documentElement) {
          const pStyle = getComputedStyle(parent);
          if (pStyle.filter !== 'none' || pStyle.transform !== 'none' || pStyle.opacity !== '1' || pStyle.backdropFilter !== 'none' || pStyle.willChange !== 'auto') {
              console.error(`⚠️ CONFLICT FOUND: Parent <${parent.tagName.toLowerCase()} class="${parent.className}"> creates a stacking context that traps or breaks backdrop-filter!`, {
                  filter: pStyle.filter,
                  transform: pStyle.transform,
                  opacity: pStyle.opacity,
                  backdropFilter: pStyle.backdropFilter,
                  willChange: pStyle.willChange
              });
              conflictFound = true;
          }
          parent = parent.parentElement;
        }
        if (!conflictFound) console.error("✅ No parent stacking context conflicts found for this element.");
      });
      console.groupEnd();
    }, 1000);
  }, []);

  return null;
}
