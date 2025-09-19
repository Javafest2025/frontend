import React from 'react';
import { X, FileText, File, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OpenItem } from '@/types/tabs';

interface CenterTabsProps {
  items: OpenItem[];
  activeId: string | null;
  isEditing?: boolean;
  onTabChange: (id: string) => void;
  onTabClose: (id: string) => void;
  onSwapToTex?: () => void;
  onSwapToPdf?: () => void;
  className?: string;
}

export function CenterTabs({
  items,
  activeId,
  isEditing = false,
  onTabChange,
  onTabClose,
  onSwapToTex,
  onSwapToPdf,
  className
}: CenterTabsProps) {
  const hasTexTab = items.some(item => item.kind === 'tex');
  const hasPdfTab = items.some(item => item.kind === 'pdf');
  const activeItem = items.find(item => item.id === activeId);
  const canShowSwap = hasTexTab && hasPdfTab;

  const getTabIcon = (item: OpenItem) => {
    if (item.kind === 'tex') {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const getTabTitle = (item: OpenItem) => {
    let title = item.title;
    
    // Truncate long titles
    if (title.length > 25) {
      title = title.substring(0, 22) + '...';
    }
    
    return title;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    if (cmdKey) {
      // Ctrl/Cmd + 1-9 for direct tab access
      const digit = parseInt(e.key);
      if (digit >= 1 && digit <= 9 && items[digit - 1]) {
        e.preventDefault();
        onTabChange(items[digit - 1].id);
        return;
      }

      // Ctrl/Cmd + Tab for cycling
      if (e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = items.findIndex(item => item.id === activeId);
        const nextIndex = (currentIndex + 1) % items.length;
        if (items[nextIndex]) {
          onTabChange(items[nextIndex].id);
        }
        return;
      }
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, [items, activeId]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-between border-b bg-background py-2", className)}>
      <div className="flex items-center">
        {items.map((item, index) => {
          const isActive = item.id === activeId;
          const showEditingDot = item.kind === 'tex' && isEditing && isActive;
          
          return (
            <div
              key={item.id}
              className={cn(
                "group relative flex items-center gap-2 px-4 py-2.5 text-sm border-r cursor-pointer transition-colors",
                "hover:bg-muted/50",
                isActive && "bg-muted border-b-2 border-b-primary"
              )}
              onClick={() => onTabChange(item.id)}
            >
              {getTabIcon(item)}
              <span className="select-none">
                {getTabTitle(item)}
                {showEditingDot && (
                  <span className="ml-1 w-1.5 h-1.5 bg-orange-500 rounded-full inline-block animate-pulse" />
                )}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(item.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </div>

      {canShowSwap && (
        <div className="flex items-center gap-1 px-3 py-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-xs"
            onClick={() => {
              if (activeItem?.kind === 'tex' && onSwapToPdf) {
                onSwapToPdf();
              } else if (activeItem?.kind === 'pdf' && onSwapToTex) {
                onSwapToTex();
              }
            }}
            title="Swap between LaTeX and PDF"
          >
            <ArrowLeftRight className="w-3 h-3 mr-1" />
            {activeItem?.kind === 'tex' ? 'PDF' : 'TEX'}
          </Button>
        </div>
      )}
    </div>
  );
}
