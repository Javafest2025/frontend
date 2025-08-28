"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Download,
  Plus,
  Minus,
  RotateCw,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  documentUrl?: string
  documentName?: string
}

export function LaTeXPDFViewer({ documentUrl, documentName = "LaTeX Document" }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Load PDF
  useEffect(() => {
    if (!documentUrl) {
      setError('No document URL provided')
      return
    }

    setIsLoading(true)
    setError(null)
    
    // Reset scale and rotation
    setScale(1.0)
    setRotation(0)
    
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [documentUrl])

  // Handle download
  const handleDownload = () => {
    if (!documentUrl) return

    try {
      const link = document.createElement('a')
      link.href = documentUrl
      link.download = `${documentName}.pdf`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download failed:', error)
      setError('Failed to download PDF')
    }
  }

  // Zoom controls
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleFitToPage = () => {
    setScale(1.0)
  }

  // Rotation
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  // Retry loading
  const retryLoad = () => {
    if (documentUrl) {
      setIsLoading(true)
      setError(null)
      setTimeout(() => {
        setIsLoading(false)
      }, 1000)
    }
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Minimal Floating Controls - Only when needed */}
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-1 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-1 opacity-0 hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
          className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <Minus className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleFitToPage}
          className="h-7 px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {Math.round(scale * 100)}%
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={scale >= 3.0}
          className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRotate}
          className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <RotateCw className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>

      {/* Document Viewer - True Full Screen */}
      <div className="w-full h-full relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4">
                <RefreshCw className="h-8 w-8" />
              </div>
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center max-w-md">
              <div className="h-12 w-12 text-destructive mx-auto mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Failed to Load PDF</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={retryLoad}>
                Retry
              </Button>
            </div>
          </div>
        ) : documentUrl ? (
          <div className="w-full h-full">
            <iframe
              ref={iframeRef}
              src={documentUrl}
              className="w-full h-full border-0"
              style={{
                border: 'none',
                margin: '0',
                padding: '0',
                display: 'block'
              }}
              title={`PDF Preview - ${documentName}`}
              onLoad={() => {
                setIsLoading(false)
                setError(null)
              }}
              onError={() => {
                setError('Failed to load PDF')
                setIsLoading(false)
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No document selected</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
