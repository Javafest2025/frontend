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
  Download
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { projectsApi } from "@/lib/api/project-service"
import { latexApi } from "@/lib/api/latex-service"
import { AIChatPanel } from "@/components/latex/AIChatPanel"
import { AIAssistancePanel } from "@/components/latex/AIAssistancePanel"

interface Project {
  id: string
  name: string
  description: string
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
  const [isCompiling, setIsCompiling] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedText, setSelectedText] = useState<string>('')
  const [cursorPosition, setCursorPosition] = useState<number | undefined>(undefined)

  const [showAddToChat, setShowAddToChat] = useState(false)
  const [tempSelectedText, setTempSelectedText] = useState<string>('')

  // Load project data
  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params
      setProjectId(resolvedParams.id)
      
      try {
        // Load project details
        const projectData = await projectsApi.getProject(resolvedParams.id)
        setProject(projectData)
        
        // Load documents for this project
        await loadDocuments(resolvedParams.id)
      } catch (error) {
        console.error('Error loading project:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [params])

  const loadDocuments = async (projectId: string) => {
    try {
      console.log('Loading documents for project:', projectId)
      const response = await latexApi.getDocumentsByProjectId(projectId)
      
      if (response.data && response.data.length > 0) {
        setDocuments(response.data)
        setCurrentDocument(response.data[0])
        setEditorContent(response.data[0].content)
        console.log('Documents loaded successfully')
      } else {
        console.log('No documents found, creating default document')
        // Create a default document if none exist
        const newDocument = await latexApi.createDocument({
          projectId: projectId,
          title: 'main.tex',
          content: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}

\\title{${project?.name || 'Research Paper'}}
\\author{Research Team}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
This paper presents a comprehensive analysis...
\\end{abstract}

\\section{Introduction}
Your introduction goes here...

\\section{Methodology}
Your methodology goes here...

\\section{Results}
Your results go here...

\\section{Conclusion}
Your conclusion goes here...

\\end{document}`,
          documentType: 'LATEX'
        })
        setDocuments([newDocument.data])
        setCurrentDocument(newDocument.data)
        setEditorContent(newDocument.data.content)
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
      // Fallback to basic document
      const fallbackDoc: Document = {
        id: 'temp-1',
        title: 'main.tex',
        content: `\\documentclass{article}
\\title{${project?.name || 'Research Paper'}}
\\begin{document}
\\maketitle
Your content goes here...
\\end{document}`,
        documentType: 'LATEX',
        updatedAt: new Date().toISOString(),
        projectId: projectId
      }
      setDocuments([fallbackDoc])
      setCurrentDocument(fallbackDoc)
      setEditorContent(fallbackDoc.content)
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
    } catch (error) {
      console.error('Save failed:', error)
    }
  }, [currentDocument?.id, editorContent])

  const handleCompile = useCallback(async () => {
    if (isCompiling) {
      console.log('Compilation already in progress, skipping...')
      return
    }
    
    setIsCompiling(true)
    try {
      console.log('Starting compilation...')
      
      const result = await latexApi.compileLatex({ latexContent: editorContent })
      console.log('Compilation succeeded:', result)
      
      if (result.data && typeof result.data === 'string' && result.data.length > 0) {
        setCompiledContent(result.data)
      } else {
        console.error('Invalid compiled content received:', result.data)
        setCompiledContent(`
          <div style="padding: 20px; background: white; color: black;">
            <h1>LaTeX Preview</h1>
            <p style="color: orange;">Invalid compilation result received</p>
          </div>
        `)
      }
      
    } catch (error) {
      console.error('Compilation failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setCompiledContent(`
        <div style="padding: 20px; background: white; color: black;">
          <h1>LaTeX Preview</h1>
          <p style="color: red;">Compilation failed: ${errorMessage}</p>
          <p>Showing raw content:</p>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; white-space: pre-wrap; font-size: 12px;">${editorContent}</pre>
        </div>
      `)
    } finally {
      setIsCompiling(false)
    }
  }, [editorContent, isCompiling])

  // Compile when switching to preview tab
  const handleTabChange = useCallback((value: string) => {
    if (value === 'preview' && editorContent && !compiledContent) {
      handleCompile()
    }
  }, [editorContent, compiledContent, handleCompile])

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

  const handleDownloadPDF = async () => {
    if (!editorContent.trim()) {
      alert('No content to download')
      return
    }

    try {
      const response = await latexApi.generatePDF({
        latexContent: editorContent,
        filename: currentDocument?.title || 'document'
      })

      // Create download link
      const url = window.URL.createObjectURL(response)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentDocument?.title || 'document'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF')
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
          </div>
          <div className="flex items-center space-x-2">
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
              disabled={!compiledContent}
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
          <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
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
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-full">
                  <div className="space-y-1">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={cn(
                          "p-1.5 rounded-md cursor-pointer text-sm hover:bg-accent",
                          currentDocument?.id === doc.id && "bg-accent"
                        )}
                        onClick={() => {
                          if (!isEditing) {
                            setCurrentDocument(doc)
                            setEditorContent(doc.content)
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span className="truncate">{doc.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center - Editor */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              {/* Editor Content */}
              <div className="flex-1 flex">
                <Tabs defaultValue="editor" className="flex-1 flex flex-col" onValueChange={handleTabChange}>
                  <TabsList className="w-fit mx-4 mt-1 flex-shrink-0">
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="split">Split</TabsTrigger>
                  </TabsList>
                 
                  <TabsContent value="editor" className="flex-1 m-0">
                    <div className="h-full p-2">
                      <div className="relative w-full h-full">
                        <textarea
                          value={editorContent}
                          onChange={(e) => {
                            setEditorContent(e.target.value)
                            setIsEditing(true)
                          }}
                          onBlur={() => setIsEditing(false)}
                          onSelect={handleTextSelection}
                          onMouseUp={handleTextSelection}
                          onKeyUp={handleTextSelection}
                          onClick={handleCursorPosition}
                          onKeyDown={handleCursorPosition}
                          className="w-full h-full p-4 border border-border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                          placeholder="Start writing your LaTeX document..."
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
                        <h3 className="text-sm font-medium">Preview</h3>
                      </div>
                      <div style={{ height: 'calc(100vh - 240px)', overflow: 'auto' }}>
                        {compiledContent ? (
                          <div 
                            dangerouslySetInnerHTML={{ __html: compiledContent }} 
                            className="p-4 max-w-none preview-content"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                              <Eye className="h-8 w-8 mx-auto mb-2" />
                              <p>Click "Compile" to see preview</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                 
                  <TabsContent value="split" className="flex-1 m-0">
                    <div className="flex gap-2 p-2" style={{ height: 'calc(100vh - 180px)' }}>
                      <div className="flex-1 relative">
                        <textarea
                          value={editorContent}
                          onChange={(e) => {
                            setEditorContent(e.target.value)
                            setIsEditing(true)
                          }}
                          onBlur={() => setIsEditing(false)}
                          onSelect={handleTextSelection}
                          onMouseUp={handleTextSelection}
                          onKeyUp={handleTextSelection}
                          onClick={handleCursorPosition}
                          onKeyDown={handleCursorPosition}
                          className="w-full h-full p-4 border border-border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                          placeholder="Start writing your LaTeX document..."
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
                          {compiledContent ? (
                            <div 
                              dangerouslySetInnerHTML={{ __html: compiledContent }} 
                              className="p-4 max-w-none preview-content"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <div className="text-center">
                                <Eye className="h-8 w-8 mx-auto mb-2" />
                                <p>Click "Compile" to see preview</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar - AI Tools */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
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
    </div>
  )
}
