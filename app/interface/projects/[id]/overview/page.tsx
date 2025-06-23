"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
    Sparkles,
    BookOpen,
    Target,
    Calendar,
    User,
    Tag,
    Globe,
    TrendingUp,
    Clock,
    CheckCircle,
    RefreshCw,
    AlertCircle,
    BarChart3,
    Database,
    Brain,
    Users,
    Edit3,
    Archive
} from "lucide-react"
import { projectsApi } from "@/lib/api/projects"
import { Project } from "@/types/project"

interface ProjectOverviewPageProps {
    params: Promise<{
        id: string
    }>
}

export default function ProjectOverviewPage({ params }: ProjectOverviewPageProps) {
    const [projectId, setProjectId] = useState<string>("")
    const [project, setProject] = useState<Project | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load project data
    useEffect(() => {
        const loadData = async () => {
            const resolvedParams = await params
            setProjectId(resolvedParams.id)
            try {
                const projectData = await projectsApi.getProject(resolvedParams.id)
                setProject(projectData)
            } catch (error) {
                console.error('Error loading project:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [params])

    const parseProjectTopics = (project: Project): string[] => {
        return project.topics || []
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading project overview...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                        <p className="text-muted-foreground">Project not found</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
            {/* Enhanced Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/15 via-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />

            <div className="relative z-10 container mx-auto px-8 py-8">
                {/* Enhanced Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-12"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-6 mb-6">
                                <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                                {project.name}
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-4xl leading-relaxed">
                                {project.description || "No description provided for this research project."}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="bg-background/40 backdrop-blur-xl border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                                style={{
                                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.15), inset 0 0 20px rgba(99, 102, 241, 0.05)'
                                }}
                            >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit Project
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white shadow-lg hover:shadow-primary/25 transition-all duration-300"
                                style={{
                                    boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                <Archive className="mr-2 h-4 w-4" />
                                Export Project
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Enhanced Main Content Grid - Now 2 columns instead of 3 */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                    {/* Left Column - Project Details (3/5 width) */}
                    <div className="xl:col-span-3 space-y-8">
                        {/* Enhanced Project Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <Card
                                className="bg-background/50 backdrop-blur-xl border border-primary/20 shadow-2xl hover:shadow-primary/20 transition-all duration-500 group"
                                style={{
                                    boxShadow: '0 0 40px rgba(99, 102, 241, 0.1), inset 0 0 40px rgba(99, 102, 241, 0.03)'
                                }}
                            >
                                <CardHeader className="pb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl">
                                        <Globe className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                                        Project Information
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        Detailed information about this research project
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                                    <User className="h-4 w-4" />
                                                    Project Creator
                                                </label>
                                                <p className="text-foreground font-medium text-lg">You</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                                    <Calendar className="h-4 w-4" />
                                                    Created Date
                                                </label>
                                                <p className="text-foreground text-lg">{new Date().toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                                    <Clock className="h-4 w-4" />
                                                    Last Updated
                                                </label>
                                                <p className="text-foreground text-lg">{new Date().toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                                    <Target className="h-4 w-4" />
                                                    Project Status
                                                </label>
                                                <Badge
                                                    className="bg-green-500/15 text-green-400 border-green-500/30 px-3 py-1 text-sm font-medium"
                                                    style={{
                                                        boxShadow: '0 0 15px rgba(34, 197, 94, 0.2)'
                                                    }}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Active
                                                </Badge>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                                    <Globe className="h-4 w-4" />
                                                    Domain
                                                </label>
                                                <p className="text-foreground text-lg">Computer Science Research</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                                    <Users className="h-4 w-4" />
                                                    Collaborators
                                                </label>
                                                <p className="text-foreground text-lg">Solo Project</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Enhanced Research Topics & Tags */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            <Card
                                className="bg-background/50 backdrop-blur-xl border border-primary/20 shadow-2xl hover:shadow-primary/20 transition-all duration-500 group"
                                style={{
                                    boxShadow: '0 0 40px rgba(99, 102, 241, 0.1), inset 0 0 40px rgba(99, 102, 241, 0.03)'
                                }}
                            >
                                <CardHeader className="pb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl">
                                        <Tag className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                                        Research Focus
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        Topics and keywords related to this research project
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div>
                                        <label className="text-sm font-semibold text-muted-foreground mb-4 block">
                                            Research Topics
                                        </label>
                                        <div className="flex flex-wrap gap-3">
                                            {parseProjectTopics(project).map((topic) => (
                                                <Badge
                                                    key={topic}
                                                    variant="outline"
                                                    className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 transition-all duration-300 px-4 py-2 text-sm font-medium"
                                                    style={{
                                                        boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)'
                                                    }}
                                                >
                                                    {topic}
                                                </Badge>
                                            ))}
                                            {parseProjectTopics(project).length === 0 && (
                                                <p className="text-muted-foreground text-base">No topics specified</p>
                                            )}
                                        </div>
                                    </div>
                                    <Separator className="opacity-30" />
                                    <div>
                                        <label className="text-sm font-semibold text-muted-foreground mb-4 block">
                                            Keywords & Tags
                                        </label>
                                        <div className="flex flex-wrap gap-3">
                                            <Badge
                                                variant="secondary"
                                                className="bg-background/60 border-muted/50 hover:border-primary/30 transition-all duration-300 px-4 py-2 text-sm"
                                                style={{
                                                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.1)'
                                                }}
                                            >
                                                experimental design
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                className="bg-background/60 border-muted/50 hover:border-primary/30 transition-all duration-300 px-4 py-2 text-sm"
                                                style={{
                                                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.1)'
                                                }}
                                            >
                                                statistical methods
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                className="bg-background/60 border-muted/50 hover:border-primary/30 transition-all duration-300 px-4 py-2 text-sm"
                                                style={{
                                                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.1)'
                                                }}
                                            >
                                                research methodology
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right Column - Enhanced Quick Stats (2/5 width) */}
                    <div className="xl:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            <Card
                                className="bg-background/50 backdrop-blur-xl border border-primary/20 shadow-2xl hover:shadow-primary/20 transition-all duration-500 group sticky top-8"
                                style={{
                                    boxShadow: '0 0 40px rgba(99, 102, 241, 0.1), inset 0 0 40px rgba(99, 102, 241, 0.03)'
                                }}
                            >
                                <CardHeader className="pb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl">
                                        <BarChart3 className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                                        Project Statistics
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        Key metrics and progress overview
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {[
                                        { label: "Total Papers", value: project.totalPapers, icon: BookOpen, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
                                        { label: "Active Tasks", value: project.activeTasks, icon: Target, color: "text-yellow-400", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/30" },
                                        { label: "Progress", value: `${project.progress}%`, icon: TrendingUp, color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/30" },
                                        { label: "AI Insights", value: "0", icon: Brain, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30" }
                                    ].map((stat, index) => (
                                        <motion.div
                                            key={stat.label}
                                            className={`flex items-center justify-between p-4 ${stat.bgColor} rounded-xl border ${stat.borderColor} hover:scale-105 transition-all duration-300 group/stat`}
                                            style={{
                                                boxShadow: '0 0 20px rgba(99, 102, 241, 0.1)'
                                            }}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <stat.icon className={`h-6 w-6 ${stat.color} group-hover/stat:scale-110 transition-transform duration-300`} />
                                                <span className="font-semibold text-lg">{stat.label}</span>
                                            </div>
                                            <span className="font-bold text-foreground text-xl">{stat.value}</span>
                                        </motion.div>
                                    ))}

                                    {/* Progress Bar */}
                                    <div className="pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-muted-foreground">Overall Progress</span>
                                            <span className="text-sm font-bold text-foreground">{project.progress}%</span>
                                        </div>
                                        <div className="relative">
                                            <Progress
                                                value={project.progress}
                                                className="h-3 bg-primary/10 border border-primary/20 rounded-full"
                                                style={{
                                                    boxShadow: 'inset 0 0 10px rgba(99, 102, 241, 0.1)'
                                                }}
                                            />
                                            <div
                                                className="absolute top-0 left-0 h-3 bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${project.progress}%`,
                                                    boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
} 