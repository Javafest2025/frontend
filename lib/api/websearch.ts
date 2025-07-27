import type { WebSearchRequest, WebSearchResponse } from "@/types/websearch";
import type { APIResponse } from "@/types/project";
import { getApiUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "@/lib/api/auth";

/**
 * Web Search API Functions
 */

export const initiateWebSearch = async (
    searchRequest: WebSearchRequest
): Promise<{ correlationId: string }> => {
    try {
        const response = await authenticatedFetch(getApiUrl("/api/v1/websearch"), {
            method: "POST",
            body: JSON.stringify(searchRequest),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to initiate web search");
        }

        const result: APIResponse<WebSearchResponse> = await response.json();
        return { correlationId: result.data.correlationId };
    } catch (error) {
        console.error("Web search initiation error:", error);
        throw error instanceof Error
            ? error
            : new Error("Failed to initiate web search");
    }
};

export const pollSearchResults = async (
    correlationId: string
): Promise<WebSearchResponse> => {
    try {
        const response = await authenticatedFetch(
            getApiUrl(`/api/v1/websearch/${correlationId}`)
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to get search results");
        }

        const result: APIResponse<WebSearchResponse> = await response.json();
        return result.data;
    } catch (error) {
        console.error("Search results polling error:", error);
        throw error instanceof Error
            ? error
            : new Error("Failed to get search results");
    }
};

export const pollUntilComplete = async (
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
): Promise<WebSearchResponse> => {
    const startTime = Date.now();
    let attempt = 0;

    while (true) {
        attempt += 1;

        const result = await pollSearchResults(correlationId);

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
};

export const getAllSearchHistory = async (): Promise<WebSearchResponse[]> => {
    try {
        const response = await authenticatedFetch(getApiUrl("/api/v1/websearch"));

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to get search history");
        }

        const result: APIResponse<WebSearchResponse[]> = await response.json();
        return result.data;
    } catch (error) {
        console.error("Search history error:", error);
        throw error instanceof Error
            ? error
            : new Error("Failed to get search history");
    }
};

export const checkWebSearchHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(getApiUrl("/api/v1/websearch/health"));
        const result = await response.json();
        return result.data?.status === "UP";
    } catch (error) {
        console.error("Web search health check error:", error);
        return false;
    }
}; 