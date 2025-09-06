import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const url = searchParams.get('url')

        if (!url) {
            return NextResponse.json({ error: 'PDF URL is required' }, { status: 400 })
        }

        // Validate URL format
        let pdfUrl: URL
        try {
            pdfUrl = new URL(url)
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
        }

        // Only allow certain domains for security
        const allowedDomains = [
            'arxiv.org',
            'www.arxiv.org',
            'export.arxiv.org',
            'papers.nips.cc',
            'openreview.net',
            'proceedings.mlr.press',
            'aclanthology.org',
            'ieeexplore.ieee.org',
            'link.springer.com',
            'dl.acm.org',
            'www.nature.com',
            'science.org',
            'academic.oup.com',
            'journals.plos.org',
            'www.biorxiv.org',
            'www.medrxiv.org',
            // NCBI/PMC medical research repositories
            'www.ncbi.nlm.nih.gov',
            'ncbi.nlm.nih.gov',
            'europepmc.org',
            'www.europepmc.org',
            // Backblaze B2 domains for uploaded PDFs
            'f003.backblazeb2.com',
            'f004.backblazeb2.com',
            'f005.backblazeb2.com',
            'f006.backblazeb2.com',
            'f007.backblazeb2.com',
            'f008.backblazeb2.com',
            'f009.backblazeb2.com',
            'f010.backblazeb2.com',
            'f011.backblazeb2.com',
            'f012.backblazeb2.com',
            'f013.backblazeb2.com',
            'f014.backblazeb2.com',
            'f015.backblazeb2.com',
            'f016.backblazeb2.com',
            'f017.backblazeb2.com',
            'f018.backblazeb2.com',
            'f019.backblazeb2.com',
            'f020.backblazeb2.com'
        ]

        if (!allowedDomains.some(domain => pdfUrl.hostname === domain || pdfUrl.hostname.endsWith('.' + domain))) {
            return NextResponse.json({
                error: 'Domain not allowed. Only academic paper repositories are supported.'
            }, { status: 403 })
        }

        console.log('Proxying PDF request to:', url)

        // Check if it's a B2 URL and handle accordingly
        const isB2Url = pdfUrl.hostname.startsWith('f') && pdfUrl.hostname.endsWith('.backblazeb2.com')
        const isPMCUrl = pdfUrl.hostname.includes('ncbi.nlm.nih.gov')
        
        // Fetch the PDF with appropriate headers
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/pdf,*/*',
                'Referer': pdfUrl.origin,
                // Add specific headers for B2 URLs if needed
                ...(isB2Url && {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }),
                // Add specific headers for PMC URLs
                ...(isPMCUrl && {
                    'Accept': 'application/pdf,application/octet-stream,*/*',
                    'Accept-Language': 'en-US,en;q=0.9'
                })
            },
            redirect: 'follow', // Follow redirects for PMC and other services
            method: 'GET'
        })

        if (!response.ok) {
            console.error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
            console.error(`Final URL after redirects: ${response.url}`)
            
            // Special handling for B2 URLs
            if (isB2Url) {
                console.error(`B2 URL failed: ${url}`)
                console.error(`Response headers:`, Object.fromEntries(response.headers.entries()))
            }
            
            // Special handling for PMC URLs
            if (isPMCUrl) {
                console.error(`PMC URL failed: ${url}`)
                console.error(`Final redirected URL: ${response.url}`)
                
                // Provide helpful error message for PMC
                if (response.status === 404) {
                    return NextResponse.json({
                        error: 'PMC article not found. The article may not exist or PDF may not be available.',
                        suggestion: 'Try checking the PMC ID or using a different download method.',
                        url: url,
                        finalUrl: response.url
                    }, { status: 404 })
                }
            }
            
            return NextResponse.json({
                error: `Failed to fetch PDF: ${response.status} ${response.statusText}`,
                url: url,
                finalUrl: response.url,
                isB2Url: isB2Url,
                isPMCUrl: isPMCUrl
            }, { status: response.status })
        }

        // Check content type
        const contentType = response.headers.get('content-type')
        if (contentType && !contentType.includes('pdf') && !contentType.includes('application/octet-stream')) {
            console.warn(`Unexpected content type: ${contentType}`)
        }

        // Get the PDF data
        const pdfBuffer = await response.arrayBuffer()

        if (pdfBuffer.byteLength === 0) {
            return NextResponse.json({ error: 'Received empty PDF file' }, { status: 404 })
        }

        console.log(`Successfully fetched PDF: ${pdfBuffer.byteLength} bytes`)

        // Return the PDF with proper headers
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Length': pdfBuffer.byteLength.toString(),
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        })

    } catch (error) {
        console.error('PDF proxy error:', error)
        return NextResponse.json({
            error: 'Failed to proxy PDF request',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
} 