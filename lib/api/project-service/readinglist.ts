import { getMicroserviceUrl } from "@/lib/config/api-config"
import { authenticatedFetch } from "@/lib/api/user-service/auth"
import { APIResponse } from "@/types/project"

// Types for Reading List API
export interface ReadingListItem {
    id: string
    paperId: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    addedAt: string
    startedAt?: string
    completedAt?: string
    estimatedTime?: number
    actualTime?: number
    notes?: string
    tags?: string[]
    rating?: number
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
    relevance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    readingProgress: number
    lastReadAt?: string
    readCount: number
    isBookmarked: boolean
    isRecommended: boolean
    recommendedBy?: string
    recommendedReason?: string
    paper?: any // Paper details from library
}

export interface AddReadingListItemRequest {
    paperId: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    estimatedTime?: number
    notes?: string
    tags?: string[]
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
    relevance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface UpdateReadingListItemRequest {
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    estimatedTime?: number
    actualTime?: number
    notes?: string
    tags?: string[]
    rating?: number
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
    relevance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    readingProgress?: number
    isBookmarked?: boolean
}

export interface ReadingListFilters {
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
    relevance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    isBookmarked?: boolean
    isRecommended?: boolean
    search?: string
    sortBy?: 'addedAt' | 'priority' | 'title' | 'rating' | 'difficulty'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
}

export interface ReadingListStats {
    totalItems: number
    pendingItems: number
    inProgressItems: number
    completedItems: number
    skippedItems: number
    totalEstimatedTime: number
    totalActualTime: number
    averageRating: number
    completionRate: number
    averageReadingTime: number
    readingStreak?: number
    topTags?: string[]
    mostReadAuthor?: string
    mostReadVenue?: string
}

export interface ReadingListResponse {
    items: ReadingListItem[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

// Helper function to handle API response
const handleApiResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        // Try to parse error response as JSON, fallback to text
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
            // If JSON parsing fails, try to get text content
            try {
                const textContent = await response.text()
                errorMessage = textContent || errorMessage
            } catch {
                // If all else fails, use the status-based message
            }
        }
        throw new Error(errorMessage)
    }

    // Try to parse the response as JSON
    let apiResponse: APIResponse<T>
    try {
        const jsonData = await response.json()
        apiResponse = jsonData
    } catch (error) {
        throw new Error("Invalid JSON response from server")
    }

    // Check if the API response indicates success (status 200-299)
    if (apiResponse.status < 200 || apiResponse.status >= 300) {
        throw new Error(apiResponse.message || "API request failed")
    }

    return apiResponse.data
}

// Reading List API functions
export const readingListApi = {
    /**
     * Get reading list items for a project with filtering and pagination
     */
    async getReadingList(projectId: string, filters: ReadingListFilters = {}): Promise<ReadingListResponse> {
        const url = new URL(getMicroserviceUrl('project-service', `/api/v1/projects/${projectId}/reading-list`))

        // Add query parameters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value.toString())
            }
        })

        const response = await authenticatedFetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        return handleApiResponse<ReadingListResponse>(response)
    },

    /**
     * Add a paper to the reading list
     */
    async addToReadingList(projectId: string, paperId: string, request: AddReadingListItemRequest): Promise<ReadingListItem> {
        const url = getMicroserviceUrl('project-service', `/api/v1/projects/${projectId}/reading-list`)

        const response = await authenticatedFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paperId,
                ...request
            }),
        })

        return handleApiResponse<ReadingListItem>(response)
    },

    /**
     * Update a reading list item
     */
    async updateReadingListItem(projectId: string, itemId: string, request: UpdateReadingListItemRequest): Promise<ReadingListItem> {
        const url = getMicroserviceUrl('project-service', `/api/v1/projects/${projectId}/reading-list/${itemId}`)

        const response = await authenticatedFetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        })

        return handleApiResponse<ReadingListItem>(response)
    },

    /**
     * Update reading list item status
     */
    async updateReadingListItemStatus(projectId: string, itemId: string, status: string): Promise<ReadingListItem> {
        const url = getMicroserviceUrl('project-service', `/api/v1/projects/${projectId}/reading-list/${itemId}/status`)

        const response = await authenticatedFetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        })

        return handleApiResponse<ReadingListItem>(response)
    },

    /**
     * Update reading progress
     */
    async updateReadingProgress(projectId: string, itemId: string, progress: number): Promise<ReadingListItem> {
        const url = getMicroserviceUrl('project-service', `/api/v1/projects/${projectId}/reading-list/${itemId}/progress`)

        const response = await authenticatedFetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ readingProgress: progress }),
        })

        return handleApiResponse<ReadingListItem>(response)
    },

    /**
     * Delete a reading list item
     */
    async removeFromReadingList(projectId: string, itemId: string): Promise<void> {
        const url = getMicroserviceUrl('project-service', `/api/v1/projects/${projectId}/reading-list/${itemId}`)

        const response = await authenticatedFetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        await handleApiResponse<void>(response)
    },

    /**
     * Toggle bookmark status
     */
    async toggleReadingListItemBookmark(projectId: string, itemId: string): Promise<ReadingListItem> {
        const url = getMicroserviceUrl('project-service', `/api/v1/projects/${projectId}/reading-list/${itemId}/bookmark`)

        const response = await authenticatedFetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        return handleApiResponse<ReadingListItem>(response)
    },

    /**
     * Add or update notes
     */
    async addReadingListNote(projectId: string, itemId: string, note: string): Promise<ReadingListItem> {
        const url = getMicroserviceUrl('project-service', `/api/v1/projects/${projectId}/reading-list/${itemId}/notes`)

        const response = await authenticatedFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ note }),
        })

        return handleApiResponse<ReadingListItem>(response)
    },

    /**
     * Rate a completed reading list item
     */
    async rateReadingListItem(projectId: string, itemId: string, rating: number): Promise<ReadingListItem> {
        const url = getMicroserviceUrl('project-service', `/api/v1/projects/${projectId}/reading-list/${itemId}/rating`)

        const response = await authenticatedFetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rating }),
        })

        return handleApiResponse<ReadingListItem>(response)
    },

    /**
     * Get reading list statistics
     */
    async getReadingListStats(projectId: string, timeRange?: string): Promise<ReadingListStats> {
        const url = new URL(getMicroserviceUrl('project-service', `/api/v1/projects/${projectId}/reading-list/stats`))

        if (timeRange) {
            url.searchParams.append('timeRange', timeRange)
        }

        const response = await authenticatedFetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        return handleApiResponse<ReadingListStats>(response)
    },

    /**
     * Get recommended items
     */
    async getReadingListRecommendations(projectId: string, options: {
        limit?: number
        difficulty?: string
        excludeRead?: boolean
    } = {}): Promise<ReadingListItem[]> {
        const url = new URL(getMicroserviceUrl('project-service', `/api/v1/projects/${projectId}/reading-list/recommendations`))

        // Add query parameters
        Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value.toString())
            }
        })

        const response = await authenticatedFetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        return handleApiResponse<ReadingListItem[]>(response)
    }
}
