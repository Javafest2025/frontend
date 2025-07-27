"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils/cn"
import { useTooltip } from "@/contexts/TooltipContext"
import { useSettings } from "@/contexts/SettingsContext"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

// Custom portal component to ensure tooltips render outside overflow constraints
const TooltipPortal = ({ children }: { children: React.ReactNode }) => {
    return (
        <TooltipPrimitive.Portal container={document.body}>
            {children}
        </TooltipPrimitive.Portal>
    )
}

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
    const { tooltipsEnabled } = useTooltip()
    const { settings } = useSettings()

    // Don't render tooltip content if tooltips are disabled
    if (!tooltipsEnabled) {
        return null
    }

    return (
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                "z-[9999] overflow-hidden rounded-xl border border-primary/30 bg-background/95 px-4 py-3 text-sm text-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                // Enhanced styling based on theme and glow effects
                settings.enableGlowEffects && "shadow-primary/40 ring-1 ring-primary/20",
                settings.colorScheme === 'blue' && "border-blue-500/40 shadow-blue-500/40 ring-blue-500/20",
                settings.colorScheme === 'purple' && "border-purple-500/40 shadow-purple-500/40 ring-purple-500/20",
                settings.colorScheme === 'green' && "border-green-500/40 shadow-green-500/40 ring-green-500/20",
                settings.colorScheme === 'orange' && "border-orange-500/40 shadow-orange-500/40 ring-orange-500/20",
                settings.colorScheme === 'pink' && "border-pink-500/40 shadow-pink-500/40 ring-pink-500/20",
                className
            )}
            {...props}
        />
    )
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Enhanced Tooltip Component that automatically handles the tooltip toggle
interface EnhancedTooltipProps {
    children: React.ReactNode
    content: string
    side?: "top" | "right" | "bottom" | "left"
    align?: "start" | "center" | "end"
    className?: string
    delayDuration?: number
}

export function EnhancedTooltip({
    children,
    content,
    side = "top",
    align = "center",
    className,
    delayDuration = 500
}: EnhancedTooltipProps) {
    const { tooltipsEnabled } = useTooltip()

    // If tooltips are disabled, just render the children
    if (!tooltipsEnabled) {
        return <>{children}</>
    }

    return (
        <TooltipProvider delayDuration={delayDuration}>
            <Tooltip>
                <TooltipTrigger asChild className={className}>
                    {children}
                </TooltipTrigger>
                <TooltipPortal>
                    <TooltipContent
                        side={side}
                        align={align}
                        sideOffset={8}
                    >
                        {content}
                    </TooltipContent>
                </TooltipPortal>
            </Tooltip>
        </TooltipProvider>
    )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipPortal } 