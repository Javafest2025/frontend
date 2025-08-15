import { getApiBaseUrl } from '@/lib/config/api-config'

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

const API_BASE = getApiBaseUrl()

export const latexApi = {
  // Document management
  async createDocument(request: CreateDocumentRequest): Promise<APIResponse<DocumentResponse>> {
    const response = await fetch(`${API_BASE}/api/documents`, {
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
    const response = await fetch(`${API_BASE}/api/documents/create-with-name?projectId=${projectId}&fileName=${fileName}`, {
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
    const response = await fetch(`${API_BASE}/api/documents/project/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`)
    }

    return response.json()
  },

  async getDocumentById(documentId: string): Promise<APIResponse<DocumentResponse>> {
    const response = await fetch(`${API_BASE}/api/documents/${documentId}`, {
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
    const response = await fetch(`${API_BASE}/api/documents`, {
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
    const response = await fetch(`${API_BASE}/api/documents/${documentId}`, {
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
    const response = await fetch(`${API_BASE}/api/documents/compile`, {
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

  async generatePDF(request: GeneratePDFRequest): Promise<Blob> {
    const response = await fetch(`${API_BASE}/api/documents/generate-pdf`, {
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
    const response = await fetch(`${API_BASE}/api/ai-assistance/chat`, {
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
    const response = await fetch(`${API_BASE}/api/ai-assistance/review`, {
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
    const response = await fetch(`${API_BASE}/api/ai-assistance/suggestions`, {
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
    const response = await fetch(`${API_BASE}/api/ai-assistance/compliance`, {
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
    const response = await fetch(`${API_BASE}/api/ai-assistance/citations/validate`, {
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
    const response = await fetch(`${API_BASE}/api/ai-assistance/corrections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate corrections: ${response.statusText}`)
    }

    return response.json()
  },
}
