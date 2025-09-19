import { getMicroserviceUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "@/lib/api/user-service/auth";

/**
 * Response types for paper extraction status
 */
export interface PaperExtractionStatusResponse {
  paperId: string;
  status: string;
  progress: number;
  isExtracted: boolean;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface StructuredDataResponse {
  hasStructuredData: boolean;
  statusValue: string;
  isExtracted: boolean;
  error?: string;
}

/**
 * Check if a paper has structured data (extraction completed) using project-service
 */
export const hasStructuredFacts = async (paperId: string): Promise<{
  hasStructuredData: boolean;
  statusValue: string;
  isExtracted: boolean;
  extractionId?: string;
  completedAt?: string;
}> => {
  try {
    console.log(`📊 Checking structured facts for paper: ${paperId}`);
    
    const url = getMicroserviceUrl("project-service", `/api/papers/${paperId}/has-structured-data`);
    
    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`❌ Failed to check structured facts: ${response.status}`);
      return { 
        hasStructuredData: false, 
        statusValue: 'ERROR', 
        isExtracted: false 
      };
    }

    const data = await response.json();
    
    console.log(`✅ Structured data check for paper ${paperId}:`, data);

    return {
      hasStructuredData: data.hasStructuredData || false,
      statusValue: data.statusValue || 'UNKNOWN',
      isExtracted: data.isExtracted || false,
      extractionId: data.extractionId,
      completedAt: data.completedAt,
    };
  } catch (error) {
    console.error(`❌ Error checking structured facts for paper ${paperId}:`, error);
    return { 
      hasStructuredData: false, 
      statusValue: 'ERROR', 
      isExtracted: false 
    };
  }
};

/**
 * Get detailed extraction status for a paper
 */
export const getPaperExtractionStatus = async (paperId: string): Promise<PaperExtractionStatusResponse | null> => {
  try {
    console.log(`📊 Getting extraction status for paper: ${paperId}`);
    
    const url = getMicroserviceUrl("project-service", `/api/papers/${paperId}/extraction-status`);
    
    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`❌ Failed to get extraction status: ${response.status}`);
      return null;
    }

    const data: PaperExtractionStatusResponse = await response.json();
    
    console.log(`✅ Extraction status for paper ${paperId}:`, data);

    return data;
  } catch (error) {
    console.error(`❌ Error getting extraction status for paper ${paperId}:`, error);
    return null;
  }
};

/**
 * Check if a paper is ready for chat and handle extraction if needed
 */
export const checkPaperChatReadiness = async (paperId: string): Promise<{
  isReady: boolean;
  needsExtraction: boolean;
  status?: string;
}> => {
  try {
    // Check if paper has structured facts (extraction completed)
    const hasStructuredData = await hasStructuredFacts(paperId);
    
    if (hasStructuredData.hasStructuredData) {
      return { isReady: true, needsExtraction: false, status: 'COMPLETED' };
    } else {
      // Get detailed status to understand why it's not ready
      const detailedStatus = await getPaperExtractionStatus(paperId);
      
      if (detailedStatus) {
        const isProcessing = detailedStatus.status === 'PROCESSING' || detailedStatus.status === 'PENDING';
        return { 
          isReady: false, 
          needsExtraction: !isProcessing, 
          status: detailedStatus.status 
        };
      }
      
      return { isReady: false, needsExtraction: true, status: 'NOT_STARTED' };
    }
  } catch (error) {
    console.error("Error checking paper chat readiness:", error);
    // Assume extraction is needed if we can't check
    return { isReady: false, needsExtraction: true, status: 'ERROR' };
  }
};

/**
 * Get structured facts/data for a paper using project-service endpoints
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

    // Get actual paper metadata from project-service
    const url = getMicroserviceUrl("project-service", `/api/papers/${paperId}/structured-facts`);
    const response = await authenticatedFetch(url);
    
    if (!response.ok) {
      console.warn(`⚠️ Failed to get structured facts from project-service: ${response.status}`);
      return {
        title: "Extracted Paper",
        authors: [],
        abstract: "Paper has been extracted and is ready for chat.",
        keywords: [],
        hasStructuredData: true,
      };
    }
    
    const result = await response.json();
    console.log(`✅ Retrieved real paper data: ${result.data?.title || 'No title'}`);
    
    // Return the actual paper data
    return {
      title: result.data?.title || "Extracted Paper",
      authors: result.data?.authors || [],
      abstract: result.data?.abstract || "Paper has been extracted and is ready for chat.",
      doi: result.data?.doi,
      publicationDate: result.data?.publicationDate,
      source: result.data?.source,
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