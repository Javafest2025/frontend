import { NextRequest, NextResponse } from 'next/server'

interface B2AuthResponse {
    accountId: string
    authorizationToken: string
    apiUrl: string
    downloadUrl: string
    recommendedPartSize: number
    absoluteMinimumPartSize: number
}

class B2Downloader {
    private authToken: string | null = null
    private apiUrl: string | null = null
    private downloadUrl: string | null = null

    private async authenticate(): Promise<void> {
        if (this.authToken && this.apiUrl) {
            return // Already authenticated
        }

        const keyId = process.env.B2_KEY_ID
        const applicationKey = process.env.B2_APPLICATION_KEY

        if (!keyId || !applicationKey) {
            throw new Error('B2 credentials not configured')
        }

        const authString = btoa(`${keyId}:${applicationKey}`)

        const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${authString}`
            }
        })

        if (!response.ok) {
            throw new Error(`B2 authentication failed: ${response.status}`)
        }

        const authData: B2AuthResponse = await response.json()

        this.authToken = authData.authorizationToken
        this.apiUrl = authData.apiUrl
        this.downloadUrl = authData.downloadUrl
    }

    async downloadFile(fileId: string): Promise<ArrayBuffer> {
        await this.authenticate()

        const downloadUrl = `${this.apiUrl}/b2api/v2/b2_download_file_by_id`

        console.log('B2 Download: Authenticated download for file ID:', fileId)

        const response = await fetch(downloadUrl, {
            method: 'POST',
            headers: {
                'Authorization': this.authToken!,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileId: fileId
            })
        })

        if (!response.ok) {
            console.error(`B2 download failed: ${response.status} ${response.statusText}`)
            console.error('Response headers:', Object.fromEntries(response.headers.entries()))
            throw new Error(`Failed to download from B2: ${response.status} ${response.statusText}`)
        }

        return await response.arrayBuffer()
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const fileId = searchParams.get('fileId')
        const url = searchParams.get('url')

        if (!fileId && !url) {
            return NextResponse.json({ error: 'File ID or URL is required' }, { status: 400 })
        }

        let actualFileId: string

        if (fileId) {
            actualFileId = fileId
        } else if (url) {
            // Extract file ID from URL
            try {
                const urlObj = new URL(url)
                const extractedFileId = urlObj.searchParams.get('fileId')
                if (!extractedFileId) {
                    return NextResponse.json({ error: 'No file ID found in URL' }, { status: 400 })
                }
                actualFileId = extractedFileId
            } catch (error) {
                return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
            }
        } else {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
        }

        console.log('B2 Download: Starting authenticated download for file ID:', actualFileId)

        // Use authenticated B2 downloader
        const b2Downloader = new B2Downloader()
        const pdfBuffer = await b2Downloader.downloadFile(actualFileId)

        if (pdfBuffer.byteLength === 0) {
            return NextResponse.json({ error: 'Received empty PDF file from B2' }, { status: 404 })
        }

        console.log(`Successfully downloaded PDF from B2: ${pdfBuffer.byteLength} bytes`)

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
        console.error('B2 download error:', error)
        return NextResponse.json({
            error: 'Failed to download from B2',
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