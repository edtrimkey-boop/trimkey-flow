"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'general';
  
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isTestMode, setIsTestMode] = useState(false);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
           <h3>Configuration & Profile</h3>
           <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
              Manage your organization settings, profiles, and API preferences.
           </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
           <button onClick={() => showToast('Configuration Saved Successfully', 'success')} className="liquid-glass" style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 800 }}>
             Save Changes
           </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '25px' }}>
        {['general', 'profile', 'billing'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={activeTab === t ? "flat-pill bg-info" : "flat-pill"}
            style={activeTab === t ? {} : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span style={{ textTransform: 'capitalize' }}>{t}</span>
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h4 style={{ color: 'white', marginTop: 0, marginBottom: '20px' }}>User Profile</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '6px' }}>FULL NAME</label>
              <input type="text" className="tk-input" defaultValue="Admin User" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '6px' }}>EMAIL ADDRESS</label>
              <input type="email" className="tk-input" defaultValue="admin@trimkey.in" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '6px' }}>ORGANIZATION</label>
              <input type="text" className="tk-input" defaultValue="Trim Key Corp" disabled style={{ opacity: 0.5 }} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ color: 'var(--brand)', marginTop: 0, marginBottom: '15px' }}>Active Gateways</h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 800 }}>Razorpay Adapter</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Primary INR routing via UPI/Cards.</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="slider round"></span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 800 }}>Stripe Global</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>International cards & USD.</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ color: 'var(--warning)', marginTop: 0, marginBottom: '15px' }}>Developer Mode</h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 800 }}>Simulate Transactions</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Route all payments to mock adapter.</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={isTestMode} onChange={(e) => setIsTestMode(e.target.checked)} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'billing' && (
        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
           <h3 style={{ color: 'white' }}>Pro Plan Active</h3>
           <p style={{ color: 'var(--text-muted)' }}>You are currently on the Enterprise Trim Key plan.</p>
        </div>
      )}

    </div>
  );
}

