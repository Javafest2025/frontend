"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    BookOpen,
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    ListChecks,
    Zap,
    Loader2,
    Award,
    Download,
    Brain,
    Target,
    Database,
    Cpu,
    Shield,
    CheckCircle,
    XCircle,
    FileText,
    RefreshCw,
    BarChart3,
    Microscope,
    Code,
    GitBranch,
    Settings,
    TestTube,
    Server,
    ClipboardList,
    Activity,
    Sparkles,
    ChevronDown,
    ChevronUp
} from "lucide-react"
import { isValidUUID } from "@/lib/utils"
import { downloadPdfWithAuth } from "@/lib/api/pdf"
import {
    isPaperSummarized,
    getSummary,
    generateSummary,
    type PaperSummaryResponse
} from "@/lib/api/project-service/summary"
import {
    getExtractionStatusOnly,
    getSummarizationStatusOnly
} from "@/lib/api/project-service/extraction"
import { singleFlight } from "@/lib/singleflight"
import {
    isPaperExtracted,
    triggerExtractionForPaper,
    getExtractionStatus,
    getExtractedFigures,
    getExtractedTables,
    type ExtractionResponse,
    type ExtractedFigureResponse,
    type ExtractedTableResponse
} from "@/lib/api/project-service/extraction"
import type { Paper } from "@/types/websearch"
import FigureGallery from "@/components/paper/FigureGallery"
import TableGallery from "@/components/paper/TableGallery"
import { SummaryShimmer } from "@/components/paper/SummaryShimmer"

type RouteParams = { id: string; paperId: string }

type ProcessingState = 'idle' | 'checking_summary' | 'checking_extraction' | 'extracting' | 'generating_summary' | 'completed' | 'error'

interface SubTask {
    name: string
    completed: boolean
}

interface ProgressCardProps {
    title: string
    description: string
    icon: React.ReactNode
    isActive: boolean
    isCompleted: boolean
    progress: number
    timeAllocation: string
    subtasks: SubTask[]
}

const ProgressCard: React.FC<ProgressCardProps> = ({
    title,
    description,
    icon,
    isActive,
    isCompleted,
    progress,
    timeAllocation,
    subtasks
}) => {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${isActive ? 'border-blue-500/50 bg-blue-500/10' :
            isCompleted ? 'border-green-500/50 bg-green-500/10' :
                'border-border/50 bg-background/50'
            } backdrop-blur-sm`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse" />
            <div className="relative p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500/20 text-blue-500' :
                            isCompleted ? 'bg-green-500/20 text-green-500' :
                                'bg-muted/50 text-muted-foreground'
                            }`}>
                            {icon}
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm">{title}</h4>
                            <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{timeAllocation}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-6 w-6 p-0 hover:bg-muted/50"
                        >
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted/30 rounded-full h-2 mb-3">
                    <div
                        className={`h-2 rounded-full transition-all duration-1000 ${isActive ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                            isCompleted ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                'bg-muted'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Sub-tasks Dropdown */}
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        {subtasks.map((subtask, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${subtask.completed ? 'bg-green-500' : 'bg-muted-foreground/30'
                                    }`} />
                                <span className={subtask.completed ? 'text-green-600' : 'text-muted-foreground'}>
                                    {subtask.name}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    )
}

// ---- section time helpers ----
const TOTAL_TIME = 300;   // 5 min, already your truth
const EXTRACT_DUR = 120;  // 2 min
const ANALYZE_DUR = 60;   // 1 min
const GENERATE_DUR = 120; // 2 min

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Returns progress in [0,1] for a section based on the global 5-min timer.
 * overallTimer counts DOWN from 300 -> 0 in your code.
 */
const sectionProgress = (overallTimer: number, sectionStart: number, sectionDuration: number) => {
    const elapsed = TOTAL_TIME - overallTimer; // 0 .. 300
    return clamp01((elapsed - sectionStart) / sectionDuration);
};

/** Evenly mark subtasks complete based on section progress. */
const makeSubtasks = (names: string[], p: number): SubTask[] => {
    const nDone = Math.floor(p * names.length + 1e-9);
    return names.map((name, i) => ({ name, completed: i < nDone }));
};

export default function PaperSummaryPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { id: projectId, paperId } = useParams() as unknown as RouteParams
    const [paper, setPaper] = useState<Paper | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [processingState, setProcessingState] = useState<ProcessingState>('idle')
    const [summaryData, setSummaryData] = useState<PaperSummaryResponse | null>(null)
    const [summaryError, setSummaryError] = useState<string | null>(null)
    const [extractionTimer, setExtractionTimer] = useState<number>(120) // 2 minutes
    const [summaryTimer, setSummaryTimer] = useState<number>(180) // 3 minutes total (1 min AI + 2 min generation)
    const [overallTimer, setOverallTimer] = useState<number>(300) // 5 minutes total
    const [isDownloading, setIsDownloading] = useState(false)
    const [extractionStatus, setExtractionStatus] = useState<ExtractionResponse | null>(null)
    const [showAllAnchors, setShowAllAnchors] = useState(false)
    const [figures, setFigures] = useState<ExtractedFigureResponse[]>([])
    const [tables, setTables] = useState<ExtractedTableResponse[]>([])
    const [galleryLoading, setGalleryLoading] = useState(false)
    const [galleryError, setGalleryError] = useState<string | null>(null)

    // Guard to prevent duplicate requests in Strict Mode
    const summarizationStartedRef = useRef(false)

    // Load paper data and check summary status on mount
    useEffect(() => {
        const loadData = async () => {
            // Validate project ID format
            if (!isValidUUID(projectId)) {
                console.error('Invalid project ID format:', projectId)
                setSummaryError('Invalid project ID format')
                setIsLoading(false)
                return
            }

            try {
                // Load paper data from URL search parameters
                const paperData: Paper = {
                    id: paperId,
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
            } catch (error) {
                console.error('Error loading paper data:', error)
                setSummaryError('Failed to load paper data')
                setIsLoading(false)
            }
        }
        loadData()
    }, [projectId, paperId, searchParams])

    // Start summarization flow with useRef guard to prevent Strict Mode duplicates
    useEffect(() => {
        const run = async () => {
            if (!paperId) return;

            // Prevent duplicate requests in Strict Mode
            if (summarizationStartedRef.current) return;
            summarizationStartedRef.current = true;

            await startSummarizationFlow(paperId);
        };
        run();
    }, [paperId]);

    // Track ongoing requests to prevent duplicates
    const [ongoingRequest, setOngoingRequest] = useState<string | null>(null)

    // Main summarization flow
    const startSummarizationFlow = async (paperId: string, signal?: AbortSignal) => {
        // Prevent duplicate requests for the same paper
        if (ongoingRequest === paperId) {
            console.log('Request already in progress for paperId:', paperId)
            return
        }

        try {
            setOngoingRequest(paperId)
            setProcessingState('checking_summary')

            // Step 1: Check if summary already exists
            const isSummarized = await isPaperSummarized(paperId)
            if (isSummarized) {
                console.log('Paper is already summarized, fetching summary')
                const existingSummary = await getSummary(paperId)
                setSummaryData(existingSummary)
                setProcessingState('completed')
                setOngoingRequest(null)
                return
            }

            console.log('Paper is not summarized, checking status before proceeding')

            // Step 2: Check summarization status - if PROCESSING, wait for completion
            try {
                const summarizationStatus = await getSummarizationStatusOnly(paperId)
                if (summarizationStatus === 'PROCESSING') {
                    console.log('Summarization already in progress, waiting for completion')
                    setProcessingState('generating_summary')
                    await waitForSummarizationCompletion(paperId)
                    setOngoingRequest(null)
                    return
                }
            } catch (error) {
                console.error('Error checking summarization status:', error)
                // Continue with the flow even if status check fails
                console.log('Continuing with summarization flow despite status check error')
            }

            setProcessingState('checking_extraction')

            // Step 3: Check if paper is extracted
            try {
                const isExtracted = await isPaperExtracted(paperId)
                console.log('Paper extraction status:', isExtracted)

                if (!isExtracted) {
                    // Check extraction status - if PROCESSING, wait for completion
                    try {
                        const extractionStatus = await getExtractionStatusOnly(paperId)
                        if (extractionStatus === 'PROCESSING') {
                            console.log('Extraction already in progress, waiting for completion')
                            setProcessingState('extracting')
                            await waitForExtractionCompletion(paperId)
                        } else {
                            setProcessingState('extracting')
                            await triggerExtractionAndWait(paperId)
                        }
                    } catch (error) {
                        console.error('Error checking extraction status:', error)
                        // Continue with extraction even if status check fails
                        console.log('Continuing with extraction despite status check error')
                        setProcessingState('extracting')
                        await triggerExtractionAndWait(paperId)
                    }
                }
            } catch (error) {
                console.error('Error checking extraction status:', error)
                // Continue with generation even if extraction check fails
                console.log('Continuing with summary generation despite extraction check error')
            }

            setProcessingState('generating_summary')

            // Start overall timer if not already started (5 minutes total)
            if (overallTimer === 300) {
                setOverallTimer(300)
                const overallTimerInterval = setInterval(() => {
                    setOverallTimer(prev => {
                        if (prev <= 1) {
                            clearInterval(overallTimerInterval)
                            return 0
                        }
                        return prev - 1
                    })
                }, 1000)
            }

            // Start summary timer (3 minutes total: 1 min AI + 2 min generation)
            setSummaryTimer(180)
            const summaryTimerInterval = setInterval(() => {
                setSummaryTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(summaryTimerInterval)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            try {
                // Step 4: Generate summary with timeout and single-flight protection
                console.log('Starting summary generation for paperId:', paperId)
                const summary = await singleFlight(
                    `summarize:${paperId}`,
                    () => generateSummary(paperId, 90000, signal)
                )
                clearInterval(summaryTimerInterval)
                setSummaryTimer(0)
                console.log('Summary generated successfully for paperId:', paperId)
                setSummaryData(summary)
                setProcessingState('completed')
                setOngoingRequest(null)
            } catch (error) {
                clearInterval(summaryTimerInterval)
                setSummaryTimer(0)
                console.error('Error generating summary for paperId:', paperId, error)
                setOngoingRequest(null)
                throw error
            }

        } catch (error) {
            console.error('Error in summarization flow:', error)
            setSummaryError(error instanceof Error ? error.message : 'Failed to generate summary')
            setProcessingState('error')
            setOngoingRequest(null)
        }
    }

    // Wait for extraction completion
    const waitForExtractionCompletion = async (paperId: string) => {
        console.log('Waiting for extraction completion for paperId:', paperId)

        // Start overall 5-minute timer
        setOverallTimer(300)
        const overallTimerInterval = setInterval(() => {
            setOverallTimer(prev => {
                if (prev <= 1) {
                    clearInterval(overallTimerInterval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Start 2-minute extraction timer
        setExtractionTimer(120)
        const timerInterval = setInterval(() => {
            setExtractionTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerInterval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Poll extraction status until completion
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                clearInterval(pollInterval)
                clearInterval(timerInterval)
                clearInterval(overallTimerInterval)
                reject(new Error('Extraction timeout - please try again'))
            }, 300_000)

            const pollInterval = setInterval(async () => {
                try {
                    const status = await getExtractionStatus(paperId)
                    setExtractionStatus(status)

                    if (status.status === 'COMPLETED') {
                        clearTimeout(timeout)
                        clearInterval(pollInterval)
                        clearInterval(timerInterval)
                        clearInterval(overallTimerInterval)
                        setExtractionTimer(0)
                        resolve()
                    } else if (status.status === 'FAILED') {
                        clearTimeout(timeout)
                        clearInterval(pollInterval)
                        clearInterval(timerInterval)
                        clearInterval(overallTimerInterval)
                        setExtractionTimer(0)
                        reject(new Error(status.message || 'Extraction failed'))
                    }
                } catch (err) {
                    clearTimeout(timeout)
                    clearInterval(pollInterval)
                    clearInterval(timerInterval)
                    clearInterval(overallTimerInterval)
                    reject(err instanceof Error ? err : new Error(String(err)))
                }
            }, 2000)
        })
    }

    // Wait for summarization completion
    const waitForSummarizationCompletion = async (paperId: string) => {
        console.log('Waiting for summarization completion for paperId:', paperId)

        // Start 90-second timer
        setSummaryTimer(90)
        const timerInterval = setInterval(() => {
            setSummaryTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerInterval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Poll summarization status until completion
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                clearInterval(pollInterval)
                clearInterval(timerInterval)
                reject(new Error('Summarization timeout - please try again'))
            }, 90_000)

            const pollInterval = setInterval(async () => {
                try {
                    const isSummarized = await isPaperSummarized(paperId)

                    if (isSummarized) {
                        clearTimeout(timeout)
                        clearInterval(pollInterval)
                        clearInterval(timerInterval)
                        setSummaryTimer(0)

                        // Fetch the completed summary
                        const summary = await getSummary(paperId)
                        setSummaryData(summary)
                        resolve()
                    }
                } catch (err) {
                    clearTimeout(timeout)
                    clearInterval(pollInterval)
                    clearInterval(timerInterval)
                    reject(err instanceof Error ? err : new Error(String(err)))
                }
            }, 2000)
        })
    }

    // Trigger extraction and wait for completion
    const triggerExtractionAndWait = async (paperId: string) => {
        // Start extraction
        const extractionResponse = await triggerExtractionForPaper(paperId)
        setExtractionStatus(extractionResponse)

        // Start overall 5-minute timer
        setOverallTimer(300)
        const overallTimerInterval = setInterval(() => {
            setOverallTimer(prev => {
                if (prev <= 1) {
                    clearInterval(overallTimerInterval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Start 2-minute extraction timer
        setExtractionTimer(120)
        const timerInterval = setInterval(() => {
            setExtractionTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerInterval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Actively poll and resolve/reject from the fresh result
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                clearInterval(pollInterval)
                clearInterval(timerInterval)
                clearInterval(overallTimerInterval)
                reject(new Error('Extraction timeout - please try again'))
            }, 300_000)

            const pollInterval = setInterval(async () => {
                try {
                    const status = await getExtractionStatus(paperId)
                    setExtractionStatus(status)

                    if (status.status === 'COMPLETED') {
                        clearTimeout(timeout)
                        clearInterval(pollInterval)
                        clearInterval(timerInterval)
                        clearInterval(overallTimerInterval)
                        setExtractionTimer(0)
                        resolve()
                    } else if (status.status === 'FAILED') {
                        clearTimeout(timeout)
                        clearInterval(pollInterval)
                        clearInterval(timerInterval)
                        clearInterval(overallTimerInterval)
                        reject(new Error(status.error || 'Extraction failed'))
                    }
                } catch (err) {
                    clearTimeout(timeout)
                    clearInterval(pollInterval)
                    clearInterval(timerInterval)
                    clearInterval(overallTimerInterval)
                    reject(err instanceof Error ? err : new Error(String(err)))
                }
            }, 5_000)
        })
    }

    const handleRegenerateSummary = async () => {
        if (!paperId) return

        setProcessingState('generating_summary')
        setSummaryError(null)

        // Start overall 5-minute timer
        setOverallTimer(300)
        const overallTimerInterval = setInterval(() => {
            setOverallTimer(prev => {
                if (prev <= 1) {
                    clearInterval(overallTimerInterval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Start summary timer (3 minutes total: 1 min AI + 2 min generation)
        setSummaryTimer(180)
        const summaryTimerInterval = setInterval(() => {
            setSummaryTimer(prev => {
                if (prev <= 1) {
                    clearInterval(summaryTimerInterval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        try {
            const summary = await generateSummary(paperId, 90000) // 90 second timeout
            clearInterval(summaryTimerInterval)
            clearInterval(overallTimerInterval)
            setSummaryTimer(0)
            setOverallTimer(0)
            setSummaryData(summary)
            setProcessingState('completed')
        } catch (error) {
            clearInterval(summaryTimerInterval)
            clearInterval(overallTimerInterval)
            setSummaryTimer(0)
            setOverallTimer(0)
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

    const loadGalleryData = async () => {
        if (!paperId) return

        setGalleryLoading(true)
        setGalleryError(null)

        try {
            console.log('Loading gallery data for paperId:', paperId)
            const [figuresData, tablesData] = await Promise.all([
                getExtractedFigures(paperId),
                getExtractedTables(paperId)
            ])

            console.log('Gallery data loaded:', { figures: figuresData.length, tables: tablesData.length })
            setFigures(figuresData)
            setTables(tablesData)
        } catch (error) {
            console.error('Error loading gallery data:', error)
            setGalleryError(error instanceof Error ? error.message : 'Failed to load gallery data')
            // Set empty arrays on error to prevent undefined issues
            setFigures([])
            setTables([])
        } finally {
            setGalleryLoading(false)
        }
    }

    const handleRetryGallery = () => {
        loadGalleryData()
    }

    // Load gallery data when summary is completed OR when we have summary data
    useEffect(() => {
        if ((processingState === 'completed' || summaryData) && paperId) {
            loadGalleryData()
        }
    }, [processingState, summaryData, paperId])


    // Loading states - consistent loading screen regardless of processing state
    const renderLoadingState = () => {
        // Section progress (0..1)
        const pExtract = sectionProgress(overallTimer, 0, EXTRACT_DUR);
        const pAnalyze = sectionProgress(overallTimer, EXTRACT_DUR, ANALYZE_DUR);
        const pGenerate = sectionProgress(overallTimer, EXTRACT_DUR + ANALYZE_DUR, GENERATE_DUR);

        // Header state derived from section progress
        const headerState = {
            extractedDone: pExtract >= 1,
            analyzingActive: pAnalyze > 0 && pAnalyze < 1,
            analyzingDone: pAnalyze >= 1 || pGenerate > 0, // once generation starts, analysis is done
            generatingActive: pGenerate > 0 && pGenerate < 1,
            generatingDone: pGenerate >= 1,
        };

        // Subtask lists (names only)
        const extractionNames = [
            "PDF Processing", "Text Extraction", "Figure Processing", "Table Processing",
            "Equation Processing", "Code Block Processing", "Reference Processing",
            "Entity Processing", "Data Persistence"
        ];
        const analysisNames = [
            "Context Building", "Quick Take Generation", "Methods & Data Analysis",
            "Reproducibility Assessment", "Ethics & Compliance", "Context & Impact",
            "Quality Metrics", "Summary Persistence"
        ];
        const generationNames = [
            "Content Synthesis", "Quality Validation", "Final Review"
        ];

        // Subtasks with completion flags
        const extractionSubtasks = makeSubtasks(extractionNames, pExtract);
        const analysisSubtasks = makeSubtasks(analysisNames, pAnalyze);
        const generationSubtasks = makeSubtasks(generationNames, pGenerate);

        // Show the same loading screen for all processing states
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
                                className="h-12 w-12 rounded-full hover:bg-muted/50 transition-all duration-200 hover:scale-110 hover:shadow-md hover:bg-accent/20"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <h1 className="text-sm font-medium text-muted-foreground">Paper Summary</h1>
                                <p className="text-lg font-bold">AI Summary</p>
                            </div>
                        </div>

                        {/* Progress Steps with Checkmarks */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Brain className="h-4 w-4 text-blue-500 animate-pulse" />
                                <span>Processing...</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>

                            {/* Progress Steps */}
                            <div className="flex items-center gap-3 text-xs">
                                {/* Paper Loaded - always checked */}
                                <div className="flex items-center gap-1 text-green-500">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Paper Loaded</span>
                                </div>

                                <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />

                                {/* Content Extracted */}
                                <div className={`flex items-center gap-1 ${headerState.extractedDone ? 'text-green-500' : 'text-muted-foreground/50'}`}>
                                    {headerState.extractedDone ? (
                                        <CheckCircle className="h-3 w-3" />
                                    ) : (
                                        <div className="w-3 h-3 border border-muted-foreground/30 rounded-full" />
                                    )}
                                    <span>Content Extracted</span>
                                </div>

                                <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />

                                {/* AI Analyzing */}
                                <div className={`flex items-center gap-1 ${headerState.analyzingActive ? 'text-blue-500' :
                                    headerState.analyzingDone ? 'text-green-500' :
                                        'text-muted-foreground/50'
                                    }`}
                                >
                                    {headerState.analyzingActive ? (
                                        <div className="w-3 h-3 border-2 border-blue-500 rounded-full animate-spin" />
                                    ) : headerState.analyzingDone ? (
                                        <CheckCircle className="h-3 w-3" />
                                    ) : (
                                        <div className="w-3 h-3 border border-muted-foreground/30 rounded-full" />
                                    )}
                                    <span>AI Analyzing</span>
                                </div>

                                <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />

                                {/* Generating Summary */}
                                <div className={`flex items-center gap-1 ${headerState.generatingActive ? 'text-blue-500' :
                                    headerState.generatingDone ? 'text-green-500' :
                                        'text-muted-foreground/50'
                                    }`}
                                >
                                    {headerState.generatingActive ? (
                                        <div className="w-3 h-3 border-2 border-blue-500 rounded-full animate-spin" />
                                    ) : headerState.generatingDone ? (
                                        <CheckCircle className="h-3 w-3" />
                                    ) : (
                                        <div className="w-3 h-3 border border-muted-foreground/30 rounded-full" />
                                    )}
                                    <span>Generating Summary</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Main Content with Shimmer */}
                <div className="pt-6 pb-8">
                    <div className="container mx-auto px-4 py-8 max-w-none">
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
                            </motion.div>
                        )}

                        {/* AI Processing Progress */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="mb-8"
                        >
                            <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                                <div className="relative">
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <Brain className="h-6 w-6 text-blue-500 animate-pulse" />
                                        <h3 className="text-lg font-semibold text-foreground">AI Summary Generation in Progress</h3>
                                    </div>

                                    {/* Enhanced Progress Cards with Time Distribution */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        {/* Extraction Phase - 2 minutes */}
                                        <ProgressCard
                                            title="Content Extraction"
                                            description="Processing PDF and extracting structured content"
                                            icon={<FileText className="h-5 w-5" />}
                                            isActive={pExtract > 0 && pExtract < 1}
                                            isCompleted={pExtract >= 1 || processingState === 'completed'}
                                            progress={pExtract * 100}
                                            timeAllocation="2 min"
                                            subtasks={extractionSubtasks}
                                        />

                                        {/* AI Analysis Phase - 1 minute */}
                                        <ProgressCard
                                            title="AI Analysis"
                                            description="Understanding paper structure and content"
                                            icon={<Brain className="h-5 w-5" />}
                                            isActive={pAnalyze > 0 && pAnalyze < 1}
                                            isCompleted={pAnalyze >= 1 || processingState === 'completed'}
                                            progress={pAnalyze * 100}
                                            timeAllocation="1 min"
                                            subtasks={analysisSubtasks}
                                        />

                                        {/* Finalization Phase - 2 minutes */}
                                        <ProgressCard
                                            title="Summary Generation"
                                            description="Creating comprehensive analysis and finalizing"
                                            icon={<Sparkles className="h-5 w-5" />}
                                            isActive={pGenerate > 0 && pGenerate < 1}
                                            isCompleted={pGenerate >= 1 || processingState === 'completed'}
                                            progress={pGenerate * 100}
                                            timeAllocation="2 min"
                                            subtasks={generationSubtasks}
                                        />
                                    </div>

                                    {/* Overall Progress Bar */}
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">Overall Progress</span>
                                            <span className="text-sm font-mono">
                                                {overallTimer}s remaining
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-3">
                                            <div
                                                className="bg-gradient-to-r from-blue-400 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${((300 - overallTimer) / 300) * 100}%`
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                            <span>Extraction</span>
                                            <span>AI Analysis</span>
                                            <span>Finalization</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Shimmer Content */}
                        <SummaryShimmer />
                    </div>
                </div>
            </div>
        )
    }

    const LOADING_STATES: ProcessingState[] = [
        'checking_summary',
        'checking_extraction',
        'extracting',
        'generating_summary',
    ]

    if (isLoading || LOADING_STATES.includes(processingState)) {
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
                            className="h-12 w-12 rounded-full hover:bg-muted/50 transition-all duration-200 hover:scale-110 hover:shadow-md hover:bg-accent/20"
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
                                className="transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-accent/20"
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
                                className="transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-accent/20"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Regenerate</span>
                            </Button>
                        )}

                        {summaryData && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRetryGallery}
                                disabled={galleryLoading}
                                className="transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-accent/20"
                            >
                                {galleryLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Database className="mr-2 h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">Load Gallery</span>
                            </Button>
                        )}

                        {processingState === 'error' && (
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600/90 hover:to-blue-700/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => startSummarizationFlow(paperId)}
                                disabled={ongoingRequest === paperId}
                            >
                                <Zap className={`mr-2 h-4 w-4 ${ongoingRequest === paperId ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">
                                    {ongoingRequest === paperId ? 'Processing...' : 'Try Again'}
                                </span>
                            </Button>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Main Content */}
            <div className="pt-6 pb-8">
                <div className="container mx-auto px-4 py-8 max-w-none">
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
                            {/* AI-Generated Summary Header - Full Width */}
                            <Card className="border-none shadow-xl bg-gradient-to-br from-white/10 via-white/5 to-blue-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-blue-950/30 backdrop-blur-xl ring-1 ring-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:ring-blue-500/60 hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-blue-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-blue-950/40 hover:backdrop-blur-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 via-purple-500/15 via-pink-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                <CardHeader className="pb-8 pt-8">
                                    <div className="text-center space-y-6">
                                        {/* Centered Title and Logo */}
                                        <CardTitle className="text-4xl font-bold flex items-center justify-center gap-4">
                                            <Brain className="h-10 w-10 text-blue-500" />
                                            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                                AI-Generated Summary
                                            </span>
                                        </CardTitle>

                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                {/* Left Column - Main Summary */}
                                <div className="xl:col-span-2 space-y-8">
                                    {/* One-Liner Section */}
                                    {summaryData.oneLiner && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-cyan-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-cyan-950/30 backdrop-blur-xl ring-1 ring-cyan-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-cyan-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-cyan-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <Zap className="h-5 w-5 text-cyan-500" />
                                                    One-Liner
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border-l-4 border-cyan-500 transition-all duration-200 hover:bg-white/70 dark:hover:bg-gray-900/70 hover:shadow-md hover:scale-[1.01] hover:border-cyan-600">
                                                    <p className="text-gray-700 dark:text-gray-300">{summaryData.oneLiner}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Key Contributions Section */}
                                    {summaryData.keyContributions && summaryData.keyContributions.length > 0 && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-orange-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-orange-950/30 backdrop-blur-xl ring-1 ring-orange-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-orange-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-orange-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <Award className="h-5 w-5 text-orange-500" />
                                                    Key Contributions
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid gap-3">
                                                    {summaryData.keyContributions.map((contribution, index) => (
                                                        <div key={`contribution-${index}-${contribution.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-md hover:scale-[1.01]">
                                                            <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                                                {index + 1}
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{contribution}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Method Overview Section */}
                                    {summaryData.methodOverview && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-lime-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-lime-950/30 backdrop-blur-xl ring-1 ring-lime-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-lime-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-lime-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lime-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <Microscope className="h-5 w-5 text-lime-500" />
                                                    Method Overview
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 transition-all duration-200 hover:bg-white/70 dark:hover:bg-gray-900/70 hover:shadow-md hover:scale-[1.01]">
                                                    <p className="text-gray-700 dark:text-gray-300">{summaryData.methodOverview}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Applicability Section */}
                                    {summaryData.applicability && summaryData.applicability.length > 0 && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-yellow-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-yellow-950/30 backdrop-blur-xl ring-1 ring-yellow-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-yellow-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-yellow-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <Target className="h-5 w-5 text-yellow-500" />
                                                    Applicability
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid gap-2">
                                                    {summaryData.applicability.map((application, index) => (
                                                        <div key={`application-${index}-${application.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-md hover:scale-[1.01]">
                                                            <div className="w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                ✓
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{application}</p>
                                                        </div>
                                                    ))}
                                                </div>
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
                                                                <div key={`limitation-${index}-${limitation.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-red-200 dark:border-red-800 transition-all duration-200 hover:bg-white/70 dark:hover:bg-gray-900/70 hover:shadow-md hover:scale-[1.01] hover:border-red-300 dark:hover:border-red-700">
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
                                                                <div key={`future-work-${index}-${work.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-cyan-200 dark:border-cyan-800 transition-all duration-200 hover:bg-white/70 dark:hover:bg-gray-900/70 hover:shadow-md hover:scale-[1.01] hover:border-cyan-300 dark:hover:border-cyan-700">
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



                                    {/* Bias, Fairness & Risks */}
                                    {(summaryData.biasAndFairness || summaryData.risksAndMisuse || summaryData.dataRights) && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-red-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-red-950/30 backdrop-blur-xl ring-1 ring-red-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-red-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-red-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
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

                                    {/* Novelty Type */}
                                    {summaryData.noveltyType && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-lime-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-lime-950/30 backdrop-blur-xl ring-1 ring-lime-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-lime-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-lime-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lime-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <Award className="h-5 w-5 text-lime-500" />
                                                    Novelty Type
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <Badge variant="outline" className="bg-lime-100 text-lime-800 border-lime-200">
                                                    {summaryData.noveltyType}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Positioning */}
                                    {summaryData.positioning && summaryData.positioning.length > 0 && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-teal-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-teal-950/30 backdrop-blur-xl ring-1 ring-teal-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-teal-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-teal-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <Target className="h-5 w-5 text-teal-500" />
                                                    Positioning
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {summaryData.positioning.map((position, index) => (
                                                        <div key={`position-${index}-${position.slice(0, 20)}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-teal-200 dark:border-teal-800 transition-all duration-200 hover:bg-white/70 dark:hover:bg-gray-900/70 hover:shadow-md hover:scale-[1.01] hover:border-teal-300 dark:hover:border-teal-700">
                                                            <div className="w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                {index + 1}
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300">{position}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Related Works */}
                                    {summaryData.relatedWorksKey && summaryData.relatedWorksKey.length > 0 && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-blue-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-blue-950/30 backdrop-blur-xl ring-1 ring-blue-600/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-blue-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-blue-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-600/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                                    Related Works
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {summaryData.relatedWorksKey.map((work, index) => (
                                                        <div key={`related-work-${index}-${work.citation || 'work'}`} className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200 dark:border-blue-800 transition-all duration-200 hover:bg-white/70 dark:hover:bg-gray-900/70 hover:shadow-md hover:scale-[1.01] hover:border-blue-300 dark:hover:border-blue-700">
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
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Impact Notes */}
                                    {summaryData.impactNotes && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-gray-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-gray-950/30 backdrop-blur-xl ring-1 ring-gray-400/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-gray-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-gray-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <Lightbulb className="h-5 w-5 text-gray-400" />
                                                    Impact Notes
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border-l-4 border-gray-400 transition-all duration-200 hover:bg-white/70 dark:hover:bg-gray-900/70 hover:shadow-md hover:scale-[1.01] hover:border-gray-500">
                                                    <p className="text-gray-700 dark:text-gray-300">{summaryData.impactNotes}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}




                                </div>

                                {/* Right Column - Sidebar Info */}
                                <div className="space-y-6">
                                    {/* Study Type */}
                                    <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-violet-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-violet-950/30 backdrop-blur-xl ring-1 ring-violet-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-violet-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-violet-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <BarChart3 className="h-5 w-5 text-violet-500" />
                                                Study Overview
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {summaryData.studyType && (
                                                <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                                                    <span className="text-sm font-medium">Study Type</span>
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                        {summaryData.studyType}
                                                    </Badge>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Main Findings */}
                                    {summaryData.mainFindings && summaryData.mainFindings.length > 0 && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-yellow-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-yellow-950/30 backdrop-blur-xl ring-1 ring-yellow-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-yellow-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-yellow-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                                                    Main Findings
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {summaryData.mainFindings.map((finding, index) => (
                                                        <div key={`finding-${index}`} className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border-l-4 border-yellow-500">
                                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                                {finding.task && (
                                                                    <div>
                                                                        <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                                            <ClipboardList className="h-3 w-3 text-blue-500" />
                                                                            Task:
                                                                        </span>
                                                                        <p className="text-gray-900 dark:text-gray-100">{finding.task}</p>
                                                                    </div>
                                                                )}
                                                                {finding.metric && (
                                                                    <div>
                                                                        <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                                            <Activity className="h-3 w-3 text-green-500" />
                                                                            Metric:
                                                                        </span>
                                                                        <p className="text-gray-900 dark:text-gray-100">{finding.metric}</p>
                                                                    </div>
                                                                )}
                                                                {finding.value && (
                                                                    <div className="col-span-2">
                                                                        <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                                            <Target className="h-3 w-3 text-purple-500" />
                                                                            Value:
                                                                        </span>
                                                                        <p className="text-gray-900 dark:text-gray-100">{finding.value}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}


                                    {/* Research Questions */}
                                    {summaryData.researchQuestions && summaryData.researchQuestions.length > 0 && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-indigo-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-indigo-950/30 backdrop-blur-xl ring-1 ring-indigo-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-indigo-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-indigo-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <Lightbulb className="h-5 w-5 text-indigo-500" />
                                                    Research Questions
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {summaryData.researchQuestions.map((question, index) => (
                                                        <div key={`question-${index}`} className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border-l-4 border-indigo-500 transition-all duration-200 hover:bg-white/70 dark:hover:bg-gray-900/70 hover:shadow-md hover:scale-[1.01] hover:border-indigo-600">
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{question}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Datasets */}
                                    {summaryData.datasets && summaryData.datasets.length > 0 && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-emerald-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-emerald-950/30 backdrop-blur-xl ring-1 ring-emerald-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-emerald-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-emerald-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <Database className="h-5 w-5 text-emerald-500" />
                                                    Datasets
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {summaryData.datasets.map((dataset, index) => (
                                                        <div key={`dataset-${index}`} className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                                                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                                                                {dataset.name || `Dataset ${index + 1}`}
                                                            </div>
                                                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                                {dataset.domain}
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                {dataset.description}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Metrics */}
                                    {summaryData.metrics && summaryData.metrics.length > 0 && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-purple-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-purple-950/30 backdrop-blur-xl ring-1 ring-purple-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-purple-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-purple-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <BarChart3 className="h-5 w-5 text-purple-500" />
                                                    Key Metrics
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {summaryData.metrics.map((metric, index) => (
                                                        <div key={`metric-${index}`} className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                                                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                                                                {metric.name}
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                {metric.definition}
                                                            </p>
                                                            {metric.interpretation && (
                                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                                    {metric.interpretation}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Future Work */}
                                    {summaryData.futureWork && summaryData.futureWork.length > 0 && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-blue-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-blue-950/30 backdrop-blur-xl ring-1 ring-blue-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-blue-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-blue-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <GitBranch className="h-5 w-5 text-blue-500" />
                                                    Future Work
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {summaryData.futureWork.map((work, index) => (
                                                        <div key={`future-${index}`} className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border-l-4 border-blue-500">
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{work}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Technical Details - Moved to Right Column */}
                                    {(summaryData.implementationDetails || summaryData.computeResources) && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-indigo-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-indigo-950/30 backdrop-blur-xl ring-1 ring-indigo-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-indigo-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-indigo-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <Settings className="h-5 w-5 text-indigo-500" />
                                                    Technical Details
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {summaryData.implementationDetails && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                            <Code className="h-4 w-4 text-indigo-500" />
                                                            Implementation
                                                        </h4>
                                                        <div className="space-y-2 text-sm">
                                                            {summaryData.implementationDetails.frameworks && (
                                                                <div>
                                                                    <span className="font-medium text-indigo-700 dark:text-indigo-300">Frameworks:</span>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {summaryData.implementationDetails.frameworks.slice(0, 3).map((framework, index) => (
                                                                            <Badge key={`framework-${index}`} variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                                                                                {framework}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {summaryData.implementationDetails.language && (
                                                                <div>
                                                                    <span className="font-medium text-indigo-700 dark:text-indigo-300">Language:</span>
                                                                    <p className="text-gray-700 dark:text-gray-300">{summaryData.implementationDetails.language}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {summaryData.computeResources && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                            <Server className="h-4 w-4 text-purple-500" />
                                                            Compute
                                                        </h4>
                                                        <div className="space-y-2 text-sm">
                                                            {summaryData.computeResources.hardware && (
                                                                <div>
                                                                    <span className="font-medium text-purple-700 dark:text-purple-300">Hardware:</span>
                                                                    <p className="text-gray-700 dark:text-gray-300">{summaryData.computeResources.hardware}</p>
                                                                </div>
                                                            )}
                                                            {summaryData.computeResources.trainingTime && (
                                                                <div>
                                                                    <span className="font-medium text-purple-700 dark:text-purple-300">Training Time:</span>
                                                                    <p className="text-gray-700 dark:text-gray-300">{summaryData.computeResources.trainingTime}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Reproducibility - Moved to Right Column */}
                                    {(summaryData.artifacts || summaryData.reproducibilityNotes || summaryData.reproScore !== undefined) && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-lime-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-lime-950/30 backdrop-blur-xl ring-1 ring-lime-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-lime-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-lime-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lime-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <RefreshCw className="h-5 w-5 text-lime-500" />
                                                    Reproducibility
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {summaryData.reproScore !== undefined && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Score</span>
                                                            <span className="text-lg font-bold text-lime-600 dark:text-lime-400">
                                                                {Math.round(summaryData.reproScore * 100)}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                            <div
                                                                className="bg-gradient-to-r from-lime-400 to-lime-600 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${summaryData.reproScore * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {summaryData.reproducibilityNotes && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Notes</h4>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">{summaryData.reproducibilityNotes}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Ethics - Moved to Right Column */}
                                    {summaryData.ethics && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-gray-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-gray-950/30 backdrop-blur-xl ring-1 ring-gray-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-gray-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-gray-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <Shield className="h-5 w-5 text-gray-500" />
                                                    Ethics & Compliance
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {summaryData.ethics.irb !== undefined && (
                                                        <div className="flex items-center gap-2">
                                                            {summaryData.ethics.irb ? (
                                                                <CheckCircle className="h-4 w-4 text-gray-500" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4 text-red-500" />
                                                            )}
                                                            <span className="text-sm">IRB Approval</span>
                                                        </div>
                                                    )}
                                                    {summaryData.ethics.consent !== undefined && (
                                                        <div className="flex items-center gap-2">
                                                            {summaryData.ethics.consent ? (
                                                                <CheckCircle className="h-4 w-4 text-gray-500" />
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
                                                            <span className="text-sm">Sensitive Data</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Domain & Technical Details - Moved to Right Column */}
                                    {(summaryData.domainClassification || summaryData.technicalDepth || summaryData.interdisciplinaryConnections) && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-fuchsia-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-fuchsia-950/30 backdrop-blur-xl ring-1 ring-fuchsia-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-fuchsia-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-fuchsia-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fuchsia-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <Microscope className="h-5 w-5 text-fuchsia-500" />
                                                    Domain & Technical
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {summaryData.domainClassification && summaryData.domainClassification.length > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                            <BookOpen className="h-4 w-4 text-fuchsia-500" />
                                                            Domains
                                                        </h4>
                                                        <div className="flex flex-wrap gap-1">
                                                            {summaryData.domainClassification.slice(0, 3).map((domain, index) => (
                                                                <Badge key={`domain-${index}`} variant="outline" className="bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 text-xs">
                                                                    {domain}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {summaryData.technicalDepth && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                            <Cpu className="h-4 w-4 text-fuchsia-500" />
                                                            Technical Depth
                                                        </h4>
                                                        <Badge variant="outline" className="bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200">
                                                            {summaryData.technicalDepth}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Additional Method Details - Moved to Right Column */}
                                    {(summaryData.participants || summaryData.procedureOrPipeline || summaryData.baselinesOrControls || summaryData.statisticalAnalysis) && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-yellow-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-yellow-950/30 backdrop-blur-xl ring-1 ring-yellow-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-yellow-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-yellow-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <TestTube className="h-5 w-5 text-yellow-500" />
                                                    Method Details
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {summaryData.participants && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Participants</h4>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                                            {typeof summaryData.participants === 'string'
                                                                ? summaryData.participants
                                                                : `Sample size: ${summaryData.participants.n || 'N/A'}`}
                                                        </p>
                                                    </div>
                                                )}
                                                {summaryData.procedureOrPipeline && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Procedure</h4>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">{summaryData.procedureOrPipeline}</p>
                                                    </div>
                                                )}
                                                {summaryData.baselinesOrControls && summaryData.baselinesOrControls.length > 0 && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Baselines</h4>
                                                        <div className="space-y-1">
                                                            {summaryData.baselinesOrControls.slice(0, 2).map((baseline, index) => (
                                                                <p key={`baseline-${index}`} className="text-sm text-gray-700 dark:text-gray-300">• {baseline}</p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {summaryData.statisticalAnalysis && summaryData.statisticalAnalysis.length > 0 && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Statistical Analysis</h4>
                                                        <div className="space-y-1">
                                                            {summaryData.statisticalAnalysis.slice(0, 2).map((analysis, index) => (
                                                                <p key={`analysis-${index}`} className="text-sm text-gray-700 dark:text-gray-300">• {analysis}</p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Generation Metadata - Moved to Right Column */}
                                    {(summaryData.modelVersion || summaryData.generationTimestamp || summaryData.generationTimeSeconds || summaryData.promptTokens || summaryData.completionTokens) && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-gray-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-gray-950/30 backdrop-blur-xl ring-1 ring-gray-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-gray-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-gray-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <Cpu className="h-5 w-5 text-gray-500" />
                                                    Generation Metadata
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {summaryData.modelVersion && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Model Version</span>
                                                        <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">{summaryData.modelVersion}</p>
                                                    </div>
                                                )}
                                                {summaryData.responseSource && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Response Source</span>
                                                        <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">{summaryData.responseSource}</p>
                                                    </div>
                                                )}
                                                {summaryData.generationTimeSeconds && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Generation Time</span>
                                                        <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">{summaryData.generationTimeSeconds.toFixed(2)}s</p>
                                                    </div>
                                                )}
                                                {summaryData.generationTimestamp && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Generated At</span>
                                                        <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">{new Date(summaryData.generationTimestamp).toLocaleString()}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Threats to Validity - Moved to Right Column */}
                                    {summaryData.threatsToValidity && summaryData.threatsToValidity.length > 0 && (
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-red-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-red-950/30 backdrop-blur-xl ring-1 ring-red-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-red-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-red-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                                    Threats to Validity
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {summaryData.threatsToValidity.map((threat, index) => (
                                                        <div key={`threat-${index}`} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-red-200 dark:border-red-800">
                                                            <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                                !
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{threat}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>

                            {/* Quality & Trust - Full Width */}
                            {(summaryData.evidenceAnchors || summaryData.threatsToValidity || summaryData.confidence || summaryData.validationStatus) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-8"
                                >
                                    <Card className="border-none shadow-lg bg-gradient-to-br from-white/10 via-white/5 to-cyan-50/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-cyan-950/30 backdrop-blur-xl ring-1 ring-cyan-500/30 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/10 hover:to-cyan-50/30 dark:hover:from-gray-900/30 dark:hover:via-gray-900/20 dark:hover:to-cyan-950/40 hover:backdrop-blur-2xl relative overflow-hidden group hover:-translate-y-1">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-2xl">
                                                <CheckCircle className="h-6 w-6 text-cyan-500" />
                                                Quality & Trust
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-8">
                                            {/* Overall Confidence & Validation */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                {summaryData.confidence && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-6">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                            <Target className="h-5 w-5 text-cyan-500" />
                                                            Overall Confidence
                                                        </h4>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                                                <div
                                                                    className="bg-gradient-to-r from-cyan-400 to-cyan-600 h-4 rounded-full transition-all duration-300"
                                                                    style={{ width: `${summaryData.confidence * 100}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                                                                {Math.round(summaryData.confidence * 100)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {summaryData.validationStatus && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-6">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                            <Shield className="h-5 w-5 text-green-500" />
                                                            Validation Status
                                                        </h4>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-lg px-4 py-2 ${summaryData.validationStatus === 'VALIDATED'
                                                                ? 'bg-green-100 text-green-800 border-green-200'
                                                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                                }`}
                                                        >
                                                            {summaryData.validationStatus}
                                                        </Badge>
                                                    </div>
                                                )}
                                                {summaryData.evidenceAnchors && summaryData.evidenceAnchors.length > 0 && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-6">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                            <Database className="h-5 w-5 text-blue-500" />
                                                            Evidence Anchors
                                                        </h4>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                                {summaryData.evidenceAnchors.length}
                                                            </span>
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Anchors</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {summaryData.threatsToValidity && summaryData.threatsToValidity.length > 0 && (
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-6">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                                                            Threats Identified
                                                        </h4>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                                                {summaryData.threatsToValidity.length}
                                                            </span>
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Threats</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Evidence Anchors - Full Width Table */}
                                            {summaryData.evidenceAnchors && summaryData.evidenceAnchors.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2 text-lg">
                                                        <Database className="h-5 w-5 text-cyan-500" />
                                                        Evidence Anchors ({summaryData.evidenceAnchors.length})
                                                    </h4>
                                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg overflow-hidden">
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full">
                                                                <thead className="bg-gray-100 dark:bg-gray-800">
                                                                    <tr>
                                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Field</th>
                                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Page</th>
                                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Confidence</th>
                                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Source</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                    {summaryData.evidenceAnchors.slice(0, showAllAnchors ? summaryData.evidenceAnchors.length : 5).map((anchor, index) => (
                                                                        <tr key={`anchor-${index}-${anchor.sourceId || 'anchor'}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 hover:shadow-sm hover:scale-[1.01]">
                                                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{anchor.field || '-'}</td>
                                                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{anchor.page || '-'}</td>
                                                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                                                {anchor.confidence ? `${Math.round(anchor.confidence * 100)}%` : '-'}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{anchor.source || '-'}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        {summaryData.evidenceAnchors.length > 5 && (
                                                            <div className="text-center bg-gray-50 dark:bg-gray-800/50 p-4">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setShowAllAnchors(!showAllAnchors)}
                                                                    className="flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-accent/20"
                                                                >
                                                                    {showAllAnchors ? (
                                                                        <>
                                                                            <span>Show Less</span>
                                                                            <span className="text-xs">({summaryData.evidenceAnchors.length - 5} hidden)</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <span>Show More</span>
                                                                            <span className="text-xs">({summaryData.evidenceAnchors.length - 5} more)</span>
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Validation Notes */}
                                            {summaryData.validationNotes && (
                                                <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-6">
                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2 text-lg">
                                                        <FileText className="h-5 w-5 text-blue-500" />
                                                        Validation Notes
                                                    </h4>
                                                    <p className="text-gray-700 dark:text-gray-300">{summaryData.validationNotes}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Paper Galleries Section */}
                            {summaryData && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="space-y-12 mt-12"
                                >
                                    {/* Figures Gallery */}
                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-2xl p-8">
                                        {galleryLoading ? (
                                            <div className="text-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                                                <p className="text-muted-foreground">Loading figures...</p>
                                            </div>
                                        ) : galleryError ? (
                                            <div className="text-center py-8">
                                                <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
                                                <p className="text-red-600 dark:text-red-400 mb-4">Failed to load figures: {galleryError}</p>
                                                <Button onClick={handleRetryGallery} variant="outline" size="sm">
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Retry
                                                </Button>
                                            </div>
                                        ) : (
                                            <FigureGallery figures={figures} paperId={paperId} />
                                        )}
                                    </div>

                                    {/* Tables Gallery */}
                                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-2xl p-8">
                                        {galleryLoading ? (
                                            <div className="text-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                                                <p className="text-muted-foreground">Loading tables...</p>
                                            </div>
                                        ) : galleryError ? (
                                            <div className="text-center py-8">
                                                <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
                                                <p className="text-red-600 dark:text-red-400 mb-4">Failed to load tables: {galleryError}</p>
                                                <Button onClick={handleRetryGallery} variant="outline" size="sm">
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Retry
                                                </Button>
                                            </div>
                                        ) : (
                                            <TableGallery tables={tables} paperId={paperId} />
                                        )}
                                    </div>
                                </motion.div>
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
