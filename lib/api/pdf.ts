import { getApiUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "@/lib/api/user-service";
import { getAuthenticatedB2Url, isB2Url } from "@/lib/b2";

/**
 * PDF-related API functions
 */

// Create authenticated PDF URL for viewing/downloading
export const getAuthenticatedPdfUrl = async (
    pdfUrl: string
): Promise<string> => {
    try {
        // If the URL is already a blob or data URL, return as is
        if (pdfUrl.startsWith("blob:") || pdfUrl.startsWith("data:")) {
            return pdfUrl;
        }

        // If no PDF URL provided, return empty string
        if (!pdfUrl) {
            return "";
        }

        // Check if this is a B2 URL and handle authentication via server
        if (isB2Url(pdfUrl)) {
            // For B2 URLs, we'll need to create a blob URL via our server API
            // This is more complex for viewing, so for now return the original URL
            // TODO: Implement server-side PDF streaming for viewer
            console.warn(
                "B2 PDF viewing requires server-side streaming - using direct URL for now"
            );
            return pdfUrl;
        }

        // For non-B2 URLs, return the original URL for direct access
        return pdfUrl;
    } catch (error) {
        console.error("Error getting authenticated PDF URL:", error);
        // Fallback to original URL if authentication fails
        return pdfUrl;
    }
};

// Download PDF with authentication
export const downloadPdfWithAuth = async (
    pdfUrl: string,
    filename: string
): Promise<void> => {
    try {
        if (!pdfUrl) {
            throw new Error("No PDF URL provided");
        }

        // Check if this is a B2 URL and use server-side B2 authentication
        if (isB2Url(pdfUrl)) {
            const { downloadPdfViaServer } = await import("@/lib/b2");
            await downloadPdfViaServer(pdfUrl, filename);
            return;
        }

        // For non-B2 URLs, try direct download first
        const response = await fetch(pdfUrl);

        if (!response.ok) {
            // If direct download fails, try with auth headers
            const authResponse = await authenticatedFetch(pdfUrl);
            if (!authResponse.ok) {
                throw new Error(`Failed to download PDF: ${response.status}`);
            }

            const blob = await authResponse.blob();
            const url = window.URL.createObjectURL(blob);

            // Create temporary download link
            const link = document.createElement("a");
            link.href = url;
            link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Create temporary download link
        const link = document.createElement("a");
        link.href = url;
        link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading PDF:", error);
        throw new Error(
            "Failed to download PDF. The file might not be available or require authentication."
        );
    }
};

// Generate thumbnail from PDF first page
export const generatePdfThumbnail = async (
    pdfUrl: string
): Promise<string | null> => {
    try {
        if (!pdfUrl) {
            return null;
        }

        // For now, return null to use gradient fallbacks
        // since the backend thumbnail generation endpoint doesn't exist yet
        // TODO: Implement when backend endpoint is ready

        // Future implementation:
        // const authenticatedUrl = await getAuthenticatedPdfUrl(pdfUrl)
        // const response = await authenticatedFetch(getApiUrl('/api/v1/papers/pdf/thumbnail'), {
        //     method: 'POST',
        //     body: JSON.stringify({ pdfUrl: authenticatedUrl })
        // })

        // if (!response.ok) {
        //     return null
        // }

        // const result = await response.json()
        // return result.data?.thumbnailUrl || null

        return null; // Always use gradient thumbnails for now
    } catch (error) {
        console.error("Error generating PDF thumbnail:", error);
        return null; // Fallback to gradient thumbnail
    }
}; 