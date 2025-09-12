import { getMicroserviceUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "@/lib/api/user-service/auth";

// Types for gap analysis API based on backend DTOs
export interface GapAnalysisRequest {
    paperId: string;
    maxPapers?: number;
    validationThreshold?: number;
    config?: GapAnalysisConfigDto;
}

export interface GapAnalysisConfigDto {
    maxGaps?: number;
    validationDepth?: string;
    includeTopicSuggestions?: boolean;
    includeImplementationDetails?: boolean;
    confidenceThreshold?: number;
    includeImpactAnalysis?: boolean;
    includeResearchHints?: boolean;
    includeRisksAnalysis?: boolean;
    includeResourceEstimation?: boolean;
}

export interface GapAnalysisRequestData {
    gapAnalysisId: string;
    paperId: string;
    paperExtractionId: string;
    correlationId: string;
    requestId: string;
    status: GapStatus;
    config?: GapAnalysisConfigDto;
    startedAt?: string;
    completedAt?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
    // Gap count statistics
    totalGapsIdentified?: number;
    validGapsCount?: number;
    invalidGapsCount?: number;
    modifiedGapsCount?: number;
}

export interface GapAnalysisResponse {
    id: string;
    paperId: string;
    status: GapStatus;
    message?: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    error?: string;
    researchGaps?: ResearchGapResponse[];
    statistics?: GapAnalysisStats;
}

export interface ResearchGapResponse {
    id: string;
    gapId: string;
    gapAnalysisId: string;
    orderIndex?: number;
    name?: string;
    description?: string;
    category?: string;
    validationStatus: GapValidationStatus;
    validationConfidence?: number;
    initialReasoning?: string;
    initialEvidence?: string;
    validationQuery?: string;
    papersAnalyzedCount: number;
    validationReasoning?: string;
    potentialImpact?: string;
    researchHints?: string;
    implementationSuggestions?: string;
    risksAndChallenges?: string;
    requiredResources?: string;
    estimatedDifficulty?: string;
    estimatedTimeline?: string;
    evidenceAnchors?: EvidenceAnchor[];
    supportingPapers?: PaperReference[];
    conflictingPapers?: PaperReference[];
    suggestedTopics?: ResearchTopic[];
    createdAt: string;
    validatedAt?: string;
}

export interface EvidenceAnchor {
    title: string;
    url: string;
    type: string; // supporting, conflicting, neutral
    relevanceScore?: number;
}

export interface PaperReference {
    title: string;
    doi?: string;
    url?: string;
    publicationDate?: string;
    relevanceScore?: number;
    keyFindings?: string;
}

export interface ResearchTopic {
    title: string;
    description: string;
    researchQuestions?: string[];
    methodologySuggestions?: string;
    expectedOutcomes?: string;
    relevanceScore?: number;
}

export interface GapAnalysisStats {
    totalGaps: number;
    validGaps: number;
    invalidGaps: number;
    modifiedGaps: number;
    averageConfidence: number;
    totalPapersAnalyzed: number;
    processingTimeSeconds?: number;
}

export enum GapStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}

export enum GapValidationStatus {
    INITIAL = "INITIAL",
    VALIDATING = "VALIDATING",
    VALID = "VALID",
    INVALID = "INVALID",
    MODIFIED = "MODIFIED"
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
    } catch {
        // Try to get the response text to provide more context
        let responseText = '';
        try {
            responseText = await response.text();
        } catch {
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

// API functions
export const gapAnalysisApi = {
    // Initiate gap analysis for a paper
    async initiateGapAnalysis(request: GapAnalysisRequest): Promise<GapAnalysisResponse> {
        const url = getMicroserviceUrl("project-service", "/api/v1/gap-analyses");

        const response = await authenticatedFetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
        });

        return handleApiResponse<GapAnalysisResponse>(response);
    },

    // Get gap analysis by ID
    async getGapAnalysis(id: string): Promise<GapAnalysisResponse> {
        const url = getMicroserviceUrl("project-service", `/api/v1/gap-analyses/${id}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<GapAnalysisResponse>(response);
    },

    // Get gap analyses by paper ID
    async getGapAnalysesByPaperId(paperId: string): Promise<GapAnalysisResponse[]> {
        const url = getMicroserviceUrl("project-service", `/api/v1/gap-analyses/paper/${paperId}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<GapAnalysisResponse[]>(response);
    },

    // Get gap analyses by paper ID with pagination
    async getGapAnalysesByPaperIdPaginated(paperId: string, page: number = 0, size: number = 10): Promise<{ content: GapAnalysisResponse[], totalElements: number, totalPages: number }> {
        const url = getMicroserviceUrl("project-service", `/api/v1/gap-analyses/paper/${paperId}/paginated?page=${page}&size=${size}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<{ content: GapAnalysisResponse[], totalElements: number, totalPages: number }>(response);
    },

    // Get gap analyses by status
    async getGapAnalysesByStatus(status: GapStatus): Promise<GapAnalysisResponse[]> {
        const url = getMicroserviceUrl("project-service", `/api/v1/gap-analyses/status/${status}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<GapAnalysisResponse[]>(response);
    },

    // Get gap analyses by status with pagination
    async getGapAnalysesByStatusPaginated(status: GapStatus, page: number = 0, size: number = 10): Promise<{ content: GapAnalysisResponse[], totalElements: number, totalPages: number }> {
        const url = getMicroserviceUrl("project-service", `/api/v1/gap-analyses/status/${status}/paginated?page=${page}&size=${size}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<{ content: GapAnalysisResponse[], totalElements: number, totalPages: number }>(response);
    },

    // Get the latest gap analysis for a paper
    async getLatestGapAnalysisByPaperId(paperId: string): Promise<GapAnalysisResponse> {
        const url = getMicroserviceUrl("project-service", `/api/v1/gap-analyses/paper/${paperId}/latest`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<GapAnalysisResponse>(response);
    },

    // Retry failed gap analysis
    async retryGapAnalysis(id: string): Promise<GapAnalysisResponse> {
        const url = getMicroserviceUrl("project-service", `/api/v1/gap-analyses/${id}/retry`);

        const response = await authenticatedFetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<GapAnalysisResponse>(response);
    },

    // Get gap analysis statistics
    async getGapAnalysisStats(): Promise<GapAnalysisStats> {
        const url = getMicroserviceUrl("project-service", "/api/v1/gap-analyses/stats");

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<GapAnalysisStats>(response);
    },

    // Get gap analysis request data by paper ID
    async getGapAnalysisRequestDataByPaperId(paperId: string): Promise<GapAnalysisRequestData[]> {
        const url = getMicroserviceUrl("project-service", `/api/v1/gap-analyses/paper/${paperId}/request-data`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<GapAnalysisRequestData[]>(response);
    },
};

// Research Gaps API
export const researchGapsApi = {
    // Get research gap by ID
    async getResearchGap(id: string): Promise<ResearchGapResponse> {
        const url = getMicroserviceUrl("project-service", `/api/v1/research-gaps/${id}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<ResearchGapResponse>(response);
    },

    // Get research gaps by gap analysis ID
    async getResearchGapsByGapAnalysisId(gapAnalysisId: string): Promise<ResearchGapResponse[]> {
        const url = getMicroserviceUrl("project-service", `/api/v1/research-gaps/gap-analysis/${gapAnalysisId}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<ResearchGapResponse[]>(response);
    },

    // Get research gaps by gap analysis ID with pagination
    async getResearchGapsByGapAnalysisIdPaginated(gapAnalysisId: string, page: number = 0, size: number = 10): Promise<{ content: ResearchGapResponse[], totalElements: number, totalPages: number }> {
        const url = getMicroserviceUrl("project-service", `/api/v1/research-gaps/gap-analysis/${gapAnalysisId}/paginated?page=${page}&size=${size}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<{ content: ResearchGapResponse[], totalElements: number, totalPages: number }>(response);
    },

    // Get research gaps by paper ID
    async getResearchGapsByPaperId(paperId: string): Promise<ResearchGapResponse[]> {
        const url = getMicroserviceUrl("project-service", `/api/v1/research-gaps/paper/${paperId}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<ResearchGapResponse[]>(response);
    },

    // Get research gaps by paper ID with pagination
    async getResearchGapsByPaperIdPaginated(paperId: string, page: number = 0, size: number = 10): Promise<{ content: ResearchGapResponse[], totalElements: number, totalPages: number }> {
        const url = getMicroserviceUrl("project-service", `/api/v1/research-gaps/paper/${paperId}/paginated?page=${page}&size=${size}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<{ content: ResearchGapResponse[], totalElements: number, totalPages: number }>(response);
    },

    // Get valid research gaps by paper ID
    async getValidResearchGapsByPaperId(paperId: string): Promise<ResearchGapResponse[]> {
        const url = getMicroserviceUrl("project-service", `/api/v1/research-gaps/paper/${paperId}/valid`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<ResearchGapResponse[]>(response);
    },

    // Get research gaps by validation status
    async getResearchGapsByStatus(status: GapValidationStatus): Promise<ResearchGapResponse[]> {
        const url = getMicroserviceUrl("project-service", `/api/v1/research-gaps/status/${status}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<ResearchGapResponse[]>(response);
    },

    // Get research gaps by category
    async getResearchGapsByCategory(category: string): Promise<ResearchGapResponse[]> {
        const url = getMicroserviceUrl("project-service", `/api/v1/research-gaps/category/${encodeURIComponent(category)}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<ResearchGapResponse[]>(response);
    },

    // Get research gaps by estimated difficulty
    async getResearchGapsByDifficulty(difficulty: string): Promise<ResearchGapResponse[]> {
        const url = getMicroserviceUrl("project-service", `/api/v1/research-gaps/difficulty/${encodeURIComponent(difficulty)}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<ResearchGapResponse[]>(response);
    },

    // Get high confidence research gaps
    async getHighConfidenceResearchGaps(minConfidence: number = 0.8): Promise<ResearchGapResponse[]> {
        const url = getMicroserviceUrl("project-service", `/api/v1/research-gaps/high-confidence?minConfidence=${minConfidence}`);

        const response = await authenticatedFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return handleApiResponse<ResearchGapResponse[]>(response);
    },
}; 