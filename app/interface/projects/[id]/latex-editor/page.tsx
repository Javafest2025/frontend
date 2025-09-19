"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  FileText, 
  Plus, 
  Save, 
  Eye, 
  MessageSquare,
  Sun,
  Moon,
  Play,
  Folder,
  Search,
  MoreHorizontal,
  Lightbulb,
  Download,
  RefreshCw,
  Trash2,
  GitBranch,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  PanelRightOpen,
  PanelRightClose,
  Code,
  Globe
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useSettings } from "@/contexts/SettingsContext"
import { projectsApi } from "@/lib/api/project-service"
import { latexApi, sha256Hex, startCitationCheck, streamCitationJob, getCitationResult, cancelCitationJob, startCitationCheckWithStreaming, pollCitationJob } from "@/lib/api/latex-service"
import { AIChatPanel } from "@/components/latex/AIChatPanel"
import { AIAssistancePanel } from "@/components/latex/AIAssistancePanel"
import { LaTeXPDFViewer } from "@/components/latex/LaTeXPDFViewer"
import PDFViewer from "@/components/latex/PDFViewer"
import { EnhancedLatexEditor } from "@/components/latex/EnhancedLatexEditor"
import { PapersSelector } from "@/components/latex/PapersSelector"
import { CenterTabs } from "@/components/latex/CenterTabs"
import { TabProviderWrapper } from "@/components/latex/TabProviderWrapper"
import { ViewModeSelector } from "@/components/latex/ViewModeSelector"
import { CitationIssuesPanel } from "@/components/latex/CitationIssuesPanel"
import type { OpenItem, TabViewState } from "@/types/tabs"
import type { Paper } from "@/types/websearch"
import type { CitationIssue, CitationCheckJob } from "@/types/citations"

interface Project {
  id: string
  name: string
  description?: string
  status: string
  updatedAt: string
}

interface Document {
  id: string
  title: string
  content: string
  documentType: string
  updatedAt: string
  projectId: string
  version?: number
}

interface ProjectOverviewPageProps {
  params: Promise<{
    id: string
  }>
}

export default function LaTeXEditorPage({ params }: ProjectOverviewPageProps) {
  const { settings, updateSetting } = useSettings()
  const [projectId, setProjectId] = useState<string>("")
  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const [compiledContent, setCompiledContent] = useState('')
  const [pdfPreviewUrls, setPdfPreviewUrls] = useState<Map<string, string>>(new Map())
  const [isCompiling, setIsCompiling] = useState(false)
  
  // Get PDF URL for current document
  const pdfPreviewUrl = currentDocument ? pdfPreviewUrls.get(currentDocument.id) || '' : ''
  
  // Ref to track current URLs for cleanup
  const pdfUrlsRef = useRef<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedText, setSelectedText] = useState<{ text: string; from: number; to: number }>({ text: '', from: 0, to: 0 })
  const [cursorPosition, setCursorPosition] = useState<number | undefined>(undefined)
  const [lastCursorPos, setLastCursorPos] = useState<number | null>(null)
  const [positionMarkers, setPositionMarkers] = useState<Array<{ position: number; label: string; blinking: boolean }>>([])

  const [showAddToChat, setShowAddToChat] = useState(false)
  const [tempSelectedText, setTempSelectedText] = useState<string>('')
  const [tempSelectionPositions, setTempSelectionPositions] = useState<{ from: number; to: number }>({ from: 0, to: 0 })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [currentVersion, setCurrentVersion] = useState<number>(1)
  const [versionHistory, setVersionHistory] = useState<any[]>([])
  const [isViewingVersion, setIsViewingVersion] = useState<boolean>(false)
  const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(false)
  const [lastVersionCallTime, setLastVersionCallTime] = useState<number>(0)
  
  // Papers Context State
  const [selectedPapers, setSelectedPapers] = useState<any[]>([])
  const [handleOpenPaper, setHandleOpenPaper] = useState<((paper: Paper) => void) | null>(null)

  // Tab System State (will be managed by TabProvider)
  const [initialTexItem, setInitialTexItem] = useState<OpenItem | null>(null)
  // Sidebar Collapse State
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true)

  // AI Suggestions State for Cursor-like Experience
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    id: string
    type: 'replace' | 'add' | 'delete'
    from: number
    to: number
    originalText: string
    suggestedText: string
    explanation?: string
  }>>([])
  const [pendingAiRequest, setPendingAiRequest] = useState(false)

  // Inline diff previews state
  const [inlineDiffPreviews, setInlineDiffPreviews] = useState<Array<{
    id: string
    type: 'add' | 'delete' | 'replace'
    from: number
    to: number
    content: string
    originalContent?: string
  }>>([])

  // New state to track when selection should be shown in chat
  const [selectionAddedToChat, setSelectionAddedToChat] = useState(false)

  // Citation checking state
  const [citationBusy, setCitationBusy] = useState(false)
  const [currentCitationJob, setCurrentCitationJob] = useState<CitationCheckJob | null>(null)
  const [showCitationPanel, setShowCitationPanel] = useState(false)
  const [runWebCheck, setRunWebCheck] = useState(true)
  const [citationTimeoutWarning, setCitationTimeoutWarning] = useState(false)
  
  // Enhanced citation state for content hash and SSE streaming
  const [lastContentHash, setLastContentHash] = useState<string | null>(null)
  const [contentHashStale, setContentHashStale] = useState(false)
  const [contentHashDismissed, setContentHashDismissed] = useState(false)
  const [sseConnection, setSseConnection] = useState<{ close: () => void } | null>(null)

  // Debug state changes
  useEffect(() => {
    console.log('🔄 State Change - selectionAddedToChat:', selectionAddedToChat)
  }, [selectionAddedToChat])

  useEffect(() => {
    console.log('🔄 State Change - selectedText:', selectedText)
  }, [selectedText])

  useEffect(() => {
    console.log('🔄 State Change - tempSelectedText:', tempSelectedText)
  }, [tempSelectedText])

  useEffect(() => {
    console.log('🔄 State Change - showAddToChat:', showAddToChat)
  }, [showAddToChat])

  // Debug citation state changes
  useEffect(() => {
    console.log('🔎 Citation State Change - citationBusy:', citationBusy)
  }, [citationBusy])

  useEffect(() => {
    console.log('🔎 Citation State Change - currentCitationJob:', currentCitationJob)
  }, [currentCitationJob])

  useEffect(() => {
    console.log('🔎 Citation State Change - selectedPapers:', selectedPapers)
  }, [selectedPapers])

  // Update ref when URLs change
  useEffect(() => {
    pdfUrlsRef.current = pdfPreviewUrls
  }, [pdfPreviewUrls])

  // Cleanup PDF URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up all PDF URLs on component unmount
      pdfUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, []) // Empty dependency array - only run on mount/unmount

  // Load project data
  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params
      console.log('Resolved params:', resolvedParams)
      setProjectId(resolvedParams.id)
      console.log('Setting projectId to:', resolvedParams.id)
      
      try {
        // Load project details
        const projectData = await projectsApi.getProject(resolvedParams.id)
        setProject(projectData)
        console.log('Project loaded:', projectData)
        
        // Load documents for this project
        console.log('Calling loadDocuments with projectId:', resolvedParams.id)
        await loadDocuments(resolvedParams.id)
      } catch (error) {
        console.error('Error loading project:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [params])

  // Debug: Log documents state changes
  useEffect(() => {
    console.log('Documents state changed:', documents)
    console.log('Current document:', currentDocument)
  }, [documents, currentDocument])

  // Ensure documents are loaded when projectId is available
  useEffect(() => {
    if (projectId && documents.length === 0) {
      console.log('ProjectId available but no documents, loading documents...')
      loadDocuments(projectId)
    }
  }, [projectId, documents.length])

  // Load existing citations when document changes
  useEffect(() => {
    const loadExistingCitations = async () => {
      if (currentDocument?.id && !citationBusy) {
        try {
          console.log('🔄 Loading existing citations for document:', currentDocument.id)
          const citationResult = await getCitationResult(currentDocument.id)
          console.log('🔄 Existing citation result:', citationResult)
          
          if (citationResult && citationResult.summary) {
            console.log('🔄 Found existing citation job:', citationResult)
            setCurrentCitationJob(citationResult)
          } else {
            console.log('🔄 No existing citations found')
            setCurrentCitationJob(null)
          }
        } catch (error) {
          console.log('🔄 Error loading citations:', error)
          // If there's an error, reset the state
          setCurrentCitationJob(null)
        }
      }
    }

    loadExistingCitations()
  }, [currentDocument?.id, citationBusy])

  // Clear version history when switching documents to prevent stale data
  useEffect(() => {
    if (currentDocument?.id) {
      console.log('Document changed, clearing version history')
      setVersionHistory([])
      setIsViewingVersion(false)
      setCurrentVersionIndex(0) // Reset version navigation index
    }
  }, [currentDocument?.id])

  // Keyboard shortcuts for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + I to toggle AI sidebar
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'I') {
        event.preventDefault()
        setIsRightSidebarCollapsed(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Monitor content changes for stale citation detection (debounced)
  useEffect(() => {
    const checkContentHash = async () => {
      if (editorContent && currentCitationJob?.summary?.contentHash) {
        const currentHash = await sha256Hex(editorContent)
        if (currentHash !== currentCitationJob.summary.contentHash) {
          setContentHashStale(true)
          setContentHashDismissed(false) // Reset dismissed state on new changes
          console.log('🔶 Content hash mismatch - results are stale')
        } else {
          setContentHashStale(false)
          setContentHashDismissed(false)
        }
      }
    }
    
    // Debounce content hash checking to avoid excessive notifications during typing
    const timeoutId = setTimeout(checkContentHash, 2000) // 2 second delay
    return () => clearTimeout(timeoutId)
  }, [editorContent, currentCitationJob?.summary?.contentHash])

  // Cleanup SSE connection on unmount or document change
  useEffect(() => {
    return () => {
      if (sseConnection) {
        console.log('🔌 Closing SSE connection')
        sseConnection.close()
        setSseConnection(null)
      }
    }
  }, [currentDocument?.id])

  // Listen for selection changes and clearing from the editor
  // But don't automatically set selectedText - only show Add to Chat button
  useEffect(() => {
    const handleSelectionChange = (event: Event) => {
      const customEvent = event as CustomEvent
      const selection = customEvent.detail as { text: string; from: number; to: number }
      console.log('=== SELECTION EVENT RECEIVED ===')
      console.log('Selection event:', selection)
      
      // Only set tempSelectedText for showing Add to Chat button
      // Don't set selectedText until Add to Chat is clicked
      if (selection.text && selection.text.trim()) {
        setTempSelectedText(selection.text)
        setShowAddToChat(true)
        console.log('Set tempSelectedText to:', selection.text)
        console.log('Set showAddToChat to:', true)
      } else {
        // If text is empty, clear everything
        setTempSelectedText('')
        setShowAddToChat(false)
        console.log('Selection is empty, clearing tempSelectedText and hiding button')
      }
    }

    const handleSelectionCleared = () => {
      console.log('=== SELECTION CLEARED EVENT ===')
      setTempSelectedText('')
      setShowAddToChat(false)
      // Don't clear selectedText here - it should only be cleared when explicitly requested
    }

    // Also handle when tempSelectedText becomes empty
    const handleEmptySelection = () => {
      console.log('=== EMPTY SELECTION DETECTED ===')
      setTempSelectedText('')
      setShowAddToChat(false)
    }

    document.addEventListener('latex-selection-change', handleSelectionChange)
    document.addEventListener('latex-selection-cleared', handleSelectionCleared)

    return () => {
      document.removeEventListener('latex-selection-change', handleSelectionChange)
      document.removeEventListener('latex-selection-cleared', handleSelectionCleared)
    }
  }, [])



  const loadDocuments = async (projectId: string) => {
    try {
      console.log('Loading documents for project:', projectId)
      const response = await latexApi.getDocumentsByProjectId(projectId)
      console.log('API Response:', response)
      
      if (response.data && response.data.length > 0) {
        console.log('Documents found:', response.data.length, 'documents:', response.data)
        
        // Debug: Log the content of each document
        response.data.forEach((doc, index) => {
          console.log(`Document ${index + 1}:`, {
            id: doc.id,
            title: doc.title,
            contentLength: doc.content ? doc.content.length : 0,
            contentPreview: doc.content ? doc.content.substring(0, 100) + '...' : 'No content',
            fullContent: doc.content
          })
        })
        
        setDocuments(response.data)
        setCurrentDocument(response.data[0])
        setEditorContent(response.data[0].content)
        setCurrentVersion((response.data[0] as any).version || 1)
        setIsViewingVersion(false)
        console.log('Documents loaded successfully, current document:', response.data[0].title)
        console.log('Current document content:', response.data[0].content)
      } else {
        console.log('No documents found, showing landing page')
        setDocuments([])
        setCurrentDocument(null)
        setEditorContent('')
      }
    } catch (error: any) {
      console.error('Failed to load documents:', error)
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        projectId: projectId
      })
      // Show landing page on error
      setDocuments([])
      setCurrentDocument(null)
      setEditorContent('')
    }
  }

  const handleSave = useCallback(async () => {
    if (!currentDocument?.id) {
      console.error('No document selected for saving')
      return
    }

    try {
      await latexApi.updateDocument({
        documentId: currentDocument.id,
        content: editorContent
      })
      
      // Update local document state
      setCurrentDocument(prev => prev ? { ...prev, content: editorContent, updatedAt: new Date().toISOString() } : null)
      setDocuments(prev => prev.map(doc => 
        doc.id === currentDocument.id ? { ...doc, content: editorContent, updatedAt: new Date().toISOString() } : doc
      ))
      
      console.log('Document saved successfully')
      
      // Reset editing state after successful save
      setIsEditing(false)
      
      // Reset version viewing state since we're now viewing the current content
      setIsViewingVersion(false)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }, [currentDocument?.id, editorContent])

  // Callback to receive the openPaper function from TabProvider context
  const onHandleOpenPaper = useCallback((openPaperFn: (paper: Paper) => void) => {
    setHandleOpenPaper(() => openPaperFn);
  }, [])

  const handlePapersLoad = useCallback((papers: any[]) => {
    setSelectedPapers(papers.filter(paper => paper.isLatexContext))
    console.log('Papers loaded for LaTeX context:', papers.filter(paper => paper.isLatexContext).length)
  }, [])

  // Test if PDF blob is valid
  const testPdfBlob = useCallback(async (blob: Blob): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer
          const uint8Array = new Uint8Array(arrayBuffer)
          
          // Check if it starts with PDF magic number
          const isPdf = uint8Array.length >= 4 && 
                       uint8Array[0] === 0x25 && // %
                       uint8Array[1] === 0x50 && // P
                       uint8Array[2] === 0x44 && // D
                       uint8Array[3] === 0x46    // F
          
          console.log('PDF validation:', { 
            size: blob.size, 
            type: blob.type, 
            isPdf, 
            firstBytes: Array.from(uint8Array.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ')
          })
          
          resolve(isPdf)
        } catch (error) {
          console.error('PDF validation error:', error)
          resolve(false)
        }
      }
      reader.onerror = () => {
        console.error('PDF validation failed to read blob')
        resolve(false)
      }
      reader.readAsArrayBuffer(blob)
    })
  }, [])

  const handleCompile = useCallback(async () => {
    if (isCompiling || !currentDocument) {
      console.log('Compilation already in progress or no document selected, skipping...')
      return
    }
    
    setIsCompiling(true)
    try {
      console.log('Starting PDF compilation for document:', currentDocument.title)
      console.log('LaTeX content length:', editorContent.length)
      console.log('LaTeX content preview:', editorContent.substring(0, 200) + '...')
      
      // Use PDF compilation instead of HTML
      const pdfBlob = await latexApi.compileLatexToPdf({ latexContent: editorContent })
      console.log('PDF compilation succeeded:', pdfBlob)
      console.log('PDF blob size:', pdfBlob.size, 'bytes')
      console.log('PDF blob type:', pdfBlob.type)
      
      // Validate the PDF blob
      const isValidPdf = await testPdfBlob(pdfBlob)
      if (!isValidPdf) {
        throw new Error('Generated file is not a valid PDF')
      }
      
      // Create a URL for the PDF blob with proper MIME type
      const pdfUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }))
      console.log('Created PDF blob URL for document', currentDocument.id, ':', pdfUrl)
      
      // Store PDF URL by document ID
      setPdfPreviewUrls(prev => {
        const newMap = new Map(prev)
        // Clean up old URL if it exists
        const oldUrl = newMap.get(currentDocument.id)
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl)
        }
        newMap.set(currentDocument.id, pdfUrl)
        return newMap
      })
      
      // Set compiled content to show PDF preview
      setCompiledContent(`
        <div style="padding: 20px; background: white; color: black;">
          <h1>LaTeX PDF Preview</h1>
          <p style="color: green;">✓ PDF compiled successfully!</p>
          <p>Your LaTeX document has been compiled to PDF. Use the preview tab to view it.</p>
          <p><strong>Document:</strong> ${currentDocument.title}</p>
          <p><strong>PDF Size:</strong> ${(pdfBlob.size / 1024).toFixed(1)} KB</p>
          <p><strong>PDF Type:</strong> ${pdfBlob.type}</p>
        </div>
      `)
      
    } catch (error) {
      console.error('PDF compilation failed:', error)
      
      // Extract detailed error information
      let errorMessage = 'Unknown error'
      let detailedError = ''
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Try to extract LaTeX compilation details from backend error
        if (errorMessage.includes('Output:')) {
          const outputMatch = errorMessage.match(/Output: (.+)/)
          if (outputMatch) {
            detailedError = outputMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/<EOL>/g, '\n')
              .trim()
          }
        }
      }
      
      setCompiledContent(`
        <div style="padding: 20px; background: white; color: black;">
          <h1>LaTeX Compilation Error</h1>
          <p style="color: red;">✗ PDF compilation failed</p>
          <p><strong>Document:</strong> ${currentDocument?.title || 'Unknown'}</p>
          <p><strong>Error:</strong> ${errorMessage}</p>
          ${detailedError ? `
            <details style="margin-top: 15px;">
              <summary style="cursor: pointer; font-weight: bold; color: #d73a49;">📋 Compilation Output</summary>
              <pre style="background: #f6f8fa; padding: 15px; border-radius: 4px; border-left: 4px solid #d73a49; margin-top: 10px; font-size: 12px; overflow-x: auto; white-space: pre-wrap;">${detailedError}</pre>
            </details>
          ` : ''}
          <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
            <p style="margin: 0; color: #856404;"><strong>💡 Common Issues:</strong></p>
            <ul style="margin: 5px 0 0 20px; color: #856404;">
              <li>Missing packages: Make sure all \\usepackage{} declarations are correct</li>
              <li>Syntax errors: Check for missing braces, unescaped characters, or typos</li>
              <li>Document class: Ensure the document class is properly defined</li>
              <li>Special characters: Use proper LaTeX escaping for special symbols</li>
            </ul>
          </div>
          <details style="margin-top: 15px;">
            <summary>Raw LaTeX Content</summary>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; white-space: pre-wrap; font-size: 12px; margin-top: 10px;">${editorContent}</pre>
          </details>
        </div>
      `)
      
      // Clear PDF preview URL on error for current document
      setPdfPreviewUrls(prev => {
        const newMap = new Map(prev)
        const oldUrl = newMap.get(currentDocument.id)
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl)
        }
        newMap.delete(currentDocument.id)
        return newMap
      })
    } finally {
      setIsCompiling(false)
    }
  }, [editorContent, isCompiling, currentDocument])

  // Compile when switching to preview tab
  const handleTabChange = useCallback((value: string) => {
    if (value === 'preview' && editorContent && !pdfPreviewUrl) {
      handleCompile()
    }
  }, [editorContent, pdfPreviewUrl, handleCompile])

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim()
      setTempSelectedText(selectedText)
      setShowAddToChat(true)
    } else {
      setTempSelectedText('')
      setShowAddToChat(false)
    }
  }

  const handleAddToChat = () => {
    console.log('🔥🔥🔥 === HANDLE ADD TO CHAT FUNCTION CALLED === 🔥🔥🔥')
    console.log('Current tempSelectedText:', tempSelectedText)
    console.log('tempSelectedText length:', tempSelectedText.length)
    console.log('tempSelectedText trimmed:', tempSelectedText.trim())
    console.log('showAddToChat state:', showAddToChat)
    
    // Get the current selection from tempSelectedText and set it as selectedText
    if (tempSelectedText.trim()) {
      const text = tempSelectedText.trim()
      console.log('✅ Text is valid, proceeding with Add to Chat')
      console.log('Text to add:', text)
      console.log('Real positions:', tempSelectionPositions)
      
      // Use the real positions from the editor selection
      setSelectedText({ 
        text, 
        from: tempSelectionPositions.from, 
        to: tempSelectionPositions.to 
      })
      setSelectionAddedToChat(true) // Mark that selection should be shown in chat
      console.log('📝 Setting selectedText with REAL positions:', { 
        text, 
        from: tempSelectionPositions.from, 
        to: tempSelectionPositions.to 
      })
      console.log('🎯 Setting selectionAddedToChat to TRUE')
    } else {
      console.log('❌ No valid text to add to chat')
      console.log('tempSelectedText value:', `"${tempSelectedText}"`)
    }
    
    console.log('🧹 Cleaning up button state')
    setShowAddToChat(false)
    setTempSelectedText('')
    
    // Switch to chat tab in the right sidebar
    console.log('🔄 Attempting to switch to chat tab')
    setTimeout(() => {
      const rightSidebarTabs = document.querySelector('[data-radix-tabs-trigger][value="chat"]') as HTMLElement
      if (rightSidebarTabs) {
        console.log('✅ Found chat tab, clicking it')
        rightSidebarTabs.click()
      } else {
        console.log('❌ Chat tab not found')
      }
    }, 100)
    
    console.log('🏁 === HANDLE ADD TO CHAT FUNCTION COMPLETED ===')
  }

  const handleCancelSelection = () => {
    setTempSelectedText('')
    setTempSelectionPositions({ from: 0, to: 0 })
    setShowAddToChat(false)
    setSelectionAddedToChat(false)
    setSelectedText({ text: '', from: 0, to: 0 })
  }

  const handleCursorPosition = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    setCursorPosition(target.selectionStart)
  }

  // Enhanced AI suggestion application with different action types
  const handleApplySuggestion = (suggestion: string, position?: number, actionType?: string, selectionRange?: { from: number; to: number }) => {
    console.log('=== APPLY SUGGESTION DEBUG ===')
    console.log('Suggestion:', suggestion)
    console.log('Position:', position)
    console.log('Action Type:', actionType)
    console.log('Selection Range:', selectionRange)
    console.log('Current selectedText:', selectedText)
    console.log('Editor content length:', editorContent.length)
    
    // Determine if there is a real selection
    const hasSelection =
      !!(selectedText.text && selectedText.text.trim().length > 0) &&
      selectedText.from !== undefined &&
      selectedText.to !== undefined &&
      selectedText.from !== selectedText.to;

    // Normalize action: server wins; otherwise selection ⇒ replace, no selection ⇒ add
    const normalized: 'add' | 'replace' | 'delete' | 'modify' =
      (actionType as any) ?? (hasSelection ? 'replace' : 'add');
    
    let newContent = editorContent

    switch (normalized) {
      case 'replace':
      case 'modify':
        if (hasSelection) {
          // Use the actual selected text positions
          console.log('Replacing selection from', selectedText.from, 'to', selectedText.to)
          const before = editorContent.substring(0, selectedText.from)
          const after = editorContent.substring(selectedText.to)
          newContent = before + suggestion + after
          console.log('New content created with replace')
          // Set cursor to end of inserted content
          setCursorPosition((before + suggestion).length)
        } else if (selectionRange && selectionRange.from !== selectionRange.to) {
          // Fallback to selectionRange if available
          console.log('Using fallback selectionRange:', selectionRange)
          const before = editorContent.substring(0, selectionRange.from)
          const after = editorContent.substring(selectionRange.to)
          newContent = before + suggestion + after
          setCursorPosition((before + suggestion).length)
        } else if (position !== undefined) {
          // Insert at specific position
          console.log('Inserting at position:', position)
          const before = editorContent.substring(0, position)
          const after = editorContent.substring(position)
          newContent = before + suggestion + after
        }
        break

      case 'delete':
        if (hasSelection) {
          // Delete selected text
          const before = editorContent.substring(0, selectedText.from)
          const after = editorContent.substring(selectedText.to)
          newContent = before + after
          setCursorPosition(before.length)
        } else if (selectionRange && selectionRange.from !== selectionRange.to) {
          const before = editorContent.substring(0, selectionRange.from)
          const after = editorContent.substring(selectionRange.to)
          newContent = before + after
          setCursorPosition(before.length)
        }
        break

      case 'add':
      default: {
        // insertion at cursor or provided position
        const insertAt = position ?? (hasSelection ? selectedText.from : (cursorPosition ?? editorContent.length))
        const before = editorContent.substring(0, insertAt)
        const after = editorContent.substring(insertAt)
        newContent = before + suggestion + after
        setCursorPosition((before + suggestion).length)
        break
      }
        break
    }

    console.log('Original content length:', editorContent.length)
    console.log('New content length:', newContent.length)
    console.log('Content changed:', newContent !== editorContent)
    
    setEditorContent(newContent)
    setIsEditing(true)
    
    // Clear selection after applying suggestion
    setSelectedText({ text: '', from: 0, to: 0 })
    setSelectionAddedToChat(false) // Also reset the chat selection state
    setShowAddToChat(false)
    setTempSelectedText('')
  }

  // Position marker management
  const handleSetPositionMarker = (position: number, label: string) => {
    // Now that we have blinking cursor beacon, no need to insert comments
    // Just update the beacon position
    setLastCursorPos(position)
    console.log('Position marker set at:', position, label)
  }

  const handleClearPositionMarkers = () => {
    setPositionMarkers([])
  }

  const handlePDFSelectionToChat = (text: string) => {
    // Handle PDF text selection the same way as editor selection
    console.log('PDF text selected for chat:', text)
    setSelectedText({ text, from: 0, to: text.length })
    setSelectionAddedToChat(true)
    
    // Switch to chat tab
    setTimeout(() => {
      const rightSidebarTabs = document.querySelector('[data-radix-tabs-trigger][value="chat"]') as HTMLElement
      if (rightSidebarTabs) {
        rightSidebarTabs.click()
      }
    }, 100)
  }

  // Citation handlers
  const handleRunCitationCheck = useCallback(async (forceRecheck = false) => {
    if (!currentDocument?.id || !projectId || citationBusy) {
      console.log('Citation check prevented:', { 
        hasDocument: !!currentDocument?.id, 
        hasProjectId: !!projectId, 
        citationBusy 
      })
      return
    }

    try {
      setCitationBusy(true)
      const contentHash = await sha256Hex(editorContent)

      // 1) Try reuse-by-hash (only if not forcing recheck)
      if (!forceRecheck) {
        const latest = await getCitationResult(currentDocument.id).catch(() => null)
        if (latest && latest.summary?.contentHash === contentHash && latest.status === 'DONE') {
          setCurrentCitationJob(latest)
          setShowCitationPanel(true)
          setCitationBusy(false)
          return
        }
      }

      // 2) Clear previous issues/state and open panel immediately to show progress
      setCurrentCitationJob(null)    
      setShowCitationPanel(true)     

      // Close any existing SSE connection
      if (sseConnection) {
        sseConnection.close()
        setSseConnection(null)
      }

      // 3) Start job with streaming
      const { jobId } = await startCitationCheck({
        projectId,
        documentId: currentDocument.id,
        texFileName: currentDocument.title ?? 'main.tex',
        latexContent: editorContent,
        selectedPaperIds: (selectedPapers ?? []).map(p => p.id),
        overwrite: forceRecheck,      // Use forceRecheck parameter for cache override
        runWebCheck,                  // reflects UI toggle
        contentHash
      })

      // 4) Stream progress with enhanced error handling and timeout
      let timeoutId: NodeJS.Timeout | null = null;
      
      // Helper function for polling fallback
      const startPollingFallback = async (jobId: string) => {
        try {
          console.log('🔄 Starting polling fallback for job:', jobId)
          await pollCitationJob(jobId, (snap: CitationCheckJob) => {
            console.log('📊 Polling update:', snap.status, snap.step)
            setCurrentCitationJob(snap)
            
            // Complete when done
            if (snap.status === 'DONE' || snap.status === 'ERROR') {
              setCitationBusy(false)
              console.log('✅ Polling completed with status:', snap.status)
            }
          })
        } catch (pollErr) {
          console.error('❌ Polling fallback failed:', pollErr)
          setCitationBusy(false)
        }
      };
      
      const stream = streamCitationJob(jobId, {
        onStatus: (s) => {
          setCurrentCitationJob(j => ({ ...(j ?? {} as any), jobId, ...s }))
          setCitationTimeoutWarning(false); // Reset warning on progress
          // Reset timeout on each status update
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            console.warn('⏰ Citation check timeout - switching to polling fallback');
            setCitationTimeoutWarning(true);
            setSseConnection(null);
            if (stream) stream.close();
            startPollingFallback(jobId);
          }, 30000); // 30 second timeout
        },
        onIssue:  (issue) => setCurrentCitationJob(j => ({ ...(j ?? {} as any), jobId, issues: [ ...(j?.issues ?? []), issue ] })),
        onSummary:(summary) => {
          if (timeoutId) clearTimeout(timeoutId);
          setCitationTimeoutWarning(false);
          setCurrentCitationJob(j => ({ ...(j ?? {} as any), jobId, summary }))
          setCitationBusy(false)
          if (stream) stream.close()
          setSseConnection(null)
          console.log('✅ Citation check completed via summary event')
        },
        onComplete: () => {
          if (timeoutId) clearTimeout(timeoutId);
          setCitationTimeoutWarning(false);
          console.log('🔌 SSE completion event received - fetching final results');
          // Fetch final results when completion event is received
          getCitationResult(currentDocument.id).then(result => {
            if (result) {
              setCurrentCitationJob(result);
            }
            setCitationBusy(false);
            if (stream) stream.close();
            setSseConnection(null);
            console.log('✅ Citation check completed via completion event');
          }).catch(err => {
            console.error('Failed to fetch final results:', err);
            setCitationBusy(false);
          });
        },
        onError: async (error) => {
          if (timeoutId) clearTimeout(timeoutId);
          console.error('🔌 SSE Stream error occurred, switching to polling fallback:', error)
          setSseConnection(null)
          startPollingFallback(jobId);
        },
      })

      setSseConnection(stream)

    } catch (e) {
      console.error('Failed to start citation check:', e)
      setCitationBusy(false)
    }
  }, [currentDocument?.id, projectId, editorContent, selectedPapers, runWebCheck, citationBusy])

  // Forced recheck handler for the citation panel
  const handleForcedRecheck = useCallback(() => {
    console.log('🔄 Forced recheck triggered from citation panel')
    return handleRunCitationCheck(true) // Force overwrite existing results
  }, [handleRunCitationCheck])

  const handleOpenCitationPanel = useCallback(async () => {
    if (!currentDocument) return
    
    // If no current job, try to get latest result
    if (!currentCitationJob) {
      try {
        const latest = await getCitationResult(currentDocument.id)
        if (latest) {
          setCurrentCitationJob(latest)
        }
      } catch (error) {
        console.log('No previous citation results found:', error)
      }
    }
    
    setShowCitationPanel(true)
    console.log('Opening citation panel with current job:', currentCitationJob)
  }, [currentDocument, currentCitationJob])

  const handleNavigateToIssue = useCallback((issue: CitationIssue) => {
    // Navigate to the line where the citation issue is
    // We can use the lineStart to position the cursor
    const lineContent = editorContent.split('\n')
    let charPosition = 0
    for (let i = 0; i < issue.lineStart - 1; i++) {
      charPosition += lineContent[i].length + 1 // +1 for newline
    }
    setCursorPosition(charPosition + issue.from)
    setShowCitationPanel(false)
    console.log('Navigating to issue at line', issue.lineStart, 'position', charPosition + issue.from)
  }, [editorContent])

  // Create initial tex item when currentDocument changes
  useEffect(() => {
    if (currentDocument) {
      const texItem: OpenItem = {
        id: `tex-${currentDocument.id}`,
        kind: 'tex',
        title: currentDocument.title,
        source: 'document',
        docId: currentDocument.id
      }
      setInitialTexItem(texItem)
    }
  }, [currentDocument])

  // Inline diff preview handlers
  const handlePreviewInlineDiff = (previews: Array<{
    id: string
    type: 'add' | 'delete' | 'replace'
    from: number
    to: number
    content: string
    originalContent?: string
  }>) => {
    console.log('=== PREVIEW INLINE DIFF ===')
    console.log('Previews:', previews)
    setInlineDiffPreviews(previews)
  }

  const handleAcceptInlineDiff = (id: string, mappedFrom?: number, mappedTo?: number) => {
    console.log('=== ACCEPT INLINE DIFF ===')
    console.log('Accepting diff with ID:', id)
    
    const preview = inlineDiffPreviews.find(p => p.id === id)
    if (!preview) {
      console.error('Preview not found:', id)
      return
    }

    // Store current content as checkpoint before applying
    const currentContentCheckpoint = editorContent

    // Prefer mapped positions from the editor (already adjusted across edits)
    const docLen = editorContent.length
    const safeFrom = mappedFrom !== undefined ? Math.max(0, Math.min(mappedFrom, docLen)) : preview.from
    const safeTo = mappedTo !== undefined ? Math.max(0, Math.min(mappedTo, docLen)) : preview.to

    let newContent = editorContent
    switch (preview.type) {
      case 'add':
        // Insert new content at the specified position
        const beforeAdd = editorContent.substring(0, safeFrom)
        const afterAdd = editorContent.substring(safeFrom)
        newContent = beforeAdd + preview.content + afterAdd
        break
        
      case 'delete':
        // Remove content from the specified range
        const beforeDel = editorContent.substring(0, safeFrom)
        const afterDel = editorContent.substring(safeTo)
        newContent = beforeDel + afterDel
        break
        
      case 'replace':
        // Replace content in the specified range
        const beforeReplace = editorContent.substring(0, safeFrom)
        const afterReplace = editorContent.substring(safeTo)
        let next = beforeReplace + preview.content + afterReplace

        // --- De-dupe: remove any remaining copies of the original block elsewhere ---
        const orig = String(preview.originalContent ?? '').trim()
        if (orig.length > 0) {
          // Escape regex special chars, then make whitespace tolerant
          const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const pattern = new RegExp(esc(orig).replace(/\s+/g, '\\s+'), 'g')

          // Where the accepted content now sits
          const applied = preview.content
          const appliedPos = beforeReplace.length
          const appliedEnd = appliedPos + applied.length

          // 1) Strip all other occurrences of the original block
          let stripped = next.replace(pattern, '')

          // 2) Ensure the applied replacement stays (reinsert if the regex swept it)
          const left = stripped.slice(0, appliedPos)
          const right = stripped.slice(appliedPos)
          stripped = left + applied + right

          next = stripped
        }
        // ---------------------------------------------------------------------------

        newContent = next
        break
    }

    setEditorContent(newContent)
    setIsEditing(true)
    
    // Remove only the accepted preview (single-widget model)
    setInlineDiffPreviews(prev => prev.filter(p => p.id !== id))

    // Trigger restore checkpoint functionality in the AI chat
    // This simulates accepting a suggestion to create the checkpoint message
    const suggestionText = preview.content
    if (window.dispatchEvent) {
      const event = new CustomEvent('suggestion-accepted', {
        detail: {
          originalContent: currentContentCheckpoint,
          newContent: newContent,
          suggestionText: suggestionText
        }
      })
      window.dispatchEvent(event)
    }
    
    console.log('Diff accepted and applied with checkpoint created')
  }

  const handleRejectInlineDiff = (id: string, _mappedFrom?: number, _mappedTo?: number) => {
    console.log('=== REJECT INLINE DIFF ===')
    console.log('Rejecting diff with ID:', id)
    
  // Simply remove the preview without applying changes (single-widget model)
  setInlineDiffPreviews(prev => prev.filter(p => p.id !== id))
    
    console.log('Diff rejected and removed')
  }

  // Get insert anchor position (where to add new content)
  const getInsertAnchor = () => {
    return lastCursorPos ?? cursorPosition ?? editorContent.length
  }

  // Enhanced text selection handling
  const handleEditorSelectionChange = (selection: { text: string; from: number; to: number }) => {
    console.log('🔍 === EDITOR SELECTION CHANGE DEBUG ===')
    console.log('Raw selection object:', selection)
    console.log('Selection text:', JSON.stringify(selection.text))
    console.log('Selection from:', selection.from)
    console.log('Selection to:', selection.to)
    console.log('Editor content length:', editorContent.length)
    console.log('Editor content preview:', JSON.stringify(editorContent.substring(Math.max(0, selection.from - 10), selection.to + 10)))
    
    // CRITICAL FIX: Clean editor content of emoji suggestions before using positions
    const cleanContent = editorContent
      .split('\n') // Split into lines
      .filter(line => !line.startsWith('% DELETE:') && !line.startsWith('% ADD:')) // Remove marker lines
      .join('\n') // Rejoin
      .replace(/\n\s*\n+/g, '\n\n') // Normalize multiple newlines and whitespace
      .replace(/^\s*\n/gm, '') // Remove lines that are just whitespace
    
    let adjustedSelection = selection
    
    if (cleanContent !== editorContent) {
      console.log('🧹 Content contains emojis, recalculating positions on clean content')
      console.log('Original content length:', editorContent.length)
      console.log('Clean content length:', cleanContent.length)
      
      // Try to find the selected text in clean content
      const selectedText = editorContent.substring(selection.from, selection.to)
      console.log('Looking for selected text in clean content:', JSON.stringify(selectedText))
      
      // Search for the text in clean content around the expected position
      const searchStart = Math.max(0, selection.from - 100)
      const searchEnd = Math.min(cleanContent.length, selection.to + 100)
      const searchArea = cleanContent.substring(searchStart, searchEnd)
      const textIndex = searchArea.indexOf(selectedText)
      
      if (textIndex !== -1) {
        const adjustedFrom = searchStart + textIndex
        const adjustedTo = adjustedFrom + selectedText.length
        adjustedSelection = {
          text: selectedText,
          from: adjustedFrom,
          to: adjustedTo
        }
        console.log('✅ Recalculated positions on clean content:', adjustedSelection)
      } else {
        console.log('⚠️ Could not find selected text in clean content, using original positions')
      }
    }
    
    if (adjustedSelection.text.trim()) {
      // Store both text and position information for the "Add to Chat" button
      setTempSelectedText(adjustedSelection.text.trim())
      setTempSelectionPositions({ from: adjustedSelection.from, to: adjustedSelection.to })
      setShowAddToChat(true)
      console.log('✅ Selection set for Add to Chat button:', {
        text: adjustedSelection.text.trim(),
        positions: { from: adjustedSelection.from, to: adjustedSelection.to }
      })
    } else {
      // Clear temporary selection and hide button
      setTempSelectedText('')
      setTempSelectionPositions({ from: 0, to: 0 })
      setShowAddToChat(false)
      console.log('❌ Selection cleared')
    }
  }



  // Handle editor focus loss - automatically mark cursor position
  const handleEditorFocusLost = (data: { cursorPosition: number }) => {
    // Now that we have blinking cursor beacon, no need to insert comments
    // Just update the last cursor position state for the beacon
    if (cursorPosition !== undefined && cursorPosition >= 0) {
      // The beacon system will handle visual marking
      console.log('Focus lost at position:', cursorPosition)
    }
  }

  // Handle editor blur event (when focus changes)
  const handleEditorBlur = () => {
    // Now that we have blinking cursor beacon, no need to insert comments
    // The beacon system handles position tracking visually
    console.log('Editor blur event')
  }

  // Handle editor focus - remove markers when user clicks back in editor
  const handleEditorFocus = () => {
    // Remove all markers when editor gains focus
    const cleanContent = editorContent.replace(/% 🎯.*last position.*/gi, '')
    if (cleanContent !== editorContent) {
      setEditorContent(cleanContent)
      setIsEditing(true)
      setPositionMarkers([])
    }
  }

  // Also remove markers when cursor position changes significantly
  const handleEditorCursorPositionChange = (position: number) => {
    setCursorPosition(position)
    
    // If cursor moved significantly, remove old markers
    if (positionMarkers.length > 0) {
      const lastMarker = positionMarkers[positionMarkers.length - 1]
      if (Math.abs(position - lastMarker.position) > 10) {
        const cleanContent = editorContent.replace(/% 🎯.*last position.*/gi, '')
        if (cleanContent !== editorContent) {
          setEditorContent(cleanContent)
          setIsEditing(true)
          setPositionMarkers([])
        }
      }
    }
  }

  // Clear selection when clicking elsewhere in editor
  const handleEditorClick = () => {
    // Selection will be automatically cleared by the editor plugin
    // This is just for any additional UI updates if needed
  }

  // AI Suggestion Handlers for Cursor-like Experience
  const handleAcceptAiSuggestion = useCallback((suggestionId: string) => {
    console.log('=== ACCEPTING AI SUGGESTION ===')
    const suggestion = aiSuggestions.find(s => s.id === suggestionId)
    if (!suggestion) {
      console.error('Suggestion not found:', suggestionId)
      return
    }

    console.log('Accepting suggestion:', suggestion)
    let newContent = editorContent

    switch (suggestion.type) {
      case 'replace':
        // Replace text from suggestion.from to suggestion.to with suggestedText
        const before = editorContent.substring(0, suggestion.from)
        const after = editorContent.substring(suggestion.to)
        newContent = before + suggestion.suggestedText + after
        console.log('Replace operation:', {
          before: before.slice(-20),
          original: suggestion.originalText,
          suggested: suggestion.suggestedText,
          after: after.slice(0, 20)
        })
        break

      case 'add':
        // Insert text at suggestion.from position
        const beforeAdd = editorContent.substring(0, suggestion.from)
        const afterAdd = editorContent.substring(suggestion.from)
        newContent = beforeAdd + suggestion.suggestedText + afterAdd
        break

      case 'delete':
        // Remove text from suggestion.from to suggestion.to
        const beforeDel = editorContent.substring(0, suggestion.from)
        const afterDel = editorContent.substring(suggestion.to)
        newContent = beforeDel + afterDel
        break
    }

    console.log('New content length:', newContent.length)
    console.log('Original content length:', editorContent.length)
    
    // Apply the change
    setEditorContent(newContent)
    setIsEditing(true)
    
    // Remove the suggestion from the list
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    
    // Clear any existing selection
    setSelectedText({ text: '', from: 0, to: 0 })
    setShowAddToChat(false)
    
    console.log('AI suggestion accepted and applied!')
  }, [aiSuggestions, editorContent])

  const handleRejectAiSuggestion = useCallback((suggestionId: string) => {
    console.log('Rejecting AI suggestion:', suggestionId)
    // Simply remove the suggestion from the list
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId))
  }, [])

  // New function to create AI suggestions directly in editor
  const handleCreateAiSuggestion = useCallback((
    type: 'replace' | 'add' | 'delete',
    from: number,
    to: number,
    originalText: string,
    suggestedText: string,
    explanation?: string
  ) => {
    const newSuggestion = {
      id: `ai-suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      from,
      to,
      originalText,
      suggestedText,
      explanation
    }
    
    console.log('Creating AI suggestion:', newSuggestion)
    setAiSuggestions(prev => [...prev, newSuggestion])
  }, [])

  // Emoji-based suggestion handlers
  const handleApplyEmojiSuggestion = useCallback((newContent: string, suggestionId: string) => {
    console.log('=== APPLYING EMOJI SUGGESTION TO EDITOR ===')
    console.log('Suggestion ID:', suggestionId)
    console.log('New content length:', newContent.length)
    
    // Apply the emoji-marked content directly to the editor
    setEditorContent(newContent)
    setIsEditing(true)
  }, [])

  const handleAcceptEmojiSuggestion = useCallback((suggestionId: string) => {
    console.log('=== ACCEPTING EMOJI SUGGESTION ===')
    console.log('Suggestion ID:', suggestionId)
    
    // Accept = Remove DELETE lines (delete them), keep ADD lines (remove marker)
    const lines = editorContent.split('\n')
    const processedLines = lines
      .filter(line => !line.startsWith('% DELETE:')) // Remove DELETE marker lines completely
      .map(line => {
        if (line.startsWith('% ADD: ')) {
          // Remove the marker and keep the content
          return line.substring(7) // Remove "% ADD: " prefix
        }
        return line
      })
      .filter(line => line.trim() !== '') // Remove any lines that became empty
    
    const cleanedContent = processedLines.join('\n')
    console.log('Original content length:', editorContent.length)
    console.log('Cleaned content length:', cleanedContent.length)
    
    setEditorContent(cleanedContent)
    setIsEditing(true)
    
    console.log('Emoji suggestion accepted, content cleaned')
  }, [editorContent])

  const handleRejectEmojiSuggestion = useCallback((suggestionId: string) => {
    console.log('=== REJECTING EMOJI SUGGESTION ===')
    console.log('Suggestion ID:', suggestionId)
    
    // Reject = Remove ADD lines (delete them), keep DELETE lines (remove marker)
    const lines = editorContent.split('\n')
    const processedLines = lines
      .filter(line => !line.startsWith('% ADD:')) // Remove ADD marker lines completely
      .map(line => {
        if (line.startsWith('% DELETE: ')) {
          // Remove the marker and keep the content
          return line.substring(10) // Remove "% DELETE: " prefix
        }
        return line
      })
      .filter(line => line.trim() !== '') // Remove any lines that became empty
    
    const cleanedContent = processedLines.join('\n')
    console.log('Original content length:', editorContent.length)
    console.log('Cleaned content length:', cleanedContent.length)
    
    setEditorContent(cleanedContent)
    setIsEditing(true)
    
    console.log('Emoji suggestion rejected, content reverted')
  }, [editorContent])

  const handleCreateDocument = async () => {
    if (!newFileName.trim()) {
      alert('Please enter a file name')
      return
    }

    try {
      const response = await latexApi.createDocumentWithName(projectId, newFileName)
      const newDocument = response.data
      
      // Reload all documents from database to ensure we have the complete list
      await loadDocuments(projectId)
      
      // Set the newly created document as current
      setCurrentDocument(newDocument)
      setEditorContent(newDocument.content)
      
      // Close dialog and reset
      setShowCreateDialog(false)
      setNewFileName('')
      
      console.log('Document created successfully:', newDocument.title)
    } catch (error) {
      console.error('Failed to create document:', error)
      alert('Failed to create document. Please try again.')
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm(`Are you sure you want to delete this document? This action cannot be undone.`)) {
      return;
    }

    try {
      await latexApi.deleteDocument(documentId);
      await loadDocuments(projectId);
      setCurrentDocument(documents.length > 0 ? documents[0] : null);
      setEditorContent(documents.length > 0 ? documents[0].content : '');
      console.log(`Document with ID ${documentId} deleted successfully.`);
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleSaveVersion = async () => {
    if (!currentDocument?.id) {
      alert('No document selected for versioning')
      return
    }

    try {
      console.log('Saving version for document:', currentDocument.title)
      // Create a new version by appending version number to title
      const versionNumber = (currentDocument.version || 0) + 1
      const versionTitle = `${currentDocument.title.replace(/\.tex$/, '')}_v${versionNumber}.tex`
      console.log('Creating version:', versionTitle)
      
      const response = await latexApi.createDocumentWithName(projectId, versionTitle)
      const newVersion = response.data
      console.log('New version created:', newVersion)
      
      // Update the new version with current content
      await latexApi.updateDocument({
        documentId: newVersion.id,
        content: editorContent
      })
      
      // Reload documents to show the new version
      await loadDocuments(projectId)
      
      console.log('Version saved successfully:', versionTitle)
      alert(`Version saved as: ${versionTitle}`)
    } catch (error) {
      console.error('Failed to save version:', error)
      alert('Failed to save version. Please try again.')
    }
  }

  const loadVersionHistory = async (documentId: string) => {
    const now = Date.now()
    
    // Debounce: prevent calls within 1 second of each other
    if (now - lastVersionCallTime < 1000) {
      console.log('Version history call debounced, skipping...')
      return
    }
    
    // Prevent duplicate calls for the same document
    if (versionHistory.length > 0 && currentDocument?.id === documentId) {
      console.log('Version history already loaded for this document, skipping...')
      return
    }
    
    // Prevent multiple simultaneous calls
    if (isLoadingVersions) {
      console.log('Version history already loading, skipping...')
      return
    }
    
    // Add a more aggressive check - if we've loaded versions recently, skip
    const lastLoadTime = sessionStorage.getItem(`versionHistory_${documentId}_lastLoad`)
    if (lastLoadTime && (now - parseInt(lastLoadTime)) < 5000) { // 5 second cache
      console.log('Version history loaded recently, using cache...')
      return
    }
    
    try {
      setLastVersionCallTime(now)
      setIsLoadingVersions(true)
      console.log('Loading version history for document:', documentId)
      const response = await latexApi.getDocumentVersions(documentId)
      if (response.status === 200) {
        setVersionHistory(response.data || [])
        console.log('Version history loaded:', response.data)
        // Cache the load time
        sessionStorage.setItem(`versionHistory_${documentId}_lastLoad`, now.toString())
      }
    } catch (error) {
      console.error('Failed to load version history:', error)
    } finally {
      setIsLoadingVersions(false)
    }
  }

  const navigateToVersion = async (documentId: string, versionNumber: number) => {
    try {
      const response = await latexApi.getSpecificDocumentVersion(documentId, versionNumber)
      if (response.status === 200) {
        const version = response.data
        setEditorContent(version.content)
        setCurrentVersion(version.versionNumber)
        setIsViewingVersion(true)
        console.log('Navigated to version:', version.versionNumber)
      }
    } catch (error) {
      console.error('Failed to navigate to version:', error)
    }
  }

  const loadDocumentById = async (documentId: string) => {
    console.log('Loading fresh content for document from tab switch:', documentId)
    
    try {
      // Load fresh content from database
      const freshDocumentResponse = await latexApi.getDocumentById(documentId)
      const freshDocument = freshDocumentResponse.data
      
      console.log('Fresh document content loaded via tab switch:', freshDocument.content)
      console.log('Fresh document content length:', freshDocument.content?.length || 0)
      
      // Update current document with fresh data
      setCurrentDocument(freshDocument)
      setEditorContent(freshDocument.content || '')
      // Note: API response doesn't include version field, will be loaded from version history
      setIsViewingVersion(false)
      
      // Load version history for the selected document
      loadVersionHistory(freshDocument.id)
      
      // Clear any previous selections and AI state
      setSelectedText({ text: '', from: 0, to: 0 })
      setTempSelectedText('')
      setShowAddToChat(false)
      setSelectionAddedToChat(false)
      
      console.log('Document switched successfully via tab, chat will load for documentId:', freshDocument.id)
    } catch (error) {
      console.error('Failed to load fresh document content via tab switch:', error)
      throw error // Re-throw so tab handler can handle fallback
    }
  }

  // Handle document switching events
  const handleDocumentSwitchById = async (documentId: string) => {
    console.log('Document switch event received for documentId:', documentId)
    
    // Skip if already viewing this document
    if (currentDocument?.id === documentId) {
      console.log('Already viewing document, skipping switch')
      return
    }
    
    await loadDocumentById(documentId)
  }

  // Create version
  const createVersion = async () => {
    if (!currentDocument?.id || !commitMessage.trim()) {
      alert('Please enter a commit message')
      return
    }

    try {
      console.log('=== VERSION CREATION DEBUG ===')
      console.log('Document ID:', currentDocument.id)
      console.log('Commit message:', commitMessage)
      console.log('Content length:', editorContent.length)
      console.log('Calling latexApi.createDocumentVersion...')
      
      const response = await latexApi.createDocumentVersion(
        currentDocument.id, 
        editorContent, 
        commitMessage
      )
      
      console.log('=== RESPONSE RECEIVED ===')
      console.log('Full response:', response)
      console.log('Response status:', response.status)
      console.log('Response message:', response.message)
      console.log('Response data:', response.data)
      
      if (response.status === 201) {
        console.log('✅ Version created successfully!')
        setShowVersionDialog(false)
        setCommitMessage('')
        await loadVersionHistory(currentDocument.id)
        alert('Version created successfully!')
      } else {
        console.log('❌ Unexpected status code:', response.status)
        throw new Error(`Backend returned status ${response.status}: ${response.message}`)
      }
    } catch (error: any) {
      console.error('=== ERROR DETAILS ===')
      console.error('Error type:', typeof error)
      console.error('Error message:', error?.message)
      console.error('Full error object:', error)
      console.error('Stack trace:', error?.stack)
      alert(`Failed to create version: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleRevertVersion = async () => {
    if (!currentDocument?.id || !currentDocument.version) {
      alert('No previous version to revert to or document not found.')
      return
    }

    try {
      const previousVersion = await latexApi.getDocumentById(currentDocument.id);
      if (previousVersion.data) {
        setEditorContent(previousVersion.data.content);
        console.log('Document reverted to version:', previousVersion.data.title);
        alert(`Document reverted to version: ${previousVersion.data.title}`);
      } else {
        alert('Failed to revert document. Previous version not found.');
      }
    } catch (error) {
      console.error('Failed to revert version:', error);
      alert('Failed to revert document. Please try again.');
    }
  }

  const handleDownloadPDF = useCallback(async () => {
    if (!pdfPreviewUrl) {
      console.log('No PDF available for download')
      return
    }
    
    try {
      // Create a temporary link element to trigger download
      const link = document.createElement('a')
      link.href = pdfPreviewUrl
      link.download = currentDocument?.title?.replace('.tex', '.pdf') || 'document.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('PDF download initiated')
    } catch (error) {
      console.error('PDF download failed:', error)
    }
  }, [pdfPreviewUrl, currentDocument?.title])

  const navigateToPreviousVersion = async () => {
    console.log('navigateToPreviousVersion called')
    console.log('currentDocument:', currentDocument)
    console.log('isViewingVersion:', isViewingVersion)
    console.log('versionHistory:', versionHistory)
    
    if (currentDocument?.id) {
      try {
        // Previous = Current working content (latest/newer content)
        if (isViewingVersion) {
          // If we're viewing a version, restore current document content
          setEditorContent(currentDocument.content)
          setCurrentVersion(currentDocument.version || 1)
          setIsViewingVersion(false)
          console.log('Restored current document content (latest)')
        } else {
          // Already viewing current content, no action needed
          console.log('Already viewing current content')
        }
      } catch (error) {
        console.error('Failed to navigate to current version:', error)
        // Fallback: restore current content
        setEditorContent(currentDocument.content)
        setCurrentVersion(currentDocument.version || 1)
        setIsViewingVersion(false)
        console.log('Restored current document content as fallback')
      }
    } else {
      console.log('No currentDocument.id available')
    }
  }

  const navigateToNextVersion = async () => {
    console.log('navigateToNextVersion called')
    console.log('currentDocument:', currentDocument)
    console.log('currentVersion:', currentVersion)
    console.log('versionHistory:', versionHistory)
    
    if (currentDocument?.id && versionHistory.length > 0) {
      try {
        // Find the current version in the history
        const currentVersionIndex = versionHistory.findIndex(v => v.versionNumber === currentVersion)
        console.log('Current version index:', currentVersionIndex)
        
        if (currentVersionIndex > 0) {
          // Get the previous version (older content)
          const previousVersion = versionHistory[currentVersionIndex - 1]
          console.log('Previous version found:', previousVersion)
          
          setEditorContent(previousVersion.content)
          setCurrentVersion(previousVersion.versionNumber)
          setIsViewingVersion(true)
          console.log('Navigated to previous version (older):', previousVersion.versionNumber)
        } else {
          console.log('No previous version available')
          alert('No previous version available')
        }
      } catch (error) {
        console.error('Failed to navigate to previous version:', error)
        alert('No previous version available')
      }
    } else {
      console.log('No currentDocument.id or versionHistory available')
      if (versionHistory.length === 0 && currentDocument?.id) {
        // Load version history only once, then try navigation
        await loadVersionHistory(currentDocument.id)
        // Use the updated versionHistory state directly instead of recursive call
        const updatedHistory = await latexApi.getDocumentVersions(currentDocument.id)
        if (updatedHistory.status === 200 && updatedHistory.data.length > 0) {
          setVersionHistory(updatedHistory.data)
          // Now try to navigate
          const currentVersionIndex = updatedHistory.data.findIndex(v => v.versionNumber === currentVersion)
          if (currentVersionIndex > 0) {
            const previousVersion = updatedHistory.data[currentVersionIndex - 1]
            setEditorContent(previousVersion.content)
            setCurrentVersion(previousVersion.versionNumber)
            setIsViewingVersion(true)
            console.log('Navigated to previous version after loading history:', previousVersion.versionNumber)
          }
        }
      }
    }
  };

  // State to track current version index for Check Version functionality
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(0)

  // Handle navigating through versions from latest to oldest
  const handleNavigateVersions = async () => {
    if (!currentDocument?.id) {
      return
    }

    try {
      // Load version history if not already loaded
      if (versionHistory.length === 0) {
        await loadVersionHistory(currentDocument.id)
        
        // After loading, check if we have any versions
        const updatedHistory = await latexApi.getDocumentVersions(currentDocument.id)
        if (updatedHistory.status === 200 && updatedHistory.data.length === 0) {
          // No versions exist yet
          alert('No versions found. Create your first version using the "Save Version" button!')
          return
        }
        
        // If we now have versions, continue with the navigation
        if (updatedHistory.status === 200 && updatedHistory.data.length > 0) {
          setVersionHistory(updatedHistory.data)
          const latestVersion = updatedHistory.data[0] // Assuming versions are sorted latest first
          setEditorContent(latestVersion.content)
          setCurrentVersion(latestVersion.versionNumber)
          setIsViewingVersion(true)
          setCurrentVersionIndex(0)
          console.log('Started version navigation with latest version:', latestVersion.versionNumber)
        }
        return
      }

      // If we're viewing the current working version, start with the latest saved version
      if (!isViewingVersion) {
        if (versionHistory.length > 0) {
          const latestVersion = versionHistory[0] // Assuming versions are sorted latest first
          setEditorContent(latestVersion.content)
          setCurrentVersion(latestVersion.versionNumber)
          setIsViewingVersion(true)
          setCurrentVersionIndex(0)
          console.log('Started version navigation with latest version:', latestVersion.versionNumber)
        } else {
          alert('No versions found. Create your first version using the "Save Version" button!')
        }
        return
      }

      // Navigate to the next older version
      const nextIndex = currentVersionIndex + 1
      if (nextIndex < versionHistory.length) {
        const nextVersion = versionHistory[nextIndex]
        setEditorContent(nextVersion.content)
        setCurrentVersion(nextVersion.versionNumber)
        setCurrentVersionIndex(nextIndex)
        console.log(`Navigated to version ${nextVersion.versionNumber} (${nextIndex + 1}/${versionHistory.length})`)
      } else {
        // We've reached the oldest version, cycle back to current working version
        setEditorContent(currentDocument.content)
        setCurrentVersion(currentDocument.version || 1)
        setIsViewingVersion(false)
        setCurrentVersionIndex(0)
        console.log('Cycled back to current working version')
      }
    } catch (error) {
      console.error('Failed to navigate versions:', error)
      alert('Failed to navigate versions')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin text-primary mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground">Loading LaTeX editor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b border-border bg-card px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">LaTeX Editor</h1>
            <Badge variant="secondary">{project?.status || 'Active'}</Badge>
            <span className="text-sm text-muted-foreground">|</span>
            <span className="text-sm font-medium">
              {currentDocument?.title || 'Untitled'}
            </span>
            <Badge variant="outline" className="text-xs">
              {currentDocument?.documentType || 'LATEX'}
            </Badge>
            {isViewingVersion && (
              <Badge variant="secondary" className="text-xs">
                v{currentVersion}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('Manual reload clicked, projectId:', projectId)
                if (projectId) {
                  loadDocuments(projectId)
                } else {
                  console.error('No projectId available')
                }
              }}
              title="Reloads the editor"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                window.location.reload()
              }}
              title="Refresh entire browser page"
            >
              <Globe className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={handleSave}
              className={cn(
                "transition-all duration-300 relative overflow-hidden",
                isEditing && "bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-md"
              )}
              style={isEditing ? {
                background: 'linear-gradient(45deg, #3b82f6, #60a5fa, #3b82f6, #60a5fa)',
                backgroundSize: '400% 400%',
                animation: 'gradient-shimmer 2s ease-in-out infinite'
              } : undefined}
            >
              <Save className={cn("h-4 w-4 mr-2 relative z-10", isEditing ? "text-white" : "text-current")} />
              <span className={cn(
                "font-medium relative z-10",
                isEditing ? "text-white font-bold" : "text-current"
              )}>
                {isEditing ? "Save*" : "Save"}
              </span>
              {isEditing && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slide" />
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowVersionDialog(true)}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Save Version
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCompile}
              disabled={isCompiling}
            >
              <Play className="h-4 w-4 mr-2" />
              {isCompiling ? 'Compiling...' : 'Compile'}
            </Button>
            <label className="inline-flex items-center gap-2 text-xs px-2 py-1 border rounded">
              <input 
                type="checkbox" 
                checked={runWebCheck} 
                onChange={e => setRunWebCheck(e.target.checked)}
                className="w-3 h-3"
              />
              Include web check
            </label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownloadPDF}
              disabled={!pdfPreviewUrl || isCompiling}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateSetting('theme', settings.theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
            >
              {settings.theme === "dark" ? (
                <Sun className="h-4 w-4 mr-2" />
              ) : (
                <Moon className="h-4 w-4 mr-2" />
              )}
              {settings.theme === "dark" ? "Light" : "Dark"}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Dynamic import to avoid issues with require
                import('@/lib/codemirror-themes').then(({ cycleThemeVariant, codeMirrorThemes, getCurrentThemeVariant }) => {
                  const themeMode = settings.theme === 'dark' ? 'dark' : 'light'
                  const newIndex = cycleThemeVariant(themeMode)
                  const themeName = codeMirrorThemes[themeMode][newIndex].name
                  // Force re-render by dispatching a custom event
                  window.dispatchEvent(new CustomEvent('codemirror-theme-changed', { 
                    detail: { mode: themeMode, index: newIndex, name: themeName } 
                  }))
                })
              }}
              title="Cycle editor theme variant"
            >
              <Code className="h-4 w-4 mr-2" />
              Variant
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
            
            {/* Left Sidebar - Project Explorer */}
            <ResizablePanel defaultSize={14} minSize={12} maxSize={20}>
              <div className="h-full flex flex-col bg-card border-r border-border">
                <div className="p-2 border-b border-border">
                  <h3 className="font-medium text-sm mb-1">Project</h3>
                  <div className="p-1.5 rounded-md bg-accent">
                    <div className="flex items-center space-x-2">
                      <Folder className="h-4 w-4" />
                      <span className="truncate text-sm">{project?.name}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col">
                  {/* Papers Section */}
                  <div className="flex-shrink-0">
                    <PapersSelector 
                      projectId={projectId}
                      onPapersLoad={handlePapersLoad}
                      onOpenPaper={handleOpenPaper || undefined}
                      className="h-64 border-b border-border"
                    />
                  </div>
                
                {/* Documents Section */}
                <div className="flex-1 p-2 min-h-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">Documents</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-full">
                    <div className="space-y-1">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={cn(
                          "p-1.5 rounded-md cursor-pointer text-sm hover:bg-accent group",
                          currentDocument?.id === doc.id && "bg-accent"
                        )}
                        onClick={async () => {
                          if (!isEditing) {
                            console.log('Document clicked:', doc.title)
                            console.log('Loading fresh content from database for document:', doc.id)
                            
                            try {
                              // Load fresh content from database
                              const freshDocumentResponse = await latexApi.getDocumentById(doc.id)
                              const freshDocument = freshDocumentResponse.data
                              
                              console.log('Fresh document content loaded:', freshDocument.content)
                              console.log('Fresh document content length:', freshDocument.content?.length || 0)
                              
                              // Update current document with fresh data
                              setCurrentDocument(freshDocument)
                              setEditorContent(freshDocument.content || '')
                              // Note: API response doesn't include version field, will be loaded from version history
                              setIsViewingVersion(false)
                              
                              // Load version history for the selected document
                              loadVersionHistory(freshDocument.id)
                              
                              // Clear any previous selections and AI state
                              setSelectedText({ text: '', from: 0, to: 0 })
                              setTempSelectedText('')
                              setShowAddToChat(false)
                              setSelectionAddedToChat(false)
                              
                              console.log('Document switched successfully, chat will load for documentId:', freshDocument.id)
                            } catch (error) {
                              console.error('Failed to load fresh document content:', error)
                              // Fallback to cached content
                              console.log('Using cached content as fallback')
                              setCurrentDocument(doc)
                              setEditorContent(doc.content)
                              setCurrentVersion(doc.version || 1)
                              setIsViewingVersion(false)
                              loadVersionHistory(doc.id)
                            }
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            <FileText className="h-4 w-4" />
                            <span className="truncate">{doc.title}</span>
                            {doc.version && doc.version > 1 && (
                              <Badge variant="outline" className="text-xs">
                                v{doc.version}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                                handleDeleteDocument(doc.id)
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Version History Section */}
                {currentDocument && versionHistory.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Version History</h4>
                    <div className="space-y-1">
                      {versionHistory.map((version) => (
                        <div
                          key={version.id}
                          className={cn(
                            "p-1.5 rounded-md cursor-pointer text-xs hover:bg-accent",
                            currentVersion === version.versionNumber && "bg-accent"
                          )}
                          onClick={() => navigateToVersion(currentDocument.id, version.versionNumber)}
                        >
                          <div className="flex items-center justify-between">
                            <span>v{version.versionNumber}</span>
                            <span className="text-muted-foreground truncate">
                              {version.commitMessage}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center - Editor */}
          <ResizablePanel defaultSize={66} minSize={50}>
            <div className="h-full flex flex-col">
              {/* Show landing page if no documents, otherwise show TabProviderWrapper */}
              {documents.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-2xl">
                    <div className="mb-8">
                      <FileText className="h-16 w-16 mx-auto text-primary mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Welcome to LaTeX Editor</h2>
                      <p className="text-muted-foreground text-lg mb-6">
                        Professional LaTeX document editing with AI-powered assistance
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <Card className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <Play className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">Real-time Compilation</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          See your LaTeX rendered instantly as you type
                        </p>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">AI Chat Assistant</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Get help with LaTeX syntax, formatting, and content
                        </p>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <Download className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">PDF Export</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Generate high-quality PDFs from your documents
                        </p>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <Save className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">Auto-save</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Never lose your work with automatic saving
                        </p>
                      </Card>
                    </div>

                    <Button 
                      size="lg" 
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Document
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <TabProviderWrapper
                  currentDocument={currentDocument}
                  editorContent={editorContent}
                  onEditorContentChange={setEditorContent}
                  isEditing={isEditing}
                  onIsEditingChange={setIsEditing}
                  selectedText={selectedText}
                  onSelectionChange={setSelectedText}
                  cursorPosition={cursorPosition}
                  onCursorPositionChange={setCursorPosition}
                  lastCursorPos={lastCursorPos}
                  onLastCursorPosChange={setLastCursorPos}
                  positionMarkers={positionMarkers}
                  onSetPositionMarker={handleSetPositionMarker}
                  onClearPositionMarkers={handleClearPositionMarkers}
                  aiSuggestions={aiSuggestions}
                  onAcceptSuggestion={handleAcceptAiSuggestion}
                  onRejectSuggestion={handleRejectAiSuggestion}
                  inlineDiffPreviews={inlineDiffPreviews}
                  onAcceptInlineDiff={handleAcceptInlineDiff}
                  onRejectInlineDiff={handleRejectInlineDiff}
                  showAddToChat={showAddToChat}
                  tempSelectedText={tempSelectedText}
                  tempSelectionPositions={tempSelectionPositions}
                  onHandleAddToChat={handleAddToChat}
                  onHandleCancelSelection={handleCancelSelection}
                  onHandleEditorClick={handleEditorClick}
                  onHandleEditorBlur={handleEditorBlur}
                  onHandleEditorFocus={handleEditorFocus}
                  onHandleEditorFocusLost={() => handleEditorFocusLost({ cursorPosition: cursorPosition || 0 })}
                  pdfPreviewUrl={pdfPreviewUrl}
                  isCompiling={isCompiling}
                  onCompile={handleCompile}
                  onPDFSelectionToChat={handlePDFSelectionToChat}
                  onOpenPaperReady={(fn) => setHandleOpenPaper(() => fn)}
                  onTabDocumentLoad={handleDocumentSwitchById}
                  citationCount={currentCitationJob?.summary?.total ?? 0}
                  onOpenCitationPanel={handleOpenCitationPanel}
                  onRunCitationCheck={handleRunCitationCheck}
                  citationBusy={citationBusy}
                  currentJob={currentCitationJob}
                  />
                </div>
                {/* Bottom version/footer bar that keeps editor above it */}
                <div className="flex-shrink-0 border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-foreground">Lines: {editorContent ? editorContent.split('\n').length : 0}</span>
                    {currentDocument?.version && (
                      <span className="text-foreground">v{currentDocument.version}{isViewingVersion ? ' (viewing version)' : ''}</span>
                    )}
                    <span>Updated: {currentDocument?.updatedAt ? new Date(currentDocument.updatedAt).toLocaleTimeString() : '-'}</span>
                    {currentDocument?.id && versionHistory.length > 0 && (
                      <span className="text-blue-600">
                        Versions: {versionHistory.length}
                        {isViewingVersion && (
                          <span className="ml-2 text-orange-600">
                            ({currentVersionIndex + 1}/{versionHistory.length + 1})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowVersionDialog(true)}
                      className="h-8 px-3 text-xs hover:bg-primary/10 hover:text-primary"
                      disabled={!currentDocument?.id}
                      title="Save current version with commit message"
                    >
                      <GitBranch className="h-3 w-3 mr-1" />
                      Save Version
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={navigateToPreviousVersion}
                      className="h-8 px-3 text-xs hover:bg-primary/10 hover:text-primary"
                      disabled={!currentDocument?.id}
                      title={isViewingVersion ? "Return to current working version" : "View latest saved version"}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      {isViewingVersion ? "Current" : "Latest"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleNavigateVersions}
                      className="h-8 px-3 text-xs hover:bg-secondary/80"
                      disabled={!currentDocument?.id}
                      title={
                        versionHistory.length === 0 
                          ? "No versions yet - create a version first using 'Save Version'" 
                          : `Navigate through versions (${isViewingVersion ? currentVersionIndex + 1 : 'current'}/${versionHistory.length + 1})`
                      }
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Check Version
                      {isViewingVersion && versionHistory.length > 0 && (
                        <span className="ml-1 text-orange-600">
                          ({currentVersionIndex + 1}/{versionHistory.length + 1})
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
                </>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle className={isRightSidebarCollapsed ? "hidden" : ""} />

          {/* Right Sidebar - AI Tools */}
          {!isRightSidebarCollapsed ? (
            <ResizablePanel defaultSize={20} minSize={16} maxSize={28}>
              <div className="h-full flex flex-col bg-card border-l border-border">
                {/* Sidebar Header with Collapse Button */}
                <div className="flex items-center justify-between p-2 border-b border-border">
                  <h3 className="font-medium text-sm">AI Assistant</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRightSidebarCollapsed(true)}
                    className="h-8 w-8 p-0"
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </div>
                
                <Tabs defaultValue="chat" className="h-full flex flex-col">
                  <TabsList className="w-full rounded-none border-b">
                    <TabsTrigger value="chat" className="flex-1">💬 AI Chat</TabsTrigger>
                    <TabsTrigger value="tools" className="flex-1">🛠️ AI Tools</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chat" className="flex-1 m-0 p-0 h-full">
                    <AIChatPanel
                      content={editorContent}
                      selectedText={(() => {
                        const result = selectionAddedToChat ? selectedText : undefined
                        console.log('🔗🔗🔗 === PASSING PROPS TO AIChatPanel === 🔗🔗🔗')
                        console.log('selectionAddedToChat:', selectionAddedToChat)
                        console.log('selectedText state:', selectedText)
                        console.log('Computed selectedText prop for AIChatPanel:', result)
                        console.log('🏁 === PROPS COMPUTATION COMPLETED ===')
                        return result
                      })()}
                      selectedPapers={selectedPapers}
                      cursorPosition={cursorPosition}
                      onApplySuggestion={handleApplySuggestion}
                      onSetPositionMarker={handleSetPositionMarker}
                      onClearPositionMarkers={handleClearPositionMarkers}
                      onCreateAiSuggestion={handleCreateAiSuggestion}
                      pendingAiRequest={pendingAiRequest}
                      setPendingAiRequest={setPendingAiRequest}
                      onPreviewInlineDiff={handlePreviewInlineDiff}
                      onClearSelection={() => {
                        setSelectedText({ text: '', from: 0, to: 0 })
                        setSelectionAddedToChat(false)
                      }}
                      getInsertAnchor={getInsertAnchor}
                      onCollapse={() => setIsRightSidebarCollapsed(true)}
                      documentId={currentDocument?.id}
                      projectId={projectId}
                      onContentChange={setEditorContent}
                    />
                  </TabsContent>
                  
                  <TabsContent value="tools" className="flex-1 m-0 h-full">
                    <AIAssistancePanel 
                      content={editorContent}
                      onApplySuggestion={(suggestion) => {
                        setEditorContent(prev => prev + '\n\n' + suggestion)
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
          ) : (
            /* Collapsed Sidebar */
            <div className="w-20 bg-card border-l border-border flex flex-col items-center py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRightSidebarCollapsed(false)}
                className="h-16 w-16 p-2 mb-3 flex flex-col items-center justify-center
                         bg-gradient-to-br from-orange-500 to-red-500 text-white
                         hover:from-orange-600 hover:to-red-600
                         rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                title="Open LaTeX AI Assistant"
              >
                <Code className="h-4 w-4 mb-1 text-white" />
                <div className="text-xs font-bold text-white leading-tight text-center">
                  <div>LaTeX</div>
                  <div>AI</div>
                </div>
              </Button>
              
              {/* Show notification indicators when collapsed */}
              {selectedPapers.length > 0 && (
                <div className="relative mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRightSidebarCollapsed(false)}
                    className="h-10 w-10 p-0 hover:bg-muted"
                    title={`${selectedPapers.length} papers in context`}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                    {selectedPapers.length}
                  </div>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRightSidebarCollapsed(false)}
                className="h-10 w-10 p-0"
                title="AI Chat"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          )}

        </ResizablePanelGroup>
      </div>

      {/* Create Document Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New LaTeX Document</DialogTitle>
            <DialogDescription>
              Enter a name for your new LaTeX document. The .tex extension will be added automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="document-name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateDocument()
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false)
                setNewFileName('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateDocument} disabled={!newFileName.trim()}>
              Create Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Version</DialogTitle>
            <DialogDescription>
              Enter a commit message to describe the changes in this version.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Added new section, Fixed formatting, etc."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  createVersion()
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowVersionDialog(false)
                setCommitMessage('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={createVersion} disabled={!commitMessage.trim()}>
              Save Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Citation Issues Panel */}
      <CitationIssuesPanel
        job={currentCitationJob}
        open={showCitationPanel}
        onOpenChange={setShowCitationPanel}
        onJumpToRange={(from, to) => {
          setCursorPosition(from)
          setShowCitationPanel(false)
        }}
        onRecheck={handleForcedRecheck}
        timeoutWarning={citationTimeoutWarning}
        contentHashStale={contentHashStale && currentCitationJob?.summary && !contentHashDismissed}
        onDismissStaleWarning={() => setContentHashDismissed(true)}
      />
    </div>
  )
}