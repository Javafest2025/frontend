import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

function getGrobidUrl(): string {
    const url = process.env.GROBID_URL || 'http://localhost:8070'
    return url.replace(/\/$/, '')
}

async function checkGrobidService(): Promise<boolean> {
    try {
        const grobidUrl = getGrobidUrl()
        const response = await fetch(`${grobidUrl}/api/isalive`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        })
        return response.ok
    } catch (error) {
        console.error('GROBID service check failed:', error)
        return false
    }
}

async function callGrobidHeaderOnly(file: File): Promise<string> {
    // Use processHeaderDocument for faster processing - only extracts header info (title, authors, abstract)
    // This is much faster as it only processes the first page instead of the entire document
    const grobidUrl = `${getGrobidUrl()}/api/processHeaderDocument`

    // Convert File to Buffer/ArrayBuffer for proper form submission
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const form = new FormData()
    form.append('input', new Blob([buffer], { type: 'application/pdf' }), file.name)
    form.append('consolidateHeader', '1') // Consolidate header information
    form.append('includeRawAffiliations', '1') // Include raw affiliations
    form.append('teiCoordinates', 'true') // Include coordinates for better parsing

    console.log('🔍 Calling GROBID Header API (fast):', grobidUrl)
    console.log('📄 Processing file header:', file.name, 'size:', file.size)

    const res = await fetch(grobidUrl, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(60000) // 1 minute timeout (much faster than full doc)
    })

    console.log('📊 GROBID header response status:', res.status, res.statusText)

    if (!res.ok) {
        const text = await res.text()
        console.error('❌ GROBID header API error:', res.status, res.statusText, text)
        throw new Error(`GROBID header error: ${res.status} ${res.statusText} ${text}`)
    }

    const teiXml = await res.text()
    console.log('✅ GROBID returned header TEI XML, length:', teiXml.length)

    // Check if we got BibTeX instead of TEI XML
    if (teiXml.trim().startsWith('@') || teiXml.includes('author = {')) {
        console.warn('⚠️ GROBID returned BibTeX format instead of TEI XML, falling back to full document processing')
        return await callGrobidFullDocument(file)
    }

    return teiXml
}

async function callGrobidFullDocument(file: File): Promise<string> {
    // Fallback to full document processing if header-only returns BibTeX
    const grobidUrl = `${getGrobidUrl()}/api/processFulltextDocument`

    // Convert File to Buffer/ArrayBuffer for proper form submission
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const form = new FormData()
    form.append('input', new Blob([buffer], { type: 'application/pdf' }), file.name)
    form.append('consolidateHeader', '1')
    form.append('consolidateCitations', '0') // Skip citations for faster processing
    form.append('includeRawCitations', '0')
    form.append('includeRawAffiliations', '1')
    form.append('teiCoordinates', 'true')

    console.log('🔍 Calling GROBID Full Document API (fallback):', grobidUrl)
    console.log('📄 Processing full document:', file.name, 'size:', file.size)

    const res = await fetch(grobidUrl, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(120000) // 2 minute timeout for full document
    })

    console.log('📊 GROBID full document response status:', res.status, res.statusText)

    if (!res.ok) {
        const text = await res.text()
        console.error('❌ GROBID full document API error:', res.status, res.statusText, text)
        throw new Error(`GROBID full document error: ${res.status} ${res.statusText} ${text}`)
    }

    const teiXml = await res.text()
    console.log('✅ GROBID returned full document TEI XML, length:', teiXml.length)

    return teiXml
}

function parseTei(teiXml: string): { title?: string; authors: string[]; abstractText?: string } {
    console.log('🔍 Parsing TEI XML...')

    // Log first 500 characters for debugging
    console.log('TEI XML preview:', teiXml.substring(0, 500))

    // Check if we got BibTeX format instead of TEI XML
    if (teiXml.trim().startsWith('@') || teiXml.includes('author = {')) {
        console.log('📄 Detected BibTeX format, parsing as BibTeX...')
        return parseBibTeX(teiXml)
    }

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        ignoreNameSpace: false,
        parseTagValue: false,
        parseNodeValue: false,
        parseTrueNumberOnly: false,
        arrayMode: false,
        alwaysCreateTextNode: false,
        isArray: (name: string, jpath: string, isLeafNode: boolean, isAttribute: boolean) => {
            // Handle author arrays properly
            if (name === 'author') return true
            if (name === 'p' && jpath.includes('abstract')) return true
            return false
        }
    })

    const tei = parser.parse(teiXml)
    console.log('🔍 Parsed TEI structure keys:', Object.keys(tei))

    // Navigate TEI structure - handle both with and without namespace
    const teiRoot = tei?.TEI || tei?.['tei:TEI'] || tei
    const teiHeader = teiRoot?.teiHeader || teiRoot?.['tei:teiHeader']
    const fileDesc = teiHeader?.fileDesc || teiHeader?.['tei:fileDesc']
    const titleStmt = fileDesc?.titleStmt || fileDesc?.['tei:titleStmt']
    const profileDesc = teiHeader?.profileDesc || teiHeader?.['tei:profileDesc']

    // Also check sourceDesc for authors (GROBID often puts them there)
    const sourceDesc = fileDesc?.sourceDesc || fileDesc?.['tei:sourceDesc']
    const biblStruct = sourceDesc?.biblStruct || sourceDesc?.['tei:biblStruct']
    const analytic = biblStruct?.analytic || biblStruct?.['tei:analytic']

    console.log('🔍 TEI components found:', {
        hasTeiRoot: !!teiRoot,
        hasHeader: !!teiHeader,
        hasFileDesc: !!fileDesc,
        hasTitleStmt: !!titleStmt,
        hasProfileDesc: !!profileDesc,
        hasSourceDesc: !!sourceDesc,
        hasBiblStruct: !!biblStruct,
        hasAnalytic: !!analytic
    })

    // Extract title with multiple fallbacks
    let title: string | undefined
    const titleElem = titleStmt?.title || titleStmt?.['tei:title']
    if (typeof titleElem === 'string') {
        title = titleElem
    } else if (titleElem?.['#text']) {
        title = titleElem['#text']
    } else if (Array.isArray(titleElem) && titleElem.length > 0) {
        const firstTitle = titleElem[0]
        title = typeof firstTitle === 'string' ? firstTitle : firstTitle?.['#text']
    } else if (titleElem) {
        title = String(titleElem)
    }

    console.log('📝 Extracted title:', title)

    // Extract authors with better handling - check multiple locations
    const authors: string[] = []

    // First check titleStmt (header authors)
    let authorNodes = titleStmt?.author || titleStmt?.['tei:author'] || []

    // If no authors in titleStmt, check analytic section (common in GROBID)
    if ((!authorNodes || (Array.isArray(authorNodes) && authorNodes.length === 0)) && analytic) {
        console.log('🔍 Looking for authors in analytic section...')
        authorNodes = analytic?.author || analytic?.['tei:author'] || []
        console.log('👥 Found authors in analytic:', JSON.stringify(authorNodes, null, 2).substring(0, 500))
    }

    const authorArray = Array.isArray(authorNodes) ? authorNodes : [authorNodes].filter(Boolean)

    console.log('👥 Found author nodes:', authorArray.length)

    for (const node of authorArray) {
        const persName = node?.persName || node?.['tei:persName'] || node
        let forename = ''
        let surname = ''

        // Handle forename - can be array or single element
        const forenameElem = persName?.forename || persName?.['tei:forename']
        if (typeof forenameElem === 'string') {
            forename = forenameElem
        } else if (forenameElem?.['#text']) {
            forename = forenameElem['#text']
        } else if (Array.isArray(forenameElem)) {
            // Handle multiple forenames (e.g., first, middle names)
            forename = forenameElem.map((x: any) => {
                if (typeof x === 'string') return x
                if (x?.['#text']) return x['#text']
                return String(x || '')
            }).filter(Boolean).join(' ')
        }

        // Handle surname
        const surnameElem = persName?.surname || persName?.['tei:surname']
        if (typeof surnameElem === 'string') {
            surname = surnameElem
        } else if (surnameElem?.['#text']) {
            surname = surnameElem['#text']
        }

        const fullName = [forename, surname].filter(Boolean).join(' ').trim()
        if (fullName) {
            authors.push(fullName)
            console.log(`👤 Extracted author: ${fullName}`)
        }
    }

    console.log('👥 Final extracted authors:', authors)

    // Extract abstract with better handling - check multiple locations
    let abstractText: string | undefined

    // Method 1: Check profileDesc/abstract
    let abstractNode = profileDesc?.abstract || profileDesc?.['tei:abstract']

    // Method 2: If not found, check for abstract in body
    if (!abstractNode && teiRoot) {
        const body = teiRoot?.text?.body || teiRoot?.['tei:text']?.['tei:body']
        if (body) {
            const abstractDiv = body?.div?.find?.((d: any) =>
                d?.['@_type'] === 'abstract' ||
                d?.head?.['#text']?.toLowerCase().includes('abstract')
            )
            if (abstractDiv) {
                abstractNode = abstractDiv
            }
        }
    }

    if (abstractNode) {
        console.log('📄 Found abstract node:', JSON.stringify(abstractNode, null, 2).substring(0, 300))

        if (typeof abstractNode === 'string') {
            abstractText = abstractNode
        } else {
            // Handle paragraphs in abstract
            const paragraphs = abstractNode?.p || abstractNode?.['tei:p'] || []
            const pArray = Array.isArray(paragraphs) ? paragraphs : [paragraphs].filter(Boolean)

            const abstractParts: string[] = []
            for (const p of pArray) {
                if (typeof p === 'string') {
                    abstractParts.push(p)
                } else if (p?.['#text']) {
                    abstractParts.push(p['#text'])
                } else if (p) {
                    // Handle mixed content - extract all text
                    const textContent = extractAllTextContent(p)
                    if (textContent) {
                        abstractParts.push(textContent)
                    }
                }
            }

            if (abstractParts.length > 0) {
                abstractText = abstractParts.join(' ').trim()
            } else {
                // Fallback: extract all text content from abstract node
                abstractText = extractAllTextContent(abstractNode)
            }
        }
    }

    console.log('📄 Extracted abstract length:', abstractText?.length || 0)
    if (abstractText) {
        console.log('📄 Abstract preview:', abstractText.substring(0, 200) + '...')
    }

    const result = { title, authors, abstractText }
    console.log('✅ Final extraction result:', {
        hasTitle: !!title,
        authorCount: authors.length,
        hasAbstract: !!abstractText,
        title: title?.substring(0, 100) + (title && title.length > 100 ? '...' : ''),
        firstAuthor: authors[0],
        abstractPreview: abstractText?.substring(0, 100) + (abstractText && abstractText.length > 100 ? '...' : '')
    })

    return result
}

// Helper function to extract all text content from a complex object
function extractAllTextContent(obj: any): string {
    if (typeof obj === 'string') {
        return obj
    }

    if (obj?.['#text']) {
        return obj['#text']
    }

    if (Array.isArray(obj)) {
        return obj.map(extractAllTextContent).filter(Boolean).join(' ')
    }

    if (typeof obj === 'object' && obj !== null) {
        const textParts: string[] = []

        // Check for direct text content
        if (obj['#text']) {
            textParts.push(obj['#text'])
        }

        // Recursively check all properties
        for (const [key, value] of Object.entries(obj)) {
            if (key !== '@_type' && key !== '@_level' && !key.startsWith('@_')) {
                const content = extractAllTextContent(value)
                if (content) {
                    textParts.push(content)
                }
            }
        }

        return textParts.join(' ').trim()
    }

    return ''
}

// Helper function to parse BibTeX format
function parseBibTeX(bibtex: string): { title?: string; authors: string[]; abstractText?: string } {
    console.log('🔍 Parsing BibTeX format...')

    try {
        // Extract title
        const titleMatch = bibtex.match(/title\s*=\s*\{([^}]+)\}/i)
        const title = titleMatch ? titleMatch[1].trim() : undefined

        // Extract authors
        const authorMatch = bibtex.match(/author\s*=\s*\{([^}]+)\}/i)
        let authors: string[] = []
        if (authorMatch) {
            const authorString = authorMatch[1].trim()
            // Split by 'and' and clean up
            authors = authorString.split(/\s+and\s+/i)
                .map(author => author.trim())
                .filter(author => author.length > 0)
        }

        // Extract abstract
        const abstractMatch = bibtex.match(/abstract\s*=\s*\{([^}]+)\}/i)
        const abstractText = abstractMatch ? abstractMatch[1].trim() : undefined

        console.log('📄 BibTeX extraction result:', {
            title: title?.substring(0, 100),
            authorCount: authors.length,
            abstractLength: abstractText?.length || 0
        })

        return { title, authors, abstractText }
    } catch (error) {
        console.error('❌ BibTeX parsing error:', error)
        return { title: undefined, authors: [], abstractText: undefined }
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('🔍 GROBID metadata extraction request received')

        // Check if GROBID service is available first
        const serviceAvailable = await checkGrobidService()
        if (!serviceAvailable) {
            console.error('❌ GROBID service is not available')
            return NextResponse.json({
                error: 'GROBID service is not available',
                details: 'Make sure GROBID is running at ' + getGrobidUrl()
            }, { status: 503 })
        }

        const form = await request.formData()
        const file = form.get('file') as File | null
        if (!file) {
            return NextResponse.json({ error: 'file is required' }, { status: 400 })
        }
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF is supported' }, { status: 400 })
        }

        console.log('📄 Processing file:', file.name, 'size:', file.size, 'bytes')

        const tei = await callGrobidHeaderOnly(file)
        const { title, authors, abstractText } = parseTei(tei)

        // More lenient validation - require at least title OR abstract OR authors
        const hasValidTitle = title && title.trim().length > 3
        const hasValidAbstract = abstractText && abstractText.trim().length > 10
        const hasValidAuthors = authors && authors.length > 0

        // Accept if we have at least 2 out of 3 (title, abstract, authors)
        const validCount = [hasValidTitle, hasValidAbstract, hasValidAuthors].filter(Boolean).length
        const isValid = validCount >= 2

        console.log('📊 Validation check:', {
            hasValidTitle,
            hasValidAbstract,
            hasValidAuthors,
            validCount,
            isValid
        })

        console.log('✅ Extraction complete:', {
            isValid,
            hasTitle: !!title,
            hasAbstract: !!abstractText,
            authorCount: authors.length
        })

        return NextResponse.json({
            data: {
                title: title?.trim() || null,
                authors,
                abstractText: abstractText?.trim() || null,
                isValid
            }
        })
    } catch (err) {
        console.error('❌ GROBID extraction failed:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({
            error: 'Failed to extract with GROBID',
            details: message
        }, { status: 500 })
    }
}


