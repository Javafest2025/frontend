import type { APIResponse } from "@/types/project";
import { getApiUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "@/lib/api/auth";
import { hasStructuredFacts, extractPaper } from "@/lib/api/extract";

/**
 * Chat API Request/Response Types - Must match backend DTOs exactly
 */
export interface ChatRequest {
  message: string;
  sessionId?: string; // Will be converted to UUID on backend
  sessionTitle?: string;
}

export interface ChatResponse {
  sessionId: string; // UUID from backend, received as string in JSON
  response: string;
  timestamp: string; // LocalDateTime from backend, received as string in JSON
  success: boolean;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

/**
 * Chat with a specific paper (paperId = docId)
 */
export const chatWithPaper = async (
  paperId: string,
  message: string,
  sessionId?: string,
  sessionTitle?: string
): Promise<ChatResponse> => {
  try {
    const chatRequest: ChatRequest = {
      message,
      sessionId,
      sessionTitle,
    };

    const response = await authenticatedFetch(
      getApiUrl(`/api/papers/${paperId}/chat`),
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
      getApiUrl(`/api/papers/chat/sessions/${sessionId}/messages`)
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
 * Get user's chat sessions
 */
export const getChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await authenticatedFetch(
      getApiUrl("/api/papers/chat/sessions")
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get chat sessions");
    }

    const result: APIResponse<ChatSession[]> = await response.json();
    return result.data;
  } catch (error) {
    console.error("Chat sessions error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to get chat sessions");
  }
};

/**
 * Check chat service health
 */
export const checkChatHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(getApiUrl("/api/papers/chat/health"));
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
    const hasData = await hasStructuredFacts(paperId);

    if (hasData.hasStructuredFacts) {
      return { isReady: true, needsExtraction: false };
    } else {
      // Paper needs extraction
      return { isReady: false, needsExtraction: true };
    }
  } catch (error) {
    console.error("Error checking paper chat readiness:", error);
    // If we can't check, assume it needs extraction
    return { isReady: false, needsExtraction: true };
  }
};

/**
 * Extract paper and wait for completion
 */
export const extractPaperForChat = async (paperId: string): Promise<void> => {
  try {
    // Start extraction
    await extractPaper(paperId);

    // Wait for 60 seconds for extraction to complete
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Verify extraction completed successfully
    const hasData = await hasStructuredFacts(paperId);
    if (!hasData.hasStructuredFacts) {
      throw new Error("Paper extraction did not complete successfully");
    }
  } catch (error) {
    console.error("Error extracting paper for chat:", error);
    throw error;
  }
};