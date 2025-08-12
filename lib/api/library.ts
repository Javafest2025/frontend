// Library API is not yet available on backend. Keep DTOs for future use, but
// export no-op or placeholder functions so callers can be updated gradually
// without hitting 404s.
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
    throw new Error("Library service is not available yet")
};

export const getProjectLibraryStats = async (
    projectId: string
): Promise<LibraryResponse> => {
    throw new Error("Library service is not available yet")
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
    throw new Error("Library service is not available yet")
};

export const getProjectLatestPapers = async (
    projectId: string
): Promise<LibraryResponse> => {
    throw new Error("Library service is not available yet")
};