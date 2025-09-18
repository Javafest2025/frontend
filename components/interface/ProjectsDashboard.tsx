"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EnhancedTooltip } from "@/components/ui/enhanced-tooltip"
import { ProjectCreateDialog } from "@/components/interface/ProjectCreateDialog"
import { ProjectEditDialog } from "@/components/interface/ProjectEditDialog"
import { ProjectStatsPieChart } from "@/components/interface/ProjectStatsPieChart"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { useToast } from "@/hooks/use-toast"
import { projectsApi, readingListApi, notesApi } from "@/lib/api/project-service"
import { libraryApi } from "@/lib/api/project-service/library"
import { Project, ProjectStatus } from "@/types/project"
import { useSharedProjects } from "@/hooks/useSharedProjects"
import {
    Plus,
    Search,
    BookOpen,
    BarChart3,
    MessageSquare,
    Clock,
    CheckCircle,
    PlayCircle,
    PauseCircle,
    Filter,
    Star,
    Users,
    Database,
    Zap,
    Edit,
    Loader2,
    Trash2,
    Archive,
    Layers,
    Play,
    Pause,
    CheckCircle2,
    Archive as ArchiveIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function ProjectsDashboard() {
    const router = useRouter()
    const { toast } = useToast()
    const [projects, setProjects] = useState<Project[]>([])
    const [paperCounts, setPaperCounts] = useState<Record<string, number>>({})
    const [searchQuery, setSearchQuery] = useState("")
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showStatsChart, setShowStatsChart] = useState(false)
    const [selectedProjectForStats, setSelectedProjectForStats] = useState<Project | null>(null)
    const [projectStats, setProjectStats] = useState<{
        totalNotes: number
        totalReadingList: number
    } | null>(null)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [selectedStatus, setSelectedStatus] = useState<string>("all")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [openingProjectId, setOpeningProjectId] = useState<string | null>(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Hook to track shared projects
    const { isProjectShared, refreshSharedProjects } = useSharedProjects(projects)

    // Load projects on component mount
    useEffect(() => {
        loadProjects()
    }, [])

    // Load paper counts when projects are loaded
    useEffect(() => {
        if (projects.length > 0) {
            loadPaperCounts()
        }
    }, [projects])

    const loadProjects = async (retryCount = 0) => {
        try {
            setIsLoading(true)
            setError(null)
            const data = await projectsApi.getProjects()
            setProjects(data)
        } catch (error) {
            console.error('Error loading projects:', error)

            // Provide more specific error messages based on the error type
            let errorMessage = 'Failed to load projects. Please try again.'

            if (error instanceof Error) {
                if (error.message.includes('fetch')) {
                    errorMessage = 'Cannot connect to server. Please check if the backend is running.'
                } else if (error.message.includes('401')) {
                    errorMessage = 'Authentication required. Please log in again.'
                } else if (error.message.includes('403')) {
                    errorMessage = 'Access denied. You may not have permission to view projects.'
                } else if (error.message.includes('404')) {
                    errorMessage = 'Projects endpoint not found. Please check the API configuration.'
                } else if (error.message.includes('500')) {
                    errorMessage = 'Server error. Please try again later.'
                } else if (error.message.includes('Invalid JSON')) {
                    errorMessage = 'Invalid response from server. Please try again.'
                } else {
                    errorMessage = error.message || errorMessage
                }
            }

            setError(errorMessage)

            // Auto-retry for network errors (up to 2 retries)
            if (retryCount < 2 && error instanceof Error && error.message.includes('fetch')) {
                console.log(`Retrying project load (attempt ${retryCount + 1})...`)
                setTimeout(() => loadProjects(retryCount + 1), 2000) // Retry after 2 seconds
            }
        } finally {
            setIsLoading(false)
        }
    }

    const loadPaperCounts = async () => {
        // Fetch actual paper counts from library stats
        const counts: Record<string, number> = {}
        for (const project of projects) {
            try {
                const libraryStats = await libraryApi.getProjectLibraryStats(project.id)
                counts[project.id] = libraryStats.totalPapers
            } catch (error) {
                console.error(`Failed to load paper count for project ${project.id}:`, error)
                // Fallback to project.totalPapers if library stats fail
                counts[project.id] = project.totalPapers ?? 0
            }
        }
        setPaperCounts(counts)
    }

    const parseProjectTags = (project: Project): string[] => {
        return project.tags || []
    }

    const parseProjectTopics = (project: Project): string[] => {
        return project.topics || []
    }

    const normalizeStatus = (status: string): string => {
        const s = status.toUpperCase()
        if (s === 'ON_HOLD' || s === 'PAUSED') return 'paused'
        if (s === 'CANCELLED' || s === 'ARCHIVED') return 'archived'
        if (s === 'ACTIVE') return 'active'
        if (s === 'COMPLETED') return 'completed'
        return 'all'
    }

    const filteredProjects = projects.filter(project => {
        const projectTags = parseProjectTags(project)
        const projectTopics = parseProjectTopics(project)
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            projectTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
            projectTopics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesStatus = selectedStatus === "all" || normalizeStatus(project.status) === selectedStatus

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
        // Refresh shared projects after creating a new project
        setTimeout(() => refreshSharedProjects(), 100)
    }

    const handleProjectUpdated = (updatedProject: Project) => {
        setProjects(prev => prev.map(p =>
            p.id === updatedProject.id ? updatedProject : p
        ))
        // Refresh shared projects after updating a project
        setTimeout(() => refreshSharedProjects(), 100)
    }

    const handleEditProject = (project: Project) => {
        setEditingProject(project)
        setShowEditDialog(true)
    }


    const handleDeleteProject = (project: Project) => {
        setProjectToDelete(project)
        setShowDeleteDialog(true)
    }

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return

        try {
            setIsDeleting(true)
            await projectsApi.deleteProject(projectToDelete.id)
            // Refresh the projects list
            loadProjects()
            console.log('Project deleted successfully')
            toast({
                title: "Project deleted",
                description: `"${projectToDelete.name}" was permanently removed.`,
            })
            setShowDeleteDialog(false)
            setProjectToDelete(null)
        } catch (error) {
            console.error('Error deleting project:', error)
            toast({
                title: "Delete failed",
                description: error instanceof Error ? error.message : 'Failed to delete project. Please try again.',
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    const handleShowProjectStats = async (project: Project) => {
        setSelectedProjectForStats(project)

        // Load project stats
        try {
            const [readingListStats, notes] = await Promise.all([
                readingListApi.getReadingListStats(project.id).catch(() => ({ totalItems: 0 })),
                notesApi.getNotes(project.id).catch(() => [])
            ])

            setProjectStats({
                totalNotes: notes.length,
                totalReadingList: readingListStats.totalItems
            })
        } catch (error) {
            console.error('Error loading project stats:', error)
            setProjectStats({
                totalNotes: 0,
                totalReadingList: 0
            })
        }

        setShowStatsChart(true)
    }

    const getStatusIcon = (status: ProjectStatus) => {
        switch (status) {
            case 'ACTIVE': return <PlayCircle className="h-4 w-4 status-active" />
            case 'PAUSED':
            case 'ON_HOLD':
                return <PauseCircle className="h-4 w-4 status-on-hold" />
            case 'COMPLETED': return <CheckCircle className="h-4 w-4 status-completed" />
            case 'ARCHIVED':
            case 'CANCELLED':
                return <Archive className="h-4 w-4 status-cancelled" />
            default: return null
        }
    }

    const getStatusColor = (status: ProjectStatus) => {
        switch (status) {
            case 'ACTIVE': return 'badge border shadow-sm backdrop-blur-sm status-active'
            case 'PAUSED':
            case 'ON_HOLD':
                return 'badge border shadow-sm backdrop-blur-sm status-on-hold'
            case 'COMPLETED': return 'badge border shadow-sm backdrop-blur-sm status-completed'
            case 'ARCHIVED':
            case 'CANCELLED':
                return 'badge border shadow-sm backdrop-blur-sm status-cancelled'
            default: return 'badge border shadow-sm backdrop-blur-sm status-cancelled'
        }
    }

    const getStatusLabel = (status: ProjectStatus) => {
        if (status === 'PAUSED' || status === 'ON_HOLD') return 'Paused'
        if (status === 'ARCHIVED' || status === 'CANCELLED') return 'Archived'
        return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    }

    const formatLastActivity = (updatedAt: string, createdAt?: string) => {
        const updateDate = new Date(updatedAt)
        const createDate = createdAt ? new Date(createdAt) : null
        const now = new Date()

        // Check if the update date is valid
        if (isNaN(updateDate.getTime())) {
            return "Recently created"
        }

        // If the project was created recently and hasn't been updated, show creation time
        if (createDate && Math.abs(updateDate.getTime() - createDate.getTime()) < 60000) { // Within 1 minute
            const createDiffInHours = Math.floor((now.getTime() - createDate.getTime()) / (1000 * 60 * 60))

            if (createDiffInHours < 0) return "Recently created"
            if (createDiffInHours < 1) return "Just created"
            if (createDiffInHours < 24) return `${createDiffInHours} hours ago`

            const createDiffInDays = Math.floor(createDiffInHours / 24)
            if (createDiffInDays < 7) return `${createDiffInDays} days ago`

            return createDate.toLocaleDateString()
        }

        // Otherwise show last update time
        const diffInHours = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60))

        // Handle negative time differences (future dates)
        if (diffInHours < 0) {
            return "Recently updated"
        }

        if (diffInHours < 1) return "Just now"
        if (diffInHours < 24) return `${diffInHours} hours ago`

        const diffInDays = Math.floor(diffInHours / 24)
        if (diffInDays < 7) return `${diffInDays} days ago`

        return updateDate.toLocaleDateString()
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
        const totalPapers = projects.reduce((sum, p) => sum + paperCounts[p.id] || 0, 0)
        const totalTasks = projects.reduce((sum, p) => sum + p.activeTasks, 0)
        const sharedProjects = projects.filter(p => isProjectShared(p.id)).length

        return {
            activeProjects,
            totalPapers,
            totalTasks,
            totalProjects: projects.length,
            sharedProjects
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
                <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-6 sm:mb-8"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-primary">
                                    Research Projects
                                </h1>
                                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                                    Manage your AI-powered research workflows and discoveries
                                </p>
                            </div>
                            <EnhancedTooltip content="Create a new research project to organize your work">
                                <Button
                                    onClick={() => setShowCreateDialog(true)}
                                    size="lg"
                                    className="group relative overflow-hidden gradient-primary-to-accent text-white border-0 shadow-lg shadow-primary transition-all duration-300 hover:shadow-accent hover:scale-105 w-full sm:w-auto"
                                >
                                    <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-300" />
                                    <span className="text-sm sm:text-base">New Project</span>
                                </Button>
                            </EnhancedTooltip>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                            {[
                                { label: "Active", value: stats.activeProjects.toString(), icon: PlayCircle, color: "text-green-500", borderColor: "border-green-500/20", shimmerColor: "via-green-500/20", shadowColor: "hover:shadow-green-500/20" },
                                { label: "Total", value: stats.totalProjects.toString(), icon: Layers, color: "text-orange-500", borderColor: "border-orange-500/20", shimmerColor: "via-orange-500/20", shadowColor: "hover:shadow-orange-500/20" },
                                { label: "Papers", value: stats.totalPapers.toString(), icon: BookOpen, color: "text-blue-500", borderColor: "border-blue-500/20", shimmerColor: "via-blue-500/20", shadowColor: "hover:shadow-blue-500/20" },
                                { label: "Tasks", value: stats.totalTasks.toString(), icon: Zap, color: "text-purple-500", borderColor: "border-purple-500/20", shimmerColor: "via-purple-500/20", shadowColor: "hover:shadow-purple-500/20" },
                                { label: "Shared", value: stats.sharedProjects.toString(), icon: Users, color: "text-blue-500", borderColor: "border-blue-500/20", shimmerColor: "via-blue-500/20", shadowColor: "hover:shadow-blue-500/20" }
                            ].map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.6 }}
                                    className="relative group"
                                >
                                    <Card className={`group relative bg-background/40 backdrop-blur-xl border ${stat.borderColor} overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${stat.shadowColor}`}>
                                        <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${stat.shimmerColor} to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out`}></div>
                                        <CardContent className="p-3 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                                    <p className="text-sm sm:text-lg font-bold text-foreground">{stat.value}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <EnhancedTooltip content="Search through your projects by name, domain, or tags">
                                <div className="relative flex-1 max-w-md w-full">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70 hover:text-muted-foreground transition-colors duration-200 z-10" />
                                    <Input
                                        placeholder="Search projects, domains, or tags..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-background/80 backdrop-blur-xl border-2 border-primary/30 focus:border-primary/50"
                                    />
                                </div>
                            </EnhancedTooltip>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                {['all', 'active', 'paused', 'completed', 'archived'].map((status) => {
                                    const getStatusIcon = (status: string) => {
                                        switch (status) {
                                            case 'all':
                                                return <Layers className="mr-1 h-3 w-3 text-blue-400" />
                                            case 'active':
                                                return <Play className="mr-1 h-3 w-3 text-green-500" />
                                            case 'paused':
                                                return <Pause className="mr-1 h-3 w-3 text-yellow-500" />
                                            case 'completed':
                                                return <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-500" />
                                            case 'archived':
                                                return <ArchiveIcon className="mr-1 h-3 w-3 text-gray-500" />
                                            default:
                                                return <Filter className="mr-1 h-3 w-3" />
                                        }
                                    }

                                    const getStatusColors = (status: string) => {
                                        switch (status) {
                                            case 'all':
                                                return selectedStatus === status
                                                    ? "bg-blue-500/20 backdrop-blur-xl border-2 border-blue-400/50 text-blue-100 shadow-lg shadow-blue-500/25"
                                                    : "bg-background/80 backdrop-blur-xl border-2 border-blue-300/30 hover:bg-blue-500/10 hover:border-blue-400/50"
                                            case 'active':
                                                return selectedStatus === status
                                                    ? "bg-green-500/20 backdrop-blur-xl border-2 border-green-400/50 text-green-100 shadow-lg shadow-green-500/25"
                                                    : "bg-background/80 backdrop-blur-xl border-2 border-green-300/30 hover:bg-green-500/10 hover:border-green-400/50"
                                            case 'paused':
                                                return selectedStatus === status
                                                    ? "bg-yellow-500/20 backdrop-blur-xl border-2 border-yellow-400/50 text-yellow-100 shadow-lg shadow-yellow-500/25"
                                                    : "bg-background/80 backdrop-blur-xl border-2 border-yellow-300/30 hover:bg-yellow-500/10 hover:border-yellow-400/50"
                                            case 'completed':
                                                return selectedStatus === status
                                                    ? "bg-emerald-500/20 backdrop-blur-xl border-2 border-emerald-400/50 text-emerald-100 shadow-lg shadow-emerald-500/25"
                                                    : "bg-background/80 backdrop-blur-xl border-2 border-emerald-300/30 hover:bg-emerald-500/10 hover:border-emerald-400/50"
                                            case 'archived':
                                                return selectedStatus === status
                                                    ? "bg-gray-500/20 backdrop-blur-xl border-2 border-gray-400/50 text-gray-100 shadow-lg shadow-gray-500/25"
                                                    : "bg-background/80 backdrop-blur-xl border-2 border-gray-300/30 hover:bg-gray-500/10 hover:border-gray-400/50"
                                            default:
                                                return selectedStatus === status
                                                    ? "bg-primary/20 backdrop-blur-xl border-2 border-primary/50 text-primary-100 shadow-lg shadow-primary/25"
                                                    : "bg-background/80 backdrop-blur-xl border-2 border-primary/30 hover:bg-primary/5 hover:border-primary/50"
                                        }
                                    }

                                    return (
                                        <Button
                                            key={status}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedStatus(status)}
                                            className={cn(
                                                getStatusColors(status),
                                                "text-xs sm:text-sm transition-all duration-200"
                                            )}
                                        >
                                            {getStatusIcon(status)}
                                            {status === 'paused' ? 'Paused' : status.charAt(0).toUpperCase() + status.slice(1)}
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 relative z-10 overflow-y-auto">
                <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-muted-foreground text-sm sm:text-base">Loading projects...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                                    <p className="text-red-500 text-sm sm:text-base">{error}</p>
                                </div>
                                <Button
                                    onClick={() => loadProjects()}
                                    variant="outline"
                                    className="bg-background/80 backdrop-blur-xl border-2 border-primary/30 hover:border-primary/50"
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
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
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
                                        <Card className="relative overflow-hidden bg-background/80 backdrop-blur-xl border-2 border-primary/25 shadow-lg hover:shadow-primary/30 transition-all duration-500 group-hover:border-primary/40 h-[300px] sm:h-[320px] flex flex-col">
                                            {/* Card Background Effects */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <CardHeader className="relative z-10 pb-2">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1.5">
                                                            {getStatusIcon(project.status)}
                                                            <Badge variant="status" className={`${getStatusColor(project.status)} text-xs`}>
                                                                {getStatusLabel(project.status)}
                                                            </Badge>
                                                            {project.domain && (
                                                                <Badge variant="outline" className="text-xs border-2 border-primary/30">
                                                                    {project.domain}
                                                                </Badge>
                                                            )}
                                                            {isProjectShared(project.id) && (
                                                                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                                                                    <Users className="h-3 w-3 mr-1" />
                                                                    Shared
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors duration-300 truncate">
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
                                                            className="group/star h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-yellow-500/10 hover:scale-110 transition-all duration-200"
                                                        >
                                                            <Star className={`h-3 w-3 sm:h-4 sm:w-4 transition-all duration-200 group-hover/star:scale-110 ${project.isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground group-hover/star:text-yellow-500 group-hover/star:fill-yellow-500'}`} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleEditProject(project)
                                                            }}
                                                            className="group/edit h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-blue-500/10 hover:scale-110 transition-all duration-200"
                                                        >
                                                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover/edit:text-blue-500 transition-all duration-200 group-hover/edit:scale-110" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <CardDescription className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300 overflow-hidden min-h-[2.5rem] sm:min-h-[2.75rem] max-h-[2.5rem] sm:max-h-[2.75rem] leading-4" style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical' as const
                                                }}>
                                                    {project.description || "No description provided"}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="relative z-10 flex-grow flex flex-col justify-between">
                                                <div className="flex-grow">

                                                    {/* Stats */}
                                                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Database className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                                                            <span className="text-xs sm:text-sm font-medium">{paperCounts[project.id] || 0} papers</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                                                            <span className="text-xs sm:text-sm text-muted-foreground">
                                                                {formatLastActivity(project.updatedAt, project.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mb-2">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs sm:text-sm font-medium">Progress</span>
                                                            <span className="text-xs sm:text-sm text-muted-foreground">{project.progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-secondary/50 rounded-full h-2">
                                                            <div
                                                                className="gradient-primary-to-accent h-2 rounded-full transition-all duration-1000 ease-out"
                                                                style={{ width: `${project.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {parseProjectTags(project).slice(0, 3).map((tag) => (
                                                            <Badge
                                                                key={tag}
                                                                variant="secondary"
                                                                className="text-xs bg-primary/10 text-primary border-2 border-primary/30"
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
                                                <div className="flex gap-1 sm:gap-2">
                                                    <Button
                                                        size="sm"
                                                        disabled={openingProjectId === project.id}
                                                        className="group/open flex-1 gradient-primary-to-accent text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden text-xs sm:text-sm hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleOpenProject(project.id)
                                                        }}
                                                    >
                                                        {openingProjectId === project.id ? (
                                                            <>
                                                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent-2/20 animate-pulse" />
                                                                <Loader2 className="mr-1 h-3 w-3 animate-spin relative z-10" />
                                                                <span className="relative z-10">Opening...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PlayCircle className="mr-1 h-3 w-3 group-hover/open:scale-110 group-hover/open:rotate-12 transition-all duration-200" />
                                                                <span className="group-hover/open:font-semibold transition-all duration-200">Open</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="group/analytics bg-background/40 backdrop-blur-xl border-2 border-primary/30 hover:bg-blue-500/10 hover:border-blue-400/50 hover:scale-110 h-8 w-8 sm:h-9 sm:w-9 p-0 transition-all duration-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleShowProjectStats(project)
                                                        }}
                                                    >
                                                        <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover/analytics:text-blue-500 group-hover/analytics:scale-110 transition-all duration-200" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="group/chat bg-background/40 backdrop-blur-xl border-2 border-primary/30 hover:bg-green-500/10 hover:border-green-400/50 hover:scale-110 h-8 w-8 sm:h-9 sm:w-9 p-0 transition-all duration-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            // Navigate to project quick notes
                                                            router.push(`/interface/projects/${project.id}/notes`)
                                                        }}
                                                    >
                                                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover/chat:text-green-500 group-hover/chat:scale-110 transition-all duration-200" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="group/delete bg-background/40 backdrop-blur-xl border-2 border-primary/30 hover:bg-red-500/10 hover:border-red-400/50 hover:scale-110 h-8 w-8 sm:h-9 sm:w-9 p-0 transition-all duration-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteProject(project)
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover/delete:text-red-500 group-hover/delete:scale-110 transition-all duration-200" />
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
                                <Search className="relative h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold mb-2">No projects found</h3>
                            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                                {searchQuery ? "Try adjusting your search criteria" : "Create your first research project to get started"}
                            </p>
                            <Button
                                onClick={() => setShowCreateDialog(true)}
                                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white text-sm sm:text-base"
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

            {/* Project Statistics Pie Chart Dialog */}
            {selectedProjectForStats && (
                <ProjectStatsPieChart
                    open={showStatsChart}
                    onOpenChange={setShowStatsChart}
                    projectName={selectedProjectForStats.name}
                    stats={{
                        totalPapers: paperCounts[selectedProjectForStats.id] || 0,
                        totalNotes: projectStats?.totalNotes || 0,
                        totalReadingList: projectStats?.totalReadingList || 0,
                        totalDocuments: 0 // TODO: Get actual documents count
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={confirmDeleteProject}
                projectName={projectToDelete?.name || ""}
                isLoading={isDeleting}
            />

        </div>
    )
} 