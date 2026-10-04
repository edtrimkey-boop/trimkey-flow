'use client';

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { updateProfile, toggleProvider } from "./actions";

export default function SettingsClient({ profile, organization, providers }: { profile: any, organization: any, providers: any[] }) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'general';
  
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isTestMode, setIsTestMode] = useState(false);

  const [name, setName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(organization?.email || '');

  const handleSaveProfile = async () => {
    if (!profile) return;
    await updateProfile(profile.id, name);
    showToast('Profile updated successfully', 'success');
  };

  const handleToggleProvider = async (providerId: string, currentStatus: boolean) => {
    await toggleProvider(providerId, !currentStatus);
    showToast('Provider status updated', 'success');
  };

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
           {activeTab === 'profile' && (
             <button onClick={handleSaveProfile} className="liquid-glass" style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 800 }}>
               Save Changes
             </button>
           )}
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
              <input type="text" className="tk-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '6px' }}>EMAIL ADDRESS</label>
              <input type="email" className="tk-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '6px' }}>ORGANIZATION</label>
              <input type="text" className="tk-input" defaultValue={organization?.name || 'Trim Key Corp'} disabled style={{ opacity: 0.5 }} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ color: 'var(--brand)', marginTop: 0, marginBottom: '15px' }}>Active Gateways</h4>
            
            {providers.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <div style={{ color: 'white', fontSize: '13px', fontWeight: 800, textTransform: 'capitalize' }}>{p.provider} Adapter</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Primary routing configuration.</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={p.is_active} onChange={() => handleToggleProvider(p.id, p.is_active)} />
                  <span className="slider round"></span>
                </label>
              </div>
            ))}
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
