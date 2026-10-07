import React, { ButtonHTMLAttributes } from 'react'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger' | 'success' | 'warning'
  isCircle?: boolean
  children: React.ReactNode
}

export function GlassButton({ 
  children, 
  variant = 'primary', 
  isCircle = false,
  className = '',
  ...props 
}: GlassButtonProps) {
  
  // Base classes for the Apple Glass physics scaling
  let baseClasses = 'liquid-glass flex items-center justify-center transition-all duration-300 ease-out active:scale-96'

  // Apply correct border-radius
  baseClasses += isCircle ? ' glass-circle-btn' : ' rounded-[50px] px-6 py-3 font-extrabold text-[13px] tracking-wide'

  // Apply variant styling
  switch (variant) {
    case 'primary':
      // The master prompt requires primary actions to use the Emerald Green brand gradient
      baseClasses += ' bg-gradient-to-br from-[#10B981] to-[#059669] text-black border-none shadow-[0_4px_15px_rgba(16,185,129,0.25)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5'
      break
    case 'outline':
      baseClasses += ' btn-outline border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10'
      break
    case 'danger':
      baseClasses += ' bg-red-500/10 border-red-500 text-red-500 hover:bg-gradient-to-br hover:from-red-500 hover:to-red-700 hover:text-white hover:border-transparent hover:shadow-[0_4px_15px_rgba(239,68,68,0.3)]'
      break
    case 'success':
      baseClasses += ' bg-[#10B981]/10 border-[#10B981] text-[#10B981] hover:bg-gradient-to-br hover:from-[#10B981] hover:to-[#059669] hover:text-black hover:border-transparent hover:shadow-[0_4px_15px_rgba(16,185,129,0.3)]'
      break
    case 'warning':
      baseClasses += ' bg-amber-500/10 border-amber-500 text-amber-500 hover:bg-gradient-to-br hover:from-amber-500 hover:to-amber-600 hover:text-black hover:border-transparent hover:shadow-[0_4px_15px_rgba(245,158,11,0.3)]'
      break
  }

  return (
    <button className={`${baseClasses} ${className}`} {...props}>
      {children}
    </button>
  )
}
