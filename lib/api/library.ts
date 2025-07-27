import { getApiUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "@/lib/api/auth";
import type { Paper } from "@/types/websearch";

/**
 * Library API Functions
 */

export interface LibraryStats {
    projectId: string;
    correlationIds: string[];
    totalPapers: number;
    completedSearchOperations: number;
    retrievedAt: string;
    message: string;
}

export interface LibraryResponse {
    timestamp: string;
    status: number;
    message: string;
    data: LibraryStats & {
        papers: Paper[];
    };
}

export const getProjectLibrary = async (
    projectId: string
): Promise<LibraryResponse> => {
    try {
        const response = await authenticatedFetch(
            getApiUrl(`/api/v1/library/project/${projectId}`)
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || `HTTP error! status: ${response.status}`
            );
        }

        const data: LibraryResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching project library:", error);
        throw error;
    }
};

export const getProjectLibraryStats = async (
    projectId: string
): Promise<LibraryResponse> => {
    try {
        const response = await authenticatedFetch(
            getApiUrl(`/api/v1/library/project/${projectId}/stats`)
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || `HTTP error! status: ${response.status}`
            );
        }

        const data: LibraryResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching project library stats:", error);
        throw error;
    }
};

export const addUploadedPaper = async (projectId: string, paperData: {
    title: string;
    abstract?: string | null;
    authors?: Array<{
        name: string;
        authorId?: string | null;
        orcid?: string | null;
        affiliation?: string | null;
    }>;
    publicationDate?: string;
    doi?: string | null;
    semanticScholarId?: string | null;
    externalIds?: {
        DOI?: string;
        ArXiv?: string;
        PubMedCentral?: string;
        CorpusId?: number;
    };
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
}) => {
    try {
        const response = await authenticatedFetch(
            getApiUrl(`/api/v1/library/project/${projectId}/papers`),
            {
                method: "POST",
                body: JSON.stringify(paperData),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error adding uploaded paper:", error);
        throw error;
    }
};

export const getProjectLatestPapers = async (
    projectId: string
): Promise<LibraryResponse> => {
    try {
        const response = await authenticatedFetch(
            getApiUrl(`/api/v1/library/project/${projectId}/latest`)
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching latest papers:", error);
        throw error;
    }
}; 