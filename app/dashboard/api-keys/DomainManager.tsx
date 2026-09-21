'use client'

import React, { useState, useEffect } from 'react'
import { addDomainAction, getDomainsAction, deleteDomainAction } from './domain-actions'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

export function DomainManager() {
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [domains, setDomains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadDomains()
  }, [])

  async function loadDomains() {
    setLoading(true)
    try {
      const data = await getDomainsAction()
      setDomains(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newDomain) return
    
    // Auto-prefix http/https if missing just to be safe
    let formattedDomain = newDomain.trim()
    if (!formattedDomain.startsWith('http')) {
      formattedDomain = 'https://' + formattedDomain
    }

    setAdding(true)
    try {
      await addDomainAction(formattedDomain)
      setNewDomain('')
      await loadDomains()
      showToast('Domain authorized successfully!', 'success')
    } catch (err: any) {
      showToast(err.message || 'An error occurred', 'error')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(domainStr: string) {
    const ok = await confirm(`Are you sure you want to remove ${domainStr}? API keys will no longer work on this domain.`)
    if (!ok) return
    try {
      await deleteDomainAction(domainStr)
      await loadDomains()
      showToast('Domain removed', 'success')
    } catch (err: any) {
      showToast(err.message || 'An error occurred', 'error')
    }
  }

  return (
    <div className="panel" style={{ marginTop: '20px' }}>
      <div className="panel-header">
        <div>
          <h3>Authorized Domains</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
            API requests made from the browser will only be accepted if the Origin matches these domains.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="e.g. https://acmesneakers.com" 
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            style={{ flex: 1, padding: '10px', background: '#1F2937', border: '1px solid #374151', color: 'white', borderRadius: '6px' }} 
          />
          <button 
            type="submit" 
            disabled={adding || !newDomain}
            style={{ padding: '0 20px', background: 'linear-gradient(135deg, var(--brand), #1A9CBF)', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: (adding || !newDomain) ? 'not-allowed' : 'pointer' }}
          >
            {adding ? 'Adding...' : 'Add Domain'}
          </button>
        </form>

        {loading ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading domains...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {domains.map((d) => (
              <div key={d.domain} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#111827', border: '1px solid #1F2937', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--brand)' }}>🔒</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{d.domain}</span>
                </div>
                <button 
                  onClick={() => handleRemove(d.domain)}
                  style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                >
                  Remove
                </button>
              </div>
            ))}
            {domains.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No authorized domains yet. Your API keys will be rejected from browser checkouts.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


