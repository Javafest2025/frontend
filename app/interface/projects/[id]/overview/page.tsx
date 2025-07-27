"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { ShareProjectDialog } from "@/components/interface/ShareProjectDialog"
import { ProjectEditDialog } from "@/components/interface/ProjectEditDialog"
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
    Share2,
    MessageSquare,
    ListTodo
} from "lucide-react"
import { projectsApi } from "@/lib/api/projects"
import { getProjectLibraryStats } from "@/lib/api/library"
import { accountApi } from "@/lib/api/account"
import { Project } from "@/types/project"
import { UserAccount } from "@/types/account"

interface ProjectOverviewPageProps {
    params: Promise<{
        id: string
    }>
}

export default function ProjectOverviewPage({ params }: ProjectOverviewPageProps) {
    const [projectId, setProjectId] = useState<string>("")
    const [project, setProject] = useState<Project | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showShareDialog, setShowShareDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)

    // New state for accurate statistics
    const [libraryStats, setLibraryStats] = useState<{ totalPapers: number } | null>(null)
    const [readingListStats, setReadingListStats] = useState<{ totalItems: number } | null>(null)
    const [notesCount, setNotesCount] = useState<number>(0)
    const [userAccount, setUserAccount] = useState<UserAccount | null>(null)

    // Load project data
    useEffect(() => {
        const loadData = async () => {
            const resolvedParams = await params
            setProjectId(resolvedParams.id)
            try {
                // Load all data in parallel
                const [projectData, libraryStatsData, readingListStatsData, notesData, accountData] = await Promise.all([
                    projectsApi.getProject(resolvedParams.id),
                    getProjectLibraryStats(resolvedParams.id).catch(() => ({ data: { totalPapers: 0 } })),
                    projectsApi.getReadingListStats(resolvedParams.id, 'all').catch(() => ({ totalItems: 0 })),
                    projectsApi.getNotes(resolvedParams.id).catch(() => []),
                    accountApi.getAccount()
                ])

                setProject(projectData)
                setLibraryStats(libraryStatsData.data)
                setReadingListStats(readingListStatsData)
                setNotesCount(Array.isArray(notesData) ? notesData.length : 0)
                setUserAccount(accountData)
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

    const handleProjectUpdated = (updatedProject: Project) => {
        setProject(updatedProject)
    }

    const handleEditProject = () => {
        setShowEditDialog(true)
    }

    // Get user display name
    const getUserDisplayName = () => {
        if (userAccount?.fullName) {
            return userAccount.fullName
        }
        if (userAccount?.email) {
            return userAccount.email
        }
        return "You"
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
                        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                        <p className="text-muted-foreground">Project not found</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

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
                            <h1 className="text-5xl font-bold text-gradient-primary flex items-center gap-6 mb-6">
                                <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                                {project.name}
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-4xl leading-relaxed">
                                {project.description || "No description provided for this research project."}
                            </p>
                        </div>
                        <div className="flex gap-3 ml-8">
                            <Button
                                variant="outline"
                                onClick={handleEditProject}
                                className="bg-background/40 backdrop-blur-xl border-border hover:bg-accent transition-all duration-300"
                                style={{
                                    boxShadow: `
                                        0 0 20px hsl(var(--primary) / 0.15),
                                        inset 0 0 20px hsl(var(--primary) / 0.05)
                                    `
                                }}
                            >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit Project
                            </Button>
                            <Button
                                variant="outline"
                                className="bg-background/40 backdrop-blur-xl border-border hover:bg-accent transition-all duration-300"
                                style={{
                                    boxShadow: `
                                        0 0 20px hsl(var(--primary) / 0.15),
                                        inset 0 0 20px hsl(var(--primary) / 0.05)
                                    `
                                }}
                                onClick={() => setShowShareDialog(true)}
                            >
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Project
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
                                className="bg-background/50 backdrop-blur-xl border border-border shadow-2xl hover:shadow-primary/20 transition-all duration-500 group"
                                style={{
                                    boxShadow: `
                                        0 0 40px hsl(var(--primary) / 0.1),
                                        inset 0 0 40px hsl(var(--primary) / 0.03)
                                    `
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
                                <CardContent>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                                    <User className="h-4 w-4" />
                                                    Project Creator
                                                </label>
                                                <p className="text-foreground font-medium text-lg">{getUserDisplayName()}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                                    <Calendar className="h-4 w-4" />
                                                    Created Date
                                                </label>
                                                <p className="text-foreground text-lg">{new Date(project.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                                    <Clock className="h-4 w-4" />
                                                    Last Updated
                                                </label>
                                                <p className="text-foreground text-lg">{new Date(project.updatedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Project Status
                                                </label>
                                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Active
                                                </Badge>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                                    <Globe className="h-4 w-4" />
                                                    Domain
                                                </label>
                                                <p className="text-foreground text-lg">{project.domain || "Computer Science Research"}</p>
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

                        {/* Enhanced Research Focus */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            <Card
                                className="bg-background/50 backdrop-blur-xl border border-border shadow-2xl hover:shadow-primary/20 transition-all duration-500 group"
                                style={{
                                    boxShadow: `
                                        0 0 40px hsl(var(--primary) / 0.1),
                                        inset 0 0 40px hsl(var(--primary) / 0.03)
                                    `
                                }}
                            >
                                <CardHeader className="pb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl">
                                        <Target className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                                        Research Focus
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        Topics and keywords related to this research project
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                                                <Tag className="h-4 w-4" />
                                                Research Topics
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {parseProjectTopics(project).length > 0 ? (
                                                    parseProjectTopics(project).map((topic, index) => (
                                                        <Badge
                                                            key={index}
                                                            className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1"
                                                        >
                                                            {topic}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <div className="text-muted-foreground italic">
                                                        No research topics defined yet
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right Column - Statistics (2/5 width) */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Enhanced Project Statistics */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                        >
                            <Card
                                className="bg-background/50 backdrop-blur-xl border border-border shadow-2xl hover:shadow-primary/20 transition-all duration-500 group"
                                style={{
                                    boxShadow: `
                                        0 0 40px hsl(var(--primary) / 0.1),
                                        inset 0 0 40px hsl(var(--primary) / 0.03)
                                    `
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
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-4 rounded-lg bg-background/30 border border-border">
                                                <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                                <div className="text-2xl font-bold text-foreground">{libraryStats?.totalPapers || 0}</div>
                                                <div className="text-sm text-muted-foreground">Total Papers</div>
                                            </div>
                                            <div className="text-center p-4 rounded-lg bg-background/30 border border-border">
                                                <ListTodo className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                                                <div className="text-2xl font-bold text-foreground">{readingListStats?.totalItems || 0}</div>
                                                <div className="text-sm text-muted-foreground">Reading List</div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-foreground">Progress</span>
                                                <span className="text-sm text-muted-foreground">{project.progress || 0}%</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-green-500" />
                                                <Progress value={project.progress || 0} className="flex-1" />
                                            </div>
                                        </div>
                                        <div className="text-center p-4 rounded-lg bg-background/30 border border-border">
                                            <MessageSquare className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                                            <div className="text-2xl font-bold text-foreground">{notesCount}</div>
                                            <div className="text-sm text-muted-foreground">Notes</div>
                                        </div>
                                        <Separator />
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-gradient-primary">{project.progress || 0}%</div>
                                            <div className="text-sm text-muted-foreground">Overall Progress</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Share Project Dialog */}
            <ShareProjectDialog
                isOpen={showShareDialog}
                projectId={projectId}
                projectName={project?.name || ''}
                onClose={() => setShowShareDialog(false)}
                onCollaboratorAdded={() => {
                    // Optionally refresh project data or show updated collaborator list
                    console.log('Collaborator added successfully')
                }}
            />

            {/* Edit Project Dialog */}
            <ProjectEditDialog
                isOpen={showEditDialog}
                project={project}
                onClose={() => setShowEditDialog(false)}
                onProjectUpdated={handleProjectUpdated}
            />
        </div>
    )
} 