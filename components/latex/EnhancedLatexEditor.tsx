"use client"

import React, { useCallback, useRef, useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night'
import { EditorView } from '@codemirror/view'
import { Extension } from '@codemirror/state'
import { syntaxHighlighting, HighlightStyle, LanguageSupport, StreamLanguage } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { autocompletion, CompletionContext } from '@codemirror/autocomplete'
import { closeBrackets } from '@codemirror/autocomplete'
import { bracketMatching } from '@codemirror/language'
import { indentOnInput } from '@codemirror/language'
import { StateField, StateEffect, RangeSetBuilder } from '@codemirror/state'
import { Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { WidgetType } from '@codemirror/view'

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
}

// Custom decorations for highlighting and markers
const highlightMark = Decoration.mark({ class: "cm-selection-highlight" })

class PositionMarkerWidget extends WidgetType {
  constructor(private label: string, private blinking: boolean) { 
    super() 
  }
  
  toDOM() {
    const span = document.createElement("span")
    span.className = `position-marker ${this.blinking ? 'blinking' : ''}`
    span.textContent = this.label
    span.style.cssText = `
      background: #ff6b6b;
      color: white;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: bold;
      position: absolute;
      left: -8px;
      top: -8px;
      z-index: 1000;
      animation: ${this.blinking ? 'blink 1s infinite' : 'none'};
    `
    return span
  }
}

const positionMarker = (label: string, blinking: boolean) => Decoration.widget({ 
  widget: new PositionMarkerWidget(label, blinking),
  side: 1
})

// State field for managing decorations
const highlightField = StateField.define<DecorationSet>({
  create() { return Decoration.none },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes)
    return decorations
  },
  provide: f => EditorView.decorations.from(f)
})

// State field for position markers
const positionMarkerField = StateField.define<DecorationSet>({
  create() { return Decoration.none },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes)
    return decorations
  },
  provide: f => EditorView.decorations.from(f)
})

// Function to create position marker decorations
const createPositionMarkers = (markers: Array<{ position: number; label: string; blinking: boolean }>) => {
  const builder = new RangeSetBuilder<Decoration>()
  
  markers.forEach(marker => {
    const widget = new PositionMarkerWidget(marker.label, marker.blinking)
    builder.add(marker.position, marker.position, Decoration.widget({ 
      widget,
      side: 1
    }))
  })
  
  return builder.finish()
}

// Plugin to handle position marker updates
const positionMarkerPlugin = ViewPlugin.fromClass(class {
  private view: EditorView
  private markers: Array<{ position: number; label: string; blinking: boolean }> = []

  constructor(view: EditorView) {
    this.view = view
  }

  update(update: ViewUpdate) {
    // Check if positionMarkers prop changed
    if (update.docChanged || update.viewportChanged) {
      this.updateMarkers()
    }
  }

  setMarkers(markers: Array<{ position: number; label: string; blinking: boolean }>) {
    this.markers = markers
    this.updateMarkers()
  }

  private updateMarkers() {
    if (this.markers.length > 0) {
      const decorations = createPositionMarkers(this.markers)
      this.view.dispatch({
        effects: StateEffect.reconfigure.of([
          ...this.view.state.facet(EditorView.decorations.of(positionMarkerField)),
          positionMarkerField.init(() => decorations)
        ])
      })
    }
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
    } else {
      // Text selected
      const { from, to } = selection.main
      const text = view.state.doc.sliceString(from, to)
      this.hasSelection = true
      this.notifySelectionChange({ text, from, to })
    }
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
      // Only handle clicks within the editor
      if (event.target && this.view.dom.contains(event.target as Node)) {
        // If we had a selection and clicked elsewhere, clear it
        if (this.selectionPlugin && this.selectionPlugin.hasActiveSelection()) {
          // Clear selection by setting cursor to click position
          const coords = this.view.posAtCoords({ x: event.clientX, y: event.clientY })
          if (coords !== null) {
            this.view.dispatch({
              selection: { anchor: coords, head: coords }
            })
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
  },
  '.cm-line': {
    padding: '0 4px',
  },
  '.cm-cursor': {
    borderLeft: '2px solid #f8f8f2',
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
  '@keyframes blink': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
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
  highlightField,
  positionMarkerField,
  selectionPlugin,
  focusPlugin,
]

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
}: EnhancedLatexEditorProps) {
  const handleChange = useCallback((value: string) => {
    onChange(value)
  }, [onChange])

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

  // Function to insert position marker in the text
  const insertPositionMarker = useCallback((position: number, label: string) => {
    if (position !== undefined) {
      // Insert a LaTeX comment marker that won't affect compilation
      const markerText = `% 🎯 CURSOR MARKER: ${label} (Position: ${position}) %`
      const newValue = value.slice(0, position) + markerText + '\n' + value.slice(position)
      onChange(newValue)
    }
  }, [value, onChange])

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

  return (
    <>
      {/* Position Markers - OUTSIDE CodeMirror container */}
      {positionMarkers && positionMarkers.length > 0 && (
        <div 
          className="fixed pointer-events-none"
          style={{ 
            zIndex: 99999,
            left: '20px',
            top: '200px'
          }}
        >
          {positionMarkers.map((marker, index) => (
            <div
              key={index}
              className="mb-2 bg-red-600 text-white px-4 py-2 rounded-lg border-2 border-white shadow-2xl"
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                animation: marker.blinking ? 'blink 1s infinite' : 'none',
                display: 'block',
                position: 'relative'
              }}
            >
              🎯 CURSOR WAS AT: {marker.position}
            </div>
          ))}
        </div>
      )}
      
      {/* CSS Animation for Blinking */}
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
      `}</style>
      
      <div className={`w-full h-full ${className}`} style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
        <CodeMirror
        value={value}
        height="100%"
        width="100%"
        theme={tokyoNight}
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
        style={{
          fontSize: '16px',
          height: '100%',
          overflow: 'auto'
        }}
      />
      </div>
    </>
  )
}

