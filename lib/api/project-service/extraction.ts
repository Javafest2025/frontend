import { getMicroserviceUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "@/lib/api/user-service/auth";

// Types for extraction API based on backend DTOs
export interface ExtractionRequest {
    paperId: string;
    extractText?: boolean;
    extractFigures?: boolean;
    extractTables?: boolean;
    extractEquations?: boolean;
    extractCode?: boolean;
    extractReferences?: boolean;
    useOcr?: boolean;
    detectEntities?: boolean;
    asyncProcessing?: boolean;
}

export interface ExtractionResponse {
    jobId: string;
    paperId: string;
    status: string;
    message: string;
    b2Url?: string;
    startedAt?: string;
    completedAt?: string;
    progress?: number;
    error?: string;
}

export interface SummarizationStatus {
    paperId: string;
    isSummarized: boolean;
    summarizationStatus: string;
    summarizationStartedAt?: string;
    summarizationCompletedAt?: string;
    summarizationError?: string;
}

// Helper function to handle API response
const handleApiResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
            try {
                const textContent = await response.text();
                errorMessage = textContent || errorMessage;
            } catch {
                // If all else fails, use the status-based message
            }
        }
        throw new Error(errorMessage);
    }

    try {
        return await response.json();
    } catch (error) {
        throw new Error("Invalid JSON response from server");
    }
};

/**
 * Trigger paper extraction with custom options
 */
export async function triggerExtraction(request: ExtractionRequest): Promise<ExtractionResponse> {
    const url = getMicroserviceUrl("project-service", "/api/v1/extraction/trigger");

    const response = await authenticatedFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    return handleApiResponse<ExtractionResponse>(response);
}

/**
 * Trigger paper extraction with default options
 */
export async function triggerExtractionForPaper(
    paperId: string,
    asyncProcessing: boolean = true
): Promise<ExtractionResponse> {
    const url = getMicroserviceUrl("project-service", `/api/v1/extraction/trigger/${paperId}?asyncProcessing=${asyncProcessing}`);

    const response = await authenticatedFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return handleApiResponse<ExtractionResponse>(response);
}

/**
 * Get extraction status for a paper
 */
export async function getExtractionStatus(paperId: string): Promise<ExtractionResponse> {
    const url = getMicroserviceUrl("project-service", `/api/v1/extraction/status/${paperId}`);

    const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return handleApiResponse<ExtractionResponse>(response);
}

/**
 * Check if paper is extracted
 */
export async function isPaperExtracted(paperId: string): Promise<boolean> {
    const url = getMicroserviceUrl("project-service", `/api/v1/extraction/extracted/${paperId}`);

    const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return handleApiResponse<boolean>(response);
}

/**
 * Get summarization status for a paper
 */
export async function getSummarizationStatus(paperId: string): Promise<SummarizationStatus> {
    const url = getMicroserviceUrl("project-service", `/api/v1/papers/${paperId}/summary/status`);

    const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return handleApiResponse<SummarizationStatus>(response);
}
