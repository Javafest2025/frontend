"use client"

import { useRouter } from 'next/navigation'
import { useLoading } from '@/contexts/LoadingContext'
import { LoadingScreen } from './LoadingScreen'

interface RouteTransitionProps {
    children: React.ReactNode
}

export const RouteTransition: React.FC<RouteTransitionProps> = ({ children }) => {
    const { isLoading, message } = useLoading()

    return (
        <>
            {children}
            <LoadingScreen isVisible={isLoading} message={message} />
        </>
    )
}

// Hook for programmatic navigation with loading
export const useNavigationWithLoading = () => {
    const router = useRouter()
    const { showLoading, hideLoading } = useLoading()

    const navigateWithLoading = (href: string, loadingMessage?: string) => {
        const messages = {
            '/login': 'Preparing login interface...',
            '/signup': 'Initializing registration...',
            '/interface/home': 'Accessing neural network...',
            '/': 'Returning to base station...',
        }

        const defaultMessage = messages[href as keyof typeof messages] || loadingMessage || 'Navigating...'

        showLoading(defaultMessage)

        // Add artificial delay for smooth UX (optional)
        setTimeout(() => {
            router.push(href)
            // Hide loading after navigation completes
            setTimeout(() => {
                hideLoading()
            }, 800) // Small delay to ensure page loads
        }, 600) // Short delay for loading animation to show
    }

    return { navigateWithLoading, showLoading, hideLoading }
} 