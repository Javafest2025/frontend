"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  FileText, 
  RefreshCw, 
  BookOpen, 
  Users, 
  Calendar,
  ExternalLink,
  Plus,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { libraryApi } from "@/lib/api/project-service"
import { triggerBatchExtraction, type BatchExtractionResponse, type BatchExtractionItemResult } from "@/lib/api/project-service/latex-extraction"
import type { Paper } from "@/types/websearch"
import { Progress } from "@/components/ui/progress"

interface PapersSelectorProps {
  projectId: string
  onPapersLoad?: (papers: Paper[]) => void
  onOpenPaper?: (paper: Paper) => void
  className?: string
}

export function PapersSelector({ projectId, onPapersLoad, onOpenPaper, className }: PapersSelectorProps) {
  const [allPapers, setAllPapers] = useState<Paper[]>([])
  const [contextPapers, setContextPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState<Set<string>>(new Set())
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedInDialog, setSelectedInDialog] = useState<Set<string>>(new Set())
  const [batchProgress, setBatchProgress] = useState<{ running: boolean; total: number; completed: number; summary?: string } | null>(null)
  const [perPaperStatus, setPerPaperStatus] = useState<Record<string, { status: string; error?: string }>>({})

  // Load all papers for the project
  const loadProjectPapers = async () => {
    if (!projectId) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('Loading papers for project:', projectId)
      const libraryResponse = await libraryApi.getProjectLibrary(projectId)
      
      if (libraryResponse?.papers && Array.isArray(libraryResponse.papers)) {
        setAllPapers(libraryResponse.papers)
        
        // Extract papers that are already marked as LaTeX context
        const existingContextPapers = libraryResponse.papers.filter(paper => paper.isLatexContext)
        setContextPapers(existingContextPapers)
        
        console.log(`Loaded ${libraryResponse.papers.length} papers, ${existingContextPapers.length} in LaTeX context`)
        
        // Notify parent component about loaded papers
        if (onPapersLoad) {
          onPapersLoad(existingContextPapers)
        }
      } else {
        console.warn('Invalid library response:', libraryResponse)
        setAllPapers([])
        setContextPapers([])
      }
    } catch (error) {
      console.error('Error loading project papers:', error)
      setError('Failed to load papers')
      setAllPapers([])
      setContextPapers([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load papers on mount and when projectId changes
  useEffect(() => {
    loadProjectPapers()
  }, [projectId])

  // Handle opening the add dialog
  const handleOpenAddDialog = () => {
    // Initialize dialog selection with current context papers
    const currentContextIds = new Set(contextPapers.map(paper => paper.id))
    setSelectedInDialog(currentContextIds)
    setShowAddDialog(true)
  }

  // Handle paper toggle in dialog
  const handleDialogPaperToggle = (paperId: string, isSelected: boolean) => {
    setSelectedInDialog(prev => {
      const newSet = new Set(prev)
      if (isSelected) {
        newSet.add(paperId)
      } else {
        newSet.delete(paperId)
      }
      return newSet
    })
  }

  // Handle saving changes from dialog
  const handleSaveChanges = async () => {
    setIsToggling(new Set(['saving']))
    
    try {
      // Find papers to add and remove
      const currentContextIds = new Set(contextPapers.map(paper => paper.id))
      const newSelectedIds = selectedInDialog
      
      const toAdd = Array.from(newSelectedIds).filter(id => !currentContextIds.has(id))
      const toRemove = Array.from(currentContextIds).filter(id => !newSelectedIds.has(id))
      
      // Update papers individually
      for (const paperId of toAdd) {
        await libraryApi.toggleLatexContext(paperId, true)
      }
      
      for (const paperId of toRemove) {
        await libraryApi.toggleLatexContext(paperId, false)
      }
      
      // Update local state
      const newContextPapers = allPapers.filter(paper => newSelectedIds.has(paper.id))
      setContextPapers(newContextPapers)
      
      // Update all papers state to reflect changes
      setAllPapers(prev => prev.map(paper => ({
        ...paper,
        isLatexContext: newSelectedIds.has(paper.id)
      })))
      
      // Notify parent
      if (onPapersLoad) {
        onPapersLoad(newContextPapers)
      }
      
      setShowAddDialog(false)
      console.log('Successfully updated LaTeX context papers')
      // Trigger background extraction for all newly selected context papers
      if (toAdd.length > 0) {
        // Start batch with optimistic UI
        setBatchProgress({ running: true, total: newContextPapers.length, completed: 0 })
        // Determine all context IDs to ensure extraction coverage
        const contextIds = Array.from(newSelectedIds)
        // Kick off batch trigger
        triggerBatchExtraction(contextIds, true).then((batch: BatchExtractionResponse) => {
          // Initialize per-paper statuses based on batch response
          const statusMap: Record<string, { status: string; error?: string }> = {}
          batch.results.forEach((item: BatchExtractionItemResult) => {
            // Map backend actions to frontend status
            if (item.action === 'SKIPPED_ALREADY_EXTRACTED') {
              statusMap[item.paperId] = { status: 'COMPLETED' }
            } else if (item.action === 'ERROR') {
              statusMap[item.paperId] = { status: 'FAILED', error: item.message }
            } else if (item.action === 'SKIPPED_IN_PROGRESS') {
              statusMap[item.paperId] = { status: item.status || 'PROCESSING' }
            } else {
              // TRIGGERED - start as pending/processing
              statusMap[item.paperId] = { status: item.status || 'PENDING' }
            }
          })
          setPerPaperStatus(statusMap)
          // Begin polling until all are extracted or failed
          const pollIds = contextIds.slice()
          const updateCompleted = () => {
            const completedCount = Object.values(statusMap).filter(s => s.status === 'COMPLETED' || s.status === 'FAILED').length
            setBatchProgress(prev => prev ? { ...prev, completed: Math.min(completedCount, prev.total) } : null)
          }
          // Initial update to reflect already completed/failed items from batch response
          updateCompleted()
          const pollOnce = async () => {
            // Lazy import existing helpers to avoid circular deps
            const { isPaperExtracted, getExtractionStatusOnly } = await import("@/lib/api/project-service/extraction")
            await Promise.all(pollIds.map(async pid => {
              const cur = statusMap[pid]?.status
              // Skip polling papers that are already completed or failed
              if (cur === 'COMPLETED' || cur === 'FAILED') return
              try {
                const done = await isPaperExtracted(pid)
                if (done) {
                  statusMap[pid] = { status: 'COMPLETED' }
                } else {
                  const st = await getExtractionStatusOnly(pid)
                  statusMap[pid] = { status: st || 'PENDING' }
                }
              } catch (e:any) {
                statusMap[pid] = { status: 'FAILED', error: e?.message || 'Error' }
              }
            }))
            setPerPaperStatus({ ...statusMap })
            updateCompleted()
          }
          const interval = setInterval(async () => {
            await pollOnce()
            const allDone = Object.values(statusMap).every(s => s.status === 'COMPLETED' || s.status === 'FAILED')
            if (allDone) {
              clearInterval(interval)
              const success = Object.values(statusMap).filter(s => s.status === 'COMPLETED').length
              const failed = Object.values(statusMap).filter(s => s.status === 'FAILED').length
              const summary = `${success} of ${contextIds.length} papers extracted${failed ? `, ${failed} failed` : ''}`
              setBatchProgress({ running: false, total: contextIds.length, completed: contextIds.length, summary })
              // Persist a lightweight summary for the editor header
              try { localStorage.setItem(`latex-extraction-${projectId}`, summary) } catch {}
            }
          }, 3000)
          // Kick a first immediate poll
          pollOnce()
        }).catch((err: unknown) => {
          console.error('Batch extraction trigger failed', err)
          setBatchProgress({ running: false, total: 0, completed: 0, summary: 'Extraction trigger failed' })
        })
      }
    } catch (error) {
      console.error('Error updating papers context:', error)
      setError('Failed to update papers context')
    } finally {
      setIsToggling(new Set())
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadProjectPapers()
    setIsRefreshing(false)
  }

  // Remove individual paper from context
  const handleRemovePaper = async (paperId: string) => {
    setIsToggling(prev => new Set(prev.add(paperId)))
    
    try {
      await libraryApi.toggleLatexContext(paperId, false)
      
      // Update local state
      const newContextPapers = contextPapers.filter(paper => paper.id !== paperId)
      setContextPapers(newContextPapers)
      
      // Update all papers state
      setAllPapers(prev => prev.map(paper => 
        paper.id === paperId 
          ? { ...paper, isLatexContext: false }
          : paper
      ))
      
      // Notify parent
      if (onPapersLoad) {
        onPapersLoad(newContextPapers)
      }
      
      console.log('Successfully removed paper from LaTeX context:', paperId)
    } catch (error) {
      console.error('Error removing paper from context:', error)
      setError('Failed to remove paper from context')
    } finally {
      setIsToggling(prev => {
        const newSet = new Set(prev)
        newSet.delete(paperId)
        return newSet
      })
    }
  }

  // Format authors display
  const formatAuthors = (authors: Paper['authors']) => {
    if (!authors || authors.length === 0) return 'Unknown authors'
    if (authors.length === 1) return authors[0].name
    if (authors.length <= 3) return authors.map(a => a.name).join(', ')
    return `${authors[0].name} et al. (${authors.length} authors)`
  }

  // Format publication date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).getFullYear().toString()
    } catch {
      return 'Unknown year'
    }
  }

  if (isLoading) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <div className="p-3 border-b border-border">
          <h4 className="font-medium text-sm">Papers</h4>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin text-primary mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-muted-foreground">Loading papers...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={cn("h-full flex flex-col bg-card border-r border-border", className)}>
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm">Papers</h4>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleOpenAddDialog}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Papers included in LaTeX context
          </p>
          {batchProgress && (
            <div className="mt-2 space-y-1">
              <Progress value={batchProgress.total ? (batchProgress.completed / batchProgress.total) * 100 : 0} />
              <div className="text-xs text-muted-foreground">
                {batchProgress.running ? `Extracting ${batchProgress.completed}/${batchProgress.total} papers...` : (batchProgress.summary || 'Extraction ready')}
              </div>
            </div>
          )}
          {!batchProgress && (
            <>
              {(() => { try { const s = localStorage.getItem(`latex-extraction-${projectId}`); return s ? <div className="text-xs text-muted-foreground mt-1">{s}</div> : null } catch { return null } })()}
            </>
          )}
          {contextPapers.length > 0 && (
            <Badge variant="secondary" className="text-xs mt-1">
              {contextPapers.length} selected
            </Badge>
          )}
        </div>
        
        <div className="flex-1 overflow-hidden">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border-b border-red-200">
              {error}
            </div>
          )}
          
          {contextPapers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">No papers in context</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Click + to add papers to your LaTeX context
                </p>
                <Button size="sm" onClick={handleOpenAddDialog}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Papers
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-2 space-y-2">
                {contextPapers.map((paper) => {
                  const isRemoving = isToggling.has(paper.id)
                  
                  return (
                    <div
                      key={paper.id}
                      className={cn(
                        "p-2 rounded-md border bg-accent/30 border-primary/50 relative cursor-pointer hover:bg-accent/50 transition-colors",
                        isRemoving && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => {
                        if (!isRemoving && onOpenPaper) {
                          onOpenPaper(paper);
                        }
                      }}
                      title={onOpenPaper ? "Click to open PDF in editor" : ""}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium leading-tight mb-1 line-clamp-2 text-primary">
                            {paper.title}
                          </h5>
                          
                          <div className="text-xs text-muted-foreground">
                            <div className="flex items-center mb-1">
                              <Users className="h-3 w-3 mr-1" />
                              <span className="truncate">
                                {formatAuthors(paper.authors)}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(paper.publicationDate)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the paper click
                              handleRemovePaper(paper.id);
                            }}
                            disabled={isRemoving}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {isRemoving && (
                        <div className="absolute inset-0 bg-background/50 rounded-md flex items-center justify-center">
                          <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Add Papers Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Papers to LaTeX Context</DialogTitle>
            <DialogDescription>
              Select papers to include in your LaTeX context. These papers will be available as background knowledge for AI assistance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {allPapers.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No papers found in project</p>
                  <p className="text-sm text-muted-foreground">
                    Add papers to your project library first
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-2 p-1">
                  {allPapers.map((paper) => {
                    const isSelected = selectedInDialog.has(paper.id)
                    
                    return (
                      <div
                        key={paper.id}
                        className={cn(
                          "p-3 rounded-md border hover:bg-accent/50 transition-colors",
                          isSelected && "bg-accent/30 border-primary/50"
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleDialogPaperToggle(paper.id, checked === true)
                            }
                            className="mt-1"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h5 className={cn(
                              "text-sm font-medium leading-tight mb-2 line-clamp-2",
                              isSelected && "text-primary"
                            )}>
                              {paper.title}
                            </h5>
                            
                            <div className="space-y-1">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Users className="h-3 w-3 mr-1" />
                                <span className="truncate">
                                  {formatAuthors(paper.authors)}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>{formatDate(paper.publicationDate)}</span>
                                </div>
                                
                                {paper.citationCount > 0 && (
                                  <div className="flex items-center">
                                    <span className="text-xs">
                                      {paper.citationCount} citations
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {paper.venueName && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {paper.venueName}
                                </div>
                              )}
                            </div>
                            
                            {paper.pdfUrl && (
                              <div className="mt-2 flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => window.open(paper.pdfUrl, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  PDF
                                </Button>
                                
                                {onOpenPaper && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => onOpenPaper(paper)}
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    Open
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
          
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                {selectedInDialog.size} papers selected
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={isToggling.has('saving')}
                >
                  {isToggling.has('saving') ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
