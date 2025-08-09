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
    DollarSign,
    Award,
    BookOpen,
    Copy,
    CheckCircle2,
    ExternalLink,
    Database,
    FileText
} from "lucide-react"
import { cn } from "@/lib/utils"

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
    const [projectId, setProjectId] = useState<string>("")
    const [paperId, setPaperId] = useState<string>("")
    const [gapId, setGapId] = useState<string>("")
    const [copiedField, setCopiedField] = useState<string | null>(null)

    // Gap data from URL params
    const [gapData, setGapData] = useState({
        gapId: searchParams.get('gapId') || '',
        gapTitle: searchParams.get('gapTitle') || '',
        description: searchParams.get('description') || '',
        validationEvidence: searchParams.get('validationEvidence') || '',
        potentialImpact: searchParams.get('potentialImpact') || '',
        suggestedApproaches: searchParams.get('suggestedApproaches')?.split('|') || [],
        category: searchParams.get('category') || '',
        confidenceScore: parseInt(searchParams.get('confidenceScore') || '0'),
        difficultyScore: parseFloat(searchParams.get('difficultyScore') || '0'),
        innovationPotential: parseFloat(searchParams.get('innovationPotential') || '0'),
        commercialViability: parseFloat(searchParams.get('commercialViability') || '0'),
        fundingLikelihood: parseFloat(searchParams.get('fundingLikelihood') || '0'),
        timeToSolution: searchParams.get('timeToSolution') || '',
        recommendedTeamSize: searchParams.get('recommendedTeamSize') || '',
        estimatedResearcherYears: parseFloat(searchParams.get('estimatedResearcherYears') || '0')
    })

    // Load params on mount
    useEffect(() => {
        const loadParams = async () => {
            const resolvedParams = await params
            setProjectId(resolvedParams.id)
            setPaperId(resolvedParams.paperId)
            setGapId(resolvedParams.gapId)
        }
        loadParams()
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

    const getDifficultyColor = (score: number) => {
        if (score >= 8) return 'text-red-500'
        if (score >= 6) return 'text-orange-500'
        if (score >= 4) return 'text-yellow-500'
        return 'text-green-500'
    }

    const getInnovationColor = (score: number) => {
        if (score >= 8) return 'text-green-500'
        if (score >= 6) return 'text-blue-500'
        if (score >= 4) return 'text-yellow-500'
        return 'text-gray-500'
    }

    const getFundingColor = (score: number) => {
        if (score >= 80) return 'text-green-500'
        if (score >= 60) return 'text-blue-500'
        if (score >= 40) return 'text-yellow-500'
        return 'text-red-500'
    }

    return (
        <div className="h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden flex flex-col">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

            {/* Fixed Header */}
            <div className="relative z-10 flex-shrink-0 bg-background/80 backdrop-blur-xl border-b border-primary/10">
                <div className="container mx-auto px-6 py-6">
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
                                    <Target className="h-8 w-8 text-primary" />
                                    Research Gap Details
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Comprehensive analysis of research opportunity
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scrollable Main Content */}
            <ScrollArea className="flex-1 relative z-10">
                <div className="container mx-auto px-6 py-6">
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
                                                <CardTitle className="text-2xl mb-2">{gapData.gapTitle}</CardTitle>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                        {gapData.gapId}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                        {gapData.confidenceScore}% Confidence
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                                                        {gapData.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(gapData.gapTitle, 'title')}
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
                                                <p className="text-muted-foreground leading-relaxed">{gapData.description}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Validation Evidence */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                                            Validation Evidence
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground leading-relaxed">{gapData.validationEvidence}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Potential Impact */}
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

                            {/* Suggested Approaches */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                            >
                                <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="h-5 w-5 text-blue-500" />
                                            Suggested Approaches
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {gapData.suggestedApproaches.map((approach, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <span className="text-xs font-medium text-blue-500">{index + 1}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">{approach}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
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
                                                    <span className="text-sm">Difficulty Score</span>
                                                </div>
                                                <span className={cn("text-sm font-medium", getDifficultyColor(gapData.difficultyScore))}>
                                                    {gapData.difficultyScore}/10
                                                </span>
                                            </div>
                                            <Progress value={gapData.difficultyScore * 10} className="h-2" />

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-green-500" />
                                                    <span className="text-sm">Innovation Potential</span>
                                                </div>
                                                <span className={cn("text-sm font-medium", getInnovationColor(gapData.innovationPotential))}>
                                                    {gapData.innovationPotential}/10
                                                </span>
                                            </div>
                                            <Progress value={gapData.innovationPotential * 10} className="h-2" />

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-blue-500" />
                                                    <span className="text-sm">Commercial Viability</span>
                                                </div>
                                                <span className="text-sm font-medium">{gapData.commercialViability}/10</span>
                                            </div>
                                            <Progress value={gapData.commercialViability * 10} className="h-2" />

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Award className="h-4 w-4 text-purple-500" />
                                                    <span className="text-sm">Funding Likelihood</span>
                                                </div>
                                                <span className={cn("text-sm font-medium", getFundingColor(gapData.fundingLikelihood))}>
                                                    {gapData.fundingLikelihood}%
                                                </span>
                                            </div>
                                            <Progress value={gapData.fundingLikelihood} className="h-2" />
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
                                                    <p className="text-sm font-medium">Time to Solution</p>
                                                    <p className="text-xs text-muted-foreground">{gapData.timeToSolution}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">Recommended Team Size</p>
                                                    <p className="text-xs text-muted-foreground">{gapData.recommendedTeamSize}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">Estimated Researcher Years</p>
                                                    <p className="text-xs text-muted-foreground">{gapData.estimatedResearcherYears} years</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Database className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">Category</p>
                                                    <p className="text-xs text-muted-foreground">{gapData.category}</p>
                                                </div>
                                            </div>
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
                                            onClick={() => copyToClipboard(gapData.description, 'description')}
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy Description
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => copyToClipboard(gapData.suggestedApproaches.join('\n\n'), 'approaches')}
                                        >
                                            <BookOpen className="mr-2 h-4 w-4" />
                                            Copy Approaches
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => copyToClipboard(gapData.potentialImpact, 'impact')}
                                        >
                                            <TrendingUp className="mr-2 h-4 w-4" />
                                            Copy Impact Statement
                                        </Button>
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