import React, { useEffect } from 'react';
import { useTabContext } from '@/contexts/TabContext';
import type { OpenItem } from '@/types/tabs';

interface DocumentTabBridgeProps {
  currentDocument: any;
  pdfPreviewUrl: string;
}

export function DocumentTabBridge({ currentDocument, pdfPreviewUrl }: DocumentTabBridgeProps) {
  const { openItem } = useTabContext();

  // Create and open LaTeX document tab when document changes
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

  return null;
}
