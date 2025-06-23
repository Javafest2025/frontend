import type { WebSearchRequest, WebSearchResponse } from '@/types/websearch';
import type { APIResponse } from '@/types/project';

// Environment-based API configuration
const getApiBaseUrl = (): string => {
    const env = process.env.NEXT_PUBLIC_ENV || process.env.ENV || 'dev';

    console.log('Current environment:', env);
    console.log('Available env vars:', {
        NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
        ENV: process.env.ENV,
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        NEXT_PUBLIC_DOCKER_BACKEND_URL: process.env.NEXT_PUBLIC_DOCKER_BACKEND_URL
    });

    switch (env.toLowerCase()) {
        case 'docker':
            // Use configurable Docker backend URL from environment
            const dockerUrl = process.env.NEXT_PUBLIC_DOCKER_BACKEND_URL || 'http://docker-core-app-1:8080';
            console.log('Using Docker API URL:', dockerUrl);
            return dockerUrl;
        case 'prod':
            const prodUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-production-api.com';
            console.log('Using Production API URL:', prodUrl);
            return prodUrl;
        case 'dev':
        default:
            const devUrl = process.env.NEXT_PUBLIC_DEV_API_URL || 'http://localhost:8080';
            console.log('Using Dev API URL:', devUrl);
            return devUrl;
    }
};

// Helper function to construct full API URLs
const getApiUrl = (endpoint: string): string => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${endpoint}`;
};

export const initiateGoogleLogin = async () => {
    // TODO: Implement Google OAuth login
    window.location.href = 'https://accounts.google.com/gsi/client'
}

export const initiateGithubLogin = () => {
    const githubClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/callback`;

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=read:user%20user:email`;
    window.location.href = githubAuthUrl;
};


// Authentication utility functions
export const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('scholarai_token')
    }
    return null
}

export const getUserData = (): any | null => {
    if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('scholarai_user')
        return userData ? JSON.parse(userData) : null
    }
    return null
}

export const clearAuthData = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('scholarai_token')
        localStorage.removeItem('scholarai_user')
        // Note: Refresh token is stored in HttpOnly cookies, managed by backend
    }
}

export const isAuthenticated = (): boolean => {
    return !!getAuthToken()
}


export const refreshAccessToken = async (): Promise<string | null> => {
    try {
        // Get user data to retrieve email for refresh request
        const userData = getUserData();
        if (!userData?.email) {
            console.warn('No user email found for refresh token request');
            clearAuthData();
            return null;
        }

        const response = await fetch(getApiUrl('/api/v1/auth/refresh'), {
            method: 'POST',
            credentials: 'include', // This sends the HttpOnly refresh token cookie
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userData.email
                // refreshToken omitted - backend should use HttpOnly cookie
            })
        });

        const data = await response.json();

        if (response.ok && data.data?.accessToken) {
            localStorage.setItem('scholarai_token', data.data.accessToken);
            console.log('✅ Access token refreshed successfully');
            return data.data.accessToken;
        } else {
            console.warn('Refresh token invalid or expired:', data.message || 'Unknown error');
            clearAuthData();
            return null;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
        clearAuthData();
        return null;
    }
};


// API request helper with authentication
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    let token = getAuthToken()
    let headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    }

    const response = await fetch(url, {
        ...options,
        headers
    })

    if (response.status === 401) {

        console.log('Access token expired, refreshing...');
        // Try to refresh token
        const newAccessToken = await refreshAccessToken()
        if (newAccessToken) {
            const retryHeaders = {
                ...headers,
                'Authorization': `Bearer ${newAccessToken}`
            }

            return fetch(url, {
                ...options,
                headers: retryHeaders
            })
        }
    }

    return response;

}


export const login = async (formData: { email: string; password: string; rememberMe: boolean }) => {
    try {
        if (!formData.email || !formData.password) {
            throw new Error('Email and password are required')
        }

        const response = await fetch(getApiUrl('/api/v1/auth/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: formData.email.trim(),
                password: formData.password.trim()
            }),
            credentials: 'include' //allows storing refresh token in cookies
        })

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        let data;
        if (isJson) {
            data = await response.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await response.text();
            data = { message: text || 'Server error' };
        }

        if (!response.ok) {
            // Handle specific HTTP status codes
            if (response.status === 500) {
                throw new Error('Internal server error. Please try again later.');
            } else if (response.status === 401) {
                throw new Error(data.message || 'Invalid email or password');
            } else if (response.status === 400) {
                throw new Error(data.message || 'Invalid request data');
            } else {
                throw new Error(data.message || `Login failed (${response.status})`);
            }
        }
        else {
            console.log("response:", data);
        }

        const token = data.data?.accessToken;
        const user = {
            id: data.data?.userId,
            email: data.data?.email,
            roles: data.data?.roles
        }

        if (!token) {
            throw new Error('No access token received')
        }

        return {
            success: true,
            token: token,
            user: user,
            message: data.message
        }
    } catch (error) {
        console.error('Login API error:', error)

        if (error instanceof TypeError && error.message.includes('fetch')) {
            return {
                success: false,
                message: 'Cannot connect to server. Please check if the backend is running.'
            }
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Network error occurred'
        }
    }
}


export const signup = async (formData: { email: string; password: string; confirmPassword: string; agreeToTerms: boolean }) => {
    try {
        const response = await fetch(getApiUrl('/api/v1/auth/register'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: formData.email,
                password: formData.password
            })

        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        let data;
        if (isJson) {
            data = await response.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await response.text();
            data = { message: text || 'Server error' };
        }

        if (!response.ok) {
            // Handle specific HTTP status codes
            if (response.status === 500) {
                throw new Error('Internal server error. Please try again later.');
            } else if (response.status === 400) {
                throw new Error(data.message || 'Invalid request data');
            } else if (response.status === 409) {
                throw new Error(data.message || 'Email already exists');
            } else {
                throw new Error(data.message || `Registration failed (${response.status})`);
            }
        }

        return {
            success: true,
            message: data.message || 'Registration successful'
        };
    } catch (error) {
        console.error('Signup API error:', error);

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return {
                success: false,
                message: 'Cannot connect to server. Please check your internet connection.'
            };
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Network error occurred'
        };
    }
};



export const logout = async () => {
    try {
        await fetch(getApiUrl('/api/v1/auth/logout'), {
            method: 'POST',
            credentials: 'include' // include the refresh token cookie
        })
    } catch (error) {
        console.error('Logout API error:', error)
    } finally {
        clearAuthData()
        if (typeof window !== 'undefined') {
            window.location.href = '/login'
        }
    }
}

export const sendResetCode = async (email: string) => {
    const res = await fetch(getApiUrl("/api/v1/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }),
    })

    if (!res.ok) {
        // Check if response is JSON
        const contentType = res.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        let data;
        if (isJson) {
            data = await res.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await res.text();
            data = { message: text || 'Server error' };
        }

        throw new Error(data.message || "Error sending code")
    }
}

export const submitNewPassword = async (email: string, code: string, newPassword: string) => {
    const res = await fetch(getApiUrl("/api/v1/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email, code, newPassword }),
    })

    if (!res.ok) {
        // Check if response is JSON
        const contentType = res.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        let data;
        if (isJson) {
            data = await res.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await res.text();
            data = { message: text || 'Server error' };
        }

        throw new Error(data.message || "Error resetting password")
    }
}

export interface SocialLoginResponse {
    success: boolean;
    message: string;
    token?: string; // Corresponds to accessToken
    refreshToken?: string; // Optional: if backend sends it in body
    user?: {
        id: string;
        email: string;
        roles: string[];
    };
}

export const handleGoogleSocialLogin = async (idToken: string): Promise<SocialLoginResponse> => {
    try {
        const response = await fetch(getApiUrl('/api/v1/auth/social/google-login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ idToken })
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        let data;
        if (isJson) {
            data = await response.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await response.text();
            data = { message: text || 'Server error' };
        }

        if (!response.ok) {
            // Handle specific HTTP status codes
            if (response.status === 500) {
                throw new Error('Internal server error. Please try again later.');
            } else if (response.status === 401) {
                throw new Error(data.message || 'Social login authentication failed');
            } else if (response.status === 400) {
                throw new Error(data.message || 'Invalid social login data');
            } else {
                throw new Error(data.message || 'Social login failed');
            }
        }

        const accessToken = data.data?.accessToken;
        const refreshToken = data.data?.refreshToken; // Assuming backend might send this
        const user = {
            id: data.data?.userId,
            email: data.data?.email,
            roles: data.data?.roles
        };

        if (!accessToken) {
            throw new Error('No access token received from social login');
        }

        // Store access token
        localStorage.setItem('scholarai_token', accessToken);

        // Store user data
        if (user && user.id) {
            localStorage.setItem('scholarai_user', JSON.stringify(user));
        }

        // Note: Refresh token is now handled via HttpOnly cookies by the backend
        // No need to store refresh token in localStorage for security reasons


        return {
            success: true,
            token: accessToken,
            user: user,
            message: data.message || 'Social login successful'
        };

    } catch (error) {
        console.error('Social Login API error:', error);
        // Clear any partial auth data if login failed
        clearAuthData();
        // Note: Refresh token is handled via HttpOnly cookies, cleared automatically on logout

        if (error instanceof TypeError && error.message.includes('fetch')) {
            return {
                success: false,
                message: 'Cannot connect to server. Please check if the backend is running.'
            };
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Network error occurred during social login'
        };
    }
};

export const handleGitHubAuthCallback = async (code: string): Promise<SocialLoginResponse> => {
    try {
        const response = await fetch(getApiUrl('/api/v1/auth/social/github-login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        let data;
        if (isJson) {
            data = await response.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await response.text();
            data = { message: text || 'Server error' };
        }

        if (!response.ok) {
            // Handle specific HTTP status codes
            if (response.status === 500) {
                throw new Error('Internal server error. Please try again later.');
            } else if (response.status === 401) {
                throw new Error(data.message || 'GitHub authentication failed');
            } else if (response.status === 400) {
                throw new Error(data.message || 'Invalid GitHub callback data');
            } else {
                throw new Error(data.message || 'GitHub callback failed at backend');
            }
        }

        const accessToken = data.data?.accessToken;
        const refreshToken = data.data?.refreshToken;
        const user = {
            id: data.data?.userId,
            email: data.data?.email,
            roles: data.data?.roles
        };

        if (!accessToken) {
            throw new Error('No access token received from GitHub login');
        }

        // Store access token
        localStorage.setItem('scholarai_token', accessToken);

        // Store user data
        if (user && user.id) {
            localStorage.setItem('scholarai_user', JSON.stringify(user));
        }

        // Note: Refresh token is handled via HttpOnly cookies by the backend
        // No need to store refresh token in localStorage for security reasons

        return {
            success: true,
            token: accessToken,
            user: user,
            message: data.message || 'GitHub login successful'
            // refreshToken field is part of SocialLoginResponse but Spring backend sets it as HttpOnly cookie
        };

    } catch (error) {
        console.error('GitHub Auth Callback API error:', error);
        clearAuthData();
        // Note: Refresh token is handled via HttpOnly cookies, cleared automatically on logout

        if (error instanceof TypeError && error.message.includes('fetch')) {
            return {
                success: false,
                message: 'Cannot connect to server. Please check if the backend is running.'
            };
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Network error occurred during GitHub callback'
        };
    }
};

/**
 * Web Search API Functions
 */

export const initiateWebSearch = async (searchRequest: WebSearchRequest): Promise<{ correlationId: string }> => {
    try {
        const response = await authenticatedFetch(getApiUrl('/api/v1/websearch'), {
            method: 'POST',
            body: JSON.stringify(searchRequest)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to initiate web search');
        }

        const result: APIResponse<WebSearchResponse> = await response.json();
        return { correlationId: result.data.correlationId };
    } catch (error) {
        console.error('Web search initiation error:', error);
        throw error instanceof Error ? error : new Error('Failed to initiate web search');
    }
};

export const pollSearchResults = async (correlationId: string): Promise<WebSearchResponse> => {
    try {
        const response = await authenticatedFetch(getApiUrl(`/api/v1/websearch/${correlationId}`));

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to get search results');
        }

        const result: APIResponse<WebSearchResponse> = await response.json();
        return result.data;
    } catch (error) {
        console.error('Search results polling error:', error);
        throw error instanceof Error ? error : new Error('Failed to get search results');
    }
};

export const pollUntilComplete = async (
    correlationId: string,
    maxAttempts: number = 30,
    onProgress?: (attempt: number, status: string) => void
): Promise<WebSearchResponse> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const result = await pollSearchResults(correlationId);

        onProgress?.(attempt, result.status);

        if (result.status === 'COMPLETED') {
            return result;
        } else if (result.status === 'FAILED') {
            throw new Error(`Search failed: ${result.message}`);
        }

        // Wait before next poll (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * attempt, 10000)));
    }

    throw new Error('Search timeout - taking too long');
};

export const getAllSearchHistory = async (): Promise<WebSearchResponse[]> => {
    try {
        const response = await authenticatedFetch(getApiUrl('/api/v1/websearch'));

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to get search history');
        }

        const result: APIResponse<WebSearchResponse[]> = await response.json();
        return result.data;
    } catch (error) {
        console.error('Search history error:', error);
        throw error instanceof Error ? error : new Error('Failed to get search history');
    }
};

export const checkWebSearchHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(getApiUrl('/api/v1/websearch/health'));
        const result = await response.json();
        return result.data?.status === 'UP';
    } catch (error) {
        console.error('Web search health check error:', error);
        return false;
    }
};

/**
 * Library API Functions
 */

export interface LibraryStats {
    projectId: string;
    correlationIds: string[];
    totalPapers: number;
    completedSearchOperations: number;
    retrievedAt: string;
    message: string;
}

export interface LibraryResponse {
    timestamp: string;
    status: number;
    message: string;
    data: LibraryStats & {
        papers: any[]; // Empty array for /stats endpoint
    };
}

export const getProjectLibrary = async (projectId: string): Promise<LibraryResponse> => {
    try {
        const response = await authenticatedFetch(getApiUrl(`/api/v1/library/project/${projectId}`))

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        const data: LibraryResponse = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching project library:', error)
        throw error
    }
}

export const getProjectLibraryStats = async (projectId: string): Promise<LibraryResponse> => {
    try {
        const response = await authenticatedFetch(getApiUrl(`/api/v1/library/project/${projectId}/stats`))

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        const data: LibraryResponse = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching project library stats:', error)
        throw error
    }
}

/**
 * PDF-related API functions
 */

import { getAuthenticatedB2Url, isB2Url } from './b2'

// Create authenticated PDF URL for viewing/downloading
export const getAuthenticatedPdfUrl = async (pdfUrl: string): Promise<string> => {
    try {
        // If the URL is already a blob or data URL, return as is
        if (pdfUrl.startsWith('blob:') || pdfUrl.startsWith('data:')) {
            return pdfUrl
        }

        // If no PDF URL provided, return empty string
        if (!pdfUrl) {
            return ''
        }

        // Check if this is a B2 URL and handle authentication via server
        if (isB2Url(pdfUrl)) {
            // For B2 URLs, we'll need to create a blob URL via our server API
            // This is more complex for viewing, so for now return the original URL
            // TODO: Implement server-side PDF streaming for viewer
            console.warn('B2 PDF viewing requires server-side streaming - using direct URL for now')
            return pdfUrl
        }

        // For non-B2 URLs, return the original URL for direct access
        return pdfUrl
    } catch (error) {
        console.error('Error getting authenticated PDF URL:', error)
        // Fallback to original URL if authentication fails
        return pdfUrl
    }
}

// Download PDF with authentication
export const downloadPdfWithAuth = async (pdfUrl: string, filename: string): Promise<void> => {
    try {
        if (!pdfUrl) {
            throw new Error('No PDF URL provided')
        }

        // Check if this is a B2 URL and use server-side B2 authentication
        if (isB2Url(pdfUrl)) {
            const { downloadPdfViaServer } = await import('./b2')
            await downloadPdfViaServer(pdfUrl, filename)
            return
        }

        // For non-B2 URLs, try direct download first
        const response = await fetch(pdfUrl)

        if (!response.ok) {
            // If direct download fails, try with auth headers
            const authResponse = await authenticatedFetch(pdfUrl)
            if (!authResponse.ok) {
                throw new Error(`Failed to download PDF: ${response.status}`)
            }

            const blob = await authResponse.blob()
            const url = window.URL.createObjectURL(blob)

            // Create temporary download link
            const link = document.createElement('a')
            link.href = url
            link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
            document.body.appendChild(link)
            link.click()

            // Cleanup
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            return
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)

        // Create temporary download link
        const link = document.createElement('a')
        link.href = url
        link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
        document.body.appendChild(link)
        link.click()

        // Cleanup
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    } catch (error) {
        console.error('Error downloading PDF:', error)
        throw new Error('Failed to download PDF. The file might not be available or require authentication.')
    }
}

// Generate thumbnail from PDF first page
export const generatePdfThumbnail = async (pdfUrl: string): Promise<string | null> => {
    try {
        if (!pdfUrl) {
            return null
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

        return null // Always use gradient thumbnails for now
    } catch (error) {
        console.error('Error generating PDF thumbnail:', error)
        return null // Fallback to gradient thumbnail
    }
}


