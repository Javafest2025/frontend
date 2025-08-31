export interface Author {
    name: string;
    authorId?: string | null;
    orcid?: string | null;
    affiliation?: string | null;
}

export interface Paper {
    id: string;
    title: string;
    abstractText?: string | null;
    authors: Author[];
    publicationDate: string;
    doi?: string;
    semanticScholarId?: string | null;
    externalIds: Record<string, any>;
    source: string;
    pdfContentUrl?: string;
    pdfUrl?: string;
    isOpenAccess: boolean;
    paperUrl?: string;
    venueName?: string | null;
    publisher?: string | null;
    publicationTypes?: string | null;
    volume?: string | null;
    issue?: string | null;
    pages?: string | null;
    citationCount: number;
    referenceCount: number;
    influentialCitationCount: number;
    fieldsOfStudy?: string[] | null;
    isLatexContext?: boolean;
}

export interface WebSearchRequest {
    projectId: string;
    queryTerms: string[];
    domain: string;
    batchSize: number;
}

export interface WebSearchResponse {
    projectId: string;
    correlationId: string;
    queryTerms: string[];
    domain: string;
    batchSize: number;
    status: 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    submittedAt: string;
    message: string;
    papers: Paper[];
}

export interface SearchLoadingStep {
    id: string;
    message: string;
    completed: boolean;
    timestamp: Date;
} 