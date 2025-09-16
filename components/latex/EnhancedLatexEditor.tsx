"use client"

import React, { useCallback, useRef, useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night'
import { useSettings } from '@/contexts/SettingsContext'
import { getCodeMirrorTheme, getCurrentThemeVariant } from '@/lib/codemirror-themes'
import { EditorView, Decoration, DecorationSet, WidgetType } from '@codemirror/view'
import { Extension, StateField, StateEffect, RangeSetBuilder, EditorSelection } from '@codemirror/state'
import { syntaxHighlighting, HighlightStyle, LanguageSupport, StreamLanguage } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { autocompletion, CompletionContext } from '@codemirror/autocomplete'
import { closeBrackets } from '@codemirror/autocomplete'
import { bracketMatching } from '@codemirror/language'
import { indentOnInput } from '@codemirror/language'
import { ViewPlugin, ViewUpdate } from '@codemirror/view'

interface AISuggestion {
  id: string
  type: 'replace' | 'add' | 'delete'
  from: number
  to: number
  originalText: string
  suggestedText: string
  explanation?: string
}

interface InlineDiffPreview {
  id: string
  type: 'add' | 'delete' | 'replace'
  from: number
  to: number
  content: string
  originalContent?: string // For replace type
}

export type LastCursorBeacon = number | null

interface EnhancedLatexEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onSelectionChange?: (selection: { text: string; from: number; to: number }) => void
  onCursorPositionChange?: (position: number) => void
  highlightedRanges?: Array<{ from: number; to: number; className: string }>
  positionMarkers?: Array<{ position: number; label: string; blinking?: boolean }>
  onSetPositionMarker?: (position: number, label: string) => void
  onClearPositionMarkers?: () => void
  onFocusLost?: (data: { cursorPosition: number }) => void
  onClick?: () => void
  onBlur?: () => void
  onFocus?: () => void
  aiSuggestions?: AISuggestion[]
  onAcceptSuggestion?: (suggestionId: string) => void
  onRejectSuggestion?: (suggestionId: string) => void
  inlineDiffPreviews?: InlineDiffPreview[]
  onAcceptInlineDiff?: (id: string) => void
  onRejectInlineDiff?: (id: string) => void
  onLastCursorChange?: (pos: number | null) => void
}

// State management for inline diff previews
const setInlineDiffEffect = StateEffect.define<InlineDiffPreview[]>()

const inlineDiffField = StateField.define<InlineDiffPreview[]>({
  create() { return [] },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(setInlineDiffEffect)) {
        return effect.value
      }
    }
    return value
  }
})

// --- NEW: preview-hidden ranges for inline diffs ---
const setHiddenPreviewRanges = StateEffect.define<InlineDiffPreview[]>()

const hiddenPreviewRangesField = StateField.define<DecorationSet>({
  create() { return Decoration.none },
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(setHiddenPreviewRanges)) {
        const builder = new RangeSetBuilder<Decoration>()
        for (const p of e.value) {
          // Hide original selection for replace & delete previews
          if ((p.type === 'replace' || p.type === 'delete') && p.from < p.to) {
            builder.add(p.from, p.to, Decoration.mark({ class: 'cm-preview-hide' }))
          }
        }
        return builder.finish()
      }
    }
    if (tr.docChanged) return value.map(tr.changes)
    return value
  },
  provide: f => EditorView.decorations.from(f)
})

// --- Highlighted ranges for citation issues ---
const setHighlightedRanges = StateEffect.define<Array<{ from: number; to: number; className: string }>>()

const highlightedRangesField = StateField.define<DecorationSet>({
  create() { return Decoration.none },
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(setHighlightedRanges)) {
        const builder = new RangeSetBuilder<Decoration>()
        for (const range of e.value) {
          if (range.from < range.to) {
            builder.add(range.from, range.to, Decoration.mark({ class: range.className }))
          }
        }
        return builder.finish()
      }
    }
    if (tr.docChanged) return value.map(tr.changes)
    return value
  },
  provide: f => EditorView.decorations.from(f)
})

// Last cursor beacon system
export const setLastCursorBeacon = StateEffect.define<LastCursorBeacon>()

// Blinking caret widget
class BlinkCaretWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span")
    span.className = "cm-last-cursor-beacon"
    return span
  }
  ignoreEvent() { return true } // don't interfere with clicks
}

// Field that stores the last cursor pos and keeps it mapped across edits
const lastCursorBeaconField = StateField.define<LastCursorBeacon>({
  create: () => null,
  update(value, tr) {
    // React to explicit set/clear
    for (const e of tr.effects) if (e.is(setLastCursorBeacon)) return e.value

    // Map the saved position across document changes
    if (value != null && tr.docChanged) return tr.changes.mapPos(value, 1)

    // If a new non-empty selection appears, hide the beacon (selection > beacon)
    if (tr.selection && !tr.state.selection.main.empty) return null

    return value
  },
  provide: f =>
    EditorView.decorations.from(f, (pos) => {
      if (pos == null) return Decoration.none
      return Decoration.set([Decoration.widget({ widget: new BlinkCaretWidget(), side: 1 }).range(pos)])
    })
})

// Dom event handlers: show beacon on blur (when no selection), hide on focus
const lastCursorBeaconHandlers = EditorView.domEventHandlers({
  blur: (event, view) => {
    const sel = view.state.selection.main
    if (sel.empty) {
      const pos = sel.head
      view.dispatch({ effects: setLastCursorBeacon.of(pos) })
      // notify parent
      view.dom.dispatchEvent(new CustomEvent("cm-last-cursor-updated", { bubbles: true, detail: { pos } }))
    } else {
      // If there is a selection, do not show a beacon
      view.dispatch({ effects: setLastCursorBeacon.of(null) })
    }
  },
  focus: (_event, view) => {
    view.dispatch({ effects: setLastCursorBeacon.of(null) })
  },
  mousedown: (_event, view) => {
    // Clicking back into the editor should clear the beacon immediately
    if (view.state.field(lastCursorBeaconField, false) != null) {
      view.dispatch({ effects: setLastCursorBeacon.of(null) })
    }
    return false
  }
})




// Plugin to handle selection changes and cursor position
const selectionPlugin = ViewPlugin.fromClass(class {
  private lastCursorPosition: number = 0
  private hasSelection: boolean = false

  constructor(view: EditorView) {
    this.updateSelection(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.selectionSet) {
      this.updateSelection(update.view)
    }
  }

  private updateSelection(view: EditorView) {
    const selection = view.state.selection
    if (selection.main.empty) {
      // No selection, just cursor position
      const pos = selection.main.head
      this.lastCursorPosition = pos
      this.hasSelection = false
      this.notifyCursorPosition(pos)
      
      // Remove selection highlighting
      this.removeSelectionHighlighting()
    } else {
      // Text selected
      const { from, to } = selection.main
      const text = view.state.doc.sliceString(from, to)
      this.hasSelection = true
      this.notifySelectionChange({ text, from, to })
      
      // Add selection highlighting
      this.addSelectionHighlighting(from, to)
    }
  }

  private addSelectionHighlighting(from: number, to: number) {
    // CodeMirror handles selection highlighting automatically
    // We just need to ensure the selection is properly set
    // The built-in selection highlighting will show the selected text
  }

  private removeSelectionHighlighting() {
    // CodeMirror handles this automatically
  }

  private notifySelectionChange(selection: { text: string; from: number; to: number }) {
    // Dispatch custom event for parent component
    const event = new CustomEvent('latex-selection-change', { 
      detail: selection,
      bubbles: true 
    })
    document.dispatchEvent(event)
  }

  private notifyCursorPosition(position: number) {
    // Dispatch custom event for parent component
    const event = new CustomEvent('latex-cursor-position', { 
      detail: position,
      bubbles: true 
    })
    document.dispatchEvent(event)
  }

  // Method to get last cursor position when focus changes
  getLastCursorPosition(): number {
    return this.lastCursorPosition
  }

  hasActiveSelection(): boolean {
    return this.hasSelection
  }
})

// Plugin to handle focus changes and mark cursor position
const focusPlugin = ViewPlugin.fromClass(class {
  private view: EditorView
  private selectionPlugin: any

  constructor(view: EditorView) {
    this.view = view
    // Get reference to selection plugin
    this.selectionPlugin = view.plugin(selectionPlugin)
    
    // Add click handler to clear selection when clicking elsewhere
    this.setupClickHandler()
  }

  private setupClickHandler() {
    const handleClick = (event: MouseEvent) => {
      // Only handle clicks within the editor DOM
      if (event.target && this.view.dom.contains(event.target as Node)) {
        // Check if we're clicking on a UI element (button, input, etc.)
        const target = event.target as HTMLElement
        if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || 
            target.closest('button') || target.closest('input') || target.closest('textarea')) {
          // Don't clear selection when clicking on UI elements
          return
        }
        
        // If we had a selection and clicked elsewhere, clear it
        if (this.selectionPlugin && this.selectionPlugin.hasActiveSelection()) {
          // Get click position
          const coords = this.view.posAtCoords({ x: event.clientX, y: event.clientY })
          if (coords !== null) {
            // Get current selection range
            const currentSelection = this.view.state.selection
            const selectionFrom = currentSelection.main.from
            const selectionTo = currentSelection.main.to
            
            // Only clear selection if clicking significantly outside the selected text
            // This prevents accidental clearing when clicking near the selection
            const buffer = 5 // 5 character buffer around selection
            if (coords < (selectionFrom - buffer) || coords > (selectionTo + buffer)) {
              // Clear selection by setting cursor to click position
              this.view.dispatch({
                selection: { anchor: coords, head: coords }
              })
              
              // Notify that selection was cleared
              this.notifySelectionCleared()
            }
          }
        }
      }
    }

    // Add click listener to the editor
    this.view.dom.addEventListener('click', handleClick)
    
    // Cleanup function
    return () => {
      this.view.dom.removeEventListener('click', handleClick)
    }
  }

  update(update: ViewUpdate) {
    // Handle focus changes
    if (update.focusChanged) {
      if (!update.view.hasFocus) {
        // Editor lost focus - mark last cursor position
        if (this.selectionPlugin) {
          const lastPos = this.selectionPlugin.getLastCursorPosition()
          this.notifyFocusLost(lastPos)
        }
      } else {
        // Editor gained focus - check if we should clear selection
        // Only clear if user explicitly clicked in editor (not just regained focus)
        if (this.selectionPlugin && this.selectionPlugin.hasActiveSelection()) {
          // Don't auto-clear selection when gaining focus
          // Selection will only be cleared by explicit clicks
        }
      }
    }
  }

  private notifyFocusLost(cursorPosition: number) {
    // Dispatch custom event for focus loss
    const event = new CustomEvent('latex-focus-lost', { 
      detail: { cursorPosition },
      bubbles: true 
    })
    document.dispatchEvent(event)
  }

  private notifySelectionCleared() {
    // Dispatch custom event for selection cleared
    const event = new CustomEvent('latex-selection-cleared', { 
      bubbles: true 
    })
    document.dispatchEvent(event)
  }
})

// LaTeX autocompletion
const latexCompletions = [
  // Document structure
  { label: '\\documentclass{article}', type: 'keyword', info: 'Document class declaration' },
  { label: '\\begin{document}', type: 'keyword', info: 'Begin document' },
  { label: '\\end{document}', type: 'keyword', info: 'End document' },
  { label: '\\title{}', type: 'function', info: 'Document title' },
  { label: '\\author{}', type: 'function', info: 'Document author' },
  { label: '\\date{}', type: 'function', info: 'Document date' },
  { label: '\\maketitle', type: 'function', info: 'Generate title' },
  
  // Sections
  { label: '\\section{}', type: 'function', info: 'Section heading' },
  { label: '\\subsection{}', type: 'function', info: 'Subsection heading' },
  { label: '\\subsubsection{}', type: 'function', info: 'Subsubsection heading' },
  { label: '\\paragraph{}', type: 'function', info: 'Paragraph heading' },
  
  // Math environments
  { label: '\\begin{equation}', type: 'keyword', info: 'Equation environment' },
  { label: '\\end{equation}', type: 'keyword', info: 'End equation' },
  { label: '\\begin{align}', type: 'keyword', info: 'Align environment' },
  { label: '\\end{align}', type: 'keyword', info: 'End align' },
  { label: '\\begin{matrix}', type: 'keyword', info: 'Matrix environment' },
  { label: '\\end{matrix}', type: 'keyword', info: 'End matrix' },
  
  // Lists
  { label: '\\begin{itemize}', type: 'keyword', info: 'Bullet list' },
  { label: '\\end{itemize}', type: 'keyword', info: 'End bullet list' },
  { label: '\\begin{enumerate}', type: 'keyword', info: 'Numbered list' },
  { label: '\\end{enumerate}', type: 'keyword', info: 'End numbered list' },
  { label: '\\item', type: 'function', info: 'List item' },
  
  // Tables
  { label: '\\begin{table}', type: 'keyword', info: 'Table environment' },
  { label: '\\end{table}', type: 'keyword', info: 'End table' },
  { label: '\\begin{tabular}', type: 'keyword', info: 'Tabular environment' },
  { label: '\\end{tabular}', type: 'keyword', info: 'End tabular' },
  { label: '\\hline', type: 'function', info: 'Horizontal line' },
  
  // Text formatting
  { label: '\\textbf{}', type: 'function', info: 'Bold text' },
  { label: '\\textit{}', type: 'function', info: 'Italic text' },
  { label: '\\underline{}', type: 'function', info: 'Underlined text' },
  { label: '\\emph{}', type: 'function', info: 'Emphasized text' },
  
  // Common commands
  { label: '\\usepackage{}', type: 'function', info: 'Include package' },
  { label: '\\cite{}', type: 'function', info: 'Citation' },
  { label: '\\ref{}', type: 'function', info: 'Reference' },
  { label: '\\label{}', type: 'function', info: 'Label' },
  { label: '\\footnote{}', type: 'function', info: 'Footnote' },
  { label: '\\caption{}', type: 'function', info: 'Caption' },
  { label: '\\includegraphics{}', type: 'function', info: 'Include graphics' },
  
  // Math symbols
  { label: '\\alpha', type: 'constant', info: 'Greek letter alpha' },
  { label: '\\beta', type: 'constant', info: 'Greek letter beta' },
  { label: '\\gamma', type: 'constant', info: 'Greek letter gamma' },
  { label: '\\delta', type: 'constant', info: 'Greek letter delta' },
  { label: '\\sum', type: 'operator', info: 'Summation' },
  { label: '\\int', type: 'operator', info: 'Integral' },
  { label: '\\frac{}{}', type: 'function', info: 'Fraction' },
  { label: '\\sqrt{}', type: 'function', info: 'Square root' },
]

// Simple LaTeX language definition that actually works
const latexLanguage = StreamLanguage.define({
  name: "latex",
  startState: () => ({ inComment: false, inMath: false }),
  token: (stream, state) => {
    // Handle comments
    if (stream.match('%')) {
      stream.skipToEnd()
      return 'comment'
    }
    
    // Handle LaTeX commands
    if (stream.match(/\\[a-zA-Z]+/)) {
      return 'keyword'
    }
    
    // Handle math mode
    if (stream.match('$')) {
      state.inMath = !state.inMath
      return 'operator'
    }
    
    // Handle braces and brackets
    if (stream.match(/[{}]/)) {
      return 'brace'
    }
    
    if (stream.match(/[\[\]()]/)) {
      return 'bracket'
    }
    
    // Handle numbers
    if (stream.match(/\d+/)) {
      return 'number'
    }
    
    // Default: advance one character
    stream.next()
    return state.inMath ? 'string' : null
  }
})

const latexAutocompletion = autocompletion({
  override: [
    (context: CompletionContext) => {
      const word = context.matchBefore(/\\?\w*/)
      if (!word) return null
      
      const from = word.from
      const options = latexCompletions.filter(completion => 
        completion.label.toLowerCase().includes(word.text.toLowerCase())
      )
      
      return {
        from,
        options: options.map(completion => ({
          label: completion.label,
          type: completion.type,
          info: completion.info,
          apply: completion.label
        }))
      }
    }
  ]
})

// Enhanced LaTeX syntax highlighting
const latexHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: '#6272a4', fontStyle: 'italic' },
  { tag: tags.keyword, color: '#ff79c6', fontWeight: 'bold' },
  { tag: tags.string, color: '#f1fa8c' },
  { tag: tags.number, color: '#bd93f9' },
  { tag: tags.operator, color: '#ff79c6' },
  { tag: tags.variableName, color: '#50fa7b' },
  { tag: tags.typeName, color: '#8be9fd' },
  { tag: tags.function(tags.variableName), color: '#ffb86c' },
  { tag: tags.bracket, color: '#f8f8f2' },
  { tag: tags.brace, color: '#ff79c6' },
  { tag: tags.paren, color: '#f8f8f2' },
])

// Enhanced LaTeX theme with forced scrolling
const latexTheme = EditorView.theme({
  '&': {
    fontSize: '16px',
    fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
    lineHeight: '1.6',
    height: '100%',
    maxHeight: '100vh',
    overflow: 'hidden',
  },
  '.cm-editor': {
    height: '100%',
    maxHeight: '100vh',
    overflow: 'hidden',
  },
  '.cm-scroller': {
    height: '100%',
    maxHeight: '100vh',
    overflow: 'auto !important',
    overflowY: 'auto !important',
    overflowX: 'auto !important',
  },
  '.cm-content': {
    padding: '12px',
    minHeight: '100%',
    overflowY: 'visible',
    // Add bottom space so final lines clear the bottom panel (Save Version bar)
    paddingBottom: '140px',
  },
  '.cm-line': {
    padding: '0 4px',
  },
  '.cm-cursor': {
    borderLeft: '2px solid #f8f8f2',
  },
  '.cm-preview-hide': {
    display: 'none'
  },
  '.cm-citation-flag': {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderBottom: '2px solid #ef4444',
    borderRadius: '2px'
  },
  '.bg-red-200\\/40': {
    backgroundColor: 'rgba(254, 202, 202, 0.4)',
    borderRadius: '3px'
  },
  '.cm-selectionBackground': {
    backgroundColor: '#44475a',
  },
  '.cm-activeLine': {
    backgroundColor: '#44475a22',
  },
  '.cm-tooltip': {
    backgroundColor: '#282a36',
    border: '1px solid #44475a',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#44475a',
      color: '#f8f8f2',
    }
  },
  '.cm-selection-highlight': {
    backgroundColor: '#44475a',
    borderRadius: '4px',
    boxShadow: '0 0 0 2px #ff6b6b inset',
  },
  '.position-marker': {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  // AI Suggestion Styling - Simple and reliable with better transparency
  '.cm-add-line': {
    backgroundColor: 'rgba(34, 197, 94, 0.1)', // Much more transparent green background
    borderLeft: '3px solid #22c55e',
    paddingLeft: '8px',
    fontWeight: '500', // Reduced font weight for better readability
    color: 'inherit', // Use inherited text color instead of forcing green
    boxShadow: 'inset 0 0 0 1px rgba(34, 197, 94, 0.3)', // Subtle border
  },
  '.cm-delete-line': {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Much more transparent red background
    borderLeft: '3px solid #ef4444',
    paddingLeft: '8px',
    fontWeight: '500', // Reduced font weight for better readability
    textDecoration: 'line-through',
    color: 'inherit', // Use inherited text color instead of forcing red
    boxShadow: 'inset 0 0 0 1px rgba(239, 68, 68, 0.3)', // Subtle border
  },
  '@keyframes blink': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
  // Last cursor beacon styling
  '.cm-last-cursor-beacon': {
    position: 'relative',
    display: 'inline-block',
    width: '2px',
    height: '1.1em',
    backgroundColor: '#22c55e',
    animation: 'cm-beacon-blink 1.2s infinite',
    marginLeft: '0px',
    top: '0.1em', // Lower the beacon to align with text baseline
    verticalAlign: 'baseline',
  },
  '@keyframes cm-beacon-blink': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.3 },
    '100%': { opacity: 1 },
  },
})

// Simple and reliable ADD/DELETE line highlighting
const addDeleteHighlighting = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view)
    }
  }

  buildDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()
    const doc = view.state.doc

    // Simple iteration through all lines
    for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
      const line = doc.line(lineNum)
      const text = line.text

      // Check for ADD or DELETE markers
      if (text.startsWith('% ADD:')) {
        builder.add(line.from, line.to, Decoration.line({
          attributes: { class: 'cm-add-line' }
        }))
      } else if (text.startsWith('% DELETE:')) {
        builder.add(line.from, line.to, Decoration.line({
          attributes: { class: 'cm-delete-line' }
        }))
      }
    }

    return builder.finish()
  }
}, {
  decorations: v => v.decorations
})

// Widget type for inline diff preview
class InlineDiffWidget extends WidgetType {
  constructor(
    private preview: InlineDiffPreview,
    private onAccept: (id: string) => void,
    private onReject: (id: string) => void
  ) {
    super()
  }

  private buildBlock(title: string, contentText: string, kind: 'add' | 'delete') {
    const block = document.createElement('div')
    block.style.cssText = `
      border: 1px solid ${kind === 'add' ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)'};
      background: ${kind === 'add' ? 'rgba(34, 197, 94, 0.10)' : 'rgba(239, 68, 68, 0.10)'};
      color: inherit;
      border-radius: 6px;
      padding: 8px 10px;
      margin: 6px 0;
      white-space: pre-wrap;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.92em;
    `
    const header = document.createElement('div')
    header.textContent = title
    header.style.cssText = `
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.3px;
      margin-bottom: 6px;
      color: ${kind === 'add' ? '#166534' : '#7f1d1d'};
      text-transform: uppercase;
    `
    const content = document.createElement('div')
    content.textContent = contentText
    content.style.cssText = `${kind === 'delete' ? 'text-decoration: line-through;' : ''}`
    block.appendChild(header)
    block.appendChild(content)
    return block
  }

  toDOM() {
    const wrapper = document.createElement('div')
    wrapper.className = 'inline-diff-preview'
    wrapper.style.cssText = `
      display: block;
      position: relative;
      margin: 6px 2px;
      border-radius: 8px;
      padding: 6px;
      background: rgba(2,6,23,0.03);
      border: 1px dashed rgba(148,163,184,0.35);
      max-width: 100%;
      overflow: hidden;
    `

    // Build pretty stacked preview depending on type
    if (this.preview.type === 'replace') {
      const removed = this.buildBlock('Removed', this.preview.originalContent || '', 'delete')
      const added = this.buildBlock('Added', this.preview.content, 'add')
      wrapper.appendChild(removed)
      wrapper.appendChild(added)
    } else if (this.preview.type === 'delete') {
      const removed = this.buildBlock('Removed', this.preview.originalContent || this.preview.content, 'delete')
      wrapper.appendChild(removed)
    } else {
      const added = this.buildBlock('Added', this.preview.content, 'add')
      wrapper.appendChild(added)
    }

    // Single action bar (not floating too high)
    const toolbar = document.createElement('div')
    toolbar.style.cssText = `
      margin-top: 8px;
      display: inline-flex;
      gap: 8px;
      align-items: center;
      padding: 4px;
      border-radius: 6px;
      background: rgba(255,255,255,0.85);
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    `
    const acceptBtn = document.createElement('button')
    acceptBtn.textContent = 'Accept'
    acceptBtn.style.cssText = `
      background: #22c55e;
      color: #fff;
      border: none;
      border-radius: 5px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    `
    acceptBtn.onclick = (e) => {
      e.preventDefault(); e.stopPropagation(); this.onAccept(this.preview.id)
    }
    const rejectBtn = document.createElement('button')
    rejectBtn.textContent = 'Reject'
    rejectBtn.style.cssText = `
      background: #ef4444;
      color: #fff;
      border: none;
      border-radius: 5px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    `
    rejectBtn.onclick = (e) => {
      e.preventDefault(); e.stopPropagation(); this.onReject(this.preview.id)
    }
    toolbar.appendChild(acceptBtn)
    toolbar.appendChild(rejectBtn)
    wrapper.appendChild(toolbar)

    return wrapper
  }
}

// Plugin for inline diff previews
const inlineDiffPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet
  // Track live ranges for each preview ID so we can send accurate positions on accept/reject
  private previewRanges: Map<string, { from: number, to: number }>

  constructor(view: EditorView) {
    this.previewRanges = new Map()
    this.decorations = this.buildDecorations(view)
  }

  update(update: ViewUpdate) {
    const hasPreviewEffect = update.transactions.some(tr => tr.effects.some(e => e.is(setInlineDiffEffect)))
    if (hasPreviewEffect) {
      // Previews changed: rebuild everything from current state
      this.previewRanges.clear()
      this.decorations = this.buildDecorations(update.view)
      return
    }
    if (update.docChanged) {
      // Map decorations and stored ranges forward across document changes
      this.decorations = this.decorations.map(update.changes)
      const mapped = new Map<string, { from: number, to: number }>()
      this.previewRanges.forEach((range, id) => {
        const from = update.changes.mapPos(range.from, 1)
        const to = update.changes.mapPos(range.to, -1)
        mapped.set(id, { from, to })
      })
      this.previewRanges = mapped
    }
  }

  buildDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()
    const previews = view.state.field(inlineDiffField, false)
    
    if (!previews) return builder.finish()

    for (const preview of previews) {
      try {
        // Sanitize and track current ranges
        const docLen = view.state.doc.length
        const rangeFrom = Math.max(0, Math.min(preview.from, docLen))
        const rangeTo = Math.max(rangeFrom, Math.min(preview.to, docLen))
        this.previewRanges.set(preview.id, { from: rangeFrom, to: rangeTo })

        // Render a single, pretty widget for all types at the start position
        builder.add(
          rangeFrom,
          rangeFrom,
          Decoration.widget({
            widget: new InlineDiffWidget(
              preview,
              (id) => this.handleAccept(view, id),
              (id) => this.handleReject(view, id)
            ),
            side: 1
          })
        )
      } catch (error) {
        console.warn('Error building decoration for preview:', preview, error)
      }
    }

    return builder.finish()
  }

  private handleAccept(view: EditorView, id: string) {
    // Dispatch to parent component
    const range = this.previewRanges.get(id)
    const event = new CustomEvent('acceptInlineDiff', { detail: { id, from: range?.from, to: range?.to }, bubbles: true })
    view.dom.dispatchEvent(event)
  }

  private handleReject(view: EditorView, id: string) {
    // Dispatch to parent component
    const range = this.previewRanges.get(id)
    const event = new CustomEvent('rejectInlineDiff', { detail: { id, from: range?.from, to: range?.to }, bubbles: true })
    view.dom.dispatchEvent(event)
  }
}, {
  decorations: v => v.decorations
})

// Enhanced extensions with all features
const latexExtensions: Extension[] = [
  latexLanguage,
  latexTheme,
  syntaxHighlighting(latexHighlightStyle),
  bracketMatching(),
  closeBrackets(),
  indentOnInput(),
  latexAutocompletion,
  EditorView.lineWrapping,
  selectionPlugin,
  focusPlugin,
  addDeleteHighlighting,
  inlineDiffField,
  hiddenPreviewRangesField,
  highlightedRangesField,
  inlineDiffPlugin,
  lastCursorBeaconField,
  lastCursorBeaconHandlers,
]

// Simplified React component for inline AI suggestions
// NOTE: Removed deprecated InlineAISuggestion component to simplify UI and satisfy lint rules against inline styles.

// Simplified approach - we'll use React state and manual DOM updates instead of complex CodeMirror state
// This avoids the 'ev' variable initialization error

// Global storage for active suggestions to avoid state conflicts
let activeSuggestions: Map<string, AISuggestion> = new Map()

export function EnhancedLatexEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing your LaTeX document...",
  className = "",
  onSelectionChange,
  onCursorPositionChange,
  highlightedRanges,
  positionMarkers,
  onSetPositionMarker,
  onClearPositionMarkers,
  onFocusLost,
  onClick,
  onBlur,
  onFocus,
  aiSuggestions = [],
  onAcceptSuggestion,
  onRejectSuggestion,
  inlineDiffPreviews = [],
  onAcceptInlineDiff,
  onRejectInlineDiff,
  onLastCursorChange,
}: EnhancedLatexEditorProps) {
  const { settings } = useSettings()
  const [currentTheme, setCurrentTheme] = useState(tokyoNight)
  const editorRef = useRef<any>(null)
  
  const handleChange = useCallback((value: string) => {
    onChange(value)
  }, [onChange])

  // Update CodeMirror theme when global theme changes
  useEffect(() => {
    const themeMode = settings.theme === 'dark' ? 'dark' : 'light'
    const themeIndex = getCurrentThemeVariant(themeMode)
    const newTheme = getCodeMirrorTheme(themeMode, themeIndex)
    setCurrentTheme(newTheme)
  }, [settings.theme])

  // Listen for theme variant changes
  useEffect(() => {
    const handleThemeVariantChange = () => {
      const themeMode = settings.theme === 'dark' ? 'dark' : 'light'
      const themeIndex = getCurrentThemeVariant(themeMode)
      const newTheme = getCodeMirrorTheme(themeMode, themeIndex)
      setCurrentTheme(newTheme)
    }

    window.addEventListener('codemirror-theme-changed', handleThemeVariantChange)
    return () => {
      window.removeEventListener('codemirror-theme-changed', handleThemeVariantChange)
    }
  }, [settings.theme])

  // Update position markers when they change
  useEffect(() => {
    if (positionMarkers && positionMarkers.length > 0) {
      // For now, we'll handle this through the parent component
      // The position markers will be shown in the AI chat panel
    }
  }, [positionMarkers])

  // Handle focus changes to automatically mark cursor position
  const handleEditorBlur = useCallback(() => {
    // When editor loses focus, notify parent to mark cursor position
    if (onFocusLost) {
      // Get current cursor position from the editor
      const editorElement = document.querySelector('.cm-editor')
      if (editorElement) {
        // Find the cursor position by looking at the current selection
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const editorRect = editorElement.getBoundingClientRect()
          const cursorRect = range.getBoundingClientRect()
          
          // Calculate relative position
          const relativeX = ((cursorRect.left - editorRect.left) / editorRect.width) * 100
          const relativeY = ((cursorRect.top - editorRect.top) / editorRect.height) * 100
          
          // Estimate character position (rough calculation)
          const estimatedPosition = Math.floor((relativeY / 20) * 50 + (relativeX / 2))
          
          onFocusLost({ cursorPosition: estimatedPosition })
        }
      }
    }
  }, [onFocusLost])

  // Simplified AI suggestions handling using React state
  useEffect(() => {
    // Store suggestions in global map to avoid state conflicts
    activeSuggestions.clear()
    aiSuggestions.forEach(suggestion => {
      activeSuggestions.set(suggestion.id, suggestion)
    })
  }, [aiSuggestions])

  // Handle AI suggestion events
  useEffect(() => {
    const handleAccept = (event: Event) => {
      const customEvent = event as CustomEvent
      const suggestionId = customEvent.detail
      onAcceptSuggestion?.(suggestionId)
      activeSuggestions.delete(suggestionId)
    }

    const handleReject = (event: Event) => {
      const customEvent = event as CustomEvent
      const suggestionId = customEvent.detail
      onRejectSuggestion?.(suggestionId)
      activeSuggestions.delete(suggestionId)
    }

    document.addEventListener('ai-suggestion-accept', handleAccept)
    document.addEventListener('ai-suggestion-reject', handleReject)

    return () => {
      document.removeEventListener('ai-suggestion-accept', handleAccept)
      document.removeEventListener('ai-suggestion-reject', handleReject)
    }
  }, [onAcceptSuggestion, onRejectSuggestion])

  // Manage inline diff previews
  useEffect(() => {
    const editorView = editorRef.current?.view
    if (!editorView) return

    // Update the editor with new inline diff previews
    editorView.dispatch({
      effects: [setInlineDiffEffect.of(inlineDiffPreviews)]
    })
    // Also update hidden-range marks so original text is visually suppressed during preview
    editorView.dispatch({
      effects: [setHiddenPreviewRanges.of(inlineDiffPreviews)]
    })
  }, [inlineDiffPreviews])

  // Manage highlighted ranges for citation issues
  useEffect(() => {
    const editorView = editorRef.current?.view
    if (!editorView) return

    // Update the editor with new highlighted ranges
    editorView.dispatch({
      effects: [setHighlightedRanges.of(highlightedRanges || [])]
    })
  }, [highlightedRanges])

  // Handle inline diff events
  useEffect(() => {
    const handleAcceptInlineDiff = (event: Event) => {
      const customEvent = event as CustomEvent
      const { id, from, to } = customEvent.detail as { id: string; from?: number; to?: number }
      // Pass through accurate, mapped positions when available
      // @ts-ignore - broadened signature handled by parent
      onAcceptInlineDiff?.(id, from, to)
    }

    const handleRejectInlineDiff = (event: Event) => {
      const customEvent = event as CustomEvent
      const { id, from, to } = customEvent.detail as { id: string; from?: number; to?: number }
      // @ts-ignore - broadened signature handled by parent
      onRejectInlineDiff?.(id, from, to)
    }

    const editorElement = editorRef.current?.view?.dom
    if (editorElement) {
      editorElement.addEventListener('acceptInlineDiff', handleAcceptInlineDiff)
      editorElement.addEventListener('rejectInlineDiff', handleRejectInlineDiff)
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener('acceptInlineDiff', handleAcceptInlineDiff)
        editorElement.removeEventListener('rejectInlineDiff', handleRejectInlineDiff)
      }
    }
  }, [onAcceptInlineDiff, onRejectInlineDiff])

  useEffect(() => {
    const handleSelectionChange = (event: Event) => {
      const customEvent = event as CustomEvent
      onSelectionChange?.(customEvent.detail as { text: string; from: number; to: number })
    }
    const handleCursorPositionChange = (event: Event) => {
      const customEvent = event as CustomEvent
      onCursorPositionChange?.(customEvent.detail as number)
    }
    const handleFocusLost = (event: Event) => {
      const customEvent = event as CustomEvent
      onFocusLost?.(customEvent.detail as { cursorPosition: number })
    }
    const handleClick = () => {
      onClick?.()
    }

    document.addEventListener('latex-selection-change', handleSelectionChange)
    document.addEventListener('latex-cursor-position', handleCursorPositionChange)
    document.addEventListener('latex-focus-lost', handleFocusLost)
    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('latex-selection-change', handleSelectionChange)
      document.removeEventListener('latex-cursor-position', handleCursorPositionChange)
      document.removeEventListener('latex-focus-lost', handleFocusLost)
      document.removeEventListener('click', handleClick)
    }
  }, [onSelectionChange, onCursorPositionChange, onFocusLost, onClick])

  // Handle last cursor beacon changes
  useEffect(() => {
    const handleLastCursorChange = (event: Event) => {
      const customEvent = event as CustomEvent
      onLastCursorChange?.(customEvent.detail as number | null)
    }

    document.addEventListener('latex-last-cursor-change', handleLastCursorChange)

    return () => {
      document.removeEventListener('latex-last-cursor-change', handleLastCursorChange)
    }
  }, [onLastCursorChange])

  return (
    <>
      {/* CSS Animation for Blinking and AI Suggestions */}
      <style jsx global>{`
        @keyframes blink {
          0%, 50% { 
            opacity: 1; 
            background-color: #dc2626 !important;
            transform: scale(1);
          }
          51%, 100% { 
            opacity: 0.8; 
            background-color: #ef4444 !important;
            transform: scale(1.05);
          }
        }
        
        @keyframes ai-suggestion-pulse {
          0%, 100% { 
            opacity: 0.8;
            background-color: rgba(34, 197, 94, 0.2);
          }
          50% { 
            opacity: 1;
            background-color: rgba(34, 197, 94, 0.4);
          }
        }
        
        .inline-ai-suggestion {
          display: inline;
          animation: ai-suggestion-pulse 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className={`w-full h-full ${className} relative overflow-hidden`}>
        <CodeMirror
        ref={editorRef}
        value={value}
        height="100%"
        width="100%"
        theme={currentTheme}
        extensions={latexExtensions}
        onChange={handleChange}
        placeholder={placeholder}
        onBlur={handleEditorBlur}
        onFocus={onFocus}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          syntaxHighlighting: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        className="h-full text-[16px]"
      />
      </div>
    </>
  )
}

