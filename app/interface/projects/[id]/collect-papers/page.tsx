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
    ChevronUp
} from "lucide-react"
import { isValidUUID } from "@/lib/utils"
import { useWebSearch } from "@/hooks/useWebSearch"
import { libraryApi } from "@/lib/api/project-service"
import { SearchLoadingProgress } from "@/components/library/SearchLoadingProgress"

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
        }
    }, [projectId])

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
            await webSearch.search(searchRequest)
            // Refresh latest papers after search
            await loadLatestPapers()
        } catch (error) {
            console.error("Search failed:", error)
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
                                <CardContent className="flex-1 flex flex-col px-6 pb-6">
                                    {/* Inline Search Progress */}
                                    {webSearch.isSearching && (
                                        <div className="-mx-6 mb-6 p-6 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-xl border border-blue-500/30" style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.15), 0 0 40px rgba(6, 182, 212, 0.1)' }}>
                                            <div className="text-center mb-6">
                                                <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                                                    Searching Academic Databases
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    Discovering relevant research papers for your project...
                                                </p>
                                            </div>
                                            <SearchLoadingProgress
                                                searchProgress={webSearch.searchProgress}
                                                completedSteps={webSearch.completedSteps}
                                                totalSteps={webSearch.totalSteps}
                                                streamingPapers={webSearch.streamingPapers}
                                            />
                                        </div>
                                    )}

                                    {/* Search Results */}
                                    {latestPapers.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: 0.4 }}
                                            className="w-full flex-1"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                                                <AnimatePresence mode="popLayout">
                                                    {latestPapers.map((paper, index) => (
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
                                        </motion.div>
                                    )}

                                    {latestPapers.length === 0 && !webSearch.isSearching && (
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
                    // Refresh data after upload
                    loadLatestPapers()
                }}
            />
        </div>
    )
}
