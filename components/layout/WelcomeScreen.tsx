"use client"

import type React from "react"
import {
    FileText,
    Upload,
    FolderOpen,
    Search,
    Sparkles,
    BookOpen,
    Brain,
    Zap,
    ArrowRight,
    Command,
    Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function WelcomeScreen() {
    const recentDocuments = [
        { name: "Research Paper.pdf", path: "/docs/research-paper.pdf", type: "pdf" },
        { name: "Literature Review.md", path: "/docs/literature-review.md", type: "md" },
        { name: "Data Analysis.doc", path: "/docs/data-analysis.doc", type: "doc" },
    ]

    const quickActions = [
        {
            icon: Upload,
            title: "Upload Document",
            description: "Upload PDF, DOC, or MD files",
            shortcut: "Cmd+U",
            color: "text-blue-400"
        },
        {
            icon: FolderOpen,
            title: "Open Folder",
            description: "Browse your document library",
            shortcut: "Cmd+O",
            color: "text-green-400"
        },
        {
            icon: Search,
            title: "Search Documents",
            description: "Find documents by content",
            shortcut: "Cmd+F",
            color: "text-purple-400"
        },
        {
            icon: Brain,
            title: "AI Assistant",
            description: "Start a research conversation",
            shortcut: "Cmd+K",
            color: "text-orange-400"
        }
    ]

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e]">
            <div className="flex-1 overflow-y-auto p-8">
                <div className="flex flex-col items-center justify-start min-h-full">
                    <div className="max-w-2xl w-full text-center">
                        {/* Welcome */}
                        <div className="mb-12 pt-16">
                            <h1 className="text-3xl font-bold text-white mb-2">Welcome to ScholarAI</h1>
                            <p className="text-[#cccccc] text-lg">
                                Your intelligent research companion for document analysis and insights
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {quickActions.map((action) => (
                                <Card
                                    key={action.title}
                                    className="p-4 bg-[#252526] border-[#3e3e42] hover:bg-[#2a2d2e] hover:border-[#007acc] transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <action.icon className={`h-6 w-6 ${action.color} group-hover:scale-110 transition-transform`} />
                                        <div className="flex-1 text-left">
                                            <h3 className="text-white font-medium">{action.title}</h3>
                                            <p className="text-[#cccccc] text-sm">{action.description}</p>
                                        </div>
                                        <div className="text-xs text-[#666] bg-[#3e3e42] px-2 py-1 rounded">
                                            {action.shortcut}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Recent Documents */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">Recent Documents</h2>
                                <Button variant="ghost" size="sm" className="text-[#cccccc] hover:text-white">
                                    View All
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {recentDocuments.map((doc) => (
                                    <div
                                        key={doc.name}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-[#252526] hover:bg-[#2a2d2e] cursor-pointer transition-colors group"
                                    >
                                        <FileText className="h-5 w-5 text-[#007acc]" />
                                        <div className="flex-1 text-left">
                                            <p className="text-white font-medium">{doc.name}</p>
                                            <p className="text-[#cccccc] text-sm">{doc.path}</p>
                                        </div>
                                        <div className="text-xs text-[#666] uppercase">
                                            {doc.type}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Getting Started */}
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-white mb-3">Getting Started</h3>
                            <div className="flex flex-wrap justify-center gap-2">
                                <Button variant="outline" size="sm" className="border-[#3e3e42] text-[#cccccc] hover:bg-[#3e3e42] hover:text-white">
                                    <BookOpen className="h-4 w-4 mr-1" />
                                    Documentation
                                </Button>
                                <Button variant="outline" size="sm" className="border-[#3e3e42] text-[#cccccc] hover:bg-[#3e3e42] hover:text-white">
                                    <Zap className="h-4 w-4 mr-1" />
                                    Tutorials
                                </Button>
                                <Button variant="outline" size="sm" className="border-[#3e3e42] text-[#cccccc] hover:bg-[#3e3e42] hover:text-white">
                                    <Command className="h-4 w-4 mr-1" />
                                    Keyboard Shortcuts
                                </Button>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="mt-8 mb-8 p-4 bg-[#252526] border border-[#3e3e42] rounded-lg">
                            <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-[#007acc] rounded-lg flex-shrink-0">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-white font-medium mb-1">Pro Tip</h4>
                                    <p className="text-[#cccccc] text-sm">
                                        Use <kbd className="px-1 py-0.5 bg-[#3e3e42] rounded text-xs">Cmd+K</kbd> to quickly access AI features,
                                        or drag and drop files directly into the editor to get started.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 