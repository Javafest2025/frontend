import type { APIResponse } from "@/types/project";
import { getApiUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "@/lib/api/user-service";

/**
 * Response types for extraction API
 */
export interface StructuredFactsResponse {
  hasStructuredData: boolean;
  extractionId?: string;
  completedAt?: string;
  paperInfo?: {
    title?: string;
    authors?: string[];
    abstract?: string;
    keywords?: string[];
  };
}

export interface ExtractionJobResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  result?: any;
}

/**
 * Check if a paper has structured facts (extraction completed)
 */
export const hasStructuredFacts = async (paperId: string): Promise<StructuredFactsResponse> => {
  try {
    console.log(`📊 Checking structured facts for paper: ${paperId}`);
    
    // Check if extraction exists for this paper
    const response = await authenticatedFetch(
      getApiUrl(`/extractor/api/v1/extractions?paperId=${paperId}`),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`❌ Failed to check structured facts: ${response.status}`);
      return { hasStructuredData: false };
    }

    const data = await response.json();
    
    // Check if there's a completed extraction
    const hasCompletedExtraction = data?.extractions?.some(
      (extraction: any) => extraction.status === 'completed'
    );

    return {
      hasStructuredData: hasCompletedExtraction,
      extractionId: hasCompletedExtraction ? data.extractions[0]?.id : undefined,
      completedAt: hasCompletedExtraction ? data.extractions[0]?.completedAt : undefined,
    };
  } catch (error) {
    console.error(`❌ Error checking structured facts for paper ${paperId}:`, error);
    return { hasStructuredData: false };
  }
};

/**
 * Extract a paper (initiate extraction process)
 */
export const extractPaper = async (paperId: string): Promise<ExtractionJobResponse> => {
  try {
    console.log(`🔄 Starting extraction for paper: ${paperId}`);
    
    const response = await authenticatedFetch(
      getApiUrl('/extractor/api/v1/extract-from-b2'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paper_id: paperId,
          extract_text: true,
          extract_metadata: true,
          extract_references: true,
          extract_tables: true,
          extract_figures: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start extraction: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      jobId: data.job_id || data.extraction_id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ Error extracting paper ${paperId}:`, error);
    throw error;
  }
};

/**
 * Get structured facts/data for a paper
 */
export const getStructuredFacts = async (paperId: string): Promise<any> => {
  try {
    console.log(`📄 Getting structured facts for paper: ${paperId}`);
    
    // First check if extraction exists
    const factsResponse = await hasStructuredFacts(paperId);
    
    if (!factsResponse.hasStructuredData) {
      console.warn(`⚠️ No structured data found for paper: ${paperId}`);
      return {
        title: "Unknown Paper",
        authors: [],
        abstract: "No structured data available. Please extract the paper first.",
        keywords: [],
        hasStructuredData: false,
      };
    }

    // Try to get the extraction result
    const response = await authenticatedFetch(
      getApiUrl(`/extractor/api/v1/extractions?paperId=${paperId}&includeResult=true`),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get structured facts: ${response.status}`);
    }

    const data = await response.json();
    const completedExtraction = data?.extractions?.find(
      (extraction: any) => extraction.status === 'completed'
    );

    if (completedExtraction?.result) {
      return {
        title: completedExtraction.result.metadata?.title || "Unknown Paper",
        authors: completedExtraction.result.metadata?.authors || [],
        abstract: completedExtraction.result.text?.abstract || "No abstract available",
        keywords: completedExtraction.result.metadata?.keywords || [],
        hasStructuredData: true,
        extractionResult: completedExtraction.result,
      };
    }

    // Fallback response
    return {
      title: "Extracted Paper",
      authors: [],
      abstract: "Extraction completed but detailed data not available.",
      keywords: [],
      hasStructuredData: true,
    };
  } catch (error) {
    console.error(`❌ Error getting structured facts for paper ${paperId}:`, error);
    return {
      title: "Error Loading Paper",
      authors: [],
      abstract: "Failed to load paper data.",
      keywords: [],
      hasStructuredData: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get extraction status for a job
 */
export const getExtractionStatus = async (jobId: string): Promise<ExtractionJobResponse> => {
  try {
    const response = await authenticatedFetch(
      getApiUrl(`/extractor/api/v1/status/${jobId}`),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get extraction status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error getting extraction status for job ${jobId}:`, error);
    throw error;
  }
};
