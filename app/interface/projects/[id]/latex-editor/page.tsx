"use client"

import React, { useState, useEffect, useCallback } from 'react'
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
  Settings, 
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
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { projectsApi } from "@/lib/api/project-service"
import { latexApi } from "@/lib/api/latex-service"
import { AIChatPanel } from "@/components/latex/AIChatPanel"
import { AIAssistancePanel } from "@/components/latex/AIAssistancePanel"
import { LaTeXPDFViewer } from "@/components/latex/LaTeXPDFViewer"
import { EnhancedLatexEditor } from "@/components/latex/EnhancedLatexEditor"

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
  const [projectId, setProjectId] = useState<string>("")
  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const [compiledContent, setCompiledContent] = useState('')
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('')
  const [isCompiling, setIsCompiling] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedText, setSelectedText] = useState<string>('')
  const [cursorPosition, setCursorPosition] = useState<number | undefined>(undefined)

  const [showAddToChat, setShowAddToChat] = useState(false)
  const [tempSelectedText, setTempSelectedText] = useState<string>('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [currentVersion, setCurrentVersion] = useState<number>(1)
  const [versionHistory, setVersionHistory] = useState<any[]>([])
  const [isViewingVersion, setIsViewingVersion] = useState<boolean>(false)
  const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(false)
  const [lastVersionCallTime, setLastVersionCallTime] = useState<number>(0)

  // Cleanup PDF URL when component unmounts or PDF changes
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
    }
  }, [pdfPreviewUrl])

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

  // Clear version history when switching documents to prevent stale data
  useEffect(() => {
    if (currentDocument?.id) {
      console.log('Document changed, clearing version history')
      setVersionHistory([])
      setIsViewingVersion(false)
    }
  }, [currentDocument?.id])

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
        setCurrentVersion(response.data[0].version || 1)
        setIsViewingVersion(false)
        console.log('Documents loaded successfully, current document:', response.data[0].title)
        console.log('Current document content:', response.data[0].content)
      } else {
        console.log('No documents found, showing landing page')
        setDocuments([])
        setCurrentDocument(null)
        setEditorContent('')
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
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
      
      // Reset version viewing state since we're now viewing the current content
      setIsViewingVersion(false)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }, [currentDocument?.id, editorContent])

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
    if (isCompiling) {
      console.log('Compilation already in progress, skipping...')
      return
    }
    
    setIsCompiling(true)
    try {
      console.log('Starting PDF compilation...')
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
      console.log('Created PDF blob URL:', pdfUrl)
      setPdfPreviewUrl(pdfUrl)
      
      // Set compiled content to show PDF preview
      setCompiledContent(`
        <div style="padding: 20px; background: white; color: black;">
          <h1>LaTeX PDF Preview</h1>
          <p style="color: green;">✓ PDF compiled successfully!</p>
          <p>Your LaTeX document has been compiled to PDF. Use the preview tab to view it.</p>
          <p><strong>PDF Size:</strong> ${(pdfBlob.size / 1024).toFixed(1)} KB</p>
          <p><strong>PDF Type:</strong> ${pdfBlob.type}</p>
        </div>
      `)
      
    } catch (error) {
      console.error('PDF compilation failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setCompiledContent(`
        <div style="padding: 20px; background: white; color: black;">
          <h1>LaTeX Compilation Error</h1>
          <p style="color: red;">PDF compilation failed: ${errorMessage}</p>
          <p>Please check your LaTeX syntax and try again.</p>
          <details style="margin-top: 10px;">
            <summary>Raw LaTeX Content</summary>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; white-space: pre-wrap; font-size: 12px; margin-top: 10px;">${editorContent}</pre>
          </details>
        </div>
      `)
      
      // Clear PDF preview URL on error
      setPdfPreviewUrl('')
    } finally {
      setIsCompiling(false)
    }
  }, [editorContent, isCompiling])

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
    setSelectedText(tempSelectedText)
    setShowAddToChat(false)
    // Switch to chat tab in the right sidebar
    setTimeout(() => {
      const rightSidebarTabs = document.querySelector('[data-radix-tabs-trigger][value="chat"]') as HTMLElement
      if (rightSidebarTabs) {
        rightSidebarTabs.click()
      }
    }, 100)
  }

  const handleCancelSelection = () => {
    setTempSelectedText('')
    setShowAddToChat(false)
  }

  const handleCursorPosition = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    setCursorPosition(target.selectionStart)
  }

  const handleApplySuggestion = (suggestion: string, position?: number) => {
    if (position !== undefined) {
      // Insert at specific cursor position
      const before = editorContent.substring(0, position)
      const after = editorContent.substring(position)
      setEditorContent(before + suggestion + after)
    } else {
      // Append to end
      setEditorContent(prev => prev + '\n\n' + suggestion)
    }
  }

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
    } catch (error) {
      console.error('=== ERROR DETAILS ===')
      console.error('Error type:', typeof error)
      console.error('Error message:', error.message)
      console.error('Full error object:', error)
      console.error('Stack trace:', error.stack)
      alert(`Failed to create version: ${error.message}`)
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
      if (versionHistory.length === 0) {
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
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
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
              onClick={() => handleRevertVersion()}
              disabled={!currentDocument?.version || currentDocument.version <= 1}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Revert
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownloadPDF}
              disabled={!pdfPreviewUrl || isCompiling}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
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
              
              <div className="flex-1 p-2">
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
                        onClick={() => {
                          if (!isEditing) {
                            console.log('Document clicked:', doc.title)
                            console.log('Document content to load:', doc.content)
                            setCurrentDocument(doc)
                            setEditorContent(doc.content)
                            setCurrentVersion(doc.version || 1)
                            setIsViewingVersion(false)
                            loadVersionHistory(doc.id)
                            console.log('Document selected and content set')
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
          </ResizablePanel>

          <ResizableHandle />

          {/* Center - Editor */}
          <ResizablePanel defaultSize={66} minSize={50}>
            <div className="h-full flex flex-col">
              {/* Show landing page if no documents, otherwise show editor */}
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
                <div className="flex-1 flex">
                  <Tabs defaultValue="editor" className="flex-1 flex flex-col" onValueChange={handleTabChange}>
                    <div className="flex items-center justify-between mx-4 mt-1 flex-shrink-0">
                      <TabsList className="w-fit">
                        <TabsTrigger value="editor">Editor</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                        <TabsTrigger value="split">Split</TabsTrigger>
                      </TabsList>
                      <div className="flex items-center space-x-2">
                        {!isViewingVersion ? (
                          // Initial state: Only show "Check Versions" button
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigateToNextVersion()}
                            disabled={!currentDocument?.id}
                          >
                            <ChevronRight className="h-4 w-4 mr-2" />
                            Check Versions
                          </Button>
                        ) : (
                          // Version viewing state: Show both navigation buttons
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigateToPreviousVersion()}
                              disabled={!currentDocument?.id}
                            >
                              <ChevronLeft className="h-4 w-4 mr-2" />
                              Current
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigateToNextVersion()}
                              disabled={!currentDocument?.id}
                            >
                              <ChevronRight className="h-4 w-4 mr-2" />
                              Previously Saved
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                 
                  <TabsContent value="editor" className="flex-1 m-0">
                    <div className="h-full p-2">
                      <div className="relative w-full h-full">
                        <EnhancedLatexEditor
                          value={editorContent}
                          onChange={(value) => {
                            setEditorContent(value)
                            setIsEditing(true)
                          }}
                          placeholder="Start writing your LaTeX document..."
                          className="h-full"
                        />
                        {showAddToChat && (
                          <div className="absolute top-2 right-2 flex space-x-2">
                            <button
                              onClick={handleAddToChat}
                              className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-md hover:bg-primary/90 transition-colors"
                            >
                              Add to Chat
                            </button>
                            <button
                              onClick={handleCancelSelection}
                              className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-md hover:bg-muted/80 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                 
                  <TabsContent value="preview" className="flex-1 m-0">
                    <div className="border border-border rounded-md m-2 bg-white" style={{ height: 'calc(100vh - 180px)' }}>
                      <div className="flex items-center justify-between p-2 border-b border-border">
                        <h3 className="text-sm font-medium">PDF Preview</h3>
                        {isCompiling && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Compiling LaTeX to PDF...</span>
                          </div>
                        )}
                      </div>
                      <div style={{ height: 'calc(100vh - 240px)', overflow: 'auto' }}>
                        {isCompiling ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                              <p className="text-muted-foreground">Compiling LaTeX to PDF...</p>
                              <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
                            </div>
                          </div>
                        ) : pdfPreviewUrl ? (
                          <LaTeXPDFViewer
                            documentUrl={pdfPreviewUrl}
                            documentName="LaTeX Document"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                              <Eye className="h-8 w-8 mx-auto mb-2" />
                              <p>Click "Compile" to generate PDF preview</p>
                              <p className="text-sm mt-1">Your LaTeX will be compiled to PDF for preview</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                 
                  <TabsContent value="split" className="flex-1 m-0">
                    <div className="flex gap-2 p-2" style={{ height: 'calc(100vh - 180px)' }}>
                      <div className="flex-1 relative">
                        <EnhancedLatexEditor
                          value={editorContent}
                          onChange={(value) => {
                            setEditorContent(value)
                            setIsEditing(true)
                          }}
                          placeholder="Start writing your LaTeX document..."
                          className="h-full"
                        />
                        {showAddToChat && (
                          <div className="absolute top-2 right-2 flex space-x-2">
                            <button
                              onClick={handleAddToChat}
                              className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-md hover:bg-primary/90 transition-colors"
                            >
                              Add to Chat
                            </button>
                            <button
                              onClick={handleCancelSelection}
                              className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-md hover:bg-muted/80 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 border border-border rounded-md bg-white">
                        <div style={{ height: 'calc(100vh - 240px)', overflow: 'auto' }}>
                          {isCompiling ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                                <p className="text-muted-foreground">Compiling...</p>
                              </div>
                            </div>
                          ) : pdfPreviewUrl ? (
                            <LaTeXPDFViewer
                              documentUrl={pdfPreviewUrl}
                              documentName="LaTeX Document"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <div className="text-center">
                                <Eye className="h-8 w-8 mx-auto mb-2" />
                                <p>Click "Compile" to see PDF preview</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar - AI Tools */}
          <ResizablePanel defaultSize={20} minSize={16} maxSize={28}>
            <div className="h-full flex flex-col bg-card border-l border-border">
              <Tabs defaultValue="chat" className="h-full flex flex-col">
                <TabsList className="w-full rounded-none border-b">
                  <TabsTrigger value="chat" className="flex-1">💬 AI Chat</TabsTrigger>
                  <TabsTrigger value="tools" className="flex-1">🛠️ AI Tools</TabsTrigger>
                </TabsList>
                
                <TabsContent value="chat" className="flex-1 m-0 p-0 h-full">
                  <AIChatPanel
                    content={editorContent}
                    selectedText={selectedText}
                    cursorPosition={cursorPosition}
                    onApplySuggestion={handleApplySuggestion}
                  />
                </TabsContent>
                
                <TabsContent value="tools" className="flex-1 m-0">
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lightbulb className="h-4 w-4" />
                      <h3 className="font-medium text-sm">AI Writing Tools</h3>
                    </div>
                    <ScrollArea className="h-full">
                      <AIAssistancePanel 
                        content={editorContent}
                        onApplySuggestion={(suggestion) => {
                          setEditorContent(prev => prev + '\n\n' + suggestion)
                        }}
                      />
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

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
    </div>
  )
}
