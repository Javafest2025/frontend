"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    BookOpen,
    Search,
    Filter,
    Plus,
    Star,
    Calendar,
    Clock,
    Target,
    TrendingUp,
    BarChart3,
    Lightbulb,
    Globe,
    Upload,
    Edit3,
    Users,
    Building,
    Hash,
    Quote,
    ExternalLink,
    Download,
    Eye,
    MoreVertical,
    ArrowUp,
    ArrowDown,
    SortAsc,
    SortDesc,
    CheckCircle,
    XCircle,
    PlayCircle,
    PauseCircle,
    SkipForward,
    Bookmark,
    Tag,
    FileText,
    Zap,
    Award,
    MapPin,
    Mail,
    ArrowUpRight,
    ChevronRight,
    Copy,
    CheckCircle2,
    Link,
    Info,
    Loader2,
    AlertTriangle,
    ListChecks,
    UnderwaterJokulhlaup,
    SubmarineGlacialOutburst,
    UnderwaterGlacialOutburst,
    Flame,
    Grid3X3,
    List,
    Trash2,
    Play,
    RefreshCw,
    Settings2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils/cn"
import { projectsApi } from "@/lib/api/projects"
import { getProjectLibrary } from "@/lib/api/library"
import type { Paper } from "@/types/websearch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ReadingListItem, ReadingListStats } from "@/types/project"

interface ProjectReadingListPageProps {
    params: Promise<{
        id: string
    }>
}

export default function ProjectReadingListPage({ params }: ProjectReadingListPageProps) {
    const { toast } = useToast()
    const [projectId, setProjectId] = useState<string>("")
    const [readingList, setReadingList] = useState<ReadingListItem[]>([])
    const [stats, setStats] = useState<ReadingListStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in-progress' | 'completed' | 'skipped' | 'recommendations'>('all')
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title' | 'rating' | 'difficulty'>('date')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [filterPriority, setFilterPriority] = useState<string>("all")
    const [filterDifficulty, setFilterDifficulty] = useState<string>("all")
    const [filterRelevance, setFilterRelevance] = useState<string>("all")
    const [isAddingPaper, setIsAddingPaper] = useState(false)
    const [libraryPapers, setLibraryPapers] = useState<Paper[]>([])
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false)
    const [librarySearchQuery, setLibrarySearchQuery] = useState("")
    const [selectedItem, setSelectedItem] = useState<ReadingListItem | null>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
    const [showFilters, setShowFilters] = useState(false)
    const [showNoteDialog, setShowNoteDialog] = useState(false)
    const [noteItemId, setNoteItemId] = useState<string>("")
    const [noteText, setNoteText] = useState("")
    const [showProgressDialog, setShowProgressDialog] = useState(false)
    const [progressItemId, setProgressItemId] = useState<string>("")
    const [progressValue, setProgressValue] = useState(0)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editItem, setEditItem] = useState<ReadingListItem | null>(null)

    // Load reading list data
    useEffect(() => {
        const loadData = async () => {
            const resolvedParams = await params
            setProjectId(resolvedParams.id)

            try {
                await Promise.all([
                    loadReadingList(resolvedParams.id),
                    loadReadingListStats(resolvedParams.id)
                ])
            } catch (error) {
                console.error('Error loading reading list data:', error)
                toast({
                    title: "Error",
                    description: "Failed to load reading list data. Please try again.",
                    variant: "destructive"
                })
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [params, toast])

    const loadLibraryPapers = async (projectId: string) => {
        try {
            setIsLoadingLibrary(true)
            const response = await getProjectLibrary(projectId)

            if (response.data.papers) {
                const processedPapers: Paper[] = (response.data.papers as any[]).map((p: any) => ({
                    ...p,
                    abstractText: p.abstractText ?? p.abstract ?? null,
                }))
                setLibraryPapers(processedPapers)
            } else {
                setLibraryPapers([])
            }
        } catch (error) {
            console.error('Error loading library papers:', error)
            toast({
                title: "Error",
                description: "Failed to load library papers. Please try again.",
                variant: "destructive"
            })
            setLibraryPapers([])
        } finally {
            setIsLoadingLibrary(false)
        }
    }

    // Function to enrich reading list items with paper details from library
    const enrichReadingListWithPaperDetails = useCallback(async (readingListItems: ReadingListItem[], projectId: string) => {
        try {
            // If we already have library papers loaded, use them
            if (libraryPapers.length > 0) {
                return readingListItems.map(item => {
                    const paperFromLibrary = libraryPapers.find(p => p.id === item.paperId)
                    return {
                        ...item,
                        paper: item.paper || paperFromLibrary
                    }
                })
            }

            // Otherwise, fetch library papers to get the details
            const response = await getProjectLibrary(projectId)
            if (response.data.papers) {
                const processedPapers: Paper[] = (response.data.papers as any[]).map((p: any) => ({
                    ...p,
                    abstractText: p.abstractText ?? p.abstract ?? null,
                }))

                // Update library papers state
                setLibraryPapers(processedPapers)

                // Enrich reading list items with paper details
                return readingListItems.map(item => {
                    const paperFromLibrary = processedPapers.find(p => p.id === item.paperId)
                    return {
                        ...item,
                        paper: item.paper || paperFromLibrary
                    }
                })
            }

            return readingListItems
        } catch (error) {
            console.error('Error enriching reading list with paper details:', error)
            return readingListItems
        }
    }, [libraryPapers])

    const loadReadingList = async (projectId: string) => {
        try {
            console.log('🔍 Loading reading list for project:', projectId)

            // Make actual API call to get reading list
            const response = await projectsApi.getReadingList(projectId, {
                status: activeTab !== 'all' ? mapTabToStatus(activeTab) : undefined,
                priority: filterPriority !== 'all' ? filterPriority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' : undefined,
                difficulty: filterDifficulty !== 'all' ? filterDifficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' : undefined,
                relevance: filterRelevance !== 'all' ? filterRelevance.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' : undefined,
                search: searchQuery || undefined,
                sortBy: sortBy as 'addedAt' | 'priority' | 'title' | 'rating' | 'difficulty',
                sortOrder: sortDirection,
                page: 1,
                limit: 100
            })

            console.log('📊 Reading list loaded:', Array.isArray(response) ? response.length : 0, 'items')

            // Ensure response is always an array
            const readingListData = Array.isArray(response) ? response : []

            // Enrich reading list items with paper details from library
            const enrichedReadingList = await enrichReadingListWithPaperDetails(readingListData, projectId)

            setReadingList(enrichedReadingList)
        } catch (error) {
            console.error('❌ Error loading reading list:', error)
            // Set empty array on error to prevent crashes
            setReadingList([])
            throw error
        }
    }

    const loadReadingListStats = async (projectId: string) => {
        try {
            // Make actual API call to get reading list stats
            const response = await projectsApi.getReadingListStats(projectId, '30d') // Get last 30 days stats

            console.log('Reading list stats response:', response)

            // Ensure response is a valid stats object
            if (response && typeof response === 'object' && 'totalItems' in response) {
                setStats(response)
            } else {
                console.warn('Invalid stats response:', response)
                setStats(null)
            }
        } catch (error) {
            console.error('Error loading reading list stats:', error)
            setStats(null)
            throw error
        }
    }

    // Function to reload reading list with current filters
    const reloadReadingList = useCallback(async () => {
        if (projectId) {
            await loadReadingList(projectId)
        }
    }, [projectId, activeTab, searchQuery, sortBy, sortDirection, filterPriority, filterDifficulty, filterRelevance])

    // Function to refresh paper details for items missing them
    const refreshPaperDetails = useCallback(async () => {
        if (projectId) {
            const itemsMissingPaperDetails = readingList.filter(item => !item.paper)
            if (itemsMissingPaperDetails.length > 0) {
                console.log(`🔄 Refreshing paper details for ${itemsMissingPaperDetails.length} items`)
                await loadReadingList(projectId)
                toast({
                    title: "Success",
                    description: `Refreshed paper details for ${itemsMissingPaperDetails.length} items`,
                })
            } else {
                toast({
                    title: "Info",
                    description: "All paper details are up to date",
                })
            }
        }
    }, [projectId, readingList, toast])

    // Reload data when filters change (for server-side filtering)
    useEffect(() => {
        if (projectId) {
            reloadReadingList()
        }
    }, [reloadReadingList])

    // Load library papers when Add Paper modal opens
    useEffect(() => {
        if (isAddingPaper && projectId && libraryPapers.length === 0) {
            loadLibraryPapers(projectId)
        }
    }, [isAddingPaper, projectId, libraryPapers.length])

    const filteredAndSortedItems = useMemo(() => {
        // Ensure readingList is always an array
        if (!Array.isArray(readingList)) {
            console.error('❌ Reading list is not an array:', readingList)
            return []
        }

        // With server-side filtering, we just need to ensure the data is safe
        return [...readingList]
    }, [readingList, activeTab])

    const handleAddToReadingList = async (paper: Paper) => {
        try {
            console.log('➕ Adding paper to reading list:', paper.title)

            // Make actual API call to add paper to reading list
            const response = await projectsApi.addToReadingList(projectId, paper.id, {
                priority: 'MEDIUM',
                difficulty: 'MEDIUM',
                relevance: 'MEDIUM'
            })

            console.log('✅ Paper added successfully')

            toast({
                title: "Success",
                description: "Paper added to reading list successfully!",
            })

            // Close the modal
            setIsAddingPaper(false)

            // Add a small delay to ensure backend has processed the addition
            await new Promise(resolve => setTimeout(resolve, 500))

            // Reload the reading list to show the new item
            await loadReadingList(projectId)

            // Also reload stats to ensure consistency
            await loadReadingListStats(projectId)
        } catch (error) {
            console.error('❌ Error adding to reading list:', error)
            toast({
                title: "Error",
                description: "Failed to add paper to reading list. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleUpdateStatus = async (itemId: string, status: ReadingListItem['status']) => {
        try {
            // Make actual API call to update reading list item status
            await projectsApi.updateReadingListItemStatus(projectId, itemId, status)

            console.log('Successfully updated reading list item status:', itemId, status)

            // Reload the reading list to get updated data
            await loadReadingList(projectId)

            toast({
                title: "Success",
                description: `Paper status updated to ${status}!`,
            })
        } catch (error) {
            console.error('Error updating status:', error)

            // Handle specific backend business rules
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            toast({
                title: "Error",
                description: errorMessage.includes('Invalid status')
                    ? "Invalid status. Please try again."
                    : "Failed to update paper status. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleUpdateProgress = async (itemId: string, progress: number) => {
        try {
            // Make actual API call to update reading progress
            await projectsApi.updateReadingProgress(projectId, itemId, progress)

            console.log('Successfully updated reading progress:', itemId, progress)

            // Reload the reading list to get updated data
            await loadReadingList(projectId)
        } catch (error) {
            console.error('Error updating progress:', error)

            // Handle specific backend business rules
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            toast({
                title: "Error",
                description: errorMessage.includes('Invalid progress')
                    ? "Progress must be between 0 and 100."
                    : "Failed to update reading progress. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleRemoveFromList = async (itemId: string) => {
        try {
            // Make actual API call to remove item from reading list
            await projectsApi.removeFromReadingList(projectId, itemId)

            console.log('Successfully removed item from reading list:', itemId)

            // Reload the reading list to get updated data
            await loadReadingList(projectId)

            toast({
                title: "Success",
                description: "Paper removed from reading list!",
            })
        } catch (error) {
            console.error('Error removing from reading list:', error)
            toast({
                title: "Error",
                description: "Failed to remove paper from reading list. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleRateItem = async (itemId: string, rating: number) => {
        try {
            // Make actual API call to rate reading list item
            await projectsApi.rateReadingListItem(projectId, itemId, rating)

            console.log('Successfully rated reading list item:', itemId, rating)

            // Reload the reading list to get updated data
            await loadReadingList(projectId)

            toast({
                title: "Success",
                description: `Paper rated ${rating} stars!`,
            })
        } catch (error) {
            console.error('Error rating item:', error)

            // Handle specific backend business rules
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            if (errorMessage.includes('Rating only allowed for completed items')) {
                toast({
                    title: "Cannot Rate Yet",
                    description: "You can only rate papers after marking them as completed. Please complete the paper first.",
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Error",
                    description: "Failed to rate paper. Please try again.",
                    variant: "destructive"
                })
            }
        }
    }

    const handleToggleBookmark = async (itemId: string) => {
        try {
            // Make actual API call to toggle bookmark
            await projectsApi.toggleReadingListItemBookmark(projectId, itemId)

            console.log('Successfully toggled bookmark for item:', itemId)

            // Reload the reading list to get updated data
            await loadReadingList(projectId)

            toast({
                title: "Success",
                description: "Bookmark status updated!",
            })
        } catch (error) {
            console.error('Error toggling bookmark:', error)
            toast({
                title: "Error",
                description: "Failed to update bookmark. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleAddNote = async (itemId: string, note: string) => {
        try {
            // Make actual API call to add note
            await projectsApi.addReadingListNote(projectId, itemId, note)

            console.log('Successfully added note to item:', itemId)

            // Reload the reading list to get updated data
            await loadReadingList(projectId)

            toast({
                title: "Success",
                description: "Note added successfully!",
            })
        } catch (error) {
            console.error('Error adding note:', error)
            toast({
                title: "Error",
                description: "Failed to add note. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleUpdateItem = async (itemId: string, updateData: any) => {
        try {
            // Make actual API call to update item
            await projectsApi.updateReadingListItem(projectId, itemId, updateData)

            console.log('Successfully updated item:', itemId, updateData)

            // Reload the reading list to get updated data
            await loadReadingList(projectId)

            toast({
                title: "Success",
                description: "Item updated successfully!",
            })
        } catch (error) {
            console.error('Error updating item:', error)
            toast({
                title: "Error",
                description: "Failed to update item. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleSkipItem = async (itemId: string) => {
        try {
            // Make actual API call to skip item
            await projectsApi.updateReadingListItemStatus(projectId, itemId, 'SKIPPED')

            console.log('Successfully skipped item:', itemId)

            // Reload the reading list to get updated data
            await loadReadingList(projectId)

            toast({
                title: "Success",
                description: "Paper marked as skipped!",
            })
        } catch (error) {
            console.error('Error skipping item:', error)
            toast({
                title: "Error",
                description: "Failed to skip paper. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleLoadRecommendations = async () => {
        try {
            console.log('Loading reading list recommendations...')

            // Make actual API call to get recommendations
            const recommendations = await projectsApi.getReadingListRecommendations(projectId, {
                limit: 10,
                excludeRead: true
            })

            console.log('Recommendations loaded:', recommendations)

            // For now, we'll add recommendations to the reading list
            // In a more sophisticated implementation, you might want to show them separately
            if (recommendations.length > 0) {
                toast({
                    title: "Success",
                    description: `${recommendations.length} recommendations loaded!`,
                })
            } else {
                toast({
                    title: "Info",
                    description: "No new recommendations available.",
                })
            }
        } catch (error) {
            console.error('Error loading recommendations:', error)
            toast({
                title: "Error",
                description: "Failed to load recommendations. Please try again.",
                variant: "destructive"
            })
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20'
            case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
            case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
            case 'LOW': return 'text-green-500 bg-green-500/10 border-green-500/20'
            default: return 'text-muted-foreground bg-muted/10 border-muted/20'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-300 border-emerald-400/40 shadow-sm shadow-emerald-500/30 backdrop-blur-sm'
            case 'IN_PROGRESS': return 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-400/40 shadow-sm shadow-blue-500/30 backdrop-blur-sm'
            case 'PENDING': return 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border-amber-400/40 shadow-sm shadow-amber-500/30 backdrop-blur-sm'
            case 'SKIPPED': return 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-400/40 shadow-sm shadow-slate-500/30 backdrop-blur-sm'
            default: return 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-400/40 shadow-sm shadow-slate-500/30 backdrop-blur-sm'
        }
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'EXPERT': return 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border-purple-400/40 shadow-sm shadow-purple-500/30 backdrop-blur-sm'
            case 'HARD': return 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border-red-400/40 shadow-sm shadow-red-500/30 backdrop-blur-sm'
            case 'MEDIUM': return 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border-amber-400/40 shadow-sm shadow-amber-500/30 backdrop-blur-sm'
            case 'EASY': return 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-300 border-emerald-400/40 shadow-sm shadow-emerald-500/30 backdrop-blur-sm'
            default: return 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-400/40 shadow-sm shadow-slate-500/30 backdrop-blur-sm'
        }
    }

    // Helper functions to safely get counts
    const getReadingListCount = () => {
        return Array.isArray(readingList) ? readingList.length : 0
    }

    const getStatusCount = (status: string) => {
        if (!Array.isArray(readingList)) return 0
        return readingList.filter(item => item.status === status).length
    }

    const getItemsMissingPaperDetails = () => {
        if (!Array.isArray(readingList)) return 0
        return readingList.filter(item => !item.paper).length
    }

    // Helper function to map frontend tab values to backend status enum values
    const mapTabToStatus = (tab: string): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' => {
        switch (tab) {
            case 'pending': return 'PENDING'
            case 'in-progress': return 'IN_PROGRESS'
            case 'completed': return 'COMPLETED'
            case 'skipped': return 'SKIPPED'
            default: return 'PENDING'
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <BookOpen className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading reading list...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10 container mx-auto px-6 py-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gradient-primary flex items-center gap-3">
                                <BookOpen className="h-8 w-8 text-primary" />
                                Reading List
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Curated reading list and paper recommendations for your research
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsAddingPaper(true)}
                            className="gradient-primary-to-accent text-primary-foreground border-0 transition-all duration-300 hover:scale-[1.02]"
                            style={{
                                boxShadow: `
                                    0 0 15px hsl(var(--primary) / 0.4),
                                    0 0 30px hsl(var(--accent) / 0.2),
                                    inset 0 1px 0 hsl(var(--primary-foreground) / 0.1)
                                `
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Paper
                        </Button>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                {stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
                    >
                        <Card className="bg-background/40 backdrop-blur-xl border-border shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Papers</p>
                                        <p className="text-2xl font-bold text-foreground">{stats?.totalItems || 0}</p>
                                    </div>
                                    <BookOpen className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-background/40 backdrop-blur-xl border-border shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                                        <p className="text-2xl font-bold text-foreground">{stats?.completionRate || 0}%</p>
                                    </div>
                                    <Target className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-background/40 backdrop-blur-xl border-border shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Reading Streak</p>
                                        <p className="text-2xl font-bold text-foreground">{stats?.readingStreak || 0} days</p>
                                    </div>
                                    <Flame className="h-8 w-8 text-orange-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-background/40 backdrop-blur-xl border-border shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg. Reading Time</p>
                                        <p className="text-2xl font-bold text-foreground">{stats?.averageReadingTime || 0} min</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Reading List - Main Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="lg:col-span-3"
                    >
                        <Card className="bg-background/40 backdrop-blur-xl border-border shadow-lg transition-all duration-300 hover:shadow-primary/5 h-full"
                            style={{
                                boxShadow: `
                                    0 0 20px hsl(var(--primary) / 0.1),
                                    0 0 40px hsl(var(--accent) / 0.06)
                                `
                            }}
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                            Reading List
                                            {getItemsMissingPaperDetails() > 0 && (
                                                <Badge variant="destructive" className="ml-2 text-xs">
                                                    {getItemsMissingPaperDetails()} missing details
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            Manage your research paper reading progress
                                            {getItemsMissingPaperDetails() > 0 && (
                                                <span className="text-orange-500 ml-1">
                                                    • Some papers need details refreshed
                                                </span>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={refreshPaperDetails}
                                            className="bg-background/40 border-border hover:bg-accent"
                                            title="Refresh paper details"
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Refresh
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowFilters(!showFilters)}
                                            className="bg-background/40 border-border hover:bg-accent"
                                        >
                                            <Filter className="mr-2 h-4 w-4" />
                                            Filters
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                            className="bg-background/40 border-border hover:bg-accent"
                                        >
                                            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Search and Filters */}
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search reading list..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 bg-background/40 border-border placeholder:text-muted-foreground"
                                        />
                                    </div>

                                    {showFilters && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="grid grid-cols-1 md:grid-cols-4 gap-4"
                                        >
                                            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                                                <SelectTrigger className="bg-background/40 border-border">
                                                    <SelectValue placeholder="Sort by" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="priority">Priority</SelectItem>
                                                    <SelectItem value="date">Date Added</SelectItem>
                                                    <SelectItem value="title">Title</SelectItem>
                                                    <SelectItem value="rating">Rating</SelectItem>
                                                    <SelectItem value="difficulty">Difficulty</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Select value={filterPriority} onValueChange={setFilterPriority}>
                                                <SelectTrigger className="bg-background/40 border-border">
                                                    <SelectValue placeholder="Priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Priorities</SelectItem>
                                                    <SelectItem value="critical">Critical</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="low">Low</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                                                <SelectTrigger className="bg-background/40 border-border">
                                                    <SelectValue placeholder="Difficulty" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Difficulties</SelectItem>
                                                    <SelectItem value="easy">Easy</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="hard">Hard</SelectItem>
                                                    <SelectItem value="expert">Expert</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Select value={filterRelevance} onValueChange={setFilterRelevance}>
                                                <SelectTrigger className="bg-background/40 border-border">
                                                    <SelectValue placeholder="Relevance" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Relevance</SelectItem>
                                                    <SelectItem value="critical">Critical</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="low">Low</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </motion.div>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="grid w-full grid-cols-5 bg-background/40 border-border">
                                        <TabsTrigger value="all" className="data-[state=active]:bg-primary/20">
                                            All ({getReadingListCount()})
                                        </TabsTrigger>
                                        <TabsTrigger value="pending" className="data-[state=active]:bg-primary/20">
                                            Pending ({getStatusCount('PENDING')})
                                        </TabsTrigger>
                                        <TabsTrigger value="in-progress" className="data-[state=active]:bg-primary/20">
                                            In Progress ({getStatusCount('IN_PROGRESS')})
                                        </TabsTrigger>
                                        <TabsTrigger value="completed" className="data-[state=active]:bg-primary/20">
                                            Completed ({getStatusCount('COMPLETED')})
                                        </TabsTrigger>
                                        <TabsTrigger value="recommendations" className="data-[state=active]:bg-primary/20">
                                            Recommendations
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value={activeTab} className="mt-4">
                                        <ScrollArea className="h-[calc(100vh-400px)]">
                                            {filteredAndSortedItems.length > 0 ? (
                                                <div className="space-y-4">
                                                    <AnimatePresence mode="popLayout">
                                                        {filteredAndSortedItems.map((item, index) => (
                                                            <motion.div
                                                                key={item.id}
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -20 }}
                                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                                className="group"
                                                            >
                                                                <Card className="bg-background/20 backdrop-blur-sm border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-start gap-3">
                                                                                    <div className="flex-shrink-0">
                                                                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
                                                                                            <FileText className="h-6 w-6 text-primary" />
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="flex items-center gap-2 mb-2">
                                                                                            <h3 className="font-semibold text-foreground truncate">
                                                                                                {item.paper?.title || (
                                                                                                    <span className="flex items-center gap-2">
                                                                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                                                                        <span className="text-muted-foreground">Loading paper details...</span>
                                                                                                    </span>
                                                                                                )}
                                                                                            </h3>
                                                                                            <Badge
                                                                                                variant="outline"
                                                                                                className={cn("text-xs", getPriorityColor(item.priority))}
                                                                                            >
                                                                                                {item.priority}
                                                                                            </Badge>
                                                                                            <Badge
                                                                                                variant="status"
                                                                                                className={cn("text-xs", getStatusColor(item.status))}
                                                                                            >
                                                                                                {item.status}
                                                                                            </Badge>
                                                                                            {item.status === 'COMPLETED' && (
                                                                                                <Badge
                                                                                                    variant="outline"
                                                                                                    className="text-xs text-green-500 bg-green-500/10 border-green-500/20"
                                                                                                >
                                                                                                    Rateable
                                                                                                </Badge>
                                                                                            )}
                                                                                            {item.difficulty && (
                                                                                                <Badge
                                                                                                    variant="status"
                                                                                                    className={cn("text-xs", getDifficultyColor(item.difficulty))}
                                                                                                >
                                                                                                    {item.difficulty}
                                                                                                </Badge>
                                                                                            )}
                                                                                        </div>

                                                                                        <p className="text-sm text-muted-foreground mb-2">
                                                                                            {item.paper?.authors?.length > 0
                                                                                                ? item.paper.authors.map(author => author.name).join(', ')
                                                                                                : item.paper
                                                                                                    ? 'Authors not available'
                                                                                                    : (
                                                                                                        <span className="flex items-center gap-2">
                                                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                                                            <span>Loading authors...</span>
                                                                                                        </span>
                                                                                                    )
                                                                                            }
                                                                                        </p>

                                                                                        {item.paper?.venueName && (
                                                                                            <p className="text-xs text-muted-foreground mb-2">
                                                                                                {item.paper.venueName} • {new Date(item.paper.publicationDate).getFullYear()}
                                                                                            </p>
                                                                                        )}

                                                                                        {item.tags && item.tags.length > 0 && (
                                                                                            <div className="flex flex-wrap gap-1 mb-2">
                                                                                                {item.tags.slice(0, 3).map((tag, tagIndex) => (
                                                                                                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                                                                                                        {tag}
                                                                                                    </Badge>
                                                                                                ))}
                                                                                                {item.tags.length > 3 && (
                                                                                                    <Badge variant="secondary" className="text-xs">
                                                                                                        +{item.tags.length - 3} more
                                                                                                    </Badge>
                                                                                                )}
                                                                                            </div>
                                                                                        )}

                                                                                        {item.notes && (
                                                                                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                                                                {item.notes}
                                                                                            </p>
                                                                                        )}

                                                                                        {item.readingProgress !== undefined && (
                                                                                            <div className="mb-2">
                                                                                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                                                                                    <span>Reading Progress</span>
                                                                                                    <span>{item.readingProgress}%</span>
                                                                                                </div>
                                                                                                <Progress value={item.readingProgress} className="h-2" />
                                                                                            </div>
                                                                                        )}

                                                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                                            <span>Added {new Date(item.addedAt).toLocaleDateString()}</span>
                                                                                            {item.estimatedTime && (
                                                                                                <span>Est. {item.estimatedTime} min</span>
                                                                                            )}
                                                                                            {item.actualTime && (
                                                                                                <span>Actual {item.actualTime} min</span>
                                                                                            )}
                                                                                            {item.rating && (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                                                                                    <span>{item.rating}/5</span>
                                                                                                </div>
                                                                                            )}
                                                                                            {!item.paper && (
                                                                                                <span className="text-xs text-muted-foreground">Paper ID: {item.paperId.slice(0, 8)}...</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex flex-wrap items-center gap-1 ml-4">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleToggleBookmark(item.id)}
                                                                                    className={cn(
                                                                                        "h-7 w-7 p-0",
                                                                                        item.isBookmarked
                                                                                            ? "text-yellow-500 hover:text-yellow-600"
                                                                                            : "hover:text-yellow-500"
                                                                                    )}
                                                                                    title={item.isBookmarked ? "Remove bookmark" : "Add bookmark"}
                                                                                >
                                                                                    <Bookmark className={cn("h-3 w-3", item.isBookmarked && "fill-current")} />
                                                                                </Button>

                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleRateItem(item.id, item.rating ? (item.rating % 5) + 1 : 1)}
                                                                                    className={cn(
                                                                                        "h-7 w-7 p-0",
                                                                                        item.status === 'COMPLETED'
                                                                                            ? "hover:text-yellow-500"
                                                                                            : "text-muted-foreground cursor-not-allowed"
                                                                                    )}
                                                                                    disabled={item.status !== 'COMPLETED'}
                                                                                    title={item.status === 'COMPLETED'
                                                                                        ? `Rate ${item.rating ? (item.rating % 5) + 1 : 1} stars`
                                                                                        : "Complete the paper first to rate it"
                                                                                    }
                                                                                >
                                                                                    <Star className={cn(
                                                                                        "h-3 w-3",
                                                                                        item.rating && item.status === 'COMPLETED' && "fill-yellow-500 text-yellow-500"
                                                                                    )} />
                                                                                </Button>

                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setNoteItemId(item.id)
                                                                                        setNoteText(item.notes || "")
                                                                                        setShowNoteDialog(true)
                                                                                    }}
                                                                                    className="h-7 w-7 p-0 hover:bg-purple-500/10 hover:text-purple-500"
                                                                                    title="Add/edit notes"
                                                                                >
                                                                                    <Edit3 className="h-3 w-3" />
                                                                                </Button>

                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setProgressItemId(item.id)
                                                                                        setProgressValue(item.readingProgress || 0)
                                                                                        setShowProgressDialog(true)
                                                                                    }}
                                                                                    className="h-7 w-7 p-0 hover:bg-blue-500/10 hover:text-blue-500"
                                                                                    title="Update reading progress"
                                                                                >
                                                                                    <Target className="h-3 w-3" />
                                                                                </Button>

                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setEditItem(item)
                                                                                        setShowEditDialog(true)
                                                                                    }}
                                                                                    className="h-7 w-7 p-0 hover:bg-orange-500/10 hover:text-orange-500"
                                                                                    title="Edit paper details"
                                                                                >
                                                                                    <Settings2 className="h-3 w-3" />
                                                                                </Button>

                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleUpdateStatus(item.id, 'IN_PROGRESS')}
                                                                                    className="h-7 w-7 p-0 hover:bg-blue-500/10 hover:text-blue-500"
                                                                                    disabled={item.status === 'IN_PROGRESS'}
                                                                                    title="Start reading"
                                                                                >
                                                                                    <Play className="h-3 w-3" />
                                                                                </Button>

                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                                                                                    className="h-7 w-7 p-0 hover:bg-green-500/10 hover:text-green-500"
                                                                                    disabled={item.status === 'COMPLETED'}
                                                                                    title="Mark as completed"
                                                                                >
                                                                                    <CheckCircle className="h-3 w-3" />
                                                                                </Button>

                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleSkipItem(item.id)}
                                                                                    className="h-7 w-7 p-0 hover:bg-gray-500/10 hover:text-gray-500"
                                                                                    disabled={item.status === 'SKIPPED'}
                                                                                    title="Skip paper"
                                                                                >
                                                                                    <SkipForward className="h-3 w-3" />
                                                                                </Button>

                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleRemoveFromList(item.id)}
                                                                                    className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-500"
                                                                                    title="Remove from list"
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            </motion.div>
                                                        ))}
                                                    </AnimatePresence>
                                                </div>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                                        {activeTab === 'recommendations' ? 'No recommendations yet' : 'No papers in reading list'}
                                                    </h3>
                                                    <p className="text-muted-foreground mb-4">
                                                        {activeTab === 'recommendations'
                                                            ? 'Get personalized paper recommendations based on your research interests'
                                                            : 'Add papers from your library or get recommendations to start building your reading list'
                                                        }
                                                    </p>
                                                    <Button
                                                        onClick={activeTab === 'recommendations' ? handleLoadRecommendations : () => setIsAddingPaper(true)}
                                                        className="gradient-primary-to-accent text-primary-foreground border-0"
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        {activeTab === 'recommendations' ? 'Get Recommendations' : 'Add First Paper'}
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Help Information */}
                                            {filteredAndSortedItems.length > 0 && (
                                                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                    <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-2">
                                                        <Info className="h-4 w-4" />
                                                        Reading List Tips
                                                    </h4>
                                                    <div className="text-xs space-y-1 text-blue-600/80">
                                                        <p>• <strong>Star icon:</strong> Rate papers (only available for completed papers)</p>
                                                        <p>• <strong>Bookmark icon:</strong> Save important papers for later</p>
                                                        <p>• <strong>Edit icon:</strong> Add/edit personal notes about the paper</p>
                                                        <p>• <strong>Target icon:</strong> Update reading progress (0-100%)</p>
                                                        <p>• <strong>Settings icon:</strong> Edit priority, difficulty, and relevance</p>
                                                        <p>• <strong>Play icon:</strong> Mark as "In Progress" to start reading</p>
                                                        <p>• <strong>Check icon:</strong> Mark as "Completed" when finished</p>
                                                        <p>• <strong>Skip icon:</strong> Mark as "Skipped" if not relevant</p>
                                                        <p>• <strong>Trash icon:</strong> Remove from reading list</p>
                                                    </div>
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Reading Insights - Right Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="lg:col-span-1"
                    >
                        <Card className="bg-background/40 backdrop-blur-xl border-border shadow-lg transition-all duration-300 hover:shadow-primary/5 h-full"
                            style={{
                                boxShadow: `
                                    0 0 20px hsl(var(--primary) / 0.1),
                                    0 0 40px hsl(var(--accent) / 0.06)
                                `
                            }}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-primary" />
                                    Reading Insights
                                </CardTitle>
                                <CardDescription>
                                    Track your reading progress and insights
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {stats ? (
                                    <>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Progress</span>
                                                <span className="text-sm font-medium">{stats?.completionRate || 0}%</span>
                                            </div>
                                            <Progress value={stats?.completionRate || 0} className="h-2" />
                                        </div>

                                        <Separator />

                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium text-foreground">Top Tags</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {stats.topTags && Array.isArray(stats.topTags) ? (
                                                    stats.topTags.slice(0, 5).map((tag, index) => (
                                                        <Badge key={index} variant="secondary" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">No tags available</p>
                                                )}
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium text-foreground">Reading Stats</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Most Read Author</span>
                                                    <span className="font-medium">{stats.mostReadAuthor || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Most Read Venue</span>
                                                    <span className="font-medium">{stats.mostReadVenue || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Reading Streak</span>
                                                    <span className="font-medium">{stats.readingStreak || 0} days</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium text-foreground">Quick Actions</h4>
                                            <div className="space-y-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full justify-start bg-background/40 border-border hover:bg-accent"
                                                    onClick={() => setIsAddingPaper(true)}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add Paper
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            Reading insights will appear here once you start adding papers
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Add Paper Modal */}
            <Dialog open={isAddingPaper} onOpenChange={setIsAddingPaper}>
                <DialogContent className="max-w-none w-screen h-screen max-h-screen overflow-hidden p-0">
                    <div className="flex flex-col h-full">
                        <DialogHeader className="p-6 pb-4 border-b">
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary" />
                                Add Paper to Reading List
                            </DialogTitle>
                            <DialogDescription>
                                Search for papers and add them to your reading list
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-hidden p-6">
                            <div className="space-y-6 h-full flex flex-col">
                                {/* Search Section */}
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search for papers by title, author, or keywords..."
                                            className="pl-10"
                                            value={librarySearchQuery}
                                            onChange={(e) => setLibrarySearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => {
                                                if (projectId) {
                                                    loadLibraryPapers(projectId)
                                                }
                                            }}
                                            disabled={isLoadingLibrary}
                                        >
                                            {isLoadingLibrary ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Search className="mr-2 h-4 w-4" />
                                            )}
                                            {isLoadingLibrary ? 'Loading...' : 'Load Library Papers'}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (projectId) {
                                                    console.log('🔄 Manual refresh triggered')
                                                    loadReadingList(projectId)
                                                    loadReadingListStats(projectId)
                                                }
                                            }}
                                            title="Refresh reading list"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Library Papers Section */}
                                <div className="flex-1 flex flex-col space-y-3 min-h-0">
                                    <div className="flex items-center justify-between flex-shrink-0">
                                        <h4 className="text-sm font-medium text-foreground">
                                            Papers from Library ({libraryPapers.length})
                                        </h4>
                                        {libraryPapers.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setLibrarySearchQuery("")}
                                                className="text-xs"
                                            >
                                                Clear Search
                                            </Button>
                                        )}
                                    </div>

                                    {isLoadingLibrary ? (
                                        <div className="flex items-center justify-center py-8 flex-shrink-0">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            <span className="ml-2 text-sm text-muted-foreground">Loading papers...</span>
                                        </div>
                                    ) : libraryPapers.length > 0 ? (
                                        <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                                            <div className="space-y-2 pr-2">
                                                {libraryPapers
                                                    .filter(paper => {
                                                        if (!librarySearchQuery) return true
                                                        const query = librarySearchQuery.toLowerCase()
                                                        return (
                                                            paper.title.toLowerCase().includes(query) ||
                                                            paper.authors.some(author => author.name.toLowerCase().includes(query)) ||
                                                            (paper.venueName?.toLowerCase().includes(query) ?? false) ||
                                                            (paper.abstractText?.toLowerCase().includes(query) ?? false) ||
                                                            (paper.fieldsOfStudy?.some(field => field.toLowerCase().includes(query)) ?? false)
                                                        )
                                                    })
                                                    .map((paper) => (
                                                        <Card key={paper.id} className="p-4 hover:bg-accent/50 transition-colors">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <h5 className="font-medium text-foreground truncate">{paper.title}</h5>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {paper.authors.map(author => author.name).join(', ')}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {paper.venueName} • {new Date(paper.publicationDate).getFullYear()} • {paper.citationCount} citations
                                                                    </p>
                                                                    {paper.abstractText && (
                                                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                                                                            {paper.abstractText}
                                                                        </p>
                                                                    )}
                                                                    {paper.fieldsOfStudy && paper.fieldsOfStudy.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                                            {paper.fieldsOfStudy.slice(0, 3).map((field, index) => (
                                                                                <Badge key={index} variant="secondary" className="text-xs">
                                                                                    {field}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    className="ml-4 flex-shrink-0"
                                                                    onClick={() => {
                                                                        handleAddToReadingList(paper)
                                                                        setIsAddingPaper(false)
                                                                    }}
                                                                >
                                                                    <Plus className="mr-1 h-3 w-3" />
                                                                    Add
                                                                </Button>
                                                            </div>
                                                        </Card>
                                                    ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 flex-shrink-0">
                                            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                {librarySearchQuery ? 'No papers match your search' : 'No papers in library yet'}
                                            </p>
                                            {!librarySearchQuery && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Add papers to your library first, then they'll appear here
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 pt-4 border-t">
                            <Button variant="outline" onClick={() => setIsAddingPaper(false)}>
                                Cancel
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Notes Dialog */}
            <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add/Edit Notes</DialogTitle>
                        <DialogDescription>
                            Add personal notes about this paper for your reference.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="note-text" className="text-sm font-medium">
                                Notes
                            </label>
                            <Textarea
                                id="note-text"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add your notes about this paper..."
                                className="min-h-[120px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                await handleAddNote(noteItemId, noteText)
                                setShowNoteDialog(false)
                                setNoteText("")
                            }}
                        >
                            Save Notes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Progress Dialog */}
            <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Reading Progress</DialogTitle>
                        <DialogDescription>
                            Update your reading progress for this paper (0-100%).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="progress-value" className="text-sm font-medium">
                                Progress: {progressValue}%
                            </label>
                            <input
                                id="progress-value"
                                type="range"
                                min="0"
                                max="100"
                                value={progressValue}
                                onChange={(e) => setProgressValue(parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                await handleUpdateProgress(progressItemId, progressValue)
                                setShowProgressDialog(false)
                            }}
                        >
                            Update Progress
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Item Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Paper Details</DialogTitle>
                        <DialogDescription>
                            Update the priority, difficulty, and relevance of this paper.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Priority</label>
                            <Select
                                value={editItem?.priority || 'MEDIUM'}
                                onValueChange={(value) => setEditItem(prev => prev ? { ...prev, priority: value as any } : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Difficulty</label>
                            <Select
                                value={editItem?.difficulty || 'MEDIUM'}
                                onValueChange={(value) => setEditItem(prev => prev ? { ...prev, difficulty: value as any } : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EASY">Easy</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HARD">Hard</SelectItem>
                                    <SelectItem value="EXPERT">Expert</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Relevance</label>
                            <Select
                                value={editItem?.relevance || 'MEDIUM'}
                                onValueChange={(value) => setEditItem(prev => prev ? { ...prev, relevance: value as any } : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estimated Time (minutes)</label>
                            <Input
                                type="number"
                                value={editItem?.estimatedTime || ''}
                                onChange={(e) => setEditItem(prev => prev ? { ...prev, estimatedTime: parseInt(e.target.value) || undefined } : null)}
                                placeholder="30"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                if (editItem) {
                                    const updateData = {
                                        priority: editItem.priority,
                                        difficulty: editItem.difficulty,
                                        relevance: editItem.relevance,
                                        estimatedTime: editItem.estimatedTime
                                    }
                                    await handleUpdateItem(editItem.id, updateData)
                                    setShowEditDialog(false)
                                    setEditItem(null)
                                }
                            }}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 