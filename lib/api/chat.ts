import type { APIResponse } from "@/types/project";
import { getMicroserviceUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "@/lib/api/user-service";
// Import extraction service functions from project-service
import { hasStructuredFacts } from "@/lib/api/paper-extraction";
import { triggerExtractionForPaper } from "@/lib/api/project-service/extraction";

/**
 * Chat API Request/Response Types - Must match backend DTOs exactly
 */
export interface ChatRequest {
  message: string;
  sessionId?: string; // Will be converted to UUID on backend
  sessionTitle?: string;
  selectedText?: string; // Add selected text context
  selectionContext?: {
    from: number;
    to: number;
    pageNumber?: number;
    sectionTitle?: string;
  };
}

export interface ChatResponse {
  sessionId: string; // UUID from backend, received as string in JSON
  response: string;
  timestamp: string; // LocalDateTime from backend, received as string in JSON
  success: boolean;
  error?: string;
  title?: string; // AI-generated session title
  context?: {
    sectionsUsed: string[];
    figuresReferenced: string[];
    tablesReferenced: string[];
    equationsUsed: string[];
    confidenceScore: number;
    contentSources: string[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  sessionId: string;
  paperId: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  isActive: boolean;
  lastMessagePreview?: string;
  isCurrent?: boolean;
}

/**
 * Continue chat in an existing session
 */
export const continueChatSession = async (
  paperId: string,
  sessionId: string,
  message: string,
  selectedText?: string,
  selectionContext?: {
    from: number;
    to: number;
    pageNumber?: number;
    sectionTitle?: string;
  }
): Promise<ChatResponse> => {
  try {
    const chatRequest = {
      message,
      selectedText,
      selectionContext,
    };

    const response = await authenticatedFetch(
      getMicroserviceUrl("project-service", `/api/papers/${paperId}/chat/sessions/${sessionId}/messages`),
      {
        method: "POST",
        body: JSON.stringify(chatRequest),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to continue chat");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Continue chat error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to continue chat");
  }
};

/**
 * Chat with a specific paper (paperId = docId)
 */
export const chatWithPaper = async (
  paperId: string,
  message: string,
  sessionId?: string,
  sessionTitle?: string,
  selectedText?: string,
  selectionContext?: {
    from: number;
    to: number;
    pageNumber?: number;
    sectionTitle?: string;
  }
): Promise<ChatResponse> => {
  try {
    const chatRequest: ChatRequest = {
      message,
      sessionId,
      sessionTitle,
      selectedText,
      selectionContext,
    };

    const response = await authenticatedFetch(
      getMicroserviceUrl("project-service", `/api/papers/${paperId}/chat`),
      {
        method: "POST",
        body: JSON.stringify(chatRequest),
      }
    );

    const result: ChatResponse = await response.json();
    console.log("Chat API response:", result);

    // Check if the response indicates an error
    if (!result.success) {
      throw new Error(result.error || "Failed to chat with paper");
    }

    return result;
  } catch (error) {
    console.error("Paper chat error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to chat with paper");
  }
};

/**
 * Get chat session messages
 */
export const getChatMessages = async (
  sessionId: string
): Promise<ChatMessage[]> => {
  try {
    const response = await authenticatedFetch(
      getMicroserviceUrl("project-service", `/api/papers/chat/sessions/${sessionId}/messages`)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get chat messages");
    }

    const result: APIResponse<ChatMessage[]> = await response.json();
    return result.data;
  } catch (error) {
    console.error("Chat messages error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to get chat messages");
  }
};

/**
 * Create a new chat session with initial message
 */
export const createChatSession = async (
  paperId: string,
  initialMessage: string,
  customTitle?: string,
  selectedText?: string,
  selectionContext?: {
    from: number;
    to: number;
    pageNumber?: number;
    sectionTitle?: string;
  }
): Promise<ChatResponse> => {
  try {
    const createSessionRequest = {
      initialMessage,
      customTitle,
      userId: null, // Will be set by backend from auth
      selectedText,
      selectionContext,
    };

    const response = await authenticatedFetch(
      getMicroserviceUrl("project-service", `/api/papers/${paperId}/chat/sessions`),
      {
        method: "POST",
        body: JSON.stringify(createSessionRequest),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create chat session");
    }

    const sessionResult = await response.json();

    // Convert ChatSession response to ChatResponse format for consistency
    const chatResponse: ChatResponse = {
      sessionId: sessionResult.sessionId,
      response: sessionResult.lastMessagePreview || "Session created successfully",
      timestamp: sessionResult.lastMessageAt || sessionResult.createdAt,
      title: sessionResult.title, // Include AI-generated title
      success: true,
    };

    return chatResponse;
  } catch (error) {
    console.error("Create chat session error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to create chat session");
  }
};

/**
 * Get user's chat sessions for a paper
 */
export const getChatSessions = async (paperId: string): Promise<ChatSession[]> => {
  try {
    const response = await authenticatedFetch(
      getMicroserviceUrl("project-service", `/api/papers/${paperId}/chat/sessions`)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get chat sessions");
    }

    const result = await response.json();
    return Array.isArray(result) ? result : result.data || [];
  } catch (error) {
    console.error("Chat sessions error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to get chat sessions");
  }
};

/**
 * Get chat session history with all messages
 */
export const getChatSessionHistory = async (
  paperId: string,
  sessionId: string
): Promise<{
  sessionId: string;
  paperId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
}> => {
  try {
    const response = await authenticatedFetch(
      getMicroserviceUrl("project-service", `/api/papers/${paperId}/chat/sessions/${sessionId}`)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get session history");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Get session history error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to get session history");
  }
};

/**
 * Check chat service health
 */
export const checkChatHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(getMicroserviceUrl("project-service", "/api/papers/chat/health"));
    const result = await response.json();
    return result.data?.status === "UP";
  } catch (error) {
    console.error("Chat health check error:", error);
    return false;
  }
};

/**
 * Check if a paper is ready for chat and handle extraction if needed
 */
export const checkPaperChatReadiness = async (paperId: string): Promise<{
  isReady: boolean;
  needsExtraction: boolean;
}> => {
  try {
    // Check if paper has structured facts (extraction completed)
    const hasStructuredData = await hasStructuredFacts(paperId);

    if (hasStructuredData.hasStructuredData) {
      return { isReady: true, needsExtraction: false };
    } else if (hasStructuredData.statusValue === 'PROCESSING') {
      // Extraction is already in progress, don't trigger again
      return { isReady: false, needsExtraction: false };
    } else {
      // Not extracted and not processing, needs extraction
      return { isReady: false, needsExtraction: true };
    }
  } catch (error) {
    console.error("Error checking paper chat readiness:", error);
    // Assume extraction is needed if we can't check
    return { isReady: false, needsExtraction: true };
  }
};

/**
 * Extract paper and wait for completion
 */
export const extractPaperForChat = async (paperId: string): Promise<void> => {
  try {
    console.log(`🔄 Starting extraction for paper: ${paperId}`);
    await triggerExtractionForPaper(paperId, true);
    console.log(`✅ Extraction initiated for paper: ${paperId}`);
  } catch (error) {
    console.error(`❌ Failed to extract paper ${paperId}:`, error);
    throw new Error(`Failed to extract paper: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};