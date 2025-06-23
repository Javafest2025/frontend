"use client"

import React, { useEffect, useState } from 'react'

interface LoadingScreenProps {
    message?: string
    isVisible: boolean
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = "Loading...",
    isVisible
}) => {
    const [progress, setProgress] = useState(0)
    const [dots, setDots] = useState("")

    useEffect(() => {
        if (!isVisible) return

        // Animated progress bar
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100
                return prev + Math.random() * 15
            })
        }, 150)

        // Animated dots
        const dotsInterval = setInterval(() => {
            setDots(prev => {
                if (prev.length >= 3) return ""
                return prev + "."
            })
        }, 500)

        return () => {
            clearInterval(progressInterval)
            clearInterval(dotsInterval)
        }
    }, [isVisible])

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-pulse" />

            {/* Neural Network Background */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Animated circuit lines */}
                <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 1000">
                    <defs>
                        <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
                        </linearGradient>
                    </defs>

                    {/* Animated circuit paths */}
                    <path
                        d="M100 200 L300 200 L300 400 L600 400 L600 600 L900 600"
                        stroke="url(#circuitGradient)"
                        strokeWidth="2"
                        fill="none"
                        className="animate-pulse"
                        strokeDasharray="10,5"
                    >
                        <animate
                            attributeName="stroke-dashoffset"
                            values="0;-15;0"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </path>

                    <path
                        d="M900 200 L700 200 L700 400 L400 400 L400 600 L100 600"
                        stroke="url(#circuitGradient)"
                        strokeWidth="2"
                        fill="none"
                        className="animate-pulse"
                        strokeDasharray="8,3"
                    >
                        <animate
                            attributeName="stroke-dashoffset"
                            values="0;-11;0"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                    </path>

                    <path
                        d="M500 100 L500 300 L200 300 L200 500 L800 500 L800 700"
                        stroke="url(#circuitGradient)"
                        strokeWidth="2"
                        fill="none"
                        className="animate-pulse"
                        strokeDasharray="12,7"
                    >
                        <animate
                            attributeName="stroke-dashoffset"
                            values="0;-19;0"
                            dur="2.5s"
                            repeatCount="indefinite"
                        />
                    </path>
                </svg>

                {/* Floating particles */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-primary rounded-full animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${3 + Math.random() * 2}s`,
                            boxShadow: '0 0 10px rgba(99, 102, 241, 0.8)',
                        }}
                    />
                ))}
            </div>

            {/* Main loading container */}
            <div className="relative z-10 text-center">
                {/* Central AI brain/core */}
                <div className="relative mb-8">
                    {/* Outer rotating ring */}
                    <div className="w-32 h-32 mx-auto relative">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-spin-slow">
                            <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1 shadow-lg shadow-primary/50" />
                            <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-purple-500 rounded-full transform -translate-x-1/2 translate-y-1 shadow-lg shadow-purple-500/50" />
                        </div>

                        {/* Inner rotating ring */}
                        <div className="absolute inset-4 rounded-full border border-primary/50 animate-spin-reverse">
                            <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-primary rounded-full transform -translate-x-1/2 -translate-y-0.5" />
                            <div className="absolute right-0 top-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full transform translate-x-0.5 -translate-y-1/2" />
                            <div className="absolute left-0 top-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full transform -translate-x-0.5 -translate-y-1/2" />
                        </div>

                        {/* Core brain */}
                        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-primary/40 flex items-center justify-center animate-pulse-glow">
                            <div className="w-6 h-6 bg-gradient-to-br from-primary to-purple-500 rounded-full animate-ping" />
                        </div>
                    </div>
                </div>

                {/* Loading text */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent font-['Segoe_UI'] mb-2">
                        {message}{dots}
                    </h2>
                    <p className="text-primary/60 text-sm font-['Segoe_UI']">
                        Initializing neural pathways...
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-64 mx-auto">
                    <div className="w-full bg-slate-700/50 rounded-full h-2 backdrop-blur-sm border border-primary/20 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-fast" />
                        </div>
                    </div>
                    <div className="text-xs text-primary/50 mt-2 font-['Segoe_UI']">
                        {Math.round(Math.min(progress, 100))}%
                    </div>
                </div>

                {/* Pulsing indicators */}
                <div className="flex justify-center gap-2 mt-8">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="w-2 h-2 bg-primary rounded-full animate-pulse"
                            style={{
                                animationDelay: `${i * 0.3}s`,
                                boxShadow: '0 0 8px rgba(99, 102, 241, 0.6)',
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

// Add custom styles
const styles = `
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes spin-reverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3), inset 0 0 10px rgba(99, 102, 241, 0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(99, 102, 241, 0.6), inset 0 0 15px rgba(99, 102, 241, 0.2);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-10px) scale(1.1);
    opacity: 1;
  }
}

@keyframes shimmer-fast {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-spin-slow {
  animation: spin-slow 4s linear infinite;
}

.animate-spin-reverse {
  animation: spin-reverse 3s linear infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-shimmer-fast {
  animation: shimmer-fast 1.5s ease-in-out infinite;
}
`

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style')
    styleSheet.textContent = styles
    document.head.appendChild(styleSheet)
} 