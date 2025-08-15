"use client"

import { useState, useCallback } from "react"
import { websearchApi } from "@/lib/api/project-service"
import type { WebSearchRequest, WebSearchResponse, Paper } from "@/types/websearch"

interface UseWebSearchState {
    isSearching: boolean
    progress: number
    currentStep: string
    papers: Paper[]
    error: string | null
    correlationId: string | null
}

interface UseWebSearchActions {
    startSearch: (searchRequest: WebSearchRequest) => Promise<void>
    resetSearch: () => void
}

export function useWebSearch(): UseWebSearchState & UseWebSearchActions {
    const [state, setState] = useState<UseWebSearchState>({
        isSearching: false,
        progress: 0,
        currentStep: "",
        papers: [],
        error: null,
        correlationId: null
    })

    const updateProgress = useCallback((progress: number, step: string) => {
        setState(prev => ({
            ...prev,
            progress,
            currentStep: step
        }))
    }, [])

    const startSearch = useCallback(async (searchRequest: WebSearchRequest) => {
        setState({
            isSearching: true,
            progress: 0,
            currentStep: "Initiating search agent...",
            papers: [],
            error: null,
            correlationId: null
        })

        try {
            // Enhanced loading messages with more variety
            const loadingMessages = [
                "Initializing search agent...",
                "Authenticating with academic databases...",
                "Sending request to ArXiv API...",
                "Connecting to Semantic Scholar...",
                "Scanning research repositories...",
                "Processing query parameters...",
                "Filtering relevant papers...",
                "Cross-referencing citations...",
                "Analyzing paper metadata...",
                "Enriching with author information...",
                "Validating paper quality...",
                "Organizing search results...",
                "Finalizing paper collection...",
                "Search completed successfully!"
            ]

            // Realistic progress simulation
            const simulateRealisticProgress = () => {
                let currentProgress = 0
                let messageIndex = 0

                const progressInterval = setInterval(() => {
                    if (currentProgress >= 100) {
                        clearInterval(progressInterval)
                        return
                    }

                    // Vary the speed of progress to feel realistic
                    let increment
                    if (currentProgress < 15) {
                        increment = Math.random() * 5 + 2 // Start fast: 2-7%
                    } else if (currentProgress < 40) {
                        increment = Math.random() * 4 + 1 // Slow down: 1-5%
                    } else if (currentProgress < 70) {
                        increment = Math.random() * 3 + 2 // Steady: 2-5%
                    } else if (currentProgress < 90) {
                        increment = Math.random() * 2 + 1 // Slower: 1-3%
                    } else {
                        increment = Math.random() * 1 + 0.5 // Very slow: 0.5-1.5%
                    }

                    currentProgress = Math.min(currentProgress + increment, 99)

                    // Update message based on progress
                    const expectedMessageIndex = Math.floor((currentProgress / 100) * (loadingMessages.length - 1))
                    if (expectedMessageIndex > messageIndex) {
                        messageIndex = expectedMessageIndex
                    }

                    updateProgress(currentProgress, loadingMessages[messageIndex])
                }, Math.random() * 500 + 300) // Random interval between 300-800ms

                return progressInterval
            }

            const progressInterval = simulateRealisticProgress()

            // Step 1: Initiate search
            const { correlationId } = await websearchApi.initiateWebSearch(searchRequest)
            setState(prev => ({ ...prev, correlationId }))

            // Step 2: Poll for results
            const onProgress = (attempt: number, status: string) => {
                // Let the realistic progress simulation handle the updates
                // This just ensures we reach 100% when complete
                if (status === 'COMPLETED') {
                    clearInterval(progressInterval)
                    updateProgress(100, "Search completed successfully!")
                }
            }

            const result = await websearchApi.pollUntilComplete(correlationId, { onProgress })

            // Ensure compatibility: map `abstract` field (from API) to `abstractText` used in UI
            const processedPapers: Paper[] = result.papers.map((p: any) => ({
                ...p,
                abstractText: p.abstractText ?? p.abstract ?? null,
            }))

            // Clear interval and finalize
            clearInterval(progressInterval)
            updateProgress(100, "Search completed successfully!")

            // Small delay before showing results for smoother UX
            setTimeout(() => {
                setState(prev => ({
                    ...prev,
                    isSearching: false,
                    papers: processedPapers,
                    progress: 100
                }))
            }, 500)

        } catch (error) {
            console.error("Web search error:", error)
            setState(prev => ({
                ...prev,
                isSearching: false,
                error: error instanceof Error ? error.message : "Search failed",
                progress: 0
            }))
        }
    }, [updateProgress])

    const resetSearch = useCallback(() => {
        setState({
            isSearching: false,
            progress: 0,
            currentStep: "",
            papers: [],
            error: null,
            correlationId: null
        })
    }, [])

    return {
        ...state,
        startSearch,
        resetSearch
    }
} 