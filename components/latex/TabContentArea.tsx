import React, { useEffect, useState } from 'react';
import { useTabContext } from '@/contexts/TabContext';
import { CenterTabs } from '@/components/latex/CenterTabs';
import { EnhancedLatexEditor } from '@/components/latex/EnhancedLatexEditor';
import PDFViewer from '@/components/latex/PDFViewer';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OpenItem, TabViewState } from '@/types/tabs';

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
  onHandleAddToChat: () => void;
  onHandleCancelSelection: () => void;
  onHandleEditorClick: () => void;
  onHandleEditorBlur: () => void;
  onHandleEditorFocus?: () => void;
  onHandleEditorFocusLost: () => void;
  
  // PDF selection to chat
  onPDFSelectionToChat: (text: string) => void;
  
  // Document loading for tab switching
  onTabDocumentLoad?: (documentId: string) => Promise<void>;
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
  onHandleAddToChat,
  onHandleCancelSelection,
  onHandleEditorClick,
  onHandleEditorBlur,
  onHandleEditorFocus,
  onHandleEditorFocusLost,
  onPDFSelectionToChat,
  onTabDocumentLoad,
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

  const activeItem = openItems.find(item => item.id === activeItemId);
  const hasTexTab = openItems.some(item => item.kind === 'tex');
  const hasPdfTab = openItems.some(item => item.kind === 'pdf');

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
      return (
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
          />
          
          {/* Add to Chat overlay */}
          {showAddToChat && (
            <div 
              className="absolute top-2 right-2 flex space-x-2 z-50"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onHandleAddToChat();
                }}
                className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Add to Chat
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onHandleCancelSelection();
                }}
                className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      );
    }

    if (activeItem.kind === 'pdf') {
      const viewState = getTabViewState(activeItemId!);
      return (
        <div className="flex-1 min-h-0 overflow-hidden">
          <PDFViewer
            fileUrl={activeItem.url!}
            className="w-full h-full"
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
        className="border-b flex-shrink-0"
      />
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}
