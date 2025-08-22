"use client"

import React, { useCallback } from 'react'
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

interface EnhancedLatexEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

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
  }
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
]

export function EnhancedLatexEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing your LaTeX document...",
  className = ""
}: EnhancedLatexEditorProps) {
  const handleChange = useCallback((value: string) => {
    onChange(value)
  }, [onChange])

  return (
    <div className={`w-full h-full ${className}`} style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
      <CodeMirror
        value={value}
        height="100%"
        width="100%"
        theme={tokyoNight}
        extensions={latexExtensions}
        onChange={handleChange}
        placeholder={placeholder}
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
  )
}

