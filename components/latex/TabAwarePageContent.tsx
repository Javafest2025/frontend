import React, { useEffect } from 'react';
import { useTabContext } from '@/contexts/TabContext';
import type { Paper } from '@/types/websearch';

interface TabAwarePageContentProps {
  children: React.ReactNode;
  currentDocument: any;
  pdfPreviewUrl: string;
  onHandleOpenPaper: (openPaperFn: (paper: Paper) => void) => void;
}

export function TabAwarePageContent({ 
  children, 
  currentDocument, 
  pdfPreviewUrl, 
  onHandleOpenPaper 
}: TabAwarePageContentProps) {
  const { openItem, openPaper } = useTabContext();

  // Provide the openPaper function to the parent
  useEffect(() => {
    onHandleOpenPaper(openPaper);
  }, [openPaper, onHandleOpenPaper]);

  // Create and open PDF tab when compile succeeds
  useEffect(() => {
    if (pdfPreviewUrl && currentDocument) {
      const pdfItem = {
        id: `pdf-compiled-${currentDocument.id}`,
        kind: 'pdf' as const,
        title: `${currentDocument.title}.pdf`,
        source: 'compiled' as const,
        url: pdfPreviewUrl,
        docId: currentDocument.id
      };
      openItem(pdfItem);
    }
  }, [pdfPreviewUrl, currentDocument, openItem]);

  return <>{children}</>;
}
