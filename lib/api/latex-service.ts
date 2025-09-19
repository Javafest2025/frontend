import type { 
  CitationCheckJob, 
  CitationIssue,
  CitationSummary,
  CitationSseEvent,
  StartCitationCheckRequest, 
  StartCitationCheckResponse,
  UpdateCitationIssueRequest 
} from '@/types/citations'
import { getMicroserviceUrl } from '@/lib/config/api-config'
import { authenticatedFetch } from '@/lib/api/user-service'

// Helper functions for citation API
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const ensureNumber = (v: any, fallback = 0) =>
  (v === 0 || typeof v === 'number') ? v : (v ? parseInt(String(v), 10) : fallback);

const normalizeSummary = (raw: any, issues: any[] = []): CitationSummary => {
  if (!raw) return { total: (issues?.length ?? 0), byType: {} as Record<any, number> };
  const total = (typeof raw.total === 'number') ? raw.total
              : (typeof raw.totalIssues === 'number') ? raw.totalIssues
              : (issues?.length ?? 0);
  const byType = raw.byType || raw.typeCounts || {};
  return {
    total,
    byType,
    contentHash: raw.contentHash,
    startedAt: raw.startedAt,
    finishedAt: raw.finishedAt
  };
};

// Convert backend CitationIssueDto to frontend CitationIssue format
const convertBackendIssuesToFrontend = (backendIssues: any[]): CitationIssue[] => {
  if (!backendIssues) return [];
  return backendIssues.map((issue) => {
    const from = ensureNumber(issue.position, 0);
    const to = from + ensureNumber(issue.length, 0);
    return {
      id: issue.id,
      projectId: issue.projectId || '',
      documentId: issue.documentId || '',
      texFileName: issue.filename || '',
      type: (issue.issueType || 'missing-citation'),
      severity: String(issue.severity || 'medium').toLowerCase() as 'low'|'medium'|'high',
      from, to,
      lineStart: ensureNumber(issue.lineStart, 0),
      lineEnd: ensureNumber(issue.lineEnd, 0),
      snippet: issue.citationText || issue.snippet || '',
      citedKeys: Array.isArray(issue.citedKeys) ? issue.citedKeys : [],
      suggestions: Array.isArray(issue.suggestions) ? issue.suggestions : [],
      evidence: Array.isArray(issue.evidence) ? issue.evidence : [],
      createdAt: issue.createdAt || new Date().toISOString(),
    };
  });
};

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

export const latexApi = {
  // Document management
  async createDocument(request: CreateDocumentRequest): Promise<APIResponse<DocumentResponse>> {
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/documents'), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/documents/create-with-name?projectId=${projectId}&fileName=${fileName}`), {
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
    const url = getMicroserviceUrl('project-service', `/api/documents/project/${projectId}`)
    console.log('Calling API URL:', url)
    
    const response = await authenticatedFetch(url, {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/documents/${documentId}`), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/documents'), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/documents/${documentId}`), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/documents/compile'), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/documents/compile-pdf'), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/documents/generate-pdf'), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/ai-assistance/chat'), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/latex-ai-chat/session/${documentId}?projectId=${projectId}`), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/latex-ai-chat/session/${documentId}/message`), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/latex-ai-chat/session/${documentId}/messages`), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/latex-ai-chat/message/${messageId}/apply`), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/latex-ai-chat/document/${documentId}/checkpoint?sessionId=${sessionId}`), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/latex-ai-chat/checkpoint/${checkpointId}/restore`), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/latex-ai-chat/document/${documentId}/checkpoints`), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/ai-assistance/review'), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/ai-assistance/suggestions'), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/ai-assistance/compliance'), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/ai-assistance/citations/validate'), {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/ai-assistance/corrections'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })
    return response.json()
  },

  async generateFinalReview(content: string): Promise<APIResponse<string>> {
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/ai-assistance/final-review'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate final review: ${response.statusText}`)
    }

    return response.json()
  },

  // Document Versioning
  async createDocumentVersion(documentId: string, content: string, commitMessage: string, createdBy?: string): Promise<APIResponse<any>> {
    const url = getMicroserviceUrl('project-service', `/api/documents/${documentId}/versions`)
    const body = `commitMessage=${encodeURIComponent(commitMessage)}&content=${encodeURIComponent(content)}${createdBy ? `&createdBy=${encodeURIComponent(createdBy)}` : ''}`
    
    console.log('=== API CALL DEBUG ===')
    console.log('URL:', url)
    console.log('Method: POST')
    console.log('Headers:', { 'Content-Type': 'application/x-www-form-urlencoded' })
    console.log('Body:', body)
    
    try {
      const response = await authenticatedFetch(url, {
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
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/documents/${documentId}/versions`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },

  async getSpecificDocumentVersion(documentId: string, versionNumber: number): Promise<APIResponse<any>> {
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/documents/${documentId}/versions/${versionNumber}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },

  async getPreviousDocumentVersion(documentId: string, currentVersion: number): Promise<APIResponse<any>> {
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/documents/${documentId}/versions/${currentVersion}/previous`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },

  async getNextDocumentVersion(documentId: string, currentVersion: number): Promise<APIResponse<any>> {
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/documents/${documentId}/versions/${currentVersion}/next`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },

  // Citation checking API
  async startCitationCheck(params: StartCitationCheckRequest): Promise<StartCitationCheckResponse> {
    const contentHash = params.contentHash ?? await sha256Hex(params.latexContent);

    const backendRequest = {
      projectId: params.projectId,
      documentId: params.documentId,
      selectedPaperIds: params.selectedPaperIds ?? [],
      content: params.latexContent,
      filename: params.texFileName,
      contentHash,                            // ensure included
      forceRecheck: params.overwrite ?? false, // default FALSE to allow reuse
      options: {
        checkLocal: true,
        checkWeb: params.runWebCheck ?? true, // respect false
        similarityThreshold: 0.85,
        plagiarismThreshold: 0.92,
        maxEvidencePerIssue: 5,
        strictMode: true
      }
    };

    const response = await authenticatedFetch(getMicroserviceUrl('project-service', '/api/citations/jobs'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendRequest),
    });
    if (!response.ok) throw new Error(`Failed to start citation check: ${response.statusText}`);
    const data = await response.json();
    return { jobId: data.id };
  },

  async getCitationJob(jobId: string): Promise<CitationCheckJob> {
    const res = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/citations/jobs/${jobId}`), { headers: { 'Content-Type': 'application/json' }});
    if (!res.ok) throw new Error(`Failed to get citation job: ${res.statusText}`);
    const data = await res.json();
    const issues = convertBackendIssuesToFrontend(data.issues || []);
    return {
      jobId: data.id,
      status: data.status,
      step: data.currentStep,
      progressPct: data.progressPercent ?? 0,
      summary: normalizeSummary(data.summary, data.issues),
      issues,
      errorMessage: data.message
    };
  },

  async getCitationResult(documentId: string): Promise<CitationCheckJob | null> {
    const res = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/citations/documents/${documentId}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 404) {
      // No prior run for this doc — not an error.
      return null;
    }
    if (!res.ok) throw new Error(`Failed to get citation result: ${res.statusText}`);

    const data = await res.json();
    const issues = convertBackendIssuesToFrontend(data.issues || []);
    return {
      jobId: data.id,
      status: data.status,
      step: data.currentStep,
      progressPct: data.progressPercent ?? 0,
      summary: normalizeSummary(data.summary, data.issues),
      issues,
      errorMessage: data.message
    };
  },

  async updateCitationIssue(issueId: string, patch: UpdateCitationIssueRequest): Promise<APIResponse<any>> {
    const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/citations/issues/${issueId}`), {
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

// Polling fallback for when SSE fails
export async function pollCitationJob(jobId: string, onTick: (snap: CitationCheckJob) => void): Promise<CitationCheckJob> {
  let done = false, last: CitationCheckJob | null = null;
  while (!done) {
    await new Promise(r => setTimeout(r, 2000));
    const snap = await latexApi.getCitationJob(jobId);
    onTick(snap);
    last = snap;
    done = snap.status === 'DONE' || snap.status === 'ERROR';
  }
  return last!;
}

// Improved citation check with SSE fallback
export async function startCitationCheckWithStreaming(
  projectId: string, 
  content: string, 
  enableWeb: boolean = false,
  onStatus?: (s: { status: string; step: string; progressPct: number }) => void,
  onIssue?: (issue: CitationIssue) => void,
  onSummary?: (summary: CitationSummary) => void,
  onEvent?: (raw: any) => void
): Promise<{ jobId: string, result: CitationCheckJob | null }> {
  const contentHash = await sha256Hex(content);
  console.log('🔍 Starting citation check, content hash:', contentHash);

  // Start new job (backend handles content hash caching internally)
  console.log('🚀 Starting new citation job...');
  const response = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/citations/check/${projectId}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      content, 
      enableWeb,
      contentHash 
    })
  });
  if (!response.ok) throw new Error(`Failed to start citation check: ${response.statusText}`);
  const data = await response.json();
  const jobId = data.jobId;
  console.log('🚀 Citation job started:', jobId);

  // Start SSE stream with polling fallback
  let streamClosed = false;
  const stream = streamCitationJob(jobId, {
    onStatus,
    onIssue,
    onSummary,
    onEvent,
    onError: async (err) => {
      console.log('🔌 SSE error occurred, switching to polling fallback:', err);
      if (!streamClosed) {
        streamClosed = true;
        stream.close();
        console.log('🔄 Starting polling fallback for job:', jobId);
        try {
          await pollCitationJob(jobId, (snap: CitationCheckJob) => {
            onStatus?.({ 
              status: snap.status, 
              step: snap.step || 'Processing...', 
              progressPct: Math.round((snap.progressPct || 0) * 100) 
            });
            snap.issues?.forEach((issue: any) => {
              onIssue?.(convertBackendIssuesToFrontend([issue])[0]);
            });
            if (snap.summary) {
              onSummary?.(normalizeSummary(snap.summary));
            }
          });
        } catch (pollErr) {
          console.error('❌ Polling fallback failed:', pollErr);
        }
      }
    }
  });

  return { jobId, result: null };
}

// SSE streaming client and cancel functions
export function streamCitationJob(jobId: string, handlers: {
  onStatus?: (s: { status: string; step: string; progressPct: number }) => void,
  onIssue?: (issue: CitationIssue) => void,
  onSummary?: (summary: CitationSummary) => void,
  onComplete?: () => void,
  onEvent?: (raw: any) => void,
  onError?: (err: any) => void,
}) {
  const url = getMicroserviceUrl('project-service', `/api/citations/jobs/${jobId}/events`);
  console.log('🔌 Starting SSE stream to:', url);
  
  const es = new EventSource(url);
  let closed = false;
  
  es.onopen = () => {
    console.log('🔌 SSE connection opened for job:', jobId);
  };
  
  es.onmessage = (e) => {
    try {
      console.log('🔌 SSE message received:', e.data);
      const msg = JSON.parse(e.data);
      handlers.onEvent?.(msg);
      
      // Handle new message format from backend (with type and data wrapper)
      const messageData = msg.data || msg; // Support both old and new formats
      const messageType = msg.type || messageData.type;
      
      if (messageType === 'status') {
        const statusData = messageData.status ? messageData : messageData.data || messageData;
        handlers.onStatus?.(statusData);
      } else if (messageType === 'issue') {
        const issueData = messageData.issue ? messageData.issue : messageData.data?.issue || messageData;
        handlers.onIssue?.(convertBackendIssuesToFrontend([issueData])[0]);
      } else if (messageType === 'summary') {
        const summaryData = messageData.summary ? messageData.summary : messageData.data?.summary || messageData;
        handlers.onSummary?.(normalizeSummary(summaryData));
      } else if (messageType === 'complete') {
        console.log('🔌 SSE completion event received');
        handlers.onComplete?.();
      }
    } catch (err) {
      console.error('🔌 SSE parse error:', err);
      handlers.onError?.(err);
    }
  };
  
  es.onerror = (e) => {
    console.error('🔌 SSE connection error:', e);
    if (!closed) handlers.onError?.(e); // triggers polling fallback in caller
  };
  
  return { 
    close: () => {
      console.log('🔌 Closing SSE connection for job:', jobId);
      closed = true;
      es.close();
    }
  };
}

export async function cancelCitationJob(jobId: string): Promise<void> {
  const res = await authenticatedFetch(getMicroserviceUrl('project-service', `/api/citations/jobs/${jobId}`), { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to cancel citation job: ${res.statusText}`);
}

// Export individual functions for use throughout the app (avoiding latexApi object)
export const startCitationCheck = latexApi.startCitationCheck.bind(latexApi);
export const getCitationJob = latexApi.getCitationJob.bind(latexApi);  
export const updateCitationIssue = latexApi.updateCitationIssue.bind(latexApi);

// Direct export for getCitationResult (not bound to latexApi to use the updated version)
export async function getCitationResult(documentId: string): Promise<CitationCheckJob | null> {
  return latexApi.getCitationResult(documentId);
}