'use client'

import React from 'react'

export default function ExportButton({ data }: { data: any[] }) {
  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      alert('No data to export')
      return
    }

    const headers = ['ID', 'Amount', 'Currency', 'Status', 'Provider', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...data.map(tx => [
        tx.id,
        (tx.amount / 100).toFixed(2),
        tx.currency,
        tx.status,
        tx.provider,
        new Date(tx.created_at).toISOString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'trim-key-transactions.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <>
      <button className="btn-outline" onClick={handleExportCSV}>Export CSV</button>
      <button className="btn-outline" onClick={() => window.print()}>Export PDF</button>
    </>
  )
}

