"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    FileText,
    Users,
    Calendar,
    Quote,
    ExternalLink,
    Download,
    Eye,
    BookOpen,
    Zap,
    Clock,
    RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Paper } from "@/types/websearch"
import { useState, useEffect } from "react"

interface StreamingPaperCardProps {
    paper?: Paper
    index: number
    onSelect?: (paper: Paper) => void
    onViewPdf?: (paper: Paper) => void
    onToggleFavorite?: (paper: Paper) => void
    isFavorited?: boolean
    isLoading?: boolean
    streamDelay?: number
    isHighlighted?: boolean
    onHighlightClick?: () => void
}

export function StreamingPaperCard({
    paper,
    index,
    onSelect,
    onViewPdf,
    onToggleFavorite,
    isFavorited = false,
    isLoading = false,
    streamDelay = 0,
    isHighlighted = false,
    onHighlightClick
}: StreamingPaperCardProps) {
    console.log('📄 StreamingPaperCard rendered for paper:', paper?.id, 'isHighlighted:', isHighlighted)
    const [isVisible, setIsVisible] = useState(false)
    const [isContentLoaded, setIsContentLoaded] = useState(false)
    const [isMetadataLoaded, setIsMetadataLoaded] = useState(false)

    // Enhanced streaming effect with more realistic delays
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true)

            // More realistic content loading phases
            setTimeout(() => setIsContentLoaded(true), 100 + (index * 10))
            setTimeout(() => setIsMetadataLoaded(true), 200 + (index * 10))
        }, streamDelay)

        return () => clearTimeout(timer)
    }, [index, streamDelay])

    const formatDate = (dateString: string): string => {
        try {
            if (!dateString) return "Unknown"
            const date = new Date(dateString)
            return date.getFullYear().toString()
        } catch {
            return "Unknown"
        }
    }

    const getSourceDisplay = (paper: Paper): string => {
        if (paper.source) return paper.source
        if (paper.venueName) return paper.venueName
        if (paper.publisher) return paper.publisher
        return "Unknown Source"
    }

    const handleCardClick = () => {
        if (paper && onSelect && !isLoading) {
            onSelect(paper)
        }
    }

    const handleViewPdf = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (paper && onViewPdf && !isLoading) {
            onViewPdf(paper)
        }
    }

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (paper && onToggleFavorite && !isLoading) {
            onToggleFavorite(paper)
        }
    }

    // Loading skeleton card
    if (isLoading || !isVisible) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{
                    opacity: isVisible ? 0.8 : 0,
                    y: isVisible ? 0 : 30,
                    scale: isVisible ? 1 : 0.9
                }}
                transition={{
                    duration: 0.4,
                    delay: index * 0.02,
                    ease: "easeOut"
                }}
                whileHover={{ scale: 1.02 }}
                className="group"
            >
                <Card className="bg-background/20 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 cursor-pointer relative overflow-hidden shadow-lg shadow-primary/5 hover:shadow-primary/10">
                    <CardContent className="p-4 relative z-10">
                        <div className="space-y-3">
                            {/* Loading title with stagger */}
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isVisible ? 1 : 0 }}
                                transition={{ delay: index * 0.02 }}
                            >
                                <Skeleton className="h-4 w-full bg-primary/15" />
                                <Skeleton className="h-4 w-3/4 bg-primary/15" style={{ animationDelay: "0.2s" }} />
                            </motion.div>

                            {/* Loading authors with stagger */}
                            <motion.div
                                className="flex items-center gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isVisible ? 1 : 0 }}
                                transition={{ delay: index * 0.02 + 0.1 }}
                            >
                                <Skeleton className="h-3 w-16 bg-primary/15" style={{ animationDelay: "0.4s" }} />
                                <Skeleton className="h-3 w-20 bg-primary/15" style={{ animationDelay: "0.6s" }} />
                            </motion.div>

                            {/* Loading metadata with stagger */}
                            <motion.div
                                className="flex items-center justify-between"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isVisible ? 1 : 0 }}
                                transition={{ delay: index * 0.02 + 0.2 }}
                            >
                                <Skeleton className="h-6 w-12 rounded-full bg-primary/15" style={{ animationDelay: "0.8s" }} />
                                <div className="flex gap-1">
                                    <Skeleton className="h-8 w-8 rounded bg-primary/15" style={{ animationDelay: "1s" }} />
                                    <Skeleton className="h-8 w-8 rounded bg-primary/15" style={{ animationDelay: "1.2s" }} />
                                </div>
                            </motion.div>
                        </div>

                        {/* Enhanced Loading indicator */}
                        <div className="absolute top-2 right-2">
                            <motion.div
                                animate={{
                                    rotate: 360,
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 1.5, repeat: Infinity }
                                }}
                                className="w-4 h-4 text-blue-500/70"
                            >
                                <RefreshCw className="w-full h-full" />
                            </motion.div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        )
    }

    if (!paper) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="group"
        >
            <Card
                className={cn(
                    "bg-background/40 backdrop-blur-xl border-2 transition-all duration-500 cursor-pointer hover:shadow-lg relative overflow-hidden group h-48",
                    isHighlighted
                        ? "border-amber-400/80 bg-gradient-to-br from-amber-50/20 to-yellow-50/20 shadow-amber-400/30"
                        : "border-primary/20 hover:border-primary/40 hover:shadow-primary/10",
                    !isContentLoaded && "opacity-60",
                    isContentLoaded && "opacity-100"
                )}
                style={{
                    boxShadow: isHighlighted
                        ? '0 0 40px hsl(45 93% 47% / 0.4), 0 0 80px hsl(45 93% 47% / 0.2), inset 0 0 20px hsl(45 93% 47% / 0.1)'
                        : undefined
                }}
                onClick={() => {
                    if (isHighlighted && onHighlightClick) {
                        onHighlightClick()
                    }
                    handleCardClick()
                }}
            >
                {/* Elegant animated border for highlighted cards */}
                {isHighlighted && (
                    <motion.div
                        className="absolute inset-0 rounded-lg"
                        style={{
                            background: 'linear-gradient(45deg, transparent, hsl(45 93% 47% / 0.3), transparent, hsl(45 93% 47% / 0.3), transparent)',
                            backgroundSize: '200% 200%',
                        }}
                        animate={{
                            backgroundPosition: ['0% 0%', '200% 200%']
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'linear'
                        }}
                    />
                )}

                {/* Subtle inner glow for highlighted cards */}
                {isHighlighted && (
                    <motion.div
                        className="absolute inset-1 rounded-lg bg-gradient-to-br from-amber-400/5 to-yellow-400/5"
                        animate={{
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                )}


                {/* Shimmer effect - only on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                <CardContent className="p-4 relative z-10 h-full flex flex-col">
                    <div className="space-y-3 flex-1">
                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isContentLoaded ? 1 : 0.3 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h3 className="font-semibold text-sm leading-tight text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                                {paper.title}
                            </h3>
                        </motion.div>

                        {/* Authors */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isContentLoaded ? 1 : 0.3 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                            <Users className="h-3 w-3 text-blue-500" />
                            <span className="truncate">
                                {paper.authors.slice(0, 3).map(author => author.name).join(", ")}
                                {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                            </span>
                        </motion.div>

                        {/* Source and Date */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isMetadataLoaded ? 1 : 0.3 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                            <BookOpen className="h-3 w-3 text-orange-500" />
                            <span className="truncate">{getSourceDisplay(paper)}</span>
                            <Calendar className="h-3 w-3 ml-1 text-green-500" />
                            <span>{formatDate(paper.publicationDate)}</span>
                        </motion.div>

                        {/* Badges and Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: isMetadataLoaded ? 1 : 0, y: isMetadataLoaded ? 0 : 10 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex items-center justify-between mt-auto"
                        >
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {paper.source === "Uploaded" ? (
                                    <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20 whitespace-nowrap">
                                        Uploaded
                                    </Badge>
                                ) : paper.isOpenAccess ? (
                                    <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20 whitespace-nowrap">
                                        Open Access
                                    </Badge>
                                ) : null}
                                <Badge variant="outline" className="text-xs border-primary/20 whitespace-nowrap">
                                    {paper.citationCount || 0} citations
                                </Badge>
                            </div>

                            <TooltipProvider>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={handleCardClick}
                                                className="h-8 w-8 p-0 hover:bg-primary/10 border border-primary/10 group/button"
                                            >
                                                <Eye className="h-3 w-3 text-cyan-500 transition-transform duration-200 group-hover/button:scale-110" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>View paper details</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    {(paper.pdfUrl || paper.pdfContentUrl) && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleViewPdf}
                                                    className="h-8 w-8 p-0 hover:bg-primary/10 border border-primary/10 group/button"
                                                >
                                                    <FileText className="h-3 w-3 text-emerald-500 transition-transform duration-200 group-hover/button:scale-110" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>View PDF</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            </TooltipProvider>
                        </motion.div>

                        {/* Loading indicator for metadata */}
                        <AnimatePresence>
                            {!isMetadataLoaded && (
                                <motion.div
                                    initial={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute bottom-2 right-2"
                                >
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            className="w-3 h-3"
                                        >
                                            <Zap className="w-full h-full" />
                                        </motion.div>
                                        <span>Loading...</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
} 