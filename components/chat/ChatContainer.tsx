"use client"

import { useState, useRef, useEffect } from "react"
import { ChatComposer } from "./ChatComposer"
import { ChatMessage } from "./ChatMessage"
import { Button } from "@/components/ui/button"
import { Plus, Cloud, Clock, MoreHorizontal, X, Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { Message } from "@/types/chat"
import { chatWithPaper, checkPaperChatReadiness, extractPaperForChat } from "@/lib/api/chat"

type ChatContainerProps = {
    /**
     * Optional callback invoked when the user clicks the close (X) button.
     * This allows parent components (e.g. PDF viewer drawers) to control
     * the visibility of the chat interface.
     */
    onClose?: () => void
    externalContexts?: string[]
    onExternalContextsCleared?: () => void
    paperId?: string
    // Extraction status from parent (PDF viewer)
    isExtracted?: boolean
    isExtracting?: boolean
    extractionStatus?: string | null
    extractionError?: string | null
}

export function ChatContainer({ 
    onClose, 
    externalContexts = [], 
    onExternalContextsCleared, 
    paperId,
    isExtracted = false,
    isExtracting = false,
    extractionStatus = null,
    extractionError = null
}: ChatContainerProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [chatName, setChatName] = useState("New Chat")
    const [isEditingName, setIsEditingName] = useState(false)
    const [showSidebar, setShowSidebar] = useState(false)
    const [chatHistory, setChatHistory] = useState<{ name: string; time: string }[]>([
        { name: "Add state variables in ChatComposer", time: "1m" },
        { name: "Design chatbot input interface", time: "14m" },
        { name: "Decrease header section size", time: "28m" }
    ])
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // New state for chat readiness - use props from parent (PDF viewer)
    const isChatReady = isExtracted
    const currentlyExtracting = isExtracting
    const currentExtractionError = extractionError

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Add a welcome message when chat becomes ready
    useEffect(() => {
        if (isChatReady && messages.length === 0) {
            const welcomeMessage: Message = {
                id: "welcome",
                role: "assistant",
                content: "🎉 **Paper successfully extracted and ready for chat!**\n\nI've analyzed the content of this research paper and I'm ready to answer your questions. You can ask me about:\n\n• Key findings and conclusions\n• Methodology and experimental design\n• Related work and citations\n• Specific sections or concepts\n• Comparisons with other research\n\nWhat would you like to know about this paper?"
            }
            setMessages([welcomeMessage])
        }
    }, [isChatReady, messages.length])

    const handleSend = async (message: string, context?: string[]) => {
        // Don't allow sending if chat is not ready
        if (!isChatReady) {
            return
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: message,
            context
        }

        setMessages((prev) => [...prev, userMessage])
        setIsLoading(true)

        try {
            if (!paperId) {
                throw new Error("Paper ID is required for chat")
            }

            const response = await chatWithPaper(paperId, message)

            const aiMessage: Message = {
                id: response.sessionId || Date.now().toString(),
                role: "assistant",
                content: response.response || "No response received",
                timestamp: response.timestamp ? new Date(response.timestamp) : new Date()
            }

            setMessages((prev) => [...prev, aiMessage])
        } catch (error) {
            console.error("Chat error:", error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I encountered an error while processing your request. Please try again."
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex h-full bg-background">
            {/* Sidebar */}
            <div
                className={cn(
                    "flex flex-col transition-all duration-300 ease-in-out",
                    showSidebar ? "w-64 border-r border-border" : "w-0 overflow-hidden"
                )}
            >
                {showSidebar && (
                    <>
                        {/* New Chat Button */}
                        <div className="p-3 border-b border-border">
                            <Button
                                variant="secondary"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                    setMessages([])
                                    setChatName("New Chat")
                                }}
                            >
                                <Plus className="h-4 w-4" />
                                New Chat
                            </Button>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Past Chats</h3>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                                        View All
                                    </Button>
                                </div>
                                <div className="space-y-1">
                                    {chatHistory.map((chat, index) => (
                                        <button
                                            key={index}
                                            className="w-full text-left px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm truncate flex-1">{chat.name}</span>
                                                <span className="text-xs text-muted-foreground">{chat.time}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="h-12 border-b border-border flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        {isEditingName ? (
                            <input
                                type="text"
                                value={chatName}
                                onChange={(e) => setChatName(e.target.value)}
                                onBlur={() => setIsEditingName(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                                className="bg-transparent border-none outline-none text-sm font-medium"
                                autoFocus
                            />
                        ) : (
                            <h2
                                className="text-sm font-medium cursor-text"
                                onClick={() => setIsEditingName(true)}
                            >
                                {chatName}
                            </h2>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Cloud className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8", showSidebar && "bg-secondary/50")}
                            onClick={() => setShowSidebar((prev) => !prev)}
                        >
                            <Clock className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onClose?.()}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto">
                        {/* Show extraction status when not ready */}
                        {!isChatReady && (
                            <div className="mt-8 px-4">
                                {currentlyExtracting ? (
                                    <div className="text-center py-8">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <div className="text-lg font-medium">Getting chatbot ready...</div>
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-4">
                                            {extractionStatus || "Extracting paper content for AI analysis"}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2">
                                            This may take up to 60 seconds
                                        </div>
                                    </div>
                                ) : currentExtractionError ? (
                                    <div className="text-center py-8">
                                        <div className="text-red-500 mb-4">
                                            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                                            <div className="text-sm">{currentExtractionError}</div>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2">
                                            Please try refreshing the page to retry extraction
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            <div className="text-sm text-muted-foreground">Checking paper readiness...</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show chat interface when ready */}
                        {isChatReady && (
                            <>
                                {messages.length === 0 ? (
                                    <div className="mt-8 px-4">
                                        <ChatComposer onSend={handleSend} isLoading={isLoading} externalContexts={externalContexts} onExternalContextsCleared={onExternalContextsCleared} disabled={!isChatReady} />
                                    </div>
                                ) : (
                                    <>
                                        <div className="px-4 pb-4">
                                            {messages.map((message) => (
                                                <ChatMessage key={message.id} message={message} />
                                            ))}
                                            {isLoading && (
                                                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                                                    <div className="flex gap-1">
                                                        <span className="animate-bounce">●</span>
                                                        <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                                                        <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                                                    </div>
                                                    <span>Assistant is thinking...</span>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Input at bottom when there are messages */}
                                        <div className="sticky bottom-0 bg-background border-t border-border">
                                            <div className="max-w-3xl mx-auto p-4">
                                                <ChatComposer onSend={handleSend} isLoading={isLoading} externalContexts={externalContexts} onExternalContextsCleared={onExternalContextsCleared} disabled={!isChatReady} />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}