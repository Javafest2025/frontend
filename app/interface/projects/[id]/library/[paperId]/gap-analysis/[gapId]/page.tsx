"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [gapData, setGapData] = useState<ResearchGapResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load gap data on mount
    useEffect(() => {
        const loadData = async () => {
            const resolvedParams = await params

            try {
                setIsLoading(true)
                const gap = await researchGapsApi.getResearchGap(resolvedParams.gapId)
                setGapData(gap)
            } catch (error) {
                console.error('Error loading gap data:', error)
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
        <div className="h-screen bg-background overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
            <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

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
            <div className="container mx-auto px-6 py-6 relative z-10 h-full overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
                    {/* Left Side - Main Gap Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Gap Title and Overview */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-2xl mb-2">{gapData.name || 'Untitled Gap'}</CardTitle>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                    {gapData.gapId}
                                                </Badge>
                                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                    {Math.round((gapData.validationConfidence || 0) * 100)}% Confidence
                                                </Badge>
                                                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                                                    {gapData.category}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(gapData.name || 'Untitled Gap', 'title')}
                                        >
                                            {copiedField === 'title' ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                                Description
                                            </h4>
                                            <p className="text-muted-foreground leading-relaxed">{gapData.description || 'No description available'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Initial Evidence */}
                        {gapData.initialEvidence && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                                            Initial Evidence
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground leading-relaxed">{gapData.initialEvidence}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Potential Impact */}
                        {gapData.potentialImpact && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Lightbulb className="h-5 w-5 text-green-500" />
                                            Potential Impact
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground leading-relaxed">{gapData.potentialImpact}</p>
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
                                <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="h-5 w-5 text-blue-500" />
                                            Implementation Suggestions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground leading-relaxed">{gapData.implementationSuggestions}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Research Hints */}
                        {gapData.researchHints && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                            >
                                <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Brain className="h-5 w-5 text-purple-500" />
                                            Research Hints
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground leading-relaxed">{gapData.researchHints}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Risks and Challenges */}
                        {gapData.risksAndChallenges && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                            >
                                <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                            Risks and Challenges
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground leading-relaxed">{gapData.risksAndChallenges}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Side - Metrics and Details */}
                    <div className="space-y-6">
                        {/* Gap Metrics */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                        Gap Metrics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                                <span className="text-sm">Validation Confidence</span>
                                            </div>
                                            <span className="text-sm font-medium text-green-500">
                                                {Math.round((gapData.validationConfidence || 0) * 100)}%
                                            </span>
                                        </div>
                                        <Progress value={(gapData.validationConfidence || 0) * 100} className="h-2" />

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Database className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm">Papers Analyzed</span>
                                            </div>
                                            <span className="text-sm font-medium">{gapData.papersAnalyzedCount}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span className="text-sm">Validation Status</span>
                                            </div>
                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                {gapData.validationStatus}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Research Context */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Brain className="h-5 w-5 text-primary" />
                                        Research Context
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Estimated Timeline</p>
                                                <p className="text-xs text-muted-foreground">{gapData.estimatedTimeline || 'Not specified'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Estimated Difficulty</p>
                                                <p className="text-xs text-muted-foreground">{gapData.estimatedDifficulty || 'Not specified'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Category</p>
                                                <p className="text-xs text-muted-foreground">{gapData.category || 'Not specified'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Created</p>
                                                <p className="text-xs text-muted-foreground">{new Date(gapData.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        {gapData.validatedAt && (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">Validated</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(gapData.validatedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-primary" />
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => copyToClipboard(gapData.description || '', 'description')}
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy Description
                                    </Button>
                                    {gapData.implementationSuggestions && (
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => copyToClipboard(gapData.implementationSuggestions || '', 'suggestions')}
                                        >
                                            <BookOpen className="mr-2 h-4 w-4" />
                                            Copy Implementation Suggestions
                                        </Button>
                                    )}
                                    {gapData.potentialImpact && (
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => copyToClipboard(gapData.potentialImpact || '', 'impact')}
                                        >
                                            <TrendingUp className="mr-2 h-4 w-4" />
                                            Copy Impact Statement
                                        </Button>
                                    )}
                                    {gapData.researchHints && (
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => copyToClipboard(gapData.researchHints || '', 'hints')}
                                        >
                                            <Brain className="mr-2 h-4 w-4" />
                                            Copy Research Hints
                                        </Button>
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