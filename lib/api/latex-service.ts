import { getMicroserviceUrl } from '@/lib/config/api-config'
import type { 
  CitationCheckJob, 
  CitationIssue,
  StartCitationCheckRequest, 
  StartCitationCheckResponse,
  UpdateCitationIssueRequest 
} from '@/types/citations'

// Convert backend CitationIssueDto to frontend CitationIssue format
const convertBackendIssuesToFrontend = (backendIssues: any[]): CitationIssue[] => {
  if (!backendIssues) return []
  
  console.log('🔄 Converting backend issues to frontend format:', backendIssues)
  
  return backendIssues.map((issue) => {
    console.log('🔍 Converting individual issue:', issue)
    console.log('🔍 Raw lineStart:', issue.lineStart, 'Type:', typeof issue.lineStart)
    console.log('🔍 Raw lineEnd:', issue.lineEnd, 'Type:', typeof issue.lineEnd)
    
    const converted = {
      id: issue.id,
      projectId: '', // Not provided by backend DTO
      documentId: '', // Not provided by backend DTO  
      texFileName: '', // Not provided by backend DTO
      type: issue.issueType || 'missing-citation', // issueType → type
      severity: (issue.severity || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
      from: issue.position || 0, // position → from
      to: (issue.position || 0) + (issue.length || 0), // position + length → to
      lineStart: issue.lineStart, // Use backend value directly - no fallbacks!
      lineEnd: issue.lineEnd, // Use backend value directly - no fallbacks!
      snippet: issue.citationText || '', // citationText → snippet
      citedKeys: [], // Backend doesn't provide this yet
      suggestions: issue.suggestions || [], // Use backend suggestions or empty array
      evidence: issue.evidence || [], // Use backend evidence or empty array
      createdAt: new Date().toISOString()
    }
    
    console.log('✅ Converted issue:', converted)
    console.log('✅ Final lineStart:', converted.lineStart, 'lineEnd:', converted.lineEnd)
    return converted
  })
}

// Types for LaTeX service
export interface CreateDocumentRequest {
  projectId: string
  title: string
  content?: string
  documentType?: 'LATEX' | 'MARKDOWN' | 'WORD' | 'TEXT'
}

export interface UpdateDocumentRequest {
  documentId: string
  title?: string
  content?: string
}

export interface CompileLatexRequest {
  latexContent: string
}

export interface GeneratePDFRequest {
  latexContent: string
  filename?: string
}

export interface DocumentResponse {
  id: string
  projectId: string
  title: string
  content: string
  documentType: string
  filePath?: string
  createdAt: string
  updatedAt: string
}

export interface APIResponse<T> {
  status: number
  message: string
  data: T
  timestamp?: string
}

export interface AIChatRequest {
  selectedText?: string
  userRequest: string
  fullDocument?: string
}

const getProjectServiceUrl = (endpoint: string) => getMicroserviceUrl('project-service', endpoint)

export const latexApi = {
  // Document management
  async createDocument(request: CreateDocumentRequest): Promise<APIResponse<DocumentResponse>> {
    const response = await fetch(getProjectServiceUrl('/api/documents'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Failed to create document: ${response.statusText}`)
    }

    return response.json()
  },

  async createDocumentWithName(projectId: string, fileName: string): Promise<APIResponse<DocumentResponse>> {
    const response = await fetch(getProjectServiceUrl(`/api/documents/create-with-name?projectId=${projectId}&fileName=${fileName}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to create document: ${response.statusText}`)
    }

    return response.json()
  },

  async getDocumentsByProjectId(projectId: string): Promise<APIResponse<DocumentResponse[]>> {
    const url = getProjectServiceUrl(`/api/documents/project/${projectId}`)
    console.log('Calling API URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('API Response status:', response.status, response.statusText)
    console.log('API Response headers:', response.headers)

    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('API Response data:', data)
    return data
  },

  async getDocumentById(documentId: string): Promise<APIResponse<DocumentResponse>> {
    const response = await fetch(getProjectServiceUrl(`/api/documents/${documentId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`)
    }

    return response.json()
  },

  async updateDocument(request: UpdateDocumentRequest): Promise<APIResponse<DocumentResponse>> {
    const response = await fetch(getProjectServiceUrl('/api/documents'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Failed to update document: ${response.statusText}`)
    }

    return response.json()
  },

  async deleteDocument(documentId: string): Promise<APIResponse<void>> {
    const response = await fetch(getProjectServiceUrl(`/api/documents/${documentId}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`)
    }

    return response.json()
  },

  // LaTeX compilation
  async compileLatex(request: CompileLatexRequest): Promise<APIResponse<string>> {
    const response = await fetch(getProjectServiceUrl('/api/documents/compile'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Failed to compile LaTeX: ${response.statusText}`)
    }

    return response.json()
  },

  // Direct PDF compilation using pdflatex
  async compileLatexToPdf(request: CompileLatexRequest): Promise<Blob> {
    const response = await fetch(getProjectServiceUrl('/api/documents/compile-pdf'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Failed to compile LaTeX to PDF: ${response.statusText}`)
    }

    return response.blob()
  },

  async generatePDF(request: GeneratePDFRequest): Promise<Blob> {
    const response = await fetch(getProjectServiceUrl('/api/documents/generate-pdf'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate PDF: ${response.statusText}`)
    }

    return response.blob()
  },

  // AI assistance
  async processChatRequest(request: AIChatRequest): Promise<APIResponse<string>> {
    const response = await fetch(getProjectServiceUrl('/api/ai-assistance/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Failed to process chat request: ${response.statusText}`)
    }

    return response.json()
  },

  // LaTeX AI Chat - File-specific chat sessions
  async getChatSession(documentId: string, projectId: string): Promise<APIResponse<any>> {
    const response = await fetch(getProjectServiceUrl(`/api/latex-ai-chat/session/${documentId}?projectId=${projectId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get chat session: ${response.statusText}`)
    }

    return response.json()
  },

  async sendChatMessage(documentId: string, request: any): Promise<APIResponse<any>> {
    const response = await fetch(getProjectServiceUrl(`/api/latex-ai-chat/session/${documentId}/message`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Failed to send chat message: ${response.statusText}`)
    }

    return response.json()
  },

  async getChatHistory(documentId: string): Promise<APIResponse<any[]>> {
    const response = await fetch(getProjectServiceUrl(`/api/latex-ai-chat/session/${documentId}/messages`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get chat history: ${response.statusText}`)
    }

    return response.json()
  },

  async applySuggestion(messageId: string, contentAfter: string): Promise<APIResponse<string>> {
    const response = await fetch(getProjectServiceUrl(`/api/latex-ai-chat/message/${messageId}/apply`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contentAfter),
    })

    if (!response.ok) {
      throw new Error(`Failed to apply suggestion: ${response.statusText}`)
    }

    return response.json()
  },

  async createCheckpoint(documentId: string, sessionId: string, request: any): Promise<APIResponse<any>> {
    const response = await fetch(getProjectServiceUrl(`/api/latex-ai-chat/document/${documentId}/checkpoint?sessionId=${sessionId}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Failed to create checkpoint: ${response.statusText}`)
    }

    return response.json()
  },

  async restoreToCheckpoint(checkpointId: string): Promise<APIResponse<string>> {
    const response = await fetch(getProjectServiceUrl(`/api/latex-ai-chat/checkpoint/${checkpointId}/restore`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to restore checkpoint: ${response.statusText}`)
    }

    return response.json()
  },

  async getCheckpoints(documentId: string): Promise<APIResponse<any[]>> {
    const response = await fetch(getProjectServiceUrl(`/api/latex-ai-chat/document/${documentId}/checkpoints`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get checkpoints: ${response.statusText}`)
    }

    return response.json()
  },

  async reviewDocument(content: string): Promise<APIResponse<any>> {
    const response = await fetch(getProjectServiceUrl('/api/ai-assistance/review'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      throw new Error(`Failed to review document: ${response.statusText}`)
    }

    return response.json()
  },

  async generateSuggestions(content: string, context?: string): Promise<APIResponse<string>> {
    const response = await fetch(getProjectServiceUrl('/api/ai-assistance/suggestions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, context }),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate suggestions: ${response.statusText}`)
    }

    return response.json()
  },

  async checkCompliance(content: string, venue?: string): Promise<APIResponse<any>> {
    const response = await fetch(getProjectServiceUrl('/api/ai-assistance/compliance'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, venue }),
    })

    if (!response.ok) {
      throw new Error(`Failed to check compliance: ${response.statusText}`)
    }

    return response.json()
  },

  async validateCitations(content: string): Promise<APIResponse<any>> {
    const response = await fetch(getProjectServiceUrl('/api/ai-assistance/citations/validate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      throw new Error(`Failed to validate citations: ${response.statusText}`)
    }

    return response.json()
  },

  async generateCorrections(content: string): Promise<APIResponse<any>> {
    const response = await fetch(getProjectServiceUrl('/api/ai-assistance/corrections'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })
    return response.json()
  },

  // Document Versioning
  async createDocumentVersion(documentId: string, content: string, commitMessage: string, createdBy?: string): Promise<APIResponse<any>> {
    const url = getProjectServiceUrl(`/api/documents/${documentId}/versions`)
    const body = `commitMessage=${encodeURIComponent(commitMessage)}&content=${encodeURIComponent(content)}${createdBy ? `&createdBy=${encodeURIComponent(createdBy)}` : ''}`
    
    console.log('=== API CALL DEBUG ===')
    console.log('URL:', url)
    console.log('Method: POST')
    console.log('Headers:', { 'Content-Type': 'application/x-www-form-urlencoded' })
    console.log('Body:', body)
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body
      })
      
      console.log('=== FETCH RESPONSE ===')
      console.log('Response status:', response.status)
      console.log('Response statusText:', response.statusText)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      const responseText = await response.text()
      console.log('Response text:', responseText)
      
      let responseData
      try {
        responseData = JSON.parse(responseText)
        console.log('Parsed JSON:', responseData)
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError)
        throw new Error(`Invalid JSON response: ${responseText}`)
      }
      
      return responseData
    } catch (error) {
      console.error('=== FETCH ERROR ===')
      console.error('Fetch error:', error)
      throw error
    }
  },

  async getDocumentVersions(documentId: string): Promise<APIResponse<any[]>> {
    const response = await fetch(getProjectServiceUrl(`/api/documents/${documentId}/versions`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },

  async getSpecificDocumentVersion(documentId: string, versionNumber: number): Promise<APIResponse<any>> {
    const response = await fetch(getProjectServiceUrl(`/api/documents/${documentId}/versions/${versionNumber}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },

  async getPreviousDocumentVersion(documentId: string, currentVersion: number): Promise<APIResponse<any>> {
    const response = await fetch(getProjectServiceUrl(`/api/documents/${documentId}/versions/${currentVersion}/previous`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },

  async getNextDocumentVersion(documentId: string, currentVersion: number): Promise<APIResponse<any>> {
    const response = await fetch(getProjectServiceUrl(`/api/documents/${documentId}/versions/${currentVersion}/next`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },

  // Citation checking API
  async startCitationCheck(params: StartCitationCheckRequest): Promise<StartCitationCheckResponse> {
    // Map frontend request to backend DTO format
    const backendRequest = {
      projectId: params.projectId,
      documentId: params.documentId,
      content: params.latexContent,                    // latexContent → content
      filename: params.texFileName,                    // texFileName → filename  
      forceRecheck: params.overwrite || false,         // overwrite → forceRecheck
      options: {
        checkWeb: params.runWebCheck || true,          // runWebCheck → options.checkWeb
        checkLocal: true,                              // Always check local papers
        similarityThreshold: 0.7,                      // Default similarity threshold
        maxEvidencePerIssue: 5                         // Default max evidence
      }
    }

    const response = await fetch(getProjectServiceUrl('/api/citations/jobs'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendRequest),
    })

    if (!response.ok) {
      throw new Error(`Failed to start citation check: ${response.statusText}`)
    }

    const data = await response.json()
    // Map backend response (id) to frontend interface (jobId)
    return { jobId: data.id }
  },

  async getCitationJob(jobId: string): Promise<CitationCheckJob> {
    const response = await fetch(getProjectServiceUrl(`/api/citations/jobs/${jobId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get citation job: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Map backend response fields to frontend expectations
    return {
      jobId: data.id,                           // id → jobId
      status: data.status,                      // status stays the same
      step: data.currentStep,                   // currentStep → step
      progressPct: data.progressPercent || 0,   // progressPercent → progressPct
      summary: data.summary,                    // summary stays the same
      issues: convertBackendIssuesToFrontend(data.issues || []), // Convert backend DTO to frontend format
      errorMessage: data.message                // message → errorMessage
    }
  },

  async getCitationResult(documentId: string): Promise<CitationCheckJob> {
    const response = await fetch(getProjectServiceUrl(`/api/citations/documents/${documentId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get citation result: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Map backend response fields to frontend expectations
    return {
      jobId: data.id,                           // id → jobId
      status: data.status,                      // status stays the same
      step: data.currentStep,                   // currentStep → step
      progressPct: data.progressPercent || 0,   // progressPercent → progressPct
      summary: data.summary,                    // summary stays the same
      issues: convertBackendIssuesToFrontend(data.issues || []), // Convert backend DTO to frontend format
      errorMessage: data.message                // message → errorMessage
    }
  },

  async updateCitationIssue(issueId: string, patch: UpdateCitationIssueRequest): Promise<APIResponse<any>> {
    const response = await fetch(getProjectServiceUrl(`/api/citations/issues/${issueId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    })

    if (!response.ok) {
      throw new Error(`Failed to update citation issue: ${response.statusText}`)
    }

    return response.json()
  },
}
