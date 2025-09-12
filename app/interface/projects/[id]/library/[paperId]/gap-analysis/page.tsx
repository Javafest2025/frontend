"use client"

import { useState, useEffect, useRef } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
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
    History,
    Plus,
    Settings,
    Hash,
    CheckCircle2,
    XCircle,
    Edit3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { downloadPdfWithAuth } from "@/lib/api/pdf"
import { gapAnalysisApi, researchGapsApi, type ResearchGapResponse, type GapAnalysisRequestData, GapStatus } from "@/lib/api/project-service/gap-analysis"
import { isPaperExtracted, getExtractionStatus, triggerExtractionForPaper } from "@/lib/api/project-service/extraction"
import { useToast } from "@/hooks/use-toast"
import { TextShimmer } from "@/components/motion-primitives/text-shimmer"
import type { Paper } from "@/types/websearch"

// Shimmer component for processing data with customizable colors
const ProcessingShimmer = ({
    className = "",
    color = "yellow",
    size = "w-8"
}: {
    className?: string
    color?: "blue" | "emerald" | "red" | "yellow"
    size?: string
}) => {
    const colorClasses = {
        blue: "from-blue-500/20 via-blue-400/40 to-blue-500/20 via-blue-300/30",
        emerald: "from-emerald-500/20 via-emerald-400/40 to-emerald-500/20 via-emerald-300/30",
        red: "from-red-500/20 via-red-400/40 to-red-500/20 via-red-300/30",
        yellow: "from-yellow-500/20 via-yellow-400/40 to-yellow-500/20 via-yellow-300/30"
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <div className={`h-full ${size} bg-gradient-to-r ${colorClasses[color]} rounded animate-pulse`}>
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${colorClasses[color].split(' ')[3]} to-transparent animate-pulse`}></div>
            </div>
        </div>
    )
}

interface PaperGapAnalysisPageProps {
    params: Promise<{
        id: string
        paperId: string
    }>
}

export default function PaperGapAnalysisPage({ params }: PaperGapAnalysisPageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const [projectId, setProjectId] = useState<string>("")
    const [paperId, setPaperId] = useState<string>("")
    const [paper, setPaper] = useState<Paper | null>(null)
    const [isDownloading, setIsDownloading] = useState(false)

    // Gap analysis states
    const [gapAnalysisRequestData, setGapAnalysisRequestData] = useState<GapAnalysisRequestData[]>([])
    const [allResearchGaps, setAllResearchGaps] = useState<ResearchGapResponse[]>([])
    const [filteredResearchGaps, setFilteredResearchGaps] = useState<ResearchGapResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [pollingAnalyses, setPollingAnalyses] = useState<Set<string>>(new Set())
    const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set())
    const [selectedAnalyses, setSelectedAnalyses] = useState<Set<string>>(new Set())

    // Extraction polling state
    const [isPollingExtraction, setIsPollingExtraction] = useState(false)
    const [extractionPollingInterval, setExtractionPollingInterval] = useState<NodeJS.Timeout | null>(null)

    // Timing counter state
    const [analysisStartTime, setAnalysisStartTime] = useState<Date | null>(null)
    const [elapsedTime, setElapsedTime] = useState(0)

    // Prevent multiple gap analysis requests
    const [isGapAnalysisInitiating, setIsGapAnalysisInitiating] = useState(false)

    // Ref to prevent race conditions in extraction polling
    const isProcessingExtractionCompletion = useRef(false)

    // Configuration dialog states
    const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
    const [configForm, setConfigForm] = useState({
        maxGaps: 10,
        validationDepth: "thorough",
        includeTopicSuggestions: true,
        includeImplementationDetails: true,
        confidenceThreshold: 0.7,
        includeImpactAnalysis: true,
        includeResearchHints: true,
        includeRisksAnalysis: true,
        includeResourceEstimation: true
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
            await gapAnalysisApi.getGapAnalysesByPaperId(currentPaperId)

            // Load request data for detailed information
            const requestData = await gapAnalysisApi.getGapAnalysisRequestDataByPaperId(currentPaperId)
            setGapAnalysisRequestData(requestData)

            // Load research gaps for completed analyses
            const completedAnalyses = requestData.filter(request => request.status === GapStatus.COMPLETED)
            if (completedAnalyses.length > 0) {
                // Load gaps from all completed analyses
                const allGaps: ResearchGapResponse[] = []
                for (const analysis of completedAnalyses) {
                    try {
                        const gaps = await researchGapsApi.getResearchGapsByGapAnalysisId(analysis.gapAnalysisId)
                        allGaps.push(...gaps)
                    } catch (error) {
                        console.error(`Error loading gaps for analysis ${analysis.gapAnalysisId}:`, error)
                    }
                }
                setAllResearchGaps(allGaps)
            }

            // Start polling for running analyses
            const runningAnalysisIds = requestData
                .filter(request => request.status === GapStatus.PROCESSING || request.status === GapStatus.PENDING)
                .map(request => request.gapAnalysisId)

            setPollingAnalyses(new Set(runningAnalysisIds))
        } catch (error) {
            console.error('Error loading gap analyses:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const pollAnalysisStatus = async (analysisId: string) => {
        try {
            const updatedAnalysis = await gapAnalysisApi.getGapAnalysis(analysisId)

            // Update request data if needed
            setGapAnalysisRequestData(prev => prev.map(requestData =>
                requestData.gapAnalysisId === analysisId
                    ? { ...requestData, status: updatedAnalysis.status }
                    : requestData
            ))

            // If analysis completed, load research gaps and stop polling
            if (updatedAnalysis.status === GapStatus.COMPLETED) {
                try {
                    const gaps = await researchGapsApi.getResearchGapsByGapAnalysisId(analysisId)
                    setAllResearchGaps(prev => {
                        // Remove existing gaps from this analysis and add new ones
                        const filtered = prev.filter(gap => gap.gapAnalysisId !== analysisId)
                        return [...filtered, ...gaps]
                    })
                } catch (error) {
                    console.error('Error fetching research gaps:', error)
                }

                // Stop timing counter
                setAnalysisStartTime(null)
                setElapsedTime(0)

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

    const pollExtractionStatus = async (currentPaperId: string) => {
        // Prevent multiple simultaneous processing of extraction completion
        if (isProcessingExtractionCompletion.current) {
            console.log('Already processing extraction completion, skipping poll...')
            return
        }

        try {
            const extracted = await isPaperExtracted(currentPaperId)

            if (extracted) {
                // Set flag to prevent race conditions
                isProcessingExtractionCompletion.current = true

                // Stop polling immediately
                stopExtractionPolling()

                console.log('Extraction completed, stopping polling and starting gap analysis')

                toast({
                    title: "Extraction Complete",
                    description: "Paper extraction is complete. Starting gap analysis...",
                    duration: 3000,
                })

                // Start gap analysis immediately (no timeout needed since we stopped polling)
                await initiateGapAnalysisAfterExtraction(currentPaperId)

                // Reset flag after completion
                isProcessingExtractionCompletion.current = false
            } else {
                // Check if extraction is still processing
                const extractionStatus = await getExtractionStatus(currentPaperId)
                if (extractionStatus.status !== "PROCESSING") {
                    // Extraction failed or completed but not extracted, stop polling
                    console.log('Extraction not processing and not extracted, stopping polling')
                    stopExtractionPolling()
                    toast({
                        title: "Extraction Issue",
                        description: "Paper extraction encountered an issue. Please try again.",
                        variant: "destructive",
                        duration: 5000,
                    })
                }
            }
        } catch (error) {
            console.error('Error polling extraction status:', error)
            stopExtractionPolling()
            isProcessingExtractionCompletion.current = false
            toast({
                title: "Extraction Error",
                description: "Failed to check extraction status. Please try again.",
                variant: "destructive",
                duration: 5000,
            })
        }
    }

    const startExtractionPolling = (currentPaperId: string) => {
        // Prevent starting multiple polling intervals
        if (isPollingExtraction || extractionPollingInterval) {
            console.log('Extraction polling already running, skipping start...')
            return
        }

        console.log('Starting extraction polling...')
        setIsPollingExtraction(true)
        const interval = setInterval(() => {
            pollExtractionStatus(currentPaperId)
        }, 2000) // Poll every 2 seconds
        setExtractionPollingInterval(interval)
    }

    const stopExtractionPolling = () => {
        console.log('Stopping extraction polling...')
        setIsPollingExtraction(false)
        if (extractionPollingInterval) {
            clearInterval(extractionPollingInterval)
            setExtractionPollingInterval(null)
            console.log('Extraction polling interval cleared')
        }
        // Reset the processing flag when stopping polling
        isProcessingExtractionCompletion.current = false
    }

    const initiateGapAnalysisAfterExtraction = async (currentPaperId: string) => {
        // Prevent multiple simultaneous requests
        if (isGapAnalysisInitiating) {
            console.log('Gap analysis initiation already in progress, skipping...')
            return
        }

        setIsGapAnalysisInitiating(true)
        try {
            const analysis = await gapAnalysisApi.initiateGapAnalysis({
                paperId: currentPaperId,
                config: {
                    maxGaps: configForm.maxGaps,
                    validationDepth: configForm.validationDepth,
                    includeTopicSuggestions: configForm.includeTopicSuggestions,
                    includeImplementationDetails: configForm.includeImplementationDetails,
                    confidenceThreshold: configForm.confidenceThreshold,
                    includeImpactAnalysis: configForm.includeImpactAnalysis,
                    includeResearchHints: configForm.includeResearchHints,
                    includeRisksAnalysis: configForm.includeRisksAnalysis,
                    includeResourceEstimation: configForm.includeResourceEstimation
                }
            })

            // Start timing counter
            setAnalysisStartTime(new Date())
            setElapsedTime(0)

            // Reload request data to include the new analysis
            const requestData = await gapAnalysisApi.getGapAnalysisRequestDataByPaperId(currentPaperId)
            setGapAnalysisRequestData(requestData)

            // Start polling for this analysis
            setPollingAnalyses(prev => new Set(Array.from(prev).concat(analysis.id)))

            // Enhanced toast notification
            toast({
                title: "🎯 Gap Analysis Started",
                description: (
                    <div className="space-y-2">
                        <p className="font-medium">Your gap analysis is now running!</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Estimated time: ~30 minutes</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Target className="h-4 w-4" />
                            <span>Analyzing research gaps and opportunities</span>
                        </div>
                    </div>
                ),
                duration: 8000,
            })

            // Close dialog and reset form
            setIsConfigDialogOpen(false)
            setConfigForm({
                maxGaps: 10,
                validationDepth: "thorough",
                includeTopicSuggestions: true,
                includeImplementationDetails: true,
                confidenceThreshold: 0.7,
                includeImpactAnalysis: true,
                includeResearchHints: true,
                includeRisksAnalysis: true,
                includeResourceEstimation: true
            })
        } catch (error) {
            console.error('Error initiating gap analysis after extraction:', error)
            toast({
                title: "Gap Analysis Error",
                description: "Failed to start gap analysis. Please try again.",
                variant: "destructive",
                duration: 5000,
            })
        } finally {
            setIsGapAnalysisInitiating(false)
        }
    }

    const handleSubmitGapAnalysis = async () => {
        if (!paperId || isSubmitting || isGapAnalysisInitiating) return

        setIsSubmitting(true)
        try {
            // Step 1: Check if paper is extracted
            const extracted = await isPaperExtracted(paperId)

            if (extracted) {
                // Paper is extracted, proceed directly to gap analysis
                await initiateGapAnalysisAfterExtraction(paperId)
            } else {
                // Paper is not extracted, check extraction status
                const extractionStatus = await getExtractionStatus(paperId)

                if (extractionStatus.status === "PROCESSING") {
                    // Extraction is already in progress, start polling
                    toast({
                        title: "Extraction in Progress",
                        description: "The paper is currently being extracted. Gap analysis will start automatically once extraction is complete.",
                        duration: 5000,
                    })
                    // Only start polling if not already running
                    if (!isPollingExtraction) {
                        startExtractionPolling(paperId)
                    }
                    setIsConfigDialogOpen(false) // Close dialog while polling
                } else {
                    // Extraction is not processing, trigger extraction first
                    toast({
                        title: "Starting Extraction",
                        description: "Paper extraction is required. Starting extraction process...",
                        duration: 3000,
                    })

                    try {
                        await triggerExtractionForPaper(paperId, true)
                        toast({
                            title: "Extraction Started",
                            description: "Paper extraction has been initiated. Gap analysis will start automatically once extraction is complete.",
                            duration: 5000,
                        })
                        // Only start polling if not already running
                        if (!isPollingExtraction) {
                            startExtractionPolling(paperId)
                        }
                        setIsConfigDialogOpen(false) // Close dialog while polling
                    } catch (extractionError) {
                        console.error('Error triggering extraction:', extractionError)
                        toast({
                            title: "Extraction Error",
                            description: "Failed to start paper extraction. Please try again.",
                            variant: "destructive",
                            duration: 5000,
                        })
                    }
                }
            }
        } catch (error) {
            console.error('Error in gap analysis workflow:', error)
            toast({
                title: "Error",
                description: "An error occurred while checking paper status. Please try again.",
                variant: "destructive",
                duration: 5000,
            })
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



    const formatRequestId = (requestId: string) => {
        // Format request ID to be more readable
        const parts = requestId.split('-')
        if (parts.length >= 2) {
            return `${parts[0]}-${parts[1].substring(0, 8)}...`
        }
        return requestId.substring(0, 12) + '...'
    }

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    }

    const toggleConfigExpansion = (requestId: string) => {
        setExpandedConfigs(prev => {
            const newSet = new Set(prev)
            if (newSet.has(requestId)) {
                newSet.delete(requestId)
            } else {
                newSet.add(requestId)
            }
            return newSet
        })
    }

    const toggleAnalysisSelection = (gapAnalysisId: string) => {
        setSelectedAnalyses(prev => {
            const newSet = new Set(prev)
            if (newSet.has(gapAnalysisId)) {
                newSet.delete(gapAnalysisId)
            } else {
                newSet.add(gapAnalysisId)
            }
            return newSet
        })
    }

    const loadGapsForSelectedAnalyses = async (selectedIds: Set<string>) => {
        if (selectedIds.size === 0) {
            // Show all gaps when nothing is selected
            setFilteredResearchGaps(allResearchGaps)
            return
        }

        try {
            // Fetch gaps for each selected analysis
            const allGaps: ResearchGapResponse[] = []
            for (const analysisId of Array.from(selectedIds)) {
                try {
                    const gaps = await researchGapsApi.getResearchGapsByGapAnalysisId(analysisId)
                    allGaps.push(...gaps)
                } catch (error) {
                    console.error(`Error loading gaps for analysis ${analysisId}:`, error)
                }
            }
            setFilteredResearchGaps(allGaps)
        } catch (error) {
            console.error('Error loading gaps for selected analyses:', error)
            setFilteredResearchGaps([])
        }
    }

    const getStatusColor = (status: GapStatus) => {
        switch (status) {
            case GapStatus.COMPLETED: return 'bg-green-500/10 text-green-500 border-green-500/20'
            case GapStatus.PROCESSING: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            case GapStatus.PENDING: return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case GapStatus.FAILED: return 'bg-red-500/10 text-red-500 border-red-500/20'
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }

    const getStatusIcon = (status: GapStatus) => {
        switch (status) {
            case GapStatus.COMPLETED: return <CheckCircle className="h-4 w-4 text-green-500" />
            case GapStatus.PROCESSING: return (
                <div className="relative">
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                    <div className="absolute inset-0 h-4 w-4 animate-ping">
                        <div className="h-full w-full rounded-full bg-yellow-500/30"></div>
                    </div>
                </div>
            )
            case GapStatus.PENDING: return <Clock className="h-4 w-4 text-blue-500" />
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
            estimatedResearcherYears: '0',
            researchHints: gap.researchHints || '',
            risksAndChallenges: gap.risksAndChallenges || '',
            requiredResources: gap.requiredResources || '',
            orderIndex: (gap.orderIndex || 1).toString(),
            papersAnalyzedCount: (gap.papersAnalyzedCount || 0).toString(),
            initialReasoning: gap.initialReasoning || '',
            validationReasoning: gap.validationReasoning || '',
            validationQuery: gap.validationQuery || '',
            evidenceAnchors: gap.evidenceAnchors ? JSON.stringify(gap.evidenceAnchors) : '',
            supportingPapers: gap.supportingPapers ? JSON.stringify(gap.supportingPapers) : '',
            conflictingPapers: gap.conflictingPapers ? JSON.stringify(gap.conflictingPapers) : '',
            suggestedTopics: gap.suggestedTopics && gap.suggestedTopics.length > 0 ? JSON.stringify(gap.suggestedTopics) : ''
        })

        router.push(`/interface/projects/${projectId}/library/${paperId}/gap-analysis/${gap.id}?${searchParams.toString()}`)
    }

    // Polling effect
    useEffect(() => {
        const interval = setInterval(() => {
            Array.from(pollingAnalyses).forEach(analysisId => {
                pollAnalysisStatus(analysisId)
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [Array.from(pollingAnalyses)])

    // Load gaps when selection changes
    useEffect(() => {
        loadGapsForSelectedAnalyses(selectedAnalyses)
    }, [selectedAnalyses, allResearchGaps])

    // Cleanup extraction polling on unmount
    useEffect(() => {
        return () => {
            stopExtractionPolling()
        }
    }, [])

    // Stop extraction polling when gap analysis starts
    useEffect(() => {
        if (pollingAnalyses.size > 0) {
            stopExtractionPolling()
        }
    }, [pollingAnalyses.size])

    // Timing counter effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (analysisStartTime && pollingAnalyses.size > 0) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1)
            }, 1000)
        } else {
            setElapsedTime(0)
        }

        return () => {
            if (interval) {
                clearInterval(interval)
            }
        }
    }, [analysisStartTime, pollingAnalyses.size])

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
                            <DialogContent className="sm:max-w-[700px] max-h-[90vh] border-2 border-primary/20 bg-gradient-to-br from-background via-background to-background/95 backdrop-blur-xl">
                                <DialogHeader className="space-y-4 pb-6 border-b border-primary/10">
                                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                                            <Target className="h-6 w-6 text-primary" />
                                        </div>
                                        Configure Gap Analysis
                                    </DialogTitle>
                                    <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                                        Configure parameters for the gap analysis of{" "}
                                        <span className="font-semibold text-foreground bg-primary/10 px-2 py-1 rounded-md">
                                            "{paper?.title && paper.title.length > 60 ? paper.title.substring(0, 60) + '...' : paper?.title || 'Unknown Paper'}"
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="py-6 overflow-y-auto max-h-[60vh]">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Left Column - Core Settings */}
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                                                    <Settings className="h-5 w-5" />
                                                    Core Settings
                                                </h3>

                                                {/* Max Gaps */}
                                                <div className="space-y-3 p-4 rounded-lg border border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="max_gaps" className="text-sm font-medium">
                                                            Max Gaps
                                                        </Label>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                                        <Info className="h-4 w-4 text-muted-foreground" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="max-w-xs">
                                                                    <p className="text-sm">Maximum number of research gaps to identify and analyze</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                    <Input
                                                        id="max_gaps"
                                                        type="number"
                                                        min="1"
                                                        max="50"
                                                        value={configForm.maxGaps}
                                                        onChange={(e) => setConfigForm(prev => ({ ...prev, maxGaps: parseInt(e.target.value) || 10 }))}
                                                        className="h-11 bg-background/50 border-primary/20 focus:border-primary/40"
                                                        placeholder="Enter max gaps (1-50)"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Default: 10 gaps maximum
                                                    </p>
                                                </div>

                                                {/* Validation Depth */}
                                                <div className="space-y-3 p-4 rounded-lg border border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="validation_depth" className="text-sm font-medium">
                                                            Validation Depth
                                                        </Label>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                                        <Info className="h-4 w-4 text-muted-foreground" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="max-w-xs">
                                                                    <p className="text-sm">How thoroughly to validate each identified gap</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                    <Select
                                                        value={configForm.validationDepth}
                                                        onValueChange={(value) => setConfigForm(prev => ({ ...prev, validationDepth: value }))}
                                                    >
                                                        <SelectTrigger className="h-11 bg-background/50 border-primary/20 focus:border-primary/40">
                                                            <SelectValue placeholder="Select validation depth" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="basic">Basic</SelectItem>
                                                            <SelectItem value="thorough">Thorough</SelectItem>
                                                            <SelectItem value="comprehensive">Comprehensive</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-xs text-muted-foreground">
                                                        Default: Thorough validation
                                                    </p>
                                                </div>

                                                {/* Confidence Threshold */}
                                                <div className="space-y-3 p-4 rounded-lg border border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="confidence_threshold" className="text-sm font-medium">
                                                            Confidence Threshold
                                                        </Label>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                                        <Info className="h-4 w-4 text-muted-foreground" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="max-w-xs">
                                                                    <p className="text-sm">Minimum confidence score for gap validation (0.0 - 1.0)</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="p-3 rounded-lg bg-background/30 border border-primary/10">
                                                            <Slider
                                                                value={[configForm.confidenceThreshold]}
                                                                onValueChange={(value) => setConfigForm(prev => ({ ...prev, confidenceThreshold: value[0] }))}
                                                                max={1}
                                                                min={0}
                                                                step={0.1}
                                                                className="w-full"
                                                            />
                                                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                                                <span>0%</span>
                                                                <span className="font-medium text-primary">{Math.round(configForm.confidenceThreshold * 100)}%</span>
                                                                <span>100%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Default: 70% confidence threshold
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column - Analysis Options */}
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                                                    <BarChart3 className="h-5 w-5" />
                                                    Analysis Options
                                                </h3>
                                                <div className="space-y-4 p-4 rounded-lg border border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-primary/5 hover:bg-background/50 transition-colors">
                                                            <div className="space-y-1">
                                                                <Label htmlFor="include_topic_suggestions" className="text-sm font-medium">
                                                                    Include Topic Suggestions
                                                                </Label>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Generate related research topics and directions
                                                                </p>
                                                            </div>
                                                            <Switch
                                                                id="include_topic_suggestions"
                                                                checked={configForm.includeTopicSuggestions}
                                                                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, includeTopicSuggestions: checked }))}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-primary/5 hover:bg-background/50 transition-colors">
                                                            <div className="space-y-1">
                                                                <Label htmlFor="include_implementation_details" className="text-sm font-medium">
                                                                    Include Implementation Details
                                                                </Label>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Provide detailed implementation approaches
                                                                </p>
                                                            </div>
                                                            <Switch
                                                                id="include_implementation_details"
                                                                checked={configForm.includeImplementationDetails}
                                                                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, includeImplementationDetails: checked }))}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-primary/5 hover:bg-background/50 transition-colors">
                                                            <div className="space-y-1">
                                                                <Label htmlFor="include_impact_analysis" className="text-sm font-medium">
                                                                    Include Impact Analysis
                                                                </Label>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Analyze potential research impact and significance
                                                                </p>
                                                            </div>
                                                            <Switch
                                                                id="include_impact_analysis"
                                                                checked={configForm.includeImpactAnalysis}
                                                                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, includeImpactAnalysis: checked }))}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-primary/5 hover:bg-background/50 transition-colors">
                                                            <div className="space-y-1">
                                                                <Label htmlFor="include_research_hints" className="text-sm font-medium">
                                                                    Include Research Hints
                                                                </Label>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Provide hints and guidance for research direction
                                                                </p>
                                                            </div>
                                                            <Switch
                                                                id="include_research_hints"
                                                                checked={configForm.includeResearchHints}
                                                                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, includeResearchHints: checked }))}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-primary/5 hover:bg-background/50 transition-colors">
                                                            <div className="space-y-1">
                                                                <Label htmlFor="include_risks_analysis" className="text-sm font-medium">
                                                                    Include Risks Analysis
                                                                </Label>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Identify potential risks and challenges
                                                                </p>
                                                            </div>
                                                            <Switch
                                                                id="include_risks_analysis"
                                                                checked={configForm.includeRisksAnalysis}
                                                                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, includeRisksAnalysis: checked }))}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-primary/5 hover:bg-background/50 transition-colors">
                                                            <div className="space-y-1">
                                                                <Label htmlFor="include_resource_estimation" className="text-sm font-medium">
                                                                    Include Resource Estimation
                                                                </Label>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Estimate required resources and timeline
                                                                </p>
                                                            </div>
                                                            <Switch
                                                                id="include_resource_estimation"
                                                                checked={configForm.includeResourceEstimation}
                                                                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, includeResourceEstimation: checked }))}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="pt-6 border-t border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
                                    <div className="flex w-full gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsConfigDialogOpen(false)}
                                            className="flex-1 h-12 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSubmitGapAnalysis}
                                            disabled={isSubmitting || isPollingExtraction || isGapAnalysisInitiating || !paper?.pdfContentUrl}
                                            className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Checking Paper...
                                                </>
                                            ) : isPollingExtraction ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Waiting for Extraction...
                                                </>
                                            ) : isGapAnalysisInitiating ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Starting Analysis...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="mr-2 h-5 w-5" />
                                                    Start Analysis
                                                </>
                                            )}
                                        </Button>
                                    </div>
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

                                        {/* Extraction Loading Indicator */}
                                        {isPollingExtraction && (
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20">
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                                                <TextShimmer
                                                    className="text-sm font-medium text-blue-300"
                                                    duration={2}
                                                    style={{
                                                        '--base-color': '#93c5fd',
                                                        '--base-gradient-color': '#dbeafe'
                                                    } as React.CSSProperties}
                                                >
                                                    Paper is being extracted
                                                </TextShimmer>
                                            </div>
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
                                        {filteredResearchGaps.length > 0
                                            ? `Found ${filteredResearchGaps.length} research gaps${selectedAnalyses.size > 0 ? ` (filtered from ${allResearchGaps.length} total)` : ''}`
                                            : allResearchGaps.length > 0
                                                ? 'No gaps match the selected analyses'
                                                : 'No completed analyses yet. Start a new gap analysis to see results.'
                                        }
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                                    {filteredResearchGaps.length === 0 ? (
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
                                                {filteredResearchGaps.map((gap) => (
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
                                        <CardTitle className="flex items-center gap-2 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <History className="h-5 w-5 text-primary" />
                                                Recent Analyses
                                            </div>
                                            {selectedAnalyses.size > 0 && (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs whitespace-nowrap">
                                                    {selectedAnalyses.size} selected
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            {selectedAnalyses.size > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedAnalyses(new Set())}
                                                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                                >
                                                    Clear Selection
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => loadGapAnalyses(paperId)}
                                                disabled={isLoading}
                                            >
                                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </div>
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
                                    ) : gapAnalysisRequestData.length === 0 ? (
                                        <div className="text-center py-8">
                                            <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                            <p className="text-sm text-muted-foreground">No analyses found</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/30">
                                            <div className="space-y-4 p-4 border-l-2 border-primary/10">
                                                {gapAnalysisRequestData.map((requestData) => {
                                                    const isExpanded = expandedConfigs.has(requestData.requestId)
                                                    const isSelected = selectedAnalyses.has(requestData.gapAnalysisId)
                                                    const startTime = requestData.startedAt ? formatDateTime(requestData.startedAt) : null
                                                    const endTime = requestData.completedAt ? formatDateTime(requestData.completedAt) : null

                                                    return (
                                                        <Card
                                                            key={requestData.gapAnalysisId}
                                                            className={cn(
                                                                "backdrop-blur-sm transition-all duration-300 cursor-pointer group relative overflow-hidden",
                                                                isSelected
                                                                    ? "bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-teal-500/20 border border-emerald-400/40 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02]"
                                                                    : "bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 border border-blue-400/20 hover:border-blue-400/40 hover:scale-[1.01]"
                                                            )}
                                                            onClick={() => toggleAnalysisSelection(requestData.gapAnalysisId)}
                                                        >
                                                            {/* Selection indicator and shimmer effect */}
                                                            {isSelected && (
                                                                <div className="absolute -top-1 -left-1 z-10">
                                                                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 border-2 border-background">
                                                                        <CheckCircle className="h-3 w-3 text-white" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {isSelected && (
                                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent animate-pulse"></div>
                                                            )}

                                                            <CardContent className="p-4 relative z-10">
                                                                <div className="space-y-3">
                                                                    {/* Header with status and request ID */}
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            {getStatusIcon(requestData.status)}
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={cn("text-xs", getStatusColor(requestData.status))}
                                                                            >
                                                                                {requestData.status}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <div className="flex items-center gap-1 text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded border border-blue-400/30">
                                                                                            <Hash className="h-3 w-3" />
                                                                                            {formatRequestId(requestData.requestId)}
                                                                                        </div>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <p>{requestData.requestId}</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    toggleConfigExpansion(requestData.requestId)
                                                                                }}
                                                                                className="h-5 w-5 p-0 hover:bg-blue-500/20"
                                                                            >
                                                                                <Settings className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Gap counts with icons */}
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <Target className="h-3 w-3 text-blue-400" />
                                                                            {requestData.status === GapStatus.PROCESSING ? (
                                                                                <ProcessingShimmer className="h-3" color="blue" size="w-8" />
                                                                            ) : (
                                                                                <span className="text-blue-300">Total: {requestData.totalGapsIdentified || 0}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                                                            {requestData.status === GapStatus.PROCESSING ? (
                                                                                <ProcessingShimmer className="h-3" color="emerald" size="w-8" />
                                                                            ) : (
                                                                                <span className="text-emerald-300">Valid: {requestData.validGapsCount || 0}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <XCircle className="h-3 w-3 text-red-400" />
                                                                            {requestData.status === GapStatus.PROCESSING ? (
                                                                                <ProcessingShimmer className="h-3" color="red" size="w-8" />
                                                                            ) : (
                                                                                <span className="text-red-300">Invalid: {requestData.invalidGapsCount || 0}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <Edit3 className="h-3 w-3 text-yellow-400" />
                                                                            {requestData.status === GapStatus.PROCESSING ? (
                                                                                <ProcessingShimmer className="h-3" color="yellow" size="w-8" />
                                                                            ) : (
                                                                                <span className="text-yellow-300">Modified: {requestData.modifiedGapsCount || 0}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Timestamps */}
                                                                    <div className="space-y-1">
                                                                        {startTime && (
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                                <Clock className="h-3 w-3" />
                                                                                <span>Started: {startTime.date} at {startTime.time}</span>
                                                                            </div>
                                                                        )}
                                                                        {requestData.status === GapStatus.PROCESSING ? (
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                                <CheckCircle className="h-3 w-3" />
                                                                                <ProcessingShimmer className="h-3" color="emerald" size="w-24" />
                                                                            </div>
                                                                        ) : endTime && (
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                                <CheckCircle className="h-3 w-3" />
                                                                                <span>Completed: {endTime.date} at {endTime.time}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Config dropdown */}
                                                                    {isExpanded && requestData.config && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, height: 0 }}
                                                                            animate={{ opacity: 1, height: 'auto' }}
                                                                            exit={{ opacity: 0, height: 0 }}
                                                                            className="border-t border-blue-400/20 pt-3 mt-3"
                                                                        >
                                                                            <div className="space-y-2">
                                                                                <h4 className="text-xs font-medium text-blue-300 flex items-center gap-1">
                                                                                    <Settings className="h-3 w-3" />
                                                                                    Configuration
                                                                                </h4>
                                                                                <div className="grid grid-cols-1 gap-1 text-xs">
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-muted-foreground">Max Gaps:</span>
                                                                                        <span className="text-blue-300">{requestData.config.maxGaps}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-muted-foreground">Validation Depth:</span>
                                                                                        <span className="text-blue-300">{requestData.config.validationDepth}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-muted-foreground">Confidence Threshold:</span>
                                                                                        <span className="text-blue-300">{(requestData.config.confidenceThreshold || 0) * 100}%</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-muted-foreground">Topic Suggestions:</span>
                                                                                        <span className="text-blue-300">{requestData.config.includeTopicSuggestions ? 'Yes' : 'No'}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-muted-foreground">Implementation Details:</span>
                                                                                        <span className="text-blue-300">{requestData.config.includeImplementationDetails ? 'Yes' : 'No'}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-muted-foreground">Impact Analysis:</span>
                                                                                        <span className="text-blue-300">{requestData.config.includeImpactAnalysis ? 'Yes' : 'No'}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Timing Counter - Bottom Right */}
            {analysisStartTime && pollingAnalyses.size > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
                    className="fixed bottom-6 right-6 z-50"
                >
                    <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/20">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-primary animate-pulse" />
                                </div>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent animate-ping"></div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-sm font-medium text-primary">Analysis Running</div>
                                <div className="text-lg font-bold text-foreground font-mono">
                                    {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:
                                    {(elapsedTime % 60).toString().padStart(2, '0')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {pollingAnalyses.size} analysis{pollingAnalyses.size > 1 ? 'es' : ''} in progress
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
} 