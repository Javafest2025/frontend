'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, Lightbulb, FileText, Target, BookOpen } from 'lucide-react'
import { useAIAssistance } from '@/lib/api/ongoing-research'

interface AIAssistancePanelProps {
  content: string
  onApplySuggestion?: (suggestion: string) => void
}

export function AIAssistancePanel({ content, onApplySuggestion }: AIAssistancePanelProps) {
  const [activeTab, setActiveTab] = useState('review')
  const [loading, setLoading] = useState(false)
  const [reviewData, setReviewData] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<string>('')
  const [complianceData, setComplianceData] = useState<any>(null)
  const [citationsData, setCitationsData] = useState<any>(null)
  const [correctionsData, setCorrectionsData] = useState<any>(null)

  const aiAssistance = useAIAssistance()

  const handleReview = async () => {
    if (!content.trim()) return
    
    setLoading(true)
    try {
      const response = await aiAssistance.reviewDocument({ content })
      setReviewData(response.data)
    } catch (error) {
      console.error('Review failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSuggestions = async () => {
    if (!content.trim()) return
    
    setLoading(true)
    try {
      const response = await aiAssistance.generateSuggestions({ 
        content, 
        context: 'research paper' 
      })
      setSuggestions(response.data)
    } catch (error) {
      console.error('Suggestions failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckCompliance = async () => {
    if (!content.trim()) return
    
    setLoading(true)
    try {
      const response = await aiAssistance.checkCompliance({ 
        content, 
        venue: 'IEEE Conference' 
      })
      setComplianceData(response.data)
    } catch (error) {
      console.error('Compliance check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleValidateCitations = async () => {
    if (!content.trim()) return
    
    setLoading(true)
    try {
      const response = await aiAssistance.validateCitations({ content })
      setCitationsData(response.data)
    } catch (error) {
      console.error('Citation validation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCorrections = async () => {
    if (!content.trim()) return
    
    setLoading(true)
    try {
      const response = await aiAssistance.generateCorrections({ content })
      setCorrectionsData(response.data)
    } catch (error) {
      console.error('Corrections failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderReviewSection = () => (
    <div className="space-y-4">
      <Button 
        onClick={handleReview} 
        disabled={loading || !content.trim()}
        className="w-full"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
        Review Document
      </Button>

      {reviewData && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quality Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Clarity Score:</span>
                <Badge variant={reviewData.clarityScore > 0.7 ? 'default' : 'destructive'}>
                  {Math.round(reviewData.clarityScore * 100)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Completeness Score:</span>
                <Badge variant={reviewData.completenessScore > 0.7 ? 'default' : 'destructive'}>
                  {Math.round(reviewData.completenessScore * 100)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {Object.keys(reviewData.grammarIssues).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive">Grammar Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {Object.entries(reviewData.grammarIssues).map(([key, value]) => (
                    <li key={key} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <span>{value as string}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {Object.keys(reviewData.styleSuggestions).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Style Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {Object.entries(reviewData.styleSuggestions).map(([key, value]) => (
                    <li key={key} className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{value as string}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )

  const renderSuggestionsSection = () => (
    <div className="space-y-4">
      <Button 
        onClick={handleGenerateSuggestions} 
        disabled={loading || !content.trim()}
        className="w-full"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
        Generate Suggestions
      </Button>

      {suggestions && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Writing Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm whitespace-pre-line">{suggestions}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderComplianceSection = () => (
    <div className="space-y-4">
      <Button 
        onClick={handleCheckCompliance} 
        disabled={loading || !content.trim()}
        className="w-full"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
        Check Compliance
      </Button>

      {complianceData && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Document Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Word Count:</span>
                <Badge variant="outline">{complianceData.wordCount}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Estimated Pages:</span>
                <Badge variant="outline">{complianceData.pageCount}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Has Abstract:</span>
                <Badge variant={complianceData.hasAbstract ? 'default' : 'destructive'}>
                  {complianceData.hasAbstract ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Has References:</span>
                <Badge variant={complianceData.hasReferences ? 'default' : 'destructive'}>
                  {complianceData.hasReferences ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {complianceData.ieeeCompliant !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">IEEE Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={complianceData.ieeeCompliant ? 'default' : 'destructive'}>
                  {complianceData.ieeeCompliant ? 'Compliant' : 'Not Compliant'}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )

  const renderCitationsSection = () => (
    <div className="space-y-4">
      <Button 
        onClick={handleValidateCitations} 
        disabled={loading || !content.trim()}
        className="w-full"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
        Validate Citations
      </Button>

      {citationsData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Citation Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Citations Found:</span>
              <Badge variant="outline">{citationsData.citationCount}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">References Found:</span>
              <Badge variant="outline">{citationsData.referenceCount}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Has Bibliography:</span>
              <Badge variant={citationsData.hasBibliography ? 'default' : 'destructive'}>
                {citationsData.hasBibliography ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Valid Format:</span>
              <Badge variant={citationsData.validCitations ? 'default' : 'destructive'}>
                {citationsData.validCitations ? 'Valid' : 'Invalid'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderCorrectionsSection = () => (
    <div className="space-y-4">
      <Button 
        onClick={handleGenerateCorrections} 
        disabled={loading || !content.trim()}
        className="w-full"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
        Generate Corrections
      </Button>

      {correctionsData && (
        <div className="space-y-4">
          {Object.keys(correctionsData.grammarCorrections).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive">Grammar Corrections</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {Object.entries(correctionsData.grammarCorrections).map(([key, value]) => (
                    <li key={key} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <span>{value as string}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {Object.keys(correctionsData.styleImprovements).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Style Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {Object.entries(correctionsData.styleImprovements).map(([key, value]) => (
                    <li key={key} className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{value as string}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {Object.keys(correctionsData.structureSuggestions).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Structure Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {Object.entries(correctionsData.structureSuggestions).map(([key, value]) => (
                    <li key={key} className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{value as string}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Writing Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!content.trim() && (
          <Alert>
            <AlertDescription>
              Start writing to enable AI assistance features.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="review" className="mt-4">
            <ScrollArea className="h-[400px]">
              {renderReviewSection()}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="suggestions" className="mt-4">
            <ScrollArea className="h-[400px]">
              {renderSuggestionsSection()}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="mt-4 space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCheckCompliance}
            disabled={loading || !content.trim()}
            className="w-full"
          >
            <Target className="mr-2 h-4 w-4" />
            Compliance
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleValidateCitations}
            disabled={loading || !content.trim()}
            className="w-full"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Citations
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateCorrections}
            disabled={loading || !content.trim()}
            className="w-full"
          >
            <FileText className="mr-2 h-4 w-4" />
            Corrections
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 