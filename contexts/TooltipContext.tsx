"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSettings } from './SettingsContext'

interface TooltipContextType {
    tooltipsEnabled: boolean
    toggleTooltips: () => void
    setTooltipsEnabled: (enabled: boolean) => void
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined)

export function TooltipProvider({ children }: { children: ReactNode }) {
    const { settings } = useSettings()
    const [tooltipsEnabled, setTooltipsEnabled] = useState(true)

    // Sync with settings context
    useEffect(() => {
        setTooltipsEnabled(settings.showTooltips)
    }, [settings.showTooltips])

    const toggleTooltips = () => {
        setTooltipsEnabled(!tooltipsEnabled)
    }

    return (
        <TooltipContext.Provider value={{
            tooltipsEnabled,
            toggleTooltips,
            setTooltipsEnabled
        }}>
            {children}
        </TooltipContext.Provider>
    )
}

export function useTooltip() {
    const context = useContext(TooltipContext)
    if (context === undefined) {
        throw new Error('useTooltip must be used within a TooltipProvider')
    }
    return context
} 