import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit, LayoutPanelLeft, FileText, File, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CitationCheckJob } from '@/types/citations';
import { FinalReviewDialog } from './FinalReviewDialog';

export type ViewMode = 'editor' | 'preview' | 'split';

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  hasCompiledPdf?: boolean;
  isCompiling?: boolean;
  className?: string;
  
  // Enhanced Citation checking props
  citationCount?: number;            // undefined if no run yet
  onOpenCitationPanel?: () => void;  // opens the drawer
  onRunCitationCheck?: () => void;   // kicks a new run
  citationBusy?: boolean;            // show spinner
  currentJob?: CitationCheckJob | null; // real-time job status
  
  // Web check toggle
  runWebCheck?: boolean;
  onRunWebCheckChange?: (value: boolean) => void;
  
  // Final review props
  editorContent?: string;            // LaTeX content for final review
}

export function ViewModeSelector({
  viewMode,
  onViewModeChange,
  hasCompiledPdf = false,
  isCompiling = false,
  className,
  citationCount,
  onOpenCitationPanel,
  onRunCitationCheck,
  citationBusy = false,
  currentJob,
  runWebCheck = true,
  onRunWebCheckChange,
  editorContent = ''
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <FileText className="h-4 w-4" />
            <span className="font-medium">View Mode</span>
          </div>
          
          {/* Left group: Editor, Preview, Split buttons */}
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
        
        {/* Right group: Citations, Check Citations, Final Review buttons */}
        <div className="flex gap-1.5 relative z-50">
          {/* Enhanced Citation Issues Button with Real-time Status */}
          {(citationCount !== undefined || citationBusy || currentJob) && (
            <button
              type="button"
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                console.log('🔎 Citation button clicked! citationCount:', citationCount)
                onOpenCitationPanel?.(); 
              }}
              className={cn(
                "relative z-50 px-2.5 py-1 text-xs rounded border select-none transition-colors",
                citationCount && citationCount > 0
                  ? "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                  : citationBusy || (currentJob && currentJob.status !== 'DONE')
                  ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                  : "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
              )}
              title={
                citationBusy || (currentJob && currentJob.status !== 'DONE')
                  ? `Citation check in progress: ${currentJob?.step || 'Processing'}...`
                  : citationCount && citationCount > 0
                  ? `${citationCount} citation issues found`
                  : "No citation issues found"
              }
            >
              <div className="flex items-center">
                {citationBusy || (currentJob && currentJob.status !== 'DONE') ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                <span>Citations</span>
                {/* Issue Count Badge */}
                {typeof citationCount === 'number' && citationCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center text-[10px] 
                                  rounded-full px-1.5 py-0.5 bg-red-600 text-white">
                    {citationCount}
                  </span>
                )}
                {/* Progress Indicator */}
                {currentJob && currentJob.status !== 'DONE' && currentJob.status !== 'ERROR' && (
                  <span className="ml-1 text-[10px] text-blue-600">
                    {currentJob.progressPct || 0}%
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Enhanced Run Citation Check Button */}
          <button
            type="button"
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation();
              console.log('🔎 Run Citation Check clicked! citationBusy:', citationBusy)
              onRunCitationCheck?.(); 
            }}
            disabled={citationBusy}
            className={cn(
              "relative z-50 px-2.5 py-1 text-xs rounded border select-none transition-colors",
              "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title={citationBusy ? "Citation check in progress..." : "Start citation analysis"}
          >
            <div className="flex items-center">
              {citationBusy ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {citationBusy 
                ? currentJob?.step || 'Analyzing...'
                : 'Check Citations'
              }
            </div>
          </button>

          {/* Final Review Button */}
          <FinalReviewDialog content={editorContent} />

          {/* Web Check Toggle */}
          {onRunWebCheckChange && (
            <label className="inline-flex items-center gap-1.5 text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
              <input 
                type="checkbox" 
                checked={runWebCheck} 
                onChange={e => onRunWebCheckChange(e.target.checked)}
                className="w-3 h-3"
              />
              <span>Include web check</span>
            </label>
          )}
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