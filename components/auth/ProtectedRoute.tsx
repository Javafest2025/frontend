'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
    children: React.ReactNode
    redirectTo?: string
}

export const ProtectedRoute = ({ children, redirectTo = '/login' }: ProtectedRouteProps) => {
    const { isAuthenticated, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        console.log("ProtectedRoute: Auth state check", { loading, isAuthenticated, redirectTo })
        if (!loading && !isAuthenticated) {
            console.log("ProtectedRoute: Redirecting to", redirectTo)
            router.push(redirectTo)
        }
    }, [isAuthenticated, loading, router, redirectTo])

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    <p className="text-white/70 font-['Segoe_UI']">Loading...</p>
                </div>
            </div>
        )
    }

    // Don't render children if not authenticated
    if (!isAuthenticated) {
        return null
    }

    return <>{children}</>
} 