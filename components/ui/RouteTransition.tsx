"use client"

import { useRouter } from 'next/navigation'
import { useLoading } from '@/contexts/LoadingContext'
import { LoadingScreen, PageLoadingIndicator } from './LoadingScreen'

interface RouteTransitionProps {
    children: React.ReactNode
}

export const RouteTransition: React.FC<RouteTransitionProps> = ({ children }) => {
    const { isLoading, isPageLoading, message, pageMessage } = useLoading()

    return (
        <>
            {children}
            <LoadingScreen isVisible={isLoading} message={message} />
            <PageLoadingIndicator isVisible={isPageLoading} message={pageMessage} />
        </>
    )
}

// Hook for programmatic navigation with loading
export const useNavigationWithLoading = () => {
    const router = useRouter()
    const { showLoading, hideLoading, showPageLoading, hidePageLoading } = useLoading()

    const navigateWithLoading = (href: string, loadingMessage?: string) => {
        console.log("navigateWithLoading: Starting navigation to", href)
        const messages = {
            '/login': 'Preparing login interface...',
            '/signup': 'Initializing registration...',
            '/interface/home': 'Accessing neural network...',
            '/': 'Returning to base station...',
        }

        const defaultMessage = messages[href as keyof typeof messages] || loadingMessage || 'Navigating...'
        console.log("navigateWithLoading: Using message:", defaultMessage)

        showLoading(defaultMessage)

        // Add artificial delay for smooth UX (optional)
        setTimeout(() => {
            console.log("navigateWithLoading: Pushing route to", href)
            router.push(href)
            // Hide loading after navigation completes
            setTimeout(() => {
                console.log("navigateWithLoading: Hiding loading screen")
                hideLoading()
            }, 800) // Small delay to ensure page loads
        }, 600) // Short delay for loading animation to show
    }

    const navigateWithPageLoading = (href: string, loadingMessage?: string) => {
        console.log("navigateWithPageLoading: Starting navigation to", href)

        const defaultMessage = loadingMessage || 'Loading...'
        showPageLoading(defaultMessage)

        // Add a small delay to ensure the loading indicator shows
        setTimeout(() => {
            router.push(href)
            // Hide loading after navigation completes
            setTimeout(() => {
                hidePageLoading()
            }, 500)
        }, 100)
    }

    return {
        navigateWithLoading,
        navigateWithPageLoading,
        showLoading,
        hideLoading,
        showPageLoading,
        hidePageLoading
    }
} 