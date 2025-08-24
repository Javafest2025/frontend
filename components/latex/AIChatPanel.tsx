'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  MessageSquare, 
  Copy, 
  Check, 
  X,
  Lightbulb,
  FileText,
  ChevronDown,
  MapPin,
  Edit3,
  Trash2
} from 'lucide-react'
import { latexApi } from '@/lib/api/latex-service'

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  latexSuggestion?: string
  isAccepted?: boolean
  position?: number
  selectionRange?: { from: number; to: number }
  actionType?: 'add' | 'replace' | 'delete' | 'modify'
}

interface AIChatPanelProps {
  content: string
  onApplySuggestion: (suggestion: string, position?: number, actionType?: string, selectionRange?: { from: number; to: number }) => void
  selectedText?: { text: string; from: number; to: number }
  cursorPosition?: number
  onSetPositionMarker?: (position: number, label: string) => void
  onClearPositionMarkers?: () => void
}

export function AIChatPanel({ 
  content, 
  onApplySuggestion, 
  selectedText, 
  cursorPosition,
  onSetPositionMarker,
  onClearPositionMarkers
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTextDisplay, setSelectedTextDisplay] = useState<string>('')
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [positionMarkers, setPositionMarkers] = useState<Array<{ position: number; label: string; blinking: boolean }>>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Update selected text display when prop changes
  useEffect(() => {
    if (selectedText && selectedText.text && selectedText.text.trim()) {
      setSelectedTextDisplay(selectedText.text.trim())
    } else {
      setSelectedTextDisplay('')
    }
  }, [selectedText])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && scrollAreaRef.current) {
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
        timestamp: new Date(),
        position: cursorPosition,
        selectionRange: selectedText ? { from: selectedText.from, to: selectedText.to } : undefined
      }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Enhanced context for AI
      const context = {
        selectedText: selectedText || '',
        userRequest: inputValue,
        fullDocument: content,
        cursorPosition: cursorPosition || 0,
        positionMarkers: positionMarkers.map(m => ({ position: m.position, label: m.label }))
      }

      const response = await latexApi.processChatRequest({
        selectedText: selectedText?.text || '',
        userRequest: inputValue,
        fullDocument: content
      })

      // Parse AI response to extract action type and position
      const { actionType, suggestion, position, label } = parseAIResponse(response.data, inputValue, cursorPosition, selectedText)

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data,
        sender: 'ai',
        timestamp: new Date(),
        latexSuggestion: suggestion,
        actionType,
        position,
        selectionRange: selectedText ? { from: selectedText.from, to: selectedText.to } : undefined
      }

      setMessages(prev => [...prev, aiMessage])

      // Set position marker if AI suggests a specific location
      if (position !== undefined && label && onSetPositionMarker) {
        onSetPositionMarker(position, label)
        setPositionMarkers(prev => [...prev, { position, label, blinking: true }])
      }

    } catch (error) {
      console.error('AI chat request failed:', error)
      
      // Provide more specific error information
      let errorText = 'Sorry, I encountered an error processing your request. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorText = 'Unable to connect to AI service. Please check if the backend is running.'
        } else if (error.message.includes('Failed to process chat request')) {
          errorText = 'AI service is currently unavailable. Please try again later.'
        } else {
          errorText = `Error: ${error.message}`
        }
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Parse AI response to understand what action to take
  const parseAIResponse = (response: string, userRequest: string, cursorPos?: number, selectedText?: string) => {
    const lowerRequest = userRequest.toLowerCase()
    const lowerResponse = response.toLowerCase()
    
    let actionType: 'add' | 'replace' | 'delete' | 'modify' = 'add'
    let suggestion = response
    let position = cursorPos
    let label = 'AI Edit'

    // Determine action type based on user request and context
    if (selectedText && selectedText.text) {
      // If there's selected text, default to replace mode
      if (lowerRequest.includes('replace') || lowerRequest.includes('change') || lowerRequest.includes('modify') || 
          lowerRequest.includes('make') || lowerRequest.includes('convert') || lowerRequest.includes('table')) {
        actionType = 'replace'
        label = 'Replace Selection'
        // Use cursor position from selection
        position = selectedText.from
      } else if (lowerRequest.includes('delete') || lowerRequest.includes('remove')) {
        actionType = 'delete'
        label = 'Delete Selection'
      } else {
        // Default to replace when there's selection
        actionType = 'replace'
        label = 'Replace Selection'
        position = selectedText.from
      }
    } else {
      // No selection, determine action type from request
      if (lowerRequest.includes('replace') || lowerRequest.includes('change') || lowerRequest.includes('modify')) {
        actionType = 'replace'
      } else if (lowerRequest.includes('delete') || lowerRequest.includes('remove')) {
        actionType = 'delete'
      } else if (lowerRequest.includes('add') || lowerRequest.includes('insert')) {
        actionType = 'add'
        label = 'Add Content'
      } else if (lowerRequest.includes('make') || lowerRequest.includes('convert')) {
        actionType = 'modify'
        label = 'Modify Content'
      }
    }

    // Extract LaTeX code from response if present
    const latexMatch = response.match(/```latex\n([\s\S]*?)\n```/)
    if (latexMatch) {
      suggestion = latexMatch[1]
    } else {
      // If no code blocks, try to extract just the LaTeX part
      // Look for content after "Here's the modified LaTeX code:" or similar
      const modifiedMatch = response.match(/(?:Here's the modified LaTeX code:|Here's the LaTeX code:|Modified code:)\s*\n([\s\S]*?)(?:\n\n|$)/i)
      if (modifiedMatch) {
        suggestion = modifiedMatch[1].trim()
      }
    }

    return { actionType, suggestion, position, label }
  }

  const handleAcceptSuggestion = (messageId: string, suggestion: string, actionType?: string, position?: number, selectionRange?: { from: number; to: number }) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isAccepted: true } : msg
    ))
    
    // Apply the suggestion based on action type
    onApplySuggestion(suggestion, position, actionType, selectionRange)
    
    // Clear blinking position markers after applying
    setPositionMarkers(prev => prev.map(m => ({ ...m, blinking: false })))
  }

  const handleRejectSuggestion = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isAccepted: false } : msg
    ))
  }

  const handleCopySuggestion = async (suggestion: string) => {
    try {
      await navigator.clipboard.writeText(suggestion)
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

  const clearPositionMarkers = () => {
    setPositionMarkers([])
    onClearPositionMarkers?.()
  }

  const renderMessage = (message: ChatMessage) => {
    const isAI = message.sender === 'ai'
    const hasSuggestion = message.latexSuggestion && message.latexSuggestion.trim()

    return (
      <div key={message.id} className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
                 <div className={`max-w-[80%] ${isAI ? 'bg-muted' : 'bg-primary text-primary-foreground'} rounded-lg p-3`}>
           {/* For AI messages, only show the explanation text, not the full response */}
           <div className="text-sm whitespace-pre-wrap">
             {isAI && message.latexSuggestion ? 
               // If there's a suggestion, show only the explanation part
               message.text.split('```')[0].trim() || message.text
               : 
               // For user messages or AI messages without suggestions, show full text
               message.text
             }
           </div>
          
                     {hasSuggestion && (
             <div className="mt-3">
               {/* Action buttons - positioned above the suggestion box */}
               <div className="flex flex-wrap items-center gap-2 mb-3">
                 <Badge variant="outline" className="text-xs">
                   <FileText className="h-3 w-3 mr-1" />
                   LaTeX Suggestion
                 </Badge>
                 {message.actionType && (
                   <Badge variant="secondary" className="text-xs">
                     {message.actionType.toUpperCase()}
                   </Badge>
                 )}
                 {message.position !== undefined && (
                   <Badge variant="outline" className="text-xs">
                     <MapPin className="h-3 w-3 mr-1" />
                     Pos: {message.position}
                   </Badge>
                 )}
                 
                 {/* Action buttons in a separate row if needed */}
                 <div className="flex items-center gap-1 ml-auto">
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
                         onClick={() => handleAcceptSuggestion(
                           message.id, 
                           message.latexSuggestion!, 
                           message.actionType,
                           message.position,
                           message.selectionRange
                         )}
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
               
               {/* LaTeX suggestion box */}
               <div className="bg-background border rounded p-3 font-mono text-xs overflow-x-auto">
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
        
        {/* Context Information */}
        <div className="mt-2 space-y-2">
          {selectedTextDisplay && (
            <div>
              <Badge variant="secondary" className="text-xs mb-2">
                Selected Text
              </Badge>
              <div className="text-sm bg-muted p-2 rounded border max-h-20 overflow-y-auto">
                "{selectedTextDisplay}"
              </div>
            </div>
          )}
          
          {cursorPosition !== undefined && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                Cursor: {cursorPosition}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetPositionMarker?.(cursorPosition, 'Cursor Position')}
                className="h-6 text-xs"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Mark
              </Button>
            </div>
          )}

          {positionMarkers.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {positionMarkers.length} Position(s) Marked
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearPositionMarkers}
                  className="h-6 text-xs text-red-600"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
              
              {/* Show individual position markers */}
              <div className="space-y-1">
                {positionMarkers.map((marker, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span className={marker.blinking ? 'animate-pulse' : ''}>
                        {marker.label}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Pos: {marker.position}
                      </Badge>
                    </div>
                    {marker.blinking && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
                <div className="mt-4 space-y-2 text-xs">
                  <p className="font-medium">Try these commands:</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>• "Make this table 5x5 instead of 4x4"</p>
                    <p>• "Add a new section here"</p>
                    <p>• "Replace this paragraph with better wording"</p>
                    <p>• "Delete this line"</p>
                  </div>
                </div>
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

