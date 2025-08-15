import { getMicroserviceUrl } from "@/lib/config/api-config"
import { authenticatedFetch } from "@/lib/api/user-service/auth"
import type { WebSearchRequest, WebSearchResponse } from "@/types/websearch"
import type { APIResponse } from "@/types/project"

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

export const websearchApi = {
    // Initiate web search
    async initiateWebSearch(searchRequest: WebSearchRequest): Promise<{ correlationId: string }> {
        try {
            console.log("🔍 Initiating web search:", searchRequest)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", "/api/v1/websearch"),
                {
                    method: "POST",
                    body: JSON.stringify(searchRequest),
                }
            )

            console.log("📊 Web search initiation response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Web search initiation failed:", response.status, errorText)
                throw new Error(`Failed to initiate web search: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Web search initiated successfully:", data)
            return { correlationId: data.data.correlationId }
        } catch (error) {
            console.error("Web search initiation error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to initiate web search")
        }
    },

    // Poll search results
    async pollSearchResults(correlationId: string): Promise<WebSearchResponse> {
        try {
            console.log("🔍 Polling search results for correlation ID:", correlationId)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/websearch/${correlationId}`)
            )

            console.log("📊 Poll search results response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Poll search results failed:", response.status, errorText)
                throw new Error(`Failed to get search results: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Search results retrieved successfully:", data)
            return data.data
        } catch (error) {
            console.error("Search results polling error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to get search results")
        }
    },

    // Poll until complete
    async pollUntilComplete(
        correlationId: string,
        {
            onProgress,
            pollingIntervalMs = 2000,
            timeoutMs,
        }: {
            onProgress?: (attempt: number, status: string) => void;
            /** Wait time between polls. Defaults to 2 seconds */
            pollingIntervalMs?: number;
            /** Abort search after this many milliseconds. Pass `undefined` or `0` for no timeout (infinite). */
            timeoutMs?: number;
        } = {}
    ): Promise<WebSearchResponse> {
        const startTime = Date.now();
        let attempt = 0;

        while (true) {
            attempt += 1;

            const result = await this.pollSearchResults(correlationId);

            onProgress?.(attempt, result.status);

            if (result.status === "COMPLETED") {
                return result;
            } else if (result.status === "FAILED") {
                throw new Error(`Search failed: ${result.message}`);
            }

            // If a timeout was provided and we've exceeded it, abort.
            if (timeoutMs && timeoutMs > 0 && Date.now() - startTime > timeoutMs) {
                throw new Error("Search timeout - taking too long");
            }

            await new Promise((resolve) => setTimeout(resolve, pollingIntervalMs));
        }
    },

    // Get all search history
    async getAllSearchHistory(): Promise<WebSearchResponse[]> {
        try {
            console.log("🔍 Fetching all search history")
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", "/api/v1/websearch")
            )

            console.log("📊 Get all search history response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Get all search history failed:", response.status, errorText)
                throw new Error(`Failed to get search history: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Search history retrieved successfully:", data)
            return data.data
        } catch (error) {
            console.error("Search history error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to get search history")
        }
    },

    // Check web search health
    async checkWebSearchHealth(): Promise<boolean> {
        try {
            console.log("🔍 Checking web search health")
            const response = await fetch(getMicroserviceUrl("project-service", "/api/v1/websearch/health"))

            if (!response.ok) {
                console.error("❌ Web search health check failed:", response.status)
                return false
            }

            const result = await response.json()
            console.log("✅ Web search health check result:", result)
            return result.data?.status === "UP"
        } catch (error) {
            console.error("Web search health check error:", error)
            return false
        }
    }
}
