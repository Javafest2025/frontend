"use client"

import React, { useEffect, useState } from 'react'
import { Brain } from 'lucide-react'

interface LoadingScreenProps {
    message?: string
    isVisible: boolean
}

interface PageLoadingIndicatorProps {
    isVisible: boolean
    message?: string
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = "Loading...",
    isVisible
}) => {
    const [dots, setDots] = useState("")

    useEffect(() => {
        if (!isVisible) return

        // Animated dots
        const dotsInterval = setInterval(() => {
            setDots(prev => {
                if (prev.length >= 3) return ""
                return prev + "."
            })
        }, 500)

        return () => {
            clearInterval(dotsInterval)
        }
    }, [isVisible])

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
            {/* Simple gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />

            {/* Main loading container */}
            <div className="relative z-10 text-center">
                {/* ScholarAI Logo with Brain Icon */}
                <div className="mb-8">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="relative">
                            <Brain className="h-16 w-16 text-primary" />
                            <div className="absolute inset-0 h-16 w-16 bg-primary/20 rounded-full blur-md animate-pulse" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            ScholarAI
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Research Assistant</p>
                </div>

                {/* Loading text */}
                <div className="mb-8">
                    <h2 className="text-xl font-medium text-foreground mb-2">
                        {message}{dots}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Preparing your workspace...
                    </p>
                </div>

                {/* Simple loading spinner */}
                <div className="flex justify-center">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            </div>
        </div>
    )
}

// Smaller page loading indicator for less intrusive feedback
export const PageLoadingIndicator: React.FC<PageLoadingIndicatorProps> = ({
    isVisible,
    message = "Loading..."
}) => {
    if (!isVisible) return null

    return (
        <div className="fixed top-4 right-4 z-[9998] bg-background/90 backdrop-blur-xl border border-primary/20 rounded-lg shadow-lg shadow-primary/10 p-3 flex items-center gap-3 animate-in slide-in-from-right-2 duration-300">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm font-medium text-foreground">{message}</span>
            </div>
        </div>
    )
} 