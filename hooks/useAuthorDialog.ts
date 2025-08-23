"use client"

import { useState } from "react"

export function useAuthorDialog() {
    const [authorName, setAuthorName] = useState<string>("")
    const [isOpen, setIsOpen] = useState(false)

    const openAuthorDialog = (name: string) => {
        setAuthorName(name)
        setIsOpen(true)
    }

    const closeAuthorDialog = () => {
        setIsOpen(false)
        // Keep the authorName until dialog is fully closed to prevent flash
        setTimeout(() => setAuthorName(""), 150)
    }

    return {
        authorName,
        isOpen,
        openAuthorDialog,
        closeAuthorDialog,
        setIsOpen
    }
}
