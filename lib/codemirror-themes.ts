"use client"

import { Extension } from '@codemirror/state'
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { githubLight } from '@uiw/codemirror-theme-github'
import { eclipse } from '@uiw/codemirror-theme-eclipse'

export interface CodeMirrorThemeVariant {
  name: string
  theme: Extension
  description: string
}

export interface CodeMirrorThemes {
  dark: CodeMirrorThemeVariant[]
  light: CodeMirrorThemeVariant[]
}

// Available theme variants for CodeMirror
export const codeMirrorThemes: CodeMirrorThemes = {
  dark: [
    {
      name: 'Tokyo Night',
      theme: tokyoNight,
      description: 'Modern dark theme with vibrant colors'
    },
    {
      name: 'Dracula',
      theme: dracula,
      description: 'Popular purple-tinted dark theme'
    }
  ],
  light: [
    {
      name: 'GitHub',
      theme: githubLight,
      description: 'Clean light theme similar to GitHub'
    },
    {
      name: 'Eclipse',
      theme: eclipse,
      description: 'Traditional IDE-style light theme'
    }
  ]
}

// Get theme by name and mode
export function getCodeMirrorTheme(mode: 'light' | 'dark', themeIndex: number = 0): Extension {
  const themes = codeMirrorThemes[mode]
  if (themeIndex >= 0 && themeIndex < themes.length) {
    return themes[themeIndex].theme
  }
  // Fallback to first theme
  return themes[0].theme
}

// Get current theme variant index from localStorage
export function getCurrentThemeVariant(mode: 'light' | 'dark'): number {
  if (typeof window === 'undefined') return 0
  
  const stored = localStorage.getItem(`codemirror-theme-${mode}`)
  const index = stored ? parseInt(stored, 10) : 0
  
  // Validate index
  const maxIndex = codeMirrorThemes[mode].length - 1
  return Math.max(0, Math.min(index, maxIndex))
}

// Set theme variant index in localStorage
export function setCurrentThemeVariant(mode: 'light' | 'dark', index: number): void {
  if (typeof window === 'undefined') return
  
  const maxIndex = codeMirrorThemes[mode].length - 1
  const validIndex = Math.max(0, Math.min(index, maxIndex))
  localStorage.setItem(`codemirror-theme-${mode}`, validIndex.toString())
}

// Cycle to next theme variant
export function cycleThemeVariant(mode: 'light' | 'dark'): number {
  const currentIndex = getCurrentThemeVariant(mode)
  const nextIndex = (currentIndex + 1) % codeMirrorThemes[mode].length
  setCurrentThemeVariant(mode, nextIndex)
  return nextIndex
}
