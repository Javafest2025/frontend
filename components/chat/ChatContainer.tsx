"use client"

import { useState, useRef, useEffect } from "react"
import { ChatComposer } from "./ChatComposer"
import { ChatMessage } from "./ChatMessage"
import { Button } from "@/components/ui/button"
import { Plus, Cloud, Clock, MoreHorizontal, X, Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { Message } from "@/types/chat"
import {
    createChatSession,
    continueChatSession,
    getChatSessions,
    getChatSessionHistory,
    type ChatSession
} from "@/lib/api/chat"
import { getStructuredFacts } from "@/lib/api/paper-extraction"
import { 
    triggerExtraction, 
    triggerExtractionForPaper,
    getExtractionStatus, 
    isPaperExtracted,
    getExtractionStatusOnly,
    getExtractedFigures,
    getExtractedTables,
    type ExtractionRequest 
} from "@/lib/api/project-service/extraction"

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
}

export function ChatContainer({ onClose, externalContexts = [], onExternalContextsCleared, paperId }: ChatContainerProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [chatName, setChatName] = useState("New Chat")
    const [isEditingName, setIsEditingName] = useState(false)
    const [showSidebar, setShowSidebar] = useState(false)

    // Session-based chat state
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
    const [isLoadingSessions, setIsLoadingSessions] = useState(false)
    const [isLoadingSession, setIsLoadingSession] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    // New state for chat readiness
    const [isChatReady, setIsChatReady] = useState<boolean | null>(null)
    const [isExtracting, setIsExtracting] = useState(false)
    const [extractionError, setExtractionError] = useState<string | null>(null)
    const [paperInfo, setPaperInfo] = useState<any>(null)
    const [hasInitialMessage, setHasInitialMessage] = useState(false)
    
    // Enhanced extraction state
    const [extractionProgress, setExtractionProgress] = useState(0)
    const [extractionStage, setExtractionStage] = useState<string>("")
    const [extractedFiguresCount, setExtractedFiguresCount] = useState(0)
    const [extractedTablesCount, setExtractedTablesCount] = useState(0)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Check chat readiness when paperId changes
    useEffect(() => {
        if (paperId) {
            checkChatReadiness()
            loadChatSessions()
        }
    }, [paperId])

    const loadChatSessions = async () => {
        if (!paperId) return

        try {
            setIsLoadingSessions(true)
            const sessions = await getChatSessions(paperId)

            // Sort sessions: latest first, invalid ones at the end
            const sortedSessions = sessions.sort((a, b) => {
                // Check if sessions have valid dates
                const aHasValidDate = a.lastMessageAt && a.lastMessageAt !== "Invalid Date"
                const bHasValidDate = b.lastMessageAt && b.lastMessageAt !== "Invalid Date"

                // Invalid sessions go to the end
                if (!aHasValidDate && bHasValidDate) return 1
                if (aHasValidDate && !bHasValidDate) return -1
                if (!aHasValidDate && !bHasValidDate) return 0

                // For valid sessions, sort by lastMessageAt (latest first)
                const aTime = new Date(a.lastMessageAt).getTime()
                const bTime = new Date(b.lastMessageAt).getTime()

                // If lastMessageAt is invalid, fall back to createdAt
                const aFallback = isNaN(aTime) ? new Date(a.createdAt).getTime() : aTime
                const bFallback = isNaN(bTime) ? new Date(b.createdAt).getTime() : bTime

                return bFallback - aFallback // Latest first (descending order)
            })

            setChatSessions(sortedSessions)
        } catch (error) {
            console.error("Failed to load chat sessions:", error)
        } finally {
            setIsLoadingSessions(false)
        }
    }

    const loadChatSession = async (sessionId: string) => {
        if (!paperId) return

        try {
            setIsLoadingSession(true)
            const sessionHistory = await getChatSessionHistory(paperId, sessionId)

            // Convert to Message format
            const convertedMessages: Message[] = sessionHistory.messages.map(msg => ({
                id: msg.id,
                role: msg.role.toLowerCase() as "user" | "assistant",
                content: msg.content,
                timestamp: new Date(msg.timestamp)
            }))

            setMessages(convertedMessages)
            setCurrentSessionId(sessionId)
            setChatName(sessionHistory.title)
            setHasInitialMessage(true) // Prevent initial message when loading existing session

        } catch (error) {
            console.error("Failed to load chat session:", error)
        } finally {
            setIsLoadingSession(false)
        }
    }

    const loadPaperInfo = async () => {
        if (!paperId) return

        try {
            console.log("📄 Loading paper info for paperId:", paperId)
            const paperData = await getStructuredFacts(paperId)
            console.log("📊 Paper data received:", paperData)
            setPaperInfo(paperData)

            // Create initial welcome message for new chats
            console.log("🔍 Checking welcome message conditions:", {
                currentSessionId,
                messagesLength: messages.length,
                hasInitialMessage
            })

            // More lenient conditions - create welcome message if no session and no initial message yet
            if (!currentSessionId && !hasInitialMessage) {
                console.log("✨ Creating welcome message...")
                const welcomeMessage: Message = {
                    id: "welcome-" + Date.now(),
                    role: "assistant",
                    content: generateWelcomeMessage(paperData),
                    timestamp: new Date()
                }
                console.log("💬 Welcome message created:", welcomeMessage.content.substring(0, 100) + "...")
                setMessages([welcomeMessage])
                setHasInitialMessage(true)
            } else {
                console.log("❌ Welcome message conditions not met")
            }
        } catch (error) {
            console.error("Failed to load paper info:", error)
            // Even if paper info fails, show a basic welcome message
            if (!currentSessionId && !hasInitialMessage) {
                const welcomeMessage: Message = {
                    id: "welcome-" + Date.now(),
                    role: "assistant",
                    content: generateWelcomeMessage(null),
                    timestamp: new Date()
                }
                setMessages([welcomeMessage])
                setHasInitialMessage(true)
            }
        }
    }

    const generateWelcomeMessage = (paperData: any) => {
        // Use the format requested by the user (removed abstract)
        let message = "🎓 **Paper Analysis Complete!**\n\n"

        // Handle both paperData.title and paperData.data.title structures
        const title = paperData?.title || paperData?.data?.title;
        if (title && title !== "Extracted Paper" && title !== "Unknown Paper" && title !== "Error Loading Paper") {
            message += `📄 **Title:** ${title}\n\n`
        } else {
            message += `📄 **Title:** Unable to load paper title\n\n`
        }

        // Handle both paperData.authors and paperData.data.authors structures  
        const authors = paperData?.authors || paperData?.data?.authors;
        if (authors && authors.length > 0) {
            const authorNames = authors.map((author: any) =>
                typeof author === 'string' ? author : (author.name || author)
            ).join(", ")
            message += `👥 **Authors:** ${authorNames}\n\n`
        } else {
            message += `👥 **Authors:** Unable to load author information\n\n`
        }

        message += "🤖 **I can help you with:**\n"
        message += "• Understanding the methodology and approach\n"
        message += "• Explaining key findings and results\n"
        message += "• Analyzing figures, tables, and data\n"
        message += "• Comparing with related work\n"
        message += "• Answering specific questions about any section\n\n"
        message += "💬 **What would you like to explore first?**"

        console.log("📝 Generated welcome message:", message)
        return message
    }

    const startNewChat = async () => {
        console.log("🔄 Starting new chat... paperId:", paperId)
        if (!paperId) {
            console.warn("❌ No paperId available for new chat")
            return
        }

        try {
            console.log("✅ Creating new chat session")
            // Clear current chat state
            setMessages([])
            setChatName("New Chat")
            setCurrentSessionId(null)
            setIsEditingName(false)
            setHasInitialMessage(false)

            // Load paper info and create welcome message immediately
            console.log("📄 Loading paper info for welcome message...")
            await loadPaperInfo()

            console.log("✅ New chat state cleared successfully")
        } catch (error) {
            console.error("❌ Failed to start new chat:", error)
        }
    }

    const checkChatReadiness = async () => {
        if (!paperId) return

        try {
            setIsChatReady(null)
            setExtractionError(null)

            console.log("🔍 Checking chat readiness for paperId:", paperId)
            
            // First check if paper is already extracted using the detailed API
            const isExtracted = await isPaperExtracted(paperId)
            
            if (isExtracted) {
                console.log("✅ Paper is already extracted, chat is ready")
                setIsChatReady(true)
                // Load initial welcome message if no messages and no current session
                if (messages.length === 0 && !currentSessionId && !hasInitialMessage) {
                    console.log("📝 Loading welcome message...")
                    await loadPaperInfo()
                }
            } else {
                // Check if extraction is already in progress
                try {
                    const extractionStatus = await getExtractionStatusOnly(paperId)
                    console.log("📊 Current extraction status:", extractionStatus)
                    
                    if (extractionStatus === 'PROCESSING' || extractionStatus === 'PENDING') {
                        console.log("🔄 Extraction already in progress")
                        setIsExtracting(true)
                        setIsChatReady(false)
                        // Start monitoring the existing extraction
                        setTimeout(async () => {
                            await checkChatReadiness()
                        }, 5000)
                    } else {
                        console.log("⚠️ Paper needs extraction")
                        setIsChatReady(false)
                        // Start extraction process
                        await startExtraction()
                    }
                } catch (statusError) {
                    console.warn("Could not get extraction status, starting extraction")
                    setIsChatReady(false)
                    await startExtraction()
                }
            }
        } catch (error) {
            console.error("Error checking if paper is extracted:", error)
            setExtractionError("Failed to check if paper is ready for chat")
        }
    }

    const startExtraction = async () => {
        if (!paperId) return

        try {
            setIsExtracting(true)
            setExtractionError(null)

            // Use more comprehensive extraction with detailed options
            const extractionRequest: ExtractionRequest = {
                paperId,
                extractText: true,
                extractFigures: true,
                extractTables: true,
                extractEquations: true,
                extractReferences: true,
                useOcr: true,
                detectEntities: true,
                asyncProcessing: true
            }

            // Start extraction with detailed monitoring
            const extractionResponse = await triggerExtraction(extractionRequest)
            console.log("🔄 Extraction started:", extractionResponse)

            // Monitor extraction progress
            const monitorExtraction = async () => {
                try {
                    const status = await getExtractionStatus(paperId)
                    console.log("📊 Extraction status:", status)
                    
                    // Update progress and stage
                    if (status.progress !== undefined) {
                        setExtractionProgress(status.progress)
                    }
                    
                    // Set extraction stage based on status
                    setExtractionStage(status.status || "Processing...")
                    
                    if (status.status === 'COMPLETED') {
                        setIsExtracting(false)
                        setIsChatReady(true)
                        setExtractionProgress(100)
                        setExtractionStage("Completed")
                        
                        // Get extracted figures and tables count
                        try {
                            const [figures, tables] = await Promise.all([
                                getExtractedFigures(paperId),
                                getExtractedTables(paperId)
                            ])
                            setExtractedFiguresCount(figures.length)
                            setExtractedTablesCount(tables.length)
                            console.log(`✅ Extraction completed: ${figures.length} figures, ${tables.length} tables`)
                        } catch (figureTableError) {
                            console.warn("Could not get figures/tables count:", figureTableError)
                        }
                        
                        console.log("✅ Extraction completed successfully")
                        
                        // For new chats (no current session), always create welcome message
                        if (!currentSessionId) {
                            console.log("🎉 Creating welcome message for new chat after extraction")
                            await loadPaperInfo() // This will create the welcome message
                        }
                    } else if (status.status === 'FAILED' || status.error) {
                        setExtractionError(status.error || "Extraction failed")
                        setIsExtracting(false)
                        setExtractionStage("Failed")
                    } else {
                        // Continue monitoring if still in progress
                        setTimeout(monitorExtraction, 3000) // Check every 3 seconds
                    }
                } catch (error) {
                    console.error("Error monitoring extraction:", error)
                    // Fallback to simple check
                    setTimeout(async () => {
                        try {
                            const isExtracted = await isPaperExtracted(paperId)
                            if (isExtracted) {
                                setIsExtracting(false)
                                setIsChatReady(true)
                                await loadPaperInfo()
                            } else {
                                setTimeout(monitorExtraction, 5000)
                            }
                        } catch (fallbackError) {
                            console.error("Fallback extraction check failed:", fallbackError)
                            setExtractionError("Failed to monitor extraction progress")
                            setIsExtracting(false)
                        }
                    }, 5000)
                }
            }

            // Start monitoring
            setTimeout(monitorExtraction, 2000) // Initial delay

        } catch (error) {
            console.error("Error starting extraction:", error)
            setExtractionError(`Failed to start paper extraction: ${error instanceof Error ? error.message : 'Unknown error'}`)
            setIsExtracting(false)
        }
    }

    const pollExtractionStatus = async () => {
        if (!paperId) return

        const pollInterval = 2000 // Poll every 2 seconds
        const maxPolls = 30 // Maximum 30 polls (60 seconds total)
        let pollCount = 0

        const poll = async () => {
            try {
                pollCount++
                console.log(`🔍 Polling extraction status (${pollCount}/${maxPolls}) for paper:`, paperId)

                const status = await getExtractionStatus(paperId)
                console.log("📊 Extraction status:", status)

                if (status.status === "COMPLETED" || status.status === "SUCCESS") {
                    console.log("✅ Extraction completed successfully!")
                    setIsExtracting(false)
                    setIsChatReady(true)

                    // Load initial welcome message if no messages and no current session
                    if (messages.length === 0 && !currentSessionId && !hasInitialMessage) {
                        console.log("📝 Loading welcome message after extraction...")
                        await loadPaperInfo()
                    }
                    return
                } else if (status.status === "FAILED" || status.status === "ERROR") {
                    console.error("❌ Extraction failed:", status.error)
                    setExtractionError(status.error || "Extraction failed. Please try again.")
                    setIsExtracting(false)
                    return
                } else if (pollCount >= maxPolls) {
                    console.warn("⏰ Extraction polling timeout")
                    setExtractionError("Extraction is taking longer than expected. Please try again later.")
                    setIsExtracting(false)
                    return
                }

                // Continue polling
                setTimeout(poll, pollInterval)
            } catch (error) {
                console.error("Error polling extraction status:", error)
                if (pollCount >= maxPolls) {
                    setExtractionError("Failed to check extraction status. Please try again.")
                    setIsExtracting(false)
                } else {
                    // Retry polling on error
                    setTimeout(poll, pollInterval)
                }
            }
        }

        // Start polling
        poll()
    }

    const handleSend = async (message: string, context?: string[]) => {
        // Don't allow sending if chat is not ready
        if (!isChatReady || !paperId) {
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
            let response

            if (currentSessionId) {
                // Continue existing session
                response = await continueChatSession(
                    paperId,
                    currentSessionId,
                    message,
                    externalContexts.join('\n') || undefined
                )
            } else {
                // Create new session with first message
                response = await createChatSession(
                    paperId,
                    message,
                    undefined, // Let AI generate title
                    externalContexts.join('\n') || undefined
                )

                // Set the session ID and update chat name with AI-generated title
                setCurrentSessionId(response.sessionId)

                // Update chat name in real-time with AI-generated title
                if (response.title && response.title.trim() !== '') {
                    setChatName(response.title)
                    console.log("✨ Updated chat title to:", response.title)
                }

                if (messages.length === 0) {
                    // This is the first message, reload sessions to get updated title in sidebar
                    setTimeout(() => loadChatSessions(), 1000)
                }
            }

            const aiMessage: Message = {
                id: response.sessionId || (Date.now() + 1).toString(),
                role: "assistant",
                content: response.response || "No response received",
                timestamp: response.timestamp ? new Date(response.timestamp) : new Date()
            }

            setMessages((prev) => [...prev, aiMessage])

            // Clear external contexts after use
            if (externalContexts.length > 0) {
                onExternalContextsCleared?.()
            }

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
                        {/* Sidebar Header with Close Button */}
                        <div className="p-3 border-b border-border flex items-center justify-between">
                            <h3 className="text-sm font-medium">Chat Sessions</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setShowSidebar(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* New Chat Button */}
                        <div className="p-3 border-b border-border">
                            <Button
                                variant="secondary"
                                className="w-full justify-start gap-2"
                                onClick={startNewChat}
                                disabled={isLoadingSessions}
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
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={loadChatSessions}
                                        disabled={isLoadingSessions}
                                    >
                                        Refresh
                                    </Button>
                                </div>
                                <div className="space-y-1">
                                    {isLoadingSessions ? (
                                        <div className="text-center py-4">
                                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                        </div>
                                    ) : chatSessions.length > 0 ? (
                                        chatSessions.map((session) => (
                                            <button
                                                key={session.sessionId}
                                                className={cn(
                                                    "w-full text-left px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors group",
                                                    currentSessionId === session.sessionId && "bg-secondary"
                                                )}
                                                onClick={() => loadChatSession(session.sessionId)}
                                                disabled={isLoadingSession}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm truncate flex-1">{session.title}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(session.lastMessageAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {session.lastMessagePreview && (
                                                    <div className="text-xs text-muted-foreground truncate mt-1">
                                                        {session.lastMessagePreview}
                                                    </div>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-sm text-muted-foreground">
                                            No chat history yet
                                        </div>
                                    )}
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
                                placeholder="Enter chat name"
                                title="Chat session name"
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
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={startNewChat}
                            disabled={isLoadingSessions}
                            title="Start new chat"
                        >
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
                                {isExtracting ? (
                                    <div className="text-center py-8">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <div className="text-lg font-medium">Getting chatbot ready...</div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Extracting paper content for AI analysis
                                        </div>
                                    </div>
                                ) : extractionError ? (
                                    <div className="text-center py-8">
                                        <div className="text-red-500 mb-4">
                                            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                                            <div className="text-sm">{extractionError}</div>
                                        </div>
                                        <Button onClick={startExtraction} variant="outline">
                                            Try Again
                                        </Button>
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
                                                        <span className="animate-bounce [animation-delay:100ms]">●</span>
                                                        <span className="animate-bounce [animation-delay:200ms]">●</span>
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