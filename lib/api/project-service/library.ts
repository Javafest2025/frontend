import { getMicroserviceUrl } from "@/lib/config/api-config"
import { authenticatedFetch } from "@/lib/api/user-service/auth"
import type { Paper } from "@/types/websearch"
import type { APIResponse } from "@/types/project"

// Types for library operations
export interface LibraryRequest {
    userId: string;
    projectId: string;
}

export interface LibraryStats {
    projectId: string;
    correlationIds: string[];
    totalPapers: number;
    completedSearchOperations: number;
    retrievedAt: string;
    message: string;
}

export interface LibraryResponse {
    projectId: string;
    correlationIds: string[];
    totalPapers: number;
    completedSearchOperations: number;
    retrievedAt: string;
    message: string;
    papers: Paper[];
}

export interface UploadedPaperRequest {
    projectId: string;
    title: string;
    abstractText?: string;
    authors?: Array<{
        name: string;
        authorId?: string | null;
        orcid?: string | null;
        affiliation?: string | null;
    }>;
    publicationDate?: string;
    doi?: string | null;
    semanticScholarId?: string | null;
    externalIds?: Record<string, any>;
    source: string;
    pdfContentUrl: string;
    pdfUrl?: string | null;
    isOpenAccess?: boolean;
    paperUrl?: string | null;
    venueName?: string | null;
    publisher?: string | null;
    publicationTypes?: string[];
    volume?: string | null;
    issue?: string | null;
    pages?: string | null;
    citationCount?: number | null;
    referenceCount?: number | null;
    influentialCitationCount?: number | null;
    fieldsOfStudy?: string[];
    uploadedAt?: string;
    fileSize?: number;
    fileName?: string;
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

export const libraryApi = {
    // Get project library
    async getProjectLibrary(projectId: string): Promise<LibraryResponse> {
        try {
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            console.log("🔍 Fetching project library:", projectId, "for user:", userData.id)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/library/project/${projectId}`),
                {
                    method: "POST",
                    body: JSON.stringify({ userId: userData.id, projectId }),
                }
            )

            console.log("📊 Get project library response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Get project library failed:", response.status, errorText)
                throw new Error(`Failed to get project library: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Project library retrieved successfully:", data)
            return data.data
        } catch (error) {
            console.error("Get project library error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to get project library")
        }
    },

    // Upload paper to project library
    async uploadPaper(projectId: string, paperData: UploadedPaperRequest): Promise<Paper> {
        try {
            console.log("🔍 Uploading paper to project:", projectId, paperData)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/library/project/${projectId}/papers`),
                {
                    method: "POST",
                    body: JSON.stringify(paperData),
                }
            )

            console.log("📊 Upload paper response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Upload paper failed:", response.status, errorText)
                throw new Error(`Failed to upload paper: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Paper uploaded successfully:", data)
            return data.data
        } catch (error) {
            console.error("Upload paper error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to upload paper")
        }
    },

    // Get latest project papers
    async getLatestProjectPapers(projectId: string): Promise<Paper[]> {
        try {
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            console.log("🔍 Fetching latest project papers:", projectId, "for user:", userData.id)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/library/project/${projectId}/latest`),
                {
                    method: "POST",
                    body: JSON.stringify({ userId: userData.id, projectId }),
                }
            )

            console.log("📊 Get latest project papers response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Get latest project papers failed:", response.status, errorText)
                throw new Error(`Failed to get latest project papers: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Latest project papers retrieved successfully:", data)
            return data.data
        } catch (error) {
            console.error("Get latest project papers error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to get latest project papers")
        }
    },

    // Get project library statistics
    async getProjectLibraryStats(projectId: string): Promise<LibraryStats> {
        try {
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            console.log("🔍 Fetching project library stats:", projectId, "for user:", userData.id)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/library/project/${projectId}/stats`),
                {
                    method: "POST",
                    body: JSON.stringify({ userId: userData.id, projectId }),
                }
            )

            console.log("📊 Get project library stats response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Get project library stats failed:", response.status, errorText)
                throw new Error(`Failed to get project library stats: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Project library stats retrieved successfully:", data)
            return data.data
        } catch (error) {
            console.error("Get project library stats error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to get project library stats")
        }
    }
}
