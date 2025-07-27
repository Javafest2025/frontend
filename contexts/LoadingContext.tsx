"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface LoadingContextType {
    isLoading: boolean
    isPageLoading: boolean
    message: string
    pageMessage: string
    showLoading: (message?: string) => void
    hideLoading: () => void
    showPageLoading: (message?: string) => void
    hidePageLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export const useLoading = () => {
    const context = useContext(LoadingContext)
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider')
    }
    return context
}

interface LoadingProviderProps {
    children: ReactNode
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [isPageLoading, setIsPageLoading] = useState(false)
    const [message, setMessage] = useState("Loading...")
    const [pageMessage, setPageMessage] = useState("Loading...")

    const showLoading = (customMessage = "Loading...") => {
        setMessage(customMessage)
        setIsLoading(true)
    }

    const hideLoading = () => {
        setIsLoading(false)
    }

    const showPageLoading = (customMessage = "Loading...") => {
        setPageMessage(customMessage)
        setIsPageLoading(true)
    }

    const hidePageLoading = () => {
        setIsPageLoading(false)
    }

    return (
        <LoadingContext.Provider value={{
            isLoading,
            isPageLoading,
            message,
            pageMessage,
            showLoading,
            hideLoading,
            showPageLoading,
            hidePageLoading
        }}>
            {children}
        </LoadingContext.Provider>
    )
} 