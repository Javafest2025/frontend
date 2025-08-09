/**
 * Backblaze B2 Cloud Storage Authentication and Download
 * Based on B2 API v2 for authentication and file downloads
 */

interface B2AuthConfig {
    authToken: string;
    apiUrl: string;
    downloadUrl: string;
}

interface B2Credentials {
    keyId: string;
    applicationKey: string;
}

/**
 * Download PDF using server-side B2 authentication
 * This method uses our secure API endpoint to handle B2 credentials server-side
 */
export const downloadPdfViaServer = async (pdfUrl: string, filename: string): Promise<void> => {
    try {
        console.log('🔽 Starting server-side B2 download for:', filename);
        console.log('🔗 PDF URL:', pdfUrl);

        // Extract file ID from the URL if it's a B2 URL
        let fileId: string;
        try {
            fileId = extractFileIdFromUrl(pdfUrl);
        } catch (error) {
            console.error('Failed to extract file ID from URL:', error);
            throw new Error('Invalid B2 URL format');
        }

        // Make GET request with fileId as query parameter
        const response = await fetch(`/api/b2/download?fileId=${encodeURIComponent(fileId)}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        // Get the PDF content as blob
        const blob = await response.blob();

        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        console.log('✅ Server-side download completed:', filename);
    } catch (error) {
        console.error('❌ Server-side download error:', error);
        throw error;
    }
};

/**
 * Legacy function - now redirects to server-side implementation
 * @deprecated Use downloadPdfViaServer instead
 */
export const authorizeB2Account = async (): Promise<B2AuthConfig> => {
    throw new Error('Client-side B2 authentication is deprecated. Use server-side API instead.');
};

/**
 * Extract file ID from B2 download URL
 * Expected format: https://f003.backblazeb2.com/b2api/v3/b2_download_file_by_id?fileId=...
 */
export const extractFileIdFromUrl = (url: string): string => {
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
};

/**
 * Download file from B2 using file ID
 * Similar to the Python script's download_file_by_id function
 */
export const downloadB2FileById = async (
    authConfig: B2AuthConfig,
    fileId: string,
    filename: string
): Promise<void> => {
    try {
        const url = `${authConfig.apiUrl}/b2api/v2/b2_download_file_by_id`;

        console.log(`⬇️ Downloading file ID: ${fileId}`);

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

        // Convert response to blob
        const blob = await response.blob();

        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        console.log(`✅ Download complete: ${filename}`);
    } catch (error) {
        console.error('Error downloading B2 file:', error);
        throw error;
    }
};

/**
 * Complete B2 download workflow using secure server-side authentication
 * This is the main function to use for downloading PDFs from B2
 */
export const downloadPdfFromB2 = async (pdfUrl: string, filename: string): Promise<void> => {
    try {
        // Check if this is a B2 URL
        if (!pdfUrl.includes('backblazeb2.com') && !pdfUrl.includes('b2_download_file_by_id')) {
            throw new Error('Not a valid B2 download URL');
        }

        // Use server-side authentication for security
        await downloadPdfViaServer(pdfUrl, filename);

    } catch (error) {
        console.error('Error in B2 download workflow:', error);
        throw error;
    }
};

/**
 * Get authenticated B2 file URL for viewing (without downloading)
 * This creates a temporary authenticated URL that can be used in iframe/embed
 */
export const getAuthenticatedB2Url = async (pdfUrl: string): Promise<string> => {
    try {
        // Check if this is a B2 URL
        if (!pdfUrl.includes('backblazeb2.com') && !pdfUrl.includes('b2_download_file_by_id')) {
            // If not a B2 URL, return as is
            return pdfUrl;
        }

        // Extract file ID from URL
        const fileId = extractFileIdFromUrl(pdfUrl);

        // Authorize with B2
        const authConfig = await authorizeB2Account();

        // For viewing, we can use the direct download API to get the file content
        // and create a blob URL for the PDF viewer
        const downloadUrl = `${authConfig.apiUrl}/b2api/v2/b2_download_file_by_id`;

        const response = await fetch(downloadUrl, {
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
            throw new Error(`Failed to get authenticated file: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        return blobUrl;

    } catch (error) {
        console.error('Error getting authenticated B2 URL:', error);
        // Fallback to original URL if authentication fails
        return pdfUrl;
    }
};

/**
 * Check if a URL is a B2 download URL
 */
export const isB2Url = (url: string): boolean => {
    return url.includes('backblazeb2.com') && url.includes('b2_download_file_by_id');
};

export default {
    authorizeB2Account,
    extractFileIdFromUrl,
    downloadB2FileById,
    downloadPdfFromB2,
    getAuthenticatedB2Url,
    isB2Url
}; 