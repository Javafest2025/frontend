"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
    initialMinutes?: number
    onExpire?: () => void
    className?: string
    showResendButton?: boolean
    onResend?: () => void
    isResending?: boolean
}

export function CountdownTimer({
    initialMinutes = 10,
    onExpire,
    className,
    showResendButton = true,
    onResend,
    isResending = false
}: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60) // Convert to seconds
    const [isExpired, setIsExpired] = useState(false)

    useEffect(() => {
        if (timeLeft <= 0) {
            setIsExpired(true)
            onExpire?.()
            return
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft, onExpire])

    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60

    const formatTime = (value: number) => value.toString().padStart(2, '0')

    const progress = ((initialMinutes * 60 - timeLeft) / (initialMinutes * 60)) * 100

    return (
        <div className={cn("flex flex-col items-center space-y-3", className)}>
            <div className="relative">
                {/* Circular progress indicator */}
                <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                        {/* Background circle */}
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-primary/20"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            className={cn(
                                "text-primary transition-all duration-1000 ease-linear",
                                isExpired ? "text-red-500" : "text-primary"
                            )}
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                        />
                    </svg>
                    {/* Time display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className={cn(
                            "text-sm font-bold",
                            isExpired ? "text-red-500" : "text-primary"
                        )}>
                            {formatTime(minutes)}:{formatTime(seconds)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status text */}
            <div className="text-center">
                <p className={cn(
                    "text-sm font-medium",
                    isExpired ? "text-red-500" : "text-foreground/70"
                )}>
                    {isExpired ? "Code expired" : "Time remaining"}
                </p>
            </div>

            {/* Resend button */}
            {showResendButton && onResend && (
                <button
                    onClick={onResend}
                    disabled={!isExpired || isResending}
                    className={cn(
                        "text-sm font-medium transition-all duration-300",
                        isExpired
                            ? "text-primary hover:text-primary/80 cursor-pointer underline decoration-primary/50 hover:decoration-primary underline-offset-2"
                            : "text-foreground/50 cursor-not-allowed",
                        isResending && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {isResending ? "Sending..." : "Resend Code"}
                </button>
            )}
        </div>
    )
}
