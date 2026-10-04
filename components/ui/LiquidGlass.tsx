'use client'

import React, { useEffect, useRef } from 'react'
// @ts-ignore
import { liquidGlass } from '@/lib/liquid-glass'

interface LiquidGlassProps extends React.HTMLAttributes<HTMLElement> {
  scale?: number
  chroma?: number
  blur?: number
  saturate?: number
  border?: number
  fallbackBlur?: number
  as?: any
}

export function LiquidGlass({ 
  children, 
  className = '', 
  scale = -80,
  chroma = 5,
  blur = 20,
  saturate = 1.2,
  border = 2,
  fallbackBlur = 24,
  as: Component = 'div',
  ...props 
}: LiquidGlassProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const { destroy } = liquidGlass(ref.current, {
      scale,
      chroma,
      blur,
      saturate,
      border,
      fallbackBlur
    })

    return () => {
      destroy()
    }
  }, [scale, chroma, blur, saturate, border, fallbackBlur])

  return (
    <Component ref={ref} className={className} {...props}>
      {children}
    </Component>
  )
}
