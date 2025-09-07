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

export interface ExtractedFigureResponse {
    figureId: string;
    label: string;
    caption: string;
    page: number;
    imagePath: string;
    figureType: string;
    orderIndex: number;
}

export interface ExtractedTableResponse {
    tableId: string;
    label: string;
    caption: string;
    page: number;
    csvPath: string;
    orderIndex: number;
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
        // Try to get the response text to provide more context
        let responseText = '';
        try {
            responseText = await response.text();
        } catch (textError) {
            responseText = 'Unable to read response text';
        }

        // Log the actual response for debugging
        console.error('Failed to parse JSON response:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            responseText: responseText.substring(0, 500) // Limit to first 500 chars
        });

        throw new Error(`Invalid JSON response from server (${response.status} ${response.statusText}). Response: ${responseText.substring(0, 200)}`);
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

/**
 * Get extraction status only for a paper
 */
export async function getExtractionStatusOnly(paperId: string): Promise<string> {
    const url = getMicroserviceUrl("project-service", `/api/v1/extraction/status-only/${paperId}`);

    const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    const data = await handleApiResponse<{ status: string }>(response);
    return data.status;
}

/**
 * Get summarization status only for a paper
 */
export async function getSummarizationStatusOnly(paperId: string): Promise<string> {
    const url = getMicroserviceUrl("project-service", `/api/v1/papers/${paperId}/summary/status-only`);

    const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    const data = await handleApiResponse<{ status: string }>(response);
    return data.status;
}

/**
 * Get extracted figures for a paper
 */
export async function getExtractedFigures(paperId: string): Promise<ExtractedFigureResponse[]> {
    const url = getMicroserviceUrl("project-service", `/api/v1/extraction/figures/${paperId}`);

    const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return handleApiResponse<ExtractedFigureResponse[]>(response);
}

/**
 * Get extracted tables for a paper
 */
export async function getExtractedTables(paperId: string): Promise<ExtractedTableResponse[]> {
    const url = getMicroserviceUrl("project-service", `/api/v1/extraction/tables/${paperId}`);

    const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return handleApiResponse<ExtractedTableResponse[]>(response);
}
