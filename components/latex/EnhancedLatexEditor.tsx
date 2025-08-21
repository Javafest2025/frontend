'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  ChevronRight,
  Code,
  Palette,
  Type,
  Table,
  Image,
  Function
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { latexApi } from "@/lib/api/latex-service"
import { AIChatPanel } from "./AIChatPanel"
import { AIAssistancePanel } from "./AIAssistancePanel"

interface EnhancedLatexEditorProps {
  content: string
  onContentChange: (content: string) => void
  onApplySuggestion: (suggestion: string, position?: number) => void
  selectedText?: string
  cursorPosition?: number
}

interface LatexCopilotResponse {
  latex: string
  meta: {
    requiresPackages: string[]
    notes: string
    previewHints: {
      fastPreviewFallback: boolean
      accuratePreviewRecommended: boolean
    }
    anchors: {
      labels: string[]
      referencesTouched: string[]
    }
    editorHints: {
      cursor: {
        strategy: 'afterEnvironment' | 'atLabel' | 'atCaption'
        lineDelta: number
        colDelta: number
      }
      selection: {
        relativeStart: number
        relativeEnd: number
      }
      foldableEnv: 'table' | 'figure' | 'algorithm' | 'none'
      applyMode: 'insert' | 'replace'
    }
  }
}

export function EnhancedLatexEditor({ 
  content, 
  onContentChange, 
  onApplySuggestion, 
  selectedText, 
  cursorPosition 
}: EnhancedLatexEditorProps) {
  const [editorContent, setEditorContent] = useState(content)
  const [compiledContent, setCompiledContent] = useState('')
  const [isCompiling, setIsCompiling] = useState(false)
  const [isPdfCompiling, setIsPdfCompiling] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')
  const [showCopilotPanel, setShowCopilotPanel] = useState(false)
  const [copilotQuery, setCopilotQuery] = useState('')
  const [copilotResponse, setCopilotResponse] = useState<LatexCopilotResponse | null>(null)
  const [isCopilotLoading, setIsCopilotLoading] = useState(false)
  
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Sync with parent content
  useEffect(() => {
    setEditorContent(content)
  }, [content])

  // Auto-compile on content change with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editorContent && activeTab === 'preview') {
        handleCompile()
      }
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [editorContent, activeTab])

  const handleCompile = useCallback(async () => {
    if (!editorContent.trim() || isCompiling) return
    
    setIsCompiling(true)
    try {
      const result = await latexApi.compileLatex({ latexContent: editorContent })
      
      if (result.data && typeof result.data === 'string' && result.data.length > 0) {
        setCompiledContent(result.data)
      } else {
        setCompiledContent(createErrorPreview('Invalid compilation result'))
      }
    } catch (error) {
      console.error('Compilation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setCompiledContent(createErrorPreview(`Compilation failed: ${errorMessage}`))
    } finally {
      setIsCompiling(false)
    }
  }, [editorContent, isCompiling])

  const handlePdfCompile = useCallback(async () => {
    if (!editorContent.trim() || isPdfCompiling) return
    
    setIsPdfCompiling(true)
    try {
      const pdfBlob = await latexApi.compileLatexToPdf({ latexContent: editorContent })
      
      // Create a download link for the PDF
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'document.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF compilation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`PDF compilation failed: ${errorMessage}`)
    } finally {
      setIsPdfCompiling(false)
    }
  }, [editorContent, isPdfCompiling])

  const createErrorPreview = (message: string) => `
    <div style="padding: 20px; background: white; color: black; font-family: 'Times New Roman', serif;">
      <h2 style="color: #dc2626; margin-bottom: 16px;">LaTeX Preview Error</h2>
      <p style="color: #dc2626; margin-bottom: 16px;">${message}</p>
      <details style="margin-top: 16px;">
        <summary style="cursor: pointer; color: #6b7280;">Show raw LaTeX content</summary>
        <pre style="background: #f3f4f6; padding: 12px; border-radius: 6px; white-space: pre-wrap; font-size: 12px; margin-top: 8px; border: 1px solid #e5e7eb;">${editorContent}</pre>
      </details>
    </div>
  `

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === 'preview' && editorContent && !compiledContent) {
      handleCompile()
    }
  }

  const handleContentChange = (newContent: string) => {
    setEditorContent(newContent)
    onContentChange(newContent)
  }

  const handleCopilotQuery = async () => {
    if (!copilotQuery.trim() || isCopilotLoading) return
    
    setIsCopilotLoading(true)
    try {
      // Simulate LaTeX copilot response based on the specification
      const response = await simulateLatexCopilot(copilotQuery, editorContent, selectedText, cursorPosition)
      setCopilotResponse(response)
      setShowCopilotPanel(true)
    } catch (error) {
      console.error('Copilot query failed:', error)
    } finally {
      setIsCopilotLoading(false)
    }
  }

  const simulateLatexCopilot = async (
    query: string, 
    content: string, 
    selection?: string, 
    cursorPos?: number
  ): Promise<LatexCopilotResponse> => {
    // This is a simulation - in production, this would call the actual LaTeX copilot API
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
    
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('table') || lowerQuery.includes('make this a table')) {
      return {
        latex: `\\begin{table}[t]
  \\centering
  \\caption{Data table}
  \\label{tab:data}
  \\begin{tabular}{@{}lcc@{}}
  \\toprule
  Column 1 & Column 2 & Column 3 \\\\
  \\midrule
  Data 1 & Data 2 & Data 3 \\\\
  Data 4 & Data 5 & Data 6 \\\\
  \\bottomrule
  \\end{tabular}
\\end{table}`,
        meta: {
          requiresPackages: ['booktabs'],
          notes: 'Added IEEE-compliant table with booktabs',
          previewHints: { fastPreviewFallback: false, accuratePreviewRecommended: false },
          anchors: { labels: ['tab:data'], referencesTouched: [] },
          editorHints: {
            cursor: { strategy: 'afterEnvironment', lineDelta: 0, colDelta: 0 },
            selection: { relativeStart: 0, relativeEnd: 0 },
            foldableEnv: 'table',
            applyMode: 'insert'
          }
        }
      }
    } else if (lowerQuery.includes('figure') || lowerQuery.includes('add a figure')) {
      return {
        latex: `\\begin{figure}[t]
  \\centering
  \\includegraphics[width=\\columnwidth]{images/figure.png}
  \\caption{Figure description}
  \\label{fig:figure}
\\end{figure}`,
        meta: {
          requiresPackages: ['graphicx'],
          notes: 'Assumes images/figure.png exists',
          previewHints: { fastPreviewFallback: false, accuratePreviewRecommended: false },
          anchors: { labels: ['fig:figure'], referencesTouched: [] },
          editorHints: {
            cursor: { strategy: 'afterEnvironment', lineDelta: 0, colDelta: 0 },
            selection: { relativeStart: 0, relativeEnd: 0 },
            foldableEnv: 'figure',
            applyMode: 'insert'
          }
        }
      }
    } else if (lowerQuery.includes('algorithm') || lowerQuery.includes('convert to algorithm')) {
      return {
        latex: `\\begin{algorithm}[t]
  \\caption{Algorithm description}
  \\label{alg:algorithm}
  \\begin{algorithmic}
  \\Function{FunctionName}{$parameters$}
    \\State $variable \\gets value$
    \\State \\Return $result$
  \\EndFunction
  \\end{algorithmic}
\\end{algorithm}`,
        meta: {
          requiresPackages: ['algorithm', 'algpseudocode'],
          notes: 'Added IEEE-compliant algorithm structure',
          previewHints: { fastPreviewFallback: true, accuratePreviewRecommended: true },
          anchors: { labels: ['alg:algorithm'], referencesTouched: [] },
          editorHints: {
            cursor: { strategy: 'afterEnvironment', lineDelta: 0, colDelta: 0 },
            selection: { relativeStart: 0, relativeEnd: 0 },
            foldableEnv: 'algorithm',
            applyMode: 'insert'
          }
        }
      }
    } else {
      // Generic improvement
      return {
        latex: `% ${query}
\\begin{quote}
  Improved content based on: "${query}"
\\end{quote}`,
        meta: {
          requiresPackages: [],
          notes: 'Generic improvement applied',
          previewHints: { fastPreviewFallback: false, accuratePreviewRecommended: false },
          anchors: { labels: [], referencesTouched: [] },
          editorHints: {
            cursor: { strategy: 'afterEnvironment', lineDelta: 0, colDelta: 0 },
            selection: { relativeStart: 0, relativeEnd: 0 },
            foldableEnv: 'none',
            applyMode: 'insert'
          }
        }
      }
    }
  }

  const applyCopilotSuggestion = () => {
    if (!copilotResponse) return
    
    const { latex, meta } = copilotResponse
    
    if (meta.editorHints.applyMode === 'replace' && selectedText) {
      // Replace selection
      const before = editorContent.substring(0, cursorPosition! - selectedText.length)
      const after = editorContent.substring(cursorPosition!)
      const newContent = before + latex + after
      handleContentChange(newContent)
    } else {
      // Insert at cursor or append
      if (cursorPosition !== undefined) {
        const before = editorContent.substring(0, cursorPosition)
        const after = editorContent.substring(cursorPosition)
        const newContent = before + '\n\n' + latex + '\n\n' + after
        handleContentChange(newContent)
      } else {
        const newContent = editorContent + '\n\n' + latex
        handleContentChange(newContent)
      }
    }
    
    // Close copilot panel
    setShowCopilotPanel(false)
    setCopilotResponse(null)
  }

  const quickActions = [
    { icon: Table, label: 'Table', action: () => setCopilotQuery('make this a table') },
    { icon: Image, label: 'Figure', action: () => setCopilotQuery('add a figure here') },
    { icon: Function, label: 'Algorithm', action: () => setCopilotQuery('convert to algorithm') },
    { icon: Code, label: 'Math', action: () => setCopilotQuery('format equations') },
    { icon: Type, label: 'Improve', action: () => setCopilotQuery('improve this paragraph (formal)') }
  ]

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="font-mono text-xs">
            LaTeX Editor
          </Badge>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCompile}
            disabled={isCompiling}
            className="h-8 px-3"
          >
            {isCompiling ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="ml-2">Compile</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePdfCompile}
            disabled={isPdfCompiling}
            className="h-8 px-3"
          >
            {isPdfCompiling ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-2">PDF</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={action.action}
              className="h-8 px-3"
            >
              <action.icon className="h-4 w-4 mr-1" />
              <action.icon className="h-4 w-4 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <TabsList className="w-fit mx-4 mt-2 flex-shrink-0">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="split">Split</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="flex-1 m-0">
            <div className="h-full p-2">
              <div className="relative w-full h-full">
                <textarea
                  ref={editorRef}
                  value={editorContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full h-full p-4 border border-border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background leading-relaxed"
                  placeholder="Start writing your LaTeX document..."
                  spellCheck={false}
                />
                
                {/* LaTeX Copilot Panel */}
                {showCopilotPanel && copilotResponse && (
                  <div className="absolute top-4 right-4 w-80 bg-card border border-border rounded-lg shadow-lg p-4 z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">LaTeX Copilot</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCopilotPanel(false)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-2">{copilotResponse.meta.notes || 'Suggestion ready'}</p>
                        {copilotResponse.meta.requiresPackages.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Required packages:</p>
                            <div className="flex flex-wrap gap-1">
                              {copilotResponse.meta.requiresPackages.map((pkg, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {pkg}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={applyCopilotSuggestion}
                          className="flex-1"
                        >
                          Apply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCopilotPanel(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 m-0">
            <div className="border border-border rounded-md m-2 bg-white" style={{ height: 'calc(100vh - 200px)' }}>
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="text-sm font-medium">Preview</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {isCompiling ? 'Compiling...' : 'Ready'}
                  </Badge>
                  {copilotResponse?.meta.previewHints.accuratePreviewRecommended && (
                    <Badge variant="secondary" className="text-xs">
                      PDF Recommended
                    </Badge>
                  )}
                </div>
              </div>
              
              <div 
                ref={previewRef}
                className="h-full overflow-auto p-4"
                style={{ height: 'calc(100vh - 260px)' }}
              >
                {compiledContent ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: compiledContent }} 
                    className="max-w-none preview-content"
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
            <div className="flex gap-2 p-2" style={{ height: 'calc(100vh - 200px)' }}>
              <div className="flex-1 relative">
                <textarea
                  value={editorContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full h-full p-4 border border-border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  placeholder="Start writing your LaTeX document..."
                />
              </div>
              
              <div className="flex-1 border border-border rounded-md bg-white">
                <div className="p-3 border-b border-border">
                  <h3 className="text-sm font-medium">Live Preview</h3>
                </div>
                <div className="h-full overflow-auto p-4">
                  {compiledContent ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: compiledContent }} 
                      className="max-w-none preview-content"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p>Type to see live preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* LaTeX Copilot Input */}
      <div className="border-t border-border p-3 bg-muted/30">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={copilotQuery}
              onChange={(e) => setCopilotQuery(e.target.value)}
              placeholder="Ask LaTeX Copilot: 'make this a table', 'add a figure', 'convert to algorithm'..."
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              onKeyPress={(e) => e.key === 'Enter' && handleCopilotQuery()}
            />
          </div>
          <Button
            onClick={handleCopilotQuery}
            disabled={isCopilotLoading || !copilotQuery.trim()}
            className="px-4"
          >
            {isCopilotLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4" />
            )}
            <span className="ml-2">Ask Copilot</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

