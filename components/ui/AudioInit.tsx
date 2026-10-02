'use client'
import { useEffect } from 'react'
import { initAudioEngine } from '@/lib/audioEngine'

export function AudioInit() {
  useEffect(() => {
    initAudioEngine()
  }, [])
  return null
}
