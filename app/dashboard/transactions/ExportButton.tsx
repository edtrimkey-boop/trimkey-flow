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
        tx.payment_number || tx.id,
        (tx.amount / 100).toFixed(2),
        tx.currency_code,
        tx.status,
        tx.merchant_providers?.provider || '-',
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

  const handleExportPDF = async () => {
    if (!data || data.length === 0) {
      alert('No data to export')
      return
    }
    
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()

    // 1. Draw top banner
    doc.setFillColor(11, 17, 30) // Dark blue background #0b111e
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, 'F')

    // 2. Banner Text
    doc.setTextColor(40, 195, 229) // Cyan
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('TRIM KEY FINANCIAL LEDGER', 14, 22)

    doc.setTextColor(150, 150, 150)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('STATEMENT GENERATED: ' + new Date().toLocaleString(), 14, 32)

    // 3. Operator Details
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('OPERATOR DETAILS', 14, 55)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    // Get organization from the first record or default
    const orgName = data[0]?.applications?.name || data[0]?.merchants?.name || 'ADMINISTRATOR'
    doc.text('Name: ' + orgName.toUpperCase(), 14, 65)
    doc.text('Email: ADMIN@TRIMKEY.IN', 14, 71)

    // 4. AutoTable
    const headers = [['DATE', 'TRANSACTION REFERENCE', 'AMOUNT', 'STATUS']]
    const body = data.map(tx => {
      const dateStr = new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      const refStr = `${tx.payment_number || tx.id} | ${tx.merchant_providers?.provider || 'SYSTEM TASK'}`
      const amountStr = `${tx.currency_code === 'INR' ? 'Rs.' : tx.currency_code || '$'} ${(tx.amount / 100).toFixed(2)}`
      return [
        dateStr,
        refStr.toUpperCase(),
        amountStr,
        tx.status.toUpperCase()
      ]
    })

    autoTable(doc, {
      startY: 85,
      head: headers,
      body: body,
      theme: 'plain',
      headStyles: {
        fillColor: [40, 195, 229],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 10,
        cellPadding: 6
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      didParseCell: function(data) {
         if (data.section === 'body' && (data.column.index === 2 || data.column.index === 3)) {
           // Make AMOUNT and STATUS green and bold
           data.cell.styles.textColor = [40, 195, 100]
           data.cell.styles.fontStyle = 'bold'
         }
      }
    })

    // 5. Total Lifetime Earnings
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY || 100
    
    let total = 0
    data.forEach(tx => total += (tx.amount / 100))

    doc.setDrawColor(200, 200, 200)
    doc.line(14, finalY + 15, doc.internal.pageSize.getWidth() - 14, finalY + 15)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`TOTAL LIFETIME EARNINGS: Rs. ${total.toFixed(2)}`, 14, finalY + 28)

    doc.save('trim-key-financial-ledger.pdf')
  }

  return (
    <>
      <button className="liquid-glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 800 }} onClick={handleExportCSV}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Export CSV
      </button>
      <button className="liquid-glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 800 }} onClick={handleExportPDF}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        Export PDF
      </button>
    </>
  )
}
