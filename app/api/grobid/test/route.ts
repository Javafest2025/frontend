import { NextRequest, NextResponse } from 'next/server'

function getGrobidUrl(): string {
    const url = process.env.GROBID_URL || 'http://localhost:8070'
    return url.replace(/\/$/, '')
}

export async function GET(request: NextRequest) {
    try {
        const grobidUrl = getGrobidUrl()
        console.log('🔍 Testing GROBID service at:', grobidUrl)

        // Test isalive endpoint
        const response = await fetch(`${grobidUrl}/api/isalive`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        })

        console.log('📊 GROBID isalive response:', response.status, response.statusText)

        if (response.ok) {
            const body = await response.text()
            return NextResponse.json({
                status: 'success',
                grobidUrl,
                isalive: true,
                response: body,
                message: 'GROBID service is running'
            })
        } else {
            return NextResponse.json({
                status: 'error',
                grobidUrl,
                isalive: false,
                statusCode: response.status,
                statusText: response.statusText,
                message: 'GROBID service is not responding properly'
            }, { status: 503 })
        }
    } catch (error) {
        console.error('❌ GROBID test failed:', error)
        return NextResponse.json({
            status: 'error',
            grobidUrl: getGrobidUrl(),
            isalive: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Failed to connect to GROBID service'
        }, { status: 503 })
    }
}
