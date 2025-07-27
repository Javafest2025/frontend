"use client"

import { useState, useEffect } from "react"
import {
    Wifi,
    WifiOff,
    CheckCircle,
    AlertCircle,
    Clock,
    Zap,
    Brain,
    FileText,
    Database,
    Activity
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

type Props = {
    className?: string
}

export function StatusBar({ className }: Props) {
    const [isOnline, setIsOnline] = useState(true)
    const [aiStatus, setAiStatus] = useState<'ready' | 'processing' | 'offline'>('ready')
    const [papersCount, setPapersCount] = useState(159)
    const [projectsCount, setProjectsCount] = useState(3)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Update time every minute
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 60000)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
            clearInterval(timer)
        }
    }, [])

    const getAiStatusIcon = () => {
        switch (aiStatus) {
            case 'ready':
                return <CheckCircle className="h-3 w-3 text-green-500" />
            case 'processing':
                return <Zap className="h-3 w-3 text-yellow-500 animate-pulse" />
            case 'offline':
                return <AlertCircle className="h-3 w-3 text-red-500" />
        }
    }

    const getAiStatusText = () => {
        switch (aiStatus) {
            case 'ready':
                return 'AI Ready'
            case 'processing':
                return 'AI Processing...'
            case 'offline':
                return 'AI Offline'
        }
    }

    return (
        <div className={cn(
            "flex items-center justify-between h-8 px-4 bg-background/80 backdrop-blur-xl border-t border-primary/15 text-xs relative",
            className
        )}>
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-background/40 to-purple-500/3" />

            {/* Left side */}
            <div className="flex items-center gap-6 relative z-10">
                {/* Connection Status */}
                <div className="flex items-center gap-1.5 text-foreground">
                    {isOnline ? (
                        <Wifi className="h-3 w-3 text-green-500" />
                    ) : (
                        <WifiOff className="h-3 w-3 text-red-500" />
                    )}
                    <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                </div>

                {/* AI Status */}
                <div className="flex items-center gap-1.5 text-foreground">
                    <Brain className="h-3 w-3 text-primary" />
                    {getAiStatusIcon()}
                    <span className="font-medium">{getAiStatusText()}</span>
                </div>

                {/* Activity indicator */}
                <div className="flex items-center gap-1.5 text-foreground">
                    <Activity className="h-3 w-3 text-blue-500" />
                    <span className="font-medium">Active</span>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-6 relative z-10">
                {/* Papers Count */}
                <div className="flex items-center gap-1.5 text-foreground">
                    <FileText className="h-3 w-3 text-blue-500" />
                    <span className="font-medium">{papersCount} papers</span>
                </div>

                {/* Projects Count */}
                <div className="flex items-center gap-1.5 text-foreground">
                    <Database className="h-3 w-3 text-purple-500" />
                    <span className="font-medium">{projectsCount} projects</span>
                </div>

                {/* Current Time */}
                <div className="flex items-center gap-1.5 text-foreground">
                    <Clock className="h-3 w-3 text-green-500" />
                    <span className="font-medium">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {/* Version */}
                <div className="text-foreground/70 font-medium">
                    ScholarAI v1.0.0
                </div>
            </div>
        </div>
    )
} 