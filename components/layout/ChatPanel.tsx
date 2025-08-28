"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import {
  X,
  Sparkles,
  MessageSquare,
  Clock,
  Construction,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"

type Props = {
  isOpen: boolean
  onClose: () => void
  paperId?: string
  isMobile?: boolean
}

export function ChatPanel({ isOpen, onClose, paperId, isMobile }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(320)
  const [isDragging, setIsDragging] = useState(false)

  // Handle mouse dragging for resizing (only on desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isMobile) return

      // Calculate new width based on mouse position
      const newWidth = Math.max(320, Math.min(800, window.innerWidth - e.clientX))
      setWidth(newWidth)

      if (panelRef.current) {
        document.body.style.cursor = "ew-resize"
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ""
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
    }
  }, [isDragging, isMobile])

  if (!isOpen) return null

  // Mobile full-screen layout
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-primary to-purple-600 rounded-md">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-semibold text-foreground text-sm">
              AI Chat
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-md"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-2xl mb-4 border border-primary/20">
            <Construction className="h-8 w-8 text-primary" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground mb-2">
            AI Chat Coming Soon
          </h3>

          {/* Description */}
          <p className="text-muted-foreground text-sm mb-6 max-w-sm leading-relaxed">
            We're working hard to bring you an intelligent AI chat interface that will help you analyze research papers, answer questions, and provide insights.
          </p>

          {/* Features Preview - Simplified for mobile */}
          <div className="space-y-3 w-full max-w-sm mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Smart Conversations</p>
                <p className="text-xs text-muted-foreground">Ask questions about your research papers</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-500/10 rounded-lg">
                <Zap className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Instant Insights</p>
                <p className="text-xs text-muted-foreground">Get quick summaries and key findings</p>
              </div>
            </div>
          </div>

          {/* Notification Button */}
          <Button
            variant="outline"
            className="w-full border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary"
            onClick={() => {
              // Could add notification signup functionality here
              console.log("Notify me when available")
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Notify me when available
          </Button>
        </div>
      </div>
    )
  }

  // Desktop side panel layout
  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-background border-l border-border shadow-2xl transition-all duration-300 ease-in-out"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-primary to-purple-600 rounded-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h2 className="font-semibold text-foreground text-sm">
            AI Chat
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-md"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {/* Icon */}
        <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-2xl mb-6 border border-primary/20">
          <Construction className="h-10 w-10 text-primary" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-foreground mb-3">
          AI Chat Coming Soon
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">
          We're working hard to bring you an intelligent AI chat interface that will help you analyze research papers, answer questions, and provide insights.
        </p>

        {/* Features Preview */}
        <div className="space-y-3 w-full max-w-xs mb-8">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Smart Conversations</p>
              <p className="text-xs text-muted-foreground">Ask questions about your research papers</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-500/10 rounded-lg">
              <Zap className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Instant Insights</p>
              <p className="text-xs text-muted-foreground">Get quick summaries and key findings</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
            <div className="flex items-center justify-center w-8 h-8 bg-cyan-500/10 rounded-lg">
              <Clock className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Chat History</p>
              <p className="text-xs text-muted-foreground">Save and revisit your conversations</p>
            </div>
          </div>
        </div>

        {/* Notification Button */}
        <Button
          variant="outline"
          className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary"
          onClick={() => {
            // Could add notification signup functionality here
            console.log("Notify me when available")
          }}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Notify me when available
        </Button>
      </div>
    </div>
  )
}
