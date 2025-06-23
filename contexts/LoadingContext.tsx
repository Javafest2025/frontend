"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface LoadingContextType {
    isLoading: boolean
    message: string
    showLoading: (message?: string) => void
    hideLoading: () => void
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
    const [message, setMessage] = useState("Loading...")

    const showLoading = (customMessage = "Loading...") => {
        setMessage(customMessage)
        setIsLoading(true)
    }

    const hideLoading = () => {
        setIsLoading(false)
    }

    return (
        <LoadingContext.Provider value={{ isLoading, message, showLoading, hideLoading }}>
            {children}
        </LoadingContext.Provider>
    )
} 