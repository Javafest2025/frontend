import React, { useEffect, useState } from 'react';
import { useTabContext } from '@/contexts/TabContext';
import { CenterTabs } from '@/components/latex/CenterTabs';
import { ViewModeSelector, type ViewMode } from '@/components/latex/ViewModeSelector';
import { EnhancedLatexEditor } from '@/components/latex/EnhancedLatexEditor';
import PDFViewer from '@/components/latex/PDFViewer';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OpenItem, TabViewState } from '@/types/tabs';
import type { CitationCheckJob } from '@/types/citations';

interface TabContentAreaProps {
  // Editor-related props
  editorContent: string;
  onEditorContentChange: (value: string) => void;
  isEditing: boolean;
  onIsEditingChange: (editing: boolean) => void;
  
  // Selection and cursor handling
  selectedText: { text: string; from: number; to: number };
  onSelectionChange: (selection: { text: string; from: number; to: number }) => void;
  cursorPosition: number | undefined;
  onCursorPositionChange: (position: number | undefined) => void;
  lastCursorPos: number | null;
  onLastCursorPosChange: (pos: number | null) => void;
  
  // Position markers for AI features
  positionMarkers: Array<{ position: number; label: string; blinking: boolean }>;
  onSetPositionMarker: (position: number, label: string) => void;
  onClearPositionMarkers: () => void;
  
  // AI suggestions and inline diffs
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
  // Temporary selection positions from the editor (used to compute line range label)
  tempSelectionPositions?: { from: number; to: number };
  onHandleAddToChat: () => void;
  onHandleCancelSelection: () => void;
  onHandleEditorClick: () => void;
  onHandleEditorBlur: () => void;
  onHandleEditorFocus?: () => void;
  onHandleEditorFocusLost: () => void;
  
  // PDF and compilation
  pdfPreviewUrl: string;
  isCompiling: boolean;
  onCompile?: () => void;
  
  // PDF selection to chat
  onPDFSelectionToChat: (text: string) => void;
  
  // Document loading for tab switching
  onTabDocumentLoad?: (documentId: string) => Promise<void>;
  
  // Citation checking
  citationCount?: number;
  onOpenCitationPanel?: () => void;
  onRunCitationCheck?: () => void;
  citationBusy?: boolean;
  currentJob?: CitationCheckJob | null; // Real-time job status
  highlightedRanges?: Array<{ from: number; to: number; className: string }>;
}

export function TabContentArea({
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
  onTabDocumentLoad,
  citationCount,
  onOpenCitationPanel,
  onRunCitationCheck,
  citationBusy,
  currentJob,
  highlightedRanges
}: TabContentAreaProps) {
  const {
    openItems,
    activeItemId,
    tabViewStates,
    setActiveItem,
    closeItem,
    updateTabViewState,
    getTabViewState,
    swapToTex,
    swapToPdf,
  } = useTabContext();

  // View mode state for LaTeX editor
  const [viewMode, setViewMode] = useState<ViewMode>('editor');

  const activeItem = openItems.find(item => item.id === activeItemId);
  const hasTexTab = openItems.some(item => item.kind === 'tex');
  const hasPdfTab = openItems.some(item => item.kind === 'pdf');

  const handleViewModeChange = (mode: ViewMode) => {
    console.log('TabContentArea: View mode change requested:', mode);
    console.log('Current view mode:', viewMode);
    console.log('Has compiled PDF:', !!pdfPreviewUrl);
    console.log('Is compiling:', isCompiling);
    
    setViewMode(mode);
    
    // Auto-compile when switching to preview if no PDF available
    if (mode === 'preview' && !pdfPreviewUrl && !isCompiling && onCompile) {
      console.log('TabContentArea: Auto-triggering compile for preview mode');
      onCompile();
    }
  };

  // Custom tab change handler that loads document content when switching to tex tabs
  const handleTabChange = async (tabId: string) => {
    const targetTab = openItems.find(item => item.id === tabId);
    
    if (targetTab?.kind === 'tex' && targetTab.docId && onTabDocumentLoad) {
      console.log('Tab switch detected for tex document:', targetTab.docId);
      try {
        await onTabDocumentLoad(targetTab.docId);
      } catch (error) {
        console.error('Failed to load document for tab switch:', error);
      }
    }
    
    // Always set the active tab regardless of document loading result
    setActiveItem(tabId);
  };

  // Handle keyboard shortcuts for tab switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey) {
        // Ctrl/Cmd + 1-9 for direct tab access
        const digit = parseInt(e.key);
        if (digit >= 1 && digit <= 9 && openItems[digit - 1]) {
          e.preventDefault();
          handleTabChange(openItems[digit - 1].id);
          return;
        }

        // Ctrl/Cmd + Tab for cycling
        if (e.key === 'Tab') {
          e.preventDefault();
          const currentIndex = openItems.findIndex(item => item.id === activeItemId);
          const nextIndex = (currentIndex + 1) % openItems.length;
          if (openItems[nextIndex]) {
            handleTabChange(openItems[nextIndex].id);
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openItems, activeItemId, setActiveItem]);

  // Update tab view state when PDF properties change
  const handlePDFStateChange = (state: Partial<TabViewState>) => {
    if (activeItemId && activeItem?.kind === 'pdf') {
      updateTabViewState(activeItemId, state);
    }
  };

  // Render tab content based on the active item
  const renderTabContent = () => {
    if (!activeItem) {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No files open</h3>
            <p className="text-muted-foreground">
              Open a document or PDF to get started
            </p>
          </div>
        </div>
      );
    }

    if (activeItem.kind === 'tex') {
      const renderEditor = () => (
        <div className="flex-1 relative">
          <EnhancedLatexEditor
            value={editorContent}
            onChange={(value) => {
              onEditorContentChange(value);
              onIsEditingChange(true);
            }}
            placeholder="Start writing your LaTeX document..."
            className="w-full h-full"
            onSelectionChange={onSelectionChange}
            onCursorPositionChange={onCursorPositionChange}
            onSetPositionMarker={onSetPositionMarker}
            onClearPositionMarkers={onClearPositionMarkers}
            onFocusLost={onHandleEditorFocusLost}
            onClick={onHandleEditorClick}
            onBlur={onHandleEditorBlur}
            onFocus={onHandleEditorFocus}
            aiSuggestions={aiSuggestions}
            onAcceptSuggestion={onAcceptSuggestion}
            onRejectSuggestion={onRejectSuggestion}
            inlineDiffPreviews={inlineDiffPreviews}
            onAcceptInlineDiff={onAcceptInlineDiff}
            onRejectInlineDiff={onRejectInlineDiff}
            onLastCursorChange={onLastCursorPosChange}
            highlightedRanges={highlightedRanges}
          />

          {/* Floating Add-to-Chat overlay when text is selected */}
          {showAddToChat && tempSelectedText && (
            <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-card/95 backdrop-blur border border-border shadow-md rounded-md px-2 py-1">
              <div className="text-xs text-muted-foreground mr-1">
                {(() => {
                  const from = tempSelectionPositions?.from ?? 0;
                  const to = tempSelectionPositions?.to ?? from;
                  const clamp = (n: number) => (isFinite(n) && n >= 0 ? n : 0);
                  const safeFrom = clamp(from);
                  const safeTo = clamp(to);
                  const prefixFrom = editorContent?.slice(0, safeFrom) ?? '';
                  const prefixTo = editorContent?.slice(0, safeTo) ?? prefixFrom;
                  const lineFrom = (prefixFrom.match(/\n/g)?.length ?? 0) + 1;
                  const lineTo = (prefixTo.match(/\n/g)?.length ?? 0) + 1;
                  const range = lineFrom === lineTo ? `L${lineFrom}` : `L${lineFrom}–L${lineTo}`;
                  return range;
                })()}
              </div>
              <button
                onClick={onHandleAddToChat}
                className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90"
                title="Add the selected text and its range to the AI chat"
              >
                Add to Chat
              </button>
              <button
                onClick={onHandleCancelSelection}
                className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
                title="Cancel selection"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      );

      const renderPreview = () => (
        <div className="flex-1 min-h-0 flex flex-col">
          {pdfPreviewUrl ? (
            <PDFViewer
              fileUrl={pdfPreviewUrl}
              className="w-full h-full flex-1"
              onSelectionToChat={onPDFSelectionToChat}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Eye className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No PDF Preview</h3>
                <p className="text-muted-foreground mb-4">
                  Compile your LaTeX document to see the preview
                </p>
                {onCompile && (
                  <button
                    onClick={onCompile}
                    disabled={isCompiling}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isCompiling ? 'Compiling...' : 'Compile Now'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      );

      // Render based on view mode
      switch (viewMode) {
        case 'editor':
          return renderEditor();
        case 'preview':
          return renderPreview();
        case 'split':
          return (
            <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
              <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col">
                {renderEditor()}
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col overflow-hidden">
                {renderPreview()}
              </ResizablePanel>
            </ResizablePanelGroup>
          );
        default:
          return renderEditor();
      }
    }

    if (activeItem.kind === 'pdf') {
      const viewState = getTabViewState(activeItemId!);
      return (
        <div className="flex-1 min-h-0 flex flex-col">
          <PDFViewer
            fileUrl={activeItem.url!}
            className="w-full h-full flex-1"
            onSelectionToChat={onPDFSelectionToChat}
            initialPage={viewState.page}
            initialZoom={viewState.zoom}
            initialRotation={viewState.rotation}
            onSearchStateChange={(searchState) => {
              handlePDFStateChange({
                searchQuery: searchState.query,
                searchResults: searchState.matches,
                activeSearchIndex: searchState.activeIndex,
              });
            }}
          />
        </div>
      );
    }

    return null;
  };

  if (openItems.length === 0) {
    return null; // Let the parent handle the empty state
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Tab Bar */}
      <CenterTabs
        items={openItems}
        activeId={activeItemId}
        isEditing={isEditing && activeItem?.kind === 'tex'}
        onTabChange={handleTabChange}
        onTabClose={closeItem}
        onSwapToTex={hasTexTab && hasPdfTab ? swapToTex : undefined}
        onSwapToPdf={hasTexTab && hasPdfTab ? swapToPdf : undefined}
        className="flex-shrink-0"
      />
      
      {/* View Mode Selector - Only show for LaTeX files */}
      {activeItem?.kind === 'tex' && (
        <ViewModeSelector
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          hasCompiledPdf={!!pdfPreviewUrl}
          isCompiling={isCompiling}
          citationCount={citationCount}
          onOpenCitationPanel={onOpenCitationPanel}
          onRunCitationCheck={onRunCitationCheck}
          citationBusy={citationBusy}
          currentJob={currentJob}
          editorContent={editorContent}
          className="flex-shrink-0"
        />
      )}
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}
