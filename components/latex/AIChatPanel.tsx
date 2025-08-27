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
  Trash2,
  XCircle
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
  onCreateAiSuggestion?: (type: 'replace' | 'add' | 'delete', from: number, to: number, originalText: string, suggestedText: string, explanation?: string) => void
  pendingAiRequest?: boolean
  setPendingAiRequest?: React.Dispatch<React.SetStateAction<boolean>>
  onPreviewInlineDiff?: (previews: Array<{
    id: string
    type: 'add' | 'delete' | 'replace'
    from: number
    to: number
    content: string
    originalContent?: string
  }>) => void
  onClearSelection?: () => void
}

export function AIChatPanel({ 
  content, 
  onApplySuggestion, 
  selectedText, 
  cursorPosition,
  onSetPositionMarker,
  onClearPositionMarkers,
  onCreateAiSuggestion,
  pendingAiRequest = false,
  setPendingAiRequest,
  onPreviewInlineDiff,
  onClearSelection
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTextDisplay, setSelectedTextDisplay] = useState<string>('')
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [positionMarkers, setPositionMarkers] = useState<Array<{ position: number; label: string; blinking: boolean }>>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Update selected text display when prop changes
  // Only show selection if it's explicitly provided (after Add to Chat click)
  useEffect(() => {
    console.log('🎨🎨🎨 === AIChatPanel selectedText prop changed === 🎨🎨🎨')
    console.log('selectedText prop received:', selectedText)
    console.log('selectedText exists:', !!selectedText)
    console.log('selectedText.text exists:', !!selectedText?.text)
    console.log('selectedText.text value:', selectedText?.text)
    console.log('selectedText.text.trim() exists:', !!selectedText?.text?.trim())
    console.log('selectedText.text.trim() value:', selectedText?.text?.trim())
    
    if (selectedText && selectedText.text && selectedText.text.trim()) {
      console.log('✅ Valid selectedText received, setting display')
      setSelectedTextDisplay(selectedText.text.trim())
      console.log('📝 Setting selectedTextDisplay to:', selectedText.text.trim())
    } else {
      console.log('❌ No valid selectedText, clearing display')
      setSelectedTextDisplay('')
      console.log('🧹 Clearing selectedTextDisplay')
    }
    console.log('🏁 === AIChatPanel selectedText effect completed ===')
  }, [selectedText])

  // Cleanup selected text display when component unmounts or tab changes
  useEffect(() => {
    return () => {
      setSelectedTextDisplay('')
    }
  }, [])

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

  // Create inline diff previews instead of modifying content
  const createInlineDiffPreviews = (
    actionType: 'replace' | 'add' | 'delete',
    from: number,
    to: number,
    originalText: string,
    suggestion: string,
    suggestionId: string
  ) => {
    console.log('🎯 === CREATING INLINE DIFF PREVIEWS ===')
    console.log('Action type:', actionType)
    console.log('Selection range:', { from, to, originalText })
    console.log('Suggestion:', suggestion)
    
    const previews: Array<{
      id: string
      type: 'add' | 'delete' | 'replace'
      from: number
      to: number
      content: string
      originalContent?: string
    }> = []
    
    switch (actionType) {
      case 'replace':
        previews.push({
          id: suggestionId,
          type: 'replace',
          from,
          to,
          content: suggestion,
          originalContent: originalText
        })
        break
        
      case 'add':
        previews.push({
          id: suggestionId,
          type: 'add',
          from,
          to: from, // Insert at cursor position
          content: suggestion
        })
        break
        
      case 'delete':
        previews.push({
          id: suggestionId,
          type: 'delete',
          from,
          to,
          content: originalText,
          originalContent: originalText
        })
        break
    }
    
    console.log('Created previews:', previews)
    
    // Send previews to editor
    onPreviewInlineDiff?.(previews)
    setActiveSuggestionId(suggestionId)
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
    setPendingAiRequest?.(true)

    try {
      const response = await latexApi.processChatRequest({
        selectedText: selectedText?.text || '',
        userRequest: inputValue,
        fullDocument: content
      })

      // Parse AI response for Cursor-like integration
      const { actionType, suggestion, position, explanation } = parseAIResponseForCursor(response.data, inputValue, selectedText)

      // Create AI message with only explanation (no duplicate LaTeX code)
      const explanationOnly = extractExplanation(response.data)
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: explanationOnly,
        sender: 'ai',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])

      // Create inline diff preview directly in editor
      if (suggestion && onPreviewInlineDiff) {
        console.log('=== CREATING INLINE DIFF PREVIEW ===')
        console.log('Action type:', actionType)
        console.log('Position range:', { from: position.from, to: position.to })
        console.log('Original text:', position.originalText)
        console.log('Suggested text:', suggestion)
        console.log('Explanation:', explanation)

        // Create preview overlay without modifying content
        createInlineDiffPreviews(
          actionType,
          position.from,
          position.to,
          position.originalText,
          suggestion,
          aiMessage.id
        )
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
      setPendingAiRequest?.(false)
    }
  }

  // Parse AI response to understand what action to take
  const parseAIResponse = (response: string, userRequest: string, cursorPos?: number, selectedText?: { text: string; from: number; to: number }) => {
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

  // New parsing functions for Cursor-like experience
  const parseAIResponseForCursor = (response: string, userRequest: string, selectedText?: { text: string; from: number; to: number }) => {
    const lowerRequest = userRequest.toLowerCase()
    const lowerResponse = response.toLowerCase()
    
    // Determine action type based on context - prioritize selection over cursor
    let actionType: 'replace' | 'add' | 'delete' = 'add'
    
    if (selectedText && selectedText.text && selectedText.text.trim()) {
      // If there's selected text, analyze the request more carefully
      if (lowerRequest.includes('replace') || lowerRequest.includes('make') || lowerRequest.includes('table') || 
          lowerRequest.includes('change') || lowerRequest.includes('modify') || lowerRequest.includes('convert') ||
          lowerRequest.includes('instead') || lowerRequest.includes('rather than')) {
        actionType = 'replace'
      } else if (lowerRequest.includes('delete') || lowerRequest.includes('remove')) {
        actionType = 'delete'
      } else if (lowerRequest.includes('add') || lowerRequest.includes('insert')) {
        actionType = 'add'
      } else {
        // Default to replace when there's selection and the request seems to want modification
        if (lowerRequest.includes('this') || lowerRequest.includes('that') || lowerRequest.includes('here')) {
          actionType = 'replace'
        }
      }
    } else {
      // No selection, determine action type from request
      if (lowerRequest.includes('replace') || lowerRequest.includes('change') || lowerRequest.includes('modify')) {
        actionType = 'replace'
      } else if (lowerRequest.includes('delete') || lowerRequest.includes('remove')) {
        actionType = 'delete'
      } else if (lowerRequest.includes('add') || lowerRequest.includes('insert')) {
        actionType = 'add'
      } else if (lowerRequest.includes('make') || lowerRequest.includes('convert')) {
        actionType = 'add' // Default to add for creation requests
      }
    }

    // Extract LaTeX code from response
    const suggestion = extractLatexCode(response)
    
    // Determine position based on selection or cursor - ALWAYS prioritize selection
    const position = {
      from: selectedText && selectedText.text ? selectedText.from : (cursorPosition || 0),
      to: selectedText && selectedText.text ? selectedText.to : (cursorPosition || 0),
      originalText: selectedText && selectedText.text ? selectedText.text : ''
    }

    // Extract explanation (text before LaTeX code)
    const explanation = extractExplanation(response)

    console.log('=== PARSED AI RESPONSE ===')
    console.log('Action type:', actionType)
    console.log('Selection:', selectedText)
    console.log('Position:', position)
    console.log('Suggestion length:', suggestion.length)

    return { actionType, suggestion, position, explanation }
  }

  const extractLatexCode = (response: string): string => {
    // Try to extract LaTeX code from ```latex blocks
    const latexMatch = response.match(/```latex\s*([\s\S]*?)\s*```/i)
    if (latexMatch) {
      return latexMatch[1].trim()
    }
    
    // Try to extract LaTeX code from ``` blocks
    const codeMatch = response.match(/```\s*([\s\S]*?)\s*```/)
    if (codeMatch) {
      return codeMatch[1].trim()
    }
    
    // Look for content after common phrases that indicate LaTeX code
    const phrasePatterns = [
      /(?:Here's the modified LaTeX code:|Here's the LaTeX code:|Modified code:|LaTeX code:|Code:)\s*\n([\s\S]*?)(?:\n\n|$)/i,
      /(?:Here's the code:|The code is:|Code:)\s*\n([\s\S]*?)(?:\n\n|$)/i
    ]
    
    for (const pattern of phrasePatterns) {
      const match = response.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    
    // Look for common LaTeX patterns
    const patterns = [
      /\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g,
      /\\documentclass[\s\S]*?\\end\{document\}/g,
      /\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/g
    ]
    
    for (const pattern of patterns) {
      const match = response.match(pattern)
      if (match) {
        return match[0].trim()
      }
    }
    
    // If no LaTeX blocks found, look for LaTeX commands in the response
    if (response.includes('\\') && (response.includes('begin{') || response.includes('hline') || response.includes('&'))) {
      // Try to extract everything that looks like LaTeX
      const lines = response.split('\n')
      const latexLines = lines.filter(line => 
        line.includes('\\') || line.includes('&') || line.includes('hline') || 
        line.includes('begin{') || line.includes('end{') ||
        line.includes('tabular') || line.includes('document')
      )
      if (latexLines.length > 0) {
        return latexLines.join('\n').trim()
      }
    }
    
    // If still no LaTeX found, try to extract lines that contain LaTeX-like content
    const lines = response.split('\n')
    const potentialLatexLines = lines.filter(line => {
      const trimmed = line.trim()
      return trimmed.length > 0 && (
        trimmed.includes('\\') || 
        trimmed.includes('&') || 
        trimmed.includes('hline') ||
        trimmed.includes('tabular') ||
        trimmed.includes('document') ||
        trimmed.includes('begin') ||
        trimmed.includes('end')
      )
    })
    
    if (potentialLatexLines.length > 0) {
      return potentialLatexLines.join('\n').trim()
    }
    
    return response // Fallback to full response
  }

  const extractExplanation = (response: string): string => {
    // Extract everything before the first LaTeX code block
    const beforeLatex = response.split('```')[0].trim()
    if (beforeLatex && beforeLatex.length > 10) {
      return beforeLatex
    }
    
    // If no clear separation, try to find explanatory text
    const lines = response.split('\n')
    const explanationLines = lines.filter(line => 
      !line.includes('\\') && !line.includes('```') && 
      !line.includes('&') && !line.includes('hline') &&
      line.trim().length > 0
    ).slice(0, 3) // Take first few explanation lines
    
    if (explanationLines.length > 0) {
      return explanationLines.join(' ').trim()
    }
    
    return 'AI suggestion generated' // Fallback
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

  // Clear active suggestion state when preview is accepted/rejected
  const clearActiveSuggestion = () => {
    setActiveSuggestionId(null)
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

  const handleClearSelection = () => {
    onClearSelection?.()
    setSelectedTextDisplay('')
    setActiveSuggestionId(null)
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
    <div className="h-full flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5" />
          AI Chat Assistant
        </div>
        
        {/* Context Information */}
        <div className="mt-2 space-y-2">
          {selectedTextDisplay && (
            <div className="relative group">
              <Badge variant="secondary" className="text-xs mb-2">
                Selected Text
              </Badge>
              <div className="text-sm bg-muted p-2 rounded border max-h-20 overflow-y-auto">
                "{selectedTextDisplay}"
              </div>
              {/* Hover cancel button */}
              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
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
      
      {/* Messages Area - Fixed height constraints */}
      <div className="flex-1 flex flex-col relative min-h-0 overflow-hidden">
        <div 
          className="flex-1 overflow-y-auto px-4 max-h-0" 
          ref={scrollAreaRef}
          style={{ minHeight: 0, flex: '1 1 auto' }}
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
      
      {/* Inline Diff Preview Controls */}
      {activeSuggestionId && (
        <div className="flex-shrink-0 border-t bg-blue-50 p-3">
          <div className="text-center mb-2">
            <span className="text-sm font-medium text-blue-800">
              🎯 AI Suggestion Preview Active
            </span>
            <p className="text-xs text-blue-600 mt-1">
              Hover over highlighted text in the editor to accept/reject changes
            </p>
          </div>
          <div className="flex space-x-2 justify-center">
            <Button 
              onClick={clearActiveSuggestion}
              size="sm"
              variant="outline"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              Clear Preview
            </Button>
          </div>
        </div>
      )}
      
      {/* Input Area - Always visible at bottom */}
      <div className="flex-shrink-0 border-t p-4 bg-card">
        {/* Selection Confirmation Display - GitHub Copilot style */}
        {selectedTextDisplay && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">
                {selectedTextDisplay.split('\n').filter(line => line.trim().length > 0).length === 1 
                  ? `Selected: "${selectedTextDisplay.trim().slice(0, 50)}${selectedTextDisplay.trim().length > 50 ? '...' : ''}"`
                  : `Selected ${selectedTextDisplay.split('\n').filter(line => line.trim().length > 0).length} lines`
                }
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-5 w-5 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
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

