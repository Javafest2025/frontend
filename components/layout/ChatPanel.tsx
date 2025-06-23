"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import {
  X,
  Plus,
  Clock,
  Send,
  Paperclip,
  Sparkles,
  MessageSquare,
  MoreHorizontal,
  Copy,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChatMessage } from "@/components/chat/ChatMessage"
import { ChatComposer } from "@/components/chat/ChatComposer"
import { useChat } from "@/lib/hooks/useChat"
import { cn } from "@/lib/utils/cn"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function ChatPanel({ isOpen, onClose }: Props) {
  const { messages, sendMessage, isLoading, currentChat, startNewChat, chatHistory } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(400)
  const [isDragging, setIsDragging] = useState(false)
  const [showChatHistory, setShowChatHistory] = useState(false)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Handle mouse dragging for resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      // Calculate new width based on mouse position
      const newWidth = Math.max(320, Math.min(800, window.innerWidth - e.clientX))
      setWidth(newWidth)

      if (panelRef.current) {
        document.body.style.cursor = "ew-resize"
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ""
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
    }
  }, [isDragging])

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-[#1e1e1e] border-l border-[#3e3e42] shadow-2xl"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[#007acc] transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-[#3e3e42] px-4 bg-[#252526]">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-[#007acc] to-[#005a9e] rounded-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h2 className="font-semibold text-white text-sm">
            {showChatHistory ? "Chat History" : currentChat.title}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={startNewChat}
            className="h-8 w-8 p-0 text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white rounded-md"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChatHistory(!showChatHistory)}
            className="h-8 w-8 p-0 text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white rounded-md"
            title="Chat history"
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white rounded-md"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showChatHistory ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs text-[#cccccc] mb-4 font-medium">Recent Conversations</div>
          {chatHistory.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-[#666] mx-auto mb-3" />
              <p className="text-[#cccccc] text-sm">No chat history yet</p>
              <p className="text-[#666] text-xs mt-1">Start a conversation to see it here</p>
            </div>
          ) : (
            chatHistory.map((chat) => (
              <div
                key={chat.id}
                className="p-3 rounded-lg hover:bg-[#2a2d2e] cursor-pointer border border-transparent hover:border-[#3e3e42] transition-all"
                onClick={() => {
                  // Switch to this chat
                  setShowChatHistory(false)
                }}
              >
                <p className="font-medium text-white text-sm truncate">{chat.title}</p>
                <p className="text-xs text-[#cccccc] mt-1">
                  {new Date(chat.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#007acc] to-[#005a9e] rounded-2xl mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Welcome to ScholarAI</h3>
                <p className="text-[#cccccc] text-sm mb-4 max-w-xs">
                  I'm your AI research assistant. Ask me anything about your documents, research, or get help with analysis.
                </p>
                <div className="space-y-2 w-full max-w-xs">
                  <button className="w-full text-left p-3 rounded-lg bg-[#2a2d2e] hover:bg-[#3e3e42] text-sm text-[#cccccc] transition-colors">
                    📄 Summarize this document
                  </button>
                  <button className="w-full text-left p-3 rounded-lg bg-[#2a2d2e] hover:bg-[#3e3e42] text-sm text-[#cccccc] transition-colors">
                    🔍 Find key insights
                  </button>
                  <button className="w-full text-left p-3 rounded-lg bg-[#2a2d2e] hover:bg-[#3e3e42] text-sm text-[#cccccc] transition-colors">
                    💡 Generate research questions
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-[#cccccc] text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[#007acc] rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-[#007acc] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-[#007acc] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span>AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-[#3e3e42] p-4 bg-[#252526]">
            <ChatComposer onSend={sendMessage} isLoading={isLoading} />
          </div>
        </>
      )}
    </div>
  )
}
