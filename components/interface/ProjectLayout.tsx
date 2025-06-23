"use client"

import React, { useState } from "react"
import { ProjectSidebar } from "./ProjectSidebar"
import { ChatPanel } from "@/components/layout/ChatPanel"
import { StatusBar } from "@/components/layout/StatusBar"
import { cn } from "@/lib/utils/cn"

type Props = {
    children: React.ReactNode
    projectId: string
}

export function ProjectLayout({ children, projectId }: Props) {
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Project-specific Sidebar */}
            <ProjectSidebar
                projectId={projectId}
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col min-w-0">
                {/* Main Content */}
                <div className="flex-1 overflow-hidden">
                    {children}
                </div>

                {/* Status Bar */}
                <StatusBar />
            </div>

            {/* Chat Panel */}
            <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
    )
} 