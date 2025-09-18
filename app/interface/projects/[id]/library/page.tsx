"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Search,
    BookOpen,
    Filter,
    Star,
    Calendar,
    Database,
    RefreshCw,
    SortAsc,
    SortDesc,
    Quote,
    ChevronRight,
    ChevronUp,
    FileText,
    AlertCircle,
    Grid3X3,
    List
} from "lucide-react"
import { cn, isValidUUID } from "@/lib/utils"
import { libraryApi } from "@/lib/api/project-service"
import { PaperCard } from "@/components/library/PaperCard"
import { StreamingPaperCard } from "@/components/library/StreamingPaperCard"
import { PaperDetailModal } from "@/components/library/PaperDetailModal"
import { PdfViewerModal } from "@/components/library/PdfViewerModal"
import type { Paper } from "@/types/websearch"


interface ProjectLibraryPageProps {
    params: Promise<{
        id: string
    }>
}

export default function ProjectLibraryPage({ params }: ProjectLibraryPageProps) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const [projectId, setProjectId] = useState<string>("")
    const [allPapers, setAllPapers] = useState<Paper[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
    const [showPdfViewer, setShowPdfViewer] = useState(false)
    const [pdfViewerPaper, setPdfViewerPaper] = useState<Paper | null>(null)
    const [showScrollTop, setShowScrollTop] = useState(false)
    const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)
    const [libraryStats, setLibraryStats] = useState<any>(null)
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false)
    const [libraryError, setLibraryError] = useState<string | null>(null)
    const [favoritePapers, setFavoritePapers] = useState<Set<string>>(new Set())
    const [highlightedPaperId, setHighlightedPaperId] = useState<string | null>(null)

    // URL-based state management for filters
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "")
    const [sortBy, setSortBy] = useState<'date' | 'citations' | 'title'>((searchParams.get('sortBy') as 'date' | 'citations' | 'title') || 'date')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>((searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc')
    const [filterSource, setFilterSource] = useState<string>(searchParams.get('source') || "all")
    const [filterOpenAccess, setFilterOpenAccess] = useState<string>(searchParams.get('openAccess') || "all")
    const [viewMode, setViewMode] = useState<'grid' | 'list'>((searchParams.get('view') as 'grid' | 'list') || 'grid')
    const [showFilters, setShowFilters] = useState(false)
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(searchParams.get('favorites') === 'true')

    // Function to update URL parameters
    const updateURLParams = (updates: Record<string, string | null>) => {
        const current = new URLSearchParams(searchParams.toString())

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '' || value === 'all' || value === 'false') {
                current.delete(key)
            } else {
                current.set(key, value)
            }
        })

        const newURL = `${pathname}?${current.toString()}`
        router.replace(newURL, { scroll: false })
    }

    // Wrapper functions that update both state and URL
    const handleSearchQueryChange = (value: string) => {
        setSearchQuery(value)
        updateURLParams({ search: value })
    }

    const handleSortByChange = (value: 'date' | 'citations' | 'title') => {
        setSortBy(value)
        updateURLParams({ sortBy: value })
    }

    const handleSortDirectionChange = (value: 'asc' | 'desc') => {
        setSortDirection(value)
        updateURLParams({ sortDirection: value })
    }

    const handleFilterSourceChange = (value: string) => {
        setFilterSource(value)
        updateURLParams({ source: value })
    }

    const handleFilterOpenAccessChange = (value: string) => {
        setFilterOpenAccess(value)
        updateURLParams({ openAccess: value })
    }

    const handleViewModeChange = (value: 'grid' | 'list') => {
        setViewMode(value)
        updateURLParams({ view: value })
    }

    const handleShowFavoritesOnlyChange = (value: boolean) => {
        setShowFavoritesOnly(value)
        updateURLParams({ favorites: value ? 'true' : null })
    }

    const handleClearFilters = () => {
        setSearchQuery("")
        setFilterSource("all")
        setFilterOpenAccess("all")
        updateURLParams({
            search: null,
            source: null,
            openAccess: null
        })
    }

    // Sync state with URL parameters on mount or URL change
    useEffect(() => {
        const search = searchParams.get('search') || ""
        const sortByParam = (searchParams.get('sortBy') as 'date' | 'citations' | 'title') || 'date'
        const sortDirectionParam = (searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc'
        const sourceParam = searchParams.get('source') || "all"
        const openAccessParam = searchParams.get('openAccess') || "all"
        const viewParam = (searchParams.get('view') as 'grid' | 'list') || 'grid'
        const favoritesParam = searchParams.get('favorites') === 'true'

        setSearchQuery(search)
        setSortBy(sortByParam)
        setSortDirection(sortDirectionParam)
        setFilterSource(sourceParam)
        setFilterOpenAccess(openAccessParam)
        setViewMode(viewParam)
        setShowFavoritesOnly(favoritesParam)
    }, [searchParams])

    // Debug log for highlightedPaperId changes
    useEffect(() => {
        console.log('🔄 highlightedPaperId state changed to:', highlightedPaperId)
    }, [highlightedPaperId])

    // Handle URL highlight parameter
    useEffect(() => {
        const highlightParam = searchParams.get('highlight')
        console.log('🔍 Highlight parameter from URL:', highlightParam)
        if (highlightParam && isValidUUID(highlightParam)) {
            console.log('✅ Setting highlighted paper ID:', highlightParam)
            setHighlightedPaperId(highlightParam)
        } else {
            console.log('❌ Invalid or missing highlight parameter')
        }
    }, [searchParams])

    // Load project ID and papers
    useEffect(() => {
        const loadData = async () => {
            const resolvedParams = await params

            // Validate project ID format
            const projectId = resolvedParams.id

            if (!isValidUUID(projectId)) {
                console.error('Invalid project ID format:', projectId)
                setLibraryError('Invalid project ID format')
                setIsLoading(false)
                return
            }

            setProjectId(projectId)

            // Load all library data
            await Promise.all([
                loadFavorites(projectId),
                loadProjectLibrary(projectId)
            ])

            setIsLoading(false)
        }

        loadData()
    }, [params])

    // Load all papers from the project library
    const loadProjectLibrary = async (projectId: string) => {
        if (!projectId) return

        setIsLoadingLibrary(true)
        setLibraryError(null)

        try {
            console.log('Loading project library for:', projectId)
            const result = await libraryApi.getProjectLibrary(projectId)
            console.log('Library API result:', result)

            if (result?.papers && Array.isArray(result.papers)) {
                setAllPapers(result.papers)
                setLibraryStats(result.stats || null)
                console.log(`Loaded ${result.papers.length} papers from library`)
            } else {
                console.warn('Invalid library response structure:', result)
                setAllPapers([])
                setLibraryStats(null)
            }
        } catch (error) {
            console.error('Error loading project library:', error)
            setLibraryError('Failed to load project library')
            setAllPapers([])
            setLibraryStats(null)
        } finally {
            setIsLoadingLibrary(false)
        }
    }

    // Paper interaction handlers
    const handlePaperSelect = (paper: Paper) => {
        setSelectedPaper(paper)
    }

    const handleViewPdf = (paper: Paper) => {
        setPdfViewerPaper(paper)
        setShowPdfViewer(true)
    }

    const handleRefreshLibrary = () => {
        if (projectId) {
            loadProjectLibrary(projectId)
        }
    }

    // Load favorites for the project
    const loadFavorites = async (projectId: string) => {
        try {
            const favorites = await libraryApi.getPaperFavorites(projectId)
            const favoriteIds = new Set(favorites.map((fav: any) => fav.paperId))
            setFavoritePapers(favoriteIds)
        } catch (error) {
            console.error('Error loading favorites:', error)
        }
    }

    // Handle favorite toggle
    const handleToggleFavorite = async (paper: Paper) => {
        try {
            const wasAdded = await libraryApi.togglePaperFavorite(projectId, paper.id, {
                notes: '',
                priority: 'medium',
                tags: ''
            })

            if (wasAdded) {
                // Paper was added to favorites
                setFavoritePapers(prev => new Set(Array.from(prev).concat(paper.id)))
            } else {
                // Paper was removed from favorites
                setFavoritePapers(prev => {
                    const newSet = new Set(Array.from(prev))
                    newSet.delete(paper.id)
                    return newSet
                })
            }
        } catch (error) {
            console.error('Error toggling favorite:', error)
        }
    }

    // Scroll handlers
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop
        setShowScrollTop(scrollTop > 400)
    }

    const scrollToTop = () => {
        scrollContainer?.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Filter and sort logic
    const filteredAndSortedPapers = allPapers
        .filter(paper => {
            const matchesSearch = !searchQuery ||
                paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (paper.abstractText?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                paper.authors?.some(author => author.name.toLowerCase().includes(searchQuery.toLowerCase()))

            const matchesSource = filterSource === "all" || paper.source === filterSource

            const matchesOpenAccess = filterOpenAccess === "all" ||
                (filterOpenAccess === "open" && paper.isOpenAccess) ||
                (filterOpenAccess === "closed" && !paper.isOpenAccess) ||
                (filterOpenAccess === "uploaded" && paper.source === "Uploaded")

            const matchesFavorites = !showFavoritesOnly || favoritePapers.has(paper.id)

            return matchesSearch && matchesSource && matchesOpenAccess && matchesFavorites
        })
        .sort((a, b) => {
            let comparison = 0

            switch (sortBy) {
                case 'date':
                    // Handle date sorting with proper fallbacks
                    const dateA = new Date(a.publicationDate || '1970-01-01').getTime()
                    const dateB = new Date(b.publicationDate || '1970-01-01').getTime()
                    comparison = dateA - dateB
                    break
                case 'citations':
                    comparison = (a.citationCount || 0) - (b.citationCount || 0)
                    break
                case 'title':
                    // Handle title sorting with proper string comparison
                    const titleA = (a.title || '').toLowerCase().trim()
                    const titleB = (b.title || '').toLowerCase().trim()
                    comparison = titleA.localeCompare(titleB)
                    break
                default:
                    comparison = 0
            }

            return sortDirection === 'desc' ? -comparison : comparison
        })

    // Get unique sources for filter dropdown
    const uniqueSources = Array.from(new Set(allPapers.map(paper => paper.source).filter(Boolean)))

    // Loading state
    if (isLoading) {
        return (
            <div className="h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading project library...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (libraryError && !isLoading) {
        return (
            <div className="h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                    <p className="text-destructive mb-4">{libraryError}</p>
                    <Button onClick={handleRefreshLibrary} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />

            {/* Sticky Header */}
            <div className="sticky top-0 z-50 border-l-0 border-r border-t border-primary/20 bg-gradient-to-br from-background/60 to-primary/5 backdrop-blur-sm" style={{ boxShadow: 'inset -10px 0 30px rgba(139, 92, 246, 0.15), 0 0 40px rgba(99, 102, 241, 0.1)' }}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center py-8"
                >
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-primary/20">
                            <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-gradient-primary">
                            Paper Library
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Manage and analyze your collected research papers
                    </p>
                </motion.div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto border-l-0 border-r border-primary/20 bg-gradient-to-br from-background/60 to-primary/5 backdrop-blur-sm" style={{ boxShadow: 'inset -8px 0 25px rgba(139, 92, 246, 0.08)' }} ref={setScrollContainer} onScroll={handleScroll}>
                <div className="w-full h-full">
                    <Card className="w-full h-full bg-transparent border-2 border-primary/10 shadow-lg shadow-primary/5 rounded-lg flex flex-col">
                        <CardHeader className="px-6 pt-6 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Database className="h-5 w-5 text-primary" />
                                        All Papers
                                        {allPapers.length > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                                {allPapers.length} papers
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        Browse and manage your complete research paper collection
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={handleRefreshLibrary}
                                        disabled={isLoadingLibrary}
                                        variant="outline"
                                        size="sm"
                                        className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40"
                                        style={{ boxShadow: '0 0 8px rgba(99, 102, 241, 0.08), 0 0 16px rgba(139, 92, 246, 0.04)' }}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isLoadingLibrary ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col px-6 pb-6">
                            {/* Search and Filters */}
                            <div className="mb-6 space-y-4">
                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search papers by title, authors, or abstract..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearchQueryChange(e.target.value)}
                                        className="pl-10 bg-background/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 focus:border-primary/60 transition-all duration-300"
                                        style={{ boxShadow: '0 0 6px rgba(99, 102, 241, 0.06), 0 0 12px rgba(139, 92, 246, 0.03)' }}
                                    />
                                </div>

                                {/* Filter and Sort Controls */}
                                <div className="flex flex-wrap items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40"
                                        style={{ boxShadow: '0 0 6px rgba(99, 102, 241, 0.06), 0 0 12px rgba(139, 92, 246, 0.03)' }}
                                    >
                                        <Filter className="h-4 w-4 mr-2" />
                                        Filters
                                        <ChevronRight className={`h-4 w-4 ml-2 transition-transform duration-200 ${showFilters ? 'rotate-90' : ''}`} />
                                    </Button>

                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-muted-foreground">Sort by:</label>
                                        <Select value={sortBy} onValueChange={(value) => handleSortByChange(value as any)}>
                                            <SelectTrigger className="w-32 bg-background/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-300" style={{ boxShadow: '0 0 6px rgba(99, 102, 241, 0.06)' }}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background/95 backdrop-blur-xl border border-primary/20">
                                                <SelectItem value="date" className="hover:bg-primary/10 focus:bg-primary/10">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-green-500" />
                                                        Date
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="citations" className="hover:bg-primary/10 focus:bg-primary/10">
                                                    <div className="flex items-center gap-2">
                                                        <Quote className="h-4 w-4 text-purple-500" />
                                                        Citations
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="title" className="hover:bg-primary/10 focus:bg-primary/10">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-blue-500" />
                                                        Title
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
                                            className={cn(
                                                "bg-background/40 backdrop-blur-xl border-2 transition-all duration-300 hover:scale-105",
                                                sortDirection === 'asc'
                                                    ? "border-green-500/40 hover:border-green-500/60 bg-green-500/10"
                                                    : "border-purple-500/40 hover:border-purple-500/60 bg-purple-500/10"
                                            )}
                                            style={{
                                                boxShadow: sortDirection === 'asc'
                                                    ? '0 0 10px rgba(34, 197, 94, 0.2), 0 0 20px rgba(34, 197, 94, 0.1)'
                                                    : '0 0 10px rgba(168, 85, 247, 0.2), 0 0 20px rgba(168, 85, 247, 0.1)'
                                            }}
                                        >
                                            {sortDirection === 'asc' ? (
                                                <SortAsc className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <SortDesc className="h-4 w-4 text-purple-500" />
                                            )}
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-muted-foreground">View:</label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewModeChange('grid')}
                                            className={cn(
                                                "bg-background/40 backdrop-blur-xl border-2 transition-all duration-300 hover:scale-105",
                                                viewMode === 'grid'
                                                    ? "border-cyan-500/40 hover:border-cyan-500/60 bg-cyan-500/10 text-cyan-500"
                                                    : "border-primary/20 hover:border-primary/40 text-muted-foreground"
                                            )}
                                            style={{
                                                boxShadow: viewMode === 'grid'
                                                    ? '0 0 10px rgba(6, 182, 212, 0.2), 0 0 20px rgba(6, 182, 212, 0.1)'
                                                    : '0 0 6px rgba(99, 102, 241, 0.06)'
                                            }}
                                        >
                                            <Grid3X3 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewModeChange('list')}
                                            className={cn(
                                                "bg-background/40 backdrop-blur-xl border-2 transition-all duration-300 hover:scale-105",
                                                viewMode === 'list'
                                                    ? "border-emerald-500/40 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-500"
                                                    : "border-primary/20 hover:border-primary/40 text-muted-foreground"
                                            )}
                                            style={{
                                                boxShadow: viewMode === 'list'
                                                    ? '0 0 10px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.1)'
                                                    : '0 0 6px rgba(99, 102, 241, 0.06)'
                                            }}
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Advanced Filters */}
                                <AnimatePresence>
                                    {showFilters && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 bg-background/20 backdrop-blur-xl rounded-lg border border-primary/20 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium mb-2 block">Source</label>
                                                    <Select value={filterSource} onValueChange={handleFilterSourceChange}>
                                                        <SelectTrigger className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-300" style={{ boxShadow: '0 0 6px rgba(99, 102, 241, 0.06), 0 0 12px rgba(139, 92, 246, 0.03)' }}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Sources</SelectItem>
                                                            {uniqueSources.map(source => (
                                                                <SelectItem key={source} value={source}>{source}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium mb-2 block">Access</label>
                                                    <Select value={filterOpenAccess} onValueChange={handleFilterOpenAccessChange}>
                                                        <SelectTrigger className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-300" style={{ boxShadow: '0 0 6px rgba(99, 102, 241, 0.06), 0 0 12px rgba(139, 92, 246, 0.03)' }}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Papers</SelectItem>
                                                            <SelectItem value="open">Open Access</SelectItem>
                                                            <SelectItem value="closed">Closed Access</SelectItem>
                                                            <SelectItem value="uploaded">Uploaded</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium mb-2 block">Favorites</label>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleShowFavoritesOnlyChange(!showFavoritesOnly)}
                                                        className={cn(
                                                            "w-full bg-background/40 backdrop-blur-xl border-2 transition-all duration-300",
                                                            showFavoritesOnly
                                                                ? "border-yellow-500/40 hover:border-yellow-500/60 bg-yellow-500/10 text-yellow-500"
                                                                : "border-primary/20 hover:border-primary/40"
                                                        )}
                                                        style={{
                                                            boxShadow: showFavoritesOnly
                                                                ? '0 0 10px rgba(234, 179, 8, 0.2), 0 0 20px rgba(234, 179, 8, 0.1)'
                                                                : '0 0 6px rgba(99, 102, 241, 0.06)'
                                                        }}
                                                    >
                                                        <Star className="h-4 w-4 mr-2" />
                                                        {showFavoritesOnly ? 'Favorites Only' : 'All Papers'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Papers Content */}
                            {filteredAndSortedPapers.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className="w-full flex-1"
                                >
                                    <div className="w-full h-full">
                                        {viewMode === 'grid' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                                                <AnimatePresence mode="popLayout">
                                                    {filteredAndSortedPapers.map((paper, index) => {
                                                        const isHighlighted = highlightedPaperId === paper.id
                                                        if (isHighlighted) {
                                                            console.log('🎯 Found highlighted paper in grid:', paper.id, 'highlightedPaperId:', highlightedPaperId)
                                                        }
                                                        return (
                                                            <StreamingPaperCard
                                                                key={`${paper.id}-${sortBy}-${sortDirection}`}
                                                                paper={paper}
                                                                index={index}
                                                                onSelect={handlePaperSelect}
                                                                onViewPdf={handleViewPdf}
                                                                isHighlighted={isHighlighted}
                                                                onHighlightClick={() => setHighlightedPaperId(null)}
                                                                streamDelay={0}
                                                            />
                                                        )
                                                    })}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 pb-6">
                                                <AnimatePresence mode="popLayout">
                                                    {filteredAndSortedPapers.map((paper, index) => {
                                                        const isHighlighted = highlightedPaperId === paper.id
                                                        if (isHighlighted) {
                                                            console.log('🎯 Found highlighted paper in list:', paper.id, 'highlightedPaperId:', highlightedPaperId)
                                                        }
                                                        return (
                                                            <PaperCard
                                                                key={`${paper.id}-${sortBy}-${sortDirection}`}
                                                                paper={paper}
                                                                index={index}
                                                                onSelect={handlePaperSelect}
                                                                onViewPdf={handleViewPdf}
                                                                isHighlighted={isHighlighted}
                                                                onHighlightClick={() => setHighlightedPaperId(null)}
                                                                onToggleFavorite={handleToggleFavorite}
                                                                isFavorited={favoritePapers.has(paper.id)}
                                                            />
                                                        )
                                                    })}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {allPapers.length === 0 && !isLoadingLibrary && (
                                <div className="text-center py-12">
                                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No papers in library</h3>
                                    <p className="text-muted-foreground mb-4">Your library is empty. Use "Collect Papers" to add papers through web search or file upload.</p>
                                </div>
                            )}

                            {filteredAndSortedPapers.length === 0 && allPapers.length > 0 && (
                                <div className="text-center py-12">
                                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No papers match your filters</h3>
                                    <p className="text-muted-foreground mb-4">Try adjusting your search terms or filters to find more papers.</p>
                                    <Button
                                        onClick={handleClearFilters}
                                        variant="outline"
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Border */}
            <div className="border-l-0 border-r border-b border-primary/20 bg-gradient-to-r from-background/60 to-primary/5 backdrop-blur-sm h-1" style={{ boxShadow: 'inset -8px 0 25px rgba(139, 92, 246, 0.08), 0 -2px 15px rgba(99, 102, 241, 0.1)' }}></div>

            {/* Paper Detail Modal */}
            <PaperDetailModal
                paper={selectedPaper}
                isOpen={!!selectedPaper}
                onClose={() => setSelectedPaper(null)}
                onViewPdf={handleViewPdf}
                projectId={projectId}
            />

            {/* PDF Viewer Modal */}
            <PdfViewerModal
                paper={pdfViewerPaper}
                isOpen={showPdfViewer}
                onClose={() => {
                    setShowPdfViewer(false)
                    setPdfViewerPaper(null)
                }}
            />

            {/* Scroll to Top Button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className="fixed bottom-8 right-8 z-50"
                    >
                        <Button
                            onClick={scrollToTop}
                            size="sm"
                            className="h-12 w-12 rounded-full gradient-primary-to-accent hover:gradient-accent text-white shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/30"
                            style={{ boxShadow: '0 0 20px hsl(var(--accent-1) / 0.5), 0 0 40px hsl(var(--accent-2) / 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)' }}
                        >
                            <ChevronUp className="h-5 w-5" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
} 