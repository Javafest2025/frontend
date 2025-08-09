import { getMicroserviceUrl } from "@/lib/config/api-config";

// JWT validation utility function
const isValidJWT = (token: string): boolean => {
    if (!token || typeof token !== 'string') {
        return false;
    }

    // Check if token has the correct JWT format (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
        return false;
    }

    // Check if each part is base64 encoded (basic validation)
    try {
        // Try to decode the header and payload to see if they're valid base64
        atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        return true;
    } catch (error) {
        return false;
    }
};

// Authentication utility functions
export const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("scholarai_token");
        if (token && isValidJWT(token)) {
            return token;
        } else if (token) {
            console.warn("⚠️ Invalid JWT token format found in localStorage, clearing it");
            localStorage.removeItem("scholarai_token");
            return null;
        }
        return null;
    }
    return null;
};

export const getUserData = (): any | null => {
    if (typeof window !== "undefined") {
        const userData = localStorage.getItem("scholarai_user");
        return userData ? JSON.parse(userData) : null;
    }
    return null;
};

export const clearAuthData = (): void => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("scholarai_token");
        localStorage.removeItem("scholarai_user");
        localStorage.removeItem("scholarai_refresh_token");
        // Note: Refresh token is also stored in HttpOnly cookies, managed by backend
    }
};

export const isAuthenticated = (): boolean => {
    return !!getAuthToken();
};

export const refreshAccessToken = async (): Promise<string | null> => {
    try {
        console.log("🔄 Attempting to refresh token...");

        // Try to get refresh token from localStorage first
        let refreshToken = null;
        if (typeof window !== "undefined") {
            refreshToken = localStorage.getItem("scholarai_refresh_token");
        }

        // Prepare request body if refresh token is available
        let requestBody = null;
        if (refreshToken) {
            console.log("📝 Found refresh token in localStorage, sending in request body");
            requestBody = JSON.stringify({
                refreshToken: refreshToken
            });
        } else {
            console.log("🍪 No refresh token in localStorage, will use HttpOnly cookie");
        }

        const response = await fetch(getMicroserviceUrl("user-service", "/api/v1/auth/refresh"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: 'include', // Include cookies for refresh token
            body: requestBody, // Send refresh token in body if available, otherwise null
        });

        console.log("📊 Refresh response status:", response.status, response.statusText);

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        let data;
        if (isJson) {
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error("❌ Failed to parse JSON response:", jsonError);
                data = { message: "Invalid JSON response from server" };
            }
        } else {
            // If it's not JSON, get the text content
            const text = await response.text();
            data = { message: text || "Server error" };
        }

        console.log("📋 Refresh response data:", data);

        if (response.ok && data.data?.accessToken) {
            const newToken = data.data.accessToken;

            // Validate the new token format
            if (!isValidJWT(newToken)) {
                console.error("❌ Invalid JWT format received from refresh endpoint");
                clearAuthData();
                return null;
            }

            localStorage.setItem("scholarai_token", newToken);

            // If the response includes a new refresh token, store it
            if (data.data?.refreshToken) {
                localStorage.setItem("scholarai_refresh_token", data.data.refreshToken);
                console.log("💾 Stored new refresh token in localStorage");
            }

            // Store user data if it's included in the response
            if (data.data?.email || data.data?.userId || data.data?.role) {
                const userData = {
                    id: data.data?.userId || data.data?.id,
                    email: data.data?.email,
                    roles: data.data?.role ? [data.data.role] : data.data?.roles || [],
                };
                localStorage.setItem("scholarai_user", JSON.stringify(userData));
                console.log("💾 Stored user data in localStorage:", userData);
            }

            console.log("✅ Access token refreshed successfully");
            return newToken;
        } else {
            console.warn(
                "⚠️ Refresh token invalid or expired:",
                data.message || "Unknown error"
            );
            // Only clear auth data if the refresh token is actually invalid
            if (response.status === 401 || response.status === 403) {
                console.log("🔄 Clearing auth data due to invalid refresh token");
                clearAuthData();
            }
            return null;
        }
    } catch (error) {
        console.error("❌ Token refresh failed:", error);
        // Don't clear auth data on network errors - only on actual auth failures
        return null;
    }
};

// API request helper with authentication
export const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
) => {
    let token = getAuthToken();

    // Debug logging for token
    if (token) {
        console.log("🔑 Valid JWT token found:", token.substring(0, 20) + "...");
    } else {
        console.warn("⚠️ No valid token found in localStorage");
    }

    let headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    console.log("🌐 Making authenticated request to:", url);
    console.log("📋 Request headers:", headers);

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies in the request
    });

    console.log("📊 Response status:", response.status, response.statusText);

    if (response.status === 401) {
        console.log("🔄 Access token expired, attempting to refresh...");
        // Try to refresh token
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
            console.log("✅ Token refreshed successfully, retrying request");
            const retryHeaders = {
                ...headers,
                Authorization: `Bearer ${newAccessToken}`,
            };

            const retryResponse = await fetch(url, {
                ...options,
                headers: retryHeaders,
                credentials: 'include', // Include cookies in the request
            });

            console.log("📊 Retry response status:", retryResponse.status, retryResponse.statusText);
            return retryResponse;
        } else {
            console.error("❌ Failed to refresh token, clearing auth data");
            clearAuthData();
            // Return the original response so the calling code can handle it
            return response;
        }
    }

    return response;
};

export const login = async (formData: {
    email: string;
    password: string;
    rememberMe: boolean;
}): Promise<{ success: boolean; message: string; token?: string; user?: any; requiresEmailVerification?: boolean; email?: string }> => {
    try {
        if (!formData.email || !formData.password) {
            throw new Error("Email and password are required");
        }

        // First, check if the user's email is confirmed
        try {
            console.log("Checking email status for:", formData.email.trim());
            const emailStatusResponse = await checkEmailStatus(formData.email.trim());
            console.log("Email status response:", emailStatusResponse);
            const emailStatus = emailStatusResponse.data;
            console.log("Email status data:", emailStatus);

            if (emailStatus.userExists && !emailStatus.emailConfirmed) {
                console.log("Email not confirmed, redirecting to verification");
                // User exists but email is not confirmed
                return {
                    success: false,
                    message: "Please verify your email before logging in.",
                    requiresEmailVerification: true,
                    email: formData.email.trim(),
                };
            } else {
                console.log("Email status check passed, proceeding with login");
            }
        } catch (emailStatusError) {
            console.warn("Failed to check email status:", emailStatusError);
            // Continue with login attempt even if email status check fails
        }

        const loginUrl = getMicroserviceUrl("user-service", "/api/v1/auth/login");
        console.log("Login URL:", loginUrl);

        const response = await fetch(loginUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                email: formData.email.trim(),
                password: formData.password.trim(),
            }),
            credentials: 'include', // Include cookies in the request
        });

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        let data;
        if (isJson) {
            data = await response.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await response.text();
            data = { message: text || "Server error" };
        }

        if (!response.ok) {
            // Handle specific HTTP status codes
            if (response.status === 500) {
                throw new Error("Internal server error. Please try again later.");
            } else if (response.status === 401) {
                throw new Error(data.message || "Invalid email or password");
            } else if (response.status === 400) {
                throw new Error(data.message || "Invalid request data");
            } else {
                throw new Error(data.message || `Login failed (${response.status})`);
            }
        } else {
            console.log("Login response:", data);
            console.log("Response data structure:", {
                hasData: !!data.data,
                accessToken: !!data.data?.accessToken,
                userId: !!data.data?.userId,
                email: data.data?.email,
                role: data.data?.role
            });
        }

        const token = data.data?.accessToken;
        const refreshToken = data.data?.refreshToken; // Check if refresh token is in response
        const user = {
            id: data.data?.userId,
            email: data.data?.email,
            roles: data.data?.role ? [data.data.role] : [],
        };

        if (!token) {
            throw new Error("No access token received");
        }

        // Validate the token format before returning
        if (!isValidJWT(token)) {
            throw new Error("Invalid JWT token format received from server");
        }

        // Store refresh token in localStorage if received
        if (refreshToken && typeof window !== "undefined") {
            localStorage.setItem("scholarai_refresh_token", refreshToken);
            console.log("💾 Stored refresh token in localStorage");
        }

        return {
            success: true,
            token: token,
            user: user,
            message: data.message,
        };
    } catch (error) {
        console.error("Login API error:", error);
        console.error("Error type:", typeof error);
        console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");

        if (error instanceof TypeError && error.message.includes("fetch")) {
            console.error("Network fetch error detected");
            return {
                success: false,
                message:
                    "Cannot connect to server. Please check if the backend is running.",
            };
        }

        return {
            success: false,
            message:
                error instanceof Error ? error.message : "Network error occurred",
        };
    }
};

export const signup = async (formData: {
    email: string;
    password: string;
    confirmPassword: string;
    agreeToTerms: boolean;
}): Promise<{ success: boolean; message: string; requiresVerification?: boolean }> => {
    try {
        console.log("Making registration request to:", getMicroserviceUrl("user-service", "/api/v1/auth/register"));
        const response = await fetch(getMicroserviceUrl("user-service", "/api/v1/auth/register"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                email: formData.email,
                password: formData.password,
            }),
            credentials: 'include', // Include cookies in the request
        });

        console.log("Response received:", response);
        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        console.log("Response content-type:", contentType);
        const isJson = contentType && contentType.includes("application/json");
        console.log("Is JSON response:", isJson);

        let data;
        if (isJson) {
            data = await response.json();
            console.log("Parsed JSON data:", data);
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await response.text();
            console.log("Response text:", text);
            data = { message: text || "Server error" };
        }

        if (!response.ok) {
            // Handle specific HTTP status codes
            if (response.status === 500) {
                throw new Error("Internal server error. Please try again later.");
            } else if (response.status === 400) {
                throw new Error(data.message || "Invalid request data");
            } else if (response.status === 409) {
                throw new Error(data.message || "Email already exists");
            } else {
                throw new Error(
                    data.message || `Registration failed (${response.status})`
                );
            }
        }

        // Verification email is automatically sent by the backend during registration

        return {
            success: true,
            message: data.message || "Registration successful. Please check your email for verification.",
            requiresVerification: true,
        };
    } catch (error) {
        console.error("Signup API error:", error);
        console.error("Error type:", typeof error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }

        // Handle network errors
        if (error instanceof TypeError && error.message.includes("fetch")) {
            console.error("Network error detected");
            return {
                success: false,
                message:
                    "Cannot connect to server. Please check your internet connection.",
            };
        }

        return {
            success: false,
            message:
                error instanceof Error ? error.message : "Network error occurred",
        };
    }
};

export const logout = async () => {
    try {
        await fetch(getMicroserviceUrl("user-service", "/api/v1/auth/logout"), {
            method: "POST",
            credentials: 'include', // Include cookies in the request
        });
    } catch (error) {
        console.error("Logout API error:", error);
    } finally {
        clearAuthData();
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    }
};

export const sendResetCode = async (email: string) => {
    const res = await fetch(getMicroserviceUrl("user-service", "/api/v1/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }),
        credentials: 'include', // Include cookies in the request
    });

    if (!res.ok) {
        // Check if response is JSON
        const contentType = res.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        let data;
        if (isJson) {
            data = await res.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await res.text();
            data = { message: text || "Server error" };
        }

        throw new Error(data.message || "Error sending code");
    }
};

export const submitNewPassword = async (
    email: string,
    code: string,
    newPassword: string
) => {
    const res = await fetch(getMicroserviceUrl("user-service", "/api/v1/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email, code, newPassword }),
        credentials: 'include', // Include cookies in the request
    });

    if (!res.ok) {
        // Check if response is JSON
        const contentType = res.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        let data;
        if (isJson) {
            data = await res.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await res.text();
            data = { message: text || "Server error" };
        }

        throw new Error(data.message || "Error resetting password");
    }
};

// Email verification functions for signup flow
export const sendEmailVerificationCode = async (email: string) => {
    const res = await fetch(getMicroserviceUrl("user-service", "/api/v1/auth/resend-email-verification"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: 'include', // Include cookies in the request
    });

    if (!res.ok) {
        // Check if response is JSON
        const contentType = res.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        let data;
        if (isJson) {
            data = await res.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await res.text();
            data = { message: text || "Server error" };
        }

        throw new Error(data.message || "Error sending verification code");
    }
};

export const verifyEmailWithCode = async (email: string, code: string) => {
    const res = await fetch(getMicroserviceUrl("user-service", "/api/v1/auth/confirm-email"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify({
            email: email,
            otp: code
        }),
        credentials: 'include', // Include cookies in the request
    });

    if (!res.ok) {
        // Check if response is JSON
        const contentType = res.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        let data;
        if (isJson) {
            data = await res.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await res.text();
            data = { message: text || "Server error" };
        }

        throw new Error(data.message || "Error verifying email");
    }

    return res.json();
};

// Check email confirmation status
export const checkEmailStatus = async (email: string) => {
    const res = await fetch(getMicroserviceUrl("user-service", `/api/v1/auth/check-email-status?email=${encodeURIComponent(email)}`), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Include cookies in the request
    });

    if (!res.ok) {
        // Check if response is JSON
        const contentType = res.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        let data;
        if (isJson) {
            data = await res.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await res.text();
            data = { message: text || "Server error" };
        }

        throw new Error(data.message || "Error checking email status");
    }

    return res.json();
};

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

export const initiateGoogleLogin = async () => {
    // TODO: Implement Google OAuth login
    window.location.href = "https://accounts.google.com/gsi/client";
};

export const initiateGithubLogin = () => {
    const githubClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/callback`;

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=read:user%20user:email`;
    window.location.href = githubAuthUrl;
};

export const handleGoogleSocialLogin = async (
    idToken: string
): Promise<SocialLoginResponse> => {
    try {
        const response = await fetch(
            getMicroserviceUrl("user-service", "/api/v1/auth/social/google-login"),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ idToken }),
                credentials: 'include', // Include cookies in the request
            }
        );

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        let data;
        if (isJson) {
            data = await response.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await response.text();
            data = { message: text || "Server error" };
        }

        if (!response.ok) {
            // Handle specific HTTP status codes
            if (response.status === 500) {
                throw new Error("Internal server error. Please try again later.");
            } else if (response.status === 401) {
                throw new Error(data.message || "Social login authentication failed");
            } else if (response.status === 400) {
                throw new Error(data.message || "Invalid social login data");
            } else {
                throw new Error(data.message || "Social login failed");
            }
        }

        const accessToken = data.data?.accessToken;
        const refreshToken = data.data?.refreshToken; // Assuming backend might send this
        const user = {
            id: data.data?.userId,
            email: data.data?.email,
            roles: data.data?.roles,
        };

        if (!accessToken) {
            throw new Error("No access token received from social login");
        }

        // Validate the token format before storing
        if (!isValidJWT(accessToken)) {
            throw new Error("Invalid JWT token format received from social login");
        }

        // Store access token
        localStorage.setItem("scholarai_token", accessToken);

        // Store user data
        if (user && user.id) {
            localStorage.setItem("scholarai_user", JSON.stringify(user));
        }

        // Note: Refresh token is handled via HttpOnly cookies by the backend
        console.log("Google Social Login: Checking for refresh token cookie after login");

        // Check if refresh token cookie was set
        const refreshTokenCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('refreshToken='));

        if (refreshTokenCookie) {
            console.log("Google Social Login: Refresh token cookie found");
        } else {
            console.log("Google Social Login: No refresh token cookie found - this might cause middleware issues");
        }

        return {
            success: true,
            token: accessToken,
            user: user,
            message: data.message || "Social login successful",
        };
    } catch (error) {
        console.error("Social Login API error:", error);
        // Clear any partial auth data if login failed
        clearAuthData();
        // Note: Refresh token is handled via HttpOnly cookies, cleared automatically on logout

        if (error instanceof TypeError && error.message.includes("fetch")) {
            return {
                success: false,
                message:
                    "Cannot connect to server. Please check if the backend is running.",
            };
        }

        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Network error occurred during social login",
        };
    }
};

export const handleGitHubAuthCallback = async (
    code: string
): Promise<SocialLoginResponse> => {
    try {
        const response = await fetch(
            getMicroserviceUrl("user-service", "/api/v1/auth/social/github-login"),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ code }),
                credentials: 'include', // Include cookies in the request
            }
        );

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        let data;
        if (isJson) {
            data = await response.json();
        } else {
            // If it's not JSON, get the text content (likely an error page)
            const text = await response.text();
            data = { message: text || "Server error" };
        }

        if (!response.ok) {
            // Handle specific HTTP status codes
            if (response.status === 500) {
                throw new Error("Internal server error. Please try again later.");
            } else if (response.status === 401) {
                throw new Error(data.message || "GitHub authentication failed");
            } else if (response.status === 400) {
                throw new Error(data.message || "Invalid GitHub callback data");
            } else {
                throw new Error(data.message || "GitHub callback failed at backend");
            }
        }

        const accessToken = data.data?.accessToken;
        const refreshToken = data.data?.refreshToken;
        const user = {
            id: data.data?.userId,
            email: data.data?.email,
            roles: data.data?.roles,
        };

        if (!accessToken) {
            throw new Error("No access token received from GitHub login");
        }

        // Validate the token format before storing
        if (!isValidJWT(accessToken)) {
            throw new Error("Invalid JWT token format received from GitHub login");
        }

        // Store access token
        localStorage.setItem("scholarai_token", accessToken);

        // Store user data
        if (user && user.id) {
            localStorage.setItem("scholarai_user", JSON.stringify(user));
        }

        // Note: Refresh token is handled via HttpOnly cookies by the backend
        console.log("GitHub Social Login: Checking for refresh token cookie after login");

        // Check if refresh token cookie was set
        const refreshTokenCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('refreshToken='));

        if (refreshTokenCookie) {
            console.log("GitHub Social Login: Refresh token cookie found");
        } else {
            console.log("GitHub Social Login: No refresh token cookie found - this might cause middleware issues");
        }

        return {
            success: true,
            token: accessToken,
            user: user,
            message: data.message || "GitHub login successful",
            // refreshToken field is part of SocialLoginResponse but Spring backend sets it as HttpOnly cookie
        };
    } catch (error) {
        console.error("GitHub Auth Callback API error:", error);
        clearAuthData();
        // Note: Refresh token is handled via HttpOnly cookies, cleared automatically on logout

        if (error instanceof TypeError && error.message.includes("fetch")) {
            return {
                success: false,
                message:
                    "Cannot connect to server. Please check if the backend is running.",
            };
        }

        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Network error occurred during GitHub callback",
        };
    }
};
