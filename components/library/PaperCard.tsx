"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    Building,
    MoreVertical
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Paper } from "@/types/websearch"
import { useState, useEffect } from "react"
import { generatePdfThumbnail, downloadPdfWithAuth } from "@/lib/api/pdf"

interface PaperCardProps {
    paper: Paper
    index: number
    onSelect: (paper: Paper) => void
    onViewPdf?: (paper: Paper) => void
}

export function PaperCard({ paper, index, onSelect, onViewPdf }: PaperCardProps) {
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
    const [thumbnailLoading, setThumbnailLoading] = useState(false)

    // Generate a gradient for the thumbnail based on paper title (fallback)
    const getGradientFromTitle = (title: string) => {
        const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const gradients = [
            "from-blue-500 to-cyan-500",
            "from-purple-500 to-pink-500",
            "from-green-500 to-emerald-500",
            "from-orange-500 to-red-500",
            "from-indigo-500 to-purple-500",
            "from-cyan-500 to-blue-500",
            "from-pink-500 to-rose-500",
            "from-emerald-500 to-teal-500"
        ]
        return gradients[hash % gradients.length]
    }

    // Load PDF thumbnail if available - prioritize actual PDF first page
    useEffect(() => {
        const loadThumbnail = async () => {
            // Priority order: pdfContentUrl (processed), then pdfUrl (original)
            const pdfUrl = paper.pdfContentUrl || paper.pdfUrl
            if (!pdfUrl) return

            setThumbnailLoading(true)
            try {
                // Generate first page snapshot of the PDF
                const thumbnail = await generatePdfThumbnail(pdfUrl)
                if (thumbnail) {
                    setThumbnailUrl(thumbnail)
                }
            } catch (error) {
                console.error('Failed to generate PDF first page thumbnail:', error)
                // Will fallback to clean paper icon design
            } finally {
                setThumbnailLoading(false)
            }
        }

        // Only attempt thumbnail generation if PDF is available
        if (paper.pdfUrl || paper.pdfContentUrl) {
            loadThumbnail()
        }
    }, [paper.pdfUrl, paper.pdfContentUrl])

    // Handle PDF download
    const handlePdfDownload = async (e: React.MouseEvent) => {
        e.stopPropagation()
        const pdfUrl = paper.pdfUrl || paper.pdfContentUrl
        if (!pdfUrl) return

        try {
            await downloadPdfWithAuth(pdfUrl, paper.title)
        } catch (error) {
            console.error('Download failed:', error)
            // You could add a toast notification here in the future
        }
    }

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).getFullYear()
        } catch {
            return dateString
        }
    }

    const getInitials = (title: string) => {
        return title
            .split(' ')
            .slice(0, 2)
            .map(word => word[0])
            .join('')
            .toUpperCase()
    }

    // Generate preview text from abstract or create mock content
    const getPreviewText = () => {
        if (paper.abstractText) {
            return paper.abstractText.slice(0, 300) + (paper.abstractText.length > 300 ? '...' : '')
        }
        // Generate mock paper content preview
        return `${paper.title}

Abstract: This research paper presents novel insights into the field of study related to ${paper.fieldsOfStudy?.[0] || 'research methodology'}. The work contributes to our understanding of fundamental concepts and provides empirical evidence for theoretical frameworks.

Introduction: Recent developments in this area have highlighted the need for comprehensive analysis of the underlying principles. This paper addresses these challenges by proposing new methodologies and evaluating their effectiveness through rigorous experimentation.

The methodology employed in this study combines quantitative and qualitative approaches to ensure robust results...`
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="group"
        >
            <Card
                className="bg-background/50 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg shadow-primary/5 hover:shadow-primary/10"
                style={{
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.05), inset 0 0 20px rgba(99, 102, 241, 0.02)'
                }}
                onClick={() => onSelect(paper)}
            >
                <CardContent className="p-0">
                    {/* Horizontal Layout */}
                    <div className="flex">
                        {/* Left Thumbnail Section - Clean PDF Preview */}
                        <div className="relative w-64 flex-shrink-0">
                            <div className="h-full min-h-[200px] relative overflow-hidden rounded-l-lg bg-muted/20">
                                {thumbnailUrl ? (
                                    /* Clean PDF First Page Snapshot */
                                    <img
                                        src={thumbnailUrl}
                                        alt={`${paper.title} first page`}
                                        className="w-full h-full object-cover object-top"
                                        onError={() => setThumbnailUrl(null)}
                                    />
                                ) : (
                                    /* Simple Fallback - Clean Paper Design */
                                    <div className={cn(
                                        "absolute inset-0 flex items-center justify-center",
                                        `bg-gradient-to-br ${getGradientFromTitle(paper.title)}`
                                    )}>
                                        {/* Paper Document Icon Style */}
                                        <div className="text-white text-center p-6">
                                            <FileText className="h-16 w-16 mx-auto mb-4 opacity-80" />
                                            <div className="text-sm font-medium line-clamp-3 leading-relaxed">
                                                {paper.title}
                                            </div>
                                            <div className="text-xs opacity-70 mt-3">
                                                {paper.source}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Loading overlay for thumbnail */}
                                {thumbnailLoading && (
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2"></div>
                                            <div className="text-xs text-muted-foreground">Loading preview...</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Content Section */}
                        <div className="flex-1 p-6 min-h-[200px] flex flex-col">
                            {/* Header with Title and Actions */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-tight">
                                        {paper.title}
                                    </h3>

                                    {/* Authors */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {paper.authors.slice(0, 4).map(a => a.name).join(", ")}
                                            {paper.authors.length > 4 && ` +${paper.authors.length - 4} more`}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 ml-4">
                                    {(paper.pdfUrl || paper.pdfContentUrl) && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handlePdfDownload}
                                            className="bg-background/40 border-primary/20 hover:bg-primary/5"
                                        >
                                            <Download className="h-4 w-4 mr-1" />
                                            Download
                                        </Button>
                                    )}
                                    {paper.paperUrl && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                window.open(paper.paperUrl, '_blank')
                                            }}
                                            className="bg-background/40 border-primary/20 hover:bg-primary/5"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            // TODO: Add to favorites
                                        }}
                                        className="h-8 w-8 p-0 hover:bg-primary/10"
                                    >
                                        <Star className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Metadata Row */}
                            <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(paper.publicationDate)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Quote className="h-4 w-4" />
                                    <span>{paper.citationCount} citations</span>
                                </div>
                                {paper.venueName && (
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        <span className="line-clamp-1">{paper.venueName}</span>
                                    </div>
                                )}
                                {paper.doi && (
                                    <Badge variant="outline" className="text-xs border-primary/20">
                                        DOI
                                    </Badge>
                                )}
                            </div>

                            {/* Abstract */}
                            {paper.abstractText && (
                                <div className="flex-1 mb-4">
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                        {paper.abstractText}
                                    </p>
                                </div>
                            )}

                            {/* Fields of Study Tags */}
                            {paper.fieldsOfStudy && paper.fieldsOfStudy.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-auto">
                                    {paper.fieldsOfStudy.slice(0, 4).map((field, idx) => (
                                        <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="text-xs px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                                        >
                                            {field}
                                        </Badge>
                                    ))}
                                    {paper.fieldsOfStudy.length > 4 && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs px-3 py-1 bg-muted/50 text-muted-foreground"
                                        >
                                            +{paper.fieldsOfStudy.length - 4} more
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
} 