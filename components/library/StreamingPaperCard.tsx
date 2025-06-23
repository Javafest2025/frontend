"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    FileText,
    Users,
    Calendar,
    Quote,
    ExternalLink,
    Download,
    Eye,
    Star,
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
    isLoading?: boolean
    streamDelay?: number
}

export function StreamingPaperCard({
    paper,
    index,
    onSelect,
    onViewPdf,
    isLoading = false,
    streamDelay = 0
}: StreamingPaperCardProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isContentLoaded, setIsContentLoaded] = useState(false)
    const [isMetadataLoaded, setIsMetadataLoaded] = useState(false)

    // Enhanced streaming effect with more realistic delays
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true)

            // More realistic content loading phases
            setTimeout(() => setIsContentLoaded(true), 200 + (index * 30))
            setTimeout(() => setIsMetadataLoaded(true), 400 + (index * 30))
        }, streamDelay)

        return () => clearTimeout(timer)
    }, [index, streamDelay])

    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString)
            return date.getFullYear().toString()
        } catch {
            return "Unknown"
        }
    }

    const getVenueDisplay = (paper: Paper): string => {
        if (paper.venueName) return paper.venueName
        if (paper.publisher) return paper.publisher
        return "Unknown Venue"
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
                    duration: 0.6,
                    delay: index * 0.05,
                    ease: "easeOut"
                }}
                className="group"
            >
                <Card className="bg-background/20 backdrop-blur-xl border border-primary/10 hover:border-primary/30 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    {/* Enhanced Loading shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent animate-pulse duration-2000" />
                    <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    />

                    <CardContent className="p-4">
                        <div className="space-y-3">
                            {/* Loading title with stagger */}
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isVisible ? 1 : 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Skeleton className="h-4 w-full bg-primary/15 animate-pulse" />
                                <Skeleton className="h-4 w-3/4 bg-primary/15 animate-pulse" style={{ animationDelay: "0.2s" }} />
                            </motion.div>

                            {/* Loading authors with stagger */}
                            <motion.div
                                className="flex items-center gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isVisible ? 1 : 0 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                            >
                                <Skeleton className="h-3 w-16 bg-primary/15 animate-pulse" style={{ animationDelay: "0.4s" }} />
                                <Skeleton className="h-3 w-20 bg-primary/15 animate-pulse" style={{ animationDelay: "0.6s" }} />
                            </motion.div>

                            {/* Loading metadata with stagger */}
                            <motion.div
                                className="flex items-center justify-between"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isVisible ? 1 : 0 }}
                                transition={{ delay: index * 0.1 + 0.4 }}
                            >
                                <Skeleton className="h-6 w-12 rounded-full bg-primary/15 animate-pulse" style={{ animationDelay: "0.8s" }} />
                                <div className="flex gap-1">
                                    <Skeleton className="h-8 w-8 rounded bg-primary/15 animate-pulse" style={{ animationDelay: "1s" }} />
                                    <Skeleton className="h-8 w-8 rounded bg-primary/15 animate-pulse" style={{ animationDelay: "1.2s" }} />
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
            className="group"
        >
            <Card
                className={cn(
                    "bg-background/40 backdrop-blur-xl border border-primary/10 hover:border-primary/30 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden",
                    !isContentLoaded && "opacity-60",
                    isContentLoaded && "opacity-100"
                )}
                onClick={handleCardClick}
            >
                {/* Content loading shimmer */}
                <AnimatePresence>
                    {!isContentLoaded && (
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "200%" }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent z-10"
                        />
                    )}
                </AnimatePresence>

                <CardContent className="p-4">
                    <div className="space-y-3">
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
                            <Users className="h-3 w-3" />
                            <span className="truncate">
                                {paper.authors.slice(0, 3).map(author => author.name).join(", ")}
                                {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                            </span>
                        </motion.div>

                        {/* Venue and Date */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isMetadataLoaded ? 1 : 0.3 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                            <BookOpen className="h-3 w-3" />
                            <span className="truncate">{getVenueDisplay(paper)}</span>
                            <Calendar className="h-3 w-3 ml-1" />
                            <span>{formatDate(paper.publicationDate)}</span>
                        </motion.div>

                        {/* Badges and Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: isMetadataLoaded ? 1 : 0, y: isMetadataLoaded ? 0 : 10 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                {paper.isOpenAccess && (
                                    <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                        Open Access
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                    {paper.citationCount} citations
                                </Badge>
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCardClick}
                                    className="h-8 w-8 p-0 hover:bg-primary/10"
                                >
                                    <Eye className="h-3 w-3" />
                                </Button>
                                {(paper.pdfUrl || paper.pdfContentUrl) && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleViewPdf}
                                        className="h-8 w-8 p-0 hover:bg-primary/10"
                                    >
                                        <FileText className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
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