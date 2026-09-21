"use client";

import React, { useState } from "react";

export default function SettingsPage() {
  const [isTestMode, setIsTestMode] = useState(false);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pb-20">
      <div className="glass-panel p-8">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
          <h3 className="text-[16px] uppercase text-brand tracking-[1.5px] m-0 font-extrabold">Master Configuration</h3>
          <button className="bg-gradient-to-br from-brand to-[#059669] text-black border-none px-6 py-3 rounded-xl font-extrabold text-[13px] tracking-wide shadow-[0_4px_15px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] transition-all">
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section 1: Gateway Toggles */}
          <div className="bg-black/20 rounded-xl border border-white/10 p-6">
            <h4 className="text-brand mt-0 mb-4 font-extrabold flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Active Gateways
            </h4>
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-white text-[13px] font-extrabold">Razorpay Adapter</div>
                <div className="text-text-muted text-[11px]">Primary INR routing via UPI/Cards.</div>
              </div>
              <label className="switch m-0">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-white text-[13px] font-extrabold">Stripe Adapter</div>
                <div className="text-text-muted text-[11px]">International USD routing.</div>
              </div>
              <label className="switch m-0">
                <input type="checkbox" />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Section 2: Environment Settings */}
          <div className="bg-black/20 rounded-xl border border-white/10 p-6">
            <h4 className="text-accent mt-0 mb-4 font-extrabold flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Environment State
            </h4>
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-white text-[13px] font-extrabold">Force Test Mode</div>
                <div className="text-text-muted text-[11px]">Routes all requests to provider sandboxes.</div>
              </div>
              <label className="switch m-0">
                <input 
                  type="checkbox" 
                  checked={isTestMode}
                  onChange={(e) => setIsTestMode(e.target.checked)} 
                />
                <span className="slider"></span>
              </label>
            </div>
            
            {isTestMode && (
              <div className="text-warning text-[11px] font-bold bg-warning/10 p-3 rounded-lg border border-warning/20">
                Warning: Test mode is currently overriding live API calls.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}