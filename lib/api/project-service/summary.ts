import { getMicroserviceUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "@/lib/api/user-service/auth";

// Types for summary API based on PaperSummaryResponseDto
export interface PaperSummaryResponse {
    id: string;
    paperId: string;

    // Quick Take Section
    oneLiner?: string;
    keyContributions?: string[];
    methodOverview?: string;
    mainFindings?: MainFinding[];
    limitations?: string[];
    applicability?: string[];

    // Methods & Data Section
    studyType?: string;
    researchQuestions?: string[];
    datasets?: DatasetInfo[];
    participants?: ParticipantInfo;
    procedureOrPipeline?: string;
    baselinesOrControls?: string[];
    metrics?: MetricInfo[];
    statisticalAnalysis?: string[];
    computeResources?: ComputeInfo;
    implementationDetails?: ImplementationInfo;

    // Reproducibility Section
    artifacts?: ArtifactInfo;
    reproducibilityNotes?: string;
    reproScore?: number;

    // Ethics & Compliance Section
    ethics?: EthicsInfo;
    biasAndFairness?: string[];
    risksAndMisuse?: string[];
    dataRights?: string;

    // Context & Impact Section
    noveltyType?: string;
    positioning?: string[];
    relatedWorksKey?: RelatedWork[];
    impactNotes?: string;

    // Quality & Trust Section
    confidence?: number;
    evidenceAnchors?: EvidenceAnchor[];
    threatsToValidity?: string[];

    // Additional fields
    domainClassification?: string[];
    technicalDepth?: string;
    interdisciplinaryConnections?: string[];
    futureWork?: string[];

    // Generation metadata
    modelVersion?: string;
    responseSource?: string;
    fallbackReason?: string;
    generationTimestamp?: string;
    generationTimeSeconds?: number;
    promptTokens?: number;
    completionTokens?: number;
    extractionCoverageUsed?: number;

    // Validation
    validationStatus?: string;
    validationNotes?: string;

    // Timestamps
    createdAt?: string;
    updatedAt?: string;
}

export interface MainFinding {
    task?: string;
    metric?: string;
    value?: string;
    comparator?: string;
    delta?: string;
    significance?: string;
}

export interface DatasetInfo {
    name?: string;
    domain?: string;
    size?: string;
    splitInfo?: string;
    license?: string;
    url?: string;
    description?: string;
}

export interface ParticipantInfo {
    n?: number;
    demographics?: string;
    irbApproved?: boolean;
    recruitmentMethod?: string;
    compensationDetails?: string;
}

export interface MetricInfo {
    name?: string;
    definition?: string;
    formula?: string;
    interpretation?: string;
}

export interface ComputeInfo {
    hardware?: string;
    trainingTime?: string;
    energyEstimateKwh?: number;
    cloudProvider?: string;
    estimatedCost?: number;
    gpuCount?: number;
}

export interface ImplementationInfo {
    frameworks?: string[];
    keyHyperparams?: Record<string, any>;
    language?: string;
    dependencies?: string;
    codeLines?: number;
}

export interface ArtifactInfo {
    codeUrl?: string;
    dataUrl?: string;
    modelUrl?: string;
    dockerImage?: string;
    configFiles?: string;
    demoUrl?: string;
    supplementaryMaterial?: string;
}

export interface EthicsInfo {
    irb?: boolean;
    consent?: boolean;
    sensitiveData?: boolean;
    privacyMeasures?: string;
    dataAnonymization?: string;
}

export interface RelatedWork {
    citation?: string;
    relation?: string;
    description?: string;
    year?: string;
}

export interface EvidenceAnchor {
    field?: string;
    page?: number;
    span?: string;
    source?: string;
    sourceId?: string;
    confidence?: number;
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
 * Generate summary for a paper with timeout handling and optional abort signal
 */
export async function generateSummary(
    paperId: string,
    timeoutMs: number = 90000,
    signal?: AbortSignal
): Promise<PaperSummaryResponse> {
    const url = getMicroserviceUrl("project-service", `/api/v1/papers/${paperId}/summary/generate`);

    // Create AbortController for timeout
    const timeoutCtrl = new AbortController();
    const onTimeout = setTimeout(() => timeoutCtrl.abort(), timeoutMs);

    // Combine external signal + timeout
    const combined = new AbortController();
    const onAbort = () => combined.abort();
    signal?.addEventListener("abort", onAbort);
    timeoutCtrl.signal.addEventListener("abort", onAbort);

    try {
        const response = await authenticatedFetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            signal: combined.signal,
        });

        clearTimeout(onTimeout);
        return handleApiResponse<PaperSummaryResponse>(response);
    } catch (error) {
        clearTimeout(onTimeout);
        signal?.removeEventListener("abort", onAbort);

        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Summary generation aborted`);
        }

        throw error;
    }
}

/**
 * Regenerate summary for a paper with timeout handling
 */
export async function regenerateSummary(paperId: string, timeoutMs: number = 90000): Promise<PaperSummaryResponse> {
    const url = getMicroserviceUrl("project-service", `/api/v1/papers/${paperId}/summary/regenerate`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await authenticatedFetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return handleApiResponse<PaperSummaryResponse>(response);
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Summary regeneration timed out after ${timeoutMs / 1000} seconds. Please try again.`);
        }

        throw error;
    }
}


/**
 * Check if paper is summarized (returns boolean)
 */
export async function isPaperSummarized(paperId: string): Promise<boolean> {
    const url = getMicroserviceUrl("project-service", `/api/v1/papers/${paperId}/summary/summarized`);

    console.log('🔍 Checking if paper is summarized for paperId:', paperId);
    console.log('🌐 Request URL:', url);

    const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    console.log('📊 Summarized check response status:', response.status);

    return handleApiResponse<boolean>(response);
}

/**
 * Get summary for a paper (only call this if you know the summary exists)
 */
export async function getSummary(paperId: string): Promise<PaperSummaryResponse> {
    const url = getMicroserviceUrl("project-service", `/api/v1/papers/${paperId}/summary`);

    console.log('📄 Fetching summary for paperId:', paperId);
    console.log('🌐 Request URL:', url);

    const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    console.log('📊 Summary fetch response status:', response.status);

    return handleApiResponse<PaperSummaryResponse>(response);
}

/**
 * Update validation status for a summary
 */
export async function updateValidationStatus(
    paperId: string,
    status: string,
    notes?: string
): Promise<PaperSummaryResponse> {
    const url = getMicroserviceUrl("project-service", `/api/v1/papers/${paperId}/summary/validation`);

    const params = new URLSearchParams({ status });
    if (notes) {
        params.append("notes", notes);
    }

    const response = await authenticatedFetch(`${url}?${params}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return handleApiResponse<PaperSummaryResponse>(response);
}
