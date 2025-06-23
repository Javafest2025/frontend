"use client"

import type React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import {
    MessageSquare,
    X,
    Plus,
    ChevronDown,
    FileText,
    File,
    Image,
    Code,
    Search,
    Settings,
    Command,
    Brain,
    Zap,
    BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"

type Props = {
    children: React.ReactNode
    onChatToggle: () => void
}

export function EditorArea({ children, onChatToggle }: Props) {
    const pathname = usePathname()

    // Get current page title based on route
    const getPageTitle = () => {
        if (pathname.includes('/home')) return 'Research Projects'
        if (pathname.includes('/projects/')) return 'Project Workspace'
        if (pathname.includes('/library')) return 'Paper Library'
        if (pathname.includes('/ai')) return 'AI Assistant'
        if (pathname.includes('/workflows')) return 'Workflows'
        if (pathname.includes('/search')) return 'Search'
        if (pathname.includes('/notifications')) return 'Notifications'
        if (pathname.includes('/settings')) return 'Settings'
        if (pathname.includes('/account')) return 'Account'
        return 'ScholarAI'
    }

    const getPageIcon = () => {
        if (pathname.includes('/home')) return <BookOpen className="h-4 w-4" />
        if (pathname.includes('/projects/')) return <Zap className="h-4 w-4" />
        if (pathname.includes('/library')) return <BookOpen className="h-4 w-4" />
        if (pathname.includes('/ai')) return <Brain className="h-4 w-4" />
        if (pathname.includes('/workflows')) return <Zap className="h-4 w-4" />
        if (pathname.includes('/search')) return <Search className="h-4 w-4" />
        if (pathname.includes('/notifications')) return <MessageSquare className="h-4 w-4" />
        if (pathname.includes('/settings')) return <Settings className="h-4 w-4" />
        if (pathname.includes('/account')) return <Settings className="h-4 w-4" />
        return <BookOpen className="h-4 w-4" />
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Top Header Bar */}
            <div className="flex items-center justify-between h-14 px-6 bg-background/60 backdrop-blur-xl border-b border-primary/10 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-foreground/80">
                        {getPageIcon()}
                        <h2 className="font-semibold text-lg">{getPageTitle()}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-foreground/70 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg"
                        onClick={() => {
                            // Quick search functionality
                            console.log("Quick search")
                        }}
                    >
                        <Search className="h-4 w-4 mr-2" />
                        <span className="text-sm">Search</span>
                        <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-primary/20 bg-primary/10 px-1.5 font-mono text-[10px] font-medium text-primary opacity-100">
                            ⌘K
                        </kbd>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-foreground/70 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg"
                        onClick={onChatToggle}
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        <span className="text-sm">AI Chat</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-foreground/70 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg"
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-y-auto">
                {children}
            </div>
        </div>
    )
} 