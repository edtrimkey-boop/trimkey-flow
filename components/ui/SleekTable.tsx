import React from 'react'

interface Column {
  key: string
  header: React.ReactNode
  render?: (row: any) => React.ReactNode
}

interface SleekTableProps {
  columns: Column[]
  data: any[]
  searchQuery?: string // Handled externally or passed for highlighting if needed
}

export function SleekTable({ columns, data }: SleekTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center p-10 bg-black/20 rounded-xl">
        <p className="text-text-muted text-sm font-bold">No records found.</p>
      </div>
    )
  }

  return (
    <div className="tk-table-wrapper w-full overflow-x-auto p-1">
      <table className="tk-sleek-table w-full border-separate" style={{ borderSpacing: '0 12px' }}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className="p-3 text-[11px] font-extrabold text-text-muted uppercase text-left tracking-wide border-none"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className="hover:scale-[1.005] hover:-translate-y-0.5 transition-all duration-300 ease-in-out cursor-default hover:shadow-[0_12px_35px_rgba(0,0,0,0.4)]"
            >
              {columns.map((col, colIndex) => {
                // Determine rounded corners for first and last cells
                let cellClasses = "p-[18px_22px] bg-gradient-to-r from-white/[0.015] to-white/[0.03] border-y border-white/[0.04] text-[13px] font-semibold text-white align-middle transition-all duration-300 group-hover:bg-brand/5 group-hover:border-brand/20"
                
                if (colIndex === 0) {
                  cellClasses += " border-l rounded-l-2xl"
                }
                if (colIndex === columns.length - 1) {
                  cellClasses += " border-r rounded-r-2xl"
                }

                return (
                  <td key={colIndex} className={cellClasses}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
