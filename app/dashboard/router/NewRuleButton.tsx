'use client'

import React, { useState, useTransition } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { addRoutingRule } from './actions'

export function NewRuleButton({ providers }: { providers: any[] }) {
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const [selectedProviderId, setSelectedProviderId] = useState(providers[0]?.id || '')
  const [conditionType, setConditionType] = useState('always')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProviderId) {
      showToast('No active providers available', 'error')
      return
    }

    const provider = providers.find(p => p.id === selectedProviderId)
    
    startTransition(async () => {
      try {
        await addRoutingRule(selectedProviderId, provider.merchant_id, conditionType)
        showToast('Rule added successfully', 'success')
        setIsOpen(false)
      } catch (err: any) {
        showToast(err.message || 'Failed to add rule', 'error')
      }
    })
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="liquid-glass" 
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 800 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v8"/>
          <path d="M8 12h8"/>
        </svg> 
        New Rule
      </button>

      {isOpen && (
        <div className="glass-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-box" style={{ width: '400px', maxWidth: '90%', padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Add New Routing Rule</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Target Provider</label>
                <select 
                  className="tk-input" 
                  style={{ width: '100%', textTransform: 'capitalize' }}
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  disabled={providers.length === 0}
                >
                  {providers.length === 0 ? (
                    <option value="">No Active Providers</option>
                  ) : (
                    providers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.provider} ({p.merchants?.name})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Condition</label>
                <select 
                  className="tk-input" 
                  style={{ width: '100%' }}
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value)}
                >
                  <option value="always">Always (use as default fallback)</option>
                  <option value="volume">High Volume (&gt;$1000)</option>
                  <option value="international">International Cards (USD)</option>
                </select>
              </div>
              <button disabled={isPending || providers.length === 0} type="submit" className="liquid-glass" style={{ padding: '10px', fontWeight: 800, marginTop: '10px' }}>
                {isPending ? 'Saving...' : 'Save Rule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
