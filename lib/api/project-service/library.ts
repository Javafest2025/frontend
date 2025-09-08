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

            // Process papers to handle abstract field mapping
            if (data.data?.papers && Array.isArray(data.data.papers)) {
                data.data.papers = data.data.papers.map((p: any) => ({
                    ...p,
                    abstractText: p.abstractText ?? p.abstract ?? null,
                }))
            }

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

            // Process papers to handle abstract field mapping
            if (data.data && Array.isArray(data.data)) {
                data.data = data.data.map((p: any) => ({
                    ...p,
                    abstractText: p.abstractText ?? p.abstract ?? null,
                }))
            }

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
    },

    // AI Abstract Analysis Methods
    async analyzeAbstractHighlights(abstractText: string): Promise<AbstractHighlightDto> {
        try {
            console.log("🔍 Analyzing abstract highlights for text length:", abstractText.length)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/ai/abstract/highlights`),
                {
                    method: "POST",
                    body: JSON.stringify({ abstractText }),
                }
            )

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Abstract highlights analysis failed:", response.status, errorText)
                throw new Error(`Failed to analyze abstract highlights: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Abstract highlights analyzed successfully:", data)
            return data.data
        } catch (error) {
            console.error("Abstract highlights analysis error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to analyze abstract highlights")
        }
    },

    async analyzeAbstractInsights(abstractText: string): Promise<AbstractAnalysisDto> {
        try {
            console.log("🧠 Analyzing abstract insights for text length:", abstractText.length)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/ai/abstract/insights`),
                {
                    method: "POST",
                    body: JSON.stringify({ abstractText }),
                }
            )

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Abstract insights analysis failed:", response.status, errorText)
                throw new Error(`Failed to analyze abstract insights: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Abstract insights analyzed successfully:", data)
            return data.data
        } catch (error) {
            console.error("Abstract insights analysis error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to analyze abstract insights")
        }
    },

    async analyzeAbstractComplete(abstractText: string): Promise<CompleteAnalysisResponse> {
        try {
            console.log("📊 Performing complete abstract analysis for text length:", abstractText.length)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/ai/abstract/analyze`),
                {
                    method: "POST",
                    body: JSON.stringify({ abstractText }),
                }
            )

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Complete abstract analysis failed:", response.status, errorText)
                throw new Error(`Failed to perform complete abstract analysis: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Complete abstract analysis performed successfully:", data)
            return data.data
        } catch (error) {
            console.error("Complete abstract analysis error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to perform complete abstract analysis")
        }
    },

    async analyzePaperAbstract(paperId: string, abstractText: string): Promise<CompleteAnalysisResponse> {
        try {
            console.log("📊 Analyzing paper abstract for paper:", paperId, "text length:", abstractText.length)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/ai/abstract/paper/${paperId}/analyze`),
                {
                    method: "POST",
                    body: JSON.stringify({ abstractText }),
                }
            )

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Paper abstract analysis failed:", response.status, errorText)
                throw new Error(`Failed to analyze paper abstract: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Paper abstract analysis completed successfully:", data)
            return data.data
        } catch (error) {
            console.error("Paper abstract analysis error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to analyze paper abstract")
        }
    },

    async reanalyzePaperAbstract(paperId: string, abstractText: string): Promise<CompleteAnalysisResponse> {
        try {
            console.log("🔄 Re-analyzing paper abstract for paper:", paperId, "text length:", abstractText.length)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/ai/abstract/paper/${paperId}/reanalyze`),
                {
                    method: "POST",
                    body: JSON.stringify({ abstractText }),
                }
            )

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Paper abstract re-analysis failed:", response.status, errorText)
                throw new Error(`Failed to re-analyze paper abstract: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Paper abstract re-analyzed successfully:", data)
            return data.data
        } catch (error) {
            console.error("Paper abstract re-analysis error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to re-analyze paper abstract")
        }
    },

    // Paper Favorite Methods
    async togglePaperFavorite(projectId: string, paperId: string, request: {
        notes?: string;
        priority?: string;
        tags?: string;
    }): Promise<boolean> {
        try {
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            console.log("⭐ Toggling paper favorite:", { projectId, paperId, userId: userData.id })
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/papers/favorites/${paperId}/toggle`),
                {
                    method: "POST",
                    headers: {
                        'X-User-ID': userData.id
                    },
                    body: JSON.stringify({
                        paperId,
                        notes: request.notes || '',
                        priority: request.priority || 'medium',
                        tags: request.tags || ''
                    }),
                }
            )

            console.log("📊 Toggle favorite response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Toggle favorite failed:", response.status, errorText)
                throw new Error(`Failed to toggle favorite: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Favorite toggled successfully:", data)
            
            // Return true if paper was added to favorites, false if removed
            return !!data.data
        } catch (error) {
            console.error("Toggle favorite error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to toggle favorite")
        }
    },

    async getPaperFavorites(projectId: string): Promise<any[]> {
        try {
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            console.log("⭐ Getting paper favorites for project:", projectId, "user:", userData.id)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/papers/favorites`),
                {
                    method: "GET",
                    headers: {
                        'X-User-ID': userData.id
                    }
                }
            )

            console.log("📊 Get favorites response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Get favorites failed:", response.status, errorText)
                throw new Error(`Failed to get favorites: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Favorites retrieved successfully:", data)
            return data.data || []
        } catch (error) {
            console.error("Get favorites error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to get favorites")
        }
    },

    async isPaperFavorited(projectId: string, paperId: string): Promise<boolean> {
        try {
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            console.log("⭐ Checking if paper is favorited:", { projectId, paperId, userId: userData.id })
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/papers/favorites/${paperId}/status`),
                {
                    method: "GET",
                    headers: {
                        'X-User-ID': userData.id
                    }
                }
            )

            console.log("📊 Check favorite status response:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Check favorite status failed:", response.status, errorText)
                throw new Error(`Failed to check favorite status: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Favorite status checked successfully:", data)
            return data.data || false
        } catch (error) {
            console.error("Check favorite status error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to check favorite status")
        }
    },

    // LaTeX Context Management
    // Get papers marked as LaTeX context for a project
    async getLatexContextPapers(projectId: string): Promise<Paper[]> {
        try {
            console.log("🔍 Fetching LaTeX context papers for project:", projectId)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/latex/projects/${projectId}/context-papers`),
                {
                    method: "GET"
                }
            )

            console.log("📊 LaTeX context papers response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Get LaTeX context papers failed:", response.status, errorText)
                throw new Error(`Failed to get LaTeX context papers: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ LaTeX context papers retrieved successfully:", data)
            return data.data || []
        } catch (error) {
            console.error("Get LaTeX context papers error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to get LaTeX context papers")
        }
    },

    // Toggle LaTeX context status for a paper
    async toggleLatexContext(paperId: string, isLatexContext: boolean): Promise<Paper> {
        try {
            console.log("🔄 Toggling LaTeX context for paper:", paperId, "to:", isLatexContext)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/latex/papers/${paperId}/context`),
                {
                    method: "PUT",
                    body: JSON.stringify({ isLatexContext }),
                }
            )

            console.log("📊 Toggle LaTeX context response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Toggle LaTeX context failed:", response.status, errorText)
                throw new Error(`Failed to toggle LaTeX context: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ LaTeX context toggled successfully:", data)
            return data.data
        } catch (error) {
            console.error("Toggle LaTeX context error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to toggle LaTeX context")
        }
    }
}

// Types for AI analysis
export interface AbstractHighlightDto {
    highlights: Array<{
        text: string;
        type: 'algorithm' | 'methodology' | 'concept' | 'metric' | 'framework';
        startIndex: number;
        endIndex: number;
    }>;
}

export interface AbstractAnalysisDto {
    focus: string;
    approach: string;
    emphasis: string;
    methodology: string;
    impact: string;
    challenges: string;
}

export interface CompleteAnalysisResponse {
    highlights: AbstractHighlightDto;
    insights: AbstractAnalysisDto;
}
