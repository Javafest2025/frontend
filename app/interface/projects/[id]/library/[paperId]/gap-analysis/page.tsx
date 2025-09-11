"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    ArrowLeft,
    FileText,
    Users,
    Calendar,
    Download,
    Loader2,
    Target,
    AlertTriangle,
    CheckCircle,
    Clock,
    BarChart3,
    RefreshCw,
    Play,
    Eye,
    Info,
    Timer,
    History,
    Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { downloadPdfWithAuth } from "@/lib/api/pdf"
import { gapAnalysisApi, researchGapsApi, type GapAnalysisResponse, type ResearchGapResponse, GapStatus } from "@/lib/api/project-service/gap-analysis"
import type { Paper } from "@/types/websearch"

interface PaperGapAnalysisPageProps {
    params: Promise<{
        id: string
        paperId: string
    }>
}

export default function PaperGapAnalysisPage({ params }: PaperGapAnalysisPageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [projectId, setProjectId] = useState<string>("")
    const [paperId, setPaperId] = useState<string>("")
    const [paper, setPaper] = useState<Paper | null>(null)
    const [isDownloading, setIsDownloading] = useState(false)

    // Gap analysis states
    const [gapAnalyses, setGapAnalyses] = useState<GapAnalysisResponse[]>([])
    const [researchGaps, setResearchGaps] = useState<ResearchGapResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [pollingAnalyses, setPollingAnalyses] = useState<Set<string>>(new Set())
    const [analysisTimers, setAnalysisTimers] = useState<Record<string, number>>({})

    // Configuration dialog states
    const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
    const [configForm, setConfigForm] = useState({
        maxPapers: 6,
        validationThreshold: 1
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Load paper data on mount
    useEffect(() => {
        const loadData = async () => {
            const resolvedParams = await params
            const projectId = resolvedParams.id
            const paperId = resolvedParams.paperId

            setProjectId(projectId)
            setPaperId(paperId)

            // Extract paper data from URL params
            const paperData: Paper = {
                id: paperId,
                title: searchParams.get('title') || 'Unknown Paper',
                authors: searchParams.get('authors') ? searchParams.get('authors')!.split(', ').map(name => ({ name })) : [],
                publicationDate: searchParams.get('publicationDate') || '',
                citationCount: parseInt(searchParams.get('citationCount') || '0'),
                referenceCount: parseInt(searchParams.get('referenceCount') || '0'),
                influentialCitationCount: parseInt(searchParams.get('influentialCitationCount') || '0'),
                abstractText: searchParams.get('abstract') || '',
                source: searchParams.get('source') || '',
                venueName: searchParams.get('venueName') || '',
                publisher: searchParams.get('publisher') || '',
                doi: searchParams.get('doi') || '',
                pdfUrl: searchParams.get('pdfUrl') || '',
                pdfContentUrl: searchParams.get('pdfUrl') || '',
                isOpenAccess: searchParams.get('isOpenAccess') === 'true',
                externalIds: {}
            }

            setPaper(paperData)
            await loadGapAnalyses(paperId)
        }

        loadData()
    }, [params, searchParams])

    const loadGapAnalyses = async (currentPaperId: string) => {
        try {
            setIsLoading(true)
            const analyses = await gapAnalysisApi.getGapAnalysesByPaperId(currentPaperId)
            setGapAnalyses(analyses)

            // Load research gaps for completed analyses
            const completedAnalyses = analyses.filter(analysis => analysis.status === GapStatus.COMPLETED)
            if (completedAnalyses.length > 0) {
                const latestAnalysis = completedAnalyses[0] // Get the latest completed analysis
                const gaps = await researchGapsApi.getResearchGapsByGapAnalysisId(latestAnalysis.id)
                setResearchGaps(gaps)
            }

            // Start polling for running analyses
            const runningAnalysisIds = analyses
                .filter(analysis => analysis.status === GapStatus.RUNNING || analysis.status === GapStatus.PENDING)
                .map(analysis => analysis.id)

            setPollingAnalyses(new Set(runningAnalysisIds))

            // Initialize timers for running analyses
            const newTimers: Record<string, number> = {}
            analyses.forEach(analysis => {
                if (analysis.status === GapStatus.RUNNING) {
                    newTimers[analysis.id] = 0
                }
            })
            setAnalysisTimers(newTimers)
        } catch (error) {
            console.error('Error loading gap analyses:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const pollAnalysisStatus = async (analysisId: string) => {
        try {
            const updatedAnalysis = await gapAnalysisApi.getGapAnalysis(analysisId)

            setGapAnalyses(prev => prev.map(analysis =>
                analysis.id === analysisId ? updatedAnalysis : analysis
            ))

            // If analysis completed, load research gaps and stop polling
            if (updatedAnalysis.status === GapStatus.COMPLETED) {
                try {
                    const gaps = await researchGapsApi.getResearchGapsByGapAnalysisId(analysisId)
                    setResearchGaps(gaps)
                } catch (error) {
                    console.error('Error fetching research gaps:', error)
                }

                setPollingAnalyses(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(analysisId)
                    return newSet
                })
            }

            // If analysis failed, stop polling
            if (updatedAnalysis.status === GapStatus.FAILED) {
                setPollingAnalyses(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(analysisId)
                    return newSet
                })
            }
        } catch (error) {
            console.error('Error polling analysis status:', error)
        }
    }

    const handleSubmitGapAnalysis = async () => {
        if (!paperId || isSubmitting) return

        setIsSubmitting(true)
        try {
            const analysis = await gapAnalysisApi.initiateGapAnalysis({
                paperId: paperId,
                maxPapers: configForm.maxPapers,
                validationThreshold: configForm.validationThreshold
            })

            // Add new analysis to the list
            setGapAnalyses(prev => [analysis, ...prev])

            // Start polling for this analysis
            setPollingAnalyses(prev => new Set(Array.from(prev).concat(analysis.id)))

            // Initialize timer
            setAnalysisTimers(prev => ({ ...prev, [analysis.id]: 0 }))

            // Close dialog and reset form
            setIsConfigDialogOpen(false)
            setConfigForm({ maxPapers: 6, validationThreshold: 1 })
        } catch (error) {
            console.error('Error submitting gap analysis:', error)
        } finally {
            setIsSubmitting(false)
        }
    }


    const handlePdfDownload = async () => {
        if (!paper?.pdfContentUrl) return

        setIsDownloading(true)
        try {
            await downloadPdfWithAuth(paper.pdfContentUrl, paper.title)
        } catch (error) {
            console.error('Error downloading PDF:', error)
        } finally {
            setIsDownloading(false)
        }
    }


    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getStatusColor = (status: GapStatus) => {
        switch (status) {
            case GapStatus.COMPLETED: return 'bg-green-500/10 text-green-500 border-green-500/20'
            case GapStatus.RUNNING: return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case GapStatus.PENDING: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            case GapStatus.FAILED: return 'bg-red-500/10 text-red-500 border-red-500/20'
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }

    const getStatusIcon = (status: GapStatus) => {
        switch (status) {
            case GapStatus.COMPLETED: return <CheckCircle className="h-4 w-4 text-green-500" />
            case GapStatus.RUNNING: return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            case GapStatus.PENDING: return <Clock className="h-4 w-4 text-yellow-500" />
            case GapStatus.FAILED: return <AlertTriangle className="h-4 w-4 text-red-500" />
            default: return <Clock className="h-4 w-4 text-gray-500" />
        }
    }

    const navigateToGap = (gap: ResearchGapResponse) => {
        // Navigate to gap detail page with gap data
        const searchParams = new URLSearchParams({
            gapId: gap.gapId,
            gapTitle: gap.name || 'Untitled Gap',
            description: gap.description || '',
            validationEvidence: gap.initialEvidence || '',
            potentialImpact: gap.potentialImpact || '',
            suggestedApproaches: gap.implementationSuggestions || '',
            category: gap.category || '',
            confidenceScore: (gap.validationConfidence || 0).toString(),
            difficultyScore: gap.estimatedDifficulty || '',
            innovationPotential: '0',
            commercialViability: '0',
            fundingLikelihood: '0',
            timeToSolution: gap.estimatedTimeline || '',
            recommendedTeamSize: 'Unknown',
            estimatedResearcherYears: '0'
        })

        router.push(`/interface/projects/${projectId}/library/${paperId}/gap-analysis/${gap.id}?${searchParams.toString()}`)
    }

    // Polling effect
    useEffect(() => {
        const interval = setInterval(() => {
            Array.from(pollingAnalyses).forEach(analysisId => {
                pollAnalysisStatus(analysisId)
                setAnalysisTimers(prev => ({
                    ...prev,
                    [analysisId]: (prev[analysisId] || 0) + 1
                }))
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [Array.from(pollingAnalyses)])

    return (
        <div className="h-screen bg-background overflow-hidden flex flex-col">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
            <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Fixed Action Bar */}
            <div className="flex-shrink-0 z-50">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mx-4 mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background/80 backdrop-blur-xl border border-border/50 rounded-lg px-4 py-2 shadow-lg"
                >
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-12 w-12 rounded-full hover:bg-muted/50 transition-all duration-200 hover:scale-110 hover:shadow-md hover:bg-accent/20"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-sm font-medium text-muted-foreground">Gap Analysis</h1>
                            <p className="text-lg font-bold">Research Gaps</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => loadGapAnalyses(paperId)}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-8 px-3 bg-primary hover:bg-primary/90">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Find Gaps
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] border-2 border-primary/20">
                                <DialogHeader className="space-y-3 pb-4 border-b border-primary/10">
                                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                                        <Target className="h-5 w-5 text-primary" />
                                        Configure Gap Analysis
                                    </DialogTitle>
                                    <DialogDescription className="text-sm leading-relaxed">
                                        Configure parameters for the gap analysis of{" "}
                                        <span className="font-medium text-foreground">
                                            "{paper?.title}"
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="max_papers" className="text-sm font-medium">
                                                Max Papers
                                            </Label>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                            <Info className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs">
                                                        <p className="text-sm">The number of papers retrieved per gap analysis iteration</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            id="max_papers"
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={configForm.maxPapers}
                                            onChange={(e) => setConfigForm(prev => ({ ...prev, maxPapers: parseInt(e.target.value) || 6 }))}
                                            className="h-10"
                                            placeholder="Enter number of papers (1-20)"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Default: 6 papers per iteration
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="validation_threshold" className="text-sm font-medium">
                                                Validation Threshold
                                            </Label>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                            <Info className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs">
                                                        <p className="text-sm">How many times the gap agent validates each potential gap</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            id="validation_threshold"
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={configForm.validationThreshold}
                                            onChange={(e) => setConfigForm(prev => ({ ...prev, validationThreshold: parseInt(e.target.value) || 1 }))}
                                            className="h-10"
                                            placeholder="Enter validation count (1-5)"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Default: 1 validation per gap
                                        </p>
                                    </div>
                                </div>

                                <DialogFooter className="pt-4 border-t border-primary/10 space-x-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsConfigDialogOpen(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmitGapAnalysis}
                                        disabled={isSubmitting || !paper?.pdfContentUrl}
                                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="mr-2 h-4 w-4" />
                                                Start Analysis
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </motion.div>
            </div>

            {/* Main Content */}
            <div className="flex-1 container mx-auto px-6 py-4 relative z-10 overflow-hidden flex flex-col">
                {/* Paper Info Card */}
                {paper && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="flex-shrink-0 mb-4"
                    >
                        <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h2 className="text-xl font-semibold mb-2">{paper.title}</h2>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {paper.authors?.map(a => a.name).join(', ')}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {paper.publicationDate}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                {paper.venueName}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                {paper.citationCount} Citations
                                            </Badge>
                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                {paper.referenceCount} References
                                            </Badge>
                                            {paper.doi && (
                                                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                                                    DOI Available
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
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
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                    {/* Left Side - Gap Results */}
                    <div className="lg:col-span-2 flex flex-col min-h-0">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex-1 flex flex-col min-h-0"
                        >
                            <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20 flex-1 flex flex-col min-h-0">
                                <CardHeader className="flex-shrink-0">
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                        Gap Analysis Results
                                    </CardTitle>
                                    <CardDescription>
                                        {researchGaps.length > 0
                                            ? `Found ${researchGaps.length} research gaps`
                                            : 'No completed analyses yet. Start a new gap analysis to see results.'
                                        }
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                                    {researchGaps.length === 0 ? (
                                        <div className="text-center py-12 px-6">
                                            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                                            <p className="text-muted-foreground mb-4">
                                                Start a gap analysis to discover research opportunities
                                            </p>
                                            <Button
                                                onClick={() => setIsConfigDialogOpen(true)}
                                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Start Analysis
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/30">
                                            <div className="space-y-4 p-6">
                                                {researchGaps.map((gap) => (
                                                    <Card key={gap.id} className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-md border border-blue-400/20 hover:border-blue-400/40 hover:bg-gradient-to-br hover:from-blue-500/20 hover:via-purple-500/10 hover:to-cyan-500/20 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer group relative overflow-hidden" onClick={() => navigateToGap(gap)}>
                                                        {/* Shimmer effect */}
                                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"></div>
                                                        <CardContent className="p-4 relative z-10">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Badge variant="outline" className="bg-gradient-to-r from-emerald-500/30 to-green-500/30 backdrop-blur-sm text-emerald-200 border-emerald-400/50 shadow-lg shadow-emerald-500/20">
                                                                            {Math.round((gap.validationConfidence || 0) * 100)}% Confidence
                                                                        </Badge>
                                                                        <Badge variant="outline" className="bg-gradient-to-r from-violet-500/30 to-purple-500/30 backdrop-blur-sm text-violet-200 border-violet-400/50 shadow-lg shadow-violet-500/20">
                                                                            {gap.category}
                                                                        </Badge>
                                                                    </div>
                                                                    <h4 className="font-medium mb-2">{gap.name || 'Untitled Gap'}</h4>
                                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                                        {gap.description || 'No description available'}
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        navigateToGap(gap)
                                                                    }}
                                                                    className="ml-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/30 text-blue-100 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-500/20"
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Gap
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right Side - Analysis List */}
                    <div className="flex flex-col min-h-0 border-l-2 border-primary/20 pl-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex-1 flex flex-col min-h-0"
                        >
                            <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20 flex-1 flex flex-col min-h-0">
                                <CardHeader className="flex-shrink-0 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <History className="h-5 w-5 text-primary" />
                                            Recent Analyses
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => loadGapAnalyses(paperId)}
                                            disabled={isLoading}
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                                    {isLoading ? (
                                        <div className="p-4 space-y-3">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="space-y-2">
                                                    <Skeleton className="h-4 w-full" />
                                                    <Skeleton className="h-3 w-3/4" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : gapAnalyses.length === 0 ? (
                                        <div className="text-center py-8">
                                            <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                            <p className="text-sm text-muted-foreground">No analyses found</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/30">
                                            <div className="space-y-4 p-4 border-l-2 border-primary/10">
                                                {gapAnalyses.map((analysis) => (
                                                    <Card key={analysis.id} className="bg-muted/30 border-2 border-primary/15">
                                                        <CardContent className="p-3">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        {getStatusIcon(analysis.status)}
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={cn("text-xs", getStatusColor(analysis.status))}
                                                                        >
                                                                            {analysis.status}
                                                                        </Badge>
                                                                    </div>
                                                                    {analysis.status === GapStatus.RUNNING && (
                                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                            <Timer className="h-3 w-3" />
                                                                            {formatTime(analysisTimers[analysis.id] || 0)}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {analysis.message && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {analysis.message}
                                                                    </p>
                                                                )}

                                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                    <span>
                                                                        {analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : 'Unknown'}
                                                                    </span>
                                                                    {analysis.status === GapStatus.COMPLETED && analysis.statistics && (
                                                                        <div className="text-xs text-green-500">
                                                                            {analysis.statistics.validGaps} gaps found
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
} 