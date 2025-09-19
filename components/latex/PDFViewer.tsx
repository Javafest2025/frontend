import React, { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

// Set up the worker - use local worker for version 4.8.69 compatibility
if (typeof window !== 'undefined') {
  // Use the correct worker file extension for PDF.js v4+
  if (pdfjs.version.startsWith('4.')) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
  } else {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js'
  }
}

interface PDFViewerProps {
  fileUrl: string
  className?: string
  // Optional hooks used by callers; currently no text selection extraction implemented
  onSelectionToChat?: (text: string) => void
  initialPage?: number
  initialZoom?: number
  initialRotation?: number
  // Search state callback passthrough
  onSearchStateChange?: (searchState: any) => void
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, className, initialPage, initialZoom, initialRotation, onSelectionToChat, onSearchStateChange }) => {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(initialPage ?? 1)
  const [containerWidth, setContainerWidth] = useState(0)
  const [scale, setScale] = useState(initialZoom ?? 1.0)
  const [rotation, setRotation] = useState(initialRotation ?? 0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Set the container width on initial render and on resize
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (entry) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  // Reset states when fileUrl changes
  useEffect(() => {
    console.log('PDFViewer: fileUrl changed to:', fileUrl)
    setLoading(true)
    setError(null)
    setNumPages(null)
    setPageNumber(1)
  }, [fileUrl])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF loaded successfully with', numPages, 'pages')
    setNumPages(numPages)
    setPageNumber(initialPage ?? 1)
    setLoading(false)
    setError(null)
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error)
    console.error('PDF load error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      fileUrl: fileUrl
    })
    setError(error.message)
    setLoading(false)
  }

  const goToPrevPage = () => {
    setPageNumber(prevPage => Math.max(prevPage - 1, 1))
  }

  const goToNextPage = () => {
    setPageNumber(prevPage => Math.min(prevPage + 1, numPages || 1))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5))
  }

  const resetZoom = () => {
    setScale(1.0)
  }

  const rotateClockwise = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const retryLoad = () => {
    setLoading(true)
    setError(null)
    setNumPages(null)
    setPageNumber(1)
  }

  return (
    <div ref={containerRef} className={cn("w-full h-full flex flex-col max-h-screen overflow-hidden", className)}>
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium min-w-[80px] text-center">
            {pageNumber} / {numPages || '?'}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetZoom}
            className="h-8 px-2 text-xs"
          >
            Reset
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={rotateClockwise}
            className="h-8 w-8 p-0"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {error && (
            <Button
              variant="outline"
              size="sm"
              onClick={retryLoad}
              className="h-8 px-3 text-xs"
            >
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div 
        className="flex-1 min-h-0 h-full bg-gray-50 dark:bg-gray-900 relative overflow-auto"
        data-pdf-scroll-container="true"
      >
        {containerWidth > 0 && (
          <div className="flex flex-col items-center py-4 space-y-4 min-h-full w-full">
            <Document 
              file={fileUrl} 
              onLoadStart={() => console.log('PDF loading started')}
              onLoadProgress={({ loaded, total }) => console.log('PDF loading progress:', loaded, '/', total)}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading PDF...</p>
                  </div>
                </div>
              }
              error={
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-sm text-destructive">Failed to load PDF</p>
                    <p className="text-xs text-muted-foreground mt-1">Please check the console for details</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryLoad}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              }
            >
              {numPages && Array.from(new Array(numPages), (el, index) => (
                <div key={`page_${index + 1}`} className="mb-4 shadow-lg">
                  <Page 
                    pageNumber={index + 1} 
                    width={containerWidth * 0.8 * scale}
                    rotate={rotation}
                    loading={
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Rendering page {index + 1}...</p>
                        </div>
                      </div>
                    }
                    error={
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <p className="text-sm text-destructive">Failed to render page {index + 1}</p>
                        </div>
                      </div>
                    }
                  />
                </div>
              ))}
            </Document>
          </div>
        )}
      </div>
    </div>
  )
}

export default PDFViewer
