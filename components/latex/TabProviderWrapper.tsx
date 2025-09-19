import React, { useEffect } from 'react';
import { TabProvider, useTabContext } from '@/contexts/TabContext';
import { TabContentArea } from './TabContentArea';
import { PapersSelector } from './PapersSelector';
import type { OpenItem } from '@/types/tabs';
import type { Paper } from '@/types/websearch';

// Bridge component to expose openPaper function from the tab context
function TabContextBridge({ onOpenPaperReady }: { onOpenPaperReady?: (openPaperFn: (paper: Paper) => void) => void }) {
  const { openPaper } = useTabContext();

  useEffect(() => {
    if (onOpenPaperReady) {
      onOpenPaperReady(openPaper);
    }
  }, [openPaper, onOpenPaperReady]);

  return null; // This component doesn't render anything
}

interface TabProviderWrapperProps {
  // Document and editor state
  currentDocument: any;
  editorContent: string;
  onEditorContentChange: (value: string) => void;
  isEditing: boolean;
  onIsEditingChange: (editing: boolean) => void;
  
  // Selection and cursor
  selectedText: { text: string; from: number; to: number };
  onSelectionChange: (selection: { text: string; from: number; to: number }) => void;
  cursorPosition: number | undefined;
  onCursorPositionChange: (position: number | undefined) => void;
  lastCursorPos: number | null;
  onLastCursorPosChange: (pos: number | null) => void;
  
  // Position markers
  positionMarkers: Array<{ position: number; label: string; blinking: boolean }>;
  onSetPositionMarker: (position: number, label: string) => void;
  onClearPositionMarkers: () => void;
  
  // AI features
  aiSuggestions: Array<{
    id: string;
    type: 'replace' | 'add' | 'delete';
    from: number;
    to: number;
    originalText: string;
    suggestedText: string;
    explanation?: string;
  }>;
  onAcceptSuggestion: (suggestionId: string) => void;
  onRejectSuggestion: (suggestionId: string) => void;
  
  inlineDiffPreviews: Array<{
    id: string;
    type: 'add' | 'delete' | 'replace';
    from: number;
    to: number;
    content: string;
    originalContent?: string;
  }>;
  onAcceptInlineDiff: (diffId: string) => void;
  onRejectInlineDiff: (diffId: string) => void;
  
  // UI state
  showAddToChat: boolean;
  tempSelectedText: string;
  tempSelectionPositions?: { from: number; to: number };
  onHandleAddToChat: () => void;
  onHandleCancelSelection: () => void;
  onHandleEditorClick: () => void;
  onHandleEditorBlur: () => void;
  onHandleEditorFocus?: () => void;
  onHandleEditorFocusLost: () => void;
  
  // PDF and compile
  pdfPreviewUrl: string;
  isCompiling: boolean;
  onCompile?: () => void;
  onPDFSelectionToChat: (text: string) => void;
  
  // Tab opening callback
  onOpenPaperReady?: (openPaperFn: (paper: Paper) => void) => void;
  
  // Document loading for tab switching
  onTabDocumentLoad?: (documentId: string) => Promise<void>;
  
  // Citation checking
  citationCount?: number;
  onOpenCitationPanel?: () => void;
  onRunCitationCheck?: () => void;
  citationBusy?: boolean;
  currentJob?: any; // CitationCheckJob type
  highlightedRanges?: Array<{ from: number; to: number; className: string }>;
}

function TabProviderContent({
  currentDocument,
  editorContent,
  onEditorContentChange,
  isEditing,
  onIsEditingChange,
  selectedText,
  onSelectionChange,
  cursorPosition,
  onCursorPositionChange,
  lastCursorPos,
  onLastCursorPosChange,
  positionMarkers,
  onSetPositionMarker,
  onClearPositionMarkers,
  aiSuggestions,
  onAcceptSuggestion,
  onRejectSuggestion,
  inlineDiffPreviews,
  onAcceptInlineDiff,
  onRejectInlineDiff,
  showAddToChat,
  tempSelectedText,
  tempSelectionPositions,
  onHandleAddToChat,
  onHandleCancelSelection,
  onHandleEditorClick,
  onHandleEditorBlur,
  onHandleEditorFocus,
  onHandleEditorFocusLost,
  pdfPreviewUrl,
  isCompiling,
  onCompile,
  onPDFSelectionToChat,
  onOpenPaperReady,
  onTabDocumentLoad,
  citationCount,
  onOpenCitationPanel,
  onRunCitationCheck,
  citationBusy,
  currentJob,
  highlightedRanges
}: TabProviderWrapperProps) {
  const { openItem, openItems } = useTabContext();

  // Create and open the tex item when document changes
  useEffect(() => {
    if (currentDocument) {
      const texItem: OpenItem = {
        id: `tex-${currentDocument.id}`,
        kind: 'tex',
        title: currentDocument.title,
        source: 'document',
        docId: currentDocument.id
      };
      openItem(texItem);
    }
  }, [currentDocument, openItem]);

  // Create and open PDF tab when compile succeeds
  useEffect(() => {
    if (pdfPreviewUrl && currentDocument) {
      const pdfItem: OpenItem = {
        id: `pdf-compiled-${currentDocument.id}`,
        kind: 'pdf',
        title: `${currentDocument.title}.pdf`,
        source: 'compiled',
        url: pdfPreviewUrl,
        docId: currentDocument.id
      };
      openItem(pdfItem);
    }
  }, [pdfPreviewUrl, currentDocument, openItem]);

  // Handle paper opening
  const handleOpenPaper = (paper: Paper) => {
    if (paper.pdfUrl) {
      const paperItem: OpenItem = {
        id: `pdf-paper-${paper.id}`,
        kind: 'pdf',
        title: paper.title || 'Untitled Paper',
        source: 'paper',
        url: paper.pdfUrl,
        metadata: paper
      };
      openItem(paperItem);
    }
  };

  // If no items are open and no document, show landing page
  if (openItems.length === 0 && !currentDocument) {
    return (
      <>
        <TabContextBridge onOpenPaperReady={onOpenPaperReady} />
        {null} {/* Let parent handle landing page */}
      </>
    );
  }

  return (
    <>
      <TabContextBridge onOpenPaperReady={onOpenPaperReady} />
      <TabContentArea
      editorContent={editorContent}
      onEditorContentChange={onEditorContentChange}
      isEditing={isEditing}
      onIsEditingChange={onIsEditingChange}
      selectedText={selectedText}
      onSelectionChange={onSelectionChange}
      cursorPosition={cursorPosition}
      onCursorPositionChange={onCursorPositionChange}
      lastCursorPos={lastCursorPos}
      onLastCursorPosChange={onLastCursorPosChange}
      positionMarkers={positionMarkers}
      onSetPositionMarker={onSetPositionMarker}
      onClearPositionMarkers={onClearPositionMarkers}
      aiSuggestions={aiSuggestions}
      onAcceptSuggestion={onAcceptSuggestion}
      onRejectSuggestion={onRejectSuggestion}
      inlineDiffPreviews={inlineDiffPreviews}
      onAcceptInlineDiff={onAcceptInlineDiff}
      onRejectInlineDiff={onRejectInlineDiff}
      showAddToChat={showAddToChat}
      tempSelectedText={tempSelectedText}
      tempSelectionPositions={tempSelectionPositions}
      onHandleAddToChat={onHandleAddToChat}
      onHandleCancelSelection={onHandleCancelSelection}
      onHandleEditorClick={onHandleEditorClick}
      onHandleEditorBlur={onHandleEditorBlur}
      onHandleEditorFocus={onHandleEditorFocus}
      onHandleEditorFocusLost={onHandleEditorFocusLost}
      pdfPreviewUrl={pdfPreviewUrl}
      isCompiling={isCompiling}
      onCompile={onCompile}
      onPDFSelectionToChat={onPDFSelectionToChat}
      onTabDocumentLoad={onTabDocumentLoad}
      citationCount={citationCount}
      onOpenCitationPanel={onOpenCitationPanel}
      onRunCitationCheck={onRunCitationCheck}
      citationBusy={citationBusy}
      currentJob={currentJob}
      highlightedRanges={highlightedRanges}
    />
    </>
  );
}

export function TabProviderWrapper(props: TabProviderWrapperProps) {
  const initialTexItem = props.currentDocument ? {
    id: `tex-${props.currentDocument.id}`,
    kind: 'tex' as const,
    title: props.currentDocument.title,
    source: 'document' as const,
    docId: props.currentDocument.id
  } : undefined;

  return (
    <TabProvider initialTexItem={initialTexItem}>
      <TabProviderContent {...props} />
    </TabProvider>
  );
}
