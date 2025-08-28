"use client"

import type React from "react"

type Props = {
    children: React.ReactNode
    onChatToggle: () => void
    onSidebarToggle?: () => void
    showMobileMenu?: boolean
}

export function EditorArea({ children, onChatToggle, onSidebarToggle, showMobileMenu }: Props) {
    return (
        <div className="flex flex-col h-full relative">
            {/* Main Content Area */}
            <div className="flex-1 relative overflow-y-auto custom-scrollbar">
                {children}
            </div>
        </div>
    )
} 