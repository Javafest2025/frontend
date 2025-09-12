"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
    Calendar,
    BookOpen,
    Copy,
    CheckCircle2,
    Database,
    FileText
} from "lucide-react"
import { researchGapsApi, type ResearchGapResponse } from "@/lib/api/project-service/gap-analysis"

interface GapDetailPageProps {
    params: Promise<{
        id: string
        paperId: string
        gapId: string
    }>
}

export default function GapDetailPage({ params }: GapDetailPageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [gapData, setGapData] = useState<ResearchGapResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load gap data on mount
    useEffect(() => {
        const loadData = async () => {
            const resolvedParams = await params

            try {
                setIsLoading(true)

                // Try to get gap data from URL parameters first
                const gapId = searchParams.get('gapId')
                const gapTitle = searchParams.get('gapTitle')
                const description = searchParams.get('description')
                const validationEvidence = searchParams.get('validationEvidence')
                const potentialImpact = searchParams.get('potentialImpact')
                const suggestedApproaches = searchParams.get('suggestedApproaches')
                const category = searchParams.get('category')
                const confidenceScore = searchParams.get('confidenceScore')
                const difficultyScore = searchParams.get('difficultyScore')
                const timeToSolution = searchParams.get('timeToSolution')
                const researchHints = searchParams.get('researchHints')
                const risksAndChallenges = searchParams.get('risksAndChallenges')
                const requiredResources = searchParams.get('requiredResources')
                const orderIndex = searchParams.get('orderIndex')
                const papersAnalyzedCount = searchParams.get('papersAnalyzedCount')
                const initialReasoning = searchParams.get('initialReasoning')
                const validationReasoning = searchParams.get('validationReasoning')
                const validationQuery = searchParams.get('validationQuery')
                const evidenceAnchors = searchParams.get('evidenceAnchors')
                const supportingPapers = searchParams.get('supportingPapers')
                const conflictingPapers = searchParams.get('conflictingPapers')
                const suggestedTopicsParam = searchParams.get('suggestedTopics')

                if (gapId && gapTitle) {
                    // Parse suggested topics if available
                    let suggestedTopics = []
                    if (suggestedTopicsParam) {
                        try {
                            suggestedTopics = JSON.parse(suggestedTopicsParam)
                        } catch (error) {
                            console.error('Error parsing suggested topics:', error)
                        }
                    }

                    // Create gap data from URL parameters
                    const gapData: ResearchGapResponse = {
                        id: resolvedParams.gapId,
                        gapId: gapId,
                        orderIndex: orderIndex ? parseInt(orderIndex) : 1,
                        name: gapTitle,
                        description: description || '',
                        initialEvidence: validationEvidence || '',
                        initialReasoning: initialReasoning || '',
                        validationQuery: validationQuery || '',
                        validationReasoning: validationReasoning || '',
                        potentialImpact: potentialImpact || '',
                        implementationSuggestions: suggestedApproaches || '',
                        researchHints: researchHints || '',
                        risksAndChallenges: risksAndChallenges || '',
                        requiredResources: requiredResources || '',
                        category: category || '',
                        validationConfidence: confidenceScore ? parseFloat(confidenceScore) : 0.8,
                        estimatedDifficulty: difficultyScore || 'medium',
                        estimatedTimeline: timeToSolution || '6-12 months',
                        papersAnalyzedCount: papersAnalyzedCount ? parseInt(papersAnalyzedCount) : 0,
                        validationStatus: 'VALID',
                        evidenceAnchors: [],
                        supportingPapers: [],
                        conflictingPapers: [],
                        suggestedTopics: suggestedTopics,
                        createdAt: new Date().toISOString(),
                        validatedAt: new Date().toISOString()
                    }
                    setGapData(gapData)
                } else {
                    // Fallback to API call
                    const gap = await researchGapsApi.getResearchGap(resolvedParams.gapId)
                    setGapData(gap)
                }
            } catch (error) {
                console.error('Error loading gap data:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [params, searchParams])

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            setTimeout(() => setCopiedField(null), 2000)
        } catch (error) {
            console.error('Failed to copy to clipboard:', error)
        }
    }


    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading gap details...</p>
                </div>
            </div>
        )
    }

    if (!gapData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Gap Not Found</h2>
                    <p className="text-muted-foreground mb-4">The requested research gap could not be found.</p>
                    <Button onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        )
    }

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
                            <h1 className="text-sm font-medium text-muted-foreground">Research Gap</h1>
                            <p className="text-lg font-bold">Gap Details</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Main Content */}
            <div className="flex-1 container mx-auto px-6 py-4 relative z-10 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Gap Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-6"
                    >
                        <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-3xl mb-2">{gapData.name || 'Untitled Gap'}</CardTitle>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Badge variant="outline" className="bg-gradient-to-r from-emerald-500/30 to-green-500/30 backdrop-blur-sm text-emerald-200 border-emerald-400/50 shadow-lg shadow-emerald-500/20">
                                                <Target className="h-3 w-3 mr-1" />
                                                {Math.round((gapData.validationConfidence || 0) * 100)}% Confidence
                                            </Badge>
                                            <Badge variant="outline" className="bg-gradient-to-r from-violet-500/30 to-purple-500/30 backdrop-blur-sm text-violet-200 border-violet-400/50 shadow-lg shadow-violet-500/20">
                                                <Brain className="h-3 w-3 mr-1" />
                                                {gapData.category}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-sm">
                                            Gap ID: {gapData.gapId}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(gapData.name || 'Untitled Gap', 'title')}
                                        className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/30 text-blue-100 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-500/20"
                                    >
                                        {copiedField === 'title' ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>
                    </motion.div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Description */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/30 hover:border-blue-400/40 hover:bg-gradient-to-br hover:from-blue-500/15 hover:via-purple-500/8 hover:to-cyan-500/15 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"></div>

                                    <CardHeader className="relative z-10">
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                                            Description
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <p className="text-muted-foreground leading-relaxed">{gapData.description || 'No description available'}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Two Column Grid for Main Content */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Potential Impact */}
                                {gapData.potentialImpact && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.3 }}
                                    >
                                        <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20 h-full hover:scale-[1.01] hover:shadow-2xl hover:shadow-yellow-500/30 hover:border-yellow-400/40 hover:bg-gradient-to-br hover:from-yellow-500/15 hover:via-purple-500/8 hover:to-cyan-500/15 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                                            {/* Shimmer effect */}
                                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent"></div>

                                            <CardHeader className="relative z-10">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Lightbulb className="h-5 w-5 text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300" />
                                                    Potential Impact
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="relative z-10">
                                                <div className="prose prose-invert max-w-none">
                                                    <div dangerouslySetInnerHTML={{ __html: gapData.potentialImpact }} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}

                                {/* Implementation Suggestions */}
                                {gapData.implementationSuggestions && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.4 }}
                                    >
                                        <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20 h-full hover:scale-[1.01] hover:shadow-2xl hover:shadow-orange-500/30 hover:border-orange-400/40 hover:bg-gradient-to-br hover:from-orange-500/15 hover:via-purple-500/8 hover:to-cyan-500/15 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                                            {/* Shimmer effect */}
                                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-orange-400/20 to-transparent"></div>

                                            <CardHeader className="relative z-10">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Zap className="h-5 w-5 text-orange-400 group-hover:text-orange-300 transition-colors duration-300" />
                                                    Implementation Suggestions
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="relative z-10">
                                                <div className="prose prose-invert max-w-none">
                                                    <div dangerouslySetInnerHTML={{ __html: gapData.implementationSuggestions }} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </div>

                            {/* Research Hints */}
                            {gapData.researchHints && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                >
                                    <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20 hover:scale-[1.01] hover:shadow-2xl hover:shadow-green-500/30 hover:border-green-400/40 hover:bg-gradient-to-br hover:from-green-500/15 hover:via-purple-500/8 hover:to-cyan-500/15 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                                        {/* Shimmer effect */}
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-green-400/20 to-transparent"></div>

                                        <CardHeader className="relative z-10">
                                            <CardTitle className="flex items-center gap-2">
                                                <BookOpen className="h-5 w-5 text-green-400 group-hover:text-green-300 transition-colors duration-300" />
                                                Research Hints
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="relative z-10">
                                            <div className="prose prose-invert max-w-none">
                                                <div dangerouslySetInnerHTML={{ __html: gapData.researchHints }} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Two Column Grid for Challenges and Resources */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Risks and Challenges */}
                                {gapData.risksAndChallenges && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.6 }}
                                    >
                                        <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20 h-full hover:scale-[1.01] hover:shadow-2xl hover:shadow-red-500/30 hover:border-red-400/40 hover:bg-gradient-to-br hover:from-red-500/15 hover:via-purple-500/8 hover:to-cyan-500/15 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                                            {/* Shimmer effect */}
                                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-red-400/20 to-transparent"></div>

                                            <CardHeader className="relative z-10">
                                                <CardTitle className="flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5 text-red-400 group-hover:text-red-300 transition-colors duration-300" />
                                                    Risks and Challenges
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="relative z-10">
                                                <div className="prose prose-invert max-w-none">
                                                    <div dangerouslySetInnerHTML={{ __html: gapData.risksAndChallenges }} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}

                                {/* Required Resources */}
                                {gapData.requiredResources && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.7 }}
                                    >
                                        <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20 h-full hover:scale-[1.01] hover:shadow-2xl hover:shadow-purple-500/30 hover:border-purple-400/40 hover:bg-gradient-to-br hover:from-purple-500/15 hover:via-purple-500/8 hover:to-cyan-500/15 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                                            {/* Shimmer effect */}
                                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent"></div>

                                            <CardHeader className="relative z-10">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Database className="h-5 w-5 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                                                    Required Resources
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="relative z-10">
                                                <div className="prose prose-invert max-w-none">
                                                    <div dangerouslySetInnerHTML={{ __html: gapData.requiredResources }} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </div>

                            {/* Suggested Research Topics */}
                            {gapData.suggestedTopics && gapData.suggestedTopics.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.8 }}
                                >
                                    <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Brain className="h-5 w-5 text-indigo-400" />
                                                Suggested Research Topics
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {gapData.suggestedTopics.map((topic, index) => (
                                                    <div
                                                        key={index}
                                                        className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border border-indigo-400/20 rounded-lg hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-400/40 hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/20 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                                                    >
                                                        {/* Shimmer effect */}
                                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent"></div>

                                                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2 relative z-10">
                                                            <Target className="h-4 w-4 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" />
                                                            {topic.title}
                                                        </h4>
                                                        <p className="text-muted-foreground text-sm leading-relaxed group-hover:text-foreground/80 transition-colors duration-300 relative z-10">
                                                            {topic.description}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </div>

                        {/* Right Column - Metrics and Additional Info */}
                        <div className="space-y-6">
                            {/* Gap Metrics */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20 hover:scale-[1.01] hover:shadow-2xl hover:shadow-cyan-500/30 hover:border-cyan-400/40 hover:bg-gradient-to-br hover:from-cyan-500/15 hover:via-purple-500/8 hover:to-cyan-500/15 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"></div>

                                    <CardHeader className="relative z-10">
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-primary group-hover:text-cyan-300 transition-colors duration-300" />
                                            Gap Metrics
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 relative z-10">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Validation Confidence</span>
                                                <span className="text-sm text-muted-foreground">{Math.round((gapData.validationConfidence || 0) * 100)}%</span>
                                            </div>
                                            <Progress value={(gapData.validationConfidence || 0) * 100} className="h-2" />
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Papers Analyzed:</span>
                                                <span className="font-medium">{gapData.papersAnalyzedCount || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Order Index:</span>
                                                <span className="font-medium">{gapData.orderIndex || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Status:</span>
                                                <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    {gapData.validationStatus || 'VALID'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Research Context */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20 hover:scale-[1.01] hover:shadow-2xl hover:shadow-purple-500/30 hover:border-purple-400/40 hover:bg-gradient-to-br hover:from-purple-500/15 hover:via-purple-500/8 hover:to-cyan-500/15 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent"></div>

                                    <CardHeader className="relative z-10">
                                        <CardTitle className="flex items-center gap-2">
                                            <Database className="h-5 w-5 text-primary group-hover:text-purple-300 transition-colors duration-300" />
                                            Research Context
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 relative z-10">
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Category:</span>
                                                <Badge variant="outline" className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/30">
                                                    {gapData.category || 'methodological'}
                                                </Badge>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Difficulty:</span>
                                                <Badge variant="outline" className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                                    {gapData.estimatedDifficulty || 'medium'}
                                                </Badge>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Timeline:</span>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {gapData.estimatedTimeline ? gapData.estimatedTimeline.split('\n')[0] : '6-12 months'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-border/20">
                                            <div className="space-y-2 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground">Created:</span>
                                                    <span>{gapData.createdAt ? new Date(gapData.createdAt).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                                {gapData.validatedAt && (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-muted-foreground">Validated:</span>
                                                        <span>{new Date(gapData.validatedAt).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Evidence and Validation */}
                            {(gapData.initialEvidence || gapData.initialReasoning || gapData.validationReasoning) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20 hover:scale-[1.01] hover:shadow-2xl hover:shadow-green-500/30 hover:border-green-400/40 hover:bg-gradient-to-br hover:from-green-500/15 hover:via-purple-500/8 hover:to-cyan-500/15 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                                        {/* Shimmer effect */}
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-green-400/20 to-transparent"></div>

                                        <CardHeader className="relative z-10">
                                            <CardTitle className="flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-green-400 group-hover:text-green-300 transition-colors duration-300" />
                                                Evidence & Validation
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 relative z-10">
                                            {gapData.initialEvidence && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-1">Initial Evidence</h4>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">{gapData.initialEvidence}</p>
                                                </div>
                                            )}
                                            {gapData.initialReasoning && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-1">Initial Reasoning</h4>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">{gapData.initialReasoning}</p>
                                                </div>
                                            )}
                                            {gapData.validationReasoning && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-1">Validation Reasoning</h4>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">{gapData.validationReasoning}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Quick Actions */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                            >
                                <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-xl border border-blue-400/20 shadow-2xl shadow-blue-500/20 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/30 hover:border-blue-400/40 hover:bg-gradient-to-br hover:from-blue-500/15 hover:via-purple-500/8 hover:to-cyan-500/15 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"></div>

                                    <CardHeader className="relative z-10">
                                        <CardTitle className="flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-primary group-hover:text-blue-300 transition-colors duration-300" />
                                            Quick Actions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 relative z-10">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/30 text-blue-100 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-500/20"
                                            onClick={() => copyToClipboard(gapData.description || '', 'description')}
                                        >
                                            <Copy className="mr-2 h-3 w-3" />
                                            Copy Description
                                        </Button>
                                        {gapData.implementationSuggestions && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full justify-start bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/30 text-blue-100 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-500/20"
                                                onClick={() => copyToClipboard(gapData.implementationSuggestions || '', 'suggestions')}
                                            >
                                                <BookOpen className="mr-2 h-3 w-3" />
                                                Copy Implementation
                                            </Button>
                                        )}
                                        {gapData.potentialImpact && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full justify-start bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/30 text-blue-100 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-500/20"
                                                onClick={() => copyToClipboard(gapData.potentialImpact || '', 'impact')}
                                            >
                                                <TrendingUp className="mr-2 h-3 w-3" />
                                                Copy Impact
                                            </Button>
                                        )}
                                        {gapData.researchHints && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full justify-start bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/30 text-blue-100 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-500/20"
                                                onClick={() => copyToClipboard(gapData.researchHints || '', 'hints')}
                                            >
                                                <Brain className="mr-2 h-3 w-3" />
                                                Copy Hints
                                            </Button>
                                        )}
                                        {gapData.requiredResources && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full justify-start bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/30 text-blue-100 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-500/20"
                                                onClick={() => copyToClipboard(gapData.requiredResources || '', 'resources')}
                                            >
                                                <Database className="mr-2 h-3 w-3" />
                                                Copy Resources
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 