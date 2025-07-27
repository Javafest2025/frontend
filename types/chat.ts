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
