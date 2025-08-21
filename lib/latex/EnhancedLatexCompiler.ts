import { latexApi } from '@/lib/api/latex-service'

export interface CompilationResult {
  html: string
  metadata: {
    hasMath: boolean
    hasTables: boolean
    hasFigures: boolean
    hasAlgorithms: boolean
    requiresPackages: string[]
    previewQuality: 'fast' | 'accurate' | 'fallback'
  }
}

export class EnhancedLatexCompiler {
  private static instance: EnhancedLatexCompiler
  private compilationCache: Map<string, CompilationResult> = new Map()

  static getInstance(): EnhancedLatexCompiler {
    if (!EnhancedLatexCompiler.instance) {
      EnhancedLatexCompiler.instance = new EnhancedLatexCompiler()
    }
    return EnhancedLatexCompiler.instance
  }

  async compileLatex(latexContent: string): Promise<CompilationResult> {
    // Check cache first
    const cacheKey = this.generateCacheKey(latexContent)
    if (this.compilationCache.has(cacheKey)) {
      return this.compilationCache.get(cacheKey)!
    }

    try {
      // Try backend compilation first
      const result = await latexApi.compileLatex({ latexContent })
      
      if (result.data && typeof result.data === 'string') {
        const enhancedHtml = this.enhanceHtmlOutput(result.data, latexContent)
        const metadata = this.analyzeContent(latexContent)
        
        const compilationResult: CompilationResult = {
          html: enhancedHtml,
          metadata
        }
        
        // Cache the result
        this.compilationCache.set(cacheKey, compilationResult)
        return compilationResult
      }
    } catch (error) {
      console.warn('Backend compilation failed, using fallback:', error)
    }

    // Fallback to client-side compilation
    return this.fallbackCompilation(latexContent)
  }

  private enhanceHtmlOutput(html: string, originalLatex: string): string {
    // Ensure MathJax is included
    if (!html.includes('MathJax')) {
      html = this.injectMathJax(html)
    }

    // Enhance styling for better preview
    html = this.enhanceStyling(html)
    
    // Add syntax highlighting for LaTeX code blocks
    html = this.addSyntaxHighlighting(html)
    
    // Ensure proper font rendering
    html = this.ensureFontRendering(html)

    return html
  }

  private injectMathJax(html: string): string {
    const mathJaxScripts = `
      <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
      <script>
        window.MathJax = {
          tex: {
            inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
            displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
            processEscapes: true,
            processEnvironments: true
          },
          options: {
            ignoreHtmlClass: 'tex2jax_ignore',
            processHtmlClass: 'tex2jax_process'
          }
        };
      </script>
    `
    
    // Insert MathJax before closing head tag
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${mathJaxScripts}</head>`)
    } else {
      // If no head tag, add it at the beginning
      html = `<head>${mathJaxScripts}</head>${html}`
    }
    
    return html
  }

  private enhanceStyling(html: string): string {
    const enhancedStyles = `
      <style>
        body {
          font-family: 'Times New Roman', 'Georgia', serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        
        h1, h2, h3, h4, h5, h6 {
          color: #111827;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        
        h1 { font-size: 1.8em; text-align: center; margin-bottom: 1em; }
        h2 { font-size: 1.4em; }
        h3 { font-size: 1.2em; }
        
        p { margin-bottom: 1em; }
        
        .abstract {
          margin: 1.5em 0;
          padding: 1em;
          background-color: #f9fafb;
          border-left: 4px solid #3b82f6;
          font-style: italic;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
          font-size: 0.9em;
        }
        
        table, th, td {
          border: 1px solid #d1d5db;
        }
        
        th, td {
          padding: 8px 12px;
          text-align: left;
        }
        
        th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        
        .booktabs th {
          border-top: 2px solid #374151;
          border-bottom: 1px solid #d1d5db;
        }
        
        .booktabs td {
          border-bottom: 1px solid #d1d5db;
        }
        
        figure {
          margin: 1.5em 0;
          text-align: center;
        }
        
        figure img {
          max-width: 100%;
          height: auto;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
        }
        
        figcaption {
          margin-top: 0.5em;
          font-style: italic;
          color: #6b7280;
        }
        
        .algorithm {
          margin: 1.5em 0;
          padding: 1em;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }
        
        .algorithmic {
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        
        .algorithmic .Function {
          font-weight: 600;
          color: #059669;
        }
        
        .algorithmic .State {
          margin-left: 1em;
        }
        
        .algorithmic .EndFunction {
          margin-left: 1em;
          font-weight: 600;
          color: #dc2626;
        }
        
        blockquote {
          margin: 1em 0;
          padding: 0.5em 1em;
          border-left: 4px solid #e5e7eb;
          background-color: #f9fafb;
          font-style: italic;
        }
        
        code {
          background-color: #f3f4f6;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        
        pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 6px;
          overflow-x: auto;
          border: 1px solid #e5e7eb;
        }
        
        pre code {
          background: none;
          padding: 0;
        }
        
        ul, ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        
        li {
          margin-bottom: 0.5em;
        }
        
        .center {
          text-align: center;
        }
        
        .small {
          font-size: 0.9em;
        }
        
        .footnote {
          font-size: 0.8em;
          color: #6b7280;
        }
        
        /* Math styling */
        .MathJax {
          font-size: 1.1em;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          body {
            padding: 15px;
            font-size: 14px;
          }
          
          h1 { font-size: 1.5em; }
          h2 { font-size: 1.3em; }
          h3 { font-size: 1.1em; }
          
          table {
            font-size: 0.8em;
          }
          
          th, td {
            padding: 6px 8px;
          }
        }
      </style>
    `
    
    // Insert styles before closing head tag
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${enhancedStyles}</head>`)
    } else {
      // If no head tag, add it at the beginning
      html = `<head>${enhancedStyles}</head>${html}`
    }
    
    return html
  }

  private addSyntaxHighlighting(html: string): string {
    // Add syntax highlighting for LaTeX code blocks
    html = html.replace(
      /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
      '<pre><code class="language-latex">$1</code></pre>'
    )
    
    // Add syntax highlighting for inline code
    html = html.replace(
      /<code>([^<]+)<\/code>/g,
      '<code class="language-latex">$1</code>'
    )
    
    return html
  }

  private ensureFontRendering(html: string): string {
    // Add font rendering optimizations
    const fontOptimizations = `
      <style>
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        
        .MathJax {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      </style>
    `
    
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${fontOptimizations}</head>`)
    }
    
    return html
  }

  private fallbackCompilation(latexContent: string): CompilationResult {
    // Client-side LaTeX to HTML conversion
    let html = this.convertLatexToHtml(latexContent)
    
    // Inject MathJax and styling
    html = this.injectMathJax(html)
    html = this.enhanceStyling(html)
    html = this.addSyntaxHighlighting(html)
    html = this.ensureFontRendering(html)
    
    const metadata = this.analyzeContent(latexContent)
    
    return {
      html,
      metadata: {
        ...metadata,
        previewQuality: 'fallback'
      }
    }
  }

  private convertLatexToHtml(latex: string): string {
    let html = latex
    
    // Basic LaTeX to HTML conversions
    html = html.replace(/\\documentclass.*?\\begin\{document\}/gs, '')
    html = html.replace(/\\end\{document\}/g, '')
    html = html.replace(/\\usepackage.*?\n/g, '')
    
    // Headers
    html = html.replace(/\\title\{([^}]+)\}/g, '<h1>$1</h1>')
    html = html.replace(/\\author\{([^}]+)\}/g, '<div class="center"><strong>$1</strong></div>')
    html = html.replace(/\\date\{([^}]+)\}/g, '<div class="center">$1</div>')
    html = html.replace(/\\today/g, new Date().toLocaleDateString())
    
    // Sections
    html = html.replace(/\\section\{([^}]+)\}/g, '<h2>$1</h2>')
    html = html.replace(/\\subsection\{([^}]+)\}/g, '<h3>$1</h3>')
    html = html.replace(/\\subsubsection\{([^}]+)\}/g, '<h4>$1</h4>')
    
    // Abstract
    html = html.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, '<div class="abstract"><strong>Abstract:</strong><br>$1</div>')
    
    // Emphasis
    html = html.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
    html = html.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
    html = html.replace(/\\texttt\{([^}]+)\}/g, '<code>$1</code>')
    
    // Line breaks
    html = html.replace(/\\\\/g, '<br>')
    
    // Lists
    html = html.replace(/\\begin\{itemize\}/g, '<ul>')
    html = html.replace(/\\end\{itemize\}/g, '</ul>')
    html = html.replace(/\\begin\{enumerate\}/g, '<ol>')
    html = html.replace(/\\end\{enumerate\}/g, '</ol>')
    html = html.replace(/\\item\s+/g, '<li>')
    
    // Math (basic)
    html = html.replace(/\$([^$]+)\$/g, '\\($1\\)')
    html = html.replace(/\\\[([^\]]+)\\\]/g, '\\[$$1$$\\]')
    
    // Tables (basic)
    html = html.replace(/\\begin\{table\}([\s\S]*?)\\end\{table\}/g, '<table class="table">$1</table>')
    html = html.replace(/\\begin\{tabular\}([\s\S]*?)\\end\{tabular\}/g, '<table>$1</table>')
    html = html.replace(/&/g, '</td><td>')
    html = html.replace(/\\\\/g, '</td></tr><tr><td>')
    
    // Figures
    html = html.replace(/\\begin\{figure\}([\s\S]*?)\\end\{figure\}/g, '<figure>$1</figure>')
    html = html.replace(/\\includegraphics\[([^\]]*)\]\{([^}]+)\}/g, '<img src="$2" alt="Figure" style="max-width: 100%; height: auto;">')
    html = html.replace(/\\caption\{([^}]+)\}/g, '<figcaption>$1</figcaption>')
    html = html.replace(/\\label\{([^}]+)\}/g, '')
    
    // Clean up
    html = html.replace(/\n\s*\n/g, '\n\n')
    html = html.replace(/\n/g, '<br>\n')
    
    return html
  }

  private analyzeContent(latexContent: string) {
    const hasMath = /\\[\[$]|\\begin\{.*math.*\}|\\[a-zA-Z]+\{.*\}/.test(latexContent)
    const hasTables = /\\begin\{table\}|\\begin\{tabular\}/.test(latexContent)
    const hasFigures = /\\begin\{figure\}|\\includegraphics/.test(latexContent)
    const hasAlgorithms = /\\begin\{algorithm\}|\\begin\{algorithmic\}/.test(latexContent)
    
    const requiresPackages: string[] = []
    if (hasTables) requiresPackages.push('booktabs', 'array')
    if (hasFigures) requiresPackages.push('graphicx')
    if (hasAlgorithms) requiresPackages.push('algorithm', 'algpseudocode')
    if (hasMath) requiresPackages.push('amsmath', 'amssymb')
    
    return {
      hasMath,
      hasTables,
      hasFigures,
      hasAlgorithms,
      requiresPackages,
      previewQuality: 'fast' as const
    }
  }

  private generateCacheKey(content: string): string {
    // Simple hash for caching
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  clearCache(): void {
    this.compilationCache.clear()
  }
}

export const enhancedLatexCompiler = EnhancedLatexCompiler.getInstance()

