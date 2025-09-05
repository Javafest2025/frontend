"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    Users,
    BookOpen,
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    ListChecks,
    Zap,
    Loader2,
    Award,
    Quote,
    ExternalLink,
    Download,
    Brain,
    Target,
    Database,
    Cpu,
    Shield,
    CheckCircle,
    XCircle,
    Timer,
    RefreshCw,
    BarChart3,
    Microscope,
    Code,
    GitBranch,
    Settings,
    TestTube,
    Server
} from "lucide-react"
import { isValidUUID } from "@/lib/utils"
import { downloadPdfWithAuth } from "@/lib/api/pdf"
import {
    getSummary,
    generateSummary,
    type PaperSummaryResponse
} from "@/lib/api/project-service/summary"
import {
    isPaperExtracted,
    triggerExtractionForPaper,
    getExtractionStatus,
    type ExtractionResponse
} from "@/lib/api/project-service/extraction"
import type { Paper } from "@/types/websearch"

interface PaperSummaryPageProps {
    params: Promise<{
        id: string
        paperId: string
    }>
}

type ProcessingState = 'idle' | 'checking_summary' | 'checking_extraction' | 'extracting' | 'generating_summary' | 'completed' | 'error'

export default function PaperSummaryPage({ params }: PaperSummaryPageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [projectId, setProjectId] = useState<string>("")
    const [paperId, setPaperId] = useState<string>("")
    const [paper, setPaper] = useState<Paper | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [processingState, setProcessingState] = useState<ProcessingState>('idle')
    const [summaryData, setSummaryData] = useState<PaperSummaryResponse | null>(null)
    const [summaryError, setSummaryError] = useState<string | null>(null)
    const [extractionTimer, setExtractionTimer] = useState<number>(60)
    const [isDownloading, setIsDownloading] = useState(false)
    const [extractionStatus, setExtractionStatus] = useState<ExtractionResponse | null>(null)

    // Load paper data and check summary status on mount
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
                    doi: searchParams.get('doi') || undefined,
                    pdfContentUrl: searchParams.get('pdfUrl') || undefined,
                    pdfUrl: searchParams.get('pdfUrl') || undefined,
                    isOpenAccess: searchParams.get('isOpenAccess') === 'true',
                    paperUrl: undefined,
                    semanticScholarId: undefined,
                    externalIds: {},
                    fieldsOfStudy: [],
                    publicationTypes: ""
                }
                setPaper(paperData)
                setIsLoading(false)

                // Start the summarization flow
                await startSummarizationFlow(resolvedParams.paperId)
            } catch (error) {
                console.error('Error loading paper data:', error)
                setSummaryError('Failed to load paper data')
                setIsLoading(false)
            }
        }
        loadData()
    }, [params, searchParams])

    // Main summarization flow
    const startSummarizationFlow = async (paperId: string) => {
        try {
            setProcessingState('checking_summary')

            // Step 1: Check if summary already exists
            try {
                const summary = await getSummary(paperId)
                setSummaryData(summary)
                setProcessingState('completed')
                return
            } catch (error) {
                // Summary doesn't exist, continue to next step
                console.log('No existing summary found, proceeding with generation')
            }

            setProcessingState('checking_extraction')

            // Step 2: Check if paper is extracted
            const isExtracted = await isPaperExtracted(paperId)

            if (!isExtracted) {
                setProcessingState('extracting')
                await triggerExtractionAndWait(paperId)
            }

            setProcessingState('generating_summary')

            // Step 3: Generate summary
            const summary = await generateSummary(paperId)
            setSummaryData(summary)
            setProcessingState('completed')

        } catch (error) {
            console.error('Error in summarization flow:', error)
            setSummaryError(error instanceof Error ? error.message : 'Failed to generate summary')
            setProcessingState('error')
        }
    }

    // Trigger extraction and wait for completion
    const triggerExtractionAndWait = async (paperId: string) => {
        try {
            // Start extraction
            const extractionResponse = await triggerExtractionForPaper(paperId)
            setExtractionStatus(extractionResponse)

            // Start 60-second timer
            setExtractionTimer(60)
            const timerInterval = setInterval(() => {
                setExtractionTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(timerInterval)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            // Poll extraction status
            const pollInterval = setInterval(async () => {
                try {
                    const status = await getExtractionStatus(paperId)
                    setExtractionStatus(status)

                    if (status.status === 'COMPLETED') {
                        clearInterval(pollInterval)
                        clearInterval(timerInterval)
                        setExtractionTimer(0)
                        return
                    }

                    if (status.status === 'FAILED') {
                        clearInterval(pollInterval)
                        clearInterval(timerInterval)
                        throw new Error(status.error || 'Extraction failed')
                    }
                } catch (error) {
                    clearInterval(pollInterval)
                    clearInterval(timerInterval)
                    throw error
                }
            }, 5000) // Poll every 5 seconds

            // Wait for extraction to complete or timeout
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    clearInterval(pollInterval)
                    clearInterval(timerInterval)
                    reject(new Error('Extraction timeout - please try again'))
                }, 60000) // 60 second timeout

                const checkComplete = () => {
                    if (extractionStatus?.status === 'COMPLETED') {
                        clearTimeout(timeout)
                        resolve(true)
                    } else if (extractionStatus?.status === 'FAILED') {
                        clearTimeout(timeout)
                        reject(new Error(extractionStatus.error || 'Extraction failed'))
                    }
                }

                // Check immediately and then every second
                checkComplete()
                const checkInterval = setInterval(checkComplete, 1000)

                // Cleanup function
                return () => {
                    clearTimeout(timeout)
                    clearInterval(checkInterval)
                }
            })

        } catch (error) {
            throw error
        }
    }

    const handleRegenerateSummary = async () => {
        if (!paperId) return

        setProcessingState('generating_summary')
        setSummaryError(null)

        try {
            const summary = await generateSummary(paperId)
            setSummaryData(summary)
            setProcessingState('completed')
        } catch (error) {
            console.error('Error regenerating summary:', error)
            setSummaryError(error instanceof Error ? error.message : 'Failed to regenerate summary')
            setProcessingState('error')
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


    // Loading states
    const renderLoadingState = () => {
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

        if (processingState === 'checking_summary') {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center">
                        <Brain className="h-8 w-8 animate-pulse mx-auto mb-4 text-blue-500" />
                        <p className="text-muted-foreground">Checking for existing summary...</p>
                    </div>
                </div>
            )
        }

        if (processingState === 'checking_extraction') {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center">
                        <Database className="h-8 w-8 animate-pulse mx-auto mb-4 text-green-500" />
                        <p className="text-muted-foreground">Checking paper extraction status...</p>
                    </div>
                </div>
            )
        }

        if (processingState === 'extracting') {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="relative mb-6">
                            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
                                <Cpu className="h-10 w-10 text-white animate-pulse" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                <Timer className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Paper Extraction Agent is at Work</h3>
                        <p className="text-muted-foreground mb-4">
                            Our AI agent is extracting content from your paper. This usually takes 30-60 seconds.
                        </p>
                        <div className="bg-muted/50 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Time Remaining</span>
                                <span className="text-sm font-mono">{extractionTimer}s</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${(extractionTimer / 60) * 100}%` }}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Please wait while we process your paper...
                        </p>
                    </div>
                </div>
            )
        }

        if (processingState === 'generating_summary') {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="relative mb-6">
                            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                                <Brain className="h-10 w-10 text-white animate-pulse" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Zap className="h-4 w-4 text-white animate-spin" />
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Generating AI Summary</h3>
                        <p className="text-muted-foreground mb-4">
                            Our AI is analyzing the extracted content and generating a comprehensive summary.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <span>Analyzing paper structure...</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                <span>Extracting key findings...</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span>Generating summary...</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        return null
    }

    if (isLoading || (processingState !== 'completed' && processingState !== 'error')) {
        return renderLoadingState()
    }

    return (
        <div className="min-h-screen bg-background overflow-y-auto">
            {/* Sticky Action Bar */}
            <div className="sticky top-0 z-50">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mx-4 mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background/80 backdrop-blur-xl border border-border/50 rounded-lg px-4 py-2 shadow-lg"
                >
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
                            <p className="text-lg font-bold">Structured Analysis</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 flex-wrap">
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
                                <span className="hidden sm:inline">{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
                                <span className="sm:hidden">PDF</span>
                            </Button>
                        )}

                        {summaryData && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRegenerateSummary}
                                disabled={processingState !== 'completed' && processingState !== 'error'}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Regenerate</span>
                            </Button>
                        )}

                        {processingState === 'error' && (
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600/90 hover:to-blue-700/90"
                                onClick={() => startSummarizationFlow(paperId)}
                            >
                                <Zap className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Try Again</span>
                            </Button>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Main Content */}
            <div className="pt-6 pb-8">
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


                    {/* Summary Content */}
                    {summaryData ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-8"
                        >
                            {/* Summary Header */}
                            <Card className="border-none shadow-xl bg-gradient-to-br from-background via-background to-green-50/10 dark:to-green-950/10 ring-1 ring-green-500/20">
                                <CardHeader className="pb-6">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-3xl font-bold flex items-center gap-3">
                                            <Brain className="h-8 w-8 text-green-500" />
                                            AI-Generated Summary
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            {summaryData.confidence && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    <Target className="h-3 w-3 mr-1" />
                                                    {Math.round(summaryData.confidence * 100)}% Confidence
                                                </Badge>
                                            )}
                                            {summaryData.modelVersion && (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    <Cpu className="h-3 w-3 mr-1" />
                                                    {summaryData.modelVersion}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Quick Take Section */}
                            {(summaryData.oneLiner || summaryData.keyContributions || summaryData.methodOverview || summaryData.applicability) && (
                                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Zap className="h-5 w-5 text-blue-500" />
                                            Quick Take
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {summaryData.oneLiner && (
                                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border-l-4 border-blue-500">
                                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">One-Liner</h4>
                                                <p className="text-gray-700 dark:text-gray-300">{summaryData.oneLiner}</p>
                                            </div>
                                        )}

                                        {summaryData.keyContributions && summaryData.keyContributions.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <Award className="h-4 w-4 text-purple-500" />
                                                    Key Contributions
                                                </h4>
                                                <div className="grid gap-3">
                                                    {summaryData.keyContributions.map((contribution, index) => (
                                                        <div key={`contribution-${index}-${contribution.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg">
                                                            <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                                                {index + 1}
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{contribution}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {summaryData.methodOverview && (
                                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                    <Microscope className="h-4 w-4 text-green-500" />
                                                    Method Overview
                                                </h4>
                                                <p className="text-gray-700 dark:text-gray-300">{summaryData.methodOverview}</p>
                                            </div>
                                        )}

                                        {summaryData.applicability && summaryData.applicability.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <Target className="h-4 w-4 text-orange-500" />
                                                    Applicability
                                                </h4>
                                                <div className="grid gap-2">
                                                    {summaryData.applicability.map((application, index) => (
                                                        <div key={`application-${index}-${application.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg">
                                                            <div className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                ✓
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{application}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Research Questions */}
                            {summaryData.researchQuestions && summaryData.researchQuestions.length > 0 && (
                                <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/20 dark:to-blue-950/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Lightbulb className="h-5 w-5 text-indigo-500" />
                                            Research Questions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-3">
                                            {summaryData.researchQuestions.map((question, index) => (
                                                <div key={`question-${index}-${question.slice(0, 20)}`} className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                                    <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                                        Q{index + 1}
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300">{question}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Main Findings */}
                            {summaryData.mainFindings && summaryData.mainFindings.length > 0 && (
                                <Card className="border-none shadow-lg bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Lightbulb className="h-5 w-5 text-green-500" />
                                            Main Findings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4">
                                            {summaryData.mainFindings.map((finding, index) => (
                                                <div key={`finding-${index}-${finding.task || finding.metric || 'finding'}`} className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {finding.task && (
                                                            <div>
                                                                <span className="text-sm font-medium text-green-700 dark:text-green-300">Task:</span>
                                                                <p className="text-gray-700 dark:text-gray-300">{finding.task}</p>
                                                            </div>
                                                        )}
                                                        {finding.metric && (
                                                            <div>
                                                                <span className="text-sm font-medium text-green-700 dark:text-green-300">Metric:</span>
                                                                <p className="text-gray-700 dark:text-gray-300">{finding.metric}</p>
                                                            </div>
                                                        )}
                                                        {finding.value && (
                                                            <div>
                                                                <span className="text-sm font-medium text-green-700 dark:text-green-300">Value:</span>
                                                                <p className="text-gray-700 dark:text-gray-300 font-mono">{finding.value}</p>
                                                            </div>
                                                        )}
                                                        {finding.significance && (
                                                            <div>
                                                                <span className="text-sm font-medium text-green-700 dark:text-green-300">Significance:</span>
                                                                <p className="text-gray-700 dark:text-gray-300">{finding.significance}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Methods & Data Section */}
                            {(summaryData.studyType || summaryData.datasets || summaryData.metrics) && (
                                <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Database className="h-5 w-5 text-purple-500" />
                                            Methods & Data
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {summaryData.studyType && (
                                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                    <TestTube className="h-4 w-4 text-purple-500" />
                                                    Study Type
                                                </h4>
                                                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                                    {summaryData.studyType}
                                                </Badge>
                                            </div>
                                        )}

                                        {summaryData.datasets && summaryData.datasets.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <Database className="h-4 w-4 text-blue-500" />
                                                    Datasets
                                                </h4>
                                                <div className="grid gap-3">
                                                    {summaryData.datasets.map((dataset, index) => (
                                                        <div key={`dataset-${index}-${dataset.name || 'dataset'}`} className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {dataset.name && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Name:</span>
                                                                        <p className="text-gray-700 dark:text-gray-300 font-semibold">{dataset.name}</p>
                                                                    </div>
                                                                )}
                                                                {dataset.size && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Size:</span>
                                                                        <p className="text-gray-700 dark:text-gray-300">{dataset.size}</p>
                                                                    </div>
                                                                )}
                                                                {dataset.domain && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Domain:</span>
                                                                        <p className="text-gray-700 dark:text-gray-300">{dataset.domain}</p>
                                                                    </div>
                                                                )}
                                                                {dataset.url && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">URL:</span>
                                                                        <a href={dataset.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex items-center gap-1">
                                                                            <ExternalLink className="h-3 w-3" />
                                                                            Access Dataset
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {summaryData.metrics && summaryData.metrics.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <BarChart3 className="h-4 w-4 text-orange-500" />
                                                    Metrics
                                                </h4>
                                                <div className="grid gap-3">
                                                    {summaryData.metrics.map((metric, index) => (
                                                        <div key={`metric-${index}-${metric.name || 'metric'}`} className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {metric.name && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Name:</span>
                                                                        <p className="text-gray-700 dark:text-gray-300 font-semibold">{metric.name}</p>
                                                                    </div>
                                                                )}
                                                                {metric.definition && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Definition:</span>
                                                                        <p className="text-gray-700 dark:text-gray-300">{metric.definition}</p>
                                                                    </div>
                                                                )}
                                                                {metric.formula && (
                                                                    <div className="md:col-span-2">
                                                                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Formula:</span>
                                                                        <p className="text-gray-700 dark:text-gray-300 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">{metric.formula}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Limitations & Future Work */}
                            {(summaryData.limitations || summaryData.futureWork) && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {summaryData.limitations && summaryData.limitations.length > 0 && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                                    Limitations
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {summaryData.limitations.map((limitation, index) => (
                                                        <div key={`limitation-${index}-${limitation.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-red-200 dark:border-red-800">
                                                            <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                !
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{limitation}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {summaryData.futureWork && summaryData.futureWork.length > 0 && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <ListChecks className="h-5 w-5 text-cyan-500" />
                                                    Future Work
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {summaryData.futureWork.map((work, index) => (
                                                        <div key={`future-work-${index}-${work.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-cyan-200 dark:border-cyan-800">
                                                            <div className="w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                →
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{work}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Technical Details */}
                            {(summaryData.implementationDetails || summaryData.computeResources) && (
                                <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Settings className="h-5 w-5 text-indigo-500" />
                                            Technical Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {summaryData.implementationDetails && (
                                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <Code className="h-4 w-4 text-indigo-500" />
                                                    Implementation Details
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {summaryData.implementationDetails.frameworks && (
                                                        <div>
                                                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Frameworks:</span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {summaryData.implementationDetails.frameworks.map((framework, index) => (
                                                                    <Badge key={`framework-${index}-${framework}`} variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                                                                        {framework}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {summaryData.implementationDetails.language && (
                                                        <div>
                                                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Language:</span>
                                                            <p className="text-gray-700 dark:text-gray-300">{summaryData.implementationDetails.language}</p>
                                                        </div>
                                                    )}
                                                    {summaryData.implementationDetails.codeLines && (
                                                        <div>
                                                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Code Lines:</span>
                                                            <p className="text-gray-700 dark:text-gray-300 font-mono">{summaryData.implementationDetails.codeLines.toLocaleString()}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {summaryData.computeResources && (
                                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <Server className="h-4 w-4 text-purple-500" />
                                                    Compute Resources
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {summaryData.computeResources.hardware && (
                                                        <div>
                                                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Hardware:</span>
                                                            <p className="text-gray-700 dark:text-gray-300">{summaryData.computeResources.hardware}</p>
                                                        </div>
                                                    )}
                                                    {summaryData.computeResources.trainingTime && (
                                                        <div>
                                                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Training Time:</span>
                                                            <p className="text-gray-700 dark:text-gray-300">{summaryData.computeResources.trainingTime}</p>
                                                        </div>
                                                    )}
                                                    {summaryData.computeResources.estimatedCost && (
                                                        <div>
                                                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Estimated Cost:</span>
                                                            <p className="text-gray-700 dark:text-gray-300">${summaryData.computeResources.estimatedCost}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Reproducibility & Ethics */}
                            {(summaryData.artifacts || summaryData.ethics || summaryData.reproducibilityNotes) && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {summaryData.artifacts && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <GitBranch className="h-5 w-5 text-green-500" />
                                                    Reproducibility
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {summaryData.reproScore && (
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-medium text-green-700 dark:text-green-300">Reproducibility Score:</span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                                    <div
                                                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                                        style={{ width: `${summaryData.reproScore * 100}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-sm font-mono">{Math.round(summaryData.reproScore * 100)}%</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {summaryData.reproducibilityNotes && (
                                                        <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Notes</h4>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{summaryData.reproducibilityNotes}</p>
                                                        </div>
                                                    )}

                                                    <div className="grid gap-2">
                                                        {summaryData.artifacts.codeUrl && (
                                                            <a href={summaryData.artifacts.codeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-900/50 rounded hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
                                                                <Code className="h-4 w-4 text-green-600" />
                                                                <span className="text-sm">Code Repository</span>
                                                                <ExternalLink className="h-3 w-3 ml-auto" />
                                                            </a>
                                                        )}
                                                        {summaryData.artifacts.dataUrl && (
                                                            <a href={summaryData.artifacts.dataUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-900/50 rounded hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
                                                                <Database className="h-4 w-4 text-green-600" />
                                                                <span className="text-sm">Dataset</span>
                                                                <ExternalLink className="h-3 w-3 ml-auto" />
                                                            </a>
                                                        )}
                                                        {summaryData.artifacts.modelUrl && (
                                                            <a href={summaryData.artifacts.modelUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-900/50 rounded hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
                                                                <Brain className="h-4 w-4 text-green-600" />
                                                                <span className="text-sm">Model</span>
                                                                <ExternalLink className="h-3 w-3 ml-auto" />
                                                            </a>
                                                        )}
                                                        {summaryData.artifacts.dockerImage && (
                                                            <a href={summaryData.artifacts.dockerImage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-900/50 rounded hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
                                                                <Server className="h-4 w-4 text-green-600" />
                                                                <span className="text-sm">Docker Image</span>
                                                                <ExternalLink className="h-3 w-3 ml-auto" />
                                                            </a>
                                                        )}
                                                        {summaryData.artifacts.demoUrl && (
                                                            <a href={summaryData.artifacts.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-900/50 rounded hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
                                                                <ExternalLink className="h-4 w-4 text-green-600" />
                                                                <span className="text-sm">Demo</span>
                                                                <ExternalLink className="h-3 w-3 ml-auto" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {summaryData.ethics && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <Shield className="h-5 w-5 text-yellow-500" />
                                                    Ethics & Compliance
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {summaryData.ethics.irb !== undefined && (
                                                        <div className="flex items-center gap-2">
                                                            {summaryData.ethics.irb ? (
                                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4 text-red-500" />
                                                            )}
                                                            <span className="text-sm">IRB Approval</span>
                                                        </div>
                                                    )}
                                                    {summaryData.ethics.consent !== undefined && (
                                                        <div className="flex items-center gap-2">
                                                            {summaryData.ethics.consent ? (
                                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4 text-red-500" />
                                                            )}
                                                            <span className="text-sm">Informed Consent</span>
                                                        </div>
                                                    )}
                                                    {summaryData.ethics.sensitiveData !== undefined && (
                                                        <div className="flex items-center gap-2">
                                                            {summaryData.ethics.sensitiveData ? (
                                                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                                            ) : (
                                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                            )}
                                                            <span className="text-sm">Sensitive Data Handling</span>
                                                        </div>
                                                    )}
                                                    {summaryData.ethics.privacyMeasures && (
                                                        <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Privacy Measures</h4>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{summaryData.ethics.privacyMeasures}</p>
                                                        </div>
                                                    )}
                                                    {summaryData.ethics.dataAnonymization && (
                                                        <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Data Anonymization</h4>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{summaryData.ethics.dataAnonymization}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Bias, Fairness & Risks */}
                            {(summaryData.biasAndFairness || summaryData.risksAndMisuse || summaryData.dataRights) && (
                                <Card className="border-none shadow-lg bg-gradient-to-br from-red-50/50 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                            Bias, Fairness & Risks
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {summaryData.biasAndFairness && summaryData.biasAndFairness.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-red-500" />
                                                    Bias and Fairness
                                                </h4>
                                                <div className="space-y-2">
                                                    {summaryData.biasAndFairness.map((bias, index) => (
                                                        <div key={`bias-${index}-${bias.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-red-200 dark:border-red-800">
                                                            <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                ⚠
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{bias}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {summaryData.risksAndMisuse && summaryData.risksAndMisuse.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                                    Risks and Misuse
                                                </h4>
                                                <div className="space-y-2">
                                                    {summaryData.risksAndMisuse.map((risk, index) => (
                                                        <div key={`risk-${index}-${risk.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-orange-200 dark:border-orange-800">
                                                            <div className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                ⚡
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{risk}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {summaryData.dataRights && (
                                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-blue-500" />
                                                    Data Rights
                                                </h4>
                                                <p className="text-gray-700 dark:text-gray-300">{summaryData.dataRights}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Context & Impact */}
                            {(summaryData.noveltyType || summaryData.positioning || summaryData.relatedWorksKey || summaryData.impactNotes) && (
                                <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <TrendingUp className="h-5 w-5 text-indigo-500" />
                                            Context & Impact
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {summaryData.noveltyType && (
                                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                    <Award className="h-4 w-4 text-indigo-500" />
                                                    Novelty Type
                                                </h4>
                                                <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                                                    {summaryData.noveltyType}
                                                </Badge>
                                            </div>
                                        )}

                                        {summaryData.positioning && summaryData.positioning.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <Target className="h-4 w-4 text-purple-500" />
                                                    Positioning
                                                </h4>
                                                <div className="space-y-2">
                                                    {summaryData.positioning.map((position, index) => (
                                                        <div key={`position-${index}-${position.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-purple-200 dark:border-purple-800">
                                                            <div className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                {index + 1}
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{position}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {summaryData.relatedWorksKey && summaryData.relatedWorksKey.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-blue-500" />
                                                    Related Works
                                                </h4>
                                                <div className="space-y-3">
                                                    {summaryData.relatedWorksKey.map((work, index) => (
                                                        <div key={`related-work-${index}-${work.citation || 'work'}`} className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {work.citation && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Citation:</span>
                                                                        <p className="text-gray-700 dark:text-gray-300 font-semibold">{work.citation}</p>
                                                                    </div>
                                                                )}
                                                                {work.year && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Year:</span>
                                                                        <p className="text-gray-700 dark:text-gray-300">{work.year}</p>
                                                                    </div>
                                                                )}
                                                                {work.relation && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Relation:</span>
                                                                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                                                            {work.relation}
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                                {work.description && (
                                                                    <div className="md:col-span-2">
                                                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Description:</span>
                                                                        <p className="text-gray-700 dark:text-gray-300">{work.description}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {summaryData.impactNotes && (
                                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-green-500" />
                                                    Impact Notes
                                                </h4>
                                                <p className="text-gray-700 dark:text-gray-300">{summaryData.impactNotes}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Quality & Trust */}
                            {(summaryData.evidenceAnchors || summaryData.threatsToValidity) && (
                                <Card className="border-none shadow-lg bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <CheckCircle className="h-5 w-5 text-cyan-500" />
                                            Quality & Trust
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {summaryData.evidenceAnchors && summaryData.evidenceAnchors.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <Database className="h-4 w-4 text-cyan-500" />
                                                    Evidence Anchors ({summaryData.evidenceAnchors.length})
                                                </h4>
                                                <div className="grid gap-2 max-h-60 overflow-y-auto">
                                                    {summaryData.evidenceAnchors.slice(0, 10).map((anchor, index) => (
                                                        <div key={`anchor-${index}-${anchor.sourceId || 'anchor'}`} className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3 border border-cyan-200 dark:border-cyan-800">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                                {anchor.field && (
                                                                    <div>
                                                                        <span className="font-medium text-cyan-700 dark:text-cyan-300">Field:</span>
                                                                        <p className="text-gray-700 dark:text-gray-300">{anchor.field}</p>
                                                                    </div>
                                                                )}
                                                                {anchor.page && (
                                                                    <div>
                                                                        <span className="font-medium text-cyan-700 dark:text-cyan-300">Page:</span>
                                                                        <p className="text-gray-700 dark:text-gray-300">{anchor.page}</p>
                                                                    </div>
                                                                )}
                                                                {anchor.confidence && (
                                                                    <div>
                                                                        <span className="font-medium text-cyan-700 dark:text-cyan-300">Confidence:</span>
                                                                        <p className="text-gray-700 dark:text-gray-300">{Math.round(anchor.confidence * 100)}%</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {summaryData.evidenceAnchors.length > 10 && (
                                                        <div className="text-center text-sm text-muted-foreground">
                                                            ... and {summaryData.evidenceAnchors.length - 10} more evidence anchors
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {summaryData.threatsToValidity && summaryData.threatsToValidity.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                                    Threats to Validity
                                                </h4>
                                                <div className="space-y-2">
                                                    {summaryData.threatsToValidity.map((threat, index) => (
                                                        <div key={`threat-${index}-${threat.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-orange-200 dark:border-orange-800">
                                                            <div className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                !
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{threat}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Domain & Technical Details */}
                            {(summaryData.domainClassification || summaryData.technicalDepth || summaryData.interdisciplinaryConnections) && (
                                <Card className="border-none shadow-lg bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Microscope className="h-5 w-5 text-violet-500" />
                                            Domain & Technical Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {summaryData.domainClassification && summaryData.domainClassification.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-violet-500" />
                                                    Domain Classification
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {summaryData.domainClassification.map((domain, index) => (
                                                        <Badge key={`domain-${index}-${domain}`} variant="outline" className="bg-violet-100 text-violet-800 border-violet-200">
                                                            {domain}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {summaryData.technicalDepth && (
                                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                    <Cpu className="h-4 w-4 text-purple-500" />
                                                    Technical Depth
                                                </h4>
                                                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                                    {summaryData.technicalDepth}
                                                </Badge>
                                            </div>
                                        )}

                                        {summaryData.interdisciplinaryConnections && summaryData.interdisciplinaryConnections.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <GitBranch className="h-4 w-4 text-indigo-500" />
                                                    Interdisciplinary Connections
                                                </h4>
                                                <div className="space-y-2">
                                                    {summaryData.interdisciplinaryConnections.map((connection, index) => (
                                                        <div key={`connection-${index}-${connection.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                                            <div className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                🔗
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{connection}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Additional Method Details */}
                            {(summaryData.participants || summaryData.procedureOrPipeline || summaryData.baselinesOrControls || summaryData.statisticalAnalysis) && (
                                <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <TestTube className="h-5 w-5 text-emerald-500" />
                                            Additional Method Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {summaryData.participants && (
                                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-emerald-500" />
                                                    Participants
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {summaryData.participants.n && (
                                                        <div>
                                                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Sample Size:</span>
                                                            <p className="text-gray-700 dark:text-gray-300 font-mono">{summaryData.participants.n}</p>
                                                        </div>
                                                    )}
                                                    {summaryData.participants.demographics && (
                                                        <div>
                                                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Demographics:</span>
                                                            <p className="text-gray-700 dark:text-gray-300">{summaryData.participants.demographics}</p>
                                                        </div>
                                                    )}
                                                    {summaryData.participants.recruitmentMethod && (
                                                        <div>
                                                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Recruitment:</span>
                                                            <p className="text-gray-700 dark:text-gray-300">{summaryData.participants.recruitmentMethod}</p>
                                                        </div>
                                                    )}
                                                    {summaryData.participants.compensationDetails && (
                                                        <div>
                                                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Compensation:</span>
                                                            <p className="text-gray-700 dark:text-gray-300">{summaryData.participants.compensationDetails}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {summaryData.procedureOrPipeline && (
                                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                    <Settings className="h-4 w-4 text-teal-500" />
                                                    Procedure/Pipeline
                                                </h4>
                                                <p className="text-gray-700 dark:text-gray-300">{summaryData.procedureOrPipeline}</p>
                                            </div>
                                        )}

                                        {summaryData.baselinesOrControls && summaryData.baselinesOrControls.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <BarChart3 className="h-4 w-4 text-teal-500" />
                                                    Baselines/Controls
                                                </h4>
                                                <div className="space-y-2">
                                                    {summaryData.baselinesOrControls.map((baseline, index) => (
                                                        <div key={`baseline-${index}-${baseline.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-teal-200 dark:border-teal-800">
                                                            <div className="w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                {index + 1}
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{baseline}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {summaryData.statisticalAnalysis && summaryData.statisticalAnalysis.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                    <BarChart3 className="h-4 w-4 text-emerald-500" />
                                                    Statistical Analysis
                                                </h4>
                                                <div className="space-y-2">
                                                    {summaryData.statisticalAnalysis.map((analysis, index) => (
                                                        <div key={`analysis-${index}-${analysis.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                            <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                📊
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{analysis}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Generation Metadata */}
                            {(summaryData.modelVersion || summaryData.generationTimestamp || summaryData.generationTimeSeconds || summaryData.promptTokens || summaryData.completionTokens) && (
                                <Card className="border-none shadow-lg bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-950/20 dark:to-slate-950/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Cpu className="h-5 w-5 text-gray-500" />
                                            Generation Metadata
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {summaryData.modelVersion && (
                                                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Model Version</span>
                                                    <p className="text-gray-900 dark:text-gray-100 font-mono">{summaryData.modelVersion}</p>
                                                </div>
                                            )}
                                            {summaryData.responseSource && (
                                                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Response Source</span>
                                                    <p className="text-gray-900 dark:text-gray-100 font-mono">{summaryData.responseSource}</p>
                                                </div>
                                            )}
                                            {summaryData.generationTimeSeconds && (
                                                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Generation Time</span>
                                                    <p className="text-gray-900 dark:text-gray-100 font-mono">{summaryData.generationTimeSeconds.toFixed(2)}s</p>
                                                </div>
                                            )}
                                            {summaryData.promptTokens && (
                                                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prompt Tokens</span>
                                                    <p className="text-gray-900 dark:text-gray-100 font-mono">{summaryData.promptTokens.toLocaleString()}</p>
                                                </div>
                                            )}
                                            {summaryData.completionTokens && (
                                                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completion Tokens</span>
                                                    <p className="text-gray-900 dark:text-gray-100 font-mono">{summaryData.completionTokens.toLocaleString()}</p>
                                                </div>
                                            )}
                                            {summaryData.extractionCoverageUsed && (
                                                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Extraction Coverage</span>
                                                    <p className="text-gray-900 dark:text-gray-100 font-mono">{Math.round(summaryData.extractionCoverageUsed * 100)}%</p>
                                                </div>
                                            )}
                                            {summaryData.generationTimestamp && (
                                                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3 md:col-span-2 lg:col-span-3">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Generated At</span>
                                                    <p className="text-gray-900 dark:text-gray-100 font-mono">{new Date(summaryData.generationTimestamp).toLocaleString()}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    ) : (
                        summaryError ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="min-h-screen flex items-center justify-center"
                            >
                                <Card className="border-none shadow-xl bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 max-w-2xl mx-4">
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
                                className="min-h-screen flex items-center justify-center"
                            >
                                <div className="text-center py-20 max-w-2xl mx-4">
                                    <Brain className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
                                    <h2 className="text-2xl font-bold text-foreground mb-4">AI Summary Generation</h2>
                                    <p className="text-muted-foreground mb-8">
                                        Our AI is analyzing your paper and will generate a comprehensive summary including key findings, methodology, contributions, and more.
                                    </p>
                                </div>
                            </motion.div>
                        )
                    )}
                </div>
            </div>
        </div>
    )
} 