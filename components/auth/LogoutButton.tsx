'use client'

import { useState } from 'react'
import { logout } from '@/lib/api/user-service'
import { useAuth } from '@/hooks/useAuth'

interface LogoutButtonProps {
    className?: string
    children?: React.ReactNode
}

export const LogoutButton = ({ className = '', children }: LogoutButtonProps) => {
    const [isLoading, setIsLoading] = useState(false)
    const { clearAuth } = useAuth()

    const handleLogout = async () => {
        setIsLoading(true)
        try {
            await logout()
            clearAuth()
        } catch (error) {
            console.error('Logout error:', error)
            // Still clear auth data even if API call fails
            clearAuth()
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className={`flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {isLoading ? (
                <>
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    Logging out...
                </>
            ) : (
                children || 'Logout'
            )}
        </button>
    )
} 