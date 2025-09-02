import React, { useEffect } from 'react';
import { useTabContext } from '@/contexts/TabContext';
import type { Paper } from '@/types/websearch';

interface TabContextBridgeProps {
  onOpenPaperReady: (openPaper: (paper: Paper) => void) => void;
}

export function TabContextBridge({ onOpenPaperReady }: TabContextBridgeProps) {
  const { openPaper } = useTabContext();

  useEffect(() => {
    onOpenPaperReady(openPaper);
  }, [openPaper, onOpenPaperReady]);

  return null;
}
