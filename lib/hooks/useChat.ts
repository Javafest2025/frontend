"use client"

import { useState, useCallback } from "react"
import type { Message } from "@/types/chat"
import type { ChatSession } from "@/types/chat"

// Sample initial messages
const initialMessages: Message[] = [
  {
    id: "1",
    role: "system",
    content: "Hello! I am ScholarAI, your research assistant. How can I help you today?",
  },
]

// Sample chat history
const initialChatHistory: ChatSession[] = [
  {
    id: "1",
    title: "Research Paper Analysis",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Literature Review Help",
    lastUpdated: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: "3",
    title: "Citation Formatting",
    lastUpdated: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
]

export function useChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(initialChatHistory)
  const [currentChat, setCurrentChat] = useState<ChatSession>({
    id: "current",
    title: "Identifying Code Complexity Issues",
    lastUpdated: new Date().toISOString(),
  })

  const sendMessage = useCallback(async (content: string, context?: string[]) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      context,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Update current chat's last updated time
    setCurrentChat((prev) => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
    }))

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: context
          ? `I received your message with context: "${content}". This is a simulated response as we're just demonstrating the UI.`
          : `I received your message: "${content}". This is a simulated response as we're just demonstrating the UI.`,
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }, [])

  const startNewChat = useCallback(() => {
    // Save current chat to history if it has messages
    if (messages.length > 1) {
      // More than just the system message
      setChatHistory((prev) => [
        {
          id: currentChat.id,
          title: currentChat.title,
          lastUpdated: new Date().toISOString(),
        },
        ...prev,
      ])
    }

    // Create new chat
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      lastUpdated: new Date().toISOString(),
    }

    setCurrentChat(newChat)
    setMessages(initialMessages)
  }, [messages, currentChat])

  return {
    messages,
    sendMessage,
    isLoading,
    currentChat,
    chatHistory,
    startNewChat,
  }
}
