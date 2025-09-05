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
        throw new Error("Invalid JSON response from server");
    }
};

/**
 * Generate summary for a paper
 */
export async function generateSummary(paperId: string): Promise<PaperSummaryResponse> {
    const url = getMicroserviceUrl("project-service", `/api/v1/papers/${paperId}/summary/generate`);

    const response = await authenticatedFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return handleApiResponse<PaperSummaryResponse>(response);
}

/**
 * Regenerate summary for a paper
 */
export async function regenerateSummary(paperId: string): Promise<PaperSummaryResponse> {
    const url = getMicroserviceUrl("project-service", `/api/v1/papers/${paperId}/summary/regenerate`);

    const response = await authenticatedFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return handleApiResponse<PaperSummaryResponse>(response);
}

/**
 * Get summary for a paper
 */
export async function getSummary(paperId: string): Promise<PaperSummaryResponse> {
    const url = getMicroserviceUrl("project-service", `/api/v1/papers/${paperId}/summary`);

    const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

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
