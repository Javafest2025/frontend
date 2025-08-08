'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  MessageSquare, 
  Copy, 
  Check, 
  X,
  Lightbulb,
  FileText,
  ChevronDown
} from 'lucide-react'
import { useAIAssistance } from '@/lib/api/ongoing-research'

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  latexSuggestion?: string
  isAccepted?: boolean
}

interface AIChatPanelProps {
  content: string
  onApplySuggestion: (suggestion: string, position?: number) => void
  selectedText?: string
  cursorPosition?: number
}

export function AIChatPanel({ content, onApplySuggestion, selectedText, cursorPosition }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTextDisplay, setSelectedTextDisplay] = useState<string>('')
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const aiAssistance = useAIAssistance()

  // Update selected text display when prop changes
  useEffect(() => {
    if (selectedText && selectedText.trim()) {
      setSelectedTextDisplay(selectedText.trim())
    } else {
      setSelectedTextDisplay('')
    }
  }, [selectedText])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && scrollAreaRef.current) {
      // Always auto-scroll for new messages to ensure user sees the latest content
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages])

  // Check scroll position to show/hide scroll button
  useEffect(() => {
    const scrollElement = scrollAreaRef.current
    if (scrollElement) {
      const handleScroll = () => {
        const isAtBottom = scrollElement.scrollTop + scrollElement.clientHeight >= scrollElement.scrollHeight - 20
        setShowScrollButton(!isAtBottom && scrollElement.scrollHeight > scrollElement.clientHeight)
      }
      
      // Initial check
      handleScroll()
      
      scrollElement.addEventListener('scroll', handleScroll)
      return () => scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [messages])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await aiAssistance.processChatRequest({
        selectedText: selectedText || '',
        userRequest: inputValue,
        fullDocument: content
      })

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data,
        sender: 'ai',
        timestamp: new Date(),
        latexSuggestion: response.data
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI chat request failed:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptSuggestion = (messageId: string, suggestion: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isAccepted: true } : msg
    ))
    
    if (cursorPosition !== undefined) {
      onApplySuggestion(suggestion, cursorPosition)
    } else {
      onApplySuggestion(suggestion)
    }
  }

  const handleRejectSuggestion = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isAccepted: false } : msg
    ))
  }

  const handleCopySuggestion = async (suggestion: string) => {
    try {
      await navigator.clipboard.writeText(suggestion)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const renderMessage = (message: ChatMessage) => {
    const isAI = message.sender === 'ai'
    const hasSuggestion = message.latexSuggestion && message.latexSuggestion.trim()

    return (
      <div key={message.id} className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
        <div className={`max-w-[80%] ${isAI ? 'bg-muted' : 'bg-primary text-primary-foreground'} rounded-lg p-3`}>
          <div className="text-sm whitespace-pre-wrap">{message.text}</div>
          
          {hasSuggestion && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  LaTeX Suggestion
                </Badge>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopySuggestion(message.latexSuggestion!)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {message.isAccepted === undefined && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAcceptSuggestion(message.id, message.latexSuggestion!)}
                        className="h-6 w-6 p-0 text-green-600"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRejectSuggestion(message.id)}
                        className="h-6 w-6 p-0 text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {message.isAccepted === true && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      Applied
                    </Badge>
                  )}
                  {message.isAccepted === false && (
                    <Badge variant="destructive" className="text-xs">
                      Rejected
                    </Badge>
                  )}
                </div>
              </div>
              <div className="bg-background border rounded p-2 font-mono text-xs overflow-x-auto">
                {message.latexSuggestion}
              </div>
            </div>
          )}
          
          <div className={`text-xs mt-2 ${isAI ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5" />
          AI Chat Assistant
        </div>
        {selectedTextDisplay && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs mb-2">
              Selected Text
            </Badge>
            <div className="text-sm bg-muted p-2 rounded border max-h-20 overflow-y-auto">
              "{selectedTextDisplay}"
            </div>
          </div>
        )}
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 flex flex-col relative min-h-0">
        <div 
          className="flex-1 overflow-y-scroll px-4" 
          ref={scrollAreaRef}
          style={{ 
            height: '100%',
            maxHeight: '100%'
          }}
        >
          <div className="py-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Lightbulb className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Start a conversation with AI to get LaTeX editing help</p>
                <p className="text-xs mt-1">Select text and ask for changes, or request new content</p>
              </div>
            )}
            {messages.map(renderMessage)}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {showScrollButton && (
          <Button
            onClick={scrollToBottom}
            size="sm"
            className="absolute bottom-4 right-4 h-8 w-8 p-0 rounded-full shadow-lg z-10"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Input Area */}
      <div className="flex-shrink-0 border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI to help with LaTeX editing..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !inputValue.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

