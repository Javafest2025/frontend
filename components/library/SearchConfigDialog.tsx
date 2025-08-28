"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SmartComboBox } from "@/components/ui/smart-combobox"
import { TagInput } from "@/components/ui/tag-input"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { projectsApi } from "@/lib/api/project-service"
import { Project } from "@/types/project"
import { WebSearchRequest } from "@/types/websearch"
import {
    RESEARCH_DOMAINS,
    getTopicSuggestions,
    searchSuggestionsAsStrings
} from "@/constants/research-data"
import {
    Search,
    Brain,
    Target,
    Settings2,
    Sparkles,
    Zap,
    RefreshCw,
    BookOpen,
    Globe,
    Hash,
    ChevronRight,
    X,
    ArrowLeft,
    Lightbulb,
    CheckCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SearchConfigDialogProps {
    isOpen: boolean
    projectId: string
    onClose: () => void
    onSearchSubmit: (searchRequest: WebSearchRequest) => void
    isLoading?: boolean
}

interface SearchFormData {
    domain: string
    queryTerms: string[]
    batchSize: number
}

export function SearchConfigDialog({
    isOpen,
    projectId,
    onClose,
    onSearchSubmit,
    isLoading = false
}: SearchConfigDialogProps) {
    const [project, setProject] = useState<Project | null>(null)
    const [isLoadingProject, setIsLoadingProject] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm<SearchFormData>({
        defaultValues: {
            domain: "",
            queryTerms: [],
            batchSize: 20
        }
    })

    const watchedDomain = watch("domain")
    const watchedBatchSize = watch("batchSize")
    const watchedQueryTerms = watch("queryTerms")

    // Generate smart suggestions based on selected domain
    const topicSuggestions = useMemo(() => {
        return watchedDomain ? getTopicSuggestions(watchedDomain) : []
    }, [watchedDomain])

    // Load project data on mount
    useEffect(() => {
        if (isOpen && projectId) {
            loadProjectData()
        }
    }, [isOpen, projectId])

    const loadProjectData = async () => {
        try {
            setIsLoadingProject(true)
            setError(null)
            const projectData = await projectsApi.getProject(projectId)
            setProject(projectData)

            // Set default values from project
            reset({
                domain: projectData.domain || "",
                queryTerms: projectData.topics || [],
                batchSize: 20
            })
        } catch (error) {
            console.error('Error loading project:', error)
            setError('Failed to load project data')
        } finally {
            setIsLoadingProject(false)
        }
    }

    const onSubmit = (data: SearchFormData) => {
        if (!projectId) return

        const searchRequest: WebSearchRequest = {
            projectId,
            domain: data.domain,
            queryTerms: data.queryTerms,
            batchSize: data.batchSize
        }

        onSearchSubmit(searchRequest)
        onClose()
    }

    const handleClose = () => {
        if (!isLoading && !isLoadingProject) {
            setError(null)
            onClose()
        }
    }

    const getBatchSizeColor = (size: number) => {
        if (size <= 10) return "text-green-500"
        if (size <= 30) return "text-yellow-500"
        return "text-red-500"
    }

    const getBatchSizeDescription = (size: number) => {
        if (size <= 10) return "Quick search - faster results"
        if (size <= 30) return "Balanced search - good coverage"
        return "Comprehensive search - may take longer"
    }

    const isFormValid = watchedDomain && watchedQueryTerms.length > 0

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl"
                >
                    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

                        {/* Header */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="relative z-10 border-b border-primary/20 bg-background/80 backdrop-blur-xl"
                            style={{ boxShadow: '0 2px 15px rgba(99, 102, 241, 0.1), 0 4px 25px rgba(139, 92, 246, 0.06)' }}
                        >
                            <div className="max-w-6xl mx-auto px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
                                            <Search className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                                                Configure Paper Search
                                            </h1>
                                            <p className="text-sm text-muted-foreground">
                                                Customize your academic paper search parameters for optimal results
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClose}
                                        disabled={isLoading}
                                        className="h-9 w-9 rounded-lg bg-background/40 backdrop-blur-xl border border-primary/20 hover:bg-red-500/10 hover:text-red-500"
                                        style={{ boxShadow: '0 0 8px rgba(99, 102, 241, 0.08), 0 0 16px rgba(139, 92, 246, 0.04)' }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Main Content */}
                        <div className="relative z-10 h-[calc(100vh-100px)] overflow-hidden">
                            <div className="max-w-6xl mx-auto px-6 py-6 h-full">
                                {/* Project Info Card - Compact */}
                                {project && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ duration: 0.4, delay: 0.2 }}
                                        className="mb-6"
                                    >
                                        <Card className="bg-background/40 backdrop-blur-xl border border-primary/20 shadow-lg rounded-xl bg-gradient-to-br from-background/60 to-primary/5" style={{ boxShadow: '0 0 15px rgba(99, 102, 241, 0.12), 0 0 30px rgba(139, 92, 246, 0.08)' }}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                                                            <BookOpen className="h-4 w-4 text-orange-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                                                            {project.description && (
                                                                <p className="text-sm text-muted-foreground mt-1 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                                    {project.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {(project.domain || (project.topics && project.topics.length > 0)) && (
                                                        <div className="flex flex-wrap gap-1 max-w-md">
                                                            {project.domain && (
                                                                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs">
                                                                    <Globe className="h-2 w-2 mr-1" />
                                                                    {project.domain}
                                                                </Badge>
                                                            )}
                                                            {project.topics?.slice(0, 6).map((topic, index) => (
                                                                <Badge key={index} variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                                                                    {topic}
                                                                </Badge>
                                                            ))}
                                                            {project.topics && project.topics.length > 6 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{project.topics.length - 6}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}

                                {/* Form Content */}
                                {isLoadingProject ? (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ duration: 0.4, delay: 0.3 }}
                                    >
                                        <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                                            <CardContent className="p-12">
                                                <div className="flex items-center justify-center">
                                                    <div className="text-center">
                                                        <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                                                        <h3 className="text-lg font-semibold mb-2">Loading Project Data</h3>
                                                        <p className="text-muted-foreground">Please wait while we fetch your project information...</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ) : error ? (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ duration: 0.4, delay: 0.3 }}
                                    >
                                        <Card className="bg-red-500/10 border-red-500/20 shadow-lg">
                                            <CardContent className="p-12">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                                                        <X className="h-8 w-8 text-red-500" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold mb-2 text-red-500">Error Loading Project</h3>
                                                    <p className="text-red-400 mb-4">{error}</p>
                                                    <Button
                                                        variant="outline"
                                                        onClick={loadProjectData}
                                                        className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                                                    >
                                                        <RefreshCw className="h-4 w-4 mr-2" />
                                                        Try Again
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit(onSubmit)} className="h-[calc(100%-140px)] flex flex-col">
                                        {/* Form Fields - Grid Layout */}
                                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 h-full p-6 border border-primary/20 rounded-xl bg-gradient-to-br from-background/60 to-primary/5 backdrop-blur-sm shadow-lg shadow-primary/10" style={{ boxShadow: '0 0 20px rgba(99, 102, 241, 0.15), 0 0 40px rgba(139, 92, 246, 0.1)' }}>
                                            {/* Left Column */}
                                            <div className="space-y-6">
                                                {/* Research Domain Card - Compact */}
                                                <motion.div
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ duration: 0.4, delay: 0.3 }}
                                                    className="h-fit"
                                                >
                                                    <Card className="bg-background/40 backdrop-blur-xl border border-primary/20 shadow-lg rounded-xl bg-gradient-to-br from-background/60 to-primary/5" style={{ boxShadow: '0 0 12px rgba(99, 102, 241, 0.1), 0 0 25px rgba(139, 92, 246, 0.06)' }}>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex items-center justify-center">
                                                                    <Brain className="h-3 w-3 text-purple-500" />
                                                                </div>
                                                                Research Domain
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                                                                    <Sparkles className="h-3 w-3" />
                                                                    Smart suggestions
                                                                </div>
                                                            </CardTitle>
                                                            <CardDescription className="text-xs">
                                                                Specify the primary research domain to focus your search
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="pt-0">
                                                            <Controller
                                                                name="domain"
                                                                control={control}
                                                                rules={{ required: "Research domain is required" }}
                                                                render={({ field }) => (
                                                                    <SmartComboBox
                                                                        value={field.value}
                                                                        onValueChange={field.onChange}
                                                                        suggestions={RESEARCH_DOMAINS}
                                                                        placeholder="Select or type a research domain (e.g., Machine Learning, Computer Vision)"
                                                                        searchFunction={(query: string, suggestions: string[]) =>
                                                                            searchSuggestionsAsStrings(query, { kinds: ['domain'] })
                                                                        }
                                                                        disabled={isLoading}
                                                                        className="w-full"
                                                                        style={{ boxShadow: '0 0 8px rgba(99, 102, 241, 0.06), 0 0 16px rgba(139, 92, 246, 0.03)' }}
                                                                    />
                                                                )}
                                                            />
                                                            {errors.domain && (
                                                                <p className="text-xs text-red-500 flex items-center gap-2 mt-2">
                                                                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                                                    {errors.domain.message}
                                                                </p>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>

                                                {/* Search Batch Size Card - Extended */}
                                                <motion.div
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ duration: 0.4, delay: 0.5 }}
                                                    className="flex-1"
                                                >
                                                    <Card className="bg-background/40 backdrop-blur-xl border border-primary/20 shadow-lg rounded-xl bg-gradient-to-br from-background/60 to-primary/5 h-full flex flex-col" style={{ boxShadow: '0 0 12px rgba(99, 102, 241, 0.1), 0 0 25px rgba(139, 92, 246, 0.06)' }}>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/20 flex items-center justify-center">
                                                                    <Settings2 className="h-3 w-3 text-orange-500" />
                                                                </div>
                                                                Search Batch Size
                                                            </CardTitle>
                                                            <CardDescription className="text-xs">
                                                                Number of papers to retrieve. Larger batches provide more comprehensive results but take longer.
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="pt-0 space-y-4 flex-1 flex flex-col justify-center">
                                                            <Controller
                                                                name="batchSize"
                                                                control={control}
                                                                rules={{
                                                                    required: "Batch size is required",
                                                                    min: { value: 5, message: "Minimum batch size is 5" },
                                                                    max: { value: 100, message: "Maximum batch size is 100" }
                                                                }}
                                                                render={({ field }) => (
                                                                    <div className="space-y-3">
                                                                        <Slider
                                                                            value={[field.value]}
                                                                            onValueChange={(value) => field.onChange(value[0])}
                                                                            max={100}
                                                                            min={5}
                                                                            step={5}
                                                                            className="w-full"
                                                                            disabled={isLoading}
                                                                        />
                                                                        <div className="flex items-center justify-between text-xs">
                                                                            <span className="text-muted-foreground">5 papers</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={`font-medium ${getBatchSizeColor(watchedBatchSize)}`}>
                                                                                    {watchedBatchSize} papers
                                                                                </span>
                                                                                <Zap className={`h-3 w-3 ${getBatchSizeColor(watchedBatchSize)}`} />
                                                                            </div>
                                                                            <span className="text-muted-foreground">100 papers</span>
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <p className={`text-xs ${getBatchSizeColor(watchedBatchSize)} font-medium`}>
                                                                                {getBatchSizeDescription(watchedBatchSize)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            />
                                                            {errors.batchSize && (
                                                                <p className="text-xs text-red-500 flex items-center gap-2">
                                                                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                                                    {errors.batchSize.message}
                                                                </p>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            </div>

                                            {/* Right Column */}
                                            <div className="space-y-6">
                                                {/* Search Query Terms Card - Takes more space */}
                                                <motion.div
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ duration: 0.4, delay: 0.4 }}
                                                    className="h-full"
                                                >
                                                    <Card className="bg-background/40 backdrop-blur-xl border border-primary/20 shadow-lg rounded-xl bg-gradient-to-br from-background/60 to-primary/5 h-full flex flex-col" style={{ boxShadow: '0 0 12px rgba(99, 102, 241, 0.1), 0 0 25px rgba(139, 92, 246, 0.06)' }}>
                                                        <CardHeader className="pb-3 flex-shrink-0">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center">
                                                                    <Target className="h-3 w-3 text-green-500" />
                                                                </div>
                                                                Search Query Terms
                                                                {watchedDomain && topicSuggestions.length > 0 && (
                                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                                                                        <Lightbulb className="h-3 w-3" />
                                                                        {topicSuggestions.length} suggestions for {watchedDomain}
                                                                    </div>
                                                                )}
                                                            </CardTitle>
                                                            <CardDescription className="text-xs">
                                                                Add specific keywords, research topics, or methodologies you want to search for
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="pt-0 flex-1 flex flex-col">
                                                            <Controller
                                                                name="queryTerms"
                                                                control={control}
                                                                rules={{
                                                                    required: "At least one query term is required",
                                                                    validate: (value) => value.length > 0 || "At least one query term is required"
                                                                }}
                                                                render={({ field }) => (
                                                                    <TagInput
                                                                        value={field.value}
                                                                        onValueChange={field.onChange}
                                                                        suggestions={topicSuggestions}
                                                                        placeholder="Add research topics, keywords, or specific areas..."
                                                                        maxTags={15}
                                                                        disabled={isLoading}
                                                                        className="w-full flex-1"
                                                                        style={{ boxShadow: '0 0 8px rgba(99, 102, 241, 0.06), 0 0 16px rgba(139, 92, 246, 0.03)' }}
                                                                    />
                                                                )}
                                                            />
                                                            {errors.queryTerms && (
                                                                <p className="text-xs text-red-500 flex items-center gap-2 mt-2">
                                                                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                                                    {errors.queryTerms.message}
                                                                </p>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Action Buttons - Fixed at bottom */}
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ duration: 0.4, delay: 0.6 }}
                                            className="flex gap-4 pt-6 mt-4 border-t border-primary/20 flex-shrink-0"
                                            style={{ boxShadow: '0 -2px 10px rgba(99, 102, 241, 0.06), 0 -4px 20px rgba(139, 92, 246, 0.03)' }}
                                        >
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleClose}
                                                disabled={isLoading}
                                                className="flex-1 h-11 bg-background/40 backdrop-blur-xl border-primary/20"
                                                style={{ boxShadow: '0 0 10px rgba(99, 102, 241, 0.08), 0 0 20px rgba(139, 92, 246, 0.04)' }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isLoading || !isFormValid}
                                                className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium border border-blue-500/30"
                                                style={{ boxShadow: '0 0 15px rgba(59, 130, 246, 0.4), 0 0 30px rgba(6, 182, 212, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                        Starting Search...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="mr-2 h-4 w-4" />
                                                        Start Search
                                                        <ChevronRight className="ml-2 h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </motion.div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
} 