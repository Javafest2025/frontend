"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Search,
    RefreshCw,
    Upload,
    Globe,
    FolderOpen,
    Zap,
    ChevronUp,
    CheckCircle,
    Star
} from "lucide-react"
import { isValidUUID } from "@/lib/utils"
import { useWebSearch } from "@/hooks/useWebSearch"
import { libraryApi } from "@/lib/api/project-service"
import { StreamingPaperCard } from "@/components/library/StreamingPaperCard"
import { PaperDetailModal } from "@/components/library/PaperDetailModal"
import { PdfViewerModal } from "@/components/library/PdfViewerModal"
import { SearchConfigDialog } from "@/components/library/SearchConfigDialog"
import { PDFUploadDialog } from "@/components/library/PDFUploadDialog"
import type { Paper, WebSearchRequest } from "@/types/websearch"

interface CollectPapersPageProps {
    readonly params: Promise<{
        readonly id: string
    }>
}

// Shimmering paper card component for loading state
const ShimmeringPaperCard = ({ index }: { index: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl"
        style={{ boxShadow: '0 0 20px rgba(99, 102, 241, 0.15), 0 0 40px rgba(139, 92, 246, 0.08)' }}
    >
        <div className="p-6">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />

            {/* Title shimmer */}
            <div className="h-6 bg-gradient-to-r from-primary/30 to-accent-2/30 rounded mb-3 animate-pulse" />

            {/* Author shimmer */}
            <div className="h-4 bg-gradient-to-r from-muted/40 to-muted/30 rounded mb-2 w-3/4 animate-pulse" />

            {/* Abstract shimmer */}
            <div className="space-y-2">
                <div className="h-3 bg-gradient-to-r from-muted/30 to-muted/20 rounded animate-pulse" />
                <div className="h-3 bg-gradient-to-r from-muted/30 to-muted/20 rounded w-5/6 animate-pulse" />
                <div className="h-3 bg-gradient-to-r from-muted/30 to-muted/20 rounded w-4/6 animate-pulse" />
            </div>

            {/* Metadata shimmer */}
            <div className="flex gap-2 mt-4">
                <div className="h-6 w-16 bg-gradient-to-r from-primary/30 to-accent-2/30 rounded animate-pulse" />
                <div className="h-6 w-20 bg-gradient-to-r from-muted/40 to-muted/30 rounded animate-pulse" />
            </div>
        </div>
    </motion.div>
)

// 3D Browser Icon component
const RotatingBrowserIcon = () => (
    <div className="relative w-16 h-16">
        <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-full h-full relative"
        >
            {/* Browser window base */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/40 via-purple-500/30 to-cyan-500/40 border-2 border-primary/40 backdrop-blur-xl shadow-lg" />

            {/* Browser header */}
            <div className="absolute top-1 left-1 right-1 h-3 bg-gradient-to-r from-primary/60 to-accent-2/60 rounded-sm" />

            {/* Browser controls */}
            <div className="absolute top-2 left-2 flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400/80" />
                <div className="w-2 h-2 rounded-full bg-yellow-400/80" />
                <div className="w-2 h-2 rounded-full bg-green-400/80" />
            </div>

            {/* Search bar */}
            <div className="absolute top-6 left-2 right-2 h-2 bg-gradient-to-r from-muted/40 to-muted/20 rounded-sm" />

            {/* Content area */}
            <div className="absolute top-9 left-2 right-2 bottom-2 bg-gradient-to-br from-background/30 to-primary/10 rounded-sm border border-primary/20" />

            {/* Search icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-6 w-6 text-primary/90 drop-shadow-lg" />
            </div>

            {/* 3D effect highlights */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-white/60 rounded-full blur-sm" />
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/40 rounded-full blur-sm" />
        </motion.div>
    </div>
)

// Progress tooltip component with comprehensive workflow steps
const ProgressTooltip = ({ progress, currentStep, onClose }: { progress: number; currentStep: string; onClose: () => void }) => {
    const steps = [
        // Phase 1: Initialization (0-10%)
        "🚀 Initializing ScholarAI search agent...",
        "⚙️ Loading configuration and settings...",
        "🔧 Preparing multi-source search infrastructure...",
        "📋 Validating search parameters and domain...",

        // Phase 2: API Connections (10-25%)
        "🌐 Establishing connection to arXiv repository...",
        "🏥 Connecting to PubMed medical database...",
        "📚 Linking to OpenAlex academic index...",
        "🔬 Accessing CORE research repository...",
        "🇪🇺 Connecting to Europe PMC database...",

        // Phase 3: Search Execution (25-50%)
        "🔍 Executing primary search queries...",
        "📝 Processing and optimizing query terms...",
        "📡 Sending requests to arXiv API...",
        "🏥 Querying PubMed for medical papers...",
        "📚 Searching OpenAlex academic database...",
        "🔬 Scanning CORE research papers...",
        "🇪🇺 Searching Europe PMC repository...",
        "⏳ Waiting for API responses...",

        // Phase 4: Data Collection (50-70%)
        "📊 Collecting initial search results...",
        "🔄 Gathering papers from all sources...",
        "📈 Aggregating metadata from APIs...",
        "🔗 Cross-referencing paper identifiers...",

        // Phase 5: Processing & Filtering (70-85%)
        "🎯 Filtering papers by relevance...",
        "📅 Applying publication date filters...",
        "🏷️ Categorizing by research domain...",
        "🔍 Removing low-quality matches...",

        // Phase 6: Deduplication & Enrichment (85-95%)
        "🔄 Identifying duplicate papers...",
        "🧹 Removing duplicate entries...",
        "📖 Enriching paper metadata...",
        "👥 Adding author information...",
        "📝 Filling missing abstracts...",
        "🔗 Resolving DOI references...",
        "⭐ Ranking papers by relevance...",

        // Phase 7: PDF Processing (95-98%)
        "📄 Collecting PDF documents...",
        "⬇️ Downloading paper PDFs...",
        "☁️ Uploading to B2 cloud storage...",
        "🔗 Generating secure PDF URLs...",

        // Phase 8: Finalization (98-100%)
        "📋 Finalizing paper collection...",
        "✅ Preparing results for display...",
        "🎉 Search completed successfully!"
    ]

    const completedSteps = Math.floor((progress / 100) * steps.length)

    return (
        <div className="absolute top-full right-0 mt-4 px-5 py-4 bg-background border-2 border-primary/60 rounded-xl shadow-2xl z-[99999] w-80">
            <div className="text-sm font-bold text-primary mb-3 border-b-2 border-primary/50 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    Search Progress Details
                </div>
                <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 p-1 rounded-full hover:bg-primary/10"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-2">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                        {index < completedSteps ? (
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                            <div className="h-3 w-3 rounded-full border-2 border-primary/60 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={index < completedSteps ? "text-green-400 font-medium" : "text-muted-foreground"}>
                            {step}
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-3 pt-2 border-t-2 border-primary/50">
                <div className="text-xs text-muted-foreground font-bold">{Math.round(progress)}% complete</div>
                <div className="text-xs text-primary/80 mt-1">
                    {completedSteps} of {steps.length} steps completed
                </div>
            </div>
        </div>
    )
}

export default function CollectPapersPage({ params }: CollectPapersPageProps) {
    const [projectId, setProjectId] = useState<string>("")
    const [activeTab, setActiveTab] = useState<"web-search" | "upload">("web-search")

    // Web Search Related State
    const [latestPapers, setLatestPapers] = useState<Paper[]>([])
    const [isLoadingLatestPapers, setIsLoadingLatestPapers] = useState(false)
    const [showSearchConfig, setShowSearchConfig] = useState(false)

    // Upload Related State
    const [uploadedContent] = useState<any[]>([])
    const [showPDFUpload, setShowPDFUpload] = useState(false)

    // Paper Interaction State
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
    const [pdfViewerPaper, setPdfViewerPaper] = useState<Paper | null>(null)
    const [showPdfViewer, setShowPdfViewer] = useState(false)

    // Scroll state
    const [showScrollTop, setShowScrollTop] = useState(false)
    const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)

    // Progress tooltip state
    const [showProgressTooltip, setShowProgressTooltip] = useState(false)

    // Favorite state
    const [favoritePapers, setFavoritePapers] = useState<Set<string>>(new Set())
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

    const webSearch = useWebSearch()

    // Validate and set project ID from params
    useEffect(() => {
        params.then((resolvedParams) => {
            const { id } = resolvedParams
            if (!isValidUUID(id)) {
                console.error("Invalid project ID:", id)
                return
            }
            setProjectId(id)
        }).catch((error) => {
            console.error("Error resolving params:", error)
        })
    }, [params])

    // Load latest papers when project ID is available
    useEffect(() => {
        if (projectId) {
            loadLatestPapers()
            loadFavorites()
        }
    }, [projectId])

    // Load favorites for the project
    const loadFavorites = async () => {
        try {
            const resolvedParams = await params
            const favorites = await libraryApi.getPaperFavorites(resolvedParams.id)
            const favoriteIds = new Set(favorites.map((fav: any) => fav.paperId))
            setFavoritePapers(favoriteIds)
        } catch (error) {
            console.error('Error loading favorites:', error)
        }
    }

    // Load the latest papers from web search
    const loadLatestPapers = async () => {
        if (!projectId) return

        setIsLoadingLatestPapers(true)
        try {
            const papers = await libraryApi.getLatestProjectPapers(projectId)
            setLatestPapers(papers || [])
        } catch (error) {
            console.error("Error loading latest papers:", error)
            setLatestPapers([])
        } finally {
            setIsLoadingLatestPapers(false)
        }
    }

    // Handle web search
    const handleRetrievePapers = () => {
        setShowSearchConfig(true)
    }

    const handleSearchSubmit = async (searchRequest: WebSearchRequest) => {
        setShowSearchConfig(false)
        try {
            await webSearch.startSearch(searchRequest)
            // Refresh latest papers after search
            await loadLatestPapers()
        } catch (error) {
            console.error("Search failed:", error)
        }
    }

    const handleToggleFavorite = async (paper: Paper) => {
        try {
            const resolvedParams = await params
            const wasAdded = await libraryApi.togglePaperFavorite(resolvedParams.id, paper.id, {
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

    const handleRefreshLatestPapers = () => {
        loadLatestPapers()
    }

    // Paper interaction handlers
    const handlePaperSelect = (paper: Paper) => {
        setSelectedPaper(paper)
    }

    const handleViewPdf = (paper: Paper) => {
        setPdfViewerPaper(paper)
        setShowPdfViewer(true)
    }

    // Scroll handlers
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop
        setShowScrollTop(scrollTop > 400)
    }

    const scrollToTop = () => {
        scrollContainer?.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Loading state
    if (!projectId) {
        return (
            <div className="h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading project...</p>
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
                            <Zap className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-gradient-primary">
                            Collect Papers
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Search the web and upload research papers to build your collection
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
                        <TabsList className="grid w-full grid-cols-2 bg-background/60 backdrop-blur-xl border-2 border-primary/20" style={{ boxShadow: '0 0 12px rgba(99, 102, 241, 0.1), 0 0 25px rgba(139, 92, 246, 0.06)' }}>
                            <TabsTrigger
                                value="web-search"
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent-2/20 border-r border-primary/10 last:border-r-0"
                            >
                                <Globe className="h-4 w-4" />
                                Web Search
                                {latestPapers.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 text-xs">
                                        {latestPapers.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="upload"
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent-2/20 border-r border-primary/10 last:border-r-0"
                            >
                                <FolderOpen className="h-4 w-4" />
                                Upload Content
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {uploadedContent.length}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </motion.div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto border-l-0 border-r border-primary/20 bg-gradient-to-br from-background/60 to-primary/5 backdrop-blur-sm" style={{ boxShadow: 'inset -8px 0 25px rgba(139, 92, 246, 0.08)' }} ref={setScrollContainer} onScroll={handleScroll}>
                <div className="w-full h-full">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full h-full flex flex-col">

                        {/* Web Search Tab */}
                        <TabsContent value="web-search" className="flex-1 m-0 p-0">
                            <Card className="w-full h-full bg-transparent border-2 border-primary/10 shadow-lg shadow-primary/5 rounded-lg flex flex-col">
                                <CardHeader className="px-6 pt-6 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Globe className="h-5 w-5 text-primary" />
                                                Web Search Results
                                            </CardTitle>
                                            <CardDescription>
                                                Search and discover research papers from academic databases
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
                                                    <Search className="mr-2 h-4 w-4" />
                                                )}
                                                {webSearch.isSearching ? "Searching..." : "Start New Search"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Favorite Filter */}
                                {latestPapers.length > 0 && (
                                    <div className="px-6 pb-4">
                                        <div className="flex items-center gap-4">
                                            <Button
                                                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                                                variant="outline"
                                                size="sm"
                                                className={`transition-all duration-200 flex items-center gap-2 ${showFavoritesOnly
                                                    ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/30'
                                                    : 'bg-background/40 text-muted-foreground border-primary/20 hover:bg-primary/10'
                                                    }`}
                                            >
                                                <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                                                {showFavoritesOnly ? 'Showing Favorites' : 'Show Favorites Only'}
                                                {favoritePapers.size > 0 && (
                                                    <Badge variant="secondary" className="ml-1 text-xs">
                                                        {favoritePapers.size}
                                                    </Badge>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <CardContent className="flex-1 flex flex-col px-6 pb-6 relative overflow-visible">
                                    {/* Search Progress Section */}
                                    {webSearch.isSearching && (
                                        <div className="mb-6 p-6 bg-gradient-to-br from-primary/10 via-accent-1/8 to-accent-2/10 rounded-xl border-2 border-primary/30 backdrop-blur-xl shadow-lg relative z-50">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <RotatingBrowserIcon />
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-primary">
                                                            Searching Academic Databases
                                                        </h3>
                                                        <p className="text-muted-foreground text-sm">
                                                            Discovering relevant research papers for your project...
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowProgressTooltip(!showProgressTooltip)}
                                                        className="px-4 py-2 bg-gradient-to-r from-primary/30 to-accent-2/30 rounded-lg border-2 border-primary/50 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:from-primary/40 hover:to-accent-2/40"
                                                    >
                                                        <span className="text-sm font-semibold text-white drop-shadow-sm relative overflow-hidden">
                                                            <span className="relative z-10">Progress</span>
                                                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse" style={{ animationDuration: '2s' }}></span>
                                                        </span>
                                                    </button>
                                                    {showProgressTooltip && (
                                                        <ProgressTooltip
                                                            progress={webSearch.progress}
                                                            currentStep={webSearch.currentStep}
                                                            onClose={() => setShowProgressTooltip(false)}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="w-full h-3 bg-muted/40 rounded-full overflow-hidden border border-primary/20">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${webSearch.progress}%` }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-primary via-accent-1 to-accent-2 rounded-full relative shadow-lg"
                                                    style={{ boxShadow: '0 0 8px rgba(99, 102, 241, 0.4), 0 0 16px rgba(139, 92, 246, 0.2)' }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                                                </motion.div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Search Results or Shimmering Cards */}
                                    {webSearch.isSearching ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="w-full flex-1 relative z-0"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                                                {Array.from({ length: 8 }).map((_, index) => (
                                                    <ShimmeringPaperCard key={index} index={index} />
                                                ))}
                                            </div>
                                        </motion.div>
                                    ) : latestPapers.length > 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: 0.4 }}
                                            className="w-full flex-1"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                                                <AnimatePresence mode="popLayout">
                                                    {latestPapers
                                                        .filter(paper => !showFavoritesOnly || favoritePapers.has(paper.id))
                                                        .map((paper, index) => (
                                                            <StreamingPaperCard
                                                                key={paper.id}
                                                                paper={paper}
                                                                index={index}
                                                                onSelect={handlePaperSelect}
                                                                onViewPdf={handleViewPdf}
                                                                onToggleFavorite={handleToggleFavorite}
                                                                isFavorited={favoritePapers.has(paper.id)}
                                                                streamDelay={0}
                                                            />
                                                        ))}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-muted-foreground mb-2">No search results yet</h3>
                                            <p className="text-muted-foreground mb-4">Start a new search to discover relevant research papers</p>
                                            <Button
                                                onClick={handleRetrievePapers}
                                                className="gradient-primary-to-accent hover:gradient-accent text-white border border-primary/30"
                                                style={{ boxShadow: '0 0 15px hsl(var(--accent-1) / 0.4), 0 0 30px hsl(var(--accent-2) / 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}
                                            >
                                                <Search className="mr-2 h-4 w-4" />
                                                Start Search
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Upload Tab */}
                        <TabsContent value="upload" className="flex-1 m-0 p-0">
                            <Card className="w-full h-full bg-transparent border-2 border-primary/10 shadow-lg shadow-primary/5 rounded-lg flex flex-col">
                                <CardHeader className="px-6 pt-6 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <FolderOpen className="h-5 w-5 text-primary" />
                                                Upload Content
                                            </CardTitle>
                                            <CardDescription>
                                                Upload PDFs and documents to analyze with AI
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
                                <CardContent className="flex-1 flex flex-col px-6 pb-6 relative overflow-visible">
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
                    // Refresh data after upload
                    loadLatestPapers()
                }}
            />
        </div>
    )
}
