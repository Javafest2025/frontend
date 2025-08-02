"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    X,
    FileText,
    Users,
    Calendar,
    Quote,
    ExternalLink,
    Download,
    Eye,
    BookOpen,
    Building,
    Hash,
    Zap,
    Share2,
    Bookmark,
    Clock,
    Globe,
    Award,
    TrendingUp,
    Mail,
    MapPin,
    ArrowUpRight,
    ChevronRight,
    Copy,
    CheckCircle2,
    Star,
    Link,
    Info,
    Loader2,
    AlertTriangle,
    Lightbulb,
    ListChecks,
    Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { downloadPdfWithAuth } from "@/lib/api/pdf"
import type { Paper } from "@/types/websearch"
import { useState } from "react"
import { useRouter } from "next/navigation"


interface PaperDetailModalProps {
    paper: Paper | null
    isOpen: boolean
    onClose: () => void
    onViewPdf?: (paper: Paper) => void
    projectId?: string
}

export function PaperDetailModal({ paper, isOpen, onClose, onViewPdf, projectId }: PaperDetailModalProps) {
    const router = useRouter()
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [isDownloading, setIsDownloading] = useState(false)


    if (!isOpen || !paper) return null

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } catch {
            return dateString || 'Date not available'
        }
    }

    const handlePdfDownload = async () => {
        if (!paper.pdfContentUrl || isDownloading) return

        setIsDownloading(true)
        try {
            console.log('🔽 Starting PDF download for:', paper.title)
            console.log('🔗 PDF URL:', paper.pdfContentUrl)

            await downloadPdfWithAuth(paper.pdfContentUrl, paper.title)
            console.log('✅ PDF download completed successfully')
        } catch (error) {
            console.error('❌ Error downloading PDF:', error)

            // Fallback: Try to open in new tab if download fails
            console.log('🔄 Attempting fallback download method...')
            try {
                const link = document.createElement('a')
                link.href = paper.pdfContentUrl
                link.download = `${paper.title}.pdf`
                link.target = '_blank'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            } catch (fallbackError) {
                console.error('❌ Fallback download also failed:', fallbackError)
                alert('Failed to download PDF. Please try again or check your connection.')
            }
        } finally {
            setIsDownloading(false)
        }
    }

    const getGradientFromTitle = (title: string) => {
        const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const gradients = [
            "from-blue-500 via-purple-500 to-pink-500",
            "from-green-400 via-blue-500 to-purple-600",
            "from-orange-400 via-red-500 to-pink-600",
            "from-cyan-400 via-blue-500 to-indigo-600",
            "from-purple-400 via-pink-500 to-red-500",
            "from-emerald-400 via-cyan-500 to-blue-600",
            "from-yellow-400 via-orange-500 to-red-600",
            "from-indigo-400 via-purple-500 to-pink-600"
        ]
        return gradients[hash % gradients.length]
    }

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            setTimeout(() => setCopiedField(null), 2000)
        } catch (error) {
            console.error('Failed to copy to clipboard:', error)
        }
    }

    const handleSummarize = () => {
        // Navigate to the dedicated summary page with paper data in URL params
        if (projectId && paper) {
            const searchParams = new URLSearchParams({
                title: paper.title,
                authors: paper.authors?.map(a => a.name).join(', ') || '',
                publicationDate: paper.publicationDate || '',
                citationCount: (paper.citationCount || 0).toString(),
                referenceCount: (paper.referenceCount || 0).toString(),
                influentialCitationCount: (paper.influentialCitationCount || 0).toString(),
                abstract: paper.abstractText || '',
                source: paper.source || '',
                venueName: paper.venueName || '',
                publisher: paper.publisher || '',
                doi: paper.doi || '',
                pdfUrl: paper.pdfContentUrl || paper.pdfUrl || '',
                isOpenAccess: (paper.isOpenAccess || false).toString()
            })
            router.push(`/interface/projects/${projectId}/library/${paper.id}/summary?${searchParams.toString()}`)
        }
    }

    const handleGapAnalysis = () => {
        // Navigate to the dedicated gap analysis page with paper data in URL params
        if (projectId && paper) {
            const searchParams = new URLSearchParams({
                title: paper.title,
                authors: paper.authors?.map(a => a.name).join(', ') || '',
                publicationDate: paper.publicationDate || '',
                citationCount: (paper.citationCount || 0).toString(),
                referenceCount: (paper.referenceCount || 0).toString(),
                influentialCitationCount: (paper.influentialCitationCount || 0).toString(),
                abstract: paper.abstractText || '',
                source: paper.source || '',
                venueName: paper.venueName || '',
                publisher: paper.publisher || '',
                doi: paper.doi || '',
                pdfUrl: paper.pdfContentUrl || paper.pdfUrl || '',
                isOpenAccess: (paper.isOpenAccess || false).toString()
            })
            router.push(`/interface/projects/${projectId}/library/${paper.id}/gap-analysis?${searchParams.toString()}`)
        }
    }

    const handleViewPdf = async (paper: Paper) => {
        // Continue with the original onViewPdf logic
        if (onViewPdf) onViewPdf(paper);
    }



    return (
        <div className="fixed inset-0 bg-background z-50 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-purple/5" />
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl"
            >
                <div className="container mx-auto px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl",
                                `bg-gradient-to-br ${getGradientFromTitle(paper.title)}`,
                                "ring-1 ring-white/20"
                            )}>
                                <FileText className="h-7 w-7" />
                            </div>
                            <div>
                                <h1 className="text-sm font-medium text-muted-foreground">Research Paper</h1>
                                <p className="text-xl font-bold">Paper Details</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-12 w-12 rounded-full hover:bg-muted/50 transition-all duration-200"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <ScrollArea className="h-[calc(100vh-100px)]">
                <div className="container mx-auto px-8 py-12 max-w-7xl">
                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center mb-16"
                    >
                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-12 leading-tight max-w-5xl mx-auto">
                            {paper.title}
                        </h1>

                        {/* Key Metrics - Symmetric Layout with Glowing Borders */}
                        <div className="grid grid-cols-4 gap-6 max-w-4xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/50 dark:from-blue-950/50 dark:to-blue-900/50 dark:border-blue-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:shadow-blue-500/20 shadow-blue-500/10 ring-1 ring-blue-500/20 hover:ring-blue-500/40">
                                    <CardContent className="p-8 text-center">
                                        <Quote className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                                            {paper.citationCount || 0}
                                        </div>
                                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Citations</div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200/50 dark:from-purple-950/50 dark:to-purple-900/50 dark:border-purple-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:shadow-purple-500/20 shadow-purple-500/10 ring-1 ring-purple-500/20 hover:ring-purple-500/40">
                                    <CardContent className="p-8 text-center">
                                        <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                                        <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                                            {paper.influentialCitationCount || 0}
                                        </div>
                                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Influential</div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200/50 dark:from-green-950/50 dark:to-green-900/50 dark:border-green-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:shadow-green-500/20 shadow-green-500/10 ring-1 ring-green-500/20 hover:ring-green-500/40">
                                    <CardContent className="p-8 text-center">
                                        <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-4" />
                                        <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
                                            {paper.referenceCount || 0}
                                        </div>
                                        <div className="text-sm font-medium text-green-600 dark:text-green-400">References</div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200/50 dark:from-orange-950/50 dark:to-orange-900/50 dark:border-orange-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:shadow-orange-500/20 shadow-orange-500/10 ring-1 ring-orange-500/20 hover:ring-orange-500/40">
                                    <CardContent className="p-8 text-center">
                                        <Users className="h-8 w-8 text-orange-600 mx-auto mb-4" />
                                        <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-2">
                                            {paper.authors?.length || 0}
                                        </div>
                                        <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Authors</div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Action Buttons - Centered */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex justify-center gap-4 mb-16"
                    >
                        {(paper.pdfUrl || paper.pdfContentUrl) && onViewPdf && (
                            <Button
                                onClick={() => handleViewPdf(paper)}
                                size="lg"
                                className="bg-gradient-to-r from-primary to-purple-600 text-white hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                            >
                                <Eye className="mr-3 h-5 w-5" />
                                View PDF
                            </Button>
                        )}

                        {/* Summarize Button */}
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600/90 hover:to-blue-700/90 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                            onClick={handleSummarize}
                        >
                            <Zap className="mr-3 h-5 w-5" />
                            View Summary
                        </Button>

                        {paper.pdfContentUrl && (
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handlePdfDownload}
                                disabled={isDownloading}
                                className="border-primary/20 hover:bg-primary/5 hover:border-primary/40 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isDownloading ? (
                                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                ) : (
                                    <Download className="mr-3 h-5 w-5" />
                                )}
                                {isDownloading ? 'Downloading...' : 'Download PDF'}
                            </Button>
                        )}

                        {paper.paperUrl && (
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => window.open(paper.paperUrl, '_blank')}
                                className="border-primary/20 hover:bg-primary/5 hover:border-primary/40 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                            >
                                <ExternalLink className="mr-3 h-5 w-5" />
                                Open Original
                            </Button>
                        )}

                        {/* Gap Analysis Button */}
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600/90 hover:to-red-700/90 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                            onClick={handleGapAnalysis}
                        >
                            <Target className="mr-3 h-5 w-5" />
                            Gap Analysis
                        </Button>
                    </motion.div>



                    {/* Three Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Abstract */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="lg:col-span-2"
                        >
                            <Card className="h-full border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:shadow-primary/10 ring-1 ring-primary/20 hover:ring-primary/40 bg-gradient-to-br from-background via-background to-primary/5">
                                <CardHeader className="pb-6">
                                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        Abstract
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    {paper.abstractText ? (
                                        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                                            {paper.abstractText}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <FileText className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                                            <p className="text-muted-foreground italic text-lg">
                                                Abstract not available for this paper
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Right Column - Structured Metadata */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                            className="space-y-6"
                        >
                            {/* Publication Information */}
                            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:shadow-blue-500/10 ring-1 ring-blue-500/20 hover:ring-blue-500/40 bg-gradient-to-br from-background via-background to-blue-50/20 dark:to-blue-950/20">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/40 flex items-center justify-center shadow-lg">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                        </div>
                                        Publication Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-5">
                                    <div className="space-y-4">
                                        <div className="flex flex-col space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Publication Date</div>
                                            <div className="text-sm font-medium text-foreground">
                                                {formatDate(paper.publicationDate)}
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Venue</div>
                                            <div className="text-sm font-medium text-foreground">
                                                {paper.venueName || <span className="text-muted-foreground/60 italic">Not specified</span>}
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Publisher</div>
                                            <div className="text-sm font-medium text-foreground">
                                                {paper.publisher || <span className="text-muted-foreground/60 italic">Not specified</span>}
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</div>
                                            <div className="text-sm font-medium text-foreground">
                                                {paper.source || <span className="text-muted-foreground/60 italic">Unknown</span>}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Bibliographic Details */}
                            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:shadow-purple-500/10 ring-1 ring-purple-500/20 hover:ring-purple-500/40 bg-gradient-to-br from-background via-background to-purple-50/20 dark:to-purple-950/20">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/40 flex items-center justify-center shadow-lg">
                                            <BookOpen className="h-4 w-4 text-purple-600" />
                                        </div>
                                        Bibliographic Info
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Volume</div>
                                            <div className="text-sm font-medium text-foreground">
                                                {paper.volume || <span className="text-muted-foreground/60 italic">N/A</span>}
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Issue</div>
                                            <div className="text-sm font-medium text-foreground">
                                                {paper.issue || <span className="text-muted-foreground/60 italic">N/A</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col space-y-1">
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pages</div>
                                        <div className="text-sm font-medium text-foreground">
                                            {paper.pages || <span className="text-muted-foreground/60 italic">Not specified</span>}
                                        </div>
                                    </div>

                                    {/* DOI Section */}
                                    {paper.doi && (
                                        <div className="pt-2 border-t border-border/20">
                                            <div className="flex flex-col space-y-2">
                                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Digital Object Identifier</div>
                                                <button
                                                    onClick={() => copyToClipboard(paper.doi!, 'doi')}
                                                    className="text-left font-mono text-sm text-foreground hover:text-primary transition-colors bg-muted/30 rounded-lg px-3 py-2 group/copy border border-border/30 hover:border-primary/40"
                                                >
                                                    <span className="break-all">{paper.doi}</span>
                                                    {copiedField === 'doi' ? (
                                                        <CheckCircle2 className="h-4 w-4 inline ml-2 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4 inline ml-2 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Citation Impact */}
                            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:shadow-amber-500/10 ring-1 ring-amber-500/20 hover:ring-amber-500/40 bg-gradient-to-br from-background via-background to-amber-50/20 dark:to-amber-950/20">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/40 flex items-center justify-center shadow-lg">
                                            <Award className="h-4 w-4 text-amber-600" />
                                        </div>
                                        Citation Impact
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-4">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30 shadow-sm">
                                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Total Citations</div>
                                            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                                {paper.citationCount || 0}
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/30 shadow-sm">
                                            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">Influential Citations</div>
                                            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                                {paper.influentialCitationCount || 0}
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-xl p-4 border border-green-200/50 dark:border-green-800/30 shadow-sm">
                                            <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">References</div>
                                            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                                {paper.referenceCount || 0}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Research Identifiers */}
                            {paper.semanticScholarId && (
                                <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:shadow-indigo-500/10 ring-1 ring-indigo-500/20 hover:ring-indigo-500/40 bg-gradient-to-br from-background via-background to-indigo-50/20 dark:to-indigo-950/20">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg font-bold flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-600/40 flex items-center justify-center shadow-lg">
                                                <Link className="h-4 w-4 text-indigo-600" />
                                            </div>
                                            Research Identifiers
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            <div className="flex flex-col space-y-2">
                                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Semantic Scholar ID</div>
                                                <button
                                                    onClick={() => copyToClipboard(paper.semanticScholarId!, 'semanticScholarId')}
                                                    className="text-left font-mono text-sm text-foreground hover:text-primary transition-colors bg-muted/30 rounded-lg px-3 py-2 group/copy border border-border/30 hover:border-primary/40"
                                                >
                                                    <span className="break-all">{paper.semanticScholarId}</span>
                                                    {copiedField === 'semanticScholarId' ? (
                                                        <CheckCircle2 className="h-4 w-4 inline ml-2 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4 inline ml-2 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    </div>

                    {/* Authors Section - Full Width */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="mt-12"
                    >
                        <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:shadow-green-500/10 ring-1 ring-green-500/20 hover:ring-green-500/40 bg-gradient-to-br from-background via-background to-green-50/10 dark:to-green-950/10">
                            <CardHeader className="pb-6">
                                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-primary" />
                                    </div>
                                    Authors ({paper.authors?.length || 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {paper.authors && paper.authors.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {paper.authors.map((author, index) => (
                                            <Card key={index} className="bg-gradient-to-br from-muted/20 to-muted/40 border-muted/50 hover:shadow-lg transition-all duration-300">
                                                <CardContent className="p-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center flex-shrink-0 shadow-lg">
                                                            <span className="text-sm font-bold text-primary">
                                                                {author.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AU'}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-foreground mb-2">
                                                                {author.name || 'Name not available'}
                                                            </p>
                                                            {author.affiliation && (
                                                                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                                                                    <Building className="h-3 w-3" />
                                                                    {author.affiliation}
                                                                </p>
                                                            )}
                                                            {author.orcid && (
                                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                                    <Hash className="h-3 w-3" />
                                                                    ORCID: {author.orcid}
                                                                </p>
                                                            )}
                                                            {!author.affiliation && !author.orcid && (
                                                                <p className="text-sm text-muted-foreground/70 italic">
                                                                    No additional information
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                                        <p className="text-muted-foreground italic text-lg">
                                            Author information not available
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Fields of Study - If Available */}
                    {paper.fieldsOfStudy && paper.fieldsOfStudy.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                            className="mt-8"
                        >
                            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:shadow-cyan-500/10 ring-1 ring-cyan-500/20 hover:ring-cyan-500/40 bg-gradient-to-br from-background via-background to-cyan-50/10 dark:to-cyan-950/10">
                                <CardHeader className="pb-6">
                                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                        </div>
                                        Fields of Study
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex flex-wrap gap-3 justify-center">
                                        {paper.fieldsOfStudy.map((field, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors px-4 py-2 text-sm"
                                            >
                                                {field}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}




                </div>
            </ScrollArea>
        </div>
    )
}