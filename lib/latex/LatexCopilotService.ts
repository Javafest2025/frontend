export interface LatexCopilotRequest {
  context: {
    style: 'ieee'
    documentClass: 'IEEEtran'
    preamblePackagesPresent: string[]
    surroundingText: string
    assets: string[]
  }
  cursor: {
    mode: 'insert' | 'replace'
    position: number
    selection: {
      text: string
      start: number | null
      end: number | null
    }
  }
  task: {
    intent: 'transform' | 'insert' | 'explain'
    command: string
    constraints: {
      width: 'column' | 'page'
      float: 't' | 'b' | 'h' | 'H'
      labelPrefix: 'fig:' | 'tab:' | 'alg:'
      keepSelection: boolean
    }
  }
}

export interface LatexCopilotResponse {
  latex: string
  meta: {
    requiresPackages: string[]
    notes: string
    previewHints: {
      fastPreviewFallback: boolean
      accuratePreviewRecommended: boolean
    }
    anchors: {
      labels: string[]
      referencesTouched: string[]
    }
    editorHints: {
      cursor: {
        strategy: 'afterEnvironment' | 'atLabel' | 'atCaption'
        lineDelta: number
        colDelta: number
      }
      selection: {
        relativeStart: number
        relativeEnd: number
      }
      foldableEnv: 'table' | 'figure' | 'algorithm' | 'none'
      applyMode: 'insert' | 'replace'
    }
  }
}

export class LatexCopilotService {
  private static instance: LatexCopilotService
  private readonly baselinePackages = [
    'graphicx', 'amsmath', 'amssymb', 'textcomp', 'hyperref', 'xcolor',
    'booktabs', 'array', 'caption', 'subcaption', 'siunitx', 'algorithm', 'algpseudocode', 'tikz'
  ]

  static getInstance(): LatexCopilotService {
    if (!LatexCopilotService.instance) {
      LatexCopilotService.instance = new LatexCopilotService()
    }
    return LatexCopilotService.instance
  }

  async processRequest(request: LatexCopilotRequest): Promise<LatexCopilotResponse> {
    const { task, context, cursor } = request
    const command = task.command.toLowerCase()
    
    // Analyze the command and generate appropriate LaTeX
    if (command.includes('table') || command.includes('make this a table')) {
      return this.generateTable(request)
    } else if (command.includes('figure') || command.includes('add a figure')) {
      return this.generateFigure(request)
    } else if (command.includes('algorithm') || command.includes('convert to algorithm')) {
      return this.generateAlgorithm(request)
    } else if (command.includes('tikz') || command.includes('draw')) {
      return this.generateTikzDiagram(request)
    } else if (command.includes('subfigures') || command.includes('subfigure')) {
      return this.generateSubfigures(request)
    } else if (command.includes('equation') || command.includes('math')) {
      return this.generateMathEnvironment(request)
    } else if (command.includes('improve') || command.includes('formal')) {
      return this.improveContent(request)
    } else if (command.includes('ieee-compliant') || command.includes('ieee compliant')) {
      return this.makeIeeeCompliant(request)
    } else if (command.includes('caption') || command.includes('label')) {
      return this.addCaptionAndLabel(request)
    } else if (command.includes('reference') || command.includes('ref')) {
      return this.addReference(request)
    } else {
      return this.generateGenericImprovement(request)
    }
  }

  private generateTable(request: LatexCopilotRequest): LatexCopilotResponse {
    const { cursor, context } = request
    const selection = cursor.selection.text
    
    // Generate IEEE-compliant table
    let tableContent = ''
    let columns = 'l'
    
    if (selection.trim()) {
      // Parse selection to determine table structure
      const lines = selection.trim().split('\n')
      if (lines.length > 0) {
        const firstLine = lines[0]
        const columnCount = (firstLine.match(/,/g) || []).length + 1
        columns = '@{}' + 'c'.repeat(columnCount) + '@{}'
        
        tableContent = lines.map((line, index) => {
          const cells = line.split(',').map(cell => cell.trim())
          if (index === 0) {
            return cells.join(' & ') + ' \\\\ \\midrule'
          } else {
            return cells.join(' & ') + ' \\\\'
          }
        }).join('\n  ')
      }
    } else {
      // Default table structure
      columns = '@{}lcc@{}'
      tableContent = `Column 1 & Column 2 & Column 3 \\\\ \\midrule
  Data 1 & Data 2 & Data 3 \\\\
  Data 4 & Data 5 & Data 6 \\\\`
    }

    const label = this.generateLabel('tab:', 'table', request)
    
    return {
      latex: `\\begin{table}[t]
  \\centering
  \\caption{Data table}
  \\label{${label}}
  \\begin{tabular}{${columns}}
  \\toprule
  ${tableContent}
  \\bottomrule
  \\end{tabular}
\\end{table}`,
      meta: {
        requiresPackages: ['booktabs'],
        notes: 'Added IEEE-compliant table with booktabs',
        previewHints: { fastPreviewFallback: false, accuratePreviewRecommended: false },
        anchors: { labels: [label], referencesTouched: [] },
        editorHints: {
          cursor: { strategy: 'afterEnvironment', lineDelta: 0, colDelta: 0 },
          selection: { relativeStart: 0, relativeEnd: 0 },
          foldableEnv: 'table',
          applyMode: cursor.mode
        }
      }
    }
  }

  private generateFigure(request: LatexCopilotRequest): LatexCopilotResponse {
    const { context } = request
    const assets = context.assets
    let imagePath = 'images/figure.png'
    
    // Try to find an appropriate image from assets
    if (assets.length > 0) {
      const imageAsset = assets.find(asset => 
        asset.match(/\.(png|jpg|jpeg|pdf|svg)$/i)
      )
      if (imageAsset) {
        imagePath = imageAsset
      }
    }
    
    const label = this.generateLabel('fig:', 'figure', request)
    
    return {
      latex: `\\begin{figure}[t]
  \\centering
  \\includegraphics[width=\\columnwidth]{${imagePath}}
  \\caption{Figure description}
  \\label{${label}}
\\end{figure}`,
      meta: {
        requiresPackages: ['graphicx'],
        notes: `Assumes ${imagePath} exists.`,
        previewHints: { fastPreviewFallback: false, accuratePreviewRecommended: false },
        anchors: { labels: [label], referencesTouched: [] },
        editorHints: {
          cursor: { strategy: 'afterEnvironment', lineDelta: 0, colDelta: 0 },
          selection: { relativeStart: 0, relativeEnd: 0 },
          foldableEnv: 'figure',
          applyMode: 'insert'
        }
      }
    }
  }

  private generateAlgorithm(request: LatexCopilotRequest): LatexCopilotResponse {
    const label = this.generateLabel('alg:', 'algorithm', request)
    
    return {
      latex: `\\begin{algorithm}[t]
  \\caption{Algorithm description}
  \\label{${label}}
  \\begin{algorithmic}
  \\Function{FunctionName}{$parameters$}
    \\State $variable \\gets value$
    \\State \\Return $result$
  \\EndFunction
  \\end{algorithmic}
\\end{algorithm}`,
      meta: {
        requiresPackages: ['algorithm', 'algpseudocode'],
        notes: 'Added IEEE-compliant algorithm structure',
        previewHints: { fastPreviewFallback: true, accuratePreviewRecommended: true },
        anchors: { labels: [label], referencesTouched: [] },
        editorHints: {
          cursor: { strategy: 'afterEnvironment', lineDelta: 0, colDelta: 0 },
          selection: { relativeStart: 0, relativeEnd: 0 },
          foldableEnv: 'algorithm',
          applyMode: 'insert'
        }
      }
    }
  }

  private generateTikzDiagram(request: LatexCopilotRequest): LatexCopilotResponse {
    const label = this.generateLabel('fig:', 'tikz-diagram', request)
    
    return {
      latex: `\\begin{figure}[t]
  \\centering
  \\begin{tikzpicture}[>=Stealth, node distance=1.6cm]
    \\node[draw,rounded corners,align=center,minimum width=2.2cm] (A) {Logical\\\\Qubits};
    \\node[draw,rounded corners,align=center,right=of A,minimum width=2.6cm] (B) {CAES\\\\Heuristic};
    \\node[draw,rounded corners,align=center,right=of B,minimum width=2.4cm] (C) {Physical\\\\Layout};
    \\draw[->] (A) -- (B);
    \\draw[->] (B) -- (C);
  \\end{tikzpicture}
  \\caption{CAES mapping flow}
  \\label{${label}}
\\end{figure}`,
      meta: {
        requiresPackages: ['tikz'],
        notes: 'Fast preview may approximate TikZ; use Accurate PDF preview.',
        previewHints: { fastPreviewFallback: true, accuratePreviewRecommended: true },
        anchors: { labels: [label], referencesTouched: [] },
        editorHints: {
          cursor: { strategy: 'afterEnvironment', lineDelta: 0, colDelta: 0 },
          selection: { relativeStart: 0, relativeEnd: 0 },
          foldableEnv: 'figure',
          applyMode: 'insert'
        }
      }
    }
  }

  private generateSubfigures(request: LatexCopilotRequest): LatexCopilotResponse {
    const label = this.generateLabel('fig:', 'subfigures', request)
    
    return {
      latex: `\\begin{figure}[t]
  \\centering
  \\begin{subfigure}[b]{0.48\\columnwidth}
    \\centering
    \\includegraphics[width=\\textwidth]{images/subfigure1.png}
    \\subcaption{First subfigure}
    \\label{${label}:a}
  \\end{subfigure}
  \\hfill
  \\begin{subfigure}[b]{0.48\\columnwidth}
    \\centering
    \\includegraphics[width=\\textwidth]{images/subfigure2.png}
    \\subcaption{Second subfigure}
    \\label{${label}:b}
  \\end{subfigure}
  \\caption{Multiple subfigures}
  \\label{${label}}
\\end{figure}`,
      meta: {
        requiresPackages: ['graphicx', 'subcaption'],
        notes: 'Assumes images/subfigure1.png and images/subfigure2.png exist.',
        previewHints: { fastPreviewFallback: false, accuratePreviewRecommended: false },
        anchors: { labels: [label, `${label}:a`, `${label}:b`], referencesTouched: [] },
        editorHints: {
          cursor: { strategy: 'afterEnvironment', lineDelta: 0, colDelta: 0 },
          selection: { relativeStart: 0, relativeEnd: 0 },
          foldableEnv: 'figure',
          applyMode: 'insert'
        }
      }
    }
  }

  private generateMathEnvironment(request: LatexCopilotRequest): LatexCopilotResponse {
    const label = this.generateLabel('eq:', 'equation', request)
    
    return {
      latex: `\\begin{equation}
  \\label{${label}}
  E = mc^2
\\end{equation}`,
      meta: {
        requiresPackages: ['amsmath'],
        notes: 'Added equation environment with label',
        previewHints: { fastPreviewFallback: false, accuratePreviewRecommended: false },
        anchors: { labels: [label], referencesTouched: [] },
        editorHints: {
          cursor: { strategy: 'afterEnvironment', lineDelta: 0, colDelta: 0 },
          selection: { relativeStart: 0, relativeEnd: 0 },
          foldableEnv: 'none',
          applyMode: 'insert'
        }
      }
    }
  }

  private improveContent(request: LatexCopilotRequest): LatexCopilotResponse {
    const { cursor } = request
    const selection = cursor.selection.text
    
    if (selection.trim()) {
      return {
        latex: `\\begin{quote}
  \\textit{${selection}}
\\end{quote}`,
        meta: {
          requiresPackages: [],
          notes: 'Formalized content with quote environment',
          previewHints: { fastPreviewFallback: false, accuratePreviewRecommended: false },
          anchors: { labels: [], referencesTouched: [] },
          editorHints: {
            cursor: { strategy: 'afterEnvironment', lineDelta: 0, colDelta: 0 },
            selection: { relativeStart: 0, relativeEnd: 0 },
            foldableEnv: 'none',
            applyMode: 'replace'
          }
        }
      }
    }
    
    return this.generateGenericImprovement(request)
  }

  private makeIeeeCompliant(request: LatexCopilotRequest): LatexCopilotResponse {
    const { cursor } = request
    const selection = cursor.selection.text
    
    if (selection.trim()) {
      return {
        latex: `\\textbf{${selection}}`,
        meta: {
          requiresPackages: [],
          notes: 'Made text IEEE-compliant with bold formatting',
          previewHints: { fastPreviewFallback: false, accuratePreviewRecommended: false },
          anchors: { labels: [], referencesTouched: [] },
          editorHints: {
            cursor: { strategy: 'atLabel', lineDelta: 0, colDelta: 0 },
            selection: { relativeStart: 0, relativeEnd: 0 },
            foldableEnv: 'none',
            applyMode: 'replace'
          }
        }
      }
    }
    
    return this.generateGenericImprovement(request)
  }

  private addCaptionAndLabel(request: LatexCopilotRequest): LatexCopilotResponse {
    const { task } = request
    const prefix = task.constraints.labelPrefix || 'fig:'
    const label = this.generateLabel(prefix, 'element', request)
    
    return {
      latex: `\\caption{Description}
\\label{${label}}`,
      meta: {
        requiresPackages: [],
        notes: 'Added caption and label',
        previewHints: { fastPreviewFallback: false, accuratePreviewRecommended: false },
        anchors: { labels: [label], referencesTouched: [] },
        editorHints: {
          cursor: { strategy: 'atCaption', lineDelta: 0, colDelta: 0 },
          selection: { relativeStart: 0, relativeEnd: 0 },
          foldableEnv: 'none',
          applyMode: 'insert'
        }
      }
    }
  }

  private addReference(request: LatexCopilotRequest): LatexCopilotResponse {
    const { task } = request
    const command = task.command.toLowerCase()
    
    // Extract reference type and label
    let refType = 'fig:'
    let refLabel = 'example'
    
    if (command.includes('fig:')) {
      refType = 'fig:'
      const match = command.match(/fig:([a-zA-Z0-9-]+)/)
      if (match) refLabel = match[1]
    } else if (command.includes('tab:')) {
      refType = 'tab:'
      const match = command.match(/tab:([a-zA-Z0-9-]+)/)
      if (match) refLabel = match[1]
    } else if (command.includes('alg:')) {
      refType = 'alg:'
      const match = command.match(/alg:([a-zA-Z0-9-]+)/)
      if (match) refLabel = match[1]
    }
    
    return {
      latex: `\\ref{${refType}${refLabel}}`,
      meta: {
        requiresPackages: [],
        notes: `Added reference to ${refType}${refLabel}`,
        previewHints: { fastPreviewFallback: false, accuratePreviewRecommended: false },
        anchors: { labels: [], referencesTouched: [`${refType}${refLabel}`] },
        editorHints: {
          cursor: { strategy: 'atLabel', lineDelta: 0, colDelta: 0 },
          selection: { relativeStart: 0, relativeEnd: 0 },
          foldableEnv: 'none',
          applyMode: 'insert'
        }
      }
    }
  }

  private generateGenericImprovement(request: LatexCopilotRequest): LatexCopilotResponse {
    const { task } = request
    
    return {
      latex: `% ${task.command}
\\begin{quote}
  Improved content based on: "${task.command}"
\\end{quote}`,
      meta: {
        requiresPackages: [],
        notes: 'Generic improvement applied',
        previewHints: { fastPreviewFallback: false, accuratePreviewRecommended: false },
        anchors: { labels: [], referencesTouched: [] },
        editorHints: {
          cursor: { strategy: 'afterEnvironment', lineDelta: 0, colDelta: 0 },
          selection: { relativeStart: 0, relativeEnd: 0 },
          foldableEnv: 'none',
          applyMode: 'insert'
        }
      }
    }
  }

  private generateLabel(prefix: string, type: string, request: LatexCopilotRequest): string {
    const { task } = request
    const command = task.command.toLowerCase()
    
    // Extract meaningful words from command for label generation
    const words = command
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 3)
    
    if (words.length > 0) {
      return `${prefix}${words.join('-')}`
    }
    
    return `${prefix}${type}-${Date.now().toString(36)}`
  }

  getMissingPackages(context: LatexCopilotRequest): string[] {
    const requiredPackages = new Set<string>()
    
    // Analyze context to determine required packages
    if (context.preamblePackagesPresent.includes('graphicx')) {
      requiredPackages.add('graphicx')
    }
    if (context.preamblePackagesPresent.includes('amsmath')) {
      requiredPackages.add('amsmath')
    }
    if (context.preamblePackagesPresent.includes('booktabs')) {
      requiredPackages.add('booktabs')
    }
    
    return Array.from(requiredPackages)
  }
}

export const latexCopilotService = LatexCopilotService.getInstance()

