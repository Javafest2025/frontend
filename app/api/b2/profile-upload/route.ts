import { NextRequest, NextResponse } from 'next/server'

interface B2UploadResponse {
    fileId: string
    fileName: string
    contentLength: number
    contentSha1: string
    contentType: string
    contentMd5: string
    uploadTimestamp: number
    fileInfo: Record<string, string>
}

interface B2AuthResponse {
    accountId: string
    authorizationToken: string
    apiUrl: string
    downloadUrl: string
    recommendedPartSize: number
    absoluteMinimumPartSize: number
}

class B2ProfileUploader {
    private authToken: string | null = null
    private apiUrl: string | null = null
    private downloadUrl: string | null = null
    private bucketId: string

    constructor() {
        this.bucketId = process.env.B2_BUCKET_ID || ''
    }

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

    private async getUploadUrl(): Promise<{ uploadUrl: string; authorizationToken: string }> {
        await this.authenticate()

        const response = await fetch(`${this.apiUrl}/b2api/v2/b2_get_upload_url`, {
            method: 'POST',
            headers: {
                'Authorization': this.authToken!,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bucketId: this.bucketId
            })
        })

        if (!response.ok) {
            throw new Error(`Failed to get upload URL: ${response.status}`)
        }

        const data = await response.json()
        return {
            uploadUrl: data.uploadUrl,
            authorizationToken: data.authorizationToken
        }
    }

    async uploadProfileImage(fileBuffer: Buffer, fileName: string, contentType: string, userId: string): Promise<{ fileId: string; downloadUrl: string; fileName: string }> {
        const { uploadUrl, authorizationToken } = await this.getUploadUrl()

        // Generate a unique filename for profile images
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 15)
        const fileExtension = fileName.split('.').pop() || 'jpg'
        const uniqueFileName = `profiles/${userId}/${timestamp}-${randomId}.${fileExtension}`

        // Calculate SHA1 hash
        const crypto = require('crypto')
        const contentSha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex')

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': authorizationToken,
                'Content-Type': contentType,
                'Content-Length': fileBuffer.length.toString(),
                'X-Bz-File-Name': uniqueFileName,
                'X-Bz-Content-Sha1': contentSha1,
                'X-Bz-Info-Author': 'ScholarAI',
                'X-Bz-Info-Uploaded-By': 'ScholarAI-Web',
                'X-Bz-Info-User-Id': userId,
                'X-Bz-Info-File-Type': 'profile-image'
            },
            body: fileBuffer
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Upload failed: ${response.status} - ${errorText}`)
        }

        const uploadData: B2UploadResponse = await response.json()

        // Construct the download URL using file ID format for consistency
        const downloadUrl = `https://f003.backblazeb2.com/b2api/v3/b2_download_file_by_id?fileId=${uploadData.fileId}`

        return {
            fileId: uploadData.fileId,
            downloadUrl,
            fileName: uploadData.fileName
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('profileImage') as File
        const userId = formData.get('userId') as string

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        // Check if it's an image
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Only JPEG, PNG, and WebP images are allowed' },
                { status: 400 }
            )
        }

        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'Image size must be less than 5MB' },
                { status: 400 }
            )
        }

        // Convert file to buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer())

        // Upload to B2
        const b2Uploader = new B2ProfileUploader()
        const result = await b2Uploader.uploadProfileImage(fileBuffer, file.name, file.type, userId)

        return NextResponse.json({
            success: true,
            fileId: result.fileId,
            downloadUrl: result.downloadUrl,
            fileName: result.fileName
        })

    } catch (error) {
        console.error('B2 profile upload error:', error)
        return NextResponse.json(
            {
                error: 'Upload failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
} 