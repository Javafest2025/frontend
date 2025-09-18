import { getMicroserviceUrl } from "@/lib/config/api-config"
import { authenticatedFetch } from "@/lib/api/user-service/auth"
import type { APIResponse } from "@/types/project"

// Types for author data
export interface Author {
    name: string;

    // Core information
    primaryAffiliation?: string;
    allAffiliations?: string[];

    // External identifiers
    semanticScholarId?: string;
    orcidId?: string;
    googleScholarId?: string;
    openalexId?: string;

    // Metrics
    citationCount?: number;
    hIndex?: number;
    i10Index?: number;
    paperCount?: number;

    // Publication timeline
    firstPublicationYear?: number;
    lastPublicationYear?: number;

    // Research information
    researchAreas?: string[];
    recentPublications?: any[];

    // Data source tracking
    dataSources?: string[];
    dataQualityScore?: number;
    searchStrategy?: string;
    sourcesAttempted?: string[];
    sourcesSuccessful?: string[];

    // Sync status
    isSynced?: boolean;
    lastSyncAt?: string;
    syncError?: string;

    // Legacy fields for compatibility
    homepageUrl?: string;
    email?: string;
    profileImageUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthorSearchRequest {
    name: string;
    institution?: string;
    fieldOfStudy?: string;
    email?: string;
}

export interface AuthorSyncRequest {
    userId: string;
    name: string;
    strategy?: string;
    forceRefresh?: boolean;
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
    } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError)
        throw new Error("Invalid JSON response from server")
    }

    // Handle different response structures
    if (apiResponse.data !== undefined) {
        // Check if data has an 'items' property (for paginated responses)
        if (apiResponse.data && typeof apiResponse.data === 'object' && 'items' in apiResponse.data) {
            return (apiResponse.data as any).items
        }
        // Return the data directly
        return apiResponse.data
    } else if (Array.isArray(apiResponse)) {
        // Direct array response
        return apiResponse as unknown as T
    } else {
        // If no data property, return the whole response
        return apiResponse as unknown as T
    }
}

export const authorsApi = {
    // Get author by ID
    async getAuthorById(authorId: string): Promise<Author> {
        try {
            console.log("🔍 Fetching author by ID:", authorId)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/authors/${authorId}`)
            )

            console.log("📊 Get author by ID response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Get author by ID failed:", response.status, errorText)
                throw new Error(`Failed to get author: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Author retrieved successfully:", data)
            return data.data
        } catch (error) {
            console.error("Get author by ID error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to get author")
        }
    },

    // Get author by name (using new fetch endpoint)
    async getAuthorByName(name: string): Promise<Author> {
        try {
            console.log("🔍 Fetching author by name:", name)

            // Get user data for the request
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()
            const userId = userData?.id || "anonymous"

            // Create AbortController with extended timeout for author fetching (2 minutes)
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 120000) // 120 seconds

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/authors/fetch/${encodeURIComponent(name)}?strategy=comprehensive&userId=${encodeURIComponent(userId)}`),
                {
                    signal: controller.signal
                }
            )

            clearTimeout(timeoutId)

            console.log("📊 Get author by name response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Get author by name failed:", response.status, errorText)
                throw new Error(`Failed to get author: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Author retrieved successfully:", data)
            return data.data
        } catch (error) {
            console.error("Get author by name error:", error)
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error("Request timed out. Author data fetching is taking longer than expected. Please try again.")
            }
            throw error instanceof Error
                ? error
                : new Error("Failed to get author")
        }
    },

    // Search authors by name pattern
    async searchAuthors(namePattern: string): Promise<Author[]> {
        try {
            console.log("🔍 Searching authors with pattern:", namePattern)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/authors/search?namePattern=${encodeURIComponent(namePattern)}`)
            )

            console.log("📊 Search authors response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Search authors failed:", response.status, errorText)
                throw new Error(`Failed to search authors: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Authors search completed:", data)
            return data.data || []
        } catch (error) {
            console.error("Search authors error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to search authors")
        }
    },

    // Get all authors
    async getAllAuthors(): Promise<Author[]> {
        try {
            console.log("🔍 Fetching all authors")
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", "/api/v1/authors")
            )

            console.log("📊 Get all authors response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Get all authors failed:", response.status, errorText)
                throw new Error(`Failed to get authors: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ All authors retrieved successfully:", data)
            return data.data || []
        } catch (error) {
            console.error("Get all authors error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to get authors")
        }
    },

    // Sync author information from external sources
    async syncAuthor(request: AuthorSyncRequest): Promise<Author> {
        try {
            console.log("🔄 Syncing author:", request)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", "/api/v1/authors/sync"),
                {
                    method: "POST",
                    body: JSON.stringify(request),
                }
            )

            console.log("📊 Sync author response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Sync author failed:", response.status, errorText)
                throw new Error(`Failed to sync author: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Author synced successfully:", data)
            return data.data
        } catch (error) {
            console.error("Sync author error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to sync author")
        }
    },

    // Resync author information from external sources
    async resyncAuthor(name: string, strategy: string = "comprehensive"): Promise<Author> {
        try {
            console.log("🔄 Resyncing author:", name, "with strategy:", strategy)

            // Get user data for the request
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()
            const userId = userData?.id || "anonymous"

            // Create AbortController with extended timeout for author resyncing (2 minutes)
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 120000) // 120 seconds

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/authors/resync/${encodeURIComponent(name)}?strategy=${strategy}&userId=${encodeURIComponent(userId)}`),
                {
                    method: "POST",
                    signal: controller.signal
                }
            )

            clearTimeout(timeoutId)

            console.log("📊 Resync author response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Resync author failed:", response.status, errorText)
                throw new Error(`Failed to resync author: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Author resynced successfully:", data)
            return data.data
        } catch (error) {
            console.error("Resync author error:", error)
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error("Request timed out. Author resyncing is taking longer than expected. Please try again.")
            }
            throw error instanceof Error
                ? error
                : new Error("Failed to resync author")
        }
    },

    // Get stale authors (for background refresh)
    async getStaleAuthors(hours: number = 24): Promise<Author[]> {
        try {
            console.log("🔍 Fetching stale authors (older than", hours, "hours)")
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/authors/stale?hours=${hours}`)
            )

            console.log("📊 Get stale authors response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Get stale authors failed:", response.status, errorText)
                throw new Error(`Failed to get stale authors: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Stale authors retrieved successfully:", data)
            return data.data || []
        } catch (error) {
            console.error("Get stale authors error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to get stale authors")
        }
    }
}
