"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Worker, Viewer, ScrollMode } from '@react-pdf-viewer/core'
import type { PopoverProps } from '@react-pdf-viewer/core'
import { zoomPlugin } from '@react-pdf-viewer/zoom'
import type { ZoomPopoverProps } from '@react-pdf-viewer/zoom'
import { searchPlugin } from '@react-pdf-viewer/search'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import {
  Download,
  FileText,
  AlertCircle,
  RefreshCw,
  Search,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquarePlus,
  Bot,
  LayoutGrid,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils/cn"
import { downloadPdfWithAuth } from "@/lib/api/pdf"
import { ChatContainer } from "@/components/chat/ChatContainer"
import { postPaperChat } from "@/lib/api/qa"
import { checkPaperChatReadiness, extractPaperForChat } from "@/lib/api/chat"

// Import CSS for react-pdf-viewer
import '@react-pdf-viewer/core/lib/styles/index.css'

// Thumbnail plugin for grid view
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail'
import '@react-pdf-viewer/thumbnail/lib/styles/index.css'

// Search plugin styles (for highlight colors)
import '@react-pdf-viewer/search/lib/styles/index.css'

type Props = {
  documentUrl?: string
  documentName?: string
  paperId?: string
}

// Helper function to handle PDF URL processing
const processPdfUrl = async (url: string): Promise<string> => {
  try {
    console.log('Processing PDF URL:', url)

    // If it's already a blob or data URL, return as is
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      console.log('URL is already a blob/data URL')
      return url
    }

    // Check if it's a valid URL
    try {
      const urlObj = new URL(url)

      // If it's from our own domain, use it directly
      if (typeof window !== 'undefined') {
        const currentOrigin = window.location.origin
        if (urlObj.origin === currentOrigin) {
          console.log('Internal URL detected:', url)
          return url
        }
      }

      // Check if it's a B2 URL
      const isB2Url = urlObj.hostname.startsWith('f') && urlObj.hostname.endsWith('.backblazeb2.com')

      if (isB2Url) {
        // Extract file ID from B2 URL
        const fileId = urlObj.searchParams.get('fileId')
        if (fileId) {
          const b2DownloadUrl = `/api/b2/download?fileId=${fileId}`
          console.log('B2 URL detected, using dedicated download endpoint:', b2DownloadUrl)
          return b2DownloadUrl
        }
      }

      // If it's external, use our proxy to bypass CORS
      const proxyUrl = `/api/pdf/proxy?url=${encodeURIComponent(url)}`
      console.log('External URL detected, using proxy. Original:', url, 'Proxy:', proxyUrl)
      return proxyUrl
    } catch (urlError) {
      console.error('Invalid URL format:', urlError)
      throw new Error(`Invalid PDF URL format: ${url}`)
    }
  } catch (error) {
    console.error('Error processing PDF URL:', error)
    throw error
  }
}

export function PDFViewer({ documentUrl, documentName = "Document", paperId }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read')
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showSearch, setShowSearch] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<{ pageIndex: number; snippet: string }[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [jumpToPage, setJumpToPage] = useState('')
  const [scale, setScale] = useState(1.0)
  const [visualScale, setVisualScale] = useState(1.0)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState({ x: '50%', y: '50%' })
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)
  const [showThumbnails, setShowThumbnails] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Chat drawer state
  const [showChat, setShowChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [externalContexts, setExternalContexts] = useState<string[]>([])

  // Floating add-to-chat button for selected text
  const [selectionText, setSelectionText] = useState('')
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null)
  
  // Selected text context for chat
  const [selectedTextForChat, setSelectedTextForChat] = useState<{
    text: string
    from: number
    to: number
    pageNumber?: number
    sectionTitle?: string
  } | null>(null)

  // Chat metadata and resizing
  const [chatName, setChatName] = useState('New Chat')
  const [isEditingName, setIsEditingName] = useState(false)
  const [chatHistory, setChatHistory] = useState<{ name: string; messages: { role: 'user' | 'assistant'; content: string }[] }[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [chatWidth, setChatWidth] = useState(384)
  const [isResizing, setIsResizing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(384)

  // Q/A chat state
  const [qaLoading, setQaLoading] = useState(false)
  const [qaError, setQaError] = useState<string | null>(null)
  const [qaUserMessage, setQaUserMessage] = useState<string | null>(null)
  const [qaAssistantMessage, setQaAssistantMessage] = useState<string | null>(null)

  // Extraction state
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [isExtracted, setIsExtracted] = useState(false)
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null)
  const [showExtractionSuccess, setShowExtractionSuccess] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const zoomPluginInstance = zoomPlugin()
  const { zoomTo } = zoomPluginInstance

  const searchPluginInstance = searchPlugin()
  const { clearHighlights, highlight, jumpToNextMatch, jumpToPreviousMatch, jumpToMatch } = searchPluginInstance

  // Thumbnail plugin instance
  const thumbnailPluginInstance = thumbnailPlugin()

  // Add thumbnail overlay component
  const ThumbnailOverlay = () => {
    const [thumbnails, setThumbnails] = useState<{ pageIndex: number; url: string }[]>([])
    const [loadingThumbnails, setLoadingThumbnails] = useState(true)

    useEffect(() => {
      const generateThumbnails = async () => {
        if (!pdfDoc) return

        setLoadingThumbnails(true)
        const thumbs: { pageIndex: number; url: string }[] = []

        try {
          for (let i = 1; i <= Math.min(pdfDoc.numPages, 100); i++) {
            const page = await pdfDoc.getPage(i)
            const viewport = page.getViewport({ scale: 0.5 })
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')

            if (context) {
              canvas.height = viewport.height
              canvas.width = viewport.width

              await page.render({
                canvasContext: context,
                viewport: viewport
              }).promise

              thumbs.push({
                pageIndex: i - 1,
                url: canvas.toDataURL()
              })
            }
          }

          setThumbnails(thumbs)
        } catch (error) {
          console.error('Error generating thumbnails:', error)
        } finally {
          setLoadingThumbnails(false)
        }
      }

      if (showThumbnails && pdfDoc) {
        generateThumbnails()
      }
    }, [showThumbnails, pdfDoc])

    return (
      <div className="fixed inset-0 bg-background z-50 overflow-auto">
        <div className="sticky top-0 flex items-center justify-between p-4 bg-background border-b border-border z-10">
          <h2 className="text-lg font-semibold">All Pages</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowThumbnails(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-8 max-w-[1600px] mx-auto">
          {loadingThumbnails ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Generating thumbnails...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {thumbnails.map((thumb) => (
                <div
                  key={thumb.pageIndex}
                  className="cursor-pointer group"
                  onClick={() => {
                    jumpToPageNumber(thumb.pageIndex)
                    setShowThumbnails(false)
                  }}
                >
                  <div className="relative rounded-lg overflow-hidden bg-card border border-border transition-all duration-200 hover:border-primary hover:shadow-lg hover:-translate-y-1">
                    <div className="aspect-[1/1.4] bg-muted">
                      <img
                        src={thumb.url}
                        alt={`Page ${thumb.pageIndex + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <p className="text-center mt-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Page {thumb.pageIndex + 1}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Function to poll extraction status
  const pollExtractionStatus = useCallback(async (paperId: string) => {
    try {
      const readiness = await checkPaperChatReadiness(paperId)
      
      if (readiness.isReady) {
        // Extraction is complete
        setIsExtracted(true)
        setIsExtracting(false)
        setExtractionStatus('Extraction completed successfully')
        setShowExtractionSuccess(true)
        
        // Clear polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        
        // Auto-open chat after successful extraction with a slight delay
        setTimeout(() => {
          setShowChat(true)
        }, 1000)
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowExtractionSuccess(false)
        }, 5000)
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error polling extraction status:', error)
      return false
    }
  }, [])

  // Start polling extraction status
  const startPollingExtraction = useCallback((paperId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    
    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      const isComplete = await pollExtractionStatus(paperId)
      if (isComplete) {
        // Polling will be cleared by pollExtractionStatus
      }
    }, 3000)
    
    // Also check immediately
    pollExtractionStatus(paperId)
  }, [pollExtractionStatus])

  // Load and process PDF URL
  useEffect(() => {
    const loadPdf = async () => {
      if (!documentUrl) {
        setProcessedUrl(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('Loading PDF from URL:', documentUrl)
        const url = await processPdfUrl(documentUrl)
        console.log('Processed PDF URL:', url)
        setProcessedUrl(url)
        
        // Trigger extraction check if paperId is available
        if (paperId) {
          console.log('🔍 Checking extraction status for paper:', paperId)
          let extractionFailed = false
          try {
            const readiness = await checkPaperChatReadiness(paperId)
            setIsExtracted(readiness.isReady)
            
            if (readiness.needsExtraction) {
              console.log('🚀 Starting extraction for paper:', paperId)
              setIsExtracting(true)
              setExtractionError(null)
              setExtractionStatus('Starting extraction...')
              
              await extractPaperForChat(paperId)
              
              setExtractionStatus('Extraction initiated, waiting for completion...')
              console.log('✅ Extraction initiated for paper:', paperId)
              
              // Start polling for extraction completion
              startPollingExtraction(paperId)
            } else {
              console.log('✅ Paper already extracted:', paperId)
              setExtractionStatus('Already extracted')
              // If already extracted, open chat immediately
              setTimeout(() => {
                setShowChat(true)
              }, 500)
            }
          } catch (extractError) {
            console.error('❌ Extraction error for paper:', paperId, extractError)
            setExtractionError(extractError instanceof Error ? extractError.message : 'Extraction failed')
            setExtractionStatus('Extraction failed')
            extractionFailed = true
            setIsExtracting(false)
          }
        }
      } catch (error) {
        console.error('Failed to load PDF:', error)
        let errorMessage = 'Failed to load PDF document.'

        if (error instanceof Error) {
          if (error.message.includes('fetch')) {
            errorMessage += ' Network error - the PDF may be inaccessible or blocked by CORS policy.'
          } else if (error.message.includes('CORS')) {
            errorMessage += ' Cross-origin request blocked. Using proxy to retry...'
          } else if (error.message.includes('404')) {
            errorMessage += ' PDF file not found (404).'
          } else if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage += ' Access denied - authentication may be required.'
          } else if (documentUrl?.startsWith('http')) {
            errorMessage += ' External PDF access failed. Proxy will handle this automatically.'
          } else {
            errorMessage += ' The file may be corrupted or in an unsupported format.'
          }
        }

        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadPdf()

    // Cleanup blob URLs when component unmounts or URL changes
    return () => {
      if (processedUrl && processedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(processedUrl)
      }
      // Clean up polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [documentUrl])

  // Handle PDF download
  const handleDownload = async () => {
    const urlForDownload = processedUrl || documentUrl
    if (!urlForDownload) return

    try {
      await downloadPdfWithAuth(urlForDownload, documentName)
    } catch (error) {
      console.error('Download failed:', error)

      // Fallback: Attempt to open the PDF in a new tab for download
      try {
        const link = document.createElement('a')
        link.href = urlForDownload
        link.download = `${documentName}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError)
        setError('Failed to download PDF. Please try again or check your connection.')
      }
    }
  }

  const handleDocumentLoad = useCallback((e: any) => {
    console.log('Document loaded successfully:', e)
    setTotalPages(e.doc.numPages)
    setPdfDoc(e.doc)
    setError(null)
    setScale(1.0)
  }, [])

  const handlePageChange = useCallback((e: any) => {
    console.log('Page changed to:', e.currentPage + 1)
    setCurrentPage(e.currentPage)
  }, [])

  // Add scroll event listener to track current page manually if needed
  useEffect(() => {
    const outerContainer = containerRef.current?.parentElement
    if (!outerContainer) return

    const handleScroll = () => {
      // Find all pages in the document
      const pages = document.querySelectorAll('.rpv-core__page-layer')
      if (pages.length === 0) return

      const containerRect = outerContainer.getBoundingClientRect()
      const containerTop = containerRect.top
      const containerBottom = containerRect.bottom
      const containerCenter = containerTop + containerRect.height / 2

      // Find which page is most visible in the viewport
      let visiblePageIndex = 0
      let maxVisibleArea = 0

      pages.forEach((page, index) => {
        const pageRect = page.getBoundingClientRect()

        // Calculate visible area of this page
        const visibleTop = Math.max(pageRect.top, containerTop)
        const visibleBottom = Math.min(pageRect.bottom, containerBottom)
        const visibleHeight = Math.max(0, visibleBottom - visibleTop)
        const visibleArea = visibleHeight * pageRect.width

        if (visibleArea > maxVisibleArea) {
          maxVisibleArea = visibleArea
          visiblePageIndex = index
        }
      })

      if (visiblePageIndex !== currentPage) {
        console.log('Page changed from', currentPage, 'to', visiblePageIndex)
        setCurrentPage(visiblePageIndex)
      }
    }

    // Throttle scroll events for better performance
    let ticking = false
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    outerContainer.addEventListener('scroll', throttledHandleScroll, { passive: true })
    return () => outerContainer.removeEventListener('scroll', throttledHandleScroll)
  }, [processedUrl, currentPage])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle chat with Ctrl+I
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        setShowChat((prev) => !prev)
        return
      }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 100)
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false)
        setSearchKeyword('')
        clearHighlights()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSearch, clearHighlights])

  // Listen to selection changes to show Add-to-Chat button
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection()
      if (sel && sel.toString().trim().length > 0) {
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setSelectionText(sel.toString())
        setSelectionPos({ x: rect.right, y: rect.bottom })
      } else {
        setSelectionPos(null)
      }
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [])

  const performSearch = async (keyword: string) => {
    if (!pdfDoc || !keyword.trim()) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    const newResults: { pageIndex: number; snippet: string }[] = []
    const regex = new RegExp(keyword, 'gi')
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i)
      const textContent = await page.getTextContent()
      const text = (textContent.items as any[]).map((it) => it.str).join(' ')
      let match
      while ((match = regex.exec(text)) !== null) {
        const start = Math.max(0, match.index - 30)
        const snippet = text.substr(start, keyword.length + 60).replace(/\s+/g, ' ')
        newResults.push({ pageIndex: i - 1, snippet })
      }
    }
    setSearchResults(newResults)
    setTotalMatches(newResults.length)
    setIsSearching(false)
  }

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword)
    setCurrentMatchIndex(0)
    if (keyword.trim()) {
      highlight([keyword])
      performSearch(keyword)
    } else {
      clearHighlights()
      setSearchResults([])
      setTotalMatches(0)
    }
  }

  // Enhanced page navigation - cleaned up but keeping working logic
  const jumpToPageNumber = (pageIndex: number) => {
    setCurrentPage(pageIndex)

    // Fallback: Direct DOM manipulation
    const pageSelectors = [
      '.rpv-core__page-layer',
      '[data-page-number]',
      '.rpv-page',
      '.page'
    ]

    let pages: NodeListOf<Element> | null = null

    for (const selector of pageSelectors) {
      const foundPages = document.querySelectorAll(selector)
      if (foundPages.length > 0) {
        pages = foundPages
        break
      }
    }

    if (pages && pages.length > pageIndex && pageIndex >= 0) {
      const targetPage = pages[pageIndex] as HTMLElement
      const scrollContainer = containerRef.current?.parentElement

      if (scrollContainer && targetPage) {
        const containerRect = scrollContainer.getBoundingClientRect()
        const pageRect = targetPage.getBoundingClientRect()

        const currentScroll = scrollContainer.scrollTop
        const targetScroll = currentScroll + pageRect.top - containerRect.top - 20

        // Force immediate scroll first, then smooth scroll
        scrollContainer.scrollTop = targetScroll
        scrollContainer.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        })
      }
    }
  }

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage)
    if (pageNum >= 1 && pageNum <= totalPages) {
      jumpToPageNumber(pageNum - 1)
      setJumpToPage('')
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      jumpToPageNumber(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      jumpToPageNumber(currentPage - 1)
    }
  }

  // Handle zoom with wheel events - smooth implementation
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()

      // Calculate zoom origin based on mouse position
      const container = containerRef.current
      if (container) {
        const rect = container.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setZoomOrigin({ x: `${x}%`, y: `${y}%` })
      }

      // Calculate zoom delta based on wheel movement with smooth acceleration
      const sensitivity = 0.002 // Adjust this for zoom sensitivity
      const delta = -e.deltaY * sensitivity
      const currentVisualScale = visualScale
      const zoomFactor = Math.exp(delta) // Exponential zoom for smoother feel
      const newVisualScale = Math.max(0.5, Math.min(3.0, currentVisualScale * zoomFactor))

      // Apply immediate visual zoom using CSS transform
      setVisualScale(newVisualScale)
      setIsZooming(true)

      // Clear any existing timeout
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current)
      }

      // Debounce the actual PDF scale update
      zoomTimeoutRef.current = setTimeout(() => {
        setScale(newVisualScale)
        if (zoomTo) {
          zoomTo(newVisualScale)
        }
        setIsZooming(false)
        // Reset zoom origin after zoom completes
        setZoomOrigin({ x: '50%', y: '50%' })
      }, 150) // Reduced from 300ms for more responsive feel
    }
  }, [visualScale, zoomTo])

  // Sync visual scale with actual scale when not zooming
  useEffect(() => {
    if (!isZooming) {
      setVisualScale(scale)
    }
  }, [scale, isZooming])

  // Cleanup zoom timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current)
      }
    }
  }, [])

  // Add wheel event listener for zoom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Handle pinch gestures on touchpad/touchscreen
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let initialDistance = 0
    let initialScale = 1

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )
        initialScale = visualScale

        // Calculate center point for zoom origin
        const centerX = (touch1.clientX + touch2.clientX) / 2
        const centerY = (touch1.clientY + touch2.clientY) / 2
        const rect = container.getBoundingClientRect()
        const x = ((centerX - rect.left) / rect.width) * 100
        const y = ((centerY - rect.top) / rect.height) * 100
        setZoomOrigin({ x: `${x}%`, y: `${y}%` })
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()

        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )

        const scaleFactor = currentDistance / initialDistance
        const newScale = Math.max(0.5, Math.min(3.0, initialScale * scaleFactor))

        setVisualScale(newScale)
        setIsZooming(true)

        // Clear and set new timeout
        if (zoomTimeoutRef.current) {
          clearTimeout(zoomTimeoutRef.current)
        }

        zoomTimeoutRef.current = setTimeout(() => {
          setScale(newScale)
          if (zoomTo) {
            zoomTo(newScale)
          }
          setIsZooming(false)
          setZoomOrigin({ x: '50%', y: '50%' })
        }, 150)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
    }
  }, [visualScale, zoomTo])

  // Handle gesture events (Safari and some other browsers)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let initialScale = 1

    const handleGestureStart = (e: any) => {
      e.preventDefault()
      initialScale = visualScale
    }

    const handleGestureChange = (e: any) => {
      e.preventDefault()

      const newScale = Math.max(0.5, Math.min(3.0, initialScale * e.scale))

      setVisualScale(newScale)
      setIsZooming(true)

      // Clear and set new timeout
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current)
      }

      zoomTimeoutRef.current = setTimeout(() => {
        setScale(newScale)
        if (zoomTo) {
          zoomTo(newScale)
        }
        setIsZooming(false)
      }, 150)
    }

    const handleGestureEnd = (e: any) => {
      e.preventDefault()
    }

    // Add gesture event listeners if supported
    if ('GestureEvent' in window) {
      container.addEventListener('gesturestart', handleGestureStart, { passive: false })
      container.addEventListener('gesturechange', handleGestureChange, { passive: false })
      container.addEventListener('gestureend', handleGestureEnd, { passive: false })

      return () => {
        container.removeEventListener('gesturestart', handleGestureStart)
        container.removeEventListener('gesturechange', handleGestureChange)
        container.removeEventListener('gestureend', handleGestureEnd)
      }
    }
  }, [visualScale, zoomTo])

  // Handle zoom
  const handleZoomIn = () => {
    const newScale = Math.min(visualScale * 1.2, 3.0)
    setVisualScale(newScale)
    setScale(newScale)
    if (zoomTo) {
      zoomTo(newScale)
    }
  }

  const handleZoomOut = () => {
    const newScale = Math.max(visualScale / 1.2, 0.5)
    setVisualScale(newScale)
    setScale(newScale)
    if (zoomTo) {
      zoomTo(newScale)
    }
  }

  const handleFitToPage = () => {
    setVisualScale(1.0)
    setScale(1.0)
    if (zoomTo) {
      zoomTo(1.0)
    }
  }

  // Search navigation
  const handleNextMatch = () => {
    if (totalMatches > 0) {
      jumpToNextMatch()
      setCurrentMatchIndex((prev) => (prev + 1) % totalMatches)
    }
  }

  const handlePreviousMatch = () => {
    if (totalMatches > 0) {
      jumpToPreviousMatch()
      setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches)
    }
  }

  const retryLoad = () => {
    setError(null)
    setIsLoading(true)

    const currentUrl = documentUrl
    setProcessedUrl(null)

    setTimeout(async () => {
      if (currentUrl) {
        try {
          const url = await processPdfUrl(currentUrl)
          setProcessedUrl(url)
        } catch (error) {
          console.error('Retry failed:', error)
          setError(error instanceof Error ? error.message : 'Failed to load PDF')
        } finally {
          setIsLoading(false)
        }
      }
    }, 100)
  }

  const testPdfUrl = () => {
    if (processedUrl) {
      console.log('Testing PDF URL:', processedUrl)
      window.open(processedUrl, '_blank')
    }
  }

  // Handle resizing of chat drawer
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const delta = startX - e.clientX
      setChatWidth(Math.max(200, Math.min(800, startWidth + delta)))
    }
    const onMouseUp = () => setIsResizing(false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isResizing, startX, startWidth])

  // Handler for sending a message
  const handleQaSend = async (message: string) => {
    if (!documentName) return;
    setQaLoading(true);
    setQaError(null);
    // Prepend external context if present
    let fullMessage = message;
    if (externalContexts.length > 0) {
      fullMessage = externalContexts.join('\n') + '\n' + message;
    }
    setQaUserMessage(fullMessage);
    setQaAssistantMessage(null);
    try {
      const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      const res = await postPaperChat(
        documentUrl || '',
        {
          message: fullMessage,
          sessionId,
          sessionTitle: documentName,
        }
      );
      setQaAssistantMessage(res.response);
      setExternalContexts([]); // Clear after sending
    } catch (e) {
      setQaError('Failed to send message');
    } finally {
      setQaLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-background">
      {/* Compact Header */}
      <div className="flex items-center justify-end h-10 px-2 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowSearch(!showSearch)
              if (!showSearch) {
                setTimeout(() => searchInputRef.current?.focus(), 100)
              }
            }}
            className={cn(
              "h-8 w-8 p-0",
              showSearch ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className={cn(
              "h-8 w-8 p-0",
              showChat ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Bot className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Sidebar */}
      <div className={`absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-40 transform transition-transform duration-300 ease-in-out ${showSearch ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Header with input */}
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <Input
            ref={searchInputRef}
            type="text"
            value={searchKeyword}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowSearch(false)
                setSearchKeyword('')
                clearHighlights()
                setSearchResults([])
              }
            }}
            placeholder="Keyword search"
            className="h-8 text-sm flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowSearch(false)
              setSearchKeyword('')
              clearHighlights()
              setSearchResults([])
            }}
            className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto">
          {isSearching ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Searching...</div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No results</div>
          ) : (
            searchResults.map((res, idx) => (
              <button
                key={`${res.pageIndex}-${idx}`}
                onClick={() => {
                  // 1) Scroll to the page containing the match
                  jumpToPageNumber(res.pageIndex)

                  // 2) Highlight and jump to this specific match
                  highlight([searchKeyword]).then(() => {
                    jumpToMatch(idx + 1) // jumpToMatch is 1-based
                    setCurrentMatchIndex(idx)
                  })
                  // We intentionally keep the search pane open
                }}
                className="w-full text-left px-4 py-2 hover:bg-muted"
              >
                <div className="text-xs text-muted-foreground">Page {res.pageIndex + 1}</div>
                <div
                  className="text-sm truncate"
                  dangerouslySetInnerHTML={{
                    __html: res.snippet.replace(
                      new RegExp(searchKeyword, 'gi'),
                      `<span class='text-primary font-semibold'>${searchKeyword}</span>`
                    )
                  }}
                />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Floating add-to-chat button */}
      {selectionPos && (
        <button
          style={{ top: selectionPos.y + window.scrollY + 8, left: selectionPos.x + window.scrollX + 8 }}
          className="fixed z-50 flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs shadow hover:bg-primary/90"
          onClick={() => {
            // Set selected text for chat context
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0)
              setSelectedTextForChat({
                text: selectionText,
                from: range.startOffset,
                to: range.endOffset,
                pageNumber: currentPage + 1, // Convert 0-based to 1-based
                sectionTitle: undefined // Could be enhanced to detect section
              })
            }
            
            // Clear selection and show chat
            window.getSelection()?.removeAllRanges()
            setSelectionPos(null)
            setShowChat(true)
          }}
        >
          <MessageSquarePlus className="h-3 w-3" /> Add to chat
        </button>
      )}

      {/* Document Viewer */}
      <div
        className={`flex-1 bg-background overflow-auto transition-all ease-in-out ${showSearch ? 'ml-72' : 'ml-0'} relative`}
        style={{
          marginRight: showChat ? `${chatWidth}px` : '0px',
          transitionDuration: isResizing ? '0ms' : '300ms'
        }}
      >
        {/* Extraction Success Message */}
        {showExtractionSuccess && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Paper successfully extracted and ready for chat!</span>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center max-w-md">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load PDF</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={retryLoad}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        ) : processedUrl ? (
          <div
            ref={containerRef}
            className={cn("pdf-viewer-container", isZooming && "zooming")}
            style={{
              touchAction: 'pan-x pan-y pinch-zoom',
              transform: isZooming ? `scale(${visualScale / scale})` : undefined,
              transformOrigin: isZooming ? `${zoomOrigin.x} ${zoomOrigin.y}` : 'center center',
              transition: isZooming ? 'none' : 'transform 0.3s ease-out',
              willChange: isZooming ? 'transform' : 'auto'
            }}
          >
            <Worker workerUrl="/pdfjs/pdf.worker.min.js">
              <Viewer
                fileUrl={processedUrl}
                plugins={[zoomPluginInstance, searchPluginInstance, thumbnailPluginInstance]}
                onDocumentLoad={handleDocumentLoad}
                onPageChange={handlePageChange}
                theme="dark"
                defaultScale={1.0}
                scrollMode={ScrollMode.Vertical}
                renderLoader={(percentages: number) => (
                  isZooming ? <></> : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-sm text-muted-foreground">Loading PDF... {Math.round(percentages)}%</p>
                      </div>
                    </div>
                  )
                )}
              />
            </Worker>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No document selected</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls - Drawboard style */}
      {processedUrl && !isLoading && !error && (
        <div className="flex items-center h-10 px-4 bg-card border-t border-border pdf-footer-controls">
          {/* Centered Page Navigation */}
          <div className="flex-1 flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage <= 0}
              className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Input
              type="number"
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJumpToPage()
                }
              }}
              className="w-14 h-8 text-center text-xs"
              placeholder={(currentPage + 1).toString()}
              min="1"
              max={totalPages.toString()}
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
              className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom Controls - aligned right with separators */}
          <div className="ml-auto flex items-center gap-2">
            <div className="border-l border-border h-6 mx-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleFitToPage}
              className="h-8 px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {Math.round(visualScale * 100)}%
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <div className="border-l border-border h-6 mx-2" />

            {/* View all pages / Thumbnail grid button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThumbnails(true)}
              className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Chat Drawer */}
      <div
        className={`absolute right-0 top-0 bottom-0 bg-card border-l border-border z-40 transform transition-all ease-in-out ${showChat ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          width: `${chatWidth}px`,
          transitionDuration: isResizing ? '0ms' : '300ms'
        }}
      >
        {/* Resizer Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-border"
          onMouseDown={(e) => { setIsResizing(true); setStartX(e.clientX); setStartWidth(chatWidth) }}
        />

        {/* Chat Interface */}
        <ChatContainer 
          onClose={() => setShowChat(false)} 
          externalContexts={externalContexts} 
          onExternalContextsCleared={() => setExternalContexts([])} 
          paperId={paperId}
          isExtracted={isExtracted}
          isExtracting={isExtracting}
          extractionStatus={extractionStatus}
          extractionError={extractionError}
          selectedText={selectedTextForChat}
          onClearSelectedText={() => setSelectedTextForChat(null)}
        />
      </div>

      {/* Add thumbnail overlay */}
      {showThumbnails && <ThumbnailOverlay />}
    </div>
  )
}
