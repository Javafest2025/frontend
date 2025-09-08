import React, { createContext, useContext, useState, useCallback } from 'react';
import type { OpenItem, TabViewState, PDFSearchState } from '@/types/tabs';
import type { Paper } from '@/types/websearch';

interface TabContextValue {
  openItems: OpenItem[];
  activeItemId: string | null;
  tabViewStates: Record<string, TabViewState>;
  
  // Actions
  openItem: (item: OpenItem) => void;
  closeItem: (id: string) => void;
  setActiveItem: (id: string) => void;
  updateTabViewState: (id: string, state: Partial<TabViewState>) => void;
  getTabViewState: (id: string) => TabViewState;
  
  // Convenience methods
  swapToTex: () => void;
  swapToPdf: () => void;
  
  // Open paper helper
  openPaper: (paper: Paper) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

export function useTabContext() {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
}

interface TabProviderProps {
  children: React.ReactNode;
  initialTexItem?: OpenItem;
}

export function TabProvider({ children, initialTexItem }: TabProviderProps) {
  const [openItems, setOpenItems] = useState<OpenItem[]>(
    initialTexItem ? [initialTexItem] : []
  );
  const [activeItemId, setActiveItemId] = useState<string | null>(
    initialTexItem?.id || null
  );
  const [tabViewStates, setTabViewStates] = useState<Record<string, TabViewState>>({});

  const openItem = useCallback((item: OpenItem) => {
    setOpenItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        // If item already exists, just activate it
        setActiveItemId(item.id);
        return prev;
      }
      
      // Add new item
      const newItems = [...prev, item];
      setActiveItemId(item.id);
      return newItems;
    });
  }, []);

  const closeItem = useCallback((id: string) => {
    setOpenItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      
      // If we're closing the active item, switch to another
      if (activeItemId === id) {
        if (newItems.length > 0) {
          // Prefer switching to a .tex file if available
          const texItem = newItems.find(item => item.kind === 'tex');
          const nextItem = texItem || newItems[newItems.length - 1];
          setActiveItemId(nextItem.id);
        } else {
          setActiveItemId(null);
        }
      }
      
      return newItems;
    });
    
    // Clean up view state
    setTabViewStates(prev => {
      const newStates = { ...prev };
      delete newStates[id];
      return newStates;
    });
  }, [activeItemId]);

  const setActiveItem = useCallback((id: string) => {
    const item = openItems.find(i => i.id === id);
    if (item) {
      setActiveItemId(id);
    }
  }, [openItems]);

  const updateTabViewState = useCallback((id: string, state: Partial<TabViewState>) => {
    setTabViewStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...state }
    }));
  }, []);

  const getTabViewState = useCallback((id: string): TabViewState => {
    return tabViewStates[id] || {};
  }, [tabViewStates]);

  const swapToTex = useCallback(() => {
    const texItem = openItems.find(item => item.kind === 'tex');
    if (texItem) {
      setActiveItemId(texItem.id);
    }
  }, [openItems]);

  const swapToPdf = useCallback(() => {
    const pdfItem = openItems.find(item => item.kind === 'pdf');
    if (pdfItem) {
      setActiveItemId(pdfItem.id);
    } else {
      // If no PDF is open, try to find the most recent compiled PDF
      const compiledPdf = openItems.find(item => item.kind === 'pdf' && item.source === 'compiled');
      if (compiledPdf) {
        setActiveItemId(compiledPdf.id);
      }
    }
  }, [openItems]);

  const openPaper = useCallback((paper: Paper) => {
    console.log('🔍 Opening paper:', paper.title);
    
    // Try to get PDF URL from multiple possible sources
    const pdfUrl = paper.pdfUrl || paper.pdfContentUrl;
    
    console.log('📄 Available URLs:', {
      pdfUrl: paper.pdfUrl,
      pdfContentUrl: paper.pdfContentUrl,
      selectedUrl: pdfUrl,
      paperUrl: paper.paperUrl,
      isOpenAccess: paper.isOpenAccess
    });
    
    if (pdfUrl) {
      console.log('✅ Creating PDF tab with URL:', pdfUrl);
      
      // Use proxy for remote URLs to handle CORS issues
      let finalUrl = pdfUrl;
      if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
        // Check if it's not already a local/proxy URL
        if (!pdfUrl.includes(window.location.origin) && !pdfUrl.startsWith('/')) {
          finalUrl = `/api/pdf/proxy?url=${encodeURIComponent(pdfUrl)}`;
          console.log('🔄 Using proxy URL:', finalUrl);
        }
      }
      
      const paperItem: OpenItem = {
        id: `pdf-paper-${paper.id}`,
        kind: 'pdf',
        title: paper.title || 'Untitled Paper',
        source: 'paper',
        url: finalUrl,
        metadata: paper
      };
      openItem(paperItem);
    } else {
      console.warn('❌ No PDF URL found for paper:', paper);
      alert(`No PDF URL available for "${paper.title || 'this paper'}". The paper may not have a downloadable PDF.`);
    }
  }, [openItem]);

  const value: TabContextValue = {
    openItems,
    activeItemId,
    tabViewStates,
    openItem,
    closeItem,
    setActiveItem,
    updateTabViewState,
    getTabViewState,
    swapToTex,
    swapToPdf,
    openPaper,
  };

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}
