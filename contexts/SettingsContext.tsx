"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
import { toCssVariable } from '@/lib/utils/color'
import { useAuth } from '@/hooks/useAuth'

interface SettingsState {
    // Theme & Appearance
    theme: 'light' | 'dark'
    colorScheme: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red' | 'yellow' | 'indigo' | 'teal' | 'cyan' | 'custom'
    customAccentColor: string

    // UI Preferences
    sidebarCollapsed: boolean
    showTooltips: boolean

    // Animations & Effects
    enableGlowEffects: boolean
}

const defaultSettings: SettingsState = {
    theme: 'dark',
    colorScheme: 'blue',
    customAccentColor: 'hsl(221.2 83.2% 53.3%)',
    sidebarCollapsed: false,
    showTooltips: true,
    enableGlowEffects: true
}

interface SettingsContextType {
    settings: SettingsState
    updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
    resetSettings: () => void
    saveSettings: () => void
    hasUnsavedChanges: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: Readonly<{ children: ReactNode }>) {
    const { user } = useAuth()
    const [settings, setSettings] = useState<SettingsState>(defaultSettings)
    const [savedSettings, setSavedSettings] = useState<SettingsState>(defaultSettings)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    // Generate user-specific storage keys
    const getStorageKey = (key: string) => {
        const userId = user?.id || 'anonymous'
        return `scholarai-settings-${userId}-${key}`
    }

    // Load settings from localStorage on mount
    useEffect(() => {
        const loadSettings = () => {
            try {
                // First try to load from sessionStorage (temporary changes)
                const tempSettings = sessionStorage.getItem(getStorageKey('temp'))
                if (tempSettings) {
                    const parsed = JSON.parse(tempSettings)
                    const tempLoadedSettings = { ...defaultSettings, ...parsed }
                    setSettings(tempLoadedSettings)
                    setHasUnsavedChanges(true)
                }

                // Then load saved settings from localStorage
                const savedSettings = localStorage.getItem(getStorageKey('saved'))
                if (savedSettings) {
                    const parsed = JSON.parse(savedSettings)
                    const loadedSettings = { ...defaultSettings, ...parsed }
                    setSavedSettings(loadedSettings)

                    // If no temp settings, use saved settings
                    if (!tempSettings) {
                        setSettings(loadedSettings)
                    }
                } else {
                    setSavedSettings(defaultSettings)
                    if (!tempSettings) {
                        setSettings(defaultSettings)
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error)
                setSavedSettings(defaultSettings)
                setSettings(defaultSettings)
            }
        }
        loadSettings()
    }, [user?.id]) // Reload when user changes

    // Apply settings to DOM
    useEffect(() => {
        const root = document.documentElement

        // Apply theme
        root.setAttribute('data-theme', settings.theme)

        // Apply color scheme
        root.setAttribute('data-color-scheme', settings.colorScheme)

        // Apply custom accent color
        if (settings.colorScheme === 'custom' && settings.customAccentColor) {
            root.style.setProperty('--custom-accent', toCssVariable(settings.customAccentColor))
        }





        // Apply glow effects
        if (!settings.enableGlowEffects) {
            root.classList.add('no-glow')
        } else {
            root.classList.remove('no-glow')
        }
    }, [settings])



    const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value }

            // Apply settings immediately for real-time feedback
            const root = document.documentElement

            if (key === 'theme') {
                root.setAttribute('data-theme', value as string)
            } else if (key === 'colorScheme') {
                root.setAttribute('data-color-scheme', value as string)
                // Apply custom accent color if using custom scheme
                if (value === 'custom' && newSettings.customAccentColor) {
                    root.style.setProperty('--custom-accent', toCssVariable(newSettings.customAccentColor))
                }
            } else if (key === 'customAccentColor') {
                // Apply custom accent color if we're in custom color scheme
                if (newSettings.colorScheme === 'custom') {
                    root.style.setProperty('--custom-accent', toCssVariable(value as string))
                }
            } else if (key === 'enableGlowEffects') {
                if (!value) {
                    root.classList.add('no-glow')
                } else {
                    root.classList.remove('no-glow')
                }
            }

            // Store in sessionStorage for temporary persistence
            try {
                sessionStorage.setItem(getStorageKey('temp'), JSON.stringify(newSettings))
            } catch (error) {
                console.error('Error saving to session storage:', error)
            }

            return newSettings
        })

        // Check if settings have changed from saved settings
        setHasUnsavedChanges(true)
    }

    const saveSettings = () => {
        try {
            localStorage.setItem(getStorageKey('saved'), JSON.stringify(settings))
            setSavedSettings(settings)
            setHasUnsavedChanges(false)
            // Clear session storage after saving
            sessionStorage.removeItem(getStorageKey('temp'))
        } catch (error) {
            console.error('Error saving settings:', error)
        }
    }

    const resetSettings = () => {
        setSettings(defaultSettings)
        setHasUnsavedChanges(true)
        // Clear session storage when resetting
        sessionStorage.removeItem(getStorageKey('temp'))
    }

    const value: SettingsContextType = useMemo(() => ({
        settings,
        updateSetting,
        resetSettings,
        saveSettings,
        hasUnsavedChanges
    }), [settings, updateSetting, resetSettings, saveSettings, hasUnsavedChanges])

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
} 