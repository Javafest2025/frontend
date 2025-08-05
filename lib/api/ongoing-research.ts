// API service for ongoing research service
const API_BASE_URL = process.env.NEXT_PUBLIC_ONGOING_RESEARCH_API_URL || 'http://localhost:8083/api'

export interface Project {
  id: string
  userId: string
  title: string
  description: string
  status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED'
  researchDomain: string
  documents?: Document[]
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  projectId: string
  title: string
  content: string
  documentType: 'LATEX' | 'MARKDOWN' | 'PLAIN_TEXT' | 'TEMPLATE'
  filePath?: string
  citations?: Citation[]
  createdAt: string
  updatedAt: string
}

export interface Citation {
  id: string
  paperId?: string
  title: string
  authors?: string
  year?: number
  venue?: string
  doi?: string
  citationKey?: string
  positionInText?: number
  createdAt: string
}

export interface CreateProjectRequest {
  userId: string
  title: string
  description?: string
  researchDomain?: string
  status?: string
}

export interface CreateDocumentRequest {
  projectId: string
  title: string
  content?: string
  documentType?: string
}

export interface UpdateDocumentRequest {
  documentId: string
  content: string
}

export interface AIReviewRequest {
  content: string
}

export interface AISuggestionsRequest {
  content: string
  context?: string
}

export interface AIComplianceRequest {
  content: string
  venue?: string
}

export interface APIResponse<T> {
  timestamp: string
  status: number
  message: string
  data: T
}

class OngoingResearchAPI {
  private async fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    console.log('API Request:', url, options)
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      console.log('API Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error response:', errorText)
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log('API Response data:', result)
      return result
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  // Project APIs
  async createProject(request: CreateProjectRequest): Promise<APIResponse<Project>> {
    return this.fetchAPI<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getProjectsByUserId(userId: string): Promise<APIResponse<Project[]>> {
    return this.fetchAPI<Project[]>(`/projects/user/${userId}`)
  }

  async getProjectById(projectId: string): Promise<APIResponse<Project>> {
    return this.fetchAPI<Project>(`/projects/${projectId}`)
  }

  async deleteProject(projectId: string): Promise<APIResponse<void>> {
    return this.fetchAPI<void>(`/projects/${projectId}`, {
      method: 'DELETE',
    })
  }

  // Document APIs
  async createDocument(request: CreateDocumentRequest): Promise<APIResponse<Document>> {
    return this.fetchAPI<Document>('/documents', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getDocumentsByProjectId(projectId: string): Promise<APIResponse<Document[]>> {
    return this.fetchAPI<Document[]>(`/documents/project/${projectId}`)
  }

  async getDocumentById(documentId: string): Promise<APIResponse<Document>> {
    return this.fetchAPI<Document>(`/documents/${documentId}`)
  }

  async updateDocument(request: UpdateDocumentRequest): Promise<APIResponse<Document>> {
    return this.fetchAPI<Document>('/documents', {
      method: 'PUT',
      body: JSON.stringify(request),
    })
  }

  async deleteDocument(documentId: string): Promise<APIResponse<void>> {
    return this.fetchAPI<void>(`/documents/${documentId}`, {
      method: 'DELETE',
    })
  }

  async compileDocument(documentId: string): Promise<APIResponse<string>> {
    return this.fetchAPI<string>(`/documents/${documentId}/compile`, {
      method: 'POST',
    })
  }

  // AI Assistance APIs
  async reviewDocument(request: AIReviewRequest): Promise<APIResponse<any>> {
    return this.fetchAPI<any>('/ai-assistance/review', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async generateSuggestions(request: AISuggestionsRequest): Promise<APIResponse<string>> {
    return this.fetchAPI<string>('/ai-assistance/suggestions', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async checkCompliance(request: AIComplianceRequest): Promise<APIResponse<any>> {
    return this.fetchAPI<any>('/ai-assistance/compliance', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async validateCitations(request: AIReviewRequest): Promise<APIResponse<any>> {
    return this.fetchAPI<any>('/ai-assistance/citations/validate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async generateCorrections(request: AIReviewRequest): Promise<APIResponse<any>> {
    return this.fetchAPI<any>('/ai-assistance/corrections', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }
}

export const ongoingResearchAPI = new OngoingResearchAPI()

// React hooks for easier API usage
export const useProjects = () => {
  return {
    createProject: ongoingResearchAPI.createProject.bind(ongoingResearchAPI),
    getProjectsByUserId: ongoingResearchAPI.getProjectsByUserId.bind(ongoingResearchAPI),
    getProjectById: ongoingResearchAPI.getProjectById.bind(ongoingResearchAPI),
    deleteProject: ongoingResearchAPI.deleteProject.bind(ongoingResearchAPI),
  }
}

export const useDocuments = () => {
  return {
    createDocument: ongoingResearchAPI.createDocument.bind(ongoingResearchAPI),
    getDocumentsByProjectId: ongoingResearchAPI.getDocumentsByProjectId.bind(ongoingResearchAPI),
    getDocumentById: ongoingResearchAPI.getDocumentById.bind(ongoingResearchAPI),
    updateDocument: ongoingResearchAPI.updateDocument.bind(ongoingResearchAPI),
    deleteDocument: ongoingResearchAPI.deleteDocument.bind(ongoingResearchAPI),
    compileDocument: ongoingResearchAPI.compileDocument.bind(ongoingResearchAPI),
  }
}

export const useAIAssistance = () => {
  return {
    reviewDocument: ongoingResearchAPI.reviewDocument.bind(ongoingResearchAPI),
    generateSuggestions: ongoingResearchAPI.generateSuggestions.bind(ongoingResearchAPI),
    checkCompliance: ongoingResearchAPI.checkCompliance.bind(ongoingResearchAPI),
    validateCitations: ongoingResearchAPI.validateCitations.bind(ongoingResearchAPI),
    generateCorrections: ongoingResearchAPI.generateCorrections.bind(ongoingResearchAPI),
  }
}
