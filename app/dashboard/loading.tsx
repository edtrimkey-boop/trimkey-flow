import React from 'react'

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" style={{ padding: '20px' }}>
      <div className="panel" style={{ height: '120px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}></div>
      <div className="panel" style={{ height: '400px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}></div>
    </div>
  )
}
