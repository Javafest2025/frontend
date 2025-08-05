// LaTeX template generator service
export interface TemplateConfig {
  title?: string
  author?: string
  documentClass?: 'article' | 'report' | 'book' | 'thesis'
  fontSize?: '10pt' | '11pt' | '12pt'
  paperSize?: 'a4paper' | 'letterpaper'
  includeAbstract?: boolean
  includeTableOfContents?: boolean
  citationStyle?: 'ieee' | 'acm' | 'apa' | 'chicago'
  sections?: string[]
}

export const templateGenerator = {
  generateBasicPaper: (config: TemplateConfig = {}): string => {
    const {
      title = 'Your Paper Title',
      author = 'Your Name',
      documentClass = 'article',
      fontSize = '12pt',
      paperSize = 'a4paper',
      includeAbstract = true,
      includeTableOfContents = false,
      citationStyle = 'ieee',
      sections = ['Introduction', 'Related Work', 'Methodology', 'Results', 'Conclusion']
    } = config

    let template = `\\documentclass[${fontSize},${paperSize}]{${documentClass}}

% Packages
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{cite}
\\usepackage{url}
\\usepackage{hyperref}

% Title and Author
\\title{${title}}
\\author{${author}}
\\date{\\today}

\\begin{document}

\\maketitle

`

    if (includeTableOfContents) {
      template += `\\tableofcontents
\\newpage

`
    }

    if (includeAbstract) {
      template += `\\begin{abstract}
Write your abstract here. This should be a concise summary of your research, including the problem, methods, key results, and conclusions.
\\end{abstract}

`
    }

    // Add sections
    sections.forEach((section, index) => {
      template += `\\section{${section}}
% TODO: Write content for ${section}

`
    })

    template += `% Bibliography
\\bibliographystyle{${citationStyle}}
\\bibliography{references}

\\end{document}`

    return template
  },

  generateConferencePaper: (config: TemplateConfig = {}): string => {
    return templateGenerator.generateBasicPaper({
      ...config,
      documentClass: 'article',
      fontSize: '10pt',
      includeAbstract: true,
      includeTableOfContents: false,
      sections: [
        'Introduction',
        'Related Work',
        'Problem Statement',
        'Proposed Approach',
        'Experimental Setup',
        'Results and Analysis',
        'Discussion',
        'Conclusion and Future Work'
      ]
    })
  },

  generateJournalArticle: (config: TemplateConfig = {}): string => {
    return templateGenerator.generateBasicPaper({
      ...config,
      documentClass: 'article',
      fontSize: '12pt',
      includeAbstract: true,
      includeTableOfContents: false,
      sections: [
        'Introduction',
        'Literature Review',
        'Theoretical Framework',
        'Methodology',
        'Data Analysis',
        'Results',
        'Discussion',
        'Limitations',
        'Conclusion',
        'Acknowledgments'
      ]
    })
  },

  generateThesis: (config: TemplateConfig = {}): string => {
    return templateGenerator.generateBasicPaper({
      ...config,
      documentClass: 'report',
      fontSize: '12pt',
      includeAbstract: true,
      includeTableOfContents: true,
      sections: [
        'Introduction',
        'Literature Review',
        'Research Methodology',
        'Data Collection and Analysis',
        'Results and Findings',
        'Discussion',
        'Conclusion and Recommendations',
        'Future Work'
      ]
    })
  },

  generateProposal: (config: TemplateConfig = {}): string => {
    return templateGenerator.generateBasicPaper({
      ...config,
      documentClass: 'article',
      fontSize: '12pt',
      includeAbstract: true,
      includeTableOfContents: false,
      sections: [
        'Problem Statement',
        'Objectives',
        'Literature Review',
        'Proposed Methodology',
        'Expected Outcomes',
        'Timeline',
        'Budget and Resources',
        'Risk Assessment'
      ]
    })
  },

  // Predefined templates
  templates: {
    'Basic Research Paper': {
      description: 'A standard academic research paper template',
      generator: templateGenerator.generateBasicPaper
    },
    'Conference Paper': {
      description: 'Template optimized for conference submissions',
      generator: templateGenerator.generateConferencePaper
    },
    'Journal Article': {
      description: 'Template for journal article submissions',
      generator: templateGenerator.generateJournalArticle
    },
    'Thesis/Dissertation': {
      description: 'Comprehensive template for thesis writing',
      generator: templateGenerator.generateThesis
    },
    'Research Proposal': {
      description: 'Template for research grant proposals',
      generator: templateGenerator.generateProposal
    }
  }
}

// LaTeX compilation utilities
export const latexUtils = {
  // Basic LaTeX to HTML converter for preview (simplified)
  convertToHtml: (latexContent: string): string => {
    let html = latexContent

    // Document structure
    html = html.replace(/\\documentclass\[.*?\]\{.*?\}/g, '')
    html = html.replace(/\\usepackage\[?.*?\]?\{.*?\}/g, '')
    html = html.replace(/\\begin\{document\}/g, '<div class="latex-document">')
    html = html.replace(/\\end\{document\}/g, '</div>')

    // Title and author
    html = html.replace(/\\title\{(.*?)\}/g, '<h1 class="title">$1</h1>')
    html = html.replace(/\\author\{(.*?)\}/g, '<p class="author">$1</p>')
    html = html.replace(/\\date\{(.*?)\}/g, '<p class="date">$1</p>')
    html = html.replace(/\\maketitle/g, '')

    // Abstract
    html = html.replace(/\\begin\{abstract\}/g, '<div class="abstract"><h3>Abstract</h3>')
    html = html.replace(/\\end\{abstract\}/g, '</div>')

    // Sections
    html = html.replace(/\\section\{(.*?)\}/g, '<h2>$1</h2>')
    html = html.replace(/\\subsection\{(.*?)\}/g, '<h3>$1</h3>')
    html = html.replace(/\\subsubsection\{(.*?)\}/g, '<h4>$1</h4>')

    // Lists
    html = html.replace(/\\begin\{enumerate\}/g, '<ol>')
    html = html.replace(/\\end\{enumerate\}/g, '</ol>')
    html = html.replace(/\\begin\{itemize\}/g, '<ul>')
    html = html.replace(/\\end\{itemize\}/g, '</ul>')
    html = html.replace(/\\item/g, '<li>')

    // Math (basic)
    html = html.replace(/\$\$(.*?)\$\$/g, '<div class="math-block">$1</div>')
    html = html.replace(/\$(.*?)\$/g, '<span class="math-inline">$1</span>')

    // Citations
    html = html.replace(/\\cite\{(.*?)\}/g, '<sup class="citation">[$1]</sup>')

    // Bibliography
    html = html.replace(/\\bibliographystyle\{.*?\}/g, '')
    html = html.replace(/\\bibliography\{.*?\}/g, '<h2>References</h2><p><em>Bibliography will be generated here</em></p>')

    // Clean up extra whitespace and comments
    html = html.replace(/%.*$/gm, '') // Remove comments
    html = html.replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
    html = html.replace(/\n/g, '<br>')

    return `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: 'Times New Roman', serif; line-height: 1.6; background: white; color: black;">
        <style>
          .latex-document { }
          .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .author { text-align: center; font-size: 16px; margin-bottom: 5px; }
          .date { text-align: center; font-size: 14px; margin-bottom: 30px; }
          .abstract { background: #f9f9f9; padding: 20px; margin: 20px 0; border-left: 4px solid #007acc; }
          .abstract h3 { margin-top: 0; color: #007acc; }
          h2 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 5px; }
          h3 { color: #555; }
          h4 { color: #777; }
          .math-block { text-align: center; margin: 15px 0; padding: 10px; background: #f5f5f5; }
          .math-inline { background: #f0f0f0; padding: 2px 4px; }
          .citation { color: #007acc; font-weight: bold; }
          ul, ol { margin: 10px 0; padding-left: 30px; }
        </style>
        ${html}
      </div>
    `
  },

  // Validate LaTeX syntax (basic)
  validateSyntax: (latexContent: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Check for unmatched braces
    const braceCount = (latexContent.match(/\{/g) || []).length - (latexContent.match(/\}/g) || []).length
    if (braceCount !== 0) {
      errors.push(`Unmatched braces: ${Math.abs(braceCount)} ${braceCount > 0 ? 'opening' : 'closing'} brace(s)`)
    }

    // Check for basic document structure
    if (!latexContent.includes('\\begin{document}')) {
      errors.push('Missing \\begin{document}')
    }
    if (!latexContent.includes('\\end{document}')) {
      errors.push('Missing \\end{document}')
    }

    // Check for unmatched environments
    const beginMatches = latexContent.match(/\\begin\{(\w+)\}/g) || []
    const endMatches = latexContent.match(/\\end\{(\w+)\}/g) || []
    
    if (beginMatches.length !== endMatches.length) {
      errors.push('Unmatched begin/end environments')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
