"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    ArrowLeft,
    FileText,
    Users,
    Calendar,
    Download,
    Loader2,
    Brain,
    Target,
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    BarChart3,
    Search,
    BookOpen,
    Zap,
    ExternalLink,
    Copy,
    CheckCircle2,
    Database,
    RefreshCw,
    Play,
    X,
    Eye,
    Info,
    Timer,
    History,
    Plus,
    View
} from "lucide-react"
import { cn } from "@/lib/utils"
import { downloadPdfWithAuth } from "@/lib/api/pdf"
import { gapAnalysisApi, type GapAnalysisJob, type GapAnalysisResult, type ValidatedGap } from "@/lib/api/gap-analysis"
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
    const [copiedField, setCopiedField] = useState<string | null>(null)

    // Job management states
    const [jobs, setJobs] = useState<GapAnalysisJob[]>([])
    const [isLoadingJobs, setIsLoadingJobs] = useState(true)
    const [selectedJob, setSelectedJob] = useState<GapAnalysisJob | null>(null)
    const [jobResults, setJobResults] = useState<Record<string, GapAnalysisResult>>({})
    const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set())
    const [jobTimers, setJobTimers] = useState<Record<string, number>>({})
    const [jobLimit, setJobLimit] = useState<number>(20)
    const [jobLimitInput, setJobLimitInput] = useState<string>("20")

    // Configuration dialog states
    const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
    const [configForm, setConfigForm] = useState({
        max_papers: 6,
        validation_threshold: 1
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
                venue: searchParams.get('venueName') || ''
            }

            setPaper(paperData)
            await loadRecentJobs()
        }

        loadData()
    }, [params, searchParams])

    const loadRecentJobs = async () => {
        try {
            setIsLoadingJobs(true)
            const recentJobs = await gapAnalysisApi.listRecentJobs(jobLimit)

            // Filter jobs to only show those for the current paper
            const filteredJobs = recentJobs.filter(job => {
                // Only show jobs that match the current paper's PDF URL
                return job.url === paper?.pdfContentUrl
            })

            setJobs(filteredJobs)

            // Start polling for running jobs (only for filtered jobs)
            const runningJobIds = filteredJobs
                .filter(job => job.status === 'running' || job.status === 'pending')
                .map(job => job.job_id)

            setPollingJobs(new Set(runningJobIds))

            // Initialize timers for running jobs
            const newTimers: Record<string, number> = {}
            filteredJobs.forEach(job => {
                if (job.status === 'running') {
                    newTimers[job.job_id] = 0
                }
            })
            setJobTimers(newTimers)
        } catch (error) {
            console.error('Error loading recent jobs:', error)
        } finally {
            setIsLoadingJobs(false)
        }
    }

    const pollJobStatus = async (jobId: string) => {
        try {
            const updatedJob = await gapAnalysisApi.getJobStatus(jobId)

            setJobs(prev => prev.map(job =>
                job.job_id === jobId ? updatedJob : job
            ))

            // If job completed, get results and stop polling
            if (updatedJob.status === 'completed') {
                try {
                    const result = await gapAnalysisApi.getJobResult(jobId)
                    setJobResults(prev => ({ ...prev, [jobId]: result }))
                } catch (error) {
                    console.error('Error fetching job result:', error)
                }

                setPollingJobs(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(jobId)
                    return newSet
                })
            }

            // If job failed, stop polling
            if (updatedJob.status === 'failed') {
                setPollingJobs(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(jobId)
                    return newSet
                })
            }
        } catch (error) {
            console.error('Error polling job status:', error)
        }
    }

    const handleSubmitGapAnalysis = async () => {
        if (!paper?.pdfContentUrl || isSubmitting) return

        setIsSubmitting(true)
        try {
            const job = await gapAnalysisApi.submitGapAnalysis({
                url: paper.pdfContentUrl,
                max_papers: configForm.max_papers,
                validation_threshold: configForm.validation_threshold
            })

            // Add new job to the list
            setJobs(prev => [job, ...prev])

            // Start polling for this job
            setPollingJobs(prev => new Set([...prev, job.job_id]))

            // Initialize timer
            setJobTimers(prev => ({ ...prev, [job.job_id]: 0 }))

            // Close dialog and reset form
            setIsConfigDialogOpen(false)
            setConfigForm({ max_papers: 6, validation_threshold: 1 })
        } catch (error) {
            console.error('Error submitting gap analysis:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelJob = async (jobId: string) => {
        try {
            await gapAnalysisApi.cancelJob(jobId)

            // Update job status
            setJobs(prev => prev.map(job =>
                job.job_id === jobId ? { ...job, status: 'failed' as const } : job
            ))

            // Stop polling
            setPollingJobs(prev => {
                const newSet = new Set(prev)
                newSet.delete(jobId)
                return newSet
            })
        } catch (error) {
            console.error('Error canceling job:', error)
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

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            setTimeout(() => setCopiedField(null), 2000)
        } catch (err) {
            console.error('Failed to copy to clipboard:', err)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'running': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20'
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
            case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
            default: return <Clock className="h-4 w-4 text-gray-500" />
        }
    }

    const navigateToGap = (gapId: string, jobId: string) => {
        const result = jobResults[jobId]
        if (result) {
            const gap = result.validated_gaps.find(g => g.gap_id === gapId)
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

    const handleViewJobResult = async (jobId: string) => {
        // Navigate to the dedicated results page
        router.push(`/interface/projects/${projectId}/library/${paperId}/gap-analysis/results/${jobId}`)
    }

    // Polling effect
    useEffect(() => {
        const interval = setInterval(() => {
            pollingJobs.forEach(jobId => {
                pollJobStatus(jobId)
                setJobTimers(prev => ({
                    ...prev,
                    [jobId]: (prev[jobId] || 0) + 1
                }))
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [pollingJobs])

    return (
        <div className="h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden flex flex-col">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

            {/* Fixed Header */}
            <div className="relative z-10 flex-shrink-0 bg-background/80 backdrop-blur-xl border-b border-primary/10">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="hover:bg-primary/10"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                                <Target className="h-8 w-8 text-primary" />
                                Gap Analysis
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Research gaps and opportunities identified in this paper
                            </p>
                        </div>
                        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
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
                                            value={configForm.max_papers}
                                            onChange={(e) => setConfigForm(prev => ({ ...prev, max_papers: parseInt(e.target.value) || 6 }))}
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
                                            value={configForm.validation_threshold}
                                            onChange={(e) => setConfigForm(prev => ({ ...prev, validation_threshold: parseInt(e.target.value) || 1 }))}
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
                </div>
            </div>

            {/* Scrollable Main Content */}
            <ScrollArea className="flex-1">
                <div className="container mx-auto px-6 py-6">
                    {/* Paper Info Card */}
                    {paper && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="mb-6"
                        >
                            <Card className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 shadow-xl">
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Side - Gap Results */}
                        <div className="lg:col-span-2 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <Card className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 shadow-xl">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-primary" />
                                            Gap Analysis Results
                                        </CardTitle>
                                        <CardDescription>
                                            {jobs.filter(job => job.status === 'completed' && jobResults[job.job_id]).length > 0
                                                ? `Found ${jobs.filter(job => job.status === 'completed' && jobResults[job.job_id]).reduce((acc, job) => acc + (jobResults[job.job_id]?.validated_gaps.length || 0), 0)} validated gaps`
                                                : 'No completed analyses yet. Start a new gap analysis to see results.'
                                            }
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {jobs.filter(job => job.status === 'completed' && jobResults[job.job_id]).length === 0 ? (
                                            <div className="text-center py-12">
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
                                            <div className="space-y-4">
                                                {jobs
                                                    .filter(job => job.status === 'completed' && jobResults[job.job_id])
                                                    .map(job => (
                                                        <div key={job.job_id} className="space-y-3">
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <History className="h-4 w-4" />
                                                                Analysis completed {new Date(job.completed_at || '').toLocaleString()}
                                                            </div>
                                                            <div className="grid gap-4 p-2 border-l-2 border-primary/10">
                                                                {jobResults[job.job_id]?.validated_gaps.map((gap) => (
                                                                    <Card key={`${job.job_id}-${gap.gap_id}`} className="bg-muted/30 border-2 border-primary/15 hover:border-primary/30 transition-colors">
                                                                        <CardContent className="p-4">
                                                                            <div className="flex items-start justify-between">
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2 mb-2">
                                                                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                                                            {gap.gap_id}
                                                                                        </Badge>
                                                                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                                                            {gap.confidence_score}% Confidence
                                                                                        </Badge>
                                                                                    </div>
                                                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                                                        {gap.description}
                                                                                    </p>
                                                                                </div>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => navigateToGap(gap.gap_id, job.job_id)}
                                                                                    className="ml-4"
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
                                                    ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Right Side - Job List */}
                        <div className="space-y-6 border-l-2 border-primary/20 pl-6">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                <Card className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 shadow-xl">
                                    <CardHeader className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <History className="h-5 w-5 text-primary" />
                                                Recent Jobs
                                            </CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={loadRecentJobs}
                                                disabled={isLoadingJobs}
                                            >
                                                <RefreshCw className={`h-4 w-4 ${isLoadingJobs ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </div>

                                        {/* Job Limit Input */}
                                        <div className="flex items-center gap-3">
                                            <Label htmlFor="job-limit" className="text-sm font-medium whitespace-nowrap">
                                                Show Jobs:
                                            </Label>
                                            <Input
                                                id="job-limit"
                                                type="number"
                                                min="5"
                                                max="100"
                                                value={jobLimitInput}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    setJobLimitInput(value)
                                                    const numValue = parseInt(value) || 20
                                                    const clampedValue = Math.min(Math.max(numValue, 5), 100)
                                                    if (clampedValue !== jobLimit) {
                                                        setJobLimit(clampedValue)
                                                    }
                                                }}
                                                onBlur={() => {
                                                    const numValue = parseInt(jobLimitInput) || 20
                                                    const clampedValue = Math.min(Math.max(numValue, 5), 100)
                                                    setJobLimitInput(clampedValue.toString())
                                                    setJobLimit(clampedValue)
                                                }}
                                                className="h-8 w-20 text-sm"
                                                placeholder="20"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                (5-100)
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {isLoadingJobs ? (
                                            <div className="p-4 space-y-3">
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="space-y-2">
                                                        <Skeleton className="h-4 w-full" />
                                                        <Skeleton className="h-3 w-3/4" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : jobs.length === 0 ? (
                                            <div className="text-center py-8">
                                                <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                                <p className="text-sm text-muted-foreground">No jobs found</p>
                                            </div>
                                        ) : (
                                            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/30">
                                                <div className="space-y-4 p-4 border-l-2 border-primary/10">
                                                    {jobs.map((job) => (
                                                        <Card key={job.job_id} className="bg-muted/30 border-2 border-primary/15">
                                                            <CardContent className="p-3">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            {getStatusIcon(job.status)}
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={cn("text-xs", getStatusColor(job.status))}
                                                                            >
                                                                                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                                                            </Badge>
                                                                        </div>
                                                                        {job.status === 'running' && (
                                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                                <Timer className="h-3 w-3" />
                                                                                {formatTime(jobTimers[job.job_id] || 0)}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {job.progress_message && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {job.progress_message}
                                                                        </p>
                                                                    )}

                                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                        <span>
                                                                            {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Unknown'}
                                                                        </span>
                                                                        <div className="flex items-center gap-1">
                                                                            {job.status === 'completed' && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleViewJobResult(job.job_id)}
                                                                                    className="h-6 px-2 text-xs text-blue-500 hover:text-blue-600"
                                                                                >
                                                                                    <View className="h-3 w-3 mr-1" />
                                                                                    View
                                                                                </Button>
                                                                            )}
                                                                            {job.status === 'running' && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleCancelJob(job.job_id)}
                                                                                    className="h-6 px-2 text-xs text-red-500 hover:text-red-600"
                                                                                >
                                                                                    <X className="h-3 w-3 mr-1" />
                                                                                    Cancel
                                                                                </Button>
                                                                            )}
                                                                        </div>
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
            </ScrollArea>
        </div>
    )
} 