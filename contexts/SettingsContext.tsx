"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SettingsState {
    // Theme & Appearance
    theme: 'light' | 'dark'
    colorScheme: 'blue' | 'purple' | 'green' | 'orange' | 'pink'
    layoutDensity: 'compact' | 'comfortable' | 'spacious'

    // UI Preferences
    sidebarCollapsed: boolean
    showTooltips: boolean

    // Animations & Effects
    enableGlowEffects: boolean

    // Accessibility
    highContrast: boolean
    largeText: boolean
    focusIndicators: boolean

    // Notifications
    soundEnabled: boolean
    desktopNotifications: boolean
    emailNotifications: boolean

    // Data & Privacy
    analyticsEnabled: boolean
    crashReporting: boolean
    telemetryEnabled: boolean
}

const defaultSettings: SettingsState = {
    theme: 'dark',
    colorScheme: 'blue',
    layoutDensity: 'comfortable',
    sidebarCollapsed: false,
    showTooltips: true,
    enableGlowEffects: true,
    highContrast: false,
    largeText: false,
    focusIndicators: true,
    soundEnabled: true,
    desktopNotifications: true,
    emailNotifications: false,
    analyticsEnabled: true,
    crashReporting: true,
    telemetryEnabled: false
}

interface SettingsContextType {
    settings: SettingsState
    updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
    resetSettings: () => void
    saveSettings: () => void
    hasUnsavedChanges: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<SettingsState>(defaultSettings)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    // Load settings from localStorage on mount
    useEffect(() => {
        const loadSettings = () => {
            try {
                const savedSettings = localStorage.getItem('scholarai-settings')
                if (savedSettings) {
                    const parsed = JSON.parse(savedSettings)
                    setSettings({ ...defaultSettings, ...parsed })
                }
            } catch (error) {
                console.error('Error loading settings:', error)
            }
        }
        loadSettings()
    }, [])

    // Apply settings to DOM
    useEffect(() => {
        const root = document.documentElement

        // Apply theme
        root.setAttribute('data-theme', settings.theme)

        // Apply color scheme
        root.setAttribute('data-color-scheme', settings.colorScheme)

        // Apply layout density
        root.setAttribute('data-density', settings.layoutDensity)

        // Apply accessibility settings
        if (settings.highContrast) {
            root.classList.add('high-contrast')
            console.log('High contrast enabled')
        } else {
            root.classList.remove('high-contrast')
            console.log('High contrast disabled')
        }

        if (settings.largeText) {
            root.classList.add('large-text')
            console.log('Large text enabled')
        } else {
            root.classList.remove('large-text')
            console.log('Large text disabled')
        }

        if (settings.focusIndicators) {
            root.classList.add('focus-indicators')
            console.log('Focus indicators enabled')
        } else {
            root.classList.remove('focus-indicators')
            console.log('Focus indicators disabled')
        }

        // Apply glow effects
        if (!settings.enableGlowEffects) {
            root.classList.add('no-glow')
        } else {
            root.classList.remove('no-glow')
        }
    }, [settings])



    const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
        setHasUnsavedChanges(true)

        // Apply settings immediately for real-time feedback
        const root = document.documentElement

        if (key === 'enableGlowEffects') {
            if (!value) {
                root.classList.add('no-glow')
            } else {
                root.classList.remove('no-glow')
            }
        } else if (key === 'highContrast') {
            if (value) {
                root.classList.add('high-contrast')
                console.log('High contrast enabled via updateSetting')
            } else {
                root.classList.remove('high-contrast')
                console.log('High contrast disabled via updateSetting')
            }
        } else if (key === 'largeText') {
            if (value) {
                root.classList.add('large-text')
                console.log('Large text enabled via updateSetting')
            } else {
                root.classList.remove('large-text')
                console.log('Large text disabled via updateSetting')
            }
        } else if (key === 'focusIndicators') {
            if (value) {
                root.classList.add('focus-indicators')
                console.log('Focus indicators enabled via updateSetting')
            } else {
                root.classList.remove('focus-indicators')
                console.log('Focus indicators disabled via updateSetting')
            }
        }
    }

    const saveSettings = () => {
        try {
            localStorage.setItem('scholarai-settings', JSON.stringify(settings))
            setHasUnsavedChanges(false)
        } catch (error) {
            console.error('Error saving settings:', error)
        }
    }

    const resetSettings = () => {
        setSettings(defaultSettings)
        setHasUnsavedChanges(true)
    }

    const value: SettingsContextType = {
        settings,
        updateSetting,
        resetSettings,
        saveSettings,
        hasUnsavedChanges
    }

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