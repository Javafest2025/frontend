'use client'

import { useState, useEffect } from 'react'
import { getAuthToken, getUserData, isAuthenticated, clearAuthData, refreshAccessToken } from '@/lib/api/user-service'

export interface User {
    id: string
    email: string
    roles?: string[]
    [key: string]: any
}

export interface AuthState {
    isAuthenticated: boolean
    user: User | null
    token: string | null
    loading: boolean
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: true
    })

    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log('Checking auth state in useAuth hook...')
                let token = getAuthToken()
                let user = getUserData()
                let authenticated = isAuthenticated()

                // If no access token but we might have a refresh token, try to refresh
                if (!authenticated && typeof window !== "undefined") {
                    // Check if there's a refresh token cookie (HttpOnly cookie)
                    const hasRefreshTokenCookie = document.cookie.includes("refreshToken=")

                    if (hasRefreshTokenCookie) {
                        console.log("🔄 No access token found, but refresh token cookie available. Attempting to refresh...")
                        try {
                            const newToken = await refreshAccessToken()
                            if (newToken) {
                                console.log("✅ Token refreshed successfully in useAuth hook")
                                token = newToken
                                user = getUserData() // Re-fetch user data
                                authenticated = true
                            } else {
                                console.log("❌ Token refresh failed in useAuth hook")
                            }
                        } catch (refreshError) {
                            console.error("Error refreshing token in useAuth hook:", refreshError)
                        }
                    }
                }

                setAuthState({
                    isAuthenticated: authenticated,
                    user: user,
                    token: token,
                    loading: false
                })
            } catch (error) {
                console.error('Error checking auth state:', error)
                setAuthState({
                    isAuthenticated: false,
                    user: null,
                    token: null,
                    loading: false
                })
            }
        }

        checkAuth()

        // Listen for storage changes (e.g., login/logout in another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'scholarai_token' || e.key === 'scholarai_user') {
                checkAuth()
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    const updateAuthState = (token: string, user: User) => {
        console.log("useAuth: Updating auth state with:", { token: token ? "present" : "missing", user })
        setAuthState({
            isAuthenticated: true,
            user,
            token,
            loading: false
        })
        console.log("useAuth: Auth state updated successfully")
    }

    const clearAuth = () => {
        clearAuthData()
        setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false
        })
    }

    return {
        ...authState,
        updateAuthState,
        clearAuth
    }
} 