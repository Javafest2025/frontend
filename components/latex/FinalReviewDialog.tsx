'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, FileText, Loader2, X } from 'lucide-react'
import { latexApi } from '@/lib/api/latex-service'
import ReactMarkdown from 'react-markdown'

interface FinalReviewDialogProps {
  content: string
}

// Simple hash function to create cache key from content
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString();
}

export function FinalReviewDialog({ content }: FinalReviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [review, setReview] = useState<string>('')
  
  // Typewriter effect states
  const [displayedReview, setDisplayedReview] = useState<string>('')
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Cache to store reviews by content hash
  const cacheRef = useRef<Map<string, string>>(new Map())
  const [currentContentHash, setCurrentContentHash] = useState<string>('')

  // Typewriter effect function
  const typeWriterEffect = useCallback((text: string) => {
    if (!text) return
    
    setIsTyping(true)
    setDisplayedReview('')
    
    let currentIndex = 0
    const typingSpeed = 15 // Faster typing speed
    
    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedReview(text.slice(0, currentIndex + 1))
        currentIndex++
        typingTimeoutRef.current = setTimeout(typeNextChar, typingSpeed)
      } else {
        setIsTyping(false)
      }
    }
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typeNextChar()
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Update content hash when content changes
  useEffect(() => {
    const hash = simpleHash(content.trim())
    setCurrentContentHash(hash)
    
    // Check if we have cached review for this content
    const cachedReview = cacheRef.current.get(hash)
    if (cachedReview) {
      setReview(cachedReview)
      setDisplayedReview('') // Reset displayed review for potential re-typing
    } else {
      setReview('')
      setDisplayedReview('')
    }
  }, [content])

  const handleFinalReview = async () => {
    if (!content.trim()) {
      alert('No content to review')
      return
    }

    const contentHash = simpleHash(content.trim())
    
    // Check cache first
    const cachedReview = cacheRef.current.get(contentHash)
    if (cachedReview) {
      setReview(cachedReview)
      setDisplayedReview(cachedReview) // Show cached content instantly
      setIsTyping(false)
      return
    }

    setIsLoading(true)
    setDisplayedReview('') // Clear displayed content while loading
    try {
      const response = await latexApi.generateFinalReview(content)
      const reviewData = response.data
      
      // Cache the response
      cacheRef.current.set(contentHash, reviewData)
      setReview(reviewData)
      
      // Start typewriter effect only for new content
      typeWriterEffect(reviewData)
    } catch (error) {
      console.error('Final review failed:', error)
      const errorMessage = 'Failed to generate final review. Please try again.'
      setReview(errorMessage)
      setDisplayedReview(errorMessage) // Show error immediately without typing effect
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateReview = async () => {
    if (!content.trim()) {
      alert('No content to review')
      return
    }

    const contentHash = simpleHash(content.trim())
    
    // Clear cached review for this content
    cacheRef.current.delete(contentHash)
    
    setIsLoading(true)
    setDisplayedReview('') // Clear displayed content while loading
    try {
      const response = await latexApi.generateFinalReview(content)
      const reviewData = response.data
      
      // Cache the new response
      cacheRef.current.set(contentHash, reviewData)
      setReview(reviewData)
      
      // Start typewriter effect only for regenerated content (since it's new)
      typeWriterEffect(reviewData)
    } catch (error) {
      console.error('Final review failed:', error)
      const errorMessage = 'Failed to generate final review. Please try again.'
      setReview(errorMessage)
      setDisplayedReview(errorMessage) // Show error immediately without typing effect
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = () => {
    setIsOpen(true)
    
    // Check if we have cached review for current content
    const cachedReview = cacheRef.current.get(currentContentHash)
    if (cachedReview) {
      setReview(cachedReview)
      setDisplayedReview(cachedReview) // Show cached content instantly
      setIsTyping(false)
    } else if (!review) {
      handleFinalReview()
    }
  }

  const closeDialog = () => {
    setIsOpen(false)
    // Don't reset review - keep it cached!
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={openDialog}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Final Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] w-[90vw] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Comprehensive Final Review
          </DialogTitle>
          <DialogDescription>
            AI-powered comprehensive analysis of your LaTeX document covering academic content, writing quality, structure, and technical aspects.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Generating comprehensive review...</p>
                <p className="text-sm text-muted-foreground mt-2">This may take a moment for thorough analysis</p>
              </div>
            </div>
          ) : review ? (
            <div className="h-full overflow-y-auto border rounded-md bg-gray-50 dark:bg-gray-900" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              <div className="p-6 space-y-6">
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {isTyping ? 'Analyzing...' : 'Review Complete'}
                  </Badge>
                  {isTyping && (
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-4 bg-green-600 animate-pulse"></div>
                      <span className="text-xs text-muted-foreground">AI is writing...</span>
                    </div>
                  )}
                </div>
                <div className="prose prose-base max-w-none leading-relaxed text-base space-y-4">
                  <div className="relative">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-5">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-medium mb-2 mt-4">{children}</h3>,
                        p: ({ children }) => <p className="text-base leading-7 mb-4">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                        li: ({ children }) => <li className="text-base leading-6 mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                        code: ({ children }) => <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-700 dark:text-gray-300">{children}</blockquote>
                      }}
                    >
                      {displayedReview}
                    </ReactMarkdown>
                    {isTyping && (
                      <span className="inline-block w-2 h-5 bg-blue-600 animate-pulse ml-1"></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Click "Generate Review" to start the comprehensive analysis</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 flex justify-between mt-4 pt-4 border-t">
          <div className="flex gap-2">
            {!isLoading && review && (
              <Button 
                onClick={handleRegenerateReview}
                variant="outline"
                size="sm"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Regenerate Review
              </Button>
            )}
          </div>
          <Button onClick={closeDialog} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}