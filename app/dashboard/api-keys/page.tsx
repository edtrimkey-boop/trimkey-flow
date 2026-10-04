export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
'use client'

import React, { useState, useEffect } from 'react'
import { generateNewKeyAction, getExistingKeysAction, getApplicationsAction } from './actions'
import { DomainManager } from './DomainManager'
import { useToast } from '@/components/ui/ToastProvider'
import { GenerateKeyModal } from './GenerateKeyModal'

export default function ApiKeysPage() {
  const { showToast } = useToast()
  const [keys, setKeys] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [revealStates, setRevealStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [keysData, appsData] = await Promise.all([
        getExistingKeysAction(),
        getApplicationsAction()
      ])
      setKeys(keysData)
      setApplications(appsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate(appId: string, env: string) {
    setIsGenerating(true)
    try {
      const newKey = await generateNewKeyAction(appId, env)
      // Add the new key to the top of the list, injecting the full_secret 
      // so it can be seen once by the user.
      setKeys((prev) => [{
        ...newKey,
        key_prefix: newKey.full_secret, // display full secret temporarily
        isNew: true
      }, ...prev])
      
      // Auto-reveal newly generated keys
      setRevealStates(prev => ({ ...prev, [newKey.id]: true }))
    } catch (err) {
      console.error(err)
      showToast('Failed to generate key', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleReveal = (id: string) => {
    setRevealStates(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('Copied to clipboard!', 'success')
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--danger), #B91C1C)', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 25px rgba(239,68,68,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '14px', color: 'white', marginBottom: '4px' }}>
            <span style={{ marginRight: '8px' }}>âš ï¸</span> 
            SECURITY NOTICE
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
            Your API secret keys can be used to process live payments. Do not share them or commit them to GitHub.
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
             <h3>Active API Keys</h3>
             <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                Manage authentication keys for your server integrations.
             </p>
          </div>
          <GenerateKeyModal 
            applications={applications}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
          />
        </div>

        <div className="tk-table-wrapper" style={{ marginTop: '20px' }}>
          <table className="tk-sleek-table">
            <thead>
              <tr>
                <th>Application</th><th>Environment</th>
                <th>Secret Key</th>
                <th>Created</th>
                <th>Last Used</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Loading keys...
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No keys found. Generate one to get started.
                  </td>
                </tr>
              ) : (
                keys.map((k) => {
                  const isRevealed = revealStates[k.id] || false;
                  return (
                    <tr key={k.id} style={k.isNew ? { background: 'rgba(38,195,234,0.1)' } : {}}>
                      <td><span style={{ fontWeight: 800, color: "white" }}>{k.applications?.name || "Unknown App"}</span></td><td><span className={`badge ${k.environment === 'live' ? 'bg-success' : 'bg-warning'}`}>{k.environment.toUpperCase()}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <code style={{ 
                            background: 'rgba(0,0,0,0.3)', 
                            padding: '6px 12px', 
                            borderRadius: '6px', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            fontFamily: 'monospace', 
                            fontSize: '12px', 
                            filter: !isRevealed ? 'blur(4px)' : 'none', 
                            color: k.isNew ? 'var(--success)' : 'var(--brand)', 
                            transition: 'all 0.3s' 
                          }}>
                            {k.key_prefix}{!k.isNew && '********************************'}
                          </code>
                          <button onClick={() => toggleReveal(k.id)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '10px' }}>
                            {isRevealed ? 'Hide' : 'Reveal'}
                          </button>
                          {isRevealed && k.isNew && (
                            <button onClick={() => copyToClipboard(k.key_prefix)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--success)', borderColor: 'var(--success)' }}>
                              Copy
                            </button>
                          )}
                        </div>
                        {k.isNew && (
                          <div style={{ fontSize: '10px', color: 'var(--warning)', marginTop: '4px' }}>
                            Copy this key now. You won't be able to see it again!
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {new Date(k.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td>
                        <span className={`badge ${(k.status || 'active') === 'active' ? 'bg-info' : 'bg-danger'}`}>
                          {(k.status || 'active').toUpperCase()}
                        </span>
                      </td>
                      <td>
                         <button style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>
                           Revoke
                         </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <DomainManager />
    </div>
  )
}



