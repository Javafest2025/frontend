// types/chat.ts
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  context?: string[]
  timestamp?: Date
}

export type ChatSession = {
  id: string
  title: string
  lastUpdated: string
}

// LaTeX AI Chat Types
export interface LatexAiChatSession {
  id: string
  documentId: string
  projectId: string
  sessionTitle: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  messageCount: number
  lastMessageTime: string
  messages: LatexAiChatMessage[]
  checkpoints: LatexDocumentCheckpoint[]
  currentCheckpoint?: LatexDocumentCheckpoint
}

export interface LatexAiChatMessage {
  id: string | number  // Can be string (client-generated) or number (server-generated)
  sessionId: string
  messageType: 'USER' | 'AI'
  content: string
  latexSuggestion?: string
  actionType?: 'ADD' | 'REPLACE' | 'DELETE' | 'MODIFY'
  selectionRangeFrom?: number
  selectionRangeTo?: number
  cursorPosition?: number
  isApplied: boolean
  createdAt: string
  
  // Helper properties for frontend
  sender: 'user' | 'ai'
  timestamp: string
  hasLatexSuggestion: boolean
  hasSelectionRange: boolean
}

export interface LatexDocumentCheckpoint {
  id: string
  documentId: string
  sessionId: string
  messageId?: string
  checkpointName: string
  contentBefore: string
  contentAfter?: string
  createdAt: string
  isCurrent: boolean
  
  // Helper properties
  displayName: string
  contentSizeDifference: number
  hasContentAfter: boolean
}

export interface CreateLatexChatMessageRequest {
  content: string
  messageType: 'USER' | 'AI'
  latexSuggestion?: string
  actionType?: 'ADD' | 'REPLACE' | 'DELETE' | 'MODIFY'
  selectionRangeFrom?: number
  selectionRangeTo?: number
  cursorPosition?: number
  
  // Context information for AI processing
  selectedText?: string
  fullDocument?: string
  userRequest?: string
}

export interface CreateCheckpointRequest {
  checkpointName: string
  contentBefore: string
  contentAfter?: string
  messageId?: string
  setCurrent?: boolean
}
