import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit, LayoutPanelLeft, FileText, File } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'editor' | 'preview' | 'split';

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  hasCompiledPdf?: boolean;
  isCompiling?: boolean;
  className?: string;
}

export function ViewModeSelector({
  viewMode,
  onViewModeChange,
  hasCompiledPdf = false,
  isCompiling = false,
  className
}: ViewModeSelectorProps) {
  
  const handleViewModeChange = (mode: ViewMode) => {
    console.log('ViewModeSelector: Mode change requested:', mode);
    console.log('Current mode:', viewMode);
    console.log('Has compiled PDF:', hasCompiledPdf);
    console.log('Is compiling:', isCompiling);
    
    // If trying to switch to preview/split without PDF, give helpful message
    if ((mode === 'preview' || mode === 'split') && !hasCompiledPdf && !isCompiling) {
      alert(`To use ${mode} mode, please compile your LaTeX document first using the "Compile" button in the toolbar.`);
      return;
    }
    
    // Successfully switch mode (no alert needed)
    onViewModeChange(mode);
  };

  // Always allow buttons to be clicked - we'll handle the logic in the click handler
  const isPreviewDisabled = false;
  // Split mode should always be available (shows editor + preview area)
  const isSplitDisabled = false;

  return (
    <div className="w-full border-b bg-slate-100 dark:bg-slate-800 px-3 py-2 relative z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <FileText className="h-4 w-4" />
          <span className="font-medium">View Mode</span>
        </div>
        
        {/* Simple button group with explicit z-index and pointer events */}
        <div className="flex gap-1.5 relative z-50">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Editor button clicked!');
              handleViewModeChange('editor');
            }}
            className={`relative z-50 px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer select-none ${
              viewMode === 'editor'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
            }`}
          >
            <Edit className="h-3 w-3 inline mr-1" />
            Editor
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Preview button clicked!');
              handleViewModeChange('preview');
            }}
            disabled={isPreviewDisabled}
            className={`relative z-50 px-2.5 py-1 text-xs rounded border transition-colors select-none ${
              viewMode === 'preview'
                ? 'bg-blue-500 text-white border-blue-500'
                : isPreviewDisabled
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer'
            }`}
          >
            <Eye className="h-3 w-3 inline mr-1" />
            Preview
            {isCompiling && (
              <div className="ml-1 h-1.5 w-1.5 bg-orange-500 rounded-full animate-pulse inline-block" />
            )}
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Split button clicked!');
              handleViewModeChange('split');
            }}
            disabled={isSplitDisabled}
            className={`relative z-50 px-2.5 py-1 text-xs rounded border transition-colors select-none ${
              viewMode === 'split'
                ? 'bg-blue-500 text-white border-blue-500'
                : isSplitDisabled
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer'
            }`}
          >
            <LayoutPanelLeft className="h-3 w-3 inline mr-1" />
            Split
          </button>
        </div>
      </div>

      {/* Optional status indicators */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isCompiling && (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
            <span>Compiling...</span>
          </div>
        )}
        {hasCompiledPdf && !isCompiling && (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 bg-green-500 rounded-full" />
            <span>PDF Ready</span>
          </div>
        )}
        {!hasCompiledPdf && !isCompiling && (
          <div className="flex items-center gap-1.5">
            <File className="h-3 w-3" />
            <span>No Preview</span>
          </div>
        )}
      </div>
    </div>
  );
}