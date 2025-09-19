// Citation checking types for the LaTeX editor

export type EvidenceSource =
  | { kind: 'local'; paperId: string; paperTitle?: string; sectionId?: string; paragraphId?: string; page?: number }
  | { kind: 'web'; url: string; title?: string; domain?: string };

export type Evidence = {
  source: EvidenceSource;
  matchedText: string;
  similarity: number;            // 0..1 cosine or dot-product normalized
  supportScore: number;          // 0..1 NLI-style "supports" confidence
};

export type CitationIssueType =
  | 'missing-citation'           // claim likely needs a citation but none present
  | 'weak-citation'              // citation present but doesn't support claim
  | 'orphan-reference'           // reference in bib never cited
  | 'incorrect-metadata'         // year/title/doi mismatch
  | 'plausible-claim-no-source'  // couldn't find strong support anywhere
  | 'possible-plagiarism';       // near-duplicate span without citation

export type CitationIssue = {
  id: string;
  projectId: string;
  documentId: string;
  texFileName: string;
  type: CitationIssueType;
  severity: 'low' | 'medium' | 'high';
  // Location in LaTeX
  from: number;   // codepoint offset
  to: number;
  lineStart: number;
  lineEnd: number;
  snippet: string;
  // Bib keys present in the sentence (if any)
  citedKeys: string[];
  // What we think should be cited
  suggestions: Array<{
    kind: 'local' | 'web';
    score: number;
    // local suggestion uses paperId; web uses url
    paperId?: string;
    url?: string;
    bibTex?: string;  // optional generated bib
    title?: string;
    authors?: string[];
    year?: number;
    description?: string; // Descriptive message about the citation issue
  }>;
  evidence: Evidence[];
  createdAt: string;
};

export type CitationCheckStep =
  | 'PARSING'
  | 'LOCAL_RETRIEVAL'
  | 'LOCAL_VERIFICATION'
  | 'WEB_RETRIEVAL'
  | 'WEB_VERIFICATION'
  | 'SAVING'
  | 'DONE'
  | 'ERROR';

export type CitationSummary = {
  total: number;
  byType: Record<CitationIssueType, number>;
  contentHash?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type CitationCheckJob = {
  jobId: string;
  status: 'QUEUED'|'RUNNING'|'DONE'|'ERROR';
  step: CitationCheckStep;
  progressPct: number;      // 0..100
  summary?: CitationSummary;
  issues?: CitationIssue[];
  errorMessage?: string;
};

export type CitationSseEvent =
  | { type: 'status'; status: CitationCheckJob['status']; step: CitationCheckStep; progressPct: number }
  | { type: 'tick'; message: string }
  | { type: 'issue'; issue: CitationIssue }
  | { type: 'summary'; summary: CitationSummary }
  | { type: 'error'; message: string };

// Request types
export interface StartCitationCheckRequest {
  projectId: string;
  documentId: string;           // the .tex file's DB id
  texFileName: string;
  latexContent: string;
  selectedPaperIds: string[];   // from PapersSelector context
  overwrite?: boolean;          // default true
  runWebCheck?: boolean;        // default true
  contentHash?: string;         // NEW (frontend computes & transmits)
}

export interface StartCitationCheckResponse {
  jobId: string;
}

export interface UpdateCitationIssueRequest {
  resolved?: boolean;
  ignored?: boolean;
  notes?: string;
}

// UI state types
export interface CitationHighlight {
  from: number;
  to: number;
  className: string;
  issueId: string;
}

export interface CitationFilter {
  types: CitationIssueType[];
  severities: Array<'low' | 'medium' | 'high'>;
  searchText: string;
}

// Utility type helpers
export const CitationIssueTypeLabels: Record<CitationIssueType, string> = {
  'missing-citation': 'Missing Citation',
  'weak-citation': 'Weak Citation',
  'orphan-reference': 'Orphan Reference',
  'incorrect-metadata': 'Incorrect Metadata',
  'plausible-claim-no-source': 'Claim Needs Source',
  'possible-plagiarism': 'Possible Plagiarism'
};

export const CitationSeverityColors: Record<string, string> = {
  'low': 'text-yellow-600 bg-yellow-100',
  'medium': 'text-orange-600 bg-orange-100',
  'high': 'text-red-600 bg-red-100'
};

export const CitationStepLabels: Record<CitationCheckStep, string> = {
  'PARSING': 'Parsing LaTeX content...',
  'LOCAL_RETRIEVAL': 'Searching selected papers...',
  'LOCAL_VERIFICATION': 'Verifying against local corpus...',
  'WEB_RETRIEVAL': 'Searching web sources...',
  'WEB_VERIFICATION': 'Verifying web evidence...',
  'SAVING': 'Saving results...',
  'DONE': 'Complete',
  'ERROR': 'Error occurred'
};