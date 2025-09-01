'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileText, 
  CheckCircle,
  AlertCircle,
  Lightbulb,
  BookOpen,
  RefreshCw,
  Copy,
  Check,
  X
} from 'lucide-react'
import { latexApi } from '@/lib/api/latex-service'

interface AIAssistancePanelProps {
  content: string
  onApplySuggestion: (suggestion: string) => void
}

export function AIAssistancePanel({ content, onApplySuggestion }: AIAssistancePanelProps) {
  const [isReviewing, setIsReviewing] = useState(false)
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false)
  const [isValidatingCitations, setIsValidatingCitations] = useState(false)
  
  const [reviewResults, setReviewResults] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<string>('')
  const [complianceResults, setComplianceResults] = useState<any>(null)
  const [citationResults, setCitationResults] = useState<any>(null)

  const handleReviewDocument = async () => {
    if (!content.trim()) {
      alert('No content to review')
      return
    }

    setIsReviewing(true)
    try {
      const response = await latexApi.reviewDocument(content)
      setReviewResults(response.data)
    } catch (error) {
      console.error('Review failed:', error)
      alert('Failed to review document')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleGenerateSuggestions = async () => {
    if (!content.trim()) {
      alert('No content to analyze')
      return
    }

    setIsGeneratingSuggestions(true)
    try {
      const response = await latexApi.generateSuggestions(content, 'academic writing')
      setSuggestions(response.data)
    } catch (error) {
      console.error('Suggestion generation failed:', error)
      alert('Failed to generate suggestions')
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  const handleCheckCompliance = async () => {
    if (!content.trim()) {
      alert('No content to check')
      return
    }

    setIsCheckingCompliance(true)
    try {
      const response = await latexApi.checkCompliance(content, 'IEEE')
      setComplianceResults(response.data)
    } catch (error) {
      console.error('Compliance check failed:', error)
      alert('Failed to check compliance')
    } finally {
      setIsCheckingCompliance(false)
    }
  }

  const handleValidateCitations = async () => {
    if (!content.trim()) {
      alert('No content to validate')
      return
    }

    setIsValidatingCitations(true)
    try {
      const response = await latexApi.validateCitations(content)
      setCitationResults(response.data)
    } catch (error) {
      console.error('Citation validation failed:', error)
      alert('Failed to validate citations')
    } finally {
      setIsValidatingCitations(false)
    }
  }

  const handleCopySuggestion = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  return (
    <div className="h-full bg-card p-3 space-y-4">
      {/* AI Tools */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Document Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleReviewDocument}
            disabled={isReviewing}
          >
            {isReviewing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {isReviewing ? 'Reviewing...' : 'Review Document'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleGenerateSuggestions}
            disabled={isGeneratingSuggestions}
          >
            {isGeneratingSuggestions ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4 mr-2" />
            )}
            {isGeneratingSuggestions ? 'Generating...' : 'Writing Suggestions'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleCheckCompliance}
            disabled={isCheckingCompliance}
          >
            {isCheckingCompliance ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {isCheckingCompliance ? 'Checking...' : 'Check Compliance'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleValidateCitations}
            disabled={isValidatingCitations}
          >
            {isValidatingCitations ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4 mr-2" />
            )}
            {isValidatingCitations ? 'Validating...' : 'Validate Citations'}
          </Button>
        </CardContent>
      </Card>

      {/* Review Results */}
      {reviewResults && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Clarity Score</span>
              <Badge variant="outline">
                {(reviewResults.clarityScore * 100).toFixed(0)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Completeness Score</span>
              <Badge variant="outline">
                {(reviewResults.completenessScore * 100).toFixed(0)}%
              </Badge>
            </div>
            {reviewResults.grammarIssues && reviewResults.grammarIssues.length > 0 && (
              <div>
                <span className="text-sm font-medium">Grammar Issues:</span>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  {reviewResults.grammarIssues.map((issue: string, index: number) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Writing Suggestions */}
      {suggestions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Writing Suggestions
              <div className="ml-auto flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopySuggestion(suggestions)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onApplySuggestion(suggestions)}
                  className="h-6 w-6 p-0 text-green-600"
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="text-sm whitespace-pre-wrap">{suggestions}</div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Compliance Results */}
      {complianceResults && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Compliance Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Word Count</span>
              <Badge variant="outline">{complianceResults.wordCount || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Page Count</span>
              <Badge variant="outline">{complianceResults.pageCount || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Has Abstract</span>
              {complianceResults.hasAbstract ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Has References</span>
              {complianceResults.hasReferences ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Citation Results */}
      {citationResults && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Citation Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Valid Citations</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {citationResults.validCitations?.length || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Invalid Citations</span>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                {citationResults.invalidCitations?.length || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Missing Sources</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                {citationResults.missingSources?.length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Templates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Quick Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => onApplySuggestion(`
\\section{New Section}
Your content goes here...
`)}
          >
            Add Section
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => onApplySuggestion(`
\\begin{equation}
E = mc^2
\\end{equation}
`)}
          >
            Add Equation
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => onApplySuggestion(`
\\begin{figure}[h]
\\centering
\\includegraphics[width=0.8\\textwidth]{figure.png}
\\caption{Figure caption}
\\label{fig:figure}
\\end{figure}
`)}
          >
            Add Figure
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => onApplySuggestion(`
\\begin{table}[h]
\\centering
\\begin{tabular}{|c|c|c|}
\\hline
Column 1 & Column 2 & Column 3 \\\\
\\hline
Data 1 & Data 2 & Data 3 \\\\
\\hline
\\end{tabular}
\\caption{Table caption}
\\label{tab:table}
\\end{table}
`)}
          >
            Add Table
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

