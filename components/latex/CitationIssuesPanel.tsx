'use client'

import React, { useState, useMemo } from 'react'
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Filter, 
  Copy, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle, 
  X,
  RefreshCw,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { 
  CitationCheckJob, 
  CitationIssue, 
  CitationFilter, 
  CitationIssueType 
} from '@/types/citations'
import { 
  CitationIssueTypeLabels, 
  CitationSeverityColors, 
  CitationStepLabels 
} from '@/types/citations'

interface CitationIssuesPanelProps {
  job: CitationCheckJob | null
  open: boolean
  onOpenChange: (value: boolean) => void
  onJumpToRange?: (from: number, to: number) => void
  onRecheck?: () => void
  onHighlightIssue?: (issue: CitationIssue | null) => void
  timeoutWarning?: boolean
  contentHashStale?: boolean
  onDismissStaleWarning?: () => void
}

export function CitationIssuesPanel({
  job,
  open,
  onOpenChange,
  onJumpToRange,
  onRecheck,
  onHighlightIssue,
  timeoutWarning = false,
  contentHashStale = false,
  onDismissStaleWarning
}: CitationIssuesPanelProps) {
  const [filter, setFilter] = useState<CitationFilter>({
    types: [],
    severities: [],
    searchText: ''
  })
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set())
  const [hoveredIssue, setHoveredIssue] = useState<string | null>(null)

  // Filter issues based on current filter settings
  const filteredIssues = useMemo(() => {
    if (!job?.issues) return []
    
    return job.issues.filter(issue => {
      // Type filter
      if (filter.types.length > 0 && !filter.types.includes(issue.type)) {
        return false
      }
      
      // Severity filter
      if (filter.severities.length > 0 && !filter.severities.includes(issue.severity)) {
        return false
      }
      
      // Search text filter
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase()
        return (
          issue.snippet.toLowerCase().includes(searchLower) ||
          issue.type.toLowerCase().includes(searchLower) ||
          issue.suggestions.some(s => 
            s.title?.toLowerCase().includes(searchLower) ||
            s.authors?.some(a => a.toLowerCase().includes(searchLower))
          )
        )
      }
      
      return true
    })
  }, [job?.issues, filter])

  const toggleIssueExpanded = (issueId: string) => {
    setExpandedIssues(prev => {
      const newSet = new Set(prev)
      if (newSet.has(issueId)) {
        newSet.delete(issueId)
      } else {
        newSet.add(issueId)
      }
      return newSet
    })
  }

  const handleIssueHover = (issue: CitationIssue | null) => {
    setHoveredIssue(issue?.id || null)
    onHighlightIssue?.(issue)
  }

  const handleJumpToIssue = (issue: CitationIssue) => {
    onJumpToRange?.(issue.from, issue.to)
  }

  const copyBibTeX = (bibTeX: string) => {
    navigator.clipboard.writeText(bibTeX)
  }

  const allIssueTypes: CitationIssueType[] = [
    'missing-citation',
    'weak-citation', 
    'orphan-reference',
    'incorrect-metadata',
    'plausible-claim-no-source',
    'possible-plagiarism'
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-hidden flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Citation Issues
            {job?.summary?.total && (
              <Badge variant="destructive">
                {job.summary.total} issue{job.summary.total !== 1 ? 's' : ''}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Review and resolve citation issues in your LaTeX document
          </SheetDescription>
        </SheetHeader>

        {/* Stale Content Warning */}
        {contentHashStale && (
          <div className="flex-shrink-0 border border-amber-200 rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Content has changed</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Citation results may be outdated. Re-run check for accuracy.
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center space-x-2">
                <Button
                  onClick={onRecheck}
                  variant="outline"
                  size="sm"
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 dark:bg-amber-900 dark:hover:bg-amber-800 dark:text-amber-200 dark:border-amber-700"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Re-check
                </Button>
                <Button
                  onClick={onDismissStaleWarning}
                  variant="ghost"
                  size="sm"
                  className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
                  title="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Section */}
        {job?.status === 'RUNNING' && (
          <div className="flex-shrink-0 border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">
                {CitationStepLabels[job.step]}
              </span>
            </div>
            <Progress value={job.progressPct} className="w-full" />
            <p className="text-xs text-muted-foreground mt-1">
              {job.progressPct}% complete
            </p>
            {timeoutWarning && (
              <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">Taking longer than expected</span>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Switched to backup mode. Citation check is still running...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {job?.status === 'ERROR' && (
          <div className="flex-shrink-0 border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <X className="h-4 w-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {job.errorMessage || 'An error occurred during citation checking'}
            </p>
            <Button 
              onClick={onRecheck}
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Controls */}
        {job?.status === 'DONE' && job.issues && (
          <>
            <div className="flex-shrink-0 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={filter.searchText}
                  onChange={(e) => setFilter(prev => ({ ...prev, searchText: e.target.value }))}
                  className="pl-9"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  <span className="text-xs text-muted-foreground">Type:</span>
                </div>
                {allIssueTypes.map(type => (
                  <Button
                    key={type}
                    variant={filter.types.includes(type) ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setFilter(prev => ({
                      ...prev,
                      types: prev.types.includes(type) 
                        ? prev.types.filter(t => t !== type)
                        : [...prev.types, type]
                    }))}
                  >
                    {CitationIssueTypeLabels[type]}
                  </Button>
                ))}
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Showing {filteredIssues.length} of {job.issues.length} issues
                </span>
                <Button 
                  onClick={onRecheck}
                  variant="outline" 
                  size="sm"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Recheck
                </Button>
              </div>
            </div>

            {/* Issues List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={cn(
                    "border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                    hoveredIssue === issue.id && "ring-2 ring-blue-500"
                  )}
                  onMouseEnter={() => handleIssueHover(issue)}
                  onMouseLeave={() => handleIssueHover(null)}
                  onClick={() => handleJumpToIssue(issue)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={CitationSeverityColors[issue.severity]}>
                        {issue.severity}
                      </Badge>
                      <Badge variant="outline">
                        {CitationIssueTypeLabels[issue.type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Line {issue.lineStart}{issue.lineEnd !== issue.lineStart ? `-${issue.lineEnd}` : ''}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleIssueExpanded(issue.id)
                      }}
                    >
                      <ChevronDown 
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedIssues.has(issue.id) && "rotate-180"
                        )} 
                      />
                    </Button>
                  </div>

                  {/* Snippet */}
                  <div className="text-sm bg-muted/50 rounded p-2 mb-2 font-mono">
                    {issue.snippet}
                  </div>

                  {/* Cited Keys */}
                  {issue.citedKeys.length > 0 && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Citations: {issue.citedKeys.map(key => `\\cite{${key}}`).join(', ')}
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedIssues.has(issue.id) && (
                    <div className="space-y-3 pt-2 border-t">
                      {/* Suggestions */}
                      {issue.suggestions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Suggested Citations:</h4>
                          <div className="space-y-2">
                            {issue.suggestions.map((suggestion, idx) => (
                              <div key={idx} className="bg-muted/30 rounded p-2 text-xs">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-medium">{suggestion.title}</div>
                                    {suggestion.authors && (
                                      <div className="text-muted-foreground">
                                        {suggestion.authors.join(', ')}
                                      </div>
                                    )}
                                    {suggestion.year && (
                                      <div className="text-muted-foreground">
                                        {suggestion.year}
                                      </div>
                                    )}
                                    <div className="text-muted-foreground">
                                      Score: {(suggestion.score * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    {suggestion.bibTex && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          copyBibTeX(suggestion.bibTex!)
                                        }}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    )}
                                    {suggestion.url && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          window.open(suggestion.url, '_blank')
                                        }}
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evidence */}
                      {issue.evidence.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Evidence:</h4>
                          <div className="space-y-1">
                            {issue.evidence.map((evidence, idx) => (
                              <div key={idx} className="text-xs bg-muted/20 rounded p-2">
                                <div className="font-medium mb-1">{evidence.matchedText}</div>
                                <div className="text-muted-foreground">
                                  {evidence.source.kind === 'local' ? (
                                    <>Local: {evidence.source.paperTitle}</>
                                  ) : (
                                    <>Web: {evidence.source.domain}</>
                                  )}
                                  {' • '}
                                  Similarity: {(evidence.similarity * 100).toFixed(1)}%
                                  {' • '}
                                  Support: {(evidence.supportScore * 100).toFixed(1)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {filteredIssues.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {job.issues?.length === 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <p>No citation issues found!</p>
                      <p className="text-xs">Your document appears to have proper citations.</p>
                    </div>
                  ) : (
                    <p>No issues match your current filters.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* No Job State */}
        {!job && (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
            <div>
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No citation check has been run yet.</p>
              <p className="text-xs">Click "Citation Check" in the toolbar to get started.</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}