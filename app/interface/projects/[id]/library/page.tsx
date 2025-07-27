"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Download,
    Search,
    BookOpen,
    Filter,
    Star,
    Calendar,
    Database,
    RefreshCw,
    ArrowUp,
    ArrowDown,
    SortAsc,
    SortDesc,
    Hash,
    Quote,
    ChevronRight,
    ChevronUp,
    PlusCircle,
    Upload,
    FileText,
    Eye,
    ExternalLink,
    CheckCircle,
    Clock,
    AlertCircle,
    MoreVertical,
    Grid3X3,
    List,
    Settings2,
    Tag,
    Users,
    TrendingUp,
    BarChart3,
    FolderOpen,
    Globe
} from "lucide-react"
import { cn, isValidUUID } from "@/lib/utils"
import { useWebSearch } from "@/hooks/useWebSearch"
import { getProjectLibrary, getProjectLibraryStats, getProjectLatestPapers } from "@/lib/api/library"
import { SearchLoadingProgress } from "@/components/library/SearchLoadingProgress"
import { PaperCard } from "@/components/library/PaperCard"
import { StreamingPaperCard } from "@/components/library/StreamingPaperCard"
import { PaperDetailModal } from "@/components/library/PaperDetailModal"
import { PdfViewerModal } from "@/components/library/PdfViewerModal"
import { SearchConfigDialog } from "@/components/library/SearchConfigDialog"
import { PDFUploadDialog } from "@/components/library/PDFUploadDialog"
import { B2DownloadTest } from "@/components/test/B2DownloadTest"
import type { Paper, WebSearchRequest } from "@/types/websearch"

interface ProjectLibraryPageProps {
    params: Promise<{
        id: string
    }>
}

export default function ProjectLibraryPage({ params }: ProjectLibraryPageProps) {
    const [projectId, setProjectId] = useState<string>("")
    const [allPapers, setAllPapers] = useState<Paper[]>([])
    const [currentWebSearchPapers, setCurrentWebSearchPapers] = useState<Paper[]>([])
    const [uploadedContent, setUploadedContent] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'current-search' | 'all-papers' | 'uploaded'>('current-search')
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<'date' | 'citations' | 'title'>('date')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [filterSource, setFilterSource] = useState<string>("all")
    const [filterOpenAccess, setFilterOpenAccess] = useState<string>("all")
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [showFilters, setShowFilters] = useState(false)
    const [showPdfViewer, setShowPdfViewer] = useState(false)
    const [pdfViewerPaper, setPdfViewerPaper] = useState<Paper | null>(null)
    const [showSearchConfig, setShowSearchConfig] = useState(false)
    const [showPDFUpload, setShowPDFUpload] = useState(false)
    const [showScrollTop, setShowScrollTop] = useState(false)
    const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)
    const [libraryStats, setLibraryStats] = useState<any>(null)
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false)
    const [libraryError, setLibraryError] = useState<string | null>(null)
    const [latestPapers, setLatestPapers] = useState<Paper[]>([])
    const [isLoadingLatestPapers, setIsLoadingLatestPapers] = useState(false)

    // Web search functionality
    const webSearch = useWebSearch()

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

            try {
                // Load existing papers from library and latest papers
                await Promise.all([
                    loadProjectLibrary(projectId),
                    loadLatestPapers(projectId)
                ])
            } catch (error) {
                console.error('Error loading project data:', error)
                setLibraryError('Failed to load project data')
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [params])

    // Load papers from web search results when available
    useEffect(() => {
        if (webSearch.papers.length > 0) {
            setCurrentWebSearchPapers(webSearch.papers)
        }
    }, [webSearch.papers])

    const loadProjectLibrary = async (projectId: string) => {
        // Validate project ID before making API calls
        if (!isValidUUID(projectId)) {
            console.error('Invalid project ID in loadProjectLibrary:', projectId)
            return
        }

        try {
            setIsLoadingLibrary(true)
            setLibraryError(null)

            // Fetch both library data and stats
            const [libraryData, statsData] = await Promise.all([
                getProjectLibrary(projectId),
                getProjectLibraryStats(projectId)
            ])

            // Set papers from library data, ensuring abstractText compatibility
            if (libraryData.data.papers) {
                const processedPapers: Paper[] = (libraryData.data.papers as any[]).map((p: any) => ({
                    ...p,
                    abstractText: p.abstractText ?? p.abstract ?? null,
                }))
                setAllPapers(processedPapers)
            }

            // Set library stats
            setLibraryStats(statsData.data)

        } catch (error) {
            console.error('Error loading project library:', error)
            setLibraryError(error instanceof Error ? error.message : 'Failed to load library')
        } finally {
            setIsLoadingLibrary(false)
        }
    }

    const loadLatestPapers = async (projectId: string) => {
        // Validate project ID before making API calls
        if (!isValidUUID(projectId)) {
            console.error('Invalid project ID in loadLatestPapers:', projectId)
            return
        }

        try {
            setIsLoadingLatestPapers(true)
            const response = await getProjectLatestPapers(projectId)

            // Set latest papers, ensuring abstractText compatibility
            if (response.data && response.data.papers) {
                const processedPapers: Paper[] = (response.data.papers as any[]).map((p: any) => ({
                    ...p,
                    abstractText: p.abstractText ?? p.abstract ?? null,
                }))
                setLatestPapers(processedPapers)
            } else if (response.data && Array.isArray(response.data)) {
                // Handle case where response.data is directly an array
                const processedPapers: Paper[] = (response.data as any[]).map((p: any) => ({
                    ...p,
                    abstractText: p.abstractText ?? p.abstract ?? null,
                }))
                setLatestPapers(processedPapers)
            } else {
                setLatestPapers([])
            }
        } catch (error) {
            console.error('Error loading latest papers:', error)
            setLatestPapers([])
        } finally {
            setIsLoadingLatestPapers(false)
        }
    }

    // Get the current papers based on active tab
    const getCurrentPapers = () => {
        switch (activeTab) {
            case 'current-search':
                // Use latest papers if available, otherwise fall back to web search papers
                return latestPapers.length > 0 ? latestPapers : currentWebSearchPapers
            case 'all-papers':
                return allPapers
            case 'uploaded':
                return [] // TODO: Implement uploaded content display
            default:
                return []
        }
    }

    const filteredAndSortedPapers = getCurrentPapers()
        .filter(paper => {
            const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                paper.authors.some(author => author.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (paper.fieldsOfStudy?.some(field => field.toLowerCase().includes(searchQuery.toLowerCase())) ?? false) ||
                (paper.venueName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (paper.abstractText?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

            const matchesSource = filterSource === "all" || paper.source === filterSource
            const matchesOpenAccess = filterOpenAccess === "all" ||
                (filterOpenAccess === "open" && paper.isOpenAccess) ||
                (filterOpenAccess === "closed" && !paper.isOpenAccess)

            return matchesSearch && matchesSource && matchesOpenAccess
        })
        .sort((a, b) => {
            let aVal, bVal
            switch (sortBy) {
                case 'date':
                    aVal = new Date(a.publicationDate).getTime()
                    bVal = new Date(b.publicationDate).getTime()
                    break
                case 'citations':
                    aVal = a.citationCount
                    bVal = b.citationCount
                    break
                case 'title':
                    aVal = a.title.toLowerCase()
                    bVal = b.title.toLowerCase()
                    return sortDirection === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
                default:
                    return 0
            }

            return sortDirection === 'desc' ? bVal - aVal : aVal - bVal
        })

    const handleRetrievePapers = () => {
        setShowSearchConfig(true)
    }

    const handleRefreshLatestPapers = async () => {
        if (projectId) {
            if (!isValidUUID(projectId)) {
                console.error('Invalid project ID in handleRefreshLatestPapers:', projectId)
                return
            }
            await loadLatestPapers(projectId)
        }
    }

    const handleSearchSubmit = async (searchRequest: WebSearchRequest) => {
        await webSearch.startSearch(searchRequest)
    }

    const handlePaperSelect = (paper: Paper) => {
        setSelectedPaper(paper)
    }

    const handleViewPdf = (paper: Paper) => {
        setPdfViewerPaper(paper)
        setShowPdfViewer(true)
    }

    // Scroll handling
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop
        setShowScrollTop(scrollTop > 300)
    }

    const scrollToTop = () => {
        scrollContainer?.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    // Get unique sources and fields for filtering
    const uniqueSources = [...new Set(getCurrentPapers().map(p => p.source).filter(Boolean))]
    const uniqueFields = [...new Set(getCurrentPapers().flatMap(p => p.fieldsOfStudy || []).filter(Boolean))]

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading library...</p>
                        {isLoadingLibrary && (
                            <p className="text-sm text-muted-foreground mt-2">Fetching existing papers...</p>
                        )}
                    </div>
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
                        Manage and analyze your research papers with advanced tools
                    </p>
                </motion.div>
            </div>

            {/* Sticky Tabs */}
            <div className="sticky top-[120px] z-40 bg-gradient-to-br from-background via-background/95 to-primary/5 backdrop-blur-xl border-l-0 border-r border-b border-primary/20" style={{ boxShadow: 'inset -8px 0 25px rgba(139, 92, 246, 0.1), 0 2px 15px rgba(99, 102, 241, 0.1), 0 4px 25px rgba(139, 92, 246, 0.06)' }}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="w-full px-6 py-4"
                >
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-background/60 backdrop-blur-xl border-2 border-primary/20" style={{ boxShadow: '0 0 12px rgba(99, 102, 241, 0.1), 0 0 25px rgba(139, 92, 246, 0.06)' }}>
                            <TabsTrigger
                                value="current-search"
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent-2/20 border-r border-primary/10 last:border-r-0"
                            >
                                <Globe className="h-4 w-4" />
                                Current Web Search
                                {latestPapers.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 text-xs">
                                        {latestPapers.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="all-papers"
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent-2/20 border-r border-primary/10 last:border-r-0"
                            >
                                <BookOpen className="h-4 w-4" />
                                All Papers
                                {allPapers.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 text-xs">
                                        {allPapers.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="uploaded"
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent-2/20 border-r border-primary/10 last:border-r-0"
                            >
                                <FolderOpen className="h-4 w-4" />
                                Uploaded Content
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {uploadedContent.length}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </motion.div>
            </div>

            {/* Scrollable Content Area - Full Height */}
            <div className="flex-1 overflow-y-auto border-l-0 border-r border-primary/20 bg-gradient-to-br from-background/60 to-primary/5 backdrop-blur-sm" style={{ boxShadow: 'inset -8px 0 25px rgba(139, 92, 246, 0.08)' }} ref={setScrollContainer} onScroll={handleScroll}>
                <div className="w-full h-full">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full h-full flex flex-col">

                        {/* Current Web Search Tab */}
                        <TabsContent value="current-search" className="flex-1 m-0 p-0">
                            <Card className="w-full h-full bg-transparent border-2 border-primary/10 shadow-lg shadow-primary/5 rounded-lg flex flex-col">
                                <CardHeader className="px-6 pt-6 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Globe className="h-5 w-5 text-primary" />
                                                Current Web Search Results
                                            </CardTitle>
                                            <CardDescription>
                                                Papers from the most recent search operation for this project
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={handleRefreshLatestPapers}
                                                disabled={isLoadingLatestPapers}
                                                variant="outline"
                                                size="sm"
                                                className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40"
                                                style={{ boxShadow: '0 0 8px rgba(99, 102, 241, 0.08), 0 0 16px rgba(139, 92, 246, 0.04)' }}
                                            >
                                                <RefreshCw className={`h-4 w-4 ${isLoadingLatestPapers ? 'animate-spin' : ''}`} />
                                            </Button>
                                            <Button
                                                onClick={handleRetrievePapers}
                                                disabled={webSearch.isSearching}
                                                className="gradient-primary-to-accent hover:gradient-accent text-white border border-primary/30"
                                                style={{ boxShadow: '0 0 15px hsl(var(--accent-1) / 0.4), 0 0 30px hsl(var(--accent-2) / 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}
                                            >
                                                {webSearch.isSearching ? (
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Download className="mr-2 h-4 w-4" />
                                                )}
                                                {webSearch.isSearching ? "Searching..." : "Start New Search"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col px-6 pb-6">
                                    {/* Inline Search Progress */}
                                    {webSearch.isSearching && (
                                        <div className="-mx-6 mb-6 p-6 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-xl border border-blue-500/30" style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.15), 0 0 40px rgba(6, 182, 212, 0.1)' }}>
                                            <div className="text-center mb-6">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                    className="inline-flex items-center justify-center w-12 h-12 gradient-primary-to-accent rounded-full mb-3"
                                                    style={{
                                                        boxShadow: `
                                                            0 0 20px hsl(var(--accent-1) / 0.4),
                                                            0 0 40px hsl(var(--accent-2) / 0.3),
                                                            0 0 60px hsl(var(--accent-3) / 0.2),
                                                            inset 0 1px 0 rgba(255, 255, 255, 0.2)
                                                        `
                                                    }}
                                                >
                                                    <Globe className="h-6 w-6 text-white" />
                                                </motion.div>
                                                <h3 className="text-lg font-semibold text-gradient-primary">
                                                    Searching Academic Papers
                                                </h3>
                                                <p className="text-muted-foreground text-sm mt-1">
                                                    AI agent scanning multiple databases for relevant research
                                                </p>
                                            </div>

                                            {/* Enhanced Progress Bar with Metal Gears */}
                                            <div className="relative mb-6">
                                                {/* Progress Bar */}
                                                <div className="relative w-4/5 mx-auto h-3 bg-muted/20 rounded-full overflow-hidden border border-primary/40"
                                                    style={{
                                                        boxShadow: `
                                                        0 0 10px rgba(99, 102, 241, 0.3),
                                                        0 0 20px rgba(139, 92, 246, 0.2),
                                                        0 0 30px rgba(99, 102, 241, 0.1),
                                                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                                                    `
                                                    }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${webSearch.progress}%` }}
                                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                                        className="h-full gradient-primary-to-accent rounded-full relative"
                                                        style={{
                                                            boxShadow: `
                                                                0 0 10px hsl(var(--accent-1) / 0.4),
                                                                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                                                                inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                                                            `
                                                        }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
                                                    </motion.div>
                                                </div>

                                                {/* Metal Gears at Bar End - Fixed Position */}
                                                <motion.div
                                                    className="absolute -top-4 right-2"
                                                >
                                                    <div className="relative flex items-center justify-center">
                                                        {/* Large Metal Gear */}
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                            className="relative"
                                                            style={{
                                                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                                            }}
                                                        >
                                                            <svg width="28" height="28" viewBox="0 0 24 24" className="text-slate-400">
                                                                <defs>
                                                                    <linearGradient id="metalGradientLarge" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                        <stop offset="0%" stopColor="#e2e8f0" stopOpacity={1} />
                                                                        <stop offset="30%" stopColor="#cbd5e1" stopOpacity={1} />
                                                                        <stop offset="70%" stopColor="#94a3b8" stopOpacity={1} />
                                                                        <stop offset="100%" stopColor="#64748b" stopOpacity={1} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <path
                                                                    fill="url(#metalGradientLarge)"
                                                                    stroke="#475569"
                                                                    strokeWidth="0.5"
                                                                    d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
                                                                />
                                                            </svg>
                                                        </motion.div>

                                                        {/* Small Metal Gear (Diagonal Position) */}
                                                        <motion.div
                                                            animate={{ rotate: -360 }}
                                                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                                            className="absolute -top-2 -right-2"
                                                            style={{
                                                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                                                            }}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-500">
                                                                <defs>
                                                                    <linearGradient id="metalGradientSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                        <stop offset="0%" stopColor="#f1f5f9" stopOpacity={1} />
                                                                        <stop offset="30%" stopColor="#e2e8f0" stopOpacity={1} />
                                                                        <stop offset="70%" stopColor="#94a3b8" stopOpacity={1} />
                                                                        <stop offset="100%" stopColor="#475569" stopOpacity={1} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <path
                                                                    fill="url(#metalGradientSmall)"
                                                                    stroke="#334155"
                                                                    strokeWidth="0.3"
                                                                    d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
                                                                />
                                                            </svg>
                                                        </motion.div>

                                                        {/* Connecting Elements */}
                                                        <div className="absolute inset-0 pointer-events-none">
                                                            <motion.div
                                                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                                transition={{ duration: 2, repeat: Infinity }}
                                                                className="absolute top-1 right-1 w-1 h-1 bg-blue-400 rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                {/* Enhanced Percentage Display */}
                                                <div className="text-center mt-4">
                                                    <motion.span
                                                        className="text-2xl font-bold text-gradient-primary"
                                                        animate={{ scale: [1, 1.05, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    >
                                                        {Math.round(webSearch.progress)}%
                                                    </motion.span>
                                                </div>
                                            </div>

                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                        className="w-2 h-2 bg-blue-500 rounded-full"
                                                    />
                                                    <span>{webSearch.currentStep}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Papers Content */}
                                    {(getCurrentPapers().length > 0 || webSearch.isSearching) && (
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
                                                            {webSearch.isSearching && (
                                                                Array.from({ length: 12 }).map((_, index) => (
                                                                    <StreamingPaperCard
                                                                        key={`loading-${index}`}
                                                                        index={index}
                                                                        isLoading={true}
                                                                        streamDelay={Math.max(0, (webSearch.progress * 15) + (index * 150))}
                                                                    />
                                                                ))
                                                            )}

                                                            {!webSearch.isSearching && filteredAndSortedPapers.map((paper, index) => (
                                                                <StreamingPaperCard
                                                                    key={paper.id}
                                                                    paper={paper}
                                                                    index={index}
                                                                    onSelect={handlePaperSelect}
                                                                    onViewPdf={handleViewPdf}
                                                                    streamDelay={index * 200}
                                                                />
                                                            ))}
                                                        </AnimatePresence>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 pb-6">
                                                        <AnimatePresence mode="popLayout">
                                                            {filteredAndSortedPapers.map((paper, index) => (
                                                                <PaperCard
                                                                    key={paper.id}
                                                                    paper={paper}
                                                                    index={index}
                                                                    onSelect={handlePaperSelect}
                                                                    onViewPdf={handleViewPdf}
                                                                />
                                                            ))}
                                                        </AnimatePresence>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {!webSearch.isSearching && !isLoadingLatestPapers && getCurrentPapers().length === 0 && (
                                        <div className="text-center py-12">
                                            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-muted-foreground mb-2">No papers found</h3>
                                            <p className="text-muted-foreground mb-4">Start a new search to find relevant research papers</p>
                                            <Button onClick={handleRetrievePapers} className="gradient-primary-to-accent hover:gradient-accent text-white border border-primary/30" style={{ boxShadow: '0 0 15px hsl(var(--accent-1) / 0.4), 0 0 30px hsl(var(--accent-2) / 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>
                                                <Search className="mr-2 h-4 w-4" />
                                                Start Search
                                            </Button>
                                        </div>
                                    )}

                                    {isLoadingLatestPapers && getCurrentPapers().length === 0 && (
                                        <div className="text-center py-12">
                                            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                                            <h3 className="text-lg font-medium text-muted-foreground mb-2">Loading latest papers...</h3>
                                            <p className="text-muted-foreground mb-4">Fetching the most recent search results for this project</p>
                                        </div>
                                    )}


                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* All Papers Tab */}
                        <TabsContent value="all-papers" className="flex-1 m-0 p-0">
                            <Card className="w-full h-full bg-transparent border-2 border-primary/10 shadow-lg shadow-primary/5 rounded-lg flex flex-col">
                                <CardHeader className="px-6 pt-6 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <BookOpen className="h-5 w-5 text-primary" />
                                                All Papers
                                            </CardTitle>
                                            <CardDescription>
                                                Complete collection of papers in your library
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                                className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40"
                                                style={{ boxShadow: '0 0 8px rgba(99, 102, 241, 0.08), 0 0 16px rgba(139, 92, 246, 0.04)' }}
                                            >
                                                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowFilters(!showFilters)}
                                                className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40"
                                                style={{ boxShadow: '0 0 8px rgba(99, 102, 241, 0.08), 0 0 16px rgba(139, 92, 246, 0.04)' }}
                                            >
                                                <Filter className="h-4 w-4 mr-2" />
                                                Filters
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col px-6 pb-6">
                                    {/* Search Bar */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                            <Input
                                                placeholder="Search papers by title, author, venue, or content..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 bg-background/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 focus:border-primary/60 transition-all duration-300"
                                                style={{ boxShadow: '0 0 8px rgba(99, 102, 241, 0.06), 0 0 16px rgba(139, 92, 246, 0.03)' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Filters */}
                                    <AnimatePresence>
                                        {showFilters && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <Separator className="my-3" />
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="text-sm font-medium mb-2 block">Sort By</label>
                                                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                                            <SelectTrigger className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-300" style={{ boxShadow: '0 0 6px rgba(99, 102, 241, 0.06), 0 0 12px rgba(139, 92, 246, 0.03)' }}>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="date">Publication Date</SelectItem>
                                                                <SelectItem value="citations">Citations</SelectItem>
                                                                <SelectItem value="title">Title</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div>
                                                        <label className="text-sm font-medium mb-2 block">Source</label>
                                                        <Select value={filterSource} onValueChange={setFilterSource}>
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
                                                        <Select value={filterOpenAccess} onValueChange={setFilterOpenAccess}>
                                                            <SelectTrigger className="bg-background/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-300" style={{ boxShadow: '0 0 6px rgba(99, 102, 241, 0.06), 0 0 12px rgba(139, 92, 246, 0.03)' }}>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">All Papers</SelectItem>
                                                                <SelectItem value="open">Open Access</SelectItem>
                                                                <SelectItem value="closed">Closed Access</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Papers Content */}
                                    {getCurrentPapers().length > 0 && (
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
                                                            {filteredAndSortedPapers.map((paper, index) => (
                                                                <StreamingPaperCard
                                                                    key={paper.id}
                                                                    paper={paper}
                                                                    index={index}
                                                                    onSelect={handlePaperSelect}
                                                                    onViewPdf={handleViewPdf}
                                                                    streamDelay={0}
                                                                />
                                                            ))}
                                                        </AnimatePresence>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 pb-6">
                                                        <AnimatePresence mode="popLayout">
                                                            {filteredAndSortedPapers.map((paper, index) => (
                                                                <PaperCard
                                                                    key={paper.id}
                                                                    paper={paper}
                                                                    index={index}
                                                                    onSelect={handlePaperSelect}
                                                                    onViewPdf={handleViewPdf}
                                                                />
                                                            ))}
                                                        </AnimatePresence>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {getCurrentPapers().length === 0 && (
                                        <div className="text-center py-12">
                                            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-muted-foreground mb-2">No papers in library</h3>
                                            <p className="text-muted-foreground mb-4">Your library is empty. Add papers through web search or file upload.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Uploaded Content Tab */}
                        <TabsContent value="uploaded" className="flex-1 m-0 p-0">
                            <Card className="w-full h-full bg-transparent border-2 border-primary/10 shadow-lg shadow-primary/5 rounded-lg flex flex-col">
                                <CardHeader className="px-6 pt-6 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <FolderOpen className="h-5 w-5 text-primary" />
                                                Uploaded Content
                                            </CardTitle>
                                            <CardDescription>
                                                Papers and documents you've uploaded directly
                                            </CardDescription>
                                        </div>
                                        <Button
                                            onClick={() => setShowPDFUpload(true)}
                                            variant="outline"
                                            className="gradient-primary-to-accent hover:gradient-accent text-white border border-primary/30"
                                            style={{ boxShadow: '0 0 15px hsl(var(--accent-1) / 0.4), 0 0 30px hsl(var(--accent-2) / 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload Files
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col px-6 pb-6">
                                    <div className="text-center py-12">
                                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No uploaded content</h3>
                                        <p className="text-muted-foreground mb-4">Upload PDFs or other documents to analyze them with AI</p>
                                        <Button
                                            onClick={() => setShowPDFUpload(true)}
                                            className="gradient-primary-to-accent hover:gradient-accent text-white border border-primary/30"
                                            style={{ boxShadow: '0 0 15px hsl(var(--accent-1) / 0.4), 0 0 30px hsl(var(--accent-2) / 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload Files
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
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

            {/* Search Configuration Dialog */}
            <SearchConfigDialog
                isOpen={showSearchConfig}
                projectId={projectId}
                onClose={() => setShowSearchConfig(false)}
                onSearchSubmit={handleSearchSubmit}
                isLoading={webSearch.isSearching}
            />

            {/* PDF Upload Dialog */}
            <PDFUploadDialog
                isOpen={showPDFUpload}
                projectId={projectId}
                onClose={() => setShowPDFUpload(false)}
                onUploadComplete={() => {
                    // Refresh the library data
                    loadProjectLibrary(projectId)
                }}
            />
        </div>
    )
} 