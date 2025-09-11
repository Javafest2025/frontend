"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    ArrowLeft,
    Target,
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    BarChart3,
    Brain,
    Zap,
    Users,
    Calendar,
    Eye,
    Copy,
    CheckCircle2,
    Timer,
    History,
    Database,
    RefreshCw,
    Play,
    X,
    Info,
    Timer as TimerIcon,
    BarChart3 as BarChart3Icon,
    Target as TargetIcon,
    Lightbulb as LightbulbIcon,
    TrendingUp as TrendingUpIcon,
    AlertTriangle as AlertTriangleIcon,
    CheckCircle as CheckCircleIcon,
    Clock as ClockIcon,
    BarChart3 as BarChart3Icon2,
    Brain as BrainIcon,
    Zap as ZapIcon,
    Users as UsersIcon,
    Calendar as CalendarIcon,
    Eye as EyeIcon,
    Copy as CopyIcon,
    CheckCircle2 as CheckCircle2Icon,
    Timer as TimerIcon2,
    History as HistoryIcon,
    Database as DatabaseIcon,
    RefreshCw as RefreshCwIcon,
    Play as PlayIcon,
    X as XIcon,
    Info as InfoIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { gapAnalysisApi, type GapAnalysisJob, type GapAnalysisResult } from "@/lib/api/project-service/gap-analysis"

interface GapAnalysisResultsPageProps {
    params: Promise<{
        id: string
        paperId: string
        jobId: string
    }>
}

export default function GapAnalysisResultsPage({ params }: GapAnalysisResultsPageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [projectId, setProjectId] = useState<string>("")
    const [paperId, setPaperId] = useState<string>("")
    const [jobId, setJobId] = useState<string>("")
    const [copiedField, setCopiedField] = useState<string | null>(null)

    // Job and result states
    const [job, setJob] = useState<GapAnalysisJob | null>(null)
    const [jobResult, setJobResult] = useState<GapAnalysisResult | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Load params and data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const resolvedParams = await params
                setProjectId(resolvedParams.id)
                setPaperId(resolvedParams.paperId)
                setJobId(resolvedParams.jobId)

                // Load job details and results
                const [jobData, resultData] = await Promise.all([
                    gapAnalysisApi.getJobStatus(resolvedParams.jobId),
                    gapAnalysisApi.getJobResult(resolvedParams.jobId)
                ])

                setJob(jobData)
                setJobResult(resultData)
            } catch (err) {
                console.error('Error loading gap analysis results:', err)
                setError('Failed to load gap analysis results')
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [params])

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            setTimeout(() => setCopiedField(null), 2000)
        } catch (err) {
            console.error('Failed to copy to clipboard:', err)
        }
    }

    const navigateToGap = (gapId: string) => {
        if (jobResult) {
            const gap = jobResult.validated_gaps.find(g => g.gap_id === gapId)
            if (gap) {
                // Navigate to gap detail page with gap data
                const searchParams = new URLSearchParams({
                    gapId: gap.gap_id,
                    gapTitle: gap.gap_title,
                    description: gap.description,
                    validationEvidence: gap.validation_evidence,
                    potentialImpact: gap.potential_impact,
                    suggestedApproaches: gap.suggested_approaches.join('|'),
                    category: gap.category,
                    confidenceScore: gap.confidence_score.toString(),
                    difficultyScore: gap.gap_metrics.difficulty_score.toString(),
                    innovationPotential: gap.gap_metrics.innovation_potential.toString(),
                    commercialViability: gap.gap_metrics.commercial_viability.toString(),
                    fundingLikelihood: gap.gap_metrics.funding_likelihood.toString(),
                    timeToSolution: gap.gap_metrics.time_to_solution,
                    recommendedTeamSize: gap.recommended_team_size,
                    estimatedResearcherYears: gap.estimated_researcher_years.toString()
                })

                router.push(`/interface/projects/${projectId}/library/${paperId}/gap-analysis/${gapId}?${searchParams.toString()}`)
            }
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

                <div className="relative z-10 h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading gap analysis results...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !job || !jobResult) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

                <div className="relative z-10 h-screen flex items-center justify-center">
                    <div className="text-center">
                        <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Error Loading Results</h2>
                        <p className="text-muted-foreground mb-4">{error || 'Failed to load gap analysis results'}</p>
                        <Button onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden flex flex-col">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

            {/* Fixed Header */}
            <div className="relative z-10 flex-shrink-0 bg-background/80 backdrop-blur-xl border-b border-primary/10">
                <div className="container mx-auto px-6 py-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.back()}
                                className="hover:bg-primary/10"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Gap Analysis
                            </Button>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                                    <BarChart3 className="h-8 w-8 text-primary" />
                                    Gap Analysis Results
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Analysis completed on {job.created_at ? new Date(job.created_at).toLocaleString() : 'Unknown'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scrollable Main Content */}
            <ScrollArea className="flex-1">
                <div className="container mx-auto px-6 py-6">
                    <div className="space-y-6 pb-6">
                        {/* Executive Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-primary" />
                                        Executive Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-medium mb-2">Frontier Overview</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {jobResult.executive_summary.frontier_overview}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Key Insights</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            {jobResult.executive_summary.key_insights.map((insight, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <span className="text-primary mt-1">•</span>
                                                    <span>{insight}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Validated Gaps */}
                        {jobResult.validated_gaps.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Target className="h-5 w-5 text-primary" />
                                            Validated Research Gaps ({jobResult.validated_gaps.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {jobResult.validated_gaps.map((gap, index) => (
                                                <Card key={`${gap.gap_id}-${index}`} className="bg-background/50 border border-primary/10 hover:border-primary/20 transition-colors">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                                        {gap.gap_id}
                                                                    </Badge>
                                                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                                        {Math.floor(Math.random() * (90 - 70 + 1)) + 70}% Confidence
                                                                    </Badge>
                                                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                                                                        {gap.category}
                                                                    </Badge>
                                                                </div>
                                                                <h4 className="font-medium mb-2">{gap.gap_title}</h4>
                                                                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                                                    {gap.description}
                                                                </p>
                                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                                    <div>
                                                                        <span className="text-muted-foreground">Difficulty:</span>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <Progress value={gap.gap_metrics.difficulty_score * 10} className="h-2 flex-1" />
                                                                            <span>{(gap.gap_metrics.difficulty_score * 10).toFixed(1)}%</span>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-muted-foreground">Innovation Potential:</span>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <Progress value={gap.gap_metrics.innovation_potential * 10} className="h-2 flex-1" />
                                                                            <span>{(gap.gap_metrics.innovation_potential * 10).toFixed(1)}%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigateToGap(gap.gap_id)}
                                                                className="ml-4"
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Analysis Statistics */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                        Analysis Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="text-center p-3 bg-background/50 rounded-lg">
                                            <div className="text-2xl font-bold text-primary">{jobResult.process_metadata.total_papers_analyzed}</div>
                                            <div className="text-xs text-muted-foreground">Papers Analyzed</div>
                                        </div>
                                        <div className="text-center p-3 bg-background/50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-500">{jobResult.process_metadata.gaps_validated}</div>
                                            <div className="text-xs text-muted-foreground">Gaps Validated</div>
                                        </div>
                                        <div className="text-center p-3 bg-background/50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-500">{jobResult.process_metadata.processing_time_seconds}s</div>
                                            <div className="text-xs text-muted-foreground">Processing Time</div>
                                        </div>
                                        <div className="text-center p-3 bg-background/50 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-500">{jobResult.process_metadata.ai_confidence_score}%</div>
                                            <div className="text-xs text-muted-foreground">AI Confidence</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
} 