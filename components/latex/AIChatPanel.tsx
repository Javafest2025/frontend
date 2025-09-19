'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Send, 
  Copy, 
  Check, 
  X,
  Lightbulb,
  FileText,
  ChevronDown,
  MapPin,
  Edit3,
  Trash2,
  XCircle,
  Bot,
  User,
  Loader2,
  Zap,
  Code,
  BookOpen,
  History,
  RotateCcw,
  RefreshCw,
  Sparkles
} from 'lucide-react'
import { latexApi } from '@/lib/api/latex-service'
import type { LatexAiChatSession, LatexAiChatMessage, CreateLatexChatMessageRequest } from '@/types/chat'

// Using LatexAiChatMessage type from chat.ts instead of local interface

interface AIChatPanelProps {
  content: string
  onApplySuggestion: (suggestion: string, position?: number, actionType?: string, selectionRange?: { from: number; to: number }) => void
  selectedText?: { text: string; from: number; to: number }
  selectedPapers?: any[]
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
  getInsertAnchor?: () => number
  onCollapse?: () => void
  
  // New props for file-specific chat
  documentId?: string
  projectId?: string
  onContentChange?: (newContent: string) => void
}

export function AIChatPanel({ 
  content, 
  onApplySuggestion, 
  selectedText,
  selectedPapers = [],
  cursorPosition,
  onSetPositionMarker,
  onClearPositionMarkers,
  onCreateAiSuggestion,
  pendingAiRequest = false,
  setPendingAiRequest,
  onPreviewInlineDiff,
  onClearSelection,
  getInsertAnchor,
  onCollapse,
  documentId,
  projectId,
  onContentChange
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<LatexAiChatMessage[]>([])
  const [chatSession, setChatSession] = useState<LatexAiChatSession | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTextDisplay, setSelectedTextDisplay] = useState<string>('')
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [positionMarkers, setPositionMarkers] = useState<Array<{ position: number; label: string; blinking: boolean }>>([])
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  
  // Store content checkpoints for restore functionality
  const [contentCheckpoints, setContentCheckpoints] = useState<Array<{
    id: string
    content: string
    timestamp: string
    description: string
  }>>([])

  // Load chat session when documentId changes
  useEffect(() => {
    if (documentId && projectId) {
      // Clear previous messages when switching documents
      setMessages([])
      loadChatSession()
    }
  }, [documentId, projectId])

  // Listen for suggestion acceptance events from editor
  useEffect(() => {
    const handleSuggestionAccepted = (event: CustomEvent) => {
      const { originalContent, newContent, suggestionText } = event.detail
      
      // Create checkpoint
      const checkpoint = {
        id: `checkpoint-${Date.now()}`,
        content: originalContent,
        timestamp: new Date().toISOString(),
        description: `Before applying: ${suggestionText.substring(0, 50)}...`
      }
      setContentCheckpoints(prev => [checkpoint, ...prev.slice(0, 9)])

      // Persist checkpoint in backend if possible
      if (documentId && chatSession?.id) {
        latexApi.createCheckpoint(documentId, chatSession.id, {
          checkpointName: checkpoint.description,
          contentBefore: originalContent,
          contentAfter: newContent,
          messageId: undefined,
          setCurrent: true
        }).catch(err => console.warn('Failed to persist checkpoint:', err))
      }

      // Add restore checkpoint message
      const restoreMessage: LatexAiChatMessage = {
        id: `restore-${checkpoint.id}`,
        sessionId: chatSession?.id || '',
        messageType: 'AI',
        content: '✅ Suggestion applied successfully! You can restore the previous version if needed.',
        isApplied: false,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        hasLatexSuggestion: false,
        hasSelectionRange: false
      }
      
      setMessages(prev => [...prev, restoreMessage])

      // Clear active preview banner if any
      setActiveSuggestionId(null)
    }

    window.addEventListener('suggestion-accepted', handleSuggestionAccepted as EventListener)
    
    return () => {
      window.removeEventListener('suggestion-accepted', handleSuggestionAccepted as EventListener)
    }
  }, [chatSession?.id])

  // Also clear active suggestion when inline diff is accepted/rejected directly in editor
  useEffect(() => {
    const clearActive = () => setActiveSuggestionId(null)
    const onAccept = () => clearActive()
    const onReject = () => clearActive()
    document.addEventListener('acceptInlineDiff', onAccept as EventListener)
    document.addEventListener('rejectInlineDiff', onReject as EventListener)
    return () => {
      document.removeEventListener('acceptInlineDiff', onAccept as EventListener)
      document.removeEventListener('rejectInlineDiff', onReject as EventListener)
    }
  }, [])

  // Helper: load checkpoints from backend and hydrate UI with restore buttons
  const loadAndHydrateCheckpoints = async () => {
    if (!documentId) return
    try {
      const resp = await latexApi.getCheckpoints(documentId)
      const cps = Array.isArray(resp.data) ? resp.data : []

      // Map to local checkpoint cache
      const mapped = cps.map((cp: any) => ({
        id: String(cp.id),
        content: String(cp.contentBefore ?? ''),
        timestamp: String(cp.createdAt ?? new Date().toISOString()),
        description: String(cp.displayName ?? cp.checkpointName ?? 'Checkpoint')
      }))
      setContentCheckpoints(mapped)

      if (mapped.length > 0) {
        // For each checkpoint, ensure a restore message exists
        const existingIds = new Set(messages.map(m => String(m.id)))
        const restoreMsgs: LatexAiChatMessage[] = mapped
          .filter(cp => !existingIds.has(`restore-${cp.id}`))
          .map(cp => ({
            id: `restore-${cp.id}`,
            sessionId: chatSession?.id || '',
            messageType: 'AI',
            content: '✅ Suggestion applied successfully! You can restore the previous version if needed.',
            isApplied: false,
            sender: 'ai',
            timestamp: cp.timestamp,
            createdAt: cp.timestamp,
            hasLatexSuggestion: false,
            hasSelectionRange: false
          }))

        if (restoreMsgs.length > 0) {
          const merged = [...messages, ...restoreMsgs]
          // Sort by timestamp ascending if available
          merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          setMessages(merged)
        }
      }
    } catch (err) {
      console.warn('Failed to load checkpoints:', err)
    }
  }

  const loadChatSession = async () => {
    if (!documentId || !projectId) return
    
    setIsLoadingSession(true)
    try {
      // Try to get existing session from database
      const response = await latexApi.getChatSession(documentId, projectId)
      setChatSession(response.data)
      console.log('Loaded existing chat session:', response.data)

      // Prefer messages returned with the session (already ordered by createdAt)
      const sessionMessages = Array.isArray(response.data?.messages) ? response.data.messages : []
      if (sessionMessages.length > 0) {
        setMessages(sessionMessages)
        console.log('Initialized chat with session messages:', sessionMessages.length)
      } else {
        // Fallback: try loading history endpoint
        const historyLoaded = await loadChatHistory()
        // Only show welcome message if no history was loaded
        if (!historyLoaded) {
          await initializeWithWelcomeMessage(response.data)
        }
      }
      // Regardless, hydrate checkpoints for restore buttons
      await loadAndHydrateCheckpoints()
    } catch (error) {
      console.log('No existing session found, will try to load history anyway')
      
      // Even if session creation fails, try to load chat history
      // In case there are existing messages in the database
      const historyLoaded = await loadChatHistory()
      
      // Create a simple session state as fallback only if no messages were loaded
      if (!historyLoaded) {
        const simpleSession: LatexAiChatSession = {
          id: `session-${documentId}`,
          documentId: documentId,
          projectId: projectId,
          sessionTitle: 'LaTeX AI Chat',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          messageCount: 0,
          lastMessageTime: new Date().toISOString(),
          messages: [],
          checkpoints: []
        }
        
        setChatSession(simpleSession)
        await initializeWithWelcomeMessage(simpleSession)
      }
    } finally {
      setIsLoadingSession(false)
    }
  }

  const initializeWithWelcomeMessage = async (session: LatexAiChatSession) => {
    // Initialize with welcome message only if no existing messages
    const welcomeMessage: LatexAiChatMessage = {
      id: 'welcome',
      sessionId: session.id,
      messageType: 'AI',
      content: "Welcome to **LaTeXAI**! 🚀 I'm your specialized LaTeX assistant for this document.\n\n" +
              "**I can help you with:**\n" +
              "• Writing and formatting LaTeX documents\n" +
              "• Fixing compilation errors and syntax issues\n" +
              "• Suggesting mathematical notation and environments\n" +
              "• Optimizing document structure and styling\n" +
              "• Using packages and custom commands\n" +
              "• Converting content to LaTeX format\n\n" +
              "**💡 How to use:**\n" +
              "• Select text in your document and ask me anything about LaTeX!\n" +
              "• I can add, modify, or improve your LaTeX content\n" +
              "• Ask me to explain LaTeX concepts or fix errors\n\n" +
              "Select text in your document and ask me anything about LaTeX!",
      isApplied: false,
      sender: 'ai',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      hasLatexSuggestion: false,
      hasSelectionRange: false
    }
    setMessages([welcomeMessage])
    console.log('Initialized simple chat session with welcome message for document:', documentId)
  }

  // Update selected text display when prop changes
  useEffect(() => {
    if (selectedText && selectedText.text && selectedText.text.trim()) {
      setSelectedTextDisplay(selectedText.text.trim())
    } else {
      setSelectedTextDisplay('')
    }
  }, [selectedText])

  // Autosize function for textarea
  const autosize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    const next = Math.min(192, el.scrollHeight) // ~6-8 lines cap
    el.style.height = next + 'px'
  }

  useEffect(() => { 
    autosize() 
  }, [inputValue])

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

  // Load chat history when document changes
  useEffect(() => {
    if (documentId) {
      loadChatHistory().then(() => loadAndHydrateCheckpoints())
    } else {
      setMessages([])
      setChatSession(null)
    }
  }, [documentId])

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
        // Emit a single replace preview with both original and suggested content
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

    // Guard against race conditions as suggested
    if (!documentId || !chatSession?.id || isLoadingSession) {
      console.log('Waiting for chat session to be ready...', { documentId, chatSessionId: chatSession?.id, isLoadingSession })
      return
    }

    // Debug logging to verify IDs
    console.log('POSTing with documentId=', documentId, ' chatSessionId=', chatSession?.id)

    setInputValue('')
    setIsLoading(true)
    setPendingAiRequest?.(true)

    const userMessage: LatexAiChatMessage = {
      id: `user-${Date.now()}`,
      sessionId: chatSession?.id || '',
      messageType: 'USER',
      content: inputValue,
      isApplied: false,
      sender: 'user',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      hasLatexSuggestion: false,
      hasSelectionRange: false
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage])

    try {
      // Use backend to persist the user message and generate the AI response in one call
      if (documentId) {
        const response = await latexApi.sendChatMessage(documentId, {
          content: inputValue,
          selectionRangeFrom: selectedText?.from,
          selectionRangeTo: selectedText?.to,
          cursorPosition: cursorPosition,
          selectedText: selectedText?.text || '',
          fullDocument: content || '',
          userRequest: inputValue
        })

        // The backend returns the AI message DTO
        const serverAiMessage = response.data as unknown as LatexAiChatMessage
        setMessages(prev => [...prev, serverAiMessage])

        // Create inline diff preview if AI provided LaTeX suggestion
        if (serverAiMessage?.latexSuggestion && serverAiMessage.latexSuggestion.trim().length > 0 && onPreviewInlineDiff) {
          // Prefer server actionType; otherwise, if there is a real selection, default to REPLACE.
          const hasSelection =
            !!(selectedText?.text && selectedText.text.trim().length > 0) &&
            selectedText?.from !== undefined &&
            selectedText?.to !== undefined &&
            selectedText.from !== selectedText.to;

          const defaultAct: 'add' | 'replace' | 'delete' = hasSelection ? 'replace' : 'add';
          const act =
            (serverAiMessage.actionType?.toLowerCase?.() as 'add' | 'replace' | 'delete') ||
            defaultAct;

          // Compute the correct range:
          const from =
            serverAiMessage.selectionRangeFrom ??
            (hasSelection ? selectedText!.from : (cursorPosition ?? 0));

          const to =
            serverAiMessage.selectionRangeTo ??
            (act === 'add'
              ? from // add is an insertion point
              : (hasSelection ? selectedText!.to : from)); // replace/delete need the real end

          createInlineDiffPreviews(
            act,
            from,
            to,
            selectedText?.text || '',
            serverAiMessage.latexSuggestion,
            String(serverAiMessage.id)
          );
        }
      }

    } catch (error) {
      console.error('AI chat request failed:', error)
      
      // Add error message to local state
      const errorMessage: LatexAiChatMessage = {
        id: `error-${Date.now()}`,
        sessionId: chatSession?.id || '',
        messageType: 'AI',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        isApplied: false,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        hasLatexSuggestion: false,
        hasSelectionRange: false
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setPendingAiRequest?.(false)
    }
  }

  const loadChatHistory = async (): Promise<boolean> => {
    if (!documentId) {
      console.log('❌ loadChatHistory: No documentId provided')
      return false
    }
    
    console.log('🔍 loadChatHistory: Loading chat history for documentId:', documentId)
    
    try {
      // Try to load chat history from database
      const response = await latexApi.getChatHistory(documentId)
      console.log('📡 loadChatHistory: API response:', response)
      
      if (response.data && response.data.length > 0) {
        setMessages(response.data)
        console.log('✅ loadChatHistory: Loaded chat history from database:', response.data.length, 'messages')
        response.data.forEach((msg, index) => {
          console.log(`  Message ${index + 1}:`, {
            id: msg.id,
            type: msg.messageType,
            content: msg.content.substring(0, 50) + '...'
          })
        })
        return true
      } else {
        // No messages found, keep current state (welcome message)
        console.log('🔍 loadChatHistory: No chat history found in database')
        return false
      }
    } catch (error) {
      console.error('❌ loadChatHistory: Failed to load chat history from database:', error)
      return false
    }
  }

  const createCheckpointBeforeApply = async (messageId: string | number, suggestion: string) => {
    // For now, just apply the suggestion directly since checkpoint endpoints are not available yet
    try {
      if (onContentChange) {
        const newContent = applySuggestionToContent(content, suggestion, selectedText)
        onContentChange(newContent)
        console.log('Applied suggestion to content:', String(messageId))
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error)
    }
  }

  const applySuggestionToContent = (currentContent: string, suggestion: string, selection?: { text: string; from: number; to: number }): string => {
    if (!selection) {
      // Add at end if no selection
      return currentContent + '\n' + suggestion
    }

    // Replace selected text with suggestion
    return currentContent.slice(0, selection.from) + suggestion + currentContent.slice(selection.to)
  }

  // Parse AI response to understand what action to take
  const parseAIResponse = (response: string, userRequest: string, cursorPos?: number, selectedText?: { text: string; from: number; to: number }) => {
    const lowerRequest = userRequest.toLowerCase()
    const lowerResponse = response.toLowerCase()
    
    // Determine if there is a real selection
    const hasSelection =
      !!(selectedText?.text && selectedText.text.trim().length > 0) &&
      selectedText?.from !== undefined &&
      selectedText?.to !== undefined &&
      selectedText.from !== selectedText.to;
    
    // Default action type based on selection
    let actionType: 'add' | 'replace' | 'delete' | 'modify' = hasSelection ? 'replace' : 'add'
    let suggestion = response
    let position = cursorPos
    let label = 'AI Edit'

    // Override based on explicit request keywords
    if (lowerRequest.includes('replace') || lowerRequest.includes('change') || lowerRequest.includes('modify') || 
        lowerRequest.includes('make') || lowerRequest.includes('convert') || lowerRequest.includes('table')) {
      actionType = 'replace'
      label = 'Replace Selection'
      // Use cursor position from selection
      position = hasSelection ? selectedText!.from : cursorPos
    } else if (lowerRequest.includes('delete') || lowerRequest.includes('remove')) {
      actionType = 'delete'
      label = 'Delete Selection'
    } else if (lowerRequest.includes('add') || lowerRequest.includes('insert')) {
      actionType = 'add'
      label = 'Add Content'
    } else if (hasSelection) {
      // Default to replace when there's selection
      actionType = 'replace'
      label = 'Replace Selection'
      position = selectedText!.from
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
    
    // Determine if there is a real selection
    const hasSelection =
      !!(selectedText?.text && selectedText.text.trim().length > 0) &&
      selectedText?.from !== undefined &&
      selectedText?.to !== undefined &&
      selectedText.from !== selectedText.to;
    
    // Default action type based on selection
    let actionType: 'replace' | 'add' | 'delete' = hasSelection ? 'replace' : 'add'
    
    // Override based on explicit request keywords
    if (lowerRequest.includes('replace') || lowerRequest.includes('make') || lowerRequest.includes('table') || 
        lowerRequest.includes('change') || lowerRequest.includes('modify') || lowerRequest.includes('convert') ||
        lowerRequest.includes('instead') || lowerRequest.includes('rather than')) {
      actionType = 'replace'
    } else if (lowerRequest.includes('delete') || lowerRequest.includes('remove')) {
      actionType = 'delete'
    } else if (lowerRequest.includes('add') || lowerRequest.includes('insert')) {
      actionType = 'add'
    } else if (hasSelection && (lowerRequest.includes('this') || lowerRequest.includes('that') || lowerRequest.includes('here'))) {
      // Default to replace when there's selection and the request seems to want modification
      actionType = 'replace'
    }

    // Extract LaTeX code from response
    const suggestion = extractLatexCode(response)
    
    // Determine position based on selection or cursor - ALWAYS prioritize selection
    const position = {
      from: hasSelection ? selectedText!.from : (getInsertAnchor?.() ?? cursorPosition ?? 0),
      to: hasSelection ? selectedText!.to : (getInsertAnchor?.() ?? cursorPosition ?? 0),
      originalText: hasSelection ? selectedText!.text : ''
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
    const safeResponse = String(response ?? '')
    
    // Extract everything before the first LaTeX code block
    const beforeLatex = safeResponse.split('```')[0].trim()
    if (beforeLatex && beforeLatex.length > 10) {
      return beforeLatex
    }
    
    // If no clear separation, try to find explanatory text
    const lines = safeResponse.split('\n')
    const explanationLines = lines.filter(line => 
      !line.includes('\\') && !line.includes('```') && 
      !line.includes('&') && !line.includes('hline') &&
      String(line ?? '').trim().length > 0
    ).slice(0, 3) // Take first few explanation lines
    
    if (Array.isArray(explanationLines) && explanationLines.length > 0) {
      return explanationLines.join(' ').trim()
    }
    
    return 'AI suggestion generated' // Fallback
  }

  const handleAcceptSuggestion = async (messageId: string | number, suggestion: string, actionType?: string, position?: number, selectionRange?: { from: number; to: number }) => {
    try {
      // Store current content as a checkpoint before applying suggestion
      const checkpoint = {
        id: `checkpoint-${Date.now()}`,
        content: content,
        timestamp: new Date().toISOString(),
        description: `Before applying suggestion: ${suggestion.substring(0, 50)}...`
      }
      setContentCheckpoints(prev => [checkpoint, ...prev.slice(0, 9)]) // Keep last 10 checkpoints

      // Apply the suggestion locally
      if (onApplySuggestion) {
        onApplySuggestion(suggestion, position, actionType, selectionRange)
      }

      // Mark suggestion as applied in backend
      await latexApi.applySuggestion(String(messageId), content + suggestion)

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isApplied: true } : msg
      ))
      
      // Add a "Restore Checkpoint" message to chat
      const restoreMessage: LatexAiChatMessage = {
        id: `restore-${checkpoint.id}`, // Store checkpoint ID in message ID for reference
        sessionId: chatSession?.id || '',
        messageType: 'AI',
        content: 'Suggestion applied successfully! You can restore the previous version if needed.',
        isApplied: false,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        hasLatexSuggestion: false,
        hasSelectionRange: false
      }
      
      setMessages(prev => [...prev, restoreMessage])
      
      // Clear blinking position markers after applying
      setPositionMarkers(prev => prev.map(m => ({ ...m, blinking: false })))
    } catch (error) {
      console.error('Failed to accept suggestion:', error)
    }
  }

  const handleRejectSuggestion = async (messageId: string | number) => {
    try {
      // The backend doesn't need to track rejections specifically
      // Just update local state to show as rejected
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isApplied: false } : msg
      ))
    } catch (error) {
      console.error('Failed to reject suggestion:', error)
    }
  }

  // Handle restoring content from checkpoint
  const handleRestoreCheckpoint = async (checkpointId: string) => {
    try {
      // Try backend restore first
      const resp = await latexApi.restoreToCheckpoint(checkpointId)
      const restoredContent = String(resp.data ?? '')
      if (restoredContent && onContentChange) {
        onContentChange(restoredContent)
      } else {
        // Fallback to local cache
        const checkpoint = contentCheckpoints.find(cp => cp.id === checkpointId)
        if (checkpoint && onContentChange) {
          onContentChange(checkpoint.content)
        }
      }

      const confirmMessage: LatexAiChatMessage = {
        id: `restored-${Date.now()}`,
        sessionId: chatSession?.id || '',
        messageType: 'AI',
        content: `✅ Content restored from checkpoint.`,
        isApplied: false,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        hasLatexSuggestion: false,
        hasSelectionRange: false
      }
      setMessages(prev => [...prev, confirmMessage])
    } catch (err) {
      console.error('Failed to restore checkpoint:', err)
    }
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  const handleQuickAction = async (prompt: string) => {
    if (isLoading) return
    
    // Add context about selection if there's any
    let finalPrompt = prompt
    if (selectedTextDisplay) {
      finalPrompt = `${prompt}\n\nSelected text: "${selectedTextDisplay}"`
    }
    
    // Set the prompt as input value
    setInputValue(finalPrompt)
    
    // Send the message directly with the final prompt
    setTimeout(async () => {
      // Call the existing send message logic
      await handleSendMessage()
    }, 100)
  }

  const renderMessage = (message: LatexAiChatMessage) => {
    const isAI = message.messageType === 'AI'
    const hasSuggestion = message.hasLatexSuggestion && message.latexSuggestion && message.latexSuggestion.trim()
    const safeText = String(message.content ?? '')

    return (
      <div key={message.id} className={`flex gap-3 mb-6 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAI 
            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg' 
            : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg'
        }`}>
          {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>

        {/* Message Content */}
        <div className={`flex-1 max-w-[85%] ${isAI ? 'text-left' : 'text-right'}`}>
          {/* Message Bubble */}
          <div className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
            isAI
              ? 'bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 text-slate-800 dark:from-slate-800 dark:to-slate-700 dark:text-slate-100 dark:border-slate-600'
              : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white'
          }`}>
            {/* Message Text with Markdown-like styling */}
            <div className="text-sm leading-relaxed">
              {safeText.split('\n').map((line, index) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return (
                    <div key={index} className={`font-bold text-base mb-2 ${
                      isAI ? 'text-orange-600 dark:text-orange-400' : 'text-blue-100'
                    }`}>
                      {line.slice(2, -2)}
                    </div>
                  )
                } else if (line.startsWith('• ')) {
                  return (
                    <div key={index} className={`flex items-start gap-2 mb-1 ${
                      isAI ? 'text-slate-700 dark:text-slate-300' : 'text-blue-50'
                    }`}>
                      <span className={`mt-1 w-1 h-1 rounded-full ${
                        isAI ? 'bg-orange-400' : 'bg-blue-200'
                      }`} />
                      <span className="text-sm">{line.slice(2)}</span>
                    </div>
                  )
                } else if (line.startsWith('✅ ') || line.startsWith('📖 ')) {
                  return (
                    <div key={index} className={`mb-2 p-2 rounded-lg ${
                      isAI 
                        ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
                        : 'bg-blue-400/20 text-blue-100'
                    }`}>
                      <span className="text-sm">{line}</span>
                    </div>
                  )
                } else if (line.trim()) {
                  return (
                    <div key={index} className="mb-1">
                      <span className="text-sm">{line}</span>
                    </div>
                  )
                }
                return <div key={index} className="mb-1" />
              })}
            </div>
          </div>

          {/* LaTeX Suggestion Box */}
          {hasSuggestion && (
            <div className="mt-3">
              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200 text-orange-700">
                  <Zap className="h-3 w-3 mr-1" />
                  LaTeX Suggestion
                </Badge>
                {message.actionType && (
                  <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                    {message.actionType.toUpperCase()}
                  </Badge>
                )}
                {message.selectionRangeFrom !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    Pos: {message.selectionRangeFrom}
                  </Badge>
                )}
                
                {/* Action buttons - Only copy button, Accept/Reject moved to editor */}
                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopySuggestion(message.latexSuggestion!)}
                    className="h-6 w-6 p-0 hover:bg-orange-100"
                    title="Copy LaTeX code"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {message.isApplied && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      Applied
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* LaTeX suggestion code box */}
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-xs overflow-x-auto shadow-lg">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                  <Code className="h-3 w-3 text-orange-400" />
                  <span className="text-orange-400 text-xs font-semibold">LaTeX Code</span>
                </div>
                <pre className="text-green-400 whitespace-pre-wrap leading-relaxed">
                  {String(message.latexSuggestion ?? '')}
                </pre>
              </div>
            </div>
          )}
          
          {/* Restore Checkpoint Button for restore messages */}
          {String(message.id).startsWith('restore-') && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const checkpointId = String(message.id).replace('restore-', '')
                  handleRestoreCheckpoint(checkpointId)
                }}
                className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore Checkpoint
              </Button>
            </div>
          )}
          
          {/* Timestamp */}
          <div className={`text-xs mt-2 ${
            isAI ? 'text-slate-500' : 'text-blue-300'
          } ${isAI ? 'text-left' : 'text-right'}`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-lg font-bold">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
              <Code className="h-4 w-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              LaTeXAI
            </span>
            <Badge variant="outline" className="text-xs">
              Specialized Assistant
            </Badge>
          </div>
          
          {/* Collapse Button */}
          {onCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCollapse}
              className="h-8 w-8 p-0 hover:bg-muted"
              title="Collapse AI Assistant"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Context Information */}
        <div className="mt-3 space-y-3">
          {Array.isArray(selectedPapers) && selectedPapers.length > 0 && (
            <div className="text-sm">
              <Badge variant="secondary" className="text-xs mb-2">
                <BookOpen className="h-3 w-3 mr-1" />
                Papers Context ({selectedPapers.length})
              </Badge>
              <div className="bg-muted border border-border p-3 rounded-lg max-h-16 overflow-y-auto">
                <div className="text-xs text-muted-foreground font-medium">
                  {(Array.isArray(selectedPapers) ? selectedPapers : []).map(paper => paper.title).join(', ')}
                </div>
              </div>
            </div>
          )}
          
          {selectedTextDisplay && (
            <div className="relative group">
              <Badge variant="secondary" className="text-xs mb-2 bg-blue-100 text-blue-700 border-blue-300">
                <Edit3 className="h-3 w-3 mr-1" />
                Selected Text
              </Badge>
              <div className="text-sm bg-blue-50 border border-blue-200 p-2 rounded-lg">
                <span className="text-blue-800 font-mono text-xs truncate block">"{selectedTextDisplay}"</span>
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
          
          {/* Removed cursor position display to save space */}

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
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto p-4"
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
              <div className="flex gap-3 mb-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg">
                  <Code className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4 shadow-md">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                  <span className="text-sm text-orange-700 font-medium">LaTeXAI is analyzing your request...</span>
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
      
      {/* Inline Diff Preview Controls removed per UX; accept/reject lives in-editor */}
      
      {/* AI Tools Bar - Always visible above input */}
      <div className="sticky bottom-0 bg-background border-t border-border">
        {/* Quick AI Actions */}
        <div className="p-3 pb-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Improve this LaTeX code for better formatting and readability")}
              disabled={isLoading}
              className="h-7 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700"
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              Improve
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Fix any LaTeX syntax errors or compilation issues in this code")}
              disabled={isLoading}
              className="h-7 text-xs bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border-red-200 text-red-700"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Fix
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Explain this LaTeX code and what it does")}
              disabled={isLoading}
              className="h-7 text-xs bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200 text-green-700"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              Explain
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Optimize this LaTeX code for better performance and structure")}
              disabled={isLoading}
              className="h-7 text-xs bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border-purple-200 text-purple-700"
            >
              <Zap className="h-3 w-3 mr-1" />
              Optimize
            </Button>
          </div>
        </div>

        {/* Selection Confirmation Display */}
        {selectedTextDisplay && (
          <div className="mx-3 mb-2 p-2 bg-muted border border-border rounded-md text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="font-medium">
                {(() => {
                  const safeText = String(selectedTextDisplay ?? '')
                  const lines = safeText.split('\n').filter(line => String(line ?? '').trim().length > 0)
                  return lines.length === 1 
                    ? `Selected: "${safeText.trim().slice(0, 50)}${safeText.trim().length > 50 ? '...' : ''}"`
                    : `Selected ${lines.length} lines`
                })()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-5 w-5 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 pt-0">
          <div className="flex items-end gap-2">
            <div className="flex-1 rounded-2xl border border-border bg-card">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask LaTeXAI to help with your document..."
                disabled={isLoading}
                className="w-full resize-none bg-transparent px-4 py-3 outline-none
                           placeholder:text-muted-foreground text-sm max-h-48 min-h-[44px]
                           scrollbar-thin"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim() || isLoadingSession || !chatSession?.id}
              className="h-11 w-11 shrink-0 rounded-xl text-white disabled:opacity-50
                         bg-gradient-to-r from-rose-400 to-orange-400
                         hover:from-rose-500 hover:to-orange-500 focus:outline-none
                         focus:ring-2 focus:ring-rose-300 flex items-center justify-center"
              aria-label="Send"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

