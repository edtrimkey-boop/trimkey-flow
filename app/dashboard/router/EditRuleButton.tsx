'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { ModalPortal } from '@/components/ui/ModalPortal'
import { updateRoutingRule, deleteRoutingRule } from './actions'

export function EditRuleButton({
  rule,
  providers,
}: {
  rule: any
  providers: any[]
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  // Determine initial condition type
  const initialCondition = rule.condition_currency === 'USD'
    ? 'international'
    : rule.condition_min_amount
    ? 'volume'
    : 'always'

  const [name, setName] = useState(rule.name || '')
  const [priority, setPriority] = useState<number>(rule.priority ?? 1)
  const [targetProviderId, setTargetProviderId] = useState(
    rule.target_provider_id || providers[0]?.id || ''
  )
  const [conditionType, setConditionType] = useState(initialCondition)
  const [isActive, setIsActive] = useState<boolean>(rule.is_active ?? true)

  const handleOpen = () => {
    setName(rule.name || '')
    setPriority(rule.priority ?? 1)
    setTargetProviderId(rule.target_provider_id || providers[0]?.id || '')
    setConditionType(initialCondition)
    setIsActive(rule.is_active ?? true)
    setIsOpen(true)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateRoutingRule(rule.id, {
          name,
          priority: Number(priority),
          target_provider_id: targetProviderId,
          conditionType,
          is_active: isActive,
        })
        showToast('Routing rule updated successfully', 'success')
        setIsOpen(false)
        router.refresh()
      } catch (err: any) {
        showToast(err.message || 'Failed to update routing rule', 'error')
      }
    })
  }

  const handleDelete = async () => {
    const ok = await confirm(
      `Are you sure you want to delete routing rule "${rule.name}"? Traffic will no longer follow this priority.`
    )
    if (!ok) return

    setIsDeleting(true)
    try {
      await deleteRoutingRule(rule.id)
      showToast('Routing rule deleted successfully', 'success')
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to delete routing rule', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flat-pill"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          fontSize: '11px',
          padding: '5px 14px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          transition: 'all 0.2s ease',
        }}
        title="Edit routing rule settings"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        Edit
      </button>

      <ModalPortal
        isOpen={isOpen}
        onClose={() => !isPending && !isDeleting && setIsOpen(false)}
        maxWidth="480px"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'white', fontWeight: 800 }}>Edit Routing Rule</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {rule.id}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
              Rule Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="tk-input"
              style={{ width: '100%' }}
              placeholder="e.g. High Volume Routing"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                Priority (Rank)
              </label>
              <input
                type="number"
                min="1"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                className="tk-input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                Status
              </label>
              <select
                className="tk-input"
                style={{ width: '100%' }}
                value={isActive ? 'active' : 'disabled'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
              Target Provider
            </label>
            <select
              className="tk-input"
              style={{ width: '100%', textTransform: 'capitalize' }}
              value={targetProviderId}
              onChange={(e) => setTargetProviderId(e.target.value)}
              required
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.provider} ({p.merchants?.name || 'Default Merchant'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
              Condition Trigger
            </label>
            <select
              className="tk-input"
              style={{ width: '100%' }}
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value)}
            >
              <option value="always">Always (Default Fallback)</option>
              <option value="volume">High Volume (&gt; ₹1,000)</option>
              <option value="international">International Cards (USD)</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '10px',
              paddingTop: '15px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isPending}
              className="liquid-glass"
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                color: 'var(--danger)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                cursor: isDeleting ? 'wait' : 'pointer',
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Rule'}
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending || isDeleting}
                className="liquid-glass"
                style={{ padding: '8px 14px', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || isDeleting}
                className="liquid-glass"
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: 'white',
                  background: 'linear-gradient(135deg, var(--brand), #00c985)',
                  cursor: isPending ? 'wait' : 'pointer',
                }}
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </ModalPortal>
    </>
  )
}
