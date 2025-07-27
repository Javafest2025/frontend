import { getApiUrl } from "@/lib/config/api-config";

// Authentication utility functions
export const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("scholarai_token");
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
        // Note: Refresh token is stored in HttpOnly cookies, managed by backend
    }
};

export const isAuthenticated = (): boolean => {
    return !!getAuthToken();
};

export const refreshAccessToken = async (): Promise<string | null> => {
    try {
        // Get user data to retrieve email for refresh request
        const userData = getUserData();
        if (!userData?.email) {
            console.warn("No user email found for refresh token request");
            clearAuthData();
            return null;
        }

        const response = await fetch(getApiUrl("/api/v1/auth/refresh"), {
            method: "POST",
            credentials: "include", // This sends the HttpOnly refresh token cookie
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: userData.email,
                // refreshToken omitted - backend should use HttpOnly cookie
            }),
        });

        const data = await response.json();

        if (response.ok && data.data?.accessToken) {
            localStorage.setItem("scholarai_token", data.data.accessToken);
            console.log("✅ Access token refreshed successfully");
            return data.data.accessToken;
        } else {
            console.warn(
                "Refresh token invalid or expired:",
                data.message || "Unknown error"
            );
            clearAuthData();
            return null;
        }
    } catch (error) {
        console.error("Token refresh failed:", error);
        clearAuthData();
        return null;
    }
};

// API request helper with authentication
export const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
) => {
    let token = getAuthToken();
    let headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        console.log("Access token expired, refreshing...");
        // Try to refresh token
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
            const retryHeaders = {
                ...headers,
                Authorization: `Bearer ${newAccessToken}`,
            };

            return fetch(url, {
                ...options,
                headers: retryHeaders,
            });
        }
    }

    return response;
};

export const login = async (formData: {
    email: string;
    password: string;
    rememberMe: boolean;
}) => {
    try {
        if (!formData.email || !formData.password) {
            throw new Error("Email and password are required");
        }

        const response = await fetch(getApiUrl("/api/v1/auth/login"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                email: formData.email.trim(),
                password: formData.password.trim(),
            }),
            credentials: "include", // Include cookies for refresh token
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
            console.log("response:", data);
        }

        const token = data.data?.accessToken;
        const user = {
            id: data.data?.userId,
            email: data.data?.email,
            roles: data.data?.roles,
        };

        if (!token) {
            throw new Error("No access token received");
        }

        return {
            success: true,
            token: token,
            user: user,
            message: data.message,
        };
    } catch (error) {
        console.error("Login API error:", error);

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
                error instanceof Error ? error.message : "Network error occurred",
        };
    }
};

export const signup = async (formData: {
    email: string;
    password: string;
    confirmPassword: string;
    agreeToTerms: boolean;
}) => {
    try {
        const response = await fetch(getApiUrl("/api/v1/auth/register"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                email: formData.email,
                password: formData.password,
            }),
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

        return {
            success: true,
            message: data.message || "Registration successful",
        };
    } catch (error) {
        console.error("Signup API error:", error);

        // Handle network errors
        if (error instanceof TypeError && error.message.includes("fetch")) {
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
        await fetch(getApiUrl("/api/v1/auth/logout"), {
            method: "POST",
            credentials: "include", // include the refresh token cookie
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
    const res = await fetch(getApiUrl("/api/v1/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }),
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
    const res = await fetch(getApiUrl("/api/v1/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email, code, newPassword }),
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
            getApiUrl("/api/v1/auth/social/google-login"),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include", // Include cookies for refresh token
                body: JSON.stringify({ idToken }),
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
            getApiUrl("/api/v1/auth/social/github-login"),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include", // Include cookies for refresh token
                body: JSON.stringify({ code }),
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