import { cn } from "@/lib/utils"

interface ShimmerProps {
    className?: string
    children?: React.ReactNode
}

export function Shimmer({ className, children }: ShimmerProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden animate-pulse bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 bg-[length:200%_100%] backdrop-blur-sm",
                className
            )}
        >
            {/* Glassy shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
            {children}
        </div>
    )
}

export function ShimmerText({
    className,
    lines = 1,
    width = "w-full"
}: {
    className?: string
    lines?: number
    width?: string
}) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Shimmer
                    key={i}
                    className={cn(
                        "h-4 rounded",
                        width,
                        i === lines - 1 && "w-3/4" // Last line is shorter
                    )}
                />
            ))}
        </div>
    )
}

export function ShimmerCard({ className }: { className?: string }) {
    return (
        <div className={cn("relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6", className)}>
            {/* Glassy background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
            <div className="relative space-y-4">
                <Shimmer className="h-6 w-3/4 rounded" />
                <ShimmerText lines={3} />
                <div className="flex gap-2">
                    <Shimmer className="h-6 w-16 rounded-full" />
                    <Shimmer className="h-6 w-20 rounded-full" />
                    <Shimmer className="h-6 w-14 rounded-full" />
                </div>
            </div>
        </div>
    )
}

export function ShimmerBadge({ className }: { className?: string }) {
    return <Shimmer className={cn("h-6 w-20 rounded-full", className)} />
}

export function ShimmerList({
    items = 3,
    className
}: {
    items?: number
    className?: string
}) {
    return (
        <div className={cn("space-y-3", className)}>
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                    <Shimmer className="h-2 w-2 rounded-full" />
                    <Shimmer className="h-4 flex-1 rounded" />
                </div>
            ))}
        </div>
    )
}
