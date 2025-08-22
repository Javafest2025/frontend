import { getMicroserviceUrl } from '@/lib/config/api-config'

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
}
