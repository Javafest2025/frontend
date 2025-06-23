export type Message = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  context?: string[]
}

export type ChatSession = {
  id: string
  title: string
  lastUpdated: string
}
