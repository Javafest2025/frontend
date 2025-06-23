import { NextRequest, NextResponse } from 'next/server'

interface B2AuthConfig {
    authToken: string;
    apiUrl: string;
    downloadUrl: string;
}

/**
 * Server-side B2 authentication - credentials stay secure
 */
async function authorizeB2AccountServer(): Promise<B2AuthConfig> {
    const keyId = process.env.B2_KEY_ID;
    const applicationKey = process.env.B2_APPLICATION_KEY;

    if (!keyId || !applicationKey) {
        throw new Error('B2 credentials not found in environment variables');
    }

    // Create base64 encoded credentials
    const credentials = `${keyId}:${applicationKey}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');

    console.log('🔐 Server: Authorizing with B2...');

    const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${base64Credentials}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`B2 authorization failed: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();

    return {
        authToken: data.authorizationToken,
        apiUrl: data.apiUrl,
        downloadUrl: data.downloadUrl
    };
}

/**
 * Extract file ID from B2 URL
 */
function extractFileIdFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const fileId = urlObj.searchParams.get('fileId');

        if (!fileId) {
            throw new Error('No fileId parameter found in URL');
        }

        return fileId;
    } catch (error) {
        throw new Error('Invalid B2 download URL format');
    }
}

/**
 * Download file from B2 using server-side authentication
 */
async function downloadB2FileServer(authConfig: B2AuthConfig, fileId: string): Promise<Response> {
    const url = `${authConfig.apiUrl}/b2api/v2/b2_download_file_by_id`;

    console.log(`📥 Server: Downloading file ID: ${fileId}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': authConfig.authToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fileId: fileId
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to download file: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return response;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pdfUrl, filename } = body;

        if (!pdfUrl) {
            return NextResponse.json(
                { error: 'PDF URL is required' },
                { status: 400 }
            );
        }

        // Validate that this is a B2 URL
        if (!pdfUrl.includes('backblazeb2.com') || !pdfUrl.includes('b2_download_file_by_id')) {
            return NextResponse.json(
                { error: 'Invalid B2 URL format' },
                { status: 400 }
            );
        }

        // Extract file ID
        const fileId = extractFileIdFromUrl(pdfUrl);

        // Authenticate with B2
        const authConfig = await authorizeB2AccountServer();

        // Download the file
        const fileResponse = await downloadB2FileServer(authConfig, fileId);

        // Get the file content as buffer
        const fileBuffer = await fileResponse.arrayBuffer();

        // Create response with file content
        const response = new NextResponse(fileBuffer);

        // Set appropriate headers
        response.headers.set('Content-Type', 'application/pdf');
        response.headers.set('Content-Disposition', `attachment; filename="${filename || 'download'}.pdf"`);
        response.headers.set('Cache-Control', 'no-cache');

        console.log(`✅ Server: Download completed for ${filename || 'file'}`);

        return response;

    } catch (error) {
        console.error('❌ Server: B2 download error:', error);

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                details: 'Failed to download file from B2'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({ message: 'B2 Download API - Use POST method' });
} 