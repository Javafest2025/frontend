"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProjectCreateDialog } from "@/components/interface/ProjectCreateDialog"
import { ProjectEditDialog } from "@/components/interface/ProjectEditDialog"
import { projectsApi } from "@/lib/api/projects"
import { Project, ProjectStatus } from "@/types/project"
import {
    Plus,
    Search,
    BookOpen,
    Brain,
    BarChart3,
    MessageSquare,
    Clock,
    CheckCircle,
    PlayCircle,
    PauseCircle,
    Filter,
    Star,
    Calendar,
    Users,
    Database,
    TrendingUp,
    Zap,
    Settings,
    MoreVertical,
    Edit,
    Loader2
} from "lucide-react"

export function ProjectsDashboard() {
    const router = useRouter()
    const [projects, setProjects] = useState<Project[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [selectedStatus, setSelectedStatus] = useState<string>("all")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [openingProjectId, setOpeningProjectId] = useState<string | null>(null)

    // Load projects on component mount
    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const data = await projectsApi.getProjects()
            setProjects(data)
        } catch (error) {
            console.error('Error loading projects:', error)
            setError('Failed to load projects. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const parseProjectTags = (project: Project): string[] => {
        return project.tags || []
    }

    const parseProjectTopics = (project: Project): string[] => {
        return project.topics || []
    }

    const filteredProjects = projects.filter(project => {
        const projectTags = parseProjectTags(project)
        const projectTopics = parseProjectTopics(project)
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (project.domain && project.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            projectTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
            projectTopics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesStatus = selectedStatus === "all" || project.status.toLowerCase() === selectedStatus

        return matchesSearch && matchesStatus
    })

    const toggleStar = async (projectId: string) => {
        try {
            const updatedProject = await projectsApi.toggleStar(projectId)
            setProjects(prev => prev.map(p =>
                p.id === projectId ? updatedProject : p
            ))
        } catch (error) {
            console.error('Error toggling star:', error)
        }
    }

    const handleProjectCreated = (newProject: Project) => {
        setProjects(prev => [newProject, ...prev])
    }

    const handleProjectUpdated = (updatedProject: Project) => {
        setProjects(prev => prev.map(p =>
            p.id === updatedProject.id ? updatedProject : p
        ))
    }

    const handleEditProject = (project: Project) => {
        setEditingProject(project)
        setShowEditDialog(true)
    }

    const getStatusIcon = (status: ProjectStatus) => {
        switch (status) {
            case 'ACTIVE': return <PlayCircle className="h-4 w-4 text-green-500" />
            case 'PAUSED': return <PauseCircle className="h-4 w-4 text-yellow-500" />
            case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-blue-500" />
            case 'ARCHIVED': return <MoreVertical className="h-4 w-4 text-gray-500" />
            default: return null
        }
    }

    const getStatusColor = (status: ProjectStatus) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'PAUSED': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            case 'COMPLETED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case 'ARCHIVED': return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }

    const getStatusLabel = (status: ProjectStatus) => {
        return status.charAt(0) + status.slice(1).toLowerCase()
    }

    const formatLastActivity = (updatedAt: string) => {
        const date = new Date(updatedAt)
        const now = new Date()
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

        if (diffInHours < 1) return "Just now"
        if (diffInHours < 24) return `${diffInHours} hours ago`

        const diffInDays = Math.floor(diffInHours / 24)
        if (diffInDays < 7) return `${diffInDays} days ago`

        return date.toLocaleDateString()
    }

    const handleOpenProject = async (projectId: string) => {
        try {
            setOpeningProjectId(projectId)
            // Add a slight delay to show the loading state
            await new Promise(resolve => setTimeout(resolve, 500))
            router.push(`/interface/projects/${projectId}`)
        } catch (error) {
            console.error('Error opening project:', error)
        } finally {
            setOpeningProjectId(null)
        }
    }

    const calculateStats = () => {
        const activeProjects = projects.filter(p => p.status === 'ACTIVE').length
        const totalPapers = projects.reduce((sum, p) => sum + p.totalPapers, 0)
        const totalTasks = projects.reduce((sum, p) => sum + p.activeTasks, 0)

        return {
            activeProjects,
            totalPapers,
            totalTasks,
            totalProjects: projects.length
        }
    }

    const stats = calculateStats()

    return (
        <div className="h-full bg-gradient-to-br from-background via-background/95 to-primary/5 relative flex flex-col">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

            {/* Fixed Header Section */}
            <div className="relative z-10 bg-gradient-to-br from-background via-background/95 to-primary/5 backdrop-blur-xl border-b border-primary/10">
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                                    Research Projects
                                </h1>
                                <p className="text-muted-foreground mt-2">
                                    Manage your AI-powered research workflows and discoveries
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowCreateDialog(true)}
                                size="lg"
                                className="group relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white border-0 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40 hover:scale-105"
                            >
                                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                                New Project
                            </Button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: "Active Projects", value: stats.activeProjects.toString(), icon: PlayCircle, color: "text-green-500" },
                                { label: "Total Papers", value: stats.totalPapers.toString(), icon: BookOpen, color: "text-blue-500" },
                                { label: "Active Tasks", value: stats.totalTasks.toString(), icon: Zap, color: "text-purple-500" },
                                { label: "Total Projects", value: stats.totalProjects.toString(), icon: Database, color: "text-orange-500" }
                            ].map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.6 }}
                                    className="relative group"
                                >
                                    <Card className="relative overflow-hidden bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg hover:shadow-primary/20 transition-all duration-300 group-hover:scale-105">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <CardContent className="p-4 relative z-10">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                                </div>
                                                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search projects, domains, or tags..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-background/40 backdrop-blur-xl border-primary/20 focus:border-primary/40"
                                />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'active', 'paused', 'completed', 'archived'].map((status) => (
                                    <Button
                                        key={status}
                                        variant={selectedStatus === status ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedStatus(status)}
                                        className={selectedStatus === status
                                            ? "bg-gradient-to-r from-primary to-purple-600 text-white"
                                            : "bg-background/40 backdrop-blur-xl border-primary/20 hover:bg-primary/5"
                                        }
                                    >
                                        <Filter className="mr-1 h-3 w-3" />
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 relative z-10 overflow-y-auto">
                <div className="container mx-auto px-6 py-8">

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-muted-foreground">Loading projects...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                                    <p className="text-red-500">{error}</p>
                                </div>
                                <Button
                                    onClick={loadProjects}
                                    variant="outline"
                                    className="bg-background/40 backdrop-blur-xl border-primary/20"
                                >
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Projects Grid */}
                    {!isLoading && !error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredProjects.map((project, index) => (
                                    <motion.div
                                        key={project.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.1, duration: 0.4 }}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        className="group cursor-pointer"
                                    >
                                        <Card className="relative overflow-hidden bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg hover:shadow-primary/30 transition-all duration-500 group-hover:border-primary/30 h-[380px] flex flex-col">
                                            {/* Card Background Effects */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <CardHeader className="relative z-10 pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {getStatusIcon(project.status)}
                                                            <Badge className={`${getStatusColor(project.status)} text-xs`}>
                                                                {getStatusLabel(project.status)}
                                                            </Badge>
                                                            {project.domain && (
                                                                <Badge variant="outline" className="text-xs border-primary/20">
                                                                    {project.domain}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                                                            {project.name}
                                                        </CardTitle>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                toggleStar(project.id)
                                                            }}
                                                            className="h-8 w-8 p-0 hover:bg-primary/10"
                                                        >
                                                            <Star className={`h-4 w-4 transition-colors ${project.isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleEditProject(project)
                                                            }}
                                                            className="h-8 w-8 p-0 hover:bg-primary/10"
                                                        >
                                                            <Edit className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <CardDescription className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300 overflow-hidden min-h-[3.5rem] max-h-[3.5rem] leading-5" style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical' as const
                                                }}>
                                                    {project.description || "No description provided"}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="relative z-10 flex-grow flex flex-col justify-between">
                                                <div className="flex-grow">
                                                    {/* Progress Bar */}
                                                    <div className="mb-3">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm font-medium">Progress</span>
                                                            <span className="text-sm text-muted-foreground">{project.progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-secondary/50 rounded-full h-2">
                                                            <div
                                                                className="bg-gradient-to-r from-primary to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                                                                style={{ width: `${project.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Stats */}
                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Database className="h-4 w-4 text-blue-500" />
                                                            <span className="text-sm font-medium">{project.totalPapers} papers</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-green-500" />
                                                            <span className="text-sm text-muted-foreground">{formatLastActivity(project.updatedAt)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {parseProjectTags(project).slice(0, 3).map((tag) => (
                                                            <Badge
                                                                key={tag}
                                                                variant="secondary"
                                                                className="text-xs bg-primary/10 text-primary border-primary/20"
                                                            >
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                        {parseProjectTags(project).length > 3 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{parseProjectTags(project).length - 3}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        disabled={openingProjectId === project.id}
                                                        className="flex-1 bg-gradient-to-r from-primary/80 to-purple-600/80 hover:from-primary hover:to-purple-600 text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleOpenProject(project.id)
                                                        }}
                                                    >
                                                        {openingProjectId === project.id ? (
                                                            <>
                                                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-600/20 animate-pulse" />
                                                                <Loader2 className="mr-1 h-3 w-3 animate-spin relative z-10" />
                                                                <span className="relative z-10">Opening...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PlayCircle className="mr-1 h-3 w-3" />
                                                                Open
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-background/40 backdrop-blur-xl border-primary/20 hover:bg-primary/5"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            // Analytics/insights for this project
                                                            console.log("Show project analytics for", project.id)
                                                        }}
                                                    >
                                                        <BarChart3 className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-background/40 backdrop-blur-xl border-primary/20 hover:bg-primary/5"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            // Open project chat
                                                            console.log("Open chat for", project.id)
                                                        }}
                                                    >
                                                        <MessageSquare className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Empty State */}
                    {filteredProjects.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-16"
                        >
                            <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full opacity-20 blur-xl" />
                                <Search className="relative h-16 w-16 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
                            <p className="text-muted-foreground mb-6">
                                {searchQuery ? "Try adjusting your search criteria" : "Create your first research project to get started"}
                            </p>
                            <Button
                                onClick={() => setShowCreateDialog(true)}
                                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create Project
                            </Button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Project Creation Dialog */}
            <ProjectCreateDialog
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onProjectCreated={handleProjectCreated}
            />

            {/* Project Edit Dialog */}
            <ProjectEditDialog
                isOpen={showEditDialog}
                project={editingProject}
                onClose={() => setShowEditDialog(false)}
                onProjectUpdated={handleProjectUpdated}
            />
        </div>
    )
} 