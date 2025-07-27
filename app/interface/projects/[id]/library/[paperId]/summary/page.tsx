"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft,
    FileText,
    Users,
    Star,
    BookOpen,
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    ListChecks,
    Link,
    Zap,
    Loader2,
    Clock,
    Building,
    Hash,
    Award,
    Quote,
    ExternalLink,
    Download,
    Eye,
    Bookmark,
    Share2
} from "lucide-react"
import { cn, isValidUUID } from "@/lib/utils"
import { extractPaper, getStructuredFacts, hasStructuredFacts } from "@/lib/api/extract"
import { downloadPdfWithAuth } from "@/lib/api/pdf"
import type { Paper } from "@/types/websearch"

interface PaperSummaryPageProps {
    params: Promise<{
        id: string
        paperId: string
    }>
}

export default function PaperSummaryPage({ params }: PaperSummaryPageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [projectId, setProjectId] = useState<string>("")
    const [paperId, setPaperId] = useState<string>("")
    const [paper, setPaper] = useState<Paper | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSummarizing, setIsSummarizing] = useState(false)
    const [summaryData, setSummaryData] = useState<any>(null)
    const [summaryError, setSummaryError] = useState<string | null>(null)
    const [countdown, setCountdown] = useState<number>(0)
    const [isDownloading, setIsDownloading] = useState(false)

    // Load paper data and summary on mount
    useEffect(() => {
        const loadData = async () => {
            const resolvedParams = await params

            // Validate project ID format
            const projectId = resolvedParams.id

            if (!isValidUUID(projectId)) {
                console.error('Invalid project ID format:', projectId)
                setSummaryError('Invalid project ID format')
                setIsLoading(false)
                return
            }

            setProjectId(projectId)
            setPaperId(resolvedParams.paperId)

            try {
                // Load paper data from URL search parameters
                const paperData: Paper = {
                    id: resolvedParams.paperId,
                    title: searchParams.get('title') || 'Unknown Title',
                    authors: searchParams.get('authors') ? searchParams.get('authors')!.split(', ').map(name => ({ name })) : [],
                    publicationDate: searchParams.get('publicationDate') || '',
                    citationCount: parseInt(searchParams.get('citationCount') || '0'),
                    referenceCount: parseInt(searchParams.get('referenceCount') || '0'),
                    influentialCitationCount: parseInt(searchParams.get('influentialCitationCount') || '0'),
                    abstractText: searchParams.get('abstract') || '',
                    source: searchParams.get('source') || '',
                    venueName: searchParams.get('venueName') || '',
                    publisher: searchParams.get('publisher') || '',
                    doi: searchParams.get('doi') || null,
                    pdfContentUrl: searchParams.get('pdfUrl') || null,
                    pdfUrl: searchParams.get('pdfUrl') || null,
                    isOpenAccess: searchParams.get('isOpenAccess') === 'true',
                    paperUrl: null,
                    semanticScholarId: null,
                    externalIds: {},
                    fieldsOfStudy: [],
                    publicationTypes: []
                }
                setPaper(paperData)
                setIsLoading(false)
            } catch (error) {
                console.error('Error loading paper data:', error)
                setIsLoading(false)
            }
        }
        loadData()
    }, [params, searchParams])

    const handleSummarize = async () => {
        // Validate project ID before making API calls
        if (!isValidUUID(projectId)) {
            console.error('Invalid project ID in handleSummarize:', projectId)
            setSummaryError('Invalid project ID format')
            return
        }

        setIsSummarizing(true)
        setSummaryError(null)
        setSummaryData(null)

        try {
            // First check if structured data already exists
            const hasData = await hasStructuredFacts(paperId)

            if (hasData.hasStructuredFacts) {
                // Data already exists, fetch directly without timer
                const facts = await getStructuredFacts(paperId)
                setSummaryData(facts)
            } else {
                // No data exists, start the extraction process with timer
                setCountdown(60)

                // Start the extraction process
                await extractPaper(paperId)

                // Start countdown timer
                const countdownInterval = setInterval(() => {
                    setCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(countdownInterval)
                            return 0
                        }
                        return prev - 1
                    })
                }, 1000)

                // Wait for 60 seconds
                await new Promise(resolve => setTimeout(resolve, 60000))

                // Clear the interval in case it's still running
                clearInterval(countdownInterval)
                setCountdown(0)

                // Now fetch the structured facts
                const facts = await getStructuredFacts(paperId)
                setSummaryData(facts)
            }
        } catch (err: any) {
            setSummaryError(err.message || 'Failed to summarize')
        } finally {
            setIsSummarizing(false)
            setCountdown(0)
        }
    }

    const handlePdfDownload = async () => {
        if (!paper?.pdfContentUrl || isDownloading) return

        setIsDownloading(true)
        try {
            await downloadPdfWithAuth(paper.pdfContentUrl, paper.title)
        } catch (error) {
            console.error('Error downloading PDF:', error)
            alert('Failed to download PDF. Please try again.')
        } finally {
            setIsDownloading(false)
        }
    }

    const handleBack = () => {
        router.push(`/interface/projects/${projectId}/library`)
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading paper summary...</p>
                </div>
            </div>
        )
    }

    const facts = summaryData?.structuredFacts?.facts || {}

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-10 flex-shrink-0"
            >
                <div className="container mx-auto px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBack}
                                className="h-12 w-12 rounded-full hover:bg-muted/50 transition-all duration-200"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <h1 className="text-sm font-medium text-muted-foreground">Paper Summary</h1>
                                <p className="text-xl font-bold">Structured Analysis</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            {paper?.pdfContentUrl && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePdfDownload}
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                                </Button>
                            )}

                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600/90 hover:to-blue-700/90"
                                onClick={handleSummarize}
                                disabled={isSummarizing}
                            >
                                <Zap className="mr-2 h-4 w-4" />
                                {isSummarizing ? (
                                    countdown > 0 ? (
                                        <span className="flex items-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing... {countdown}s
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Fetching...
                                        </span>
                                    )
                                ) : (
                                    'Generate Summary'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-8 py-12 max-w-7xl">
                    {/* Paper Title */}
                    {paper && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-center mb-12"
                        >
                            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight max-w-5xl mx-auto">
                                {paper.title}
                            </h1>

                            {/* Paper Info Cards */}
                            <div className="grid grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
                                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/50 dark:from-blue-950/50 dark:to-blue-900/50 dark:border-blue-800/50">
                                    <CardContent className="p-6 text-center">
                                        <Quote className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                                            {paper.citationCount || 0}
                                        </div>
                                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Citations</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200/50 dark:from-purple-950/50 dark:to-purple-900/50 dark:border-purple-800/50">
                                    <CardContent className="p-6 text-center">
                                        <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                                            {paper.influentialCitationCount || 0}
                                        </div>
                                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Influential</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200/50 dark:from-green-950/50 dark:to-green-900/50 dark:border-green-800/50">
                                    <CardContent className="p-6 text-center">
                                        <BookOpen className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
                                            {paper.referenceCount || 0}
                                        </div>
                                        <div className="text-sm font-medium text-green-600 dark:text-green-400">References</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200/50 dark:from-orange-950/50 dark:to-orange-900/50 dark:border-orange-800/50">
                                    <CardContent className="p-6 text-center">
                                        <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-1">
                                            {paper.authors?.length || 0}
                                        </div>
                                        <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Authors</div>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {/* Countdown Timer Indicator */}
                    {isSummarizing && countdown > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center mb-8"
                        >
                            <div className="bg-gradient-to-r from-green-500/10 to-blue-600/10 border border-green-500/20 rounded-lg px-6 py-3 flex items-center gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                    Processing paper... {countdown} seconds remaining
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* Summary Content */}
                    {summaryData ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:shadow-green-500/10 ring-1 ring-green-500/20 hover:ring-green-500/40 bg-gradient-to-br from-background via-background to-green-50/10 dark:to-green-950/10">
                                <CardHeader className="pb-6">
                                    <CardTitle className="text-3xl font-bold flex items-center gap-3">
                                        <Zap className="h-8 w-8 text-green-500" />
                                        Structured Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Authors */}
                                        <section className="col-span-1 md:col-span-2">
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                                                <Users className="h-5 w-5 text-orange-500" />
                                                Authors
                                            </h3>
                                            <ul className="ml-4 list-disc text-base space-y-2">
                                                {(facts.authors || []).map((a: any, i: number) => (
                                                    <li key={i}>
                                                        <span className="font-medium">{a.name}</span>
                                                        {a.affiliation && ` (${a.affiliation})`}
                                                        {a.email && ` - ${a.email}`}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>

                                        {/* Abstract */}
                                        <section>
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                                                <FileText className="h-5 w-5 text-primary" />
                                                Abstract
                                            </h3>
                                            <div className="bg-muted/40 rounded-lg p-4 text-base whitespace-pre-line">
                                                {facts.abstract}
                                            </div>
                                        </section>

                                        {/* Keywords */}
                                        <section>
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                                                <Star className="h-5 w-5 text-yellow-500" />
                                                Keywords
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(facts.keywords || []).map((k: string, i: number) => (
                                                    <Badge
                                                        key={i}
                                                        variant="secondary"
                                                        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-3 py-1 rounded-full text-sm"
                                                    >
                                                        {k}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </section>

                                        {/* Methodology */}
                                        <section className="md:col-span-2">
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                                                <BookOpen className="h-5 w-5 text-blue-500" />
                                                Methodology
                                            </h3>
                                            {facts.methodology && (
                                                <div className="space-y-3 bg-muted/20 rounded-lg p-4">
                                                    {facts.methodology.approach && (
                                                        <div>
                                                            <span className="font-semibold">Approach:</span> {facts.methodology.approach}
                                                        </div>
                                                    )}
                                                    {facts.methodology.datasets && (
                                                        <div>
                                                            <span className="font-semibold">Datasets:</span> {facts.methodology.datasets.join(", ")}
                                                        </div>
                                                    )}
                                                    {facts.methodology.experimental_setup && (
                                                        <div>
                                                            <span className="font-semibold">Experimental Setup:</span> {facts.methodology.experimental_setup}
                                                        </div>
                                                    )}
                                                    {facts.methodology.tools_technologies && (
                                                        <div>
                                                            <span className="font-semibold">Tools/Technologies:</span> {facts.methodology.tools_technologies.join(", ")}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </section>

                                        {/* Key Findings */}
                                        <section className="md:col-span-2">
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                                                <Lightbulb className="h-5 w-5 text-green-500" />
                                                Key Findings
                                            </h3>
                                            <ul className="ml-4 list-disc space-y-2">
                                                {(facts.key_findings || []).map((f: string, i: number) => (
                                                    <li key={i} className="text-base">{f}</li>
                                                ))}
                                            </ul>
                                        </section>

                                        {/* Main Contributions */}
                                        <section className="md:col-span-2">
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                                                <TrendingUp className="h-5 w-5 text-purple-500" />
                                                Main Contributions
                                            </h3>
                                            <ul className="ml-4 list-disc space-y-2">
                                                {(facts.main_contributions || []).map((c: string, i: number) => (
                                                    <li key={i} className="text-base">{c}</li>
                                                ))}
                                            </ul>
                                        </section>

                                        {/* Limitations */}
                                        <section>
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                                Limitations
                                            </h3>
                                            <ul className="ml-4 list-disc space-y-2">
                                                {(facts.limitations || []).map((l: string, i: number) => (
                                                    <li key={i} className="text-base">{l}</li>
                                                ))}
                                            </ul>
                                        </section>

                                        {/* Future Work */}
                                        <section>
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                                                <ListChecks className="h-5 w-5 text-cyan-500" />
                                                Future Work
                                            </h3>
                                            <div className="bg-muted/40 rounded-lg p-4 text-base whitespace-pre-line">
                                                {facts.future_work}
                                            </div>
                                        </section>

                                        {/* Technical Details */}
                                        <section className="md:col-span-2">
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                                                <BookOpen className="h-5 w-5 text-indigo-500" />
                                                Technical Details
                                            </h3>
                                            {facts.technical_details && (
                                                <div className="space-y-3 bg-muted/20 rounded-lg p-4">
                                                    {facts.technical_details.model_architecture && (
                                                        <div>
                                                            <span className="font-semibold">Model Architecture:</span> {facts.technical_details.model_architecture}
                                                        </div>
                                                    )}
                                                    {facts.technical_details.implementation_details && (
                                                        <div>
                                                            <span className="font-semibold">Implementation:</span> {facts.technical_details.implementation_details}
                                                        </div>
                                                    )}
                                                    {facts.technical_details.computational_complexity && (
                                                        <div>
                                                            <span className="font-semibold">Computational Complexity:</span> {facts.technical_details.computational_complexity}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </section>

                                        {/* Results & Performance */}
                                        <section className="md:col-span-2">
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                                                <Star className="h-5 w-5 text-yellow-500" />
                                                Results & Performance
                                            </h3>
                                            {facts.results_performance && (
                                                <div className="space-y-3 bg-muted/20 rounded-lg p-4">
                                                    {facts.results_performance.baseline_comparison && (
                                                        <div>
                                                            <span className="font-semibold">Baseline Comparison:</span> {facts.results_performance.baseline_comparison}
                                                        </div>
                                                    )}
                                                    {facts.results_performance.significance && (
                                                        <div>
                                                            <span className="font-semibold">Significance:</span> {facts.results_performance.significance}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </section>

                                        {/* Citations & References */}
                                        <section className="md:col-span-2">
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                                                <Link className="h-5 w-5 text-blue-400" />
                                                Citations & References
                                            </h3>
                                            {facts.citations_references && (
                                                <div className="space-y-3 bg-muted/20 rounded-lg p-4">
                                                    {facts.citations_references.key_citations && (
                                                        <div>
                                                            <span className="font-semibold">Key Citations:</span> {facts.citations_references.key_citations.join(", ")}
                                                        </div>
                                                    )}
                                                    {facts.citations_references.total_references && (
                                                        <div>
                                                            <span className="font-semibold">Total References:</span> {facts.citations_references.total_references}
                                                        </div>
                                                    )}
                                                    {facts.citations_references.related_work_summary && (
                                                        <div>
                                                            <span className="font-semibold">Related Work:</span> {facts.citations_references.related_work_summary}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </section>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : summaryError ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="border-none shadow-xl bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                                        <AlertTriangle className="h-5 w-5" />
                                        <p className="font-medium">Error generating summary: {summaryError}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center py-20"
                        >
                            <Zap className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-foreground mb-4">Generate Paper Summary</h2>
                            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                                Click the "Generate Summary" button above to create a structured analysis of this research paper.
                                The summary will include key findings, methodology, contributions, and more.
                            </p>
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600/90 hover:to-blue-700/90"
                                onClick={handleSummarize}
                                disabled={isSummarizing}
                            >
                                <Zap className="mr-2 h-5 w-5" />
                                {isSummarizing ? (
                                    countdown > 0 ? (
                                        <span className="flex items-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing... {countdown}s
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Fetching...
                                        </span>
                                    )
                                ) : (
                                    'Generate Summary'
                                )}
                            </Button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
} 