"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SmartComboBox } from "@/components/ui/smart-combobox"
import { TagInput } from "@/components/ui/tag-input"
import { projectsApi } from "@/lib/api/project-service"
import { Project, ProjectFormData, CreateProjectRequest } from "@/types/project"
import { useAuth } from "@/hooks/useAuth"
import {
    RESEARCH_DOMAINS,
    getTopicSuggestions,
    getTagSuggestions,
    searchSuggestionsAsStrings
} from "@/constants/research-data"
import { Loader2, Sparkles, Brain, Target, Hash, FolderPlus, X, FileText, BookOpen, Tag, Zap, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ProjectCreateDialogProps {
    isOpen: boolean
    onClose: () => void
    onProjectCreated: (project: Project) => void
}

export function ProjectCreateDialog({ isOpen, onClose, onProjectCreated }: ProjectCreateDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuth()

    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        setValue,
        formState: { errors }
    } = useForm<ProjectFormData & { domainValue: string, topicsArray: string[], tagsArray: string[] }>({
        defaultValues: {
            name: "",
            description: "",
            domain: "",
            topics: "",
            tags: "",
            domainValue: "",
            topicsArray: [],
            tagsArray: []
        }
    })

    const watchedDomain = watch("domainValue")
    const watchedTopics = watch("topicsArray")
    const prevDomainRef = useRef<string>("")

    // Clear topics when domain changes
    useEffect(() => {
        if (prevDomainRef.current && prevDomainRef.current !== watchedDomain && watchedTopics.length > 0) {
            setValue("topicsArray", [])
        }
        prevDomainRef.current = watchedDomain
    }, [watchedDomain, watchedTopics.length, setValue])

    const topicSuggestions = useMemo(() => {
        return watchedDomain ? getTopicSuggestions(watchedDomain) : []
    }, [watchedDomain])

    const tagSuggestions = useMemo(() => {
        return getTagSuggestions(watchedDomain, watchedTopics)
    }, [watchedDomain, watchedTopics])

    const onSubmit = async (data: ProjectFormData & { domainValue: string, topicsArray: string[], tagsArray: string[] }) => {
        try {
            setIsLoading(true)
            setError(null)

            if (!user?.id) {
                throw new Error('User not authenticated')
            }

            const createRequest: CreateProjectRequest = {
                userId: user.id,
                name: data.name,
                description: data.description || undefined,
                domain: data.domainValue || undefined,
                topics: data.topicsArray || [],
                tags: data.tagsArray || []
            }

            const newProject = await projectsApi.createProject(createRequest)
            onProjectCreated(newProject)
            reset()
            onClose()
        } catch (error) {
            console.error('Error creating project:', error)
            setError(error instanceof Error ? error.message : 'Failed to create project')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        if (!isLoading) {
            reset()
            setError(null)
            onClose()
        }
    }

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
                        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

                        {/* Header */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="relative z-10 border-b border-border bg-background/80 backdrop-blur-xl"
                            style={{
                                boxShadow: `
                                    0 2px 15px hsl(var(--primary) / 0.1),
                                    0 4px 25px hsl(var(--accent) / 0.06)
                                `
                            }}
                        >
                            <div className="w-full px-6 py-4">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 via-blue-500/20 to-purple-500/20 border border-primary/30 shadow-lg">
                                            <FolderPlus className="h-6 w-6 text-primary drop-shadow-sm" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold text-gradient-primary">
                                                Create New Project
                                            </h1>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Set up your AI-powered research workspace with intelligent suggestions
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClose}
                                        disabled={isLoading}
                                        className="h-10 w-10 rounded-xl bg-background/40 backdrop-blur-xl border border-border hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all duration-300"
                                        style={{
                                            boxShadow: `
                                                0 0 8px hsl(var(--primary) / 0.08),
                                                0 0 16px hsl(var(--accent) / 0.04)
                                            `
                                        }}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Main Content */}
                        <div className="relative z-10 h-[calc(100vh-81px)] overflow-hidden">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="max-w-6xl mx-auto px-6 py-8 h-full"
                            >
                                <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Left Column */}
                                        <div className="space-y-8 flex flex-col">
                                            <Card className="bg-background/40 backdrop-blur-xl border border-primary/20 shadow-lg transition-all duration-300 hover:shadow-primary/10 hover:border-primary/30"
                                                style={{
                                                    boxShadow: `
                                                        0 0 20px hsl(var(--primary) / 0.1),
                                                        0 0 40px hsl(var(--accent) / 0.06)
                                                    `
                                                }}
                                            >
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
                                                            <FileText className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold">Project Name</span>
                                                            <span className="text-red-500 ml-1">*</span>
                                                        </div>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <Input
                                                        id="name"
                                                        {...register("name", {
                                                            required: "Project name is required",
                                                            maxLength: { value: 500, message: "Project name must not exceed 500 characters" }
                                                        })}
                                                        placeholder="Enter a descriptive name for your research project"
                                                        disabled={isLoading}
                                                        className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg p-0 placeholder:text-muted-foreground"
                                                    />
                                                    {errors.name && (
                                                        <p className="text-sm text-destructive flex items-center gap-2 mt-2">
                                                            <span className="w-1 h-1 rounded-full bg-destructive" />
                                                            {errors.name.message}
                                                        </p>
                                                    )}
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-background/40 backdrop-blur-xl border border-blue-500/20 shadow-lg flex-1 flex flex-col transition-all duration-300 hover:shadow-blue-500/10 hover:border-blue-500/30"
                                                style={{
                                                    boxShadow: `
                                                        0 0 20px hsl(var(--primary) / 0.1),
                                                        0 0 40px hsl(var(--accent) / 0.06)
                                                    `
                                                }}
                                            >
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                            <BookOpen className="h-4 w-4 text-blue-500" />
                                                        </div>
                                                        <span className="font-semibold">Description</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex-1 flex flex-col">
                                                    <Textarea
                                                        id="description"
                                                        {...register("description", {
                                                            maxLength: { value: 5000, message: "Description must not exceed 5000 characters" }
                                                        })}
                                                        placeholder="Describe your research objectives, methodology, and expected outcomes..."
                                                        className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none flex-1 w-full p-0 placeholder:text-muted-foreground"
                                                        disabled={isLoading}
                                                    />
                                                    {errors.description && (
                                                        <p className="text-sm text-destructive flex items-center gap-2 mt-2">
                                                            <span className="w-1 h-1 rounded-full bg-destructive" />
                                                            {errors.description.message}
                                                        </p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-8 flex flex-col">
                                            <Card className="bg-background/40 backdrop-blur-xl border border-purple-500/20 shadow-lg transition-all duration-300 hover:shadow-purple-500/10 hover:border-purple-500/30"
                                                style={{
                                                    boxShadow: `
                                                        0 0 20px hsl(var(--primary) / 0.1),
                                                        0 0 40px hsl(var(--accent) / 0.06)
                                                    `
                                                }}
                                            >
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                                                <Brain className="h-4 w-4 text-purple-500" />
                                                            </div>
                                                            <span className="font-semibold">Research Domain</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gradient-to-r from-purple-500/10 to-violet-500/10 px-3 py-1.5 rounded-full border border-purple-500/20">
                                                            <Sparkles className="h-3 w-3 text-purple-500" />
                                                            Smart suggestions
                                                        </div>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <Controller
                                                        name="domainValue"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <SmartComboBox
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                                suggestions={RESEARCH_DOMAINS}
                                                                placeholder="Select or type a domain"
                                                                searchFunction={(query: string, suggestions: string[]) =>
                                                                    searchSuggestionsAsStrings(query, { kinds: ['domain'] })
                                                                }
                                                                disabled={isLoading}
                                                                className="w-full"
                                                                theme="purple"
                                                            />
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-background/40 backdrop-blur-xl border border-green-500/20 shadow-lg flex-1 flex flex-col transition-all duration-300 hover:shadow-green-500/10 hover:border-green-500/30"
                                                style={{
                                                    boxShadow: `
                                                        0 0 20px hsl(var(--primary) / 0.1),
                                                        0 0 40px hsl(var(--accent) / 0.06)
                                                    `
                                                }}
                                            >
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20">
                                                                <Target className="h-4 w-4 text-green-500" />
                                                            </div>
                                                            <span className="font-semibold">Research Topics</span>
                                                        </div>
                                                        {watchedDomain && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                                                                <Sparkles className="h-3 w-3 text-green-500" />
                                                                Domain-aware topics
                                                            </div>
                                                        )}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex-1 flex flex-col">
                                                    <Controller
                                                        name="topicsArray"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <TagInput
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                                suggestions={topicSuggestions}
                                                                placeholder="Add specific topics..."
                                                                maxTags={10}
                                                                disabled={isLoading || !watchedDomain}
                                                                className="w-full flex-1"
                                                                theme="green"
                                                            />
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-background/40 backdrop-blur-xl border border-orange-500/20 shadow-lg flex-1 flex flex-col transition-all duration-300 hover:shadow-orange-500/10 hover:border-orange-500/30"
                                                style={{
                                                    boxShadow: `
                                                        0 0 20px hsl(var(--primary) / 0.1),
                                                        0 0 40px hsl(var(--accent) / 0.06)
                                                    `
                                                }}
                                            >
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                                                <Tag className="h-4 w-4 text-orange-500" />
                                                            </div>
                                                            <span className="font-semibold">Tags</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                                                            <Sparkles className="h-3 w-3 text-orange-500" />
                                                            Context-aware suggestions
                                                        </div>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex-1 flex flex-col">
                                                    <Controller
                                                        name="tagsArray"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <TagInput
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                                suggestions={tagSuggestions}
                                                                placeholder="Add relevant tags..."
                                                                maxTags={15}
                                                                disabled={isLoading}
                                                                className="w-full flex-1"
                                                                theme="orange"
                                                            />
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-destructive" />
                                                <p className="text-sm text-destructive font-medium">{error}</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="flex flex-col sm:flex-row gap-4 pt-8 mt-auto border-t border-border/50">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleClose}
                                            disabled={isLoading}
                                            className="flex-1 h-12 bg-background/40 backdrop-blur-xl border border-border hover:bg-accent hover:scale-105 transition-all duration-300 font-medium"
                                            style={{
                                                boxShadow: `
                                                    0 0 10px hsl(var(--primary) / 0.08),
                                                    0 0 20px hsl(var(--accent) / 0.04)
                                                `
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex-1 h-12 gradient-primary-to-accent text-primary-foreground border-0 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 font-medium"
                                            style={{
                                                boxShadow: `
                                                    0 0 15px hsl(var(--primary) / 0.4),
                                                    0 0 30px hsl(var(--accent) / 0.2),
                                                    inset 0 1px 0 hsl(var(--primary-foreground) / 0.1)
                                                `
                                            }}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating Project...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="mr-2 h-4 w-4" />
                                                    Create Project
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
} 