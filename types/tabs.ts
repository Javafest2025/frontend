// types/tabs.ts
export interface OpenItem {
  id: string;
  kind: 'tex' | 'pdf';
  title: string;
  source: 'paper' | 'compiled' | 'document';
  url?: string;
  docId?: string;
  metadata?: any;
}

export interface TabViewState {
  // For PDF tabs
  page?: number;
  zoom?: number;
  rotation?: number;
  searchQuery?: string;
  searchResults?: SearchMatch[];
  activeSearchIndex?: number;
  
  // For editor tabs
  cursorPosition?: number;
  selection?: { start: number; end: number };
}

export interface SearchMatch {
  page: number;
  rects: DOMRect[];
  text: string;
}

export interface PDFSearchState {
  query: string;
  caseSensitive: boolean;
  matches: SearchMatch[];
  activeIndex: number;
  isOpen: boolean;
}
