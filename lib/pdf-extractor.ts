// PDF metadata extraction utility using PDF.js

interface PDFMetadata {
    title?: string
    author?: string
    subject?: string
    keywords?: string
    creator?: string
    producer?: string
    creationDate?: string
    modificationDate?: string
}

export class PDFExtractor {
    private static pdfjsLib: any = null

    private static async loadPDFJS() {
        if (this.pdfjsLib) {
            return this.pdfjsLib
        }

        // Dynamically import PDF.js
        const pdfjs = await import('pdfjs-dist')
        this.pdfjsLib = pdfjs

        // Set worker path
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js'

        return pdfjs
    }

    static async extractMetadata(file: File): Promise<PDFMetadata> {
        try {
            const pdfjs = await this.loadPDFJS()

            // Convert file to ArrayBuffer
            const arrayBuffer = await file.arrayBuffer()

            // Load the PDF document
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
            const pdf = await loadingTask.promise

            // Get document info
            const info = await pdf.getDocumentInfo()

            // Get metadata
            const metadata: PDFMetadata = {}

            if (info.Title) metadata.title = info.Title
            if (info.Author) metadata.author = info.Author
            if (info.Subject) metadata.subject = info.Subject
            if (info.Keywords) metadata.keywords = info.Keywords
            if (info.Creator) metadata.creator = info.Creator
            if (info.Producer) metadata.producer = info.Producer
            if (info.CreationDate) metadata.creationDate = info.CreationDate
            if (info.ModDate) metadata.modificationDate = info.ModDate

            return metadata
        } catch (error) {
            console.warn('Failed to extract PDF metadata:', error)
            return {}
        }
    }

    static async extractText(file: File, maxPages: number = 3): Promise<string> {
        try {
            const pdfjs = await this.loadPDFJS()

            // Convert file to ArrayBuffer
            const arrayBuffer = await file.arrayBuffer()

            // Load the PDF document
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
            const pdf = await loadingTask.promise

            let fullText = ''
            const pageCount = Math.min(pdf.numPages, maxPages)

            for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
                const page = await pdf.getPage(pageNum)
                const textContent = await page.getTextContent()

                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ')

                fullText += pageText + '\n'
            }

            return fullText.trim()
        } catch (error) {
            console.warn('Failed to extract PDF text:', error)
            return ''
        }
    }

    static async generateAbstract(file: File): Promise<string | null> {
        try {
            const text = await this.extractText(file, 2) // First 2 pages

            if (!text) return null

            // Simple abstract generation: take first 200-300 words
            const words = text.split(/\s+/)
            const abstractWords = words.slice(0, Math.min(250, words.length))
            let abstract = abstractWords.join(' ')

            // Try to find a natural ending point
            const sentences = abstract.split(/[.!?]+/)
            if (sentences.length > 2) {
                abstract = sentences.slice(0, -1).join('.') + '.'
            }

            // Clean up the abstract
            abstract = abstract.replace(/\s+/g, ' ').trim()

            return abstract.length > 50 ? abstract : null
        } catch (error) {
            console.warn('Failed to generate abstract:', error)
            return null
        }
    }
} 