export interface LoginFormData {
    email: string
    password: string
    rememberMe: boolean
}

export interface SignupFormData {
    email: string
    password: string
    confirmPassword: string
    agreeToTerms: boolean
}

export interface User {
    id: string
    email: string
    roles?: string[]
    [key: string]: any
}

export interface AuthResponse {
    success: boolean
    message?: string
    token?: string
    user?: User
    data?: {
        apiToken?: string
        [key: string]: any
    }
}

export interface LoginResponse extends AuthResponse {
    requiresEmailVerification?: boolean
    email?: string
}

export interface SignupResponse extends AuthResponse {
    requiresVerification?: boolean
}

export interface AuthState {
    isAuthenticated: boolean
    user: User | null
    token: string | null
    loading: boolean
} 