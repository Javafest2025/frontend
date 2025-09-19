"use client"

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, ExternalLink, FileText, Globe, X, Loader2, StopCircle } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { CitationIssue, CitationCheckJob } from "@/types/citations"
import { CitationIssueTypeLabels, CitationSeverityColors } from "@/types/citations"

interface CitationPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  issues: CitationIssue[]
  onNavigateToIssue?: (issue: CitationIssue) => void
  // NEW: Real-time job status support
  currentJob?: CitationCheckJob | null
  onCancelJob?: () => void
}

export function CitationPanel({ 
  open, 
  onOpenChange, 
  issues, 
  onNavigateToIssue,
  currentJob,
  onCancelJob 
}: CitationPanelProps) {
  // Ensure issues is always an array to prevent undefined errors
  const safeIssues = issues || []
  
  const groupedIssues = safeIssues.reduce((acc, issue) => {
    if (!acc[issue.type]) {
      acc[issue.type] = []
    }
    acc[issue.type].push(issue)
    return acc
  }, {} as Record<string, CitationIssue[]>)

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const renderEvidence = (issue: CitationIssue) => {
    if (!issue.evidence || issue.evidence.length === 0) {
      return <p className="text-sm text-muted-foreground">No supporting evidence found</p>
    }

    return (
      <div className="space-y-2">
        <h5 className="text-sm font-medium">Supporting Evidence:</h5>
        {issue.evidence.slice(0, 3).map((evidence, idx) => (
          <Card key={idx} className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {evidence.source.kind}
                </Badge>
                <div className="flex items-center gap-1">
                  {evidence.source.kind === 'web' ? <Globe className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                  <span className="text-xs text-muted-foreground">
                    {Math.round(evidence.similarity * 100)}% similarity
                  </span>
                </div>
              </div>
              <p className="text-sm">{evidence.matchedText}</p>
              {evidence.source.kind === 'web' && 'title' in evidence.source && evidence.source.title && (
                <p className="text-xs text-muted-foreground font-medium">
                  from: {evidence.source.title}
                </p>
              )}
              {evidence.source.kind === 'local' && 'paperTitle' in evidence.source && evidence.source.paperTitle && (
                <p className="text-xs text-muted-foreground font-medium">
                  from: {evidence.source.paperTitle}
                </p>
              )}
              {evidence.source.kind === 'web' && 'url' in evidence.source && evidence.source.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => window.open((evidence.source as any).url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Source
                </Button>
              )}
            </div>
          </Card>
        ))}
        
        {issue.evidence.length > 3 && (
          <p className="text-xs text-muted-foreground">
            ...and {issue.evidence.length - 3} more evidence sources
          </p>
        )}
      </div>
    )
  }

  const renderSuggestions = (issue: CitationIssue) => {
    if (!issue.suggestions || issue.suggestions.length === 0) {
      return <p className="text-sm text-muted-foreground">No citation suggestions available</p>
    }

    return (
      <div className="space-y-2">
        <h5 className="text-sm font-medium">Suggested Citations:</h5>
        {issue.suggestions.slice(0, 2).map((suggestion, idx) => (
          <Card key={idx} className="p-3">
            <div className="space-y-2">
              <h6 className="text-sm font-medium">{suggestion.title || 'Untitled Source'}</h6>
              {suggestion.description && (
                <p className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">
                  {suggestion.description}
                </p>
              )}
              {suggestion.authors && suggestion.authors.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  by {suggestion.authors.join(', ')}
                </p>
              )}
              {suggestion.year && (
                <p className="text-xs text-muted-foreground">
                  Year: {suggestion.year}
                </p>
              )}
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {suggestion.kind}
                </Badge>
                {suggestion.score && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(suggestion.score * 100)}% match
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {suggestion.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => window.open(suggestion.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Source
                  </Button>
                )}
                {suggestion.bibTex && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => navigator.clipboard.writeText(suggestion.bibTex!)}
                  >
                    Copy BibTeX
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Citation Issues</span>
              <Badge variant="secondary">{safeIssues.length} issues</Badge>
            </div>
            {/* Real-time Job Status with Cancel */}
            {currentJob && currentJob.status !== 'DONE' && currentJob.status !== 'ERROR' && onCancelJob && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-blue-600 font-medium">
                    {currentJob.step || 'Processing'}...
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {currentJob.progressPct || 0}%
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancelJob}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <StopCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </DialogTitle>
          <div className="space-y-2">
            <DialogDescription>
              Review and address citation issues found in your document
            </DialogDescription>
            {/* Progress Bar for Active Jobs */}
            {currentJob && currentJob.status !== 'DONE' && currentJob.status !== 'ERROR' && (
              <div className="space-y-2">
                <Progress 
                  value={currentJob.progressPct || 0} 
                  className="w-full h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {currentJob.step || 'Initializing'} • {currentJob.progressPct || 0}% complete
                </div>
              </div>
            )}
            {/* Error State Display */}
            {currentJob?.status === 'ERROR' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-800">
                    Citation check failed
                  </span>
                </div>
                {currentJob.errorMessage && (
                  <p className="text-sm text-red-700 mt-1">
                    {currentJob.errorMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto" data-pdf-scroll-container="true">
          <div className="space-y-6 pr-4 pb-4">
            {Object.entries(groupedIssues).map(([type, typeIssues]) => (
              <div key={type}>
                <div className="flex items-center space-x-2 mb-4">
                  <h3 className="text-lg font-semibold capitalize">{CitationIssueTypeLabels[type as keyof typeof CitationIssueTypeLabels] || type}</h3>
                  <Badge variant="outline">{typeIssues.length}</Badge>
                </div>
                
                <div className="space-y-4">
                  {typeIssues.map((issue) => (
                    <Card key={issue.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            {/* Issue Type and Severity */}
                            <div className="flex items-center space-x-2">
                              {getSeverityIcon(issue.severity)}
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", CitationSeverityColors[issue.severity])}
                              >
                                {issue.severity}
                              </Badge>
                            </div>
                            
                            {/* MOST IMPORTANT: Line Content with Citation Issue */}
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                              <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                                Citation Issue Found:
                              </div>
                              <div className="text-base text-red-900 dark:text-red-100 font-mono leading-relaxed">
                                "{issue.snippet}"
                              </div>
                              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                📍 Line {issue.lineStart}{issue.lineEnd !== issue.lineStart ? `-${issue.lineEnd}` : ''} • Position {issue.from}-{issue.to}
                              </div>
                            </div>
                            
                            {/* Current Citations (if any) */}
                            {(issue.citedKeys || []).length > 0 && (
                              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                                <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Current citations: </span>
                                {(issue.citedKeys || []).map((key, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs mr-1 border-blue-300">
                                    {key}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Go to Line Button */}
                          {onNavigateToIssue && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onNavigateToIssue(issue)}
                              className="ml-4 flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            >
                              Go to Line {issue.lineStart}
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <Separator />
                          {renderEvidence(issue)}
                          <Separator />
                          {renderSuggestions(issue)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {Object.keys(groupedIssues).indexOf(type) < Object.keys(groupedIssues).length - 1 && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
            
            {safeIssues.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No citation issues found</h3>
                <p className="text-sm text-muted-foreground">Your citations look good!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}